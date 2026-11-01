Option Explicit
On Error Resume Next

Dim fso, scriptDir, pythonExe, syncPy, WshShell

Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
pythonExe = scriptDir & "\python\pythonw.exe"
syncPy = scriptDir & "\sync.py"

If Not fso.FileExists(pythonExe) Then
    pythonExe = "pythonw.exe"
End If

Set WshShell = CreateObject("WScript.Shell")
WshShell.Run """" & pythonExe & """ """ & syncPy & """", 0, False
