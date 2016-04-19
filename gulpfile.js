const gulp = require('gulp')
const shell = require('gulp-shell')
const babel = require('gulp-babel')
const env = require('gulp-env')
const jeditor = require("gulp-json-editor")
const istanbul = require('gulp-babel-istanbul')
const injectModules = require('gulp-inject-modules')
const mocha = require('gulp-mocha')

gulp.task('default', shell.task([
  // Absolute path '/usr/local/lib/node_modules/electron-prebuilt/dist/Electron.app/Contents/MacOS/Electron .'
  // Run electron
  // TODO: add compile less bash command > "for i in static/style/*.less do lessc $i ${i:0:${#i} - 5}.css done"
  // 'ELECTRON_RUN_AS_NODE=true node_modules/electron-prebuilt/dist/Electron.app/Contents/MacOS/Electron node_modules/node-inspector/bin/inspector.js'
  'unset TEST_RUN && node_modules/electron-prebuilt/dist/Electron.app/Contents/MacOS/Electron --debug=5858 .'
// 'node_modules/electron-prebuilt/dist/Electron.app/Contents/MacOS/Electron --debug-brk=5858 .'
]))

gulp.task('coverage', function (cb) {
  const envs = env.set({
    TEST_RUN: true
  })
  gulp.src('src/**/*.js')
    .pipe(envs)
    .pipe(istanbul())
    .pipe(istanbul.hookRequire()) // or you could use .pipe(injectModules())
    .on('finish', function () {
      gulp.src('test/*.js')
        .pipe(babel())
        .pipe(injectModules())
        .pipe(mocha())
        .pipe(istanbul.writeReports())
        .on('end', cb)
    })
})

gulp.task('rebuildni', shell.task([
  // start node inspector server
  'node_modules/.bin/node-pre-gyp --target=$(node_modules/electron-prebuilt/dist/Electron.app/Contents/MacOS/Electron -v | sed s/\v//g) --runtime=electron --fallback-to-build --directory node_modules/v8-debug/ --dist-url=https://atom.io/download/atom-shell reinstall && node_modules/.bin/node-pre-gyp --target=$(node_modules/electron-prebuilt/dist/Electron.app/Contents/MacOS/Electron -v | sed s/\v//g) --runtime=electron --fallback-to-build --directory node_modules/v8-profiler/ --dist-url=https://atom.io/download/atom-shell reinstall'
]))

gulp.task('buildnative', shell.task([
  // start build the native module
  './node_modules/.bin/electron-rebuild #1'
]))

gulp.task('ni', shell.task([
  // start node inspector server
  'ELECTRON_RUN_AS_NODE=true node_modules/electron-prebuilt/dist/Electron.app/Contents/MacOS/Electron node_modules/node-inspector/bin/inspector.js'
]))

gulp.task('driver', shell.task([
  // Run chromedriver
  './node_modules/chromedriver/bin/chromedriver'
]))

gulp.task('test', shell.task([
  // Run test stuff
  'mocha --compilers js:babel-core/register test/'
]))

gulp.task('ntest', shell.task([
  // Run test stuff
  'mocha --reporter nyan --compilers js:babel-core/register'
]))

gulp.task('cov', shell.task([
  // Run test stuff
  './node_modules/.bin/babel-node ./node_modules/.bin/isparta cover --root src/ ./node_modules/.bin/_mocha'
]))

gulp.task('lcov', shell.task([
  // Run test stuff
  './node_modules/.bin/babel-node ./node_modules/.bin/isparta cover --root src/ ./node_modules/.bin/_mocha --reporter mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js'
]))

gulp.task('watch', function () {
  gulp.watch(['./static/**/*', './*.js'], ['run'])
})

gulp.task('run', function () {
  return gulp.src('*', {
    read: false
  })
    .pipe(shell([
      // start electron main and render process
      'node_modules/electron-prebuilt/dist/Electron.app/Contents/MacOS/Electron .'
    ]))
})

gulp.task('lint', function () {
  return gulp.src('*', {
    read: false
  })
    .pipe(shell([
      // lint
      'eslint src/*.js src/*/*.js *.js'
    ]))
})
