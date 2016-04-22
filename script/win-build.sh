echo "pwd: "$PWD
export NODE_ENV="production"
export DISPLAY=':99.0'

# remove any existing distribution
rm -rf dest

# install deps
sudo apt-get wine
sudo dpkg --add-architecture i386
sudo add-apt-repository ppa:wine/wine-builds
sudo apt-get update
sudo apt-get install --install-recommends winehq-devel
sudo apt-get install -y xvfb

# start Xvfb server
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1

npm install --production

./node_modules/.bin/electron-packager . Crypter --out=dest --ignore='(test|github)' --asar=false --platform=win32 --arch=x64 --version=$(npm run electronVersion) --icon=res/app-icons/Crypter.ico --app-copyright=Habib_Rehman --overwrite
cp ./res/RELEASE ./dest/Crypter-win32-x64/RELEASE
cp ./license ./dest/Crypter-win32-x64
zip -r ./dest/Crypter-win32-x64 ./dest/Crypter-win32-x64
