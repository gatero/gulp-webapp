'use strict';

var gulp = require('gulp'),
    browserSync = require('browser-sync'),

    scsslint = require('gulp-scss-lint'),
    wiredep = require('wiredep').stream,

    // Load plugins
    $ = require('gulp-load-plugins')(),

    // config paths
    config = {
      app: 'app',
      dist: 'dist',
      tmp: '.tmp'
    },

    // autoprefix support
    browsers = [
      '> 1%',
      'last 2 versions',
      'Firefox ESR',
      'Opera 12.1'
    ];

gulp.task('styles', function() {
  gulp
    .src(config.app+'/styles/main.scss')
    .pipe($.autoprefixer())
    .pipe($.sass())
    .pipe(gulp.dest(config.tmp+'/styles'))
    .pipe(browserSync.reload({stream: true}))
});

gulp.task('scss-lint', function() {
  gulp
    .src([config.app+'/styles/main.scss', config.app+'/styles/*/*.scss'])
    .pipe(scsslint({
      'config' : '.scss-lint.yml'
    }));
});

gulp.task('usemin', function () {
  gulp
    .src(config.tmp+'/*.html')
    .pipe(
      $.usemin({
        html: false,
        css: [$.minifyCss(), $.rev()],
        js: [$.uglify(), $.rev()],
        inlinejs: [$.uglify()],
        inlinecss: [$.minifyCss(), 'concat']
      })
    )
    .pipe(gulp.dest(config.dist));
});


gulp.task('bower', function () {
  gulp
    .src(config.app+'/jade/layout/template.jade')
    .pipe(
      wiredep({
        directory: 'bower_components',
        ignorePath: /(^\/|\.\.\/)*/
      }).on('error', $.util.log)
    )
    .pipe(gulp.dest(config.app+'/jade/layout/'));
});

gulp.task('coffee', function() {
  gulp
    .src(config.app+'/scripts/main.coffee')
    .pipe(
      $.include().on('error', $.util.log)
    )
    .pipe(
      $.coffee({
        bare: true
      })
      .on('error', $.util.log)
    )
    .pipe(gulp.dest(config.tmp+'/scripts/'))
});

gulp.task('jade', function(){
  gulp
    .src([
      '!'+config.app+'/jade/layout/template.jade',
      config.app+'/jade/*.jade'
    ])
    .pipe(
      $.jade({
        pretty: true
      })
      .on('error', $.util.log)
    )
    .pipe(gulp.dest(config.tmp))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('images', function() {
  gulp
    .src(config.app+'/images/**/*')
    .pipe(
      $.imagemin({
        svgoPlugins: [{
          convertPathData: false
        }]
      })
      .on('error', $.util.log)
    )
    .pipe(gulp.dest(config.tmp+'/images'));
});

gulp.task('browser-sync', function() {
  browserSync({
    server: {
      baseDir: config.tmp,
      routes: {
        "/bower_components": "bower_components"
      }
    }
  });
});

// JSHint grunfile.js
gulp.task('selfcheck', function() {
  gulp
    .src('gulpfile.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'))
    .pipe($.jshint.reporter('fail'));
});

gulp.task('clean', function(cb) {
  var del = require('del');
  del(['build'], cb);
});

gulp.task('watch', ['coffee','scss-lint','styles','images','jade', 'bower'], function() {
  gulp.watch(config.app+'/**/*.scss', ['scss-lint','styles']);
  gulp.watch(config.app+'/scripts/*.coffee', ['coffee']);
  gulp.watch(config.app+'/images/**/*', ['images']);
  gulp.watch(config.app+'/**/*.jade', ['jade']);
  gulp.watch('bower.json', ['bower']);
  gulp.start('browser-sync');
});

gulp.task('build', ['usemin'], function(){
  gulp
    .src(config.tmp+'/images/**/*')
    .pipe(gulp.dest(config.dist+'/images'));
});

gulp.task('default', ['clean'], function() {
  gulp.start('watch');
});
