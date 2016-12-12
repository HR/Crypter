echo Building Crypter
cd %APPVEYOR_BUILD_FOLDER%
set NODE_ENV=production
npm install electron-builder@next -g
npm install --production
npm prune
node --version
npm --version
build -w --x64