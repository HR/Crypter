echo Building Crypter
cd %APPVEYOR_BUILD_FOLDER%
set NODE_ENV=production
npm install electron-builder@next -g
npm install --production
node --version
npm --version
npm run winbuild