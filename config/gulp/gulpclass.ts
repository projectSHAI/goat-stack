/// <reference path="../../node_modules/@types/node/index.d.ts" />

import {Gulpclass, Task, SequenceTask} from "gulpclass/Decorators";

let fs = require('graceful-fs');
let _ = require('lodash');
let chalk = require('chalk');
let del = require('del');
let path = require('path');
let gulp = require('gulp');
let sass = require('gulp-sass');
let sassLint = require('gulp-sass-lint')
let watch = require('gulp-watch');
let Builder = require('systemjs-builder');
let KarmaServer = require('karma').Server;
let JasmineReporter = require('jasmine-spec-reporter');
let ts = require('gulp-typescript');
let embedTemplates = require('gulp-angular-embed-templates');
let embedSass = require('gulp-angular2-embed-sass');
let runSequence = require('run-sequence');
let plugins = require('gulp-load-plugins')();
let shell = require('gulp-shell');
let imagemin = require('imagemin');
let imageminJPEGOptim = require('imagemin-jpegoptim');
let imageminOptiPNG = require('imagemin-optipng');
let imageminSVGO = require('imagemin-svgo');
let exec = require('child_process').exec;

// tslint:disable-next-line
let defaultAssets = eval(require("typescript")
  .transpile(fs
    .readFileSync("./config/assets/default.ts")
    .toString()));

@Gulpclass()
export class Gulpfile {

  // Set NODE_ENV to 'test'
  @Task()
  env_test(done) {
    process.env.NODE_ENV = 'test';
    done();
  }
  // Set NODE_ENV to 'development'
  @Task()
  env_dev(done) {
    process.env.NODE_ENV = 'development';
    done();
  }
  // Set NODE_ENV to 'production'
  @Task()
  env_prod(done) {
    process.env.NODE_ENV = 'production';
    done();
  }
  //start mongo db for development mode
  @Task()
  mongod_start(done, cb) {
    exec('mongod --dbpath=/data', function(err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      cb(err);
    });
    done();
  }

  @Task()
  build_clean(done) {
    del(['dist/**', '!dist', 'ngfactory/**', 'client/**/**/*.js*', 'client/**/**/*.ngfactory*', 'client/**/**/*.shim*']);
    done();
  }

  @Task()
  build_html(done) {
    return gulp.src('config/env/development/index.html')
      .pipe(gulp.dest('./dist/app'));
  }
  @Task()
  build_html_prod(done) {
    return gulp.src('config/env/production/index.html')
      .pipe(gulp.dest('./dist/app'));
  }

  @Task()
  build_sass(done) {
    // Brute force fix for angular material import .css .scss error
    del('node_modules/@angular/material/core/overlay/overlay.css');

    return gulp.src(defaultAssets.client.scss)
      .pipe(sass().on('error', sass.logError))
      .pipe(gulp.dest('./dist/app'));
  }
  @Task()
  build_assets(done) {
    return imagemin(defaultAssets.client.assets, 'dist/app/assets', {
      plugins: [
        imageminJPEGOptim(),
        imageminOptiPNG(),
        imageminSVGO()
      ]
    });
  }
  compressAsset(file) {
    console.log('\n Inserting ----> ' + chalk.green.bold(
      file.path.substring(file.path.lastIndexOf('\\') + 1, file.path.length)) +
      '\n');

    return imagemin([file.path], 'dist/app/assets', {
      plugins: [
        imageminJPEGOptim(),
        imageminOptiPNG(),
        imageminSVGO()
      ]
    });
  }
  deleteAsset(file) {
    file.path = file.path.replace('app', 'dist\\app');

    console.log('\n Deleting ----> ' + chalk.green.bold(
      file.path.substring(file.path.lastIndexOf('\\') + 1, file.path.length)) +
      '\n');

    del(file.path);
  }
  @Task()
  build_systemConf() {
    return gulp.src('config/env/development/systemjs.config.js')
      .pipe(gulp.dest('./dist/app'));
  }

