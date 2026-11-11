// @ts-check
// Boot: on a Proxmox VE page, wire the panel to the service worker port and run tool calls same-origin.

{
  const isPve = document.querySelector('script[src^="/pve2/js/pvemanagerlib.js"]') && !location.search.includes('console=');
  if (isPve && !window.__lares) {
    window.__lares = true;
    const PING_MS = 20000;
    const client = new PveClient();
    /** @type {chrome.runtime.Port|null} */
    let port = null;
    let ping = null;
    /** @type {any[]|null|undefined} undefined = not loaded yet, null = unavailable */
    let tree;
    let index = null;

    const send = (m) => port?.postMessage(m);

    const panel = new Panel({
      onToggle: (open) => (open ? connect() : disconnect()),
      onSend: (text) => send({ type: 'send', text, context: selectionFromHash(location.hash) }),
      onStop: () => send({ type: 'stop' }),
      onNew: () => send({ type: 'new' }),
      onOpen: (chatId) => send({ type: 'open', chatId }),
      onMode: (mode) => send({ type: 'mode', mode }),
      onSummarize: () => send({ type: 'summarize' }),
    });

    async function loadSchema() {
      if (tree !== undefined) return;
      try {
        const res = await fetch('/pve-docs/api-viewer/apidoc.js', { credentials: 'same-origin' });
        tree = parseApidoc(await res.text());
        index = buildIndex(tree);
      } catch {
        tree = null;
        panel.indexNotice = 'API index unavailable; Lares will discover endpoints as it goes.';
        panel.notice(panel.indexNotice);
      }
    }

    async function connect() {
      await loadSchema();
      const env = { user: readTicket(document.cookie)?.user, version: await client.version().catch(() => undefined) };
      port = chrome.runtime.connect({ name: 'lares' });
      port.onMessage.addListener(onMessage);
      port.onDisconnect.addListener(() => {
        clearInterval(ping);
        port = null;
        panel.lost();
      });
      send({ type: 'hello', index, env });
      ping = setInterval(() => send({ type: 'ping' }), PING_MS); // keeps the service worker alive during long confirmations
    }

    function disconnect() {
      clearInterval(ping);
      port?.disconnect();
      port = null;
    }

    function onMessage(m) {
      switch (m.type) {
        case 'state': return panel.setState(m);
        case 'delta': return panel.delta(m.text);
        case 'reset': return panel.reset();
        case 'tool': return runTool(m);
        case 'tool_done': return panel.toolDone(m);
        case 'done': return panel.done(m);
        case 'error': return panel.error(m.message);
      }
    }

    async function runTool(m) {
      const allowed = await panel.tool(m);
      if (m.decision === 'block') return;
      const reply = (content, isError) => send({ type: 'tool_result', id: m.id, content, isError });
      if (!allowed) return reply('User denied this action.', true);
      const { method, path, params } = m.input;
      if (m.name === 'pve_describe') {
        if (!tree) return reply('API schema unavailable.', true);
        return reply(describe(tree, method, path) ?? 'No such endpoint in the schema.', false);
      }
      try {
        const r = await client.request(method, path, params);
        reply(r.text, !r.ok);
      } catch (e) {
        reply(`Request failed: ${e.message}`, true);
      }
    }

    panel.restore();
  }
}
