-- Reply to one visible KakaoTalk message identified by a unique excerpt.
-- Usage: osascript kakao-reply.applescript "exact room name" "unique excerpt" "reply text"
on run argv
  if (count of argv) is not 3 then return "error: usage: room excerpt reply"
  set chatRoomName to item 1 of argv
  set searchText to item 2 of argv
  set replyText to item 3 of argv
  if searchText is "LAST" or (length of searchText) < 6 then return "error: use a distinctive excerpt of at least 6 characters"
  if replyText is "" then return "error: empty reply"
  set cliclick to do shell script "/bin/zsh -lc 'command -v cliclick'"

  tell application "System Events"
    tell process "KakaoTalk"
      set chatWin to missing value
      repeat with w in windows
        try
          if name of w is chatRoomName then
            set chatWin to w
            exit repeat
          end if
        end try
      end repeat
      if chatWin is missing value then return "error: exact chat window not found"
      set frontmost to true
      try
        perform action "AXRaise" of chatWin
      end try
      set chatTable to first table of first scroll area of chatWin
      set rowCount to count of rows of chatTable
      set firstRow to rowCount - 29
      if firstRow < 1 then set firstRow to 1
      set targetEl to missing value
      set targetCount to 0
      repeat with rowIndex from firstRow to rowCount
        try
          set candidate to first text area of UI element 1 of row rowIndex of chatTable
          if (value of candidate as text) contains searchText then
            set targetEl to candidate
            set targetCount to targetCount + 1
          end if
        end try
      end repeat
      if targetCount is not 1 then return "error: matching messages=" & targetCount
      set {msgX, msgY} to position of targetEl
      set {msgW, msgH} to size of targetEl
      set {winX, winY} to position of chatWin
      set {winW, winH} to size of chatWin
      if msgY < (winY + 70) or (msgY + msgH) > (winY + winH - 110) then return "error: target message is not fully visible"

      set hoverX to msgX + (msgW div 2)
      set hoverY to msgY + (msgH div 2)
      do shell script cliclick & " m:" & hoverX & "," & hoverY
      delay 2
      set iconX to msgX + msgW + 15
      set iconY to msgY + msgH - 2
      do shell script cliclick & " c:" & iconX & "," & iconY
      delay 1

      set inputArea to missing value
      repeat with sa in scroll areas of chatWin
        try
          if (count of tables of sa) is 0 then
            set inputArea to first text area of sa
            exit repeat
          end if
        end try
      end repeat
      if inputArea is missing value then return "error: input not found after reply control"
      set value of inputArea to replyText
      click inputArea
      delay 0.2
      key code 119
      keystroke " "
      key code 51
      key code 36
      return "sent_unverified"
    end tell
  end tell
end run
