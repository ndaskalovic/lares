import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, decide } from '../extension/background/guard.js';

const cases = [
  ['GET', '/nodes/pve/qemu', undefined, 'read'],
  ['POST', '/nodes/pve/qemu/100/status/start', undefined, 'write'],
  ['PUT', '/nodes/pve/qemu/100/config', { memory: 4096 }, 'write'],
  ['PUT', '/nodes/pve/qemu/100/config', { delete: 'net1' }, 'destructive'],
  ['DELETE', '/nodes/pve/qemu/100', undefined, 'destructive'],
  ['POST', '/nodes/pve/qemu/100/status/stop', undefined, 'destructive'],
  ['POST', '/nodes/pve/lxc/101/status/reboot', undefined, 'destructive'],
  ['POST', '/nodes/pve/qemu/100/snapshot/s1/rollback', undefined, 'destructive'],
  ['PUT', '/nodes/pve/qemu/100/resize', undefined, 'destructive'],
  ['POST', '/nodes/pve/status', { command: 'reboot' }, 'destructive'],
  ['PUT', '/nodes/pve/network', undefined, 'destructive'],
  ['POST', '/cluster/firewall/rules', undefined, 'destructive'],
  ['PUT', '/access/acl', undefined, 'destructive'],
  ['POST', '/nodes/pve/qemu', { vmid: 200, archive: 'x' }, 'destructive'],
  ['POST', '/nodes/pve/execute', undefined, 'blocked'],
  ['POST', '/nodes/pve/termproxy', undefined, 'blocked'],
  ['POST', '/nodes/pve/qemu/100/vncproxy', undefined, 'blocked'],
  ['POST', '/nodes/pve/qemu/100/agent/exec', undefined, 'blocked'],
  ['POST', '/access/ticket', undefined, 'blocked'],
  ['GET', '/access/ticket', undefined, 'blocked'],
  ['PATCH', '/nodes', undefined, 'blocked'],
];

for (const [method, path, params, expected] of cases) {
  test(`classify ${method} ${path} ${JSON.stringify(params ?? {})} → ${expected}`, () => {
    assert.equal(classify(method, path, params).cls, expected);
  });
}

test('unfilled placeholder is blocked with a placeholder reason', () => {
  const r = classify('GET', '/nodes/{node}/qemu');
  assert.equal(r.cls, 'blocked');
  assert.match(r.reason, /placeholder/);
});

for (const path of ['/nodes/../access', '/nodes?x=1', '/nodes#a', 'https://evil.example/x', 'nodes',
  '/nodes/x/%2e%2e/access/ticket', '/nodes/pve/qemu/100/status/stop/x/%2E%2e', '/nodes//qemu', '/nodes/']) {
  test(`malformed path ${path} is blocked with a reason`, () => {
    const r = classify('GET', path);
    assert.equal(r.cls, 'blocked');
    assert.ok(r.reason && r.reason.length > 0);
  });
}

test('encoded volume ids and the root are allowed', () => {
  assert.equal(classify('GET', '/nodes/pve/storage/local/content/local%3Aiso%2Fdebian.iso').cls, 'read');
  assert.equal(classify('GET', '/').cls, 'read');
});

test('percent-encoded names are judged decoded', () => {
  assert.equal(classify('POST', '/access/%74icket').cls, 'blocked');
  assert.equal(classify('POST', '/nodes/pve/qemu/100/status/%73top').cls, 'destructive');
});

test('decide manual', () => {
  assert.deepEqual(['read', 'write', 'destructive', 'blocked'].map((c) => decide('manual', c)), ['run', 'confirm', 'confirm', 'block']);
});

test('decide auto', () => {
  assert.deepEqual(['read', 'write', 'destructive', 'blocked'].map((c) => decide('auto', c)), ['run', 'run', 'confirm', 'block']);
});