  @Task()
  build_index(done) {
    return gulp.src(['config/env/default/index.js', 'config/env/default/systemjs.server.js'])
      .pipe(gulp.dest('./dist'));
  }
  // Transpile client side TS files
  @Task()
  build_client(done) {
    let tsProject = ts.createProject('./tsconfig.json');
    let tsResult = tsProject.src()
      .pipe(embedTemplates())
      .pipe(embedSass())
      .pipe(tsProject());

    return tsResult.js.pipe(gulp.dest('./dist'));
  }
  @Task()
  build_client_prod(done) {
    let tsProject = ts.createProject('./tsconfig.json');
    let tsResult = gulp.src(`client/**/**/!(*.spec).ts`)
      .pipe(embedTemplates())
      .pipe(embedSass())
      .pipe(tsProject());

    return tsResult.js.pipe(gulp.dest('./tmp'));
  }

  @Task()
  build_server() {
    let tsProject = ts.createProject('./tsconfig.json');
    let tsResult = tsProject.src()
      .pipe(tsProject());

    return tsResult.js.pipe(gulp.dest('./dist'));
  }
  @Task()
  build_server_prod() {
    let tsProject = ts.createProject('./tsconfig.json', { module: 'system', outFile: 'server.js' });
    let tsResult = tsProject.src()
      .pipe(tsProject());

    return tsResult.js.pipe(gulp.dest('./tmp'));
  }

  build_config() {
    let tsProject = ts.createProject('./tsconfig.json');
    let tsResult = gulp.src(`config/**/**/!(gulpclass).ts`)
      .pipe(tsProject());

    return tsResult.js.pipe(gulp.dest('./dist'));
  }

  // Transpile client test TS files
  @Task()
  client_test(done) {
    let tsProject = ts.createProject('./tsconfig.json', { module: 'system' });
    let tsResult = gulp.src(`client/**/**/*.ts`)
      .pipe(embedTemplates())
      .pipe(embedSass())
      .pipe(tsProject());

    return tsResult.js.pipe(gulp.dest('./dist'));
  }
  // Transpile server test TS files
  @Task()
  server_test(done) {
    let tsProject = ts.createProject('./tsconfig.json');
    let tsResult = tsProject.src()
      .pipe(tsProject());

    return tsResult.js.pipe(gulp.dest('./dist'));
  }

  @SequenceTask()
  build_client_test() {
    return ['client_test', 'build_client_sequence'];
  }
  @SequenceTask()
  build_server_test() {
    return ['server_test'];
  }

  @SequenceTask()
  build_client_sequence() {
    return ['build_sass', 'build_html', 'build_assets', 'build_systemConf'];
  }

  @SequenceTask()
  build_project() {
    return [
      'build_client',
      'build_client_sequence',
      // 'build_index',
      // 'build_server',
      // 'compress_client',
      // 'compress_server',
      // 'delete_tmp'
    ];
  }
  @SequenceTask()
  build_project_test() {
    return ['client_test', 'build_client_sequence', 'build_server_test'];
  }

  buildFile(file: any) {
    const tsProject = ts.createProject('tsconfig.json');

    const ht = file.path.includes('html');
    const sc = file.path.includes('scss');
    const app = file.path.includes('app');
    const ser = file.path.includes('server');

    file.path = ht ? file.path.replace('html', 'ts') : sc ? file.path.replace('scss', 'ts') : file.path;

    console.log('\n Compiling ----> ' + chalk.green.bold(
      file.path.substring(file.path.lastIndexOf('\\') + 1, file.path.length)) +
      '\n');

    const tsResult = gulp.src(file.path)
      .pipe(embedTemplates())
      .pipe(embedSass())
      .pipe(tsProject());

    file.path = app ? file.path.replace('app', 'dist\\app') : ser ?
      file.path.replace('server', 'dist\\server') : file.path.replace('config', 'dist\\config');

    file.path = file.path.substring(0, file.path.lastIndexOf('\\'));

    return tsResult.js.pipe(gulp.dest(path.resolve(file.path)));
  }

  @SequenceTask()
  compress_client() {
    return ['compress_js', 'compress_css'];
  }

