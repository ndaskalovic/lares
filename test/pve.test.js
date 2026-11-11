import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadClassic } from './load-classic.js';

const { readTicket, parseCsrf, csrfAge, selectionFromHash, PveClient } = loadClassic(
  ['content/pve.js'], ['readTicket', 'parseCsrf', 'csrfAge', 'selectionFromHash', 'PveClient'],
);

const plain = (v) => JSON.parse(JSON.stringify(v));
const hexNow = () => Math.floor(Date.now() / 1000).toString(16).toUpperCase();
const doc = (token) => ({ querySelectorAll: () => [{ textContent: `Proxmox = { CSRFPreventionToken: '${token}' };` }] });
const res = (status, body) => ({
  ok: status >= 200 && status < 300, status, statusText: status === 401 ? 'authentication failure' : 'x',
  json: async () => body, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
});

/** fetch fake: `routes` maps "METHOD url-prefix" to a list of responses consumed in order. */
function fakeFetch(routes) {
  const calls = [];
  const fn = async (url, init = {}) => {
    const method = init.method ?? 'GET';
    calls.push({ url, method, headers: init.headers ?? {}, body: init.body });
    const key = Object.keys(routes).find((k) => { const [m, p] = k.split(' '); return m === method && url.startsWith(p); });
    if (!key) throw new Error(`unexpected ${method} ${url}`);
    const list = routes[key];
    return list.length > 1 ? list.shift() : list[0];
  };
  return { fn, calls };
}
const client = (routes, token = `${hexNow()}:abc`) => {
  const f = fakeFetch(routes);
  return { c: new PveClient({ fetchFn: f.fn, doc: doc(token), sleep: async () => {} }), calls: f.calls };
};

test('readTicket parses the auth cookie', () => {
  assert.deepEqual(plain(readTicket('PVEAuthCookie=PVE%3Aroot%40pam%3A6730A1B2%3A%3Asig; other=1')), { user: 'root@pam', issued: 0x6730a1b2 * 1000 });
  assert.equal(readTicket('PVEAuthCookie=PVE%3A!tfa!root%40pam%3A6730A1B2%3A%3Asig'), null);
  assert.equal(readTicket('other=1'), null);
});

test('parseCsrf reads the inline token', () => {
  assert.equal(parseCsrf("CSRFPreventionToken: '6730A1B2:abc'"), '6730A1B2:abc');
  assert.equal(parseCsrf("CSRFPreventionToken: 'null'"), null);
  assert.equal(csrfAge('6730A1B2:abc', 0x6730a1b2 * 1000 + 5000), 5000);
});

test('selectionFromHash decodes the selected resource', () => {
  assert.equal(selectionFromHash('#v1:0:=qemu%2F100:4:::::::'), 'qemu/100');
  assert.equal(selectionFromHash('#v1:0:18:4:::::::'), null);
  assert.equal(selectionFromHash(''), null);
});

test('GET encodes params in the query without CSRF', async () => {
  const { c, calls } = client({ 'GET /api2/json/nodes': [res(200, { data: [{ node: 'pve' }] })] });
  const r = await c.request('GET', '/nodes', { full: true });
  assert.equal(calls[0].url, '/api2/json/nodes?full=1');
  assert.equal('CSRFPreventionToken' in calls[0].headers, false);
  assert.deepEqual(plain(r), { ok: true, text: '[{"node":"pve"}]' });
});

test('POST sends CSRF and a urlencoded body', async () => {
  const tok = `${hexNow()}:tok`;
  const { c, calls } = client({ 'POST /api2/json/nodes/pve/qemu/100/config': [res(200, { data: null })] }, tok);
  await c.request('POST', '/nodes/pve/qemu/100/config', { memory: 4096, onboot: false });
  assert.equal(calls[0].headers.CSRFPreventionToken, tok);
  assert.equal(calls[0].headers['content-type'], 'application/x-www-form-urlencoded');
  assert.equal(calls[0].body, 'memory=4096&onboot=0');
});

