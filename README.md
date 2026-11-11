# Lares for Proxmox VE

An AI copilot that lives inside the Proxmox VE web UI. Ask it to check, debug or change things on your server; it works through the Proxmox API with **your own login**, so it can do exactly what you can and nothing more. Bring your own Anthropic or DeepSeek API key.

- Native-looking side panel docked on the right of the Proxmox UI (light and dark themes)
- Uses your logged-in session: no API tokens to create
- **Manual mode** asks before every change; **Auto mode** runs changes but still asks before destructive ones
- Follows tasks to completion and reports the real outcome
- Remembers notes about your setup and keeps past chats, all stored locally
- Small, dependency-free code; prompt caching keeps costs down

> Not affiliated with or endorsed by Proxmox Server Solutions GmbH. Proxmox® is a registered trademark of Proxmox Server Solutions GmbH.

## Install

Chrome Web Store: coming soon. Until then:

1. Download or clone this repository.
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked** and select the `extension/` folder.

Safari: see [docs/safari.md](docs/safari.md).

## Setup

1. Open your Proxmox VE web UI (e.g. `https://192.168.1.10:8006` or your reverse-proxy domain) and log in.
2. Click the Lares toolbar icon → **Enable Lares on this site** and allow access to that site.
3. Open **Settings**: choose Anthropic or DeepSeek, paste your API key, pick a model, read the privacy notice and tick the consent box.
4. Click the **Lares** tab on the right edge of the Proxmox UI and start asking.

## Modes and safety

| Call | Manual | Auto |
|---|---|---|
| Reads (GET) | run | run |
| Changes (POST/PUT) | ask | run |
| Destructive (DELETE, stop, reboot, rollback, migrate, resize, firewall, network, users/ACLs, …) | ask | ask |
| Shells, consoles, `execute`, guest-agent exec, auth endpoints | blocked | blocked |

- Approval is always a click on a card in the panel; the model can never approve its own action.
- The guard is enforced in code (`extension/background/guard.js`), not by the prompt.
- Everything the API returns (VM names, notes, logs) is treated as data, never as instructions.
- Proxmox permissions are the real boundary. For extra safety, use Lares while logged in as a least-privilege Proxmox user.

## How it keeps costs down

The system prompt (rules plus a compact index of about 200 API endpoints built from your server's own schema) and the tool definitions never change within a chat, and history is append-only, so after the first message the large prefix is served from the provider's prompt cache. DeepSeek caches automatically.

## Development

```sh
npm install          # dev dependencies only: typescript, @types/chrome
npm test             # node --test, pure modules
npm run check        # tsc type-check of the JSDoc-annotated JS
scripts/package.sh   # zip for the Chrome Web Store → dist/
```

No build step: `extension/` is exactly what Chrome loads. Manual browser checks are in [docs/manual-test.md](docs/manual-test.md).

```
extension/
  manifest.json
  background/   service worker: agent loop, LLM client, guard, prompt, storage, site registration
  content/      in-page: panel UI, Proxmox API client, schema index, markdown, ExtJS viewport patch
  popup/        enable Lares on the current site
  options/      provider, key, model, mode, consent, memory notes
test/           unit tests and fixtures
docs/           design, plan, manual tests, Safari, store listing
```

## License

MIT
