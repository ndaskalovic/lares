// Minimal in-memory chrome.* stand-ins for node tests.
export function installFakeChrome() {
  let data = {};
  const registered = new Map();
  const executed = [];
  const granted = new Set();
  const chrome = {
    storage: {
      local: {
        async get(keys) {
          if (keys == null) return structuredClone(data);
          const list = Array.isArray(keys) ? keys : [keys];
          return Object.fromEntries(list.filter((k) => k in data).map((k) => [k, structuredClone(data[k])]));
        },
        async set(obj) { Object.assign(data, structuredClone(obj)); },
        async remove(keys) { for (const k of [].concat(keys)) delete data[k]; },
      },
    },
    scripting: {
      async registerContentScripts(scripts) {
        await null;
        for (const s of scripts) if (registered.has(s.id)) throw new Error(`Duplicate script ID '${s.id}'`);
        for (const s of scripts) registered.set(s.id, s);
      },
      async unregisterContentScripts(filter) {
        for (const id of filter?.ids ?? [...registered.keys()]) registered.delete(id);
      },
      async getRegisteredContentScripts() { return [...registered.values()]; },
      async executeScript(opts) { executed.push(opts); return opts.func ? [{ result: false }] : []; },
    },
    permissions: {
      async contains({ origins }) { return origins.every((o) => granted.has(o)); },
    },
    _: { registered, executed, granted, reset() { data = {}; registered.clear(); executed.length = 0; granted.clear(); } },
  };
  globalThis.chrome = chrome;
  return chrome;
}
