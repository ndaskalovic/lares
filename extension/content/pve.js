// @ts-check
// Same-origin Proxmox API client. Runs in the content script so the browser sends the page's session cookie.

const CSRF_MAX_AGE = 90 * 60 * 1000;
const TASK_POLL_MS = 1500;
const TASK_TIMEOUT_MS = 60000;
const TASK_LOG_LINES = 20;
const SESSION_EXPIRED = 'Proxmox session expired. Log in again.';

/** @param {string} cookie @returns {{user: string, issued: number}|null} */
function readTicket(cookie) {
  const raw = cookie.split(/;\s*/).find((c) => c.startsWith('PVEAuthCookie='));
  if (!raw) return null;
  const [kind, user, hex] = decodeURIComponent(raw.slice('PVEAuthCookie='.length)).split(':');
  if (kind !== 'PVE' || !user || user.startsWith('!tfa!')) return null;
  return { user, issued: parseInt(hex, 16) * 1000 };
}

/** @param {string} html @returns {string|null} */
function parseCsrf(html) {
  const token = /CSRFPreventionToken:\s*'([^']*)'/.exec(html)?.[1];
  return token && token !== 'null' ? token : null;
}

/** @param {string} token @param {number} [now] */
function csrfAge(token, now = Date.now()) {
  return now - parseInt(token.split(':')[0], 16) * 1000;
}

/** Selected resource from the UI's state hash, e.g. `#v1:0:=qemu%2F100:…` → `qemu/100`. Anything else is dropped: the hash is page-controlled. */
function selectionFromHash(hash) {
  const item = hash.split(':')[2];
  if (!item?.startsWith('=')) return null;
  try {
    const id = decodeURIComponent(item.slice(1));
    return /^[\w\-./]+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** @param {Record<string, unknown>} params */
function encodeParams(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    for (const item of Array.isArray(v) ? v : [v]) q.append(k, typeof item === 'boolean' ? (item ? '1' : '0') : String(item));
  }
  return q.toString();
}

class PveClient {
  /** @param {{fetchFn?: typeof fetch, doc?: Document, sleep?: (ms: number) => Promise<void>}} [o] */
  constructor({ fetchFn = (...a) => fetch(...a), doc = document, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
    this.fetchFn = fetchFn;
    this.sleep = sleep;
    this.csrf = [...doc.querySelectorAll('script')].map((s) => parseCsrf(s.textContent ?? '')).find(Boolean) ?? null;
  }

  async refreshCsrf() {
    const res = await this.fetchFn('/', { credentials: 'same-origin' });
    this.csrf = parseCsrf(await res.text());
  }

  /** Raw call: returns the HTTP response. */
  async call(method, path, params) {
    if (method !== 'GET' && (!this.csrf || csrfAge(this.csrf) > CSRF_MAX_AGE)) await this.refreshCsrf();
    const query = encodeParams(params);
    // pveproxy reads a body only for POST/PUT; GET and DELETE params go in the query string.
    const inBody = method === 'POST' || method === 'PUT';
    return this.fetchFn(`/api2/json${path}${!inBody && query ? `?${query}` : ''}`, {
      method,
      credentials: 'same-origin',
      headers: {
        ...(method === 'GET' ? {} : { CSRFPreventionToken: this.csrf ?? '' }),
        ...(inBody ? { 'content-type': 'application/x-www-form-urlencoded' } : {}),
      },
      ...(inBody ? { body: query } : {}),
    });
  }

  /**
   * Calls the API and waits for any task it starts.
   * @returns {Promise<{ok: boolean, text: string}>}
   */
  async request(method, path, params = {}) {
    let res = await this.call(method, path, params);
    if (res.status === 401) {
      await this.refreshCsrf();
      res = await this.call(method, path, params);
      if (res.status === 401) return { ok: false, text: SESSION_EXPIRED };
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, text: `${res.status} ${res.statusText}${json.errors ? ` ${JSON.stringify(json.errors)}` : ''}` };
    const data = json.data;
    if (method !== 'GET' && typeof data === 'string' && data.startsWith('UPID:')) return this.waitTask(data);
    return { ok: true, text: JSON.stringify(data) };
  }

  /** Polls a task until it stops (or times out) and returns its exit status and log tail. */
  async waitTask(upid) {
    try {
      return await this.pollTask(upid);
    } catch {
      // The write did start; never let a failed status check look like a failed write (the model might repeat it).
      return { ok: true, text: JSON.stringify({ upid, note: 'Task started; status unknown (polling failed).' }) };
    }
  }

  async pollTask(upid) {
    const node = upid.split(':')[1];
    const base = `/nodes/${node}/tasks/${encodeURIComponent(upid)}`;
    for (let waited = 0; waited < TASK_TIMEOUT_MS; waited += TASK_POLL_MS) {
      const res = await this.call('GET', `${base}/status`);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const status = (await res.json()).data ?? {};
      if (status.status === 'stopped') {
        const log = (await (await this.call('GET', `${base}/log`, { start: 0, limit: 500 })).json()).data ?? [];
        const exitstatus = status.exitstatus;
        const ok = exitstatus === 'OK' || String(exitstatus).startsWith('WARNINGS');
        const tail = log.slice(-TASK_LOG_LINES).map((l) => l.t);
        return { ok, text: JSON.stringify({ upid, status: 'stopped', exitstatus, log: tail }) };
      }
      await this.sleep(TASK_POLL_MS);
    }
    return { ok: true, text: JSON.stringify({ upid, status: 'running', note: `Still running; poll GET ${base}/status` }) };
  }

  async version() {
    const r = await this.request('GET', '/version');
    return r.ok ? JSON.parse(r.text)?.version : undefined;
  }
}
