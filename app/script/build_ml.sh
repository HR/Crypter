#!/bin/bash

echo "Building for: "$TRAVIS_OS_NAME
echo "cwd: "$PWD
# remove any existing distribution
rm -rf dest
unset TEST_RUN
export NODE_ENV=production
npm install --production
npm prune

if [ "$TRAVIS_OS_NAME" == "linux" ]; then
  # to build for linux
  sudo apt-get install --no-install-recommends -y icnsutils graphicsmagick xz-utils
  node_modules/.bin/build -l --x64 --ia32
else
  node_modules/.bin/build -m --x64 --ia32
fi
# zip -r dist/**/*.zip ./github/RELEASE
