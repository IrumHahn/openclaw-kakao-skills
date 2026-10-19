-- 카카오톡 메시지 발송
-- 사용법: osascript kakao-send.applescript "채팅방이름" "메시지"

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
	set msgText to item 2 of argv
	if chatRoomName contains linefeed or (length of chatRoomName) > 80 then
		return "error: 잘못된 채팅방 이름"
	end if

	tell application "KakaoTalk" to activate
	delay 0.2

	tell application "System Events"
		tell process "KakaoTalk"
			-- 채팅방 찾기
			set winCount to count of windows
			set chatWin to missing value
			repeat with i from 1 to winCount
				try
					set winTitle to name of window i
					if winTitle is chatRoomName then
						set chatWin to window i
						exit repeat
					end if
				end try
			end repeat
			if chatWin is missing value then
				return "error: 채팅방 없음"
			end if
			if name of chatWin is "카카오톡" then
				return "error: 메인 창에는 발송하지 않음"
			end if

			-- 창 활성화
			set frontmost to true
			perform action "AXRaise" of chatWin
			set focused of chatWin to true
			click chatWin
			delay 0.3

			-- 입력창 찾기: 마지막 쪽 scroll area의 text area를 우선 사용
			-- (상단 검색/보조 영역 text area 오인 방지)
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

			-- 긴 운영방 메시지는 Enter가 줄바꿈/무시로 남는 경우가 있어 전송 버튼을 실제 클릭한다.
			-- 반드시 "전송" 라벨 또는 입력창 근처의 우하단 버튼을 고른다. 상단 공지/검색 버튼 오클릭 방지.
			if (my clickSendButton(chatWin, inputArea)) is false then
				return "error: 전송 버튼 없음"
			end if
			delay 0.5

			-- 클릭만으로 전송 성공을 단정하지 않는다. 실제 말풍선은 별도로 확인한다.
			return "sent_unverified"
		end tell
	end tell
end run
