import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeChrome } from './fake-chrome.js';

const chrome = installFakeChrome();
const store = await import('../extension/background/store.js');
const { Session, capResult } = await import('../extension/background/agent.js');

const ORIGIN = 'https://pve:8006';
const text = (t) => ({ type: 'text', text: t });
const use = (id, name, input) => ({ type: 'tool_use', id, name, input });
const reply = (content, stop_reason = 'end_turn') => ({ content, stop_reason, usage: { input_tokens: 100 } });

/** Builds a Session with a scripted model. `script` items are replies or functions(args) → reply. */
async function setup(script, { mode = 'manual' } = {}) {
  chrome._.reset();
  await store.setSettings({ keys: { anthropic: 'k' }, consent: true, mode });
  const calls = [];
  const posts = [];
  const callModel = async (args) => {
    calls.push(structuredClone({ messages: args.messages, system: args.system }));
    const next = script.shift();
    if (!next) throw new Error('script exhausted');
    const r = typeof next === 'function' ? await next(args) : next;
    for (const b of r.content) if (b.type === 'text') args.onText?.(b.text);
    return r;
  };
  const s = new Session({ post: (m) => posts.push(m), origin: ORIGIN, index: 'IDX', env: { user: 'root@pam', version: '8.4.1' }, deps: { callModel } });
  await s.open();
  return { s, calls, posts };
}

/** Waits until a `tool` message is posted and returns it. */
async function nextTool(posts, from = 0) {
  for (let i = 0; i < 200; i++) {
    const t = posts.slice(from).find((m) => m.type === 'tool');
    if (t) return t;
    await new Promise((r) => setTimeout(r, 1));
  }
  throw new Error('no tool message');
}

const types = (chat) => chat.messages.map((m) => `${m.role}:${m.content.map((b) => b.type).join(',')}`);

test('text-only turn streams deltas and finishes', async () => {
  const { s, posts } = await setup([reply([text('Hello')])]);
  await s.send('hi', null);
  assert.ok(posts.some((m) => m.type === 'delta' && m.text === 'Hello'));
  assert.equal(posts.at(-1).type, 'done');
  assert.deepEqual(types(s.chat), ['user:text', 'assistant:text']);
});

test('manual write asks for confirmation and records the tool result', async () => {
  const { s, posts } = await setup([
    reply([text('Starting VM 100.'), use('t1', 'pve', { method: 'POST', path: '/nodes/pve/qemu/100/status/start' })], 'tool_use'),
    reply([text('Started.')]),
  ]);
  const running = s.send('start 100', null);
  const tool = await nextTool(posts);
  assert.equal(tool.decision, 'confirm');
  assert.equal(tool.reason, 'Starting VM 100.');
  s.toolResult('t1', 'UPID ok', false);
  await running;
  assert.deepEqual(types(s.chat), ['user:text', 'assistant:text,tool_use', 'user:tool_result', 'assistant:text']);
  assert.equal(s.chat.messages[2].content[0].tool_use_id, 't1');
  assert.ok(posts.some((m) => m.type === 'tool_done' && m.id === 't1'));
});

test('auto mode runs writes but confirms destructive calls', async () => {
  const { s, posts } = await setup([
    reply([use('a', 'pve', { method: 'POST', path: '/nodes/pve/qemu/100/status/start' })], 'tool_use'),
    reply([use('b', 'pve', { method: 'DELETE', path: '/nodes/pve/qemu/100' })], 'tool_use'),
    reply([text('ok')]),
  ], { mode: 'auto' });
  const running = s.send('go', null);
  const t1 = await nextTool(posts);
  assert.equal(t1.decision, 'run');
  s.toolResult('a', 'ok', false);
  const t2 = await nextTool(posts, posts.indexOf(t1) + 1);
  assert.equal(t2.decision, 'confirm');
  assert.equal(t2.cls, 'destructive');
  s.toolResult('b', 'ok', false);
  await running;
});

