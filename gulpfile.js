'use strict';

const path = require('path');
const gulp = require('gulp');
const del = require('del');
const runSequence = require('run-sequence');
const PolymerProject = require('polymer-build').PolymerProject;
const mergeStream = require('merge-stream');
const browserSync = require('browser-sync').create();
const historyApiFallback = require('connect-history-api-fallback');
const $ = require('gulp-load-plugins')();

const distDir = 'build';

var watches = [];

gulp.task('clean', function() {
    return del(distDir);
});

gulp.task('polymer', function () {
    const project = new PolymerProject(require('./polymer.json'));

    return mergeStream(project.sources(), project.dependencies())
        .pipe(project.analyzer)
        .pipe($.if('index.html', $.useref()))
        .pipe(project.bundler)
        .pipe(gulp.dest(distDir));
});
watches.push({
    src: "elements/**/*",
    tasks: browserSync.reload
});

gulp.task('generate-icons', ['clean-icons'], function () {
    return gulp.src('images/icon.png')
        .pipe($.responsive({
            '*.png': [48, 72, 96, 144, 192, 512].map(function (width) {
                return {width: width, rename: {suffix: '-' + width + 'x' + width}};
            })
        }))
        .pipe(gulp.dest(path.join(distDir, 'images/manifest')));
});

gulp.task('serve', function () {
    browserSync.init({
        notify: false,
        open: false,
        reloadOnRestart: true,
        snippetOptions: {
            rule: {
                match: '<span id="browser-sync-binding"></span>'
            }
        },
        middleware: [historyApiFallback()],
        ui: false,
        injectChanges: false,
        ghostMode: false,
        server: {
            baseDir: ['.']
        }
    });

    watches.forEach(function (item) {
        gulp.watch(item.src, item.tasks);
    });
});

gulp.task('build', function(cb) {
    runSequence(
        'clean',
        ['polymer', 'generate-icons'],
        cb
    );
});
