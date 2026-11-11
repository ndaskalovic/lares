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
  for (const line of escapeHtml(src).split('\n')) {
    if (code) {
      if (line.startsWith('```')) { out.push(`<pre><code>${code.map((l) => `${l}\n`).join('')}</code></pre>`); code = null; }
      else code.push(line);
      continue;
    }
    let m;
    if (line.startsWith('```')) { flush(); code = []; }
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
