# Field notes — OpenClaw computer use on Windows (verified 2026-10-25)

Environment: OpenClaw gateway 2026.10.3 (Hostinger VPS) · Windows node host OpenClaw 2026.10.7 on Node 24.22 · `cua-computer` plugin (experimental) · Windows 365 Cloud PC at 3840×2100, 200% scaling · KakaoTalk for Windows (Korean UI).

## What works
- `screenshot` (full desktop after the DPI fix), `left_click`, `double_click`, `scroll`, `wait`, `type` (Korean + emoji), `key` `Return`.
- Self-chat path: 친구 tab → double-click own profile → self chat opens directly.
- End-to-end: typed "OpenClaw 컴퓨터유즈 테스트 ✅", pressed Return once, bubble appeared, input cleared.

## What does not
- `list_windows`, window/element targeting, `hold_key`, modifier-held clicks/scroll/drag (desktop SDK limits). Work from screenshots and coordinates.
- `key` with digits/punctuation is rejected — put such text in `type`.
- Only the primary display is controlled.

## Known traps
| Symptom | Cause | Fix |
|---|---|---|
| Screenshot shows huge icons, no taskbar; clicks land in the wrong place | node.exe not DPI-aware at >100% scaling → capture is the top-left logical-size region only | User runs `reg add "HKCU\Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Layers" /v "C:\Program Files\nodejs\node.exe" /t REG_SZ /d "~ HIGHDPIAWARE" /f`, then restarts the node. Display scaling stays as is. |
| "computer tool unavailable" / node lacks computer.act | You targeted the Companion app node, or capability approval is pending | Target the CLI node that advertises `computer.act`; ask the user to run `openclaw nodes approve <id>` |
| Node sees nothing / can't control | Node was started from a remote (SSH) session | It must run in the logged-in desktop session (Startup-folder shortcut or a PowerShell window there) |
| Double-click on desktop shortcut does nothing | KakaoTalk already running in the tray, or the frame was cropped | Use the taskbar/tray icon; verify the screenshot shows the taskbar |
| Tool returns a foreground-check warning after double-click but the room opened | Window activation timing | Take a fresh screenshot and trust what you see, not the warning |

## Safety reminders
There is no per-action confirmation once `computer.act` is approved. The skill itself must ask before sending and must never resend on uncertainty.
