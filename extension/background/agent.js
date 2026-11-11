// @ts-check
// The agent loop: one Session per open panel. History is append-only so the prompt cache keeps hitting.

import { classify, decide } from './guard.js';
import { callModel as realCallModel, PROVIDERS } from './llm.js';
import { TOOLS, buildSystem, memoText } from './prompt.js';
import * as realStore from './store.js';

const MAX_STEPS = 25;
const MAX_RESULT = 16000;
const LONG_CHAT_TOKENS = 150000;
const STOPPED = 'Stopped by user.';

/** Caps a tool result, keeping head and tail. */
export function capResult(text, max = MAX_RESULT) {
  if (text.length <= max) return text;
  const half = max / 2;
  return `${text.slice(0, half)}\n[truncated ${text.length - max} chars, narrow the query]\n${text.slice(-half)}`;
}

const toolResult = (id, content, isError) => ({
  type: 'tool_result',
  tool_use_id: id,
  content: isError && !content.startsWith('ERROR:') ? `ERROR: ${content}` : capResult(content),
  ...(isError ? { is_error: true } : {}),
});

/** Appends user blocks, merging into a trailing user message (e.g. after a stop) to keep roles alternating. */
function pushUser(messages, blocks) {
  const last = messages.at(-1);
  if (last?.role === 'user') last.content.push(...blocks);
  else messages.push({ role: 'user', content: blocks });
}

export class Session {
  /**
   * @param {{post: (msg: any) => void, origin: string, index: string|null, env: {user?: string, version?: string},
   *   deps?: {callModel?: typeof realCallModel, store?: typeof realStore}}} o
   */
  constructor({ post, origin, index, env, deps = {} }) {
    this.post = post;
    this.origin = origin;
    this.index = index;
    this.env = env;
    this.callModel = deps.callModel ?? realCallModel;
    this.store = deps.store ?? realStore;
    /** @type {import('./store.js').Chat} */
    this.chat = null;
    this.mode = 'manual';
    this.running = false;
    /** @type {Map<string, (r: {content: string, isError: boolean}) => void>} */
    this.pending = new Map();
  }

  /** Opens a saved chat, or a new one. */
  async open(chatId) {
    this.chat = (chatId && (await this.store.getChat(chatId))) || (await this.newChat());
    await this.refresh();
  }

  async newChat() {
    const s = await this.store.getSettings();
    const notes = await this.store.getNotes(this.origin);
    const now = Date.now();
    return {
      id: crypto.randomUUID(), origin: this.origin, provider: s.provider, model: s.models[s.provider],
      memo: memoText({ ...this.env, origin: this.origin, notes }), createdAt: now, updatedAt: now, messages: [],
    };
  }

  /** Re-posts state; an empty chat follows the current settings. */
  async refresh() {
    const s = await this.store.getSettings();
    this.mode = s.mode;
    if (!this.chat.messages.length) this.chat = { ...(await this.newChat()), id: this.chat.id };
    const key = s.keys[this.chat.provider];
    const setupHint = !s.consent
      ? 'Open settings to review the privacy notice and add your API key.'
      : !key ? `Add your ${PROVIDERS[this.chat.provider].label} API key in settings.` : undefined;
    this.post({
      type: 'state', chat: { id: this.chat.id, messages: this.chat.messages }, chats: await this.store.listChats(this.origin),
      mode: this.mode, model: this.chat.model, ready: !setupHint, setupHint,
    });
  }

  async setMode(mode) {
    this.mode = mode;
    await this.store.setSettings({ mode });
  }

  async save() {
    this.chat.updatedAt = Date.now();
    await this.store.saveChat(this.chat);
  }

