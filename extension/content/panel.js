// @ts-check
// The chat panel: a Shadow DOM sidebar docked on the right of the Proxmox UI.

const MIN_WIDTH = 300;
const MAX_WIDTH = 700;
const RESULT_DISPLAY_CHARS = 2000;

/** Reads a page localStorage value; storage can be unavailable. */
function pageGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function pageSet(key, value) { try { localStorage.setItem(key, value); } catch { /* ignore */ } }

/** @template {keyof HTMLElementTagNameMap} K @param {K} tag @param {string} [cls] @param {string} [text] */
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

/** Renders markdown into `target` and gives every code block a Copy button. */
function setMarkdown(target, text) {
  target.innerHTML = renderMarkdown(text);
  for (const pre of target.querySelectorAll('pre')) {
    const code = pre.querySelector('code')?.textContent ?? '';
    const button = el('button', 'copy', 'Copy');
    button.onclick = async () => {
      try {
        await navigator.clipboard.writeText(code.replace(/\n$/, ''));
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Copy failed';
      }
      setTimeout(() => { button.textContent = 'Copy'; }, 1500);
    };
    pre.append(button);
  }
}

const toolLabel = (name, input = {}) => {
  if (name === 'pve') return `${input.method} ${input.path}`;
  if (name === 'pve_describe') return `describe ${input.method} ${input.path}`;
  if (name === 'remember') return `remember: ${input.note}`;
  if (name === 'forget') return `forget ${input.id}`;
  return name;
};

