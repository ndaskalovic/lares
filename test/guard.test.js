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

test('encoded slashes cannot hide blocked or destructive endpoints', () => {
  assert.equal(classify('POST', '/nodes/pve%2Fexecute').cls, 'blocked');
  assert.equal(classify('POST', '/nodes/pve/qemu/100/status%2Fstop').cls, 'destructive');
});

test('non-object params are blocked', () => {
  assert.equal(classify('POST', '/nodes/pve/qemu/100/config', /** @type {any} */ ('delete=net0')).cls, 'blocked');
  assert.equal(classify('POST', '/nodes/pve/qemu/100/config', /** @type {any} */ (['a'])).cls, 'blocked');
});

test('disk formatting endpoints are destructive', () => {
  for (const p of ['/nodes/pve/disks/zfs', '/nodes/pve/disks/lvm', '/nodes/pve/disks/lvmthin', '/nodes/pve/disks/directory', '/nodes/pve/ceph/osd']) {
    assert.equal(classify('POST', p).cls, 'destructive', p);
  }
});

test('lockout-prone and cluster-changing writes are destructive', () => {
  for (const [m, p] of [
    ['PUT', '/cluster/sdn'],
    ['POST', '/cluster/config'],
    ['POST', '/cluster/config/join'],
    ['POST', '/nodes/pve/certificates/custom'],
    ['PUT', '/nodes/pve/dns'],
    ['POST', '/nodes/pve/hosts'],
    ['POST', '/nodes/pve/services/pveproxy/restart'],
  ]) assert.equal(classify(m, p).cls, 'destructive', `${m} ${p}`);
  assert.equal(classify('POST', '/cluster/sdn/vnets').cls, 'write');
});

test('params that run code on the host are destructive', () => {
  for (const p of ['args', 'hookscript', 'cicustom']) {
    assert.equal(classify('PUT', '/nodes/pve/qemu/100/config', { [p]: 'x' }).cls, 'destructive', p);
  }
});
