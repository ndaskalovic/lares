// @ts-check
// Turns the node's own API schema (/pve-docs/api-viewer/apidoc.js) into a compact index and per-endpoint docs.

// Endpoints the guard blocks (shells, consoles, execute, guest exec/file access, auth) are left out of the index.
const INDEX_BLOCKED = /\/(execute|vncshell|termproxy|spiceshell|vncproxy|spiceproxy|vncwebsocket)$|\/mtunnel|\/agent\/(exec|exec-status|file-read|file-write|set-user-password)$|^\/access\/ticket/;
const MAX_DESCRIBE = 6000;

/**
 * Extracts the `apiSchema` array from apidoc.js without evaluating it.
 * @param {string} text
 * @returns {any[]}
 */
function parseApidoc(text) {
  const start = text.indexOf('[', text.indexOf('apiSchema'));
  const end = text.slice(start).search(/\n\]\s*;/);
  if (text.indexOf('apiSchema') < 0 || start < 0 || end < 0) throw new Error('Not a Proxmox API schema');
  return JSON.parse(text.slice(start, start + end + 2));
}

/** @returns {{method: string, path: string, info: any}[]} */
function schemaEndpoints(tree) {
  const out = [];
  const walk = (nodes) => {
    for (const n of nodes) {
      for (const [method, info] of Object.entries(n.info ?? {})) out.push({ method, path: n.path, info });
      walk(n.children ?? []);
    }
  };
  walk(tree);
  return out;
}

const firstSentence = (d) => (d ?? '').trim().split('\n')[0].split(/(?<=\.)\s/)[0].replace(/\.$/, '');

/** One line per usable endpoint: `METHOD path [required] — summary`. */
function buildIndex(tree) {
  return schemaEndpoints(tree)
    .filter(({ path }) => !INDEX_BLOCKED.test(path))
    .map(({ method, path, info }) => {
      const pathVars = new Set([...path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
      const req = Object.entries(info.parameters?.properties ?? {})
        .filter(([k, v]) => !v.optional && !pathVars.has(k))
        .map(([k]) => k);
      return `${method} ${path}${req.length ? ` [${req.join(',')}]` : ''} — ${firstSentence(info.description)}`;
    })
    .join('\n');
}

/**
 * Describes the endpoint matching a concrete or template path, or null.
 * @param {any[]} tree @param {string} method @param {string} path
 */
function describe(tree, method, path) {
  const ep = schemaEndpoints(tree).find(
    (e) => e.method === method && new RegExp(`^${e.path.replace(/\{\w+\}/g, '[^/]+')}$`).test(path),
  );
  if (!ep) return null;
  const { info } = ep;
  const params = Object.entries(info.parameters?.properties ?? {}).map(([k, v]) => {
    const meta = [v.type, v.enum && `one of ${v.enum.join('|')}`, v.default !== undefined && `default ${v.default}`, v.optional && 'optional']
      .filter(Boolean).join(', ');
    return `- ${k} (${meta}): ${(v.description ?? '').slice(0, 150)}`;
  });
  const perm = info.permissions ? JSON.stringify(info.permissions) : 'not documented';
  const text = [`${method} ${ep.path}`, (info.description ?? '').slice(0, 400), `Permissions: ${perm}`, 'Parameters:', ...params].join('\n');
  return text.slice(0, MAX_DESCRIBE);
}