  /** @param {string} text @param {string|null} context */
  async send(text, context) {
    if (this.running) return;
    this.running = true;
    this.stopped = false;
    this.abort = new AbortController();
    const chat = this.chat;
    pushUser(chat.messages, [...(context ? [{ type: 'text', text: `[Selected in UI: ${context}]` }] : []), { type: 'text', text }]);
    await this.save();
    let usage = {};
    try {
      for (let step = 0; step < MAX_STEPS && !this.stopped; step++) {
        const res = await this.model(chat.messages);
        usage = res.usage;
        chat.messages.push({ role: 'assistant', content: res.content });
        await this.save();
        if (res.stop_reason === 'refusal') this.post({ type: 'error', message: 'The model declined this request.' });
        const uses = res.content.filter((b) => b.type === 'tool_use');
        if (!uses.length) break;
        const reason = res.content.findLast((b) => b.type === 'text')?.text ?? '';
        const results = [];
        for (const u of uses) results.push(await this.runTool(u, res.stop_reason, reason));
        pushUser(chat.messages, results);
        await this.save();
        if (res.stop_reason !== 'tool_use') break;
      }
    } catch (e) {
      if (!this.stopped) this.post({ type: 'error', message: e.message });
    } finally {
      this.running = false;
      const total = (usage.input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0);
      console.debug('usage', usage);
      this.post({ type: 'done', usage, long: total > LONG_CHAT_TOKENS });
    }
  }

  /** One model call with the chat's fixed provider, model, system and tools. */
  async model(messages, onText = (t) => this.post({ type: 'delta', text: t })) {
    const s = await this.store.getSettings();
    return this.callModel({
      provider: this.chat.provider, model: this.chat.model, key: s.keys[this.chat.provider],
      system: buildSystem(this.index, this.chat.memo), tools: TOOLS, messages, onText,
      onRetry: () => this.post({ type: 'reset' }), signal: this.abort?.signal,
    });
  }

  /** Runs one tool_use block and returns its tool_result block. */
  async runTool(u, stopReason, reason) {
    const done = (content, isError) => {
      this.post({ type: 'tool_done', id: u.id, content, isError });
      return toolResult(u.id, content, isError);
    };
    if (stopReason !== 'tool_use') return toolResult(u.id, 'Output was truncated; tool not executed.', true);
    if (this.stopped) return toolResult(u.id, STOPPED, true);
    const input = u.input ?? {};
    if (u.name === 'remember') {
      const note = await this.store.addNote(this.origin, String(input.note ?? ''));
      return done(`Saved as ${note.id}. Applies from the next chat.`, false);
    }
    if (u.name === 'forget') {
      const ok = await this.store.removeNote(this.origin, String(input.id ?? ''));
      return done(ok ? 'Deleted.' : `No note with id ${input.id}.`, !ok);
    }
    let decision = 'run';
    let cls = 'read';
    if (u.name === 'pve') {
      const c = classify(input.method, input.path, input.params);
      cls = c.cls;
      decision = decide(this.mode === 'auto' ? 'auto' : 'manual', c.cls);
      if (decision === 'block') {
        this.post({ type: 'tool', id: u.id, name: u.name, input, decision, cls, reason });
        return done(`Blocked: ${c.reason ?? 'not allowed'}`, true);
      }
    } else if (u.name !== 'pve_describe') {
      return done(`Unknown tool ${u.name}.`, true);
    }
    const result = new Promise((resolve) => this.pending.set(u.id, resolve));
    this.post({ type: 'tool', id: u.id, name: u.name, input, decision, cls, reason });
    const { content, isError } = await result;
    return done(content, isError);
  }

  /** Called by the panel with the outcome of a dispatched tool. */
  toolResult(id, content, isError) {
    this.pending.get(id)?.({ content: String(content), isError: !!isError });
    this.pending.delete(id);
  }

  stop() {
    this.stopped = true;
    this.abort?.abort();
    for (const id of [...this.pending.keys()]) this.toolResult(id, STOPPED, true);
  }

  /** Continues in a new chat seeded with a summary of this one. */
  async summarize() {
    if (this.running) return;
    this.running = true;
    try {
      const messages = structuredClone(this.chat.messages);
      pushUser(messages, [{ type: 'text', text: 'Summarize this conversation so it can be continued in a new chat: goals, findings, current state, open items. Be brief.' }]);
      const res = await this.model(messages, () => {});
      const summary = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
      this.chat = await this.newChat();
      this.chat.messages.push({ role: 'user', content: [{ type: 'text', text: `Summary of the previous chat:\n${summary}` }] });
      await this.save();
      await this.refresh();
    } catch (e) {
      this.post({ type: 'error', message: e.message });
    } finally {
      this.running = false;
    }
  }
}
