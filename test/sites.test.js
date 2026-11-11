import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeChrome } from './fake-chrome.js';

const chrome = installFakeChrome();
const { enableSite, disableSite, reconcileSites, CONTENT_FILES } = await import('../extension/background/sites.js');
const { getSites, setSites } = await import('../extension/background/store.js');
beforeEach(() => chrome._.reset());

const A = 'https://10.0.0.5:8006';
const B = 'https://pve.example.com';

test('enableSite registers both scripts and injects into the tab', async () => {
  await enableSite(A, 7);
  const main = chrome._.registered.get(`lares-main:${A}`);
  const iso = chrome._.registered.get(`lares:${A}`);
  assert.deepEqual(iso.matches, [`${A}/*`]);
  assert.deepEqual(iso.js, CONTENT_FILES);
  assert.equal(iso.persistAcrossSessions, true);
  assert.equal(main.world, 'MAIN');
  assert.deepEqual(main.js, ['content/viewport.js']);
  const files = chrome._.executed.filter((e) => e.files).map((e) => [e.target.tabId, e.world ?? 'ISOLATED', e.files.length]);
  assert.deepEqual(files, [[7, 'MAIN', 1], [7, 'ISOLATED', CONTENT_FILES.length]]);
  assert.deepEqual(await getSites(), [A]);
});

test('enableSite twice keeps one entry', async () => {
  await enableSite(A);
  await enableSite(A);
  assert.deepEqual(await getSites(), [A]);
  assert.equal(chrome._.registered.size, 2);
});

test('reconcileSites drops origins without permission', async () => {
  await setSites([A, B]);
  chrome._.granted.add(`${A}/*`);
  await reconcileSites();
  assert.deepEqual(await getSites(), [A]);
  assert.deepEqual([...chrome._.registered.keys()].sort(), [`lares-main:${A}`, `lares:${A}`]);
});

test('disableSite unregisters and forgets the origin', async () => {
  await enableSite(A);
  await disableSite(A);
  assert.equal(chrome._.registered.size, 0);
  assert.deepEqual(await getSites(), []);
});