  // Compress the app.js file
  @Task()
  compress_js() {
    return gulp.src('tmp/app.js')
      .pipe(plugins.uglify({
        compress: {
          sequences: true,  // join consecutive statemets with the “comma operator”
          properties: true,  // optimize property access: a["foo"] → a.foo
          dead_code: true,  // discard unreachable code
          drop_debugger: true,  // discard “debugger” statements
          unsafe: false, // some unsafe optimizations (see below)
          conditionals: true,  // optimize if-s and conditional expressions
          comparisons: true,  // optimize comparisons
          evaluate: true,  // evaluate constant expressions
          booleans: true,  // optimize boolean expressions
          loops: true,  // optimize loops
          unused: true,  // drop unused variables/functions
          hoist_funs: true,  // hoist function declarations
          hoist_vars: false, // hoist variable declarations
          if_return: true,  // optimize if-s followed by return/continue
          join_vars: true,  // join var declarations
          cascade: true,  // try to cascade `right` into `left` in sequences
          side_effects: true,  // drop side-effect-free statements
        }
      }))
      .pipe(gulp.dest('dist/app'));
  }

  // Compress css
  @Task()
  compress_css() {
    return gulp.src('dist/app/styles.css')
      .pipe(plugins.uglifycss({
        "maxLineLen": 80
      }))
      .pipe(gulp.dest('dist/app'));
  }

  @Task()
  compress_server() {
    return gulp.src('tmp/server.js')
      .pipe(plugins.uglify({
        compress: {
          sequences: true,  // join consecutive statemets with the “comma operator”
          properties: true,  // optimize property access: a["foo"] → a.foo
          dead_code: true,  // discard unreachable code
          drop_debugger: true,  // discard “debugger” statements
          unsafe: false, // some unsafe optimizations (see below)
          conditionals: true,  // optimize if-s and conditional expressions
          comparisons: true,  // optimize comparisons
          evaluate: true,  // evaluate constant expressions
          booleans: true,  // optimize boolean expressions
          loops: true,  // optimize loops
          unused: true,  // drop unused variables/functions
          hoist_funs: true,  // hoist function declarations
          hoist_vars: false, // hoist variable declarations
          if_return: true,  // optimize if-s followed by return/continue
          join_vars: true,  // join var declarations
          cascade: true,  // try to cascade `right` into `left` in sequences
          side_effects: true,  // drop side-effect-free statements
        }
      }))
      .pipe(gulp.dest('dist'));
  }
  @Task()
  delete_tmp() {
    return del('tmp/**');
  }

  // Nodemon task
  @Task()
  nodemon() {
    return plugins.nodemon({
      script: 'dist/server/server.js',
      ext: 'js,html',
      watch: defaultAssets.server.allJS
    });
  }
  // Nodemon test task
  @Task()
  nodemon_test() {
    return plugins.nodemon({
      script: 'dist/server/server.js',
      ext: 'js,html',
      watch: defaultAssets.server.allJS
    });
  }

  @SequenceTask()
  test_server() {
    return ['server_jasmine_unit', 'server_jasmine_integration'];
  }
  // Mocha unit
  @Task()
  server_jasmine_unit(done) {
    return gulp.src(defaultAssets.server.tests.unit)
      .pipe(plugins.jasmine({
        reporter: new JasmineReporter()
      }));
  }
  // Mocha integration
  @Task()
  server_jasmine_integration(done) {
    return gulp.src(defaultAssets.server.tests.integration)
      .pipe(plugins.jasmine({
        reporter: new JasmineReporter()
      }));
  }

  @SequenceTask()
  test_client() {
    return ['client_karma_test'];
  }
  // Mocha integration
  @Task()
  client_karma_test(done) {
    return new KarmaServer({
      configFile: __dirname + '/config/env/test/karma.conf.js',
      singleRun: true
    }, done).start();
  }

  @Task()
  protractor(done) {
    return gulp.src('')
      .pipe(shell(['npm run e2e']));
  }

