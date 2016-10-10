import path from 'path';

import minimist from 'minimist';
import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import babel from 'gulp-babel';
import changed from 'gulp-changed';
import changedInPlace from 'gulp-changed-in-place';
import nodemon from 'gulp-nodemon';
import eslint from 'gulp-eslint';

const ROOT = __dirname;
const PATHS = {
  SRC_ALL_FILES: path.join(ROOT, 'src/**/*'),
  SRC_JS_FILES: path.join(ROOT, 'src/**/*.js'),
  SRC_RESOURCE_FILES: path.join(ROOT, 'src/**/!(*.js)'),
  BUILD_DIR: path.join(ROOT, 'build/src'),
  BUILD_ENTRYPOINT_FILE: path.join(ROOT, 'build/src/server'),
};
const ENVS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
};

const argv = minimist(process.argv.slice(2));
const options = {
  env: argv.env || process.env.NODE_ENV || ENVS.DEVELOPMENT,
};

gulp.task('lint', () => {
  let stream = gulp.src(PATHS.SRC_JS_FILES)
    // It will only show you files you're working on
    .pipe(changedInPlace({ firstPass: true }))
    .pipe(eslint())
    .pipe(eslint.format());
  if (options.env === ENVS.PRODUCTION) {
    stream = stream.pipe(eslint.failAfterError());
  }
  return stream;
});

gulp.task('compile', () => {
  const stream = gulp.src(PATHS.SRC_JS_FILES)
    .pipe(changed(PATHS.BUILD_DIR))
    .pipe(sourcemaps.init())
    .pipe(babel({
      sourceMap: true,
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(PATHS.BUILD_DIR));
  return stream;
});

gulp.task('copy-resources', () => {
  const stream = gulp.src(PATHS.SRC_RESOURCE_FILES)
    .pipe(changed(PATHS.BUILD_DIR))
    .pipe(gulp.dest(PATHS.BUILD_DIR));
  return stream;
});

const BUILD_TASKS = ['lint', 'compile', 'copy-resources'];
gulp.task('build', BUILD_TASKS);
gulp.task('build:nodemon', BUILD_TASKS.filter(x => x !== 'lint'));

// Run this if you don't want to start a dev server,
// but only compile files on changes. For example if you are using and IDE to debug
gulp.task('watch', ['build'], () => {
  gulp.watch(PATHS.SRC_ALL_FILES, ['build']);
});

gulp.task('dev', ['build'], () => {
  gulp.watch(PATHS.SRC_JS_FILES, ['lint']);
  const stream = nodemon({
    script: PATHS.BUILD_ENTRYPOINT_FILE,
    watch: 'src',
    tasks: ['build:nodemon'],
  });
  return stream;
});