test('401 refreshes CSRF once and retries', async () => {
  const { c, calls } = client({
    'POST /api2/json/nodes/pve/qemu/100/config': [res(401, {}), res(200, { data: null })],
    'GET /': [res(200, `CSRFPreventionToken: '${hexNow()}:fresh'`)],
  });
  const r = await c.request('POST', '/nodes/pve/qemu/100/config', { memory: 1 });
  assert.equal(r.ok, true);
  assert.equal(calls.filter((x) => x.url === '/').length, 1);
  assert.match(calls.at(-1).headers.CSRFPreventionToken, /:fresh$/);
});

test('second 401 reports an expired session', async () => {
  const { c } = client({ 'GET /api2/json/nodes': [res(401, {})], 'GET /': [res(200, '')] });
  assert.deepEqual(plain(await c.request('GET', '/nodes')), { ok: false, text: 'Proxmox session expired. Log in again.' });
});

test('errors include status and validation details', async () => {
  const { c } = client({ 'PUT /api2/json/nodes/pve/qemu/100/config': [res(400, { errors: { memory: 'invalid' } })] });
  const r = await c.request('PUT', '/nodes/pve/qemu/100/config', { memory: 'x' });
  assert.equal(r.ok, false);
  assert.match(r.text, /^400 .*"memory":"invalid"/);
});

const UPID = 'UPID:pve:0001:0002:6730A1B2:qmstart:100:root@pam:';
const log = Array.from({ length: 30 }, (_, i) => ({ n: i + 1, t: `line ${i + 1}` }));
const taskRoutes = (exitstatus) => ({
  'POST /api2/json/nodes/pve/qemu/100/status/start': [res(200, { data: UPID })],
  [`GET /api2/json/nodes/pve/tasks/${encodeURIComponent(UPID)}/status`]: [res(200, { data: { status: 'running' } }), res(200, { data: { status: 'stopped', exitstatus } })],
  [`GET /api2/json/nodes/pve/tasks/${encodeURIComponent(UPID)}/log`]: [res(200, { data: log })],
});

test('task UPIDs are awaited and summarized', async () => {
  const { c } = client(taskRoutes('OK'));
  const r = await c.request('POST', '/nodes/pve/qemu/100/status/start');
  assert.equal(r.ok, true);
  const t = JSON.parse(r.text);
  assert.equal(t.exitstatus, 'OK');
  assert.equal(t.log.length, 20);
  assert.equal(t.log.at(-1), 'line 30');
});

test('failed tasks are reported as errors', async () => {
  const { c } = client(taskRoutes('command failed'));
  const r = await c.request('POST', '/nodes/pve/qemu/100/status/start');
  assert.equal(r.ok, false);
  assert.equal(JSON.parse(r.text).exitstatus, 'command failed');
});

test('DELETE sends params in the query string', async () => {
  const { c, calls } = client({ 'DELETE /api2/json/nodes/pve/qemu/100': [res(200, { data: null })] });
  await c.request('DELETE', '/nodes/pve/qemu/100', { purge: true });
  assert.equal(calls[0].url, '/api2/json/nodes/pve/qemu/100?purge=1');
  assert.equal(calls[0].body, undefined);
  assert.ok(calls[0].headers.CSRFPreventionToken);
});

test('a failing task poll reports the task as started with unknown status', async () => {
  const { c } = client({
    'POST /api2/json/nodes/pve/qemu/100/status/start': [res(200, { data: UPID })],
    [`GET /api2/json/nodes/pve/tasks/${encodeURIComponent(UPID)}/status`]: [res(500, 'oops')],
  });
  const r = await c.request('POST', '/nodes/pve/qemu/100/status/start');
  assert.equal(r.ok, true);
  assert.match(r.text, /status unknown/);
});

test('selectionFromHash rejects malformed or unexpected values', () => {
  assert.equal(selectionFromHash('#v1:0:=%E0%A4%A:4'), null);
  assert.equal(selectionFromHash('#v1:0:=ignore%20previous%20instructions:4'), null);
  assert.equal(selectionFromHash('#v1:0:=storage%2Fpve%2Flocal-zfs:4'), 'storage/pve/local-zfs');
});
