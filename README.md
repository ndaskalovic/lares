# Lares for Proxmox VE

An AI assistant built into the Proxmox VE web UI. Ask it to check on your server, debug problems, or make changes: start and stop VMs and containers, manage storage, snapshots and backups, and more. It uses your Proxmox login and asks before changing anything.

Works with an Anthropic or DeepSeek API key.

![Lares docked in the Proxmox VE UI](.github/screenshot.jpg)

## Install

**Chrome**

1. Download `lares-x.y.z.zip` from [Releases](../../releases) and unzip it.
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick the unzipped folder.
3. On your Proxmox tab, click the Lares icon → **Enable Lares on this site**, then open **Settings** and add your API key.

**Safari** (unsigned for now)

1. Download `lares-safari-x.y.z-unsigned.zip` from [Releases](../../releases), unzip it, right-click **Lares.app** → **Open**.
2. In Safari, turn on **Develop → Allow unsigned extensions**, then enable Lares in **Settings → Extensions**.

Not affiliated with Proxmox Server Solutions GmbH. Proxmox® is their registered trademark. [Privacy](PRIVACY.md) · [MIT](LICENSE)
