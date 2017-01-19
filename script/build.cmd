echo Building Crypter
REM cd %APPVEYOR_BUILD_FOLDER%
set NODE_ENV=production
npm install electron-builder@next -g
npm install --production
npm run winbuild