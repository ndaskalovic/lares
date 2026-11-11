// @ts-check
// Turns the node's own API schema (/pve-docs/api-viewer/apidoc.js) into a compact index and per-endpoint docs.

const INDEX_EXCLUDE = /\/ceph|\/sdn|\/notifications|\/firewall|\/mapping|\/acme|\/certificates|\/metrics|\/access\/(tfa|openid|ticket|vncticket|password|domains)|\/hardware|\/scan|\/subscription|\/capabilities|vncshell|termproxy|spiceshell|vncproxy|vncwebsocket|spiceproxy|mtunnel|remote_migrate|\/execute|\/agent\/|\/cluster\/config|\/replication|\/aplinfo|\/wakeonlan|\/journal|\/query-url-metadata|\/query-oci|\/ha\/(groups|status\/manager|rules)|\/cluster\/jobs\/(realm-sync|schedule)|\/cloudinit\/dump|\/feature|\/sendkey|\/monitor|\/dbus-vmstate|\/interfaces|\/rrd$|\/apt\/(changelog|repositories|versions)|\/disks\/(lvm|lvmthin|zfs|directory)/;
const INDEX_KEEP_AGENT = /\/agent\/(get-osinfo|network-get-interfaces|info|get-fsinfo)$/;
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

/** One line per curated endpoint: `METHOD path [required] — summary`. */
function buildIndex(tree) {
  return schemaEndpoints(tree)
    .filter(({ path }) => !INDEX_EXCLUDE.test(path) || INDEX_KEEP_AGENT.test(path))
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
