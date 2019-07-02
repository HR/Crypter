#!/bin/bash

# set -ev
# Just exit when fail dont print code to be exec
set +e

export TEST_RUN=true
echo "CC: $CC"
echo "CXX: $CXX"
echo "OS Name: $TRAVIS_OS_NAME"
echo "Node $(node --version)"
echo "NPM $(npm --version)"

# Install deps
npm install --no-optional
npm prune

# Test and get coverage
npm run coverage
npm run coveralls
# - npm run codeclimate

# End-to-end OSX testing
# if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
#   export DISPLAY=:99.0
#   sh -e /etc/init.d/xvfb start
#   sleep 3
#   unset TEST_RUN
#   npm run xtest
# fi

unset TEST_RUN
