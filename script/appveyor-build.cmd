@setlocal enableextensions enabledelayedexpansion
@echo off
if not x%APPVEYOR_REPO_COMMIT_MESSAGE:build=%==x%APPVEYOR_REPO_COMMIT_MESSAGE% (
  REM Commit message contains 'build' so build
  echo Building Crypter
  cd %APPVEYOR_BUILD_FOLDER%
  set NODE_ENV=production
  npm install electron-builder@next -g
  npm install --production
  npm prune
  node --version
  npm --version
  build -w --x64
) else (
  REM Commit message does not contain 'build' so just test and skip build
  echo Testing Crypter
  REM Output useful info for debugging.
  REM node --version
  REM npm --version
  REM run tests
  REM npm test
)
endlocal