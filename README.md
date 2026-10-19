# OpenClaw Kakao skills (community examples)

Two independent OpenClaw AgentSkills for KakaoTalk on macOS:

- [`kakao-send`](skills/kakao-send/SKILL.md): read a KakaoTalk desktop chat's accessibility snapshot, open an exact room, send text, or reply to a unique visible message.
- [`bizchat`](skills/bizchat/SKILL.md): read the Kakao Business Center chat list with Playwright CDP, maintain a local inquiry ledger, and send a one-off reply to a uniquely matched customer.

## Who these are for

These are **macOS/Korean-UI examples**, not a cross-platform Kakao API. They use UI automation, so KakaoTalk or Business Center layout changes can break them. Always test in your own test chat/account before customer use. Neither skill should be used for unattended sending out of the box.

## Install

Copy only the skill(s) you want into your OpenClaw managed skills directory, usually `~/.openclaw/skills/`, then restart/reload OpenClaw's skill catalog. Review each `SKILL.md` and script before enabling it. Do not copy your private chat database or credentials into the repository.

```sh
cp -R skills/kakao-send ~/.openclaw/skills/
cp -R skills/bizchat ~/.openclaw/skills/
cd ~/.openclaw/skills/bizchat && npm install
```

See each skill for prerequisites and safe use. No credentials are included. The bizchat monitor prints JSON; it does **not** send notifications or schedule itself. Add notifications/scheduling only after choosing your own trusted channel and reviewing privacy requirements.

## Privacy and safety

- Reading chats can change read state; BizChat's list monitor does not click chat entries, but sending does.
- Customer messages saved by BizChat remain in a local JSON file (`~/.openclaw/bizchat-qa.json` by default). Restrict local access, set a retention policy, and obtain any notices/consents your operation requires.
- CDP gives local processes powerful control over the Chrome profile. Bind it to localhost; do not expose port 9222 to a network. Use a dedicated browser profile.
- Script output such as `sent_unverified` is **not** delivery confirmation. Inspect the selected chat and outgoing bubble before reporting success or retrying.
- No KakaoTalk or Kakao Corp affiliation is claimed. Follow the service's applicable terms and policies.

## License

MIT; see [LICENSE](LICENSE).
