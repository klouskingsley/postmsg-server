const gulp = require('gulp');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const tsify = require('tsify');
const standalonify = require('standalonify');
const source = require('vinyl-source-stream');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');

gulp.task('browserify', function () {
  return browserify({
    basedir: '.',
    debug: true,
    entries: ['src/index.ts'],
    cache: {},
    packageCacke: {},
  })
    .plugin(tsify, {
      project: 'tsconfig.browserify.json',
    })
    .plugin(standalonify, { name: 'postmsgServer' })
    .bundle()
    .pipe(source('postmsg-server.min.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./build/browserify'));
});
