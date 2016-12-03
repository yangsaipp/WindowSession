/**
 *  Web Starter Kit
 */

'use strict';

// This gulpfile makes use of new JavaScript features.
// Babel handles this without us having to do anything. It just works.
// You can read more about the new JavaScript features here:
// https://babeljs.io/docs/learn-es2015/

import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import rimraf   from 'rimraf';

const $ = gulpLoadPlugins();
// const reload = browserSync.reload;
// 输出目录
const dist = 'dest';
const PRODUCTION = false;

// build任务：先调用clean，在并行调用javascript、images
gulp.task('build',
    gulp.series(clean, gulp.parallel(javascript, images)));

gulp.task('default',
    gulp.series('build'));

gulp.task('dev',
    gulp.series('build', server, watch));

// Reload the browser with BrowserSync
function reload(done) {
  browserSync.reload();
  done();
}

// Watch for changes to static assets, pages, Sass, and JavaScript
function watch() {
  gulp.watch("src/**/*.js").on('change', gulp.series(javascript, reload));
  gulp.watch("test/**/*").on('change', gulp.series(javascript, reload));
}

// 清空dist目录
function clean(done) {
  // del(['.tmp', 'dist/*', '!dist/.git'], {dot: true});
  rimraf(dist, done);
}

// 暂时未使用
function css() {
  // do nothing
}

// 合并压缩js
// 若PRODUCTION为true就混淆js
function javascript() {
  return gulp.src("src/**/*.js")
      .pipe($.sourcemaps.init())
      .pipe($.babel())
      // .pipe($.concat('app.js'))
      .pipe($.if(PRODUCTION, $.uglify().on('error', e => { console.log(e); })))
      .pipe(gulp.dest(dist + '/js'));
}

// copy 图片到输出目录，若PRODUCTION则压缩图片
function images() {
  return gulp.src("src/images/**/*")
      // .pipe($.if(PRODUCTION, $.imagemin({
      //   progressive: true
      // })))
      .pipe(gulp.dest(dist + "/images"));
}

// 暂时未使用
function copy() {
  // do nothing
}

// Start a server with BrowserSync to preview the site in
function server(done) {
  browserSync.init({
    server: {
      baseDir: [dist, "test"],
      index: 'SpecRunner.html'
    }, 
    port: 8888
  });
  done();
}