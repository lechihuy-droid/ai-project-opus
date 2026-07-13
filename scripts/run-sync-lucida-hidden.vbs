' Launcher: chay sync-lucida-apps.ps1 an hoan toan (khong bat cua so console).
' Output ghi vao scripts\sync-lucida.log de debug khi task fail.
Dim shell
Set shell = CreateObject("WScript.Shell")
shell.Run "powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ""& 'C:\Users\HUY\workspace\ai-project-opus\scripts\sync-lucida-apps.ps1' *> 'C:\Users\HUY\workspace\ai-project-opus\scripts\sync-lucida.log'""", 0, False
