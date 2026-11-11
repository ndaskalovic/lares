// @ts-check
// Classifies every Proxmox API call the model wants to make. Enforced in code, never by the prompt.

/** @typedef {'read'|'write'|'destructive'|'blocked'} Cls */

const METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE']);
const PATH_RE = /^\/[A-Za-z0-9_.\-/:@=%,]*$/;
const BLOCKED_SEGMENTS = new Set(['execute', 'vncshell', 'termproxy', 'spiceshell', 'vncproxy', 'spiceproxy', 'vncwebsocket']);
const BLOCKED_AGENT = /\/agent\/(exec|exec-status|file-read|file-write|set-user-password)$/;
const DESTRUCTIVE_LAST = new Set([
  'stop', 'reset', 'shutdown', 'reboot', 'suspend', 'rollback', 'migrate', 'remote_migrate', 'relocate',
  'migrateall', 'stopall', 'suspendall', 'template', 'unlink', 'wipedisk', 'initgpt', 'resize', 'move_disk', 'move_volume',
]);
const DESTRUCTIVE_PARAMS = ['delete', 'purge', 'destroy-unreferenced-disks', 'force', 'skiplock', 'archive'];

/**
 * @param {string} method
 * @param {string} path
 * @param {Record<string, unknown>} [params]
 * @returns {{cls: Cls, reason?: string}}
 */
export function classify(method, path, params = {}) {
  const blocked = (reason) => ({ cls: /** @type {Cls} */ ('blocked'), reason });
  if (!METHODS.has(method)) return blocked(`method ${method} is not allowed`);
  if (typeof path !== 'string' || !path.startsWith('/')) return blocked('path must start with / and be relative to /api2/json');
  if (path.includes('{')) return blocked('fill every placeholder in the path (e.g. {node}) with a real value');
  if (!PATH_RE.test(path)) return blocked('path contains characters that are not allowed (no query string, fragment or URL)');
  const segments = path.split('/').filter(Boolean);
  if (segments.includes('..') || segments.includes('.')) return blocked('path must not contain . or .. segments');
  if (segments.some((s) => BLOCKED_SEGMENTS.has(s) || s.startsWith('mtunnel'))) return blocked('shell, console and execute endpoints are not available to Lares');
  if (BLOCKED_AGENT.test(path)) return blocked('running commands or files inside guests is not available to Lares');
  if (path.startsWith('/access/ticket')) return blocked('authentication endpoints are not available to Lares');

  if (method === 'GET') return { cls: 'read' };
  if (method === 'DELETE') return { cls: 'destructive' };

  const last = segments[segments.length - 1];
  const destructive =
    DESTRUCTIVE_LAST.has(last) ||
    DESTRUCTIVE_PARAMS.some((p) => params && p in params) ||
    /^\/nodes\/[^/]+\/status$/.test(path) ||
    (method === 'PUT' && /^\/nodes\/[^/]+\/network$/.test(path)) ||
    path.includes('/firewall/') || path.endsWith('/firewall') ||
    path.startsWith('/access/') ||
    (method === 'PUT' && path.endsWith('/apt/repositories')) ||
    /\/agent\/(shutdown|suspend-[a-z]+)$/.test(path);
  return { cls: destructive ? 'destructive' : 'write' };
}

/**
 * @param {'manual'|'auto'} mode
 * @param {Cls} cls
 * @returns {'run'|'confirm'|'block'}
 */
export function decide(mode, cls) {
  if (cls === 'blocked') return 'block';
  if (cls === 'read') return 'run';
  if (cls === 'destructive') return 'confirm';
  return mode === 'auto' ? 'run' : 'confirm';
}
