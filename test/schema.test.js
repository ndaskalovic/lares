import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadClassic } from './load-classic.js';

const { parseApidoc, buildIndex, describe } = loadClassic(['content/schema.js'], ['parseApidoc', 'buildIndex', 'describe']);
const tree = parseApidoc(fs.readFileSync(new URL('./fixtures/apidoc.js', import.meta.url), 'utf8'));

test('parseApidoc returns the schema tree', () => {
  assert.ok(Array.isArray(tree));
  assert.ok(tree.some((n) => n.path === '/version'));
});

test('parseApidoc throws on unrelated files', () => {
  assert.throws(() => parseApidoc('console.log(1)'));
});

test('buildIndex lists every usable endpoint one per line', () => {
  const idx = buildIndex(tree);
  assert.match(idx, /^GET \/nodes\/\{node\}\/qemu\/\{vmid\}\/status\/current — /m);
  assert.match(idx, /^GET \/nodes\/\{node\}\/ceph\/status — /m);
  assert.doesNotMatch(idx, /agent\/exec/);
  assert.match(idx, /agent\/get-osinfo/);
  assert.match(idx, /^POST \/nodes\/\{node\}\/qemu \[vmid\] — /m);
  assert.doesNotMatch(idx, /\.$/m);
  assert.equal(buildIndex(tree), idx);
});

test('describe matches concrete paths to templates', () => {
  const d = describe(tree, 'POST', '/nodes/pve/qemu/100/status/stop');
  assert.match(d, /POST \/nodes\/\{node\}\/qemu\/\{vmid\}\/status\/stop/);
  assert.match(d, /- skiplock \(boolean, optional\)/);
  assert.match(d, /Permissions:/);
  assert.ok(d.length <= 6000);
});

test('describe returns null for unknown endpoints', () => {
  assert.equal(describe(tree, 'GET', '/nope/x'), null);
  assert.equal(describe(tree, 'DELETE', '/version'), null);
});
