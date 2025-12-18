@echo off
REM Batch file wrapper for PowerShell script
powershell.exe -ExecutionPolicy Bypass -File "%~dp0make.ps1" %*

