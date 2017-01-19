echo Building Crypter
cd %APPVEYOR_BUILD_FOLDER%
set NODE_ENV=production
npm install --production
npm prune
node --version
npm --version
npm run winbuild