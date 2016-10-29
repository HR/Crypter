#!/bin/bash

echo "Building for: $TRAVIS_OS_NAME"
echo "cwd: $PWD"
# remove any existing distribution
rm -rf dist
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
