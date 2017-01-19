@setlocal enableextensions enabledelayedexpansion
@echo off
get-host
set keyword=build

If NOT %APPVEYOR_REPO_COMMIT_MESSAGE:build=%==x%APPVEYOR_REPO_COMMIT_MESSAGE% (
  REM Commit message contains '[build]' so build
  echo Building Crypter
  build.cmd
) else (
  REM Commit message does not contain '[build]' so just test and skip build
  echo Testing Crypter
  test.cmd
)
endlocal