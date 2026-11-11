import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadClassic } from './load-classic.js';

const { renderMarkdown: md } = loadClassic(['content/markdown.js'], ['renderMarkdown']);

test('HTML is escaped', () => {
  const out = md('<img src=x onerror=alert(1)>');
  assert.match(out, /&lt;img/);
  assert.doesNotMatch(out, /<img/);
});

test('only http(s) links become anchors', () => {
  assert.doesNotMatch(md('[x](javascript:alert(1))'), /href="javascript/);
  assert.equal(md('[docs](https://pve.proxmox.com/wiki)'), '<p><a href="https://pve.proxmox.com/wiki" target="_blank" rel="noopener noreferrer">docs</a></p>');
});

test('fenced code is escaped and not formatted', () => {
  assert.equal(md('```\n<b>**x**</b>\n```'), '<pre><code>&lt;b&gt;**x**&lt;/b&gt;\n</code></pre>');
});

test('lists', () => {
  assert.equal(md('- a\n- b'), '<ul><li>a</li><li>b</li></ul>');
  assert.equal(md('1. a\n2. b'), '<ol><li>a</li><li>b</li></ol>');
});

test('inline bold and code', () => {
  assert.equal(md('**x** and `y`'), '<p><strong>x</strong> and <code>y</code></p>');
  assert.equal(md('`**not bold**`'), '<p><code>**not bold**</code></p>');
});

test('headings and paragraphs', () => {
  assert.equal(md('## Title\n\nline one\nline two'), '<p><strong>Title</strong></p><p>line one<br>line two</p>');
});

test('attribute injection through link text or url is escaped', () => {
  assert.doesNotMatch(md('[a](https://x.example/"onmouseover="alert(1))'), /"onmouseover="/);
});

test('tables', () => {
  assert.equal(
    md('| Device | Size |\n|---|---:|\n| sda | **16 TB** |\n| sdb | 1 TB |'),
    '<table><thead><tr><th>Device</th><th>Size</th></tr></thead><tbody><tr><td>sda</td><td><strong>16 TB</strong></td></tr><tr><td>sdb</td><td>1 TB</td></tr></tbody></table>',
  );
});

test('a lone pipe line is not a table', () => {
  assert.equal(md('a | b'), '<p>a | b</p>');
});
