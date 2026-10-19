---
name: kakao-send
description: Read and send KakaoTalk desktop messages or reply to a uniquely identified visible post using macOS accessibility UI. Not for Kakao Business Center.
---

# KakaoTalk desktop automation (macOS)

1. **Prepare a local test environment.** Install KakaoTalk for macOS, Node.js 20+, and `cliclick` (for example `brew install cliclick`). Grant Accessibility permission to the terminal/agent process and allow System Events control of KakaoTalk. Log in and test with a room you own. Completion: the KakaoTalk UI and `cliclick` are available.
2. **Open exactly one target room.** `node scripts/kakao-open.js "exact room name"`. Require the separate window's title to equal the requested name; do not use a substring or the main KakaoTalk window. If names are duplicated or the UI is ambiguous, stop. Completion: a uniquely named separate chat window is visible.
3. **Read context.** `osascript -l JavaScript scripts/kakao-context.jxa "exact room name" 30`. Read the returned JSON in row order and inspect missing earlier context or attachments when material. Reading a room can alter read state. Sender labels can be absent, dates and stable message IDs are unavailable, and rows may be virtualized. Completion: target and intended action are unambiguous.
4. **Send text only with authority.** For ordinary text, `osascript scripts/kakao-send.applescript "exact room name" "message"`. For multiline content, save UTF-8 text to a local file and use `osascript scripts/kakao-send-file.applescript "exact room name" "/path/to/message.txt"`. The scripts click Send at most once and return `sent_unverified`. Completion: visually verify the new outgoing bubble in the exact room and an empty input before reporting success; inspect the room before any retry.
5. **Reply to one post.** Re-read immediately before sending, identify a distinctive excerpt that matches exactly one visible post, and use `osascript scripts/kakao-reply.applescript "exact room name" "unique excerpt" "reply text"`. Never use `LAST` as a substitute for identifying the author/target. The hover/click position is fragile; test reply mode in your own test room first. Completion: verify the reply is attached to the intended post, not merely posted in the room.

Reactions are not implemented by these scripts. Do not substitute an emoji chat message for a reaction. Never enable broad monitoring or unattended auto-replies solely from this skill. UI changes may break the workflow; stop on ambiguity.
