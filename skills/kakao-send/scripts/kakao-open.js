#!/usr/bin/env node
/**
 * 카카오톡 채팅방 열기 (v5 복원)
 * 발송 스크립트가 별도 채팅창을 전제로 하므로, 채팅 목록으로 강제 진입한 뒤 더블클릭해서 별도 창으로 연다.
 */

import { execFileSync } from 'node:child_process'

function escapeForAppleScript(text = '') {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
}

export async function openKakaoChat(chatRoomName) {
  console.log(`[카톡] ${chatRoomName} 창 열기 시작...`)
  if (!chatRoomName || chatRoomName.length > 80 || /[\r\n]/.test(chatRoomName)) {
    console.error('[카톡] 잘못된 채팅방 이름 — 메시지 본문을 방명으로 받은 것으로 보임 ❌')
    return 'invalid_room_name'
  }
  const escapedRoom = escapeForAppleScript(chatRoomName)

  const script = `
    tell application "KakaoTalk" to activate
    delay 0.7
    tell application "System Events"
      tell process "KakaoTalk"
        -- 로그인 화면이면 즉시 중단
        try
          if exists button "로그인" of window 1 then
            return "login_required"
          end if
        end try

        -- 메인 창 검색 상태는 별도 채팅창이 이미 열려 있어도 다음 자동화에 영향을 준다.
        -- 항상 채팅 탭으로 돌아가 대상 방명을 검색해 둔다.
        keystroke "1" using command down
        delay 0.2
        keystroke "2" using command down
        delay 0.5

        set mainWin to missing value
        try
          set mainWin to window "카카오톡"
        on error
          set mainWin to window 1
        end try
        set focused of mainWin to true
        click mainWin
        delay 0.2

        set searchBox to missing value
        try
          set searchBox to first text field of mainWin whose description is "텍스트 필드 검색"
        on error
          try
            set searchBox to first text field of mainWin
          end try
        end try
        if searchBox is not missing value then
          set focused of searchBox to true
          set value of searchBox to "${escapedRoom}"
          delay 0.8
        end if

        -- 이미 별도 채팅창이 열려 있으면 목록 탐색을 다시 하지 않는다.
        -- 자동 발송 중 재진입하면 목록 위치/필터 상태 때문에 not_found가 날 수 있다.
        set winCount to count of windows
        repeat with i from 1 to winCount
          try
            if name of window i is "${escapedRoom}" then
              set focused of window i to true
              try
                if searchBox is not missing value then set value of searchBox to ""
              end try
              return "already_open"
            end if
          end try
        end repeat

        -- 항상 같은 순서로 다시 연다: 활성화 → 창 > 채팅(커맨드 1,2 fallback) → 전체 폴더 → 해당 방 더블클릭
        keystroke "1" using command down
        delay 0.3
        keystroke "2" using command down
        delay 0.7

        -- 이전 수동 발송/공지에서 남은 검색어가 있으면 목록이 필터링되어 엉뚱한 방만 보인다.
        -- 매번 정확한 방명으로 검색을 새로 걸어 대상 행만 선택한다.
        if searchBox is not missing value then
          set focused of searchBox to true
          set value of searchBox to "${escapedRoom}"
          delay 0.8
        end if

        try
          click button "전체 폴더" of mainWin
          delay 0.5
        end try

        set chatTable to first table of first scroll area of mainWin
        set chatRows to rows of chatTable
        repeat with r in chatRows
          try
            set cellVal to value of first static text of UI element 1 of r
            if cellVal is "${escapedRoom}" then
              set {xPos, yPos} to position of r
              set {w, h} to size of r
              do shell script (do shell script "/bin/zsh -lc 'command -v cliclick'") & " dc:" & (xPos + w div 2) & "," & (yPos + h div 2)
              delay 2
              -- 실제 별도 창 생성 확인
              set winCount to count of windows
              repeat with i from 1 to winCount
                try
                  if name of window i is "${escapedRoom}" then
                    set focused of window i to true
                    try
                      if searchBox is not missing value then set value of searchBox to ""
                    end try
                    return "opened"
                  end if
                end try
              end repeat
              return "opened_main_only"
            end if
          end try
        end repeat

        try
          if searchBox is not missing value then set value of searchBox to ""
        end try
        return "not_found"
      end tell
    end tell
  `

  try {
    const result = execFileSync('osascript', ['-e', script], {
      timeout: 15000,
      env: process.env,
    }).toString().trim()

    if (result === 'already_open') {
      console.log(`[카톡] ${chatRoomName} 창 이미 열려있음 ✅`)
    } else if (result === 'opened') {
      console.log(`[카톡] ${chatRoomName} 열기 성공 ✅`)
    } else if (result === 'login_required') {
      console.error('[카톡] 로그인 필요 — 카카오톡 로그인이 필요함 ❌')
      return 'login_required'
    } else if (result === 'opened_main_only') {
      console.error(`[카톡] ${chatRoomName} 메인창만 열림 — 별도 창 확인 실패 ❌`)
      return 'error'
    } else {
      console.log(`[카톡] ${chatRoomName} 결과: ${result}`)
    }
    return result
  } catch (e) {
    console.error(`[카톡] 열기 실패: ${e.message?.slice(0, 100)}`)
    return 'error'
  }
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const room = process.argv[2]
  if (!room) {
    console.error('usage: node kakao-open.js "채팅방이름"')
    process.exit(1)
  }

  const result = await openKakaoChat(room)
  if (result === 'opened' || result === 'already_open') {
    process.exit(0)
  }
  process.exit(1)
}
