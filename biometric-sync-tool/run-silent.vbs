Option Explicit
Dim fso, scriptDir, pythonExe, syncPy, WshShell, launchResult
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
pythonExe = scriptDir & "\python\pythonw.exe"
syncPy = scriptDir & "\sync.py"
If Not fso.FileExists(pythonExe) Then Fail "Bundled pythonw.exe is missing. Extract the complete ZIP."
If Not fso.FileExists(syncPy) Then Fail "sync.py is missing. Extract the complete ZIP."
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = scriptDir
On Error Resume Next
launchResult = WshShell.Run("""" & pythonExe & """ """ & syncPy & """", 0, False)
If Err.Number <> 0 Then Fail "Could not launch Python: " & Err.Description
On Error GoTo 0
WScript.Quit 0

Sub Fail(message)
    Dim errorLog
    On Error Resume Next
    Set errorLog = fso.OpenTextFile(scriptDir & "\launcher.log", 8, True)
    errorLog.WriteLine Now & " " & message
    errorLog.Close
    WScript.Quit 1
End Sub
