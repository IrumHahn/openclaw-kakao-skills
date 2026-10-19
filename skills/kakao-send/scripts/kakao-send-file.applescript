-- 카카오톡 파일 기반 메시지 발송 (v5 복원)
-- 사용법: osascript kakao-send-file.applescript "채팅방이름" "/tmp/message.txt"
-- 채팅방이 별도 창으로 열려있어야 함

on uiText(uiElement)
	set labelText to ""
	try
		set labelText to labelText & " " & (name of uiElement as text)
	end try
	try
		set labelText to labelText & " " & (title of uiElement as text)
	end try
	try
		set labelText to labelText & " " & (description of uiElement as text)
	end try
	return labelText
end uiText

on clickSendButton(chatWin, inputArea)
	set sendButton to missing value
	repeat with b in buttons of chatWin
		try
			set buttonLabel to my uiText(b)
			if buttonLabel contains "전송" or buttonLabel contains "Send" then
				set sendButton to b
				exit repeat
			end if
		end try
	end repeat

	if sendButton is missing value then return false
	set {xPos, yPos} to position of sendButton
	set {w, h} to size of sendButton
	do shell script (do shell script "/bin/zsh -lc 'command -v cliclick'") & " c:" & (xPos + w div 2) & "," & (yPos + h div 2)
	return true
end clickSendButton

on run argv
	set chatRoomName to item 1 of argv
	set filePath to item 2 of argv
	if chatRoomName contains linefeed or (length of chatRoomName) > 80 then
		return "error: 잘못된 채팅방 이름"
	end if

	-- 파일에서 메시지 읽기
	set msgText to do shell script "cat " & quoted form of filePath

	tell application "KakaoTalk" to activate
	delay 0.2

	tell application "System Events"
		tell process "KakaoTalk"
			-- 채팅방 별도 창 찾기 (메인 창 fallback 금지: 오발송/오인발송 방지)
			set chatWin to missing value
			set winCount to count of windows
			repeat with i from 1 to winCount
				try
					if name of window i is chatRoomName then
						set chatWin to window i
						exit repeat
					end if
				end try
			end repeat
			if chatWin is missing value then
				return "error: 채팅방 별도 창 없음 — " & chatRoomName
			end if
			if name of chatWin is "카카오톡" then
				return "error: 메인 창에는 발송하지 않음"
			end if

			set frontmost to true
			perform action "AXRaise" of chatWin
			set focused of chatWin to true
			click chatWin
			delay 0.4

			-- 입력창 찾기: 마지막 쪽 scroll area의 text area를 우선 사용
			-- (상단 검색/보조 영역 text area를 잘못 잡는 문제 방지)
			set inputArea to missing value
			set saCount to count of scroll areas of chatWin
			repeat with i from saCount to 1 by -1
				try
					if (count of text areas of scroll area i of chatWin) > 0 then
						set inputArea to text area 1 of scroll area i of chatWin
						exit repeat
					end if
				end try
			end repeat

			if inputArea is missing value then
				return "error: 입력창 없음"
			end if

			-- 메시지 입력: 검색창 오입력을 막기 위해 클립보드 붙여넣기 대신 입력창 값을 직접 설정한다.
			-- space trick으로 전송 버튼을 활성화한 뒤 좌표 클릭으로 실제 전송한다.
			set value of inputArea to msgText
			set {ix, iy} to position of inputArea
			set {iw, ih} to size of inputArea
			do shell script (do shell script "/bin/zsh -lc 'command -v cliclick'") & " c:" & (ix + 20) & "," & (iy + ih div 2)
			delay 0.2
			key code 119
			keystroke " "
			key code 51
			delay 0.2
			if (my clickSendButton(chatWin, inputArea)) is false then
				return "error: 전송 버튼 없음"
			end if
			delay 0.6

			return "sent_unverified"
		end tell
	end tell
end run
