# Manual test checklist

Run on a real Proxmox VE server. Do reads against real resources; do writes and destructive checks only on a throwaway CT/VM created for the purpose.

## Blocking unknowns (spec §10)
- [ ] Same-origin API calls from the panel work on a self-signed `https://IP:8006` page (session cookie is sent).
- [ ] Same through a reverse-proxy domain.
- [ ] Opening the panel shrinks the Proxmox UI (no overlap); closing restores it; resizing the panel reflows it.
- [ ] Typing in the panel doesn't trigger Proxmox keyboard shortcuts; focus stays in the panel.
- [ ] A long answer (1–3 min with tool calls) completes without "Connection to Lares was lost".
- [ ] `/pve-docs/api-viewer/apidoc.js` loads (no "API index unavailable" notice).

## Flows
- [ ] Enable on site from the popup; reload: the Lares tab appears. Disable: it's gone after reload.
- [ ] Theme: light, dark and auto each match Proxmox.
- [ ] Without key/consent the input is disabled with an "Open settings" button; after saving settings it becomes usable without reload.
- [ ] Read: "What VMs and containers are running?" gives a correct answer citing real data.
- [ ] Ambiguous request ("restart the web server" with two candidates) gets a clarifying question.
- [ ] Manual mode: starting a throwaway CT shows a confirm card; Approve runs it and the reply reports the task's exit status.
- [ ] Deny: the model acknowledges and doesn't retry.
- [ ] Auto mode: starting the throwaway CT runs without a card; stopping it still shows a red card.
- [ ] Waiting >60 s on a confirm card, then approving, still works (heartbeat).
- [ ] Log out of Proxmox in another tab, ask a question: the reply says the session expired.
- [ ] Reopen an earlier chat from the history menu and continue it.
- [ ] "Remember that CT 108 is my DNS server" → note appears in settings and in the next chat's knowledge.
- [ ] Prompt cache: in the service worker console, the second message's `usage` shows `cache_read_input_tokens > 0`.
- [ ] DeepSeek provider: a read question works end to end.
- [ ] Haiku 5.5 accepts adaptive thinking (if it returns 400, record it for a model-table fix).
