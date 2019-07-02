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
  echo "Building for linux"
  docker run --rm \
        --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS|APPVEYOR_|CSC_|_TOKEN|_KEY|AWS_|STRIP|BUILD_') \
        -v ${PWD}:/project \
        -v ~/.cache/electron:/root/.cache/electron \
        -v ~/.cache/electron-builder:/root/.cache/electron-builder \
        electronuserland/builder:wine \
        /bin/bash -c "npm run build:lin"
else
  echo "Building for mac"
  npm run build:mac
fi
# zip -r dist/**/*.zip ./github/RELEASE
