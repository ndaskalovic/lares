// @ts-check
// One Anthropic-format Messages client for both Anthropic and DeepSeek (its /anthropic endpoint).

export const PROVIDERS = {
  anthropic: {
    label: 'Anthropic',
    base: 'https://api.anthropic.com',
    models: ['claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-opus-5-5'],
    topCache: true,
  },
  deepseek: {
    label: 'DeepSeek',
    base: 'https://api.deepseek.com/anthropic',
    models: ['deepseek-v4-pro', 'deepseek-flash'],
    topCache: false,
  },
};

/** Reasoning effort levels offered to the user (DeepSeek treats medium as high). */
export const EFFORTS = ['low', 'medium', 'high'];

const RETRY_STATUS = new Set([429, 500, 503, 529]);
const MAX_RETRIES = 3;

let sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** Test hook. */
export function setSleep(fn) { sleep = fn; }

/**
 * @param {{provider: keyof PROVIDERS, model: string, effort?: string, system: object[], tools: object[], messages: object[]}} a
 */
export function buildBody({ provider, model, effort = 'medium', system, tools, messages }) {
  const p = PROVIDERS[provider];
  return {
    model,
    max_tokens: 32000,
    stream: true,
    ...(p.topCache ? { cache_control: { type: 'ephemeral' } } : {}),
    thinking: { type: 'adaptive' },
    output_config: { effort },
    tools,
    system,
    messages,
  };
}

/**
 * Parses an SSE byte stream into the JSON `data` payloads, skipping comments and pings.
 * @param {ReadableStream<Uint8Array>} body
 */
export async function* sseEvents(body) {
  const decoder = new TextDecoder();
  const reader = body.getReader();
  let buf = '';
  let data = [];
  for (;;) {
    const { value, done } = await reader.read();
    buf += done ? decoder.decode() : decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).replace(/\r$/, '');
      buf = buf.slice(nl + 1);
      if (line === '') {
        if (data.length) {
          const event = JSON.parse(data.join('\n'));
          data = [];
          if (event.type !== 'ping') yield event;
        }
      } else if (line.startsWith('data:')) {
        data.push(line.slice(5).trimStart());
      }
    }
    if (done) return;
  }
}

/**
 * Assembles streamed events into a full assistant message.
 * @param {AsyncIterable<any>|Iterable<any>} events
 * @param {(text: string) => void} [onText]
 */
export async function assemble(events, onText) {
  /** @type {any[]} */
  const content = [];
  const json = [];
  let stop_reason = null;
  let usage = {};
  let complete = false;
  for await (const e of events) {
    switch (e.type) {
      case 'message_start':
        usage = { ...e.message?.usage };
        break;
      case 'content_block_start':
        content[e.index] = { ...e.content_block };
        json[e.index] = '';
        break;
      case 'content_block_delta': {
        const b = content[e.index];
        const d = e.delta;
        if (d.type === 'text_delta') { b.text += d.text; onText?.(d.text); }
        else if (d.type === 'input_json_delta') json[e.index] += d.partial_json;
        else if (d.type === 'thinking_delta') b.thinking += d.thinking;
        else if (d.type === 'signature_delta') b.signature = d.signature;
        break;
      }
      case 'content_block_stop': {
        const b = content[e.index];
        if (b.type === 'tool_use') {
          try { b.input = JSON.parse(json[e.index] || '{}'); } catch { b.input = {}; } // truncated by max_tokens
        }
        break;
      }
      case 'message_delta':
        stop_reason = e.delta?.stop_reason ?? stop_reason;
        Object.assign(usage, e.usage);
        break;
      case 'message_stop':
        complete = true;
        break;
      case 'error': {
        const err = new Error(e.error?.message || 'Stream error');
        // @ts-ignore
        err.retryable = ['overloaded_error', 'api_error', 'rate_limit_error'].includes(e.error?.type);
        throw err;
      }
    }
  }
  if (!complete) {
    // A dropped connection ends the stream "normally"; a partial message (e.g. unsigned thinking) must not be saved.
    const err = new Error('The response was cut off.');
    // @ts-ignore
    err.retryable = true;
    throw err;
  }
  return { content: content.filter(Boolean), stop_reason, usage };
}

/** @param {number} status @param {any} body */
export function errorMessage(status, body) {
  const msg = body?.error?.message || '';
  if (/CORS requests are not allowed/.test(msg)) {
    return 'This Anthropic organization blocks browser requests (zero data retention or Compliance API). Use a key from a different organization.';
  }
  if (status === 401) return 'The API key was rejected. Check it in Lares settings.';
  if (status === 402) return 'Your provider account has insufficient balance.';
  if (status === 403) return `The API key is not allowed to do this. ${msg}`.trim();
  if (status === 429) return 'Rate limited by the provider. Try again in a moment.';
  if (status === 413) return 'The request is too large. Start a new chat.';
  return `Provider error ${status}${msg ? `: ${msg}` : ''}`;
}

/**
 * Streams one model response, retrying transient failures.
 * @param {{provider: keyof PROVIDERS, model: string, effort?: string, key: string, system: object[], tools: object[], messages: object[],
 *   onText?: (t: string) => void, onRetry?: () => void, signal?: AbortSignal, fetchFn?: typeof fetch}} a
 */
export async function callModel({ provider, model, effort, key, system, tools, messages, onText, onRetry, signal, fetchFn = (...a) => fetch(...a) }) {
  const body = JSON.stringify(buildBody({ provider, model, effort, system, tools, messages }));
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetchFn(`${PROVIDERS[provider].base}/v1/messages`, {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
        'anthropic-version': '2026-10-21',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body,
      });
    } catch (e) {
      if (e.name === 'AbortError' || attempt >= MAX_RETRIES) throw e;
      await sleep(1000 * 2 ** attempt); // network error
      onRetry?.();
      continue;
    }
    if (res.ok) {
      try {
        return await assemble(sseEvents(res.body), onText);
      } catch (e) {
        if (!e.retryable || attempt >= MAX_RETRIES) throw e;
        await sleep(1000 * 2 ** attempt);
        onRetry?.();
        continue;
      }
    }
    const errBody = await res.json().catch(() => ({}));
    if (!RETRY_STATUS.has(res.status) || attempt >= MAX_RETRIES) throw new Error(errorMessage(res.status, errBody));
    const after = Number(res.headers.get('retry-after'));
    await sleep(after > 0 ? after * 1000 : 1000 * 2 ** attempt);
    onRetry?.();
  }
}
