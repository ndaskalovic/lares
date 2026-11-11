# Chrome Web Store listing

**Name:** Lares for Proxmox VE
**Summary:** AI copilot for the Proxmox VE web UI. Bring your own Anthropic or DeepSeek API key.
**Single purpose:** AI assistant for the Proxmox VE web UI.

## Permission justifications
- `storage`: stores the user's settings, API key, chats and notes locally.
- `unlimitedStorage`: chat history can exceed the default quota.
- `scripting`: injects the assistant panel into the Proxmox sites the user enables.
- `activeTab`: reads the current tab's address in the popup so the user can enable Lares on that site.
- Host `https://api.anthropic.com/*`, `https://api.deepseek.com/*`: sends chat requests to the AI provider the user selected, with the user's key.
- Optional host `https://*/*`: requested at runtime only for the specific Proxmox site the user enables (Proxmox runs on user-chosen hosts and ports).

## Remote code
No remote code. The extension ships a fixed set of tools; the AI model only chooses arguments for one packaged Proxmox API tool, and every change is checked by a packaged guard and confirmed by the user according to the mode.

## Data disclosures
- Website content: Proxmox data read during a chat is sent to the selected AI provider to answer the user.
- Authentication information: the user's AI provider API key, stored locally only.
- Not sold, not used for unrelated purposes, not used for creditworthiness.

**Privacy policy:** PRIVACY.md in the GitHub repository.
