// Loads content scripts (classic, shared global scope) into one vm context and returns the named globals.
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../extension/', import.meta.url);

/**
 * @param {string[]} files paths relative to extension/
 * @param {string[]} names globals to return
 * @param {object} [globals] extra globals for the context
 */
export function loadClassic(files, names, globals = {}) {
  const ctx = vm.createContext({ console, URLSearchParams, TextDecoder, setTimeout, clearTimeout, ...globals });
  for (const f of files) vm.runInContext(fs.readFileSync(new URL(f, root), 'utf8'), ctx, { filename: f });
  return vm.runInContext(`({${names.join(',')}})`, ctx);
}
