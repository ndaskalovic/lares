// @ts-check
// Content scripts are registered per Proxmox origin the user enabled, never for all sites.

import { getSites, setSites } from './store.js';

export const CONTENT_FILES = ['content/schema.js', 'content/pve.js', 'content/markdown.js', 'content/styles.js', 'content/panel.js', 'content/main.js'];
const MAIN_FILES = ['content/viewport.js'];

/** @param {string} origin */
const scriptsFor = (origin) => {
  const common = { matches: [`${origin}/*`], runAt: /** @type {const} */ ('document_idle'), persistAcrossSessions: true };
  return [
    { id: `lares-main:${origin}`, js: MAIN_FILES, world: /** @type {const} */ ('MAIN'), ...common },
    { id: `lares:${origin}`, js: CONTENT_FILES, ...common },
  ];
};

async function unregister(ids) {
  const existing = new Set((await chrome.scripting.getRegisteredContentScripts()).map((s) => s.id));
  const present = ids.filter((id) => existing.has(id));
  if (present.length) await chrome.scripting.unregisterContentScripts({ ids: present });
}

// The permission grant and the popup's message both enable the same site at once; run them one at a time.
let queue = Promise.resolve();

/** @param {string} origin @param {number} [tabId] inject into this already-open tab too */
export function enableSite(origin, tabId) {
  const run = queue.then(() => enable(origin, tabId));
  queue = run.catch(() => {});
  return run;
}

async function enable(origin, tabId) {
  const scripts = scriptsFor(origin);
  await unregister(scripts.map((s) => s.id));
  await chrome.scripting.registerContentScripts(scripts);
  const sites = await getSites();
  if (!sites.includes(origin)) await setSites([...sites, origin]);
  if (tabId == null) return;
  const target = { tabId };
  const [probe] = await chrome.scripting.executeScript({ target, func: () => !!window.__lares });
  if (probe?.result) return;
  await chrome.scripting.executeScript({ target, world: 'MAIN', files: MAIN_FILES });
  await chrome.scripting.executeScript({ target, files: CONTENT_FILES });
}

/** @param {string} origin */
export async function disableSite(origin) {
  await unregister(scriptsFor(origin).map((s) => s.id));
  await setSites((await getSites()).filter((o) => o !== origin));
}

/** Re-registers enabled sites that still have permission (Safari drops registrations on update). */
export async function reconcileSites() {
  const kept = [];
  for (const origin of await getSites()) {
    if (await chrome.permissions.contains({ origins: [`${origin}/*`] })) kept.push(origin);
  }
  const ours = (await chrome.scripting.getRegisteredContentScripts()).map((s) => s.id).filter((id) => id.startsWith('lares'));
  if (ours.length) await chrome.scripting.unregisterContentScripts({ ids: ours });
  if (kept.length) await chrome.scripting.registerContentScripts(kept.flatMap(scriptsFor));
  await setSites(kept);
}
