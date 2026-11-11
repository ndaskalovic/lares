import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeChrome } from './fake-chrome.js';

const chrome = installFakeChrome();
const store = await import('../extension/background/store.js');
beforeEach(() => chrome._.reset());

const A = 'https://a:8006';
const B = 'https://b.example';
const chat = (id, origin, updatedAt, text = 'hello') => ({
  id, origin, provider: 'anthropic', model: 'm', memo: '', createdAt: updatedAt, updatedAt,
  messages: [{ role: 'user', content: [{ type: 'text', text }] }],
});

test('settings default and deep merge keys', async () => {
  assert.deepEqual(await store.getSettings(), store.DEFAULT_SETTINGS);
  await store.setSettings({ keys: { deepseek: 'k' } });
  const s = await store.getSettings();
  assert.equal(s.keys.deepseek, 'k');
  assert.equal(s.keys.anthropic, '');
  assert.equal(s.models.anthropic, 'claude-haiku-5-5');
});

test('chats are listed per origin, newest first, without duplicates', async () => {
  await store.saveChat(chat('c1', A, 1));
  await store.saveChat(chat('c2', A, 2, 'x'.repeat(100)));
  await store.saveChat(chat('c3', B, 3));
  await store.saveChat({ ...chat('c1', A, 4), updatedAt: 4 });
  const list = await store.listChats(A);
  assert.deepEqual(list.map((c) => c.id), ['c1', 'c2']);
  assert.equal(list[1].title.length, 60);
  assert.equal((await store.getChat('c3')).origin, B);
  assert.equal(await store.getChat('nope'), null);
});

test('notes get incrementing ids per origin', async () => {
  assert.deepEqual(await store.addNote(A, 'one'), { id: 'n1', text: 'one' });
  assert.equal((await store.addNote(A, 'two')).id, 'n2');
  assert.equal(await store.removeNote(A, 'n1'), true);
  assert.equal((await store.addNote(A, 'three')).id, 'n3');
  assert.equal(await store.removeNote(A, 'zzz'), false);
  assert.deepEqual((await store.getNotes(A)).map((n) => n.id), ['n2', 'n3']);
  assert.deepEqual(Object.keys(await store.allNotes()), [A]);
});

test('sites round trip', async () => {
  assert.deepEqual(await store.getSites(), []);
  await store.setSites([A]);
  assert.deepEqual(await store.getSites(), [A]);
});