test('blocked calls resolve locally as errors', async () => {
  const { s, posts } = await setup([
    reply([use('x', 'pve', { method: 'POST', path: '/nodes/pve/execute' })], 'tool_use'),
    reply([text('cannot')]),
  ]);
  await s.send('run it', null);
  const result = s.chat.messages[2].content[0];
  assert.match(result.content, /^ERROR: Blocked:/);
  assert.equal(result.is_error, true);
  assert.equal(posts.find((m) => m.type === 'tool').decision, 'block');
});

test('stop while a tool is pending keeps history valid', async () => {
  const { s, posts, calls } = await setup([
    reply([use('p', 'pve', { method: 'POST', path: '/nodes/pve/qemu/100/status/start' })], 'tool_use'),
    reply([text('next answer')]),
  ]);
  const running = s.send('start', null);
  await nextTool(posts);
  s.stop();
  await running;
  const last = s.chat.messages.at(-1);
  assert.equal(last.content[0].tool_use_id, 'p');
  assert.match(last.content[0].content, /Stopped by user\./);
  await s.send('what now?', null);
  const sent = calls.at(-1).messages;
  // every tool_use is answered by a tool_result in the next message
  sent.forEach((m, i) => {
    for (const b of m.content) if (b.type === 'tool_use') assert.ok(sent[i + 1].content.some((r) => r.tool_use_id === b.id));
  });
  assert.equal(sent.at(-1).content.at(-1).text, 'what now?');
});

test('truncated tool calls are not executed', async () => {
  const { s, posts } = await setup([reply([use('m', 'pve', { method: 'POST', path: '/nodes/pve/qemu/100/status/start' })], 'max_tokens')]);
  await s.send('go', null);
  assert.equal(posts.some((m) => m.type === 'tool'), false);
  assert.match(s.chat.messages.at(-1).content[0].content, /truncated; tool not executed/);
});

test('capResult keeps head and tail', () => {
  const big = 'a'.repeat(20000) + 'b'.repeat(20000);
  const out = capResult(big);
  assert.ok(out.length <= 16100);
  assert.ok(out.startsWith('aaa') && out.endsWith('bbb'));
  assert.match(out, /\[truncated 24/);
  assert.equal(capResult('short'), 'short');
});

test('remember stores a note without changing this chat', async () => {
  const { s } = await setup([
    reply([use('r', 'remember', { note: 'VM 105 is Plex' })], 'tool_use'),
    reply([text('noted')]),
  ]);
  const memo = s.chat.memo;
  await s.send('remember 105 is plex', null);
  assert.match(s.chat.messages[2].content[0].content, /next chat/);
  assert.equal(s.chat.memo, memo);
  assert.deepEqual((await store.getNotes(ORIGIN)).map((n) => n.text), ['VM 105 is Plex']);
});

test('system prompt is stable across calls in one chat', async () => {
  const { s, calls } = await setup([
    reply([use('r', 'remember', { note: 'x' })], 'tool_use'),
    reply([text('ok')]),
  ]);
  await s.send('hi', null);
  assert.deepEqual(calls[0].system, calls[1].system);
});

test('UI selection is sent as a context prefix', async () => {
  const { s } = await setup([reply([text('ok')])]);
  await s.send('hi', 'qemu/100');
  assert.deepEqual(s.chat.messages[0].content[0], text('[Selected in UI: qemu/100]'));
});

test('state reports ready only with key and consent', async () => {
  const { s, posts } = await setup([]);
  assert.equal(posts.find((m) => m.type === 'state').ready, true);
  await store.setSettings({ consent: false });
  await s.refresh();
  const st = posts.at(-1);
  assert.equal(st.ready, false);
  assert.match(st.setupHint, /settings/);
});

test('summarize starts a new chat seeded with the summary', async () => {
  const { s } = await setup([reply([text('hi')]), reply([text('SUMMARY')])]);
  await s.send('hello', null);
  const oldId = s.chat.id;
  await s.summarize();
  assert.notEqual(s.chat.id, oldId);
  assert.match(s.chat.messages[0].content[0].text, /^Summary of the previous chat:\nSUMMARY/);
  assert.equal((await store.getChat(oldId)).messages.length, 2);
});
