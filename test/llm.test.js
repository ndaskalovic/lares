import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROVIDERS, buildBody, sseEvents, assemble, errorMessage, callModel, setSleep } from '../extension/background/llm.js';

setSleep(async () => {});

const enc = new TextEncoder();
/** Stream of the given byte chunks. */
const streamOf = (chunks) => new ReadableStream({
  start(c) { for (const ch of chunks) c.enqueue(typeof ch === 'string' ? enc.encode(ch) : ch); c.close(); },
});
const sse = (events) => events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join('');
const collect = async (it) => { const out = []; for await (const x of it) out.push(x); return out; };
const args = { system: [{ type: 'text', text: 'S' }], tools: [{ name: 't' }], messages: [{ role: 'user', content: 'hi' }] };

test('buildBody anthropic', () => {
  const b = buildBody({ provider: 'anthropic', model: 'claude-haiku-5-5', ...args });
  assert.deepEqual(b.cache_control, { type: 'ephemeral' });
  assert.deepEqual(b.thinking, { type: 'adaptive' });
  assert.deepEqual(b.output_config, { effort: 'medium' });
  assert.equal(b.max_tokens, 32000);
  assert.equal(b.stream, true);
  assert.equal('temperature' in b, false);
  assert.equal(b.system, args.system);
});

test('buildBody deepseek', () => {
  const b = buildBody({ provider: 'deepseek', model: 'deepseek-v4-pro', ...args });
  assert.equal('cache_control' in b, false);
  assert.equal(b.output_config.effort, 'medium'); // DeepSeek maps medium to high itself
});

test('buildBody uses the chosen effort', () => {
  assert.equal(buildBody({ provider: 'anthropic', model: 'm', effort: 'high', ...args }).output_config.effort, 'high');
  assert.equal(buildBody({ provider: 'deepseek', model: 'm', effort: 'low', ...args }).output_config.effort, 'low');
});

test('providers list default models first', () => {
  assert.equal(PROVIDERS.anthropic.models[0], 'claude-haiku-5-5');
  assert.equal(PROVIDERS.deepseek.models[0], 'deepseek-v4-pro');
});

test('sseEvents handles split lines, split UTF-8, comments and pings', async () => {
  const text = ': keep-alive\n\n' + sse([{ type: 'ping' }, { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'é!' } }]);
  const bytes = enc.encode(text);
  const eAt = bytes.indexOf(0xc3); // first byte of é
  const chunks = [bytes.slice(0, 20), bytes.slice(20, eAt + 1), bytes.slice(eAt + 1)];
  const events = await collect(sseEvents(streamOf(chunks)));
  assert.deepEqual(events, [{ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'é!' } }]);
});

const toolTurn = [
  { type: 'message_start', message: { usage: { input_tokens: 10, cache_read_input_tokens: 5 } } },
  { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
  { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hi ' } },
  { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'there' } },
  { type: 'content_block_stop', index: 0 },
  { type: 'content_block_start', index: 1, content_block: { type: 'tool_use', id: 't1', name: 'pve', input: {} } },
  { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '{"method":"GET",' } },
  { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '"path":"/nodes"}' } },
  { type: 'content_block_stop', index: 1 },
  { type: 'message_delta', delta: { stop_reason: 'tool_use' }, usage: { output_tokens: 7 } },
  { type: 'message_stop' },
];

test('assemble builds text and tool_use blocks and merges usage', async () => {
  const seen = [];
  const r = await assemble(toolTurn, (t) => seen.push(t));
  assert.deepEqual(r.content, [
    { type: 'text', text: 'Hi there' },
    { type: 'tool_use', id: 't1', name: 'pve', input: { method: 'GET', path: '/nodes' } },
  ]);
  assert.equal(r.stop_reason, 'tool_use');
  assert.deepEqual(r.usage, { input_tokens: 10, cache_read_input_tokens: 5, output_tokens: 7 });
  assert.deepEqual(seen, ['Hi ', 'there']);
});

test('assemble keeps thinking blocks with signature', async () => {
  const r = await assemble([
    { type: 'message_start', message: { usage: {} } },
    { type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: 'hmm' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'signature_delta', signature: 'sig' } },
    { type: 'content_block_stop', index: 0 },
    { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: {} },
    { type: 'message_stop' },
  ]);
  assert.deepEqual(r.content, [{ type: 'thinking', thinking: 'hmm', signature: 'sig' }]);
});

test('assemble throws retryable error on overloaded stream error', async () => {
  await assert.rejects(assemble([{ type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } }]), (e) => e.retryable === true);
});

test('errorMessage maps common failures', () => {
  assert.match(errorMessage(401, {}), /API key/);
  assert.match(errorMessage(402, {}), /balance/);
  assert.match(errorMessage(401, { error: { message: 'CORS requests are not allowed for this Organization' } }), /browser/);
});

const okResponse = () => new Response(streamOf([sse(toolTurn)]), { status: 200 });
const errResponse = (status) => new Response(JSON.stringify({ error: { message: 'x' } }), { status });
const callArgs = (fetchFn) => ({ provider: 'anthropic', model: 'claude-sonnet-5-5', key: 'k', ...args, fetchFn });

test('callModel retries 529 then succeeds', async () => {
  let calls = 0;
  const fetchFn = async () => (++calls === 1 ? errResponse(529) : okResponse());
  const r = await callModel(callArgs(fetchFn));
  assert.equal(calls, 2);
  assert.equal(r.stop_reason, 'tool_use');
});

test('callModel does not retry 401', async () => {
  let calls = 0;
  const fetchFn = async () => { calls++; return errResponse(401); };
  await assert.rejects(callModel(callArgs(fetchFn)), /API key/);
  assert.equal(calls, 1);
});

test('callModel sends required headers to the provider base', async () => {
  let seen;
  const fetchFn = async (url, init) => { seen = { url, init }; return okResponse(); };
  await callModel({ ...callArgs(fetchFn), provider: 'deepseek', model: 'deepseek-flash' });
  assert.equal(seen.url, 'https://api.deepseek.com/anthropic/v1/messages');
  assert.equal(seen.init.headers.authorization, 'Bearer k');
  assert.equal(seen.init.headers['anthropic-version'], '2026-10-21');
  assert.equal(seen.init.headers['anthropic-dangerous-direct-browser-access'], 'true');
});

test('assemble tolerates truncated tool JSON', async () => {
  const r = await assemble([
    { type: 'message_start', message: { usage: {} } },
    { type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 't9', name: 'pve', input: {} } },
    { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '{"method":"GE' } },
    { type: 'content_block_stop', index: 0 },
    { type: 'message_delta', delta: { stop_reason: 'max_tokens' }, usage: {} },
    { type: 'message_stop' },
  ]);
  assert.equal(r.stop_reason, 'max_tokens');
  assert.deepEqual(r.content[0].input, {});
});

test('callModel calls onRetry before retrying', async () => {
  let calls = 0;
  let retries = 0;
  const fetchFn = async () => (++calls === 1 ? errResponse(503) : okResponse());
  await callModel({ ...callArgs(fetchFn), onRetry: () => retries++ });
  assert.equal(retries, 1);
});

test('a stream that ends without message_stop is a retryable error', async () => {
  await assert.rejects(assemble([
    { type: 'message_start', message: { usage: {} } },
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'partial' } },
  ]), (e) => e.retryable === true);
});

test('callModel retries network errors', async () => {
  let calls = 0;
  const fetchFn = async () => { if (++calls === 1) throw new TypeError('Failed to fetch'); return okResponse(); };
  await callModel(callArgs(fetchFn));
  assert.equal(calls, 2);
});