  // Watch Files For Changes
  @Task()
  watch() {
    let serverts = _.union(
      defaultAssets.server.allTS,
      defaultAssets.config.allTS
    );

    // Start livereload
    plugins.livereload.listen();
    // Watch all server TS files to build JS
    watch(serverts, file => this.buildFile(file));
    watch(defaultAssets.server.allJS, plugins.livereload.changed);
    // Watch all TS files in client and compiles JS files in dist
    watch(defaultAssets.client.ts, file => this.buildFile(file));
    // Watch all scss files to build css is change
    watch(defaultAssets.client.scss, file => this.buildFile(file));
    // Watch all html files to build them in dist
    watch(defaultAssets.client.views, file => this.buildFile(file));
    watch(defaultAssets.client.dist.js, plugins.livereload.changed);
    // Watch all client assets to compress in dist
    watch(defaultAssets.client.assets, { events: ['add'] }, file => this.compressAsset(file));
    watch(defaultAssets.client.assets, { events: ['unlink'] }, file => this.deleteAsset(file));
    watch(defaultAssets.client.dist.assets, plugins.livereload.changed);
    // Watch if system.config files are changed
    watch(defaultAssets.client.system, file => runSequence('build_systemConf'));
    // watch(defaultAssets.server.system, file => runSequence('build_index'));
    watch(['dist/app/systemjs.config.js'], plugins.livereload.changed);
  }

  // SASS linting task
  @Task()
  scsslint(done) {
    return gulp.src(['client/styles.scss', 'client/app/components/**/*.scss'])
      .pipe(sassLint({
        rules: {
          'no-css-comments': 0,
          'single-line-per-selector': 0,
          'property-sort-order': 0,
          'empty-args': 0,
          'indentation': 0,
          'empty-line-between-blocks': 0,
          'force-pseudo-nesting': 0,
          'pseudo-element': 0,
          'no-vendor-prefixes': 0,
          'no-color-literals': 0,
          'no-color-keywords': 0,
          'quotes': 0,
          'force-element-nesting': 0,
          'no-ids': 0,
          'leading-zero': 0,
          'space-after-comma': 0
        }
      }))
      .pipe(sassLint.format())
      .pipe(sassLint.failOnError())
  }
  // Typescript linting task
  @Task()
  tslint(done) {
    let assets = _.union(
      defaultAssets.client.ts,
      defaultAssets.server.allTS,
      defaultAssets.config.allTS
    );

    return gulp.src(assets)
      .pipe(plugins.tslint({
        // contains rules in the tslint.json format
        configuration: "./tslint.json"
      }))
      .pipe(plugins.tslint.report());
  }
  // Lint CSS and JavaScript files.
  @SequenceTask()
  lint() {
    return ['scsslint', 'tslint'];
  }

  @Task()
  exit(done) {
    process.exit();
    done();
  }

  // Run the project in development mode
  @SequenceTask()
  default() {
    return [
      'env_dev',
      'lint',
      'mongod_start',
      'build_clean',
      'build_project',
      ['nodemon', 'watch']
    ];
  }
  // Run the project in production mode
  @SequenceTask()
  prod() {
    return [
      'env_prod',
      'lint',
      'mongod_start',
      'build_clean',
      'build_project',
      ['nodemon', 'watch']
    ];
  }
  // Run the project in test mode
  @SequenceTask()
  test() {
    return [
      'env_test',
      'lint',
      'mongod_start',
      'build_clean',
      'build_project',
      'test_server',
      'test_client',
      'exit'
    ];
  }
  // Run all e2e tests
  @SequenceTask('test:e2e')
  test_e2e() {
    return [
      'env_test',
      'mongod_start',
      'build_clean',
      'build_project',
      'protractor',
    ];
  }

  @Task()
  demo_bundle(done) {
    let builder = new Builder();

    builder.loadConfig('config/sys/systemjs.config.js')
      .then(() => {
        return builder.buildStatic('client/app/main.js', 'dist/app/app.js', {
          encodeNames: false,
          mangle: false,
          rollup: true
        });
      });
  }
}
