// @ts-check
// Thin wrapper over chrome.storage.local. Only the service worker and extension pages use it.

/**
 * @typedef {{id: string, origin: string, provider: 'anthropic'|'deepseek', model: string, system: object[], memo?: string,
 *   createdAt: number, updatedAt: number, messages: any[]}} Chat
 * @typedef {{id: string, text: string}} Note
 */

export const DEFAULT_SETTINGS = {
  provider: /** @type {'anthropic'|'deepseek'} */ ('anthropic'),
  keys: { anthropic: '', deepseek: '' },
  models: { anthropic: 'claude-haiku-5-5', deepseek: 'deepseek-v4-pro' },
  mode: /** @type {'manual'|'auto'} */ ('manual'),
  consent: false,
};

const local = () => chrome.storage.local;

async function get(key, fallback) {
  const r = await local().get(key);
  return r[key] ?? fallback;
}
const put = (key, value) => local().set({ [key]: value });

/** @returns {Promise<typeof DEFAULT_SETTINGS>} */
export async function getSettings() {
  const s = await get('settings', {});
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    keys: { ...DEFAULT_SETTINGS.keys, ...s.keys },
    models: { ...DEFAULT_SETTINGS.models, ...s.models },
  };
}

/** @param {Partial<typeof DEFAULT_SETTINGS>} patch */
export async function setSettings(patch) {
  const s = await getSettings();
  await put('settings', {
    ...s,
    ...patch,
    keys: { ...s.keys, ...patch.keys },
    models: { ...s.models, ...patch.models },
  });
}

/** @param {string} origin @returns {Promise<{id: string, title: string, updatedAt: number}[]>} */
export const listChats = (origin) => get(`chats:${origin}`, []);

/** @param {string} id @returns {Promise<Chat|null>} */
export const getChat = (id) => get(`chat:${id}`, null);

/** @param {Chat} chat */
export async function saveChat(chat) {
  const first = chat.messages.find((m) => m.role === 'user');
  const text = first?.content?.findLast?.((b) => b.type === 'text')?.text ?? 'New chat';
  const meta = { id: chat.id, title: text.slice(0, 60), updatedAt: chat.updatedAt };
  const list = (await listChats(chat.origin)).filter((c) => c.id !== chat.id);
  list.push(meta);
  list.sort((a, b) => b.updatedAt - a.updatedAt);
  await local().set({ [`chat:${chat.id}`]: chat, [`chats:${chat.origin}`]: list });
}

/** @param {string} origin @returns {Promise<Note[]>} */
export const getNotes = (origin) => get(`notes:${origin}`, []);

/** @param {string} origin @param {Note[]} notes */
export const setNotes = (origin, notes) => put(`notes:${origin}`, notes);

/** @param {string} origin @param {string} text @returns {Promise<Note>} */
export async function addNote(origin, text) {
  const notes = await getNotes(origin);
  const next = Math.max(0, ...notes.map((n) => Number(n.id.slice(1)) || 0)) + 1;
  const note = { id: `n${next}`, text };
  await setNotes(origin, [...notes, note]);
  return note;
}

/** @param {string} origin @param {string} id */
export async function removeNote(origin, id) {
  const notes = await getNotes(origin);
  const kept = notes.filter((n) => n.id !== id);
  if (kept.length === notes.length) return false;
  await setNotes(origin, kept);
  return true;
}

/** @returns {Promise<Record<string, Note[]>>} */
export async function allNotes() {
  /** @type {Record<string, any>} */
  const all = await local().get(null);
  return Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith('notes:')).map(([k, v]) => [k.slice(6), v]));
}

/** @returns {Promise<string[]>} */
export const getSites = () => get('sites', []);

/** @param {string[]} origins */
export const setSites = (origins) => put('sites', origins);
