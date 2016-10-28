#!/bin/bash

# set -ev
# Just exit when fail dont print code to be exec
set -e

echo $CC
echo $CXX
echo "OS Name: $TRAVIS_OS_NAME"
export TEST_RUN=true
git clone https://github.com/creationix/nvm.git /tmp/.nvm
source /tmp/.nvm/nvm.sh
nvm install "$NODE_VERSION"
nvm use "$NODE_VERSION"

node --version
npm --version

npm install --no-optional
npm prune
npm test

# if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
#   export DISPLAY=:99.0
#   sh -e /etc/init.d/xvfb start
#   sleep 3
#   unset TEST_RUN
#   npm run xtest
# fi
