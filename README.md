# OpenClaw Kakao skills (community examples)

Three OpenClaw AgentSkills for KakaoTalk:

- [`kakao-computer-use`](skills/kakao-computer-use/SKILL.md) — **start here (Windows or Mac).** Picks the route automatically: the macOS `kakao-send` scripts when they are available, otherwise OpenClaw's built-in `computer` tool (screenshot → click → type) on a paired node that advertises `computer.act`. On Windows that means the OpenClaw CLI node with the experimental `cua-computer` plugin. Field notes: [`references/windows-notes.md`](skills/kakao-computer-use/references/windows-notes.md).
- [`kakao-send`](skills/kakao-send/SKILL.md) — macOS only: read a KakaoTalk desktop chat's accessibility snapshot, open an exact room, send text, or reply to a unique visible message.
- [`bizchat`](skills/bizchat/SKILL.md) — macOS: read the Kakao Business Center chat list with Playwright CDP, maintain a local inquiry ledger, and send a one-off reply to a uniquely matched customer.

| Your PC | What to install |
|---|---|
| Windows | `kakao-computer-use` + a computer-use node (OpenClaw CLI node, `openclaw plugins enable cua-computer`, started in the logged-in desktop, DPI-aware node.exe) |
| macOS | `kakao-computer-use` + `kakao-send` (the router prefers `kakao-send` on Mac) |

## Who these are for

These are **Korean-UI desktop automation examples**, not a Kakao API. `kakao-send`/`bizchat` are macOS-only; `kakao-computer-use` works wherever the paired node offers OpenClaw computer use (verified on Windows 2026-10-25; the computer-use provider is experimental). UI automation can break when KakaoTalk's layout changes. Always test in your own test chat/account before customer use. Neither skill should be used for unattended sending out of the box.

## Install

Copy only the skill(s) you want into your OpenClaw managed skills directory, usually `~/.openclaw/skills/`, then restart/reload OpenClaw's skill catalog. Review each `SKILL.md` and script before enabling it. Do not copy your private chat database or credentials into the repository.

On a multi-agent gateway, install with the CLI so the target agent sees the skill:

```sh
openclaw skills install ./skills/kakao-computer-use --as kakao-computer-use --agent main
openclaw skills install ./skills/kakao-send --as kakao-send --agent main      # Mac users
```

Or copy manually:

```sh
cp -R skills/kakao-computer-use ~/.openclaw/skills/
cp -R skills/kakao-send ~/.openclaw/skills/
cp -R skills/bizchat ~/.openclaw/skills/
cd ~/.openclaw/skills/bizchat && npm install
```

See each skill for prerequisites and safe use. No credentials are included. The bizchat monitor prints JSON; it does **not** send notifications or schedule itself. Add notifications/scheduling only after choosing your own trusted channel and reviewing privacy requirements.

## Privacy and safety

- Reading chats can change read state; BizChat's list monitor does not click chat entries, but sending does.
- Customer messages saved by BizChat remain in a local JSON file (`~/.openclaw/bizchat-qa.json` by default). Restrict local access, set a retention policy, and obtain any notices/consents your operation requires.
- CDP gives local processes powerful control over the Chrome profile. Bind it to localhost; do not expose port 9222 to a network. Use a dedicated browser profile.
- Once a node's `computer.act` is approved, OpenClaw has no per-action confirmation. `kakao-computer-use` asks before every send and never resends on uncertainty; keep that habit in your own prompts.
- Script output such as `sent_unverified` is **not** delivery confirmation. Inspect the selected chat and outgoing bubble before reporting success or retrying.
- No KakaoTalk or Kakao Corp affiliation is claimed. Follow the service's applicable terms and policies.

## License

MIT; see [LICENSE](LICENSE).
