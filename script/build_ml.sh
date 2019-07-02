#!/bin/bash

echo "Building for: $TRAVIS_OS_NAME"
echo "CWD: $PWD"
echo "Node $(node --version)"
echo "NPM $(npm --version)"

# make for production
export NODE_ENV=production
npm install electron-builder@next -g
npm prune

if [ "$TRAVIS_OS_NAME" == "linux" ]; then
  # to build for linux
  sudo apt-get install --no-install-recommends -y icnsutils graphicsmagick xz-utils
  sudo snap install snapcraft --classic
  echo "Building for linux"
  npm run build:lin
else
  echo "Building for mac"
  npm run build:mac
fi
# zip -r dist/**/*.zip ./github/RELEASE
