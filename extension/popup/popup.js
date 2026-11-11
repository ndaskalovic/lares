// @ts-check
// Toolbar popup: enable or disable Lares on the current Proxmox site.
export {};

const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));
$('settings').onclick = () => chrome.runtime.openOptionsPage();

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const url = tab?.url ? new URL(tab.url) : null;
const actions = $('actions');

function button(label, primary, onclick) {
  const b = document.createElement('button');
  b.textContent = label;
  if (primary) b.className = 'primary';
  b.onclick = onclick;
  actions.append(b);
}

async function render() {
  actions.replaceChildren();
  if (!url || url.protocol !== 'https:') {
    $('origin').textContent = 'Lares works on https Proxmox pages.';
    return;
  }
  const origin = url.origin;
  $('origin').textContent = origin;
  const sites = await chrome.runtime.sendMessage({ type: 'sites' });
  if (Array.isArray(sites) && sites.includes(origin)) {
    actions.append('Enabled ✓');
    button('Disable', false, async () => {
      await chrome.permissions.remove({ origins: [`${origin}/*`] });
      await chrome.runtime.sendMessage({ type: 'disable', origin });
      render();
    });
  } else {
    button('Enable Lares on this site', true, async () => {
      if (!(await chrome.permissions.request({ origins: [`${origin}/*`] }))) return;
      await chrome.runtime.sendMessage({ type: 'enable', origin, tabId: tab.id });
      window.close();
    });
  }
}
render();
