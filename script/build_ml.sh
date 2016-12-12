#!/bin/bash

echo "Building for: $TRAVIS_OS_NAME"
echo "CWD: $PWD"
# Change dir to app to build
cd ../app
echo "cd ../app"
echo "New CWD: $PWD"

# remove any existing distribution
rm -rf ../dist

# make for production
unset TEST_RUN
export NODE_ENV=production
npm install --production
npm prune
npm install electron-builder@next -g

if [ "$TRAVIS_OS_NAME" == "linux" ]; then
  # to build for linux
  sudo apt-get install --no-install-recommends -y icnsutils graphicsmagick xz-utils
  build -l --x64 --ia32
else
  build -m
fi
# zip -r dist/**/*.zip ./github/RELEASE
