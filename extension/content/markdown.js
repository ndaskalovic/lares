// @ts-check
// Minimal markdown → HTML. Everything is escaped first; only http(s) links become anchors.

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Inline formatting on already-escaped text. */
function inline(s) {
  const codes = [];
  return s
    .replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
}

const cells = (row) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => inline(c.trim()));
const isTableSeparator = (line) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line ?? '');

/** @param {string} src @returns {string} */
function renderMarkdown(src) {
  const out = [];
  let para = [];
  let list = null; // {tag, items}
  let code = null; // lines inside a fence
  const flush = () => {
    if (para.length) out.push(`<p>${para.map(inline).join('<br>')}</p>`);
    if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`);
    para = [];
    list = null;
  };
  const lines = escapeHtml(src).split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (code) {
      if (line.startsWith('```')) { out.push(`<pre><code>${code.map((l) => `${l}\n`).join('')}</code></pre>`); code = null; }
      else code.push(line);
      continue;
    }
    let m;
    if (line.startsWith('```')) { flush(); code = []; }
    else if (line.trim().startsWith('|') && isTableSeparator(lines[i + 1])) {
      flush();
      const head = cells(line).map((c) => `<th>${c}</th>`).join('');
      const rows = [];
      for (i += 2; i < lines.length && lines[i].trim().startsWith('|'); i++) rows.push(`<tr>${cells(lines[i]).map((c) => `<td>${c}</td>`).join('')}</tr>`);
      i--;
      out.push(`<table><thead><tr>${head}</tr></thead><tbody>${rows.join('')}</tbody></table>`);
    }
    else if (!line.trim()) flush();
    else if ((m = /^#{1,3}\s+(.*)$/.exec(line))) { flush(); out.push(`<p><strong>${inline(m[1])}</strong></p>`); }
    else if ((m = /^\s*(?:([-*])|\d+\.)\s+(.*)$/.exec(line))) {
      const tag = m[1] ? 'ul' : 'ol';
      if (para.length || list?.tag !== tag) flush();
      list ??= { tag, items: [] };
      list.items.push(m[2]);
    } else {
      if (list) flush();
      para.push(line);
    }
  }
  if (code) out.push(`<pre><code>${code.map((l) => `${l}\n`).join('')}</code></pre>`);
  flush();
  return out.join('');
}
