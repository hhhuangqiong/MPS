import path from 'path';
import chalk from 'chalk';
import minimist from 'minimist';

import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import babel from 'gulp-babel';
import changed from 'gulp-changed';
import changedInPlace from 'gulp-changed-in-place';
import nodemon from 'gulp-nodemon';
import eslint from 'gulp-eslint';
import mocha from 'gulp-mocha';

const ROOT = __dirname;
const PATHS = {
  SRC_ALL_FILES: path.join(ROOT, 'src/**/*'),
  SRC_JS_FILES: path.join(ROOT, 'src/**/*.js'),
  TEST_JS_FILES: path.join(ROOT, 'test/**/*.js'),
  SRC_RESOURCE_FILES: [
    path.join(ROOT, 'src/**/!(*.js)'),
    path.join(ROOT, 'package.json'),
  ],
  BUILD_DIR: path.join(ROOT, 'build'),
  BUILD_SRC_DIR: path.join(ROOT, 'build/src'),
  BUILD_ENTRYPOINT_FILE: path.join(ROOT, 'build/src'),
  BUILD_MIGRAION_DIR: path.join(ROOT, 'build/migrations'),
  SRC_MIGRATION_FILES: path.join(ROOT, 'migrations/**/*'),
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
    .pipe(changed(PATHS.BUILD_SRC_DIR))
    .pipe(sourcemaps.init())
    .pipe(babel())
    .on('error', (e) => {
      if (options.env === ENVS.DEVELOPMENT) {
        console.error(chalk.red(e.message));
        console.error(e.codeFrame);
        this.emit('end');
        return;
      }
      throw e;
    })
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(PATHS.BUILD_SRC_DIR));
  return stream;
});

gulp.task('copy-resources', () => {
  const stream = gulp.src(PATHS.SRC_RESOURCE_FILES, { base: ROOT })
    .pipe(changed(PATHS.BUILD_DIR))
    .pipe(gulp.dest(PATHS.BUILD_DIR));
  return stream;
});

gulp.task('build', ['lint', 'compile', 'copy-resources']);

// Run this if you don't want to start a dev server,
// but only compile files on changes. For example if you are using and IDE to debug
gulp.task('watch', ['build'], () => {
  gulp.watch(PATHS.SRC_ALL_FILES, ['build']);
});

gulp.task('dev', ['watch'], () => {
  const stream = nodemon({
    script: PATHS.BUILD_ENTRYPOINT_FILE,
    watch: PATHS.BUILD_SRC_DIR,
  });
  return stream;
});

gulp.task('test', () => {
  const stream = gulp.src(PATHS.TEST_JS_FILES, { read: false })
    .pipe(mocha({
      compilers: 'js:babel-register',
    }));
  return stream;
});

gulp.task('compileMigration', () => {
  const stream = gulp.src(PATHS.SRC_MIGRATION_FILES)
    .pipe(babel())
    .pipe(gulp.dest(PATHS.BUILD_MIGRAION_DIR));
  return stream;
});
