echo "pwd: "$PWD
export NODE_ENV=production

# remove any existing distribution
rm -rf dest

npm install --production

electron-packager . $npm_package_productName --out=dest --ignore='(test|backups|github)' --asar=false --platform=darwin --arch=x64 --version=$(npm run electronVersion) --icon=res/app-icons/Crypter.icns --app-copyright=Habib_Rehman --overwrite
cp ./github/RELEASE ./dest/Crypter-darwin-x64/RELEASE
cp ./license ./dest/Crypter-darwin-x64
zip -9r ./dest/Crypter-darwin-x64 ./dest/Crypter-darwin-x64
