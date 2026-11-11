// Globals that exist at runtime but not in lib.dom.
interface Window {
  /** ExtJS, present on Proxmox pages (MAIN world only). */
  Ext?: any;
  /** Set once the Lares content scripts have booted in this tab. */
  __lares?: boolean;
}
