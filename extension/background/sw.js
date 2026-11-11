// @ts-check
// Service worker entry: site registration, settings fan-out and one agent Session per open panel.

import { Session } from './agent.js';
import { enableSite, disableSite, reconcileSites } from './sites.js';
import { getSites } from './store.js';

/** @type {Set<Session>} */
const sessions = new Set();

function init() {
  chrome.storage.local.setAccessLevel?.({ accessLevel: 'TRUSTED_CONTEXTS' });
  reconcileSites();
}
chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);

// The popup may close while Chrome shows the permission prompt, so registration also follows the grant itself.
chrome.permissions.onAdded.addListener(({ origins = [] }) => {
  // Only single sites the popup asked for; ignore wildcard grants such as "all sites".
  for (const o of origins) if (!o.slice(0, -2).includes('*')) enableSite(o.replace(/\/\*$/, ''));
});

chrome.permissions.onRemoved.addListener(({ origins = [] }) => {
  for (const o of origins) disableSite(o.replace(/\/\*$/, ''));
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.settings) for (const s of sessions) s.refresh();
});

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.type === 'openOptions') {
    chrome.runtime.openOptionsPage();
    return;
  }
  if (sender.tab) return; // the rest is for extension pages only
  const work = {
    enable: () => enableSite(msg.origin, msg.tabId),
    disable: () => disableSite(msg.origin),
    sites: () => getSites(),
  }[msg.type];
  if (!work) return;
  work().then(reply, (e) => reply({ error: e.message }));
  return true;
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'lares') return;
  const origin = port.sender?.url ? new URL(port.sender.url).origin : '';
  /** @type {Session|null} */
  let session = null;
  /** @type {Promise<void>|null} resolves once the session for this port is ready */
  let ready = null;
  const post = (m) => { try { port.postMessage(m); } catch { /* panel closed */ } };
  port.onMessage.addListener(async (m) => {
    if (m.type === 'hello') {
      ready = (async () => {
        if (!(await getSites()).includes(origin)) return port.disconnect();
        session = new Session({ post, origin, index: m.index, env: m.env });
        sessions.add(session);
        await session.resume();
      })();
      return ready;
    }
    await ready; // messages sent right after hello wait for the session
    if (!session) return;
    switch (m.type) {
      case 'send': return session.send(m.text, m.context);
      case 'tool_result': return session.toolResult(m.id, m.content, m.isError);
      case 'stop': return session.stop();
      case 'summarize': return session.summarize();
      case 'mode': return session.setMode(m.mode);
      case 'open': return session.open(m.chatId);
      case 'new': return session.open();
    }
  });
  port.onDisconnect.addListener(() => {
    session?.stop();
    sessions.delete(session);
  });
});
