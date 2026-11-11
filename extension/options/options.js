// @ts-check
// Settings page: provider, keys, model, default mode, consent and memory notes.

import { PROVIDERS } from '../background/llm.js';
import { getSettings, setSettings, allNotes, setNotes } from '../background/store.js';

const $ = (id) => /** @type {HTMLInputElement} */ (document.getElementById(id));
const CUSTOM = '__custom__';
const settings = await getSettings();
const models = { ...settings.models };
let provider = settings.provider;

const radio = (name) => /** @type {HTMLInputElement[]} */ ([...document.querySelectorAll(`input[name=${name}]`)]);
const checked = (name) => radio(name).find((r) => r.checked)?.value;

function renderModels() {
  const select = /** @type {HTMLSelectElement} */ (/** @type {unknown} */ ($('model')));
  const list = PROVIDERS[provider].models;
  const current = models[provider];
  select.replaceChildren(...list.map((m) => new Option(m, m)), new Option('Custom…', CUSTOM));
  const isCustom = !list.includes(current);
  select.value = isCustom ? CUSTOM : current;
  $('custom').value = isCustom ? current : '';
  $('custom-wrap').hidden = !isCustom;
}

function rememberModel() {
  const value = $('model').value;
  models[provider] = value === CUSTOM ? $('custom').value.trim() : value;
}

for (const r of radio('provider')) {
  r.checked = r.value === provider;
  r.onchange = () => { rememberModel(); provider = /** @type {any} */ (r.value); renderModels(); };
}
for (const r of radio('mode')) r.checked = r.value === settings.mode;
$('key-anthropic').value = settings.keys.anthropic;
$('key-deepseek').value = settings.keys.deepseek;
$('consent').checked = settings.consent;
$('model').onchange = () => { $('custom-wrap').hidden = $('model').value !== CUSTOM; };
renderModels();

const notesEl = $('notes');
const notes = await allNotes();
function renderNotes() {
  const origins = Object.keys(notes).filter((o) => notes[o].length);
  if (!origins.length) { notesEl.textContent = 'No notes yet. Lares saves notes about your setup when you ask it to remember something.'; return; }
  notesEl.replaceChildren(...origins.flatMap((origin) => [
    Object.assign(document.createElement('div'), { className: 'hint', textContent: origin }),
    ...notes[origin].map((n) => {
      const row = Object.assign(document.createElement('div'), { className: 'note' });
      const input = Object.assign(document.createElement('input'), { type: 'text', value: n.text });
      input.oninput = () => { n.text = input.value; };
      const del = Object.assign(document.createElement('button'), { textContent: 'Delete' });
      del.onclick = () => { notes[origin] = notes[origin].filter((x) => x !== n); renderNotes(); };
      row.append(Object.assign(document.createElement('span'), { className: 'hint', textContent: n.id }), input, del);
      return row;
    }),
  ]));
}
renderNotes();

$('save').onclick = async () => {
  rememberModel();
  await setSettings({
    provider,
    keys: { anthropic: $('key-anthropic').value.trim(), deepseek: $('key-deepseek').value.trim() },
    models,
    mode: /** @type {any} */ (checked('mode')),
    consent: $('consent').checked,
  });
  for (const [origin, list] of Object.entries(notes)) await setNotes(origin, list);
  $('status').textContent = 'Saved.';
  setTimeout(() => { $('status').textContent = ''; }, 2000);
};
