// @ts-check
// MAIN world: makes the ExtJS viewport leave room for the Lares panel, so the Proxmox UI reflows instead of being covered.

(() => {
  const root = document.documentElement;
  const panelWidth = () => Number(root.getAttribute('data-lares-width')) || 0;
  let tries = 0;
  const patch = () => {
    const El = window.Ext?.dom?.Element;
    if (!El?.getViewportWidth) {
      if (++tries < 150) setTimeout(patch, 200);
      return;
    }
    const original = El.getViewportWidth.bind(El);
    El.getViewportWidth = () => original() - panelWidth();
    const relayout = () => window.dispatchEvent(new Event('resize'));
    new MutationObserver(relayout).observe(root, { attributes: true, attributeFilter: ['data-lares-width'] });
    if (panelWidth()) relayout();
  };
  patch();
})();