class Panel {
  /**
   * @param {{onSend: (text: string) => void, onStop: () => void, onNew: () => void, onOpen: (id: string) => void,
   *   onMode: (mode: string) => void, onSummarize: () => void, onToggle: (open: boolean) => void}} h
   */
  constructor(h) {
    this.h = h;
    this.host = el('div');
    this.host.id = 'lares-root';
    const root = this.host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${PANEL_CSS}</style>
      <button class="tab" title="Open Lares">Lares</button>
      <aside class="panel">
        <div class="resize"></div>
        <header>
          <span class="title">Lares</span><span class="model"></span>
          <div class="mode"><button data-mode="manual" title="Ask before every change">Manual</button><button data-mode="auto" title="Run changes without asking; destructive actions still ask">Auto</button></div>
          <select class="history" title="Chats"></select>
          <button class="new" title="New chat">+</button>
          <button class="close" title="Close">×</button>
        </header>
        <div class="notice" hidden></div>
        <main class="messages"></main>
        <footer><textarea rows="3" placeholder="Ask Lares about your Proxmox server…"></textarea><button class="send primary">Send</button></footer>
      </aside>`;
    /** @type {<T extends Element = HTMLElement>(s: string) => T} */
    const $ = (s) => /** @type {any} */ (root.querySelector(s));
    this.$ = $;
    this.messages = $('.messages');
    this.input = /** @type {HTMLTextAreaElement} */ ($('textarea'));
    this.sendBtn = $('.send');
    this.noticeEl = $('.notice');
    /** @type {Map<string, HTMLDetailsElement>} */
    this.tools = new Map();
    /** Undecided confirm cards: each entry cancels its card. */
    this.cards = new Set();
    this.input.disabled = true; // until the first state arrives
    this.running = false;
    this.current = null;
    this.currentText = '';
    /** Shown whenever no setup hint is: e.g. the API index could not be loaded. */
    this.indexNotice = null;

    $('.tab').onclick = () => this.setOpen(true);
    $('.close').onclick = () => this.setOpen(false);
    $('.new').onclick = () => h.onNew();
    $('.history').onchange = (e) => h.onOpen(/** @type {HTMLSelectElement} */ (e.target).value);
    for (const b of root.querySelectorAll('.mode button')) b.addEventListener('click', () => this.chooseMode(b.getAttribute('data-mode')));
    this.sendBtn.onclick = () => (this.running ? h.onStop() : this.submit());
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!this.running) this.submit(); }
    });
    this.initResize($('.resize'));
    this.initTheme();
    this.setWidth(Number(pageGet('lares-width')) || 380);
    document.body.append(this.host);
  }

  initTheme() {
    const cookie = /(?:^|;\s*)PVEThemeCookie=([^;]*)/.exec(document.cookie)?.[1];
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => this.host.classList.toggle('dark', cookie === 'proxmox-dark' || ((!cookie || cookie === 'auto') && media.matches));
    media.addEventListener('change', apply);
    apply();
  }

  initResize(handle) {
    handle.addEventListener('pointerdown', (e) => {
      handle.setPointerCapture(e.pointerId);
      const move = (ev) => this.setWidth(window.innerWidth - ev.clientX);
      const up = () => { handle.removeEventListener('pointermove', move); pageSet('lares-width', String(this.width)); };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up, { once: true });
    });
  }

  setWidth(w) {
    this.width = Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w)));
    this.host.style.setProperty('--w', `${this.width}px`);
    if (this.isOpen) document.documentElement.setAttribute('data-lares-width', String(this.width));
  }

  /** Opens or closes the panel; the MAIN-world viewport patch follows the data attribute. */
  setOpen(open) {
    if (open === this.isOpen) return;
    this.isOpen = open;
    this.host.classList.toggle('open', open);
    pageSet('lares-open', open ? '1' : '0');
    if (open) document.documentElement.setAttribute('data-lares-width', String(this.width));
    else document.documentElement.removeAttribute('data-lares-width');
    this.h.onToggle(open);
    if (open) this.input.focus();
  }

  restore() { this.setOpen(pageGet('lares-open') === '1'); }

  chooseMode(mode) {
    if (mode === this.mode) return;
    if (mode === 'auto' && pageGet('lares-auto-warned') !== '1') {
      if (!confirm('Auto mode runs changes without asking. Destructive actions still ask. Continue?')) return;
      pageSet('lares-auto-warned', '1');
    }
    this.showMode(mode);
    this.h.onMode(mode);
  }

  showMode(mode) {
    this.mode = mode;
    for (const b of this.host.shadowRoot.querySelectorAll('.mode button')) b.classList.toggle('on', b.getAttribute('data-mode') === mode);
  }

  submit() {
    const text = this.input.value.trim();
    if (!text) return;
    this.input.value = '';
    this.messages.append(el('div', 'msg user', text));
    this.setRunning(true);
    this.scroll();
    this.h.onSend(text);
  }

  setRunning(running) {
    this.running = running;
    this.sendBtn.textContent = running ? 'Stop' : 'Send';
  }

  /** Renders a full state from the service worker (chat history, chats, mode, readiness). */
  setState(s) {
    this.showMode(s.mode);
    this.$('.model').textContent = s.model;
    this.input.disabled = !s.ready;
    this.input.placeholder = s.ready ? 'Ask Lares about your Proxmox server…' : s.setupHint;
    if (!s.ready) {
      const b = el('button', '', 'Open settings');
      b.onclick = () => chrome.runtime.sendMessage({ type: 'openOptions' });
      this.notice(s.setupHint, b);
    } else this.notice(this.indexNotice ?? null);
    if (!s.chat) return; // mid-turn refresh: keep the live conversation
    const history = /** @type {HTMLSelectElement} */ (this.$('.history'));
    history.replaceChildren(...(s.chats.some((c) => c.id === s.chat.id) ? [] : [new Option('New chat', s.chat.id)]),
      ...s.chats.map((c) => new Option(c.title, c.id)));
    history.value = s.chat.id;
    this.cancelCards();
    this.setRunning(false);
    this.renderHistory(s.chat.messages);
  }

  renderHistory(messages) {
    this.messages.replaceChildren();
    this.tools.clear();
    this.current = null;
    for (const m of messages) {
      for (const b of m.content) {
        if (m.role === 'user' && b.type === 'text') {
          if (b.text.startsWith('[Selected in UI: ')) continue;
          this.messages.append(el('div', 'msg user', b.text));
        } else if (b.type === 'text' && b.text) {
          const div = el('div', 'msg');
          setMarkdown(div, b.text);
          this.messages.append(div);
        } else if (b.type === 'tool_use') {
          this.addTool(b.id, b.name, b.input);
        } else if (b.type === 'tool_result') {
          this.toolDone({ id: b.tool_use_id, content: b.content, isError: b.is_error });
        }
      }
    }
    this.scroll();
  }

  /** Appends streamed assistant text, re-rendering markdown at most every 50 ms. */
  delta(text) {
    if (!this.current) {
      this.current = el('div', 'msg');
      this.currentText = '';
      this.messages.append(this.current);
    }
    this.currentText += text;
    this.renderTimer ??= setTimeout(() => {
      this.renderTimer = null;
      if (this.current) setMarkdown(this.current, this.currentText);
      this.scroll();
    }, 50);
  }

  /** The model call is being retried: drop the partial text. */
  reset() {
    this.current?.remove();
    this.current = null;
  }

  addTool(id, name, input) {
    const d = /** @type {HTMLDetailsElement} */ (el('details', 'tool'));
    d.append(el('summary', '', toolLabel(name, input)));
    this.messages.append(d);
    this.tools.set(id, d);
    return d;
  }

  /**
   * Shows a tool call; for `confirm` waits for the user's decision.
   * @returns {Promise<boolean>} whether the call may run
   */
  tool(m) {
    if (this.current) setMarkdown(this.current, this.currentText);
    this.current = null;
    const d = this.addTool(m.id, m.name, m.input);
    this.scroll();
    if (m.decision === 'block') return Promise.resolve(false);
    if (m.decision !== 'confirm') return Promise.resolve(true);
    const card = el('div', `card ${m.cls === 'destructive' ? 'destructive' : 'write'}`);
    card.append(el('div', 'head', m.cls === 'destructive' ? 'Approve this destructive action?' : 'Approve this change?'));
    if (m.reason) card.append(el('div', 'reason', m.reason));
    card.append(el('code', '', `${m.input.method} ${m.input.path}`));
    const params = Object.entries(m.input.params ?? {});
    if (params.length) {
      const table = el('table');
      for (const [k, v] of params) {
        const tr = el('tr');
        tr.append(el('td', '', k), el('td', '', String(v)));
        table.append(tr);
      }
      card.append(table);
    }
    const actions = el('div', 'actions');
    const approve = el('button', 'approve primary', 'Approve');
    const deny = el('button', 'deny', 'Deny');
    actions.append(approve, deny);
    card.append(actions);
    d.before(card);
    this.scroll();
    return new Promise((resolve) => {
      const decide = (ok, label = ok ? 'Approved' : 'Denied') => {
        this.cards.delete(cancel);
        actions.replaceWith(el('div', 'decided', label));
        resolve(ok);
      };
      const cancel = () => decide(false, 'Cancelled');
      this.cards.add(cancel);
      approve.onclick = () => decide(true);
      deny.onclick = () => decide(false);
    });
  }

  /** A stopped or lost turn must not leave live Approve buttons behind. */
  cancelCards() {
    for (const cancel of [...this.cards]) cancel();
  }

  toolDone({ id, content, isError }) {
    const d = this.tools.get(id);
    if (!d) return;
    d.classList.toggle('err', !!isError);
    d.querySelector('pre')?.remove();
    const text = String(content);
    d.append(el('pre', '', text.length > RESULT_DISPLAY_CHARS ? `${text.slice(0, RESULT_DISPLAY_CHARS)}…` : text));
  }

  done(m) {
    this.cancelCards();
    if (this.current) setMarkdown(this.current, this.currentText);
    this.current = null;
    this.setRunning(false);
    if (m.long) {
      const b = el('button', '', 'Continue in a new chat with a summary');
      b.onclick = () => { this.notice(null); this.h.onSummarize(); };
      this.notice('This chat is getting long.', b);
    }
  }

  error(message) {
    this.messages.append(el('div', 'msg error', message));
    this.scroll();
  }

  /** The connection to the service worker dropped. */
  lost() {
    this.cancelCards();
    if (this.running) this.error('Connection to Lares was lost. Send your message again to reconnect.');
    this.setRunning(false);
  }

  /** @param {string|null} text @param {HTMLElement} [action] */
  notice(text, action) {
    this.noticeEl.hidden = !text;
    this.noticeEl.replaceChildren(...(text ? [text] : []), ...(action ? [action] : []));
  }

  scroll() { this.messages.scrollTop = this.messages.scrollHeight; }
}
