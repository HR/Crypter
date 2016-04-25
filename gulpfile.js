const gulp = require('gulp')
const shell = require('gulp-shell')
const babel = require('gulp-babel')
const env = require('gulp-env')
const less = require('gulp-less')
const path = require('path')
const jeditor = require("gulp-json-editor")
const istanbul = require('gulp-babel-istanbul')
const injectModules = require('gulp-inject-modules')
const mocha = require('gulp-mocha')
const LessPluginCleanCSS = require('less-plugin-clean-css')
const cleancss = new LessPluginCleanCSS({ advanced: true })

gulp.task('default', ['less'], shell.task([
  // Run electron
  // 'ELECTRON_RUN_AS_NODE=true node_modules/.bin/electron node_modules/node-inspector/bin/inspector.js'
  'unset TEST_RUN && node_modules/.bin/electron .'
  // 'node_modules/.bin/electron --debug-brk=5858 .'
]))

gulp.task('coverage', function (cb) {
  const envs = env.set({
    TEST_RUN: true
  })
  gulp.src('src/**/*.js')
    .pipe(envs)
    .pipe(istanbul())
    .pipe(istanbul.hookRequire())
    .on('finish', function () {
      gulp.src('test/*.js')
        .pipe(babel())
        .pipe(injectModules())
        .pipe(mocha())
        .pipe(istanbul.writeReports())
        .on('end', cb)
    })
})

gulp.task('less', function () {
  return gulp.src('./static/styles/*.less')
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ],
      plugins: [cleancss]
    }))
    .pipe(gulp.dest('./static/styles/'))
})

gulp.task('test', shell.task([
  // Run test stuff
  'mocha --compilers js:babel-core/register test/'
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
      'node_modules/.bin/electron .'
    ]))
})

gulp.task('rebuildni', shell.task([
  // start node inspector server
  'node_modules/.bin/node-pre-gyp --target=$(node_modules/.bin/electron -v | sed s/\v//g) --runtime=electron --fallback-to-build --directory node_modules/v8-debug/ --dist-url=https://atom.io/download/atom-shell reinstall && node_modules/.bin/node-pre-gyp --target=$(node_modules/.bin/electron -v | sed s/\v//g) --runtime=electron --fallback-to-build --directory node_modules/v8-profiler/ --dist-url=https://atom.io/download/atom-shell reinstall'
]))

gulp.task('buildnative', shell.task([
  // start build the native module
  './node_modules/.bin/electron-rebuild #1'
]))

gulp.task('ni', shell.task([
  // start node inspector server
  'ELECTRON_RUN_AS_NODE=true node_modules/.bin/electron node_modules/node-inspector/bin/inspector.js'
]))

gulp.task('driver', shell.task([
  // Run chromedriver
  './node_modules/chromedriver/bin/chromedriver'
]))
