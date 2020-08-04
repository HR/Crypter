const gulp = require('gulp')
const shell = require('child_process').exec
const spawn = require('child_process').spawn
const babel = require('gulp-babel')
const env = require('gulp-env')
const less = require('gulp-less')
const path = require('path')
const istanbul = require('gulp-babel-istanbul')
const injectModules = require('gulp-inject-modules')
const mocha = require('gulp-mocha')
const LessPluginCleanCSS = require('less-plugin-clean-css')
const cleancss = new LessPluginCleanCSS({ advanced: true })
const LESS_FILES = './app/static/styles/*.less'
const ELECTRON = __dirname + '/node_modules/.bin/electron'
const DEBUG = false
let p
let args = ['.']
// Start the electron process.
async function electron () {
  // kill previous spawned process
  if (p) {
    p.kill()
  }

  if (DEBUG) args.unshift('--inspect=5858')
  // `spawn` a child `gulp` process linked to the parent `stdio`
  p = await spawn(ELECTRON, args, {
    stdio: 'inherit',
    env: {
      ...process.env
    }
  })
}

gulp.task('run', electron)

gulp.task('watch', function (done) {
  gulp.watch(LESS_FILES, gulp.series('less'))
  gulp.watch(['./app/*.js', './app/src/*.js', './app/core/*.js'], gulp.series('run'))
  done()
})

gulp.task('nodev', function () {
  return shell(
    // start electron main and render process
    `node_modules/.bin/electron script/resolveNodeV.js`,
    function (err, stdout, stderr) {
      console.log(stdout)
      console.log(stderr)
    }
  )
})

gulp.task('less', function () {
  return gulp
    .src('./app/static/styles/*.less')
    .pipe(
      less({
        paths: [path.join(__dirname, 'less', 'includes')],
        plugins: [cleancss]
      })
    )
    .pipe(gulp.dest('./app/static/styles/'))
})

/* TEST */

gulp.task('test', () => {
  shell(
    // Run test stuff
    'mocha --require babel-core/register test/'
  )
})

gulp.task('coverage', function (cb) {
  const envs = env.set({
    TEST_RUN: true
  })
  gulp
    .src('./app/core/**/*.js')
    .pipe(envs)
    .pipe(istanbul())
    .pipe(istanbul.hookRequire())
    .on('finish', function () {
      gulp
        .src('test/*.js')
        .pipe(babel())
        .pipe(injectModules())
        .pipe(mocha())
        .pipe(istanbul.writeReports())
        .on('end', cb)
    })
})

/* BUILD */

gulp.task('rebuildni', () => {
  shell(
    // start node inspector server
    'node_modules/.bin/node-pre-gyp --target=$(node_modules/.bin/electron -v | sed s/\v//g) --runtime=electron --fallback-to-build --directory node_modules/v8-debug/ --dist-url=https://atom.io/download/atom-shell reinstall && node_modules/.bin/node-pre-gyp --target=$(node_modules/.bin/electron -v | sed s/\v//g) --runtime=electron --fallback-to-build --directory node_modules/v8-profiler/ --dist-url=https://atom.io/download/atom-shell reinstall'
  )
})

gulp.task('buildnative', () => {
  shell(
    // start build the native module
    './node_modules/.bin/electron-rebuild #1'
  )
})

gulp.task('ni', () => {
  shell(
    // start node inspector server
    'ELECTRON_RUN_AS_NODE=true node_modules/.bin/electron node_modules/node-inspector/bin/inspector.js'
  )
})

gulp.task('driver', () => {
  shell(
    // Run chromedriver
    './node_modules/chromedriver/bin/chromedriver'
  )
})

gulp.task('default', gulp.series('less', 'watch', 'run'))
