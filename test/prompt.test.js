import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOOLS, buildSystem, memoText } from '../extension/background/prompt.js';

const index = 'GET /nodes — Cluster node index';

test('buildSystem is deterministic and tools are stable', () => {
  assert.deepEqual(buildSystem(index, 'memo'), buildSystem(index, 'memo'));
  assert.equal(JSON.stringify(TOOLS), JSON.stringify(TOOLS));
  assert.deepEqual(TOOLS.map((t) => t.name), ['pve', 'pve_describe', 'remember', 'forget']);
});

test('static block ends with the index and is cached for 1h', () => {
  const [stat, memo] = buildSystem(index, 'memo');
  assert.ok(stat.text.endsWith(index));
  assert.deepEqual(stat.cache_control, { type: 'ephemeral', ttl: '1h' });
  assert.deepEqual(memo, { type: 'text', text: 'memo' });
});

test('missing index falls back to discovery hint', () => {
  assert.match(buildSystem(null, 'm')[0].text, /Endpoint index unavailable; discover paths via directory GETs \(e\.g\. GET \/nodes\)/);
});

test('memoText lists notes or (none)', () => {
  const base = { user: 'root@pam', origin: 'https://pve:8006', version: '8.4.1' };
  const empty = memoText({ ...base, notes: [] });
  assert.match(empty, /^Session: user root@pam on https:\/\/pve:8006, Proxmox VE 8\.4\.1\./);
  assert.match(empty, /\(none\)/);
  assert.match(memoText({ ...base, notes: [{ id: 'n1', text: 'VM 105 is Plex' }] }), /- \[n1\] VM 105 is Plex/);
});
