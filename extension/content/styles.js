// @ts-check
// Panel styles, injected into the shadow root. Colors follow the Proxmox crisp and proxmox-dark themes.

const PANEL_CSS = `
:host { all: initial; }
:host {
  --bg: #fff; --bg2: #f5f5f5; --bg3: #fafafa; --fg: #333; --muted: #777; --border: #cfcfcf;
  --accent: #3892d4; --accent-strong: #157fcc; --danger: #c9302c; --user: #e8f2fb;
  font: 13px/17px helvetica, arial, verdana, sans-serif; color: var(--fg);
}
:host(.dark) {
  --bg: hsl(0,0%,15%); --bg2: hsl(0,0%,20%); --bg3: hsl(0,0%,10%); --fg: hsl(0,0%,95%); --muted: hsl(0,0%,65%);
  --border: hsl(0,0%,40%); --accent: hsl(205,100%,32%); --accent-strong: hsl(205,100%,40%); --danger: #d9534f; --user: hsl(205,40%,22%);
}
* { box-sizing: border-box; }
button, select, textarea { font: inherit; color: inherit; }
button { cursor: pointer; background: var(--bg2); border: 1px solid var(--border); border-radius: 3px; padding: 3px 8px; }
button:hover { border-color: var(--accent); }
button.primary { background: var(--accent); border-color: var(--accent-strong); color: #fff; }

.tab {
  position: fixed; right: 0; top: 50%; transform: translateY(-50%); z-index: 2147483000;
  writing-mode: vertical-rl; padding: 10px 5px; border-radius: 4px 0 0 4px; border-right: 0;
  background: var(--accent); border-color: var(--accent-strong); color: #fff; letter-spacing: 1px;
}
:host(.open) .tab { display: none; }
.panel {
  position: fixed; top: 0; right: 0; height: 100vh; width: var(--w, 380px); z-index: 2147483000;
  display: none; flex-direction: column; background: var(--bg); border-left: 1px solid var(--border);
}
:host(.open) .panel { display: flex; }
.resize { position: absolute; left: -3px; top: 0; bottom: 0; width: 6px; cursor: ew-resize; }

header { display: flex; align-items: center; gap: 6px; padding: 6px 8px; background: var(--bg2); border-bottom: 1px solid var(--border); }
header .title { font-weight: bold; }
header .model { color: var(--muted); font-size: 11px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
header select { max-width: 110px; background: var(--bg); border: 1px solid var(--border); border-radius: 3px; }
.mode { display: flex; }
.mode button { border-radius: 0; padding: 2px 6px; }
.mode button:first-child { border-radius: 3px 0 0 3px; }
.mode button:last-child { border-radius: 0 3px 3px 0; border-left: 0; }
.mode button.on { background: var(--accent); border-color: var(--accent-strong); color: #fff; }

.notice { padding: 6px 10px; background: var(--bg3); border-bottom: 1px solid var(--border); color: var(--muted); }
.notice button { margin-left: 6px; }
.messages { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.msg { max-width: 100%; overflow-wrap: anywhere; }
.msg.user { align-self: flex-end; background: var(--user); padding: 6px 9px; border-radius: 6px; max-width: 85%; white-space: pre-wrap; }
.msg.error { color: var(--danger); }
.msg p { margin: 0 0 6px; }
.msg p:last-child { margin-bottom: 0; }
.msg ul, .msg ol { margin: 0 0 6px; padding-left: 20px; }
.msg table { border-collapse: collapse; margin: 0 0 6px; display: block; overflow-x: auto; }
.msg th, .msg td { border: 1px solid var(--border); padding: 2px 6px; text-align: left; white-space: nowrap; }
.msg th { background: var(--bg2); }
.msg pre { background: var(--bg3); border: 1px solid var(--border); padding: 6px; padding-right: 54px; position: relative; overflow-x: auto; margin: 0 0 6px; }
.msg pre .copy { position: absolute; top: 4px; right: 4px; font: 11px/14px helvetica, arial, sans-serif; padding: 1px 6px; }
code { font: 12px/16px monospace; }
.msg a { color: var(--accent-strong); }
.context { color: var(--muted); font-size: 11px; display: block; }

.msg.streaming > :last-child::after, .msg.streaming:empty::after {
  content: ''; display: inline-block; width: 7px; height: 13px; margin-left: 3px; vertical-align: -2px; border-radius: 2px;
  background: #f08a24; box-shadow: 0 0 6px #f08a24; animation: ember 1.1s ease-in-out infinite;
}
@keyframes ember { 0%, 100% { opacity: 1; } 50% { opacity: .25; box-shadow: none; } }

.status { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 12px; overflow: hidden; }
.status .label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status .label::after { content: ''; animation: dots 1.4s steps(4) infinite; }
@keyframes dots { 0% { content: ''; } 25% { content: '.'; } 50% { content: '..'; } 75% { content: '...'; } }
.flame { width: 14px; height: 19px; flex: none; transform-origin: 50% 100%; animation: flicker 0.9s ease-in-out infinite alternate;
  filter: drop-shadow(0 0 3px rgba(240,138,36,.7)); }
.flame .outer { fill: #f08a24; }
.flame .inner { fill: #ffd36e; transform-origin: 50% 100%; animation: flicker-inner 0.6s ease-in-out infinite alternate; }
@keyframes flicker {
  0% { transform: scale(1, 1) skewX(0deg); }
  35% { transform: scale(.94, 1.08) skewX(-3deg); }
  70% { transform: scale(1.04, .95) skewX(2deg); }
  100% { transform: scale(.97, 1.04) skewX(-1deg); }
}
@keyframes flicker-inner { from { transform: scaleY(.85); opacity: .8; } to { transform: scaleY(1.1); opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .flame, .flame .inner, .status .label::after, .msg.streaming > :last-child::after { animation: none; } }

details.tool { border: 1px solid var(--border); border-radius: 3px; background: var(--bg3); }
details.tool summary { padding: 3px 7px; cursor: pointer; font: 12px/16px monospace; color: var(--muted); }
details.tool.err summary { color: var(--danger); }
details.tool pre { margin: 0; padding: 6px 7px; max-height: 240px; overflow: auto; border-top: 1px solid var(--border); font: 11px/15px monospace; white-space: pre-wrap; }

.card { border: 1px solid var(--border); border-left: 3px solid var(--accent); border-radius: 3px; padding: 8px; background: var(--bg2); }
.card.destructive { border-left-color: var(--danger); }
.card .head { font-weight: bold; margin-bottom: 4px; }
.card .reason { margin-bottom: 6px; }
.card table { border-collapse: collapse; margin: 6px 0; font: 12px/16px monospace; }
.card td { padding: 1px 8px 1px 0; vertical-align: top; overflow-wrap: anywhere; }
.card .actions { display: flex; gap: 6px; }
.card.destructive .approve { background: var(--danger); border-color: var(--danger); color: #fff; }
.card .decided { color: var(--muted); }

footer { display: flex; gap: 6px; padding: 8px; border-top: 1px solid var(--border); background: var(--bg2); }
textarea { flex: 1; resize: none; background: var(--bg); border: 1px solid var(--border); border-radius: 3px; padding: 5px 7px; }
textarea:disabled { opacity: .6; }
`;
