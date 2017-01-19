'use strict';

require('dotenv').config({silent: true});

const path = require('path');
const gulp = require('gulp');
const del = require('del');
const runSequence = require('run-sequence');
const PolymerProject = require('polymer-build').PolymerProject;
const mergeStream = require('merge-stream');
const browserSync = require('browser-sync').create();
const historyApiFallback = require('connect-history-api-fallback');
const $ = require('gulp-load-plugins')();
const cordova = require("cordova-lib").cordova;
const autoprefixer = require('autoprefixer');

const distDir = 'build';
const appDir = 'www';

let watches = [{
    src: ["elements/**/*", "index.html"],
    tasks: browserSync.reload
}];

gulp.task('clean', function() {
    return del([
        distDir,
        path.join(appDir, '**/*')
    ]);
});

const cssProcessors = [
    autoprefixer({browsers: ['last 2 versions']})
];

function buildPolymer(project, develop) {
    const sources = project.sources()
        .pipe($.if(['index.html', 'app.html'], $.useref()))
        .pipe($.if('elements/app-shell.html', $.template({
            ENV: process.env
        })));

    let stream = mergeStream(sources, project.dependencies())
        .pipe(project.splitHtml());

    if(!develop) {
        stream = stream.pipe($.if(/\.html$/, $.htmlPostcss(cssProcessors)))
            .pipe($.if(['elements/**/*.js'], $.babel()))
            .pipe($.if(function(file) {
                return path.extname(file.path) === '.js' && file.contents.toString().indexOf('@polymerBehavior') === -1;
            }, $.uglify({ preserveComments: 'license' })));
    }

    stream = stream.pipe(project.rejoinHtml());

    if(!develop) {
        stream = stream.pipe($.if(/\.html$/, $.htmlmin({
            collapseWhitespace: true,
            removeComments: true
        })));
    }

    return stream.pipe(project.bundler);
}

gulp.task('polymer', function () {
    const project = new PolymerProject(require('./polymer.json'));

    return buildPolymer(project)
        .pipe(gulp.dest(distDir));
});

gulp.task('polymer-cordova', function() {
    const projectCordova = new PolymerProject(require('./polymer-cordova.json'));
    return buildPolymer(projectCordova)
        .pipe($.if('elements/app-shell.html', $.crisper()))
        .pipe(gulp.dest(appDir))
});

gulp.task('build-cordova:develop', ['generate-icons-ios'], function() {
    const projectCordova = new PolymerProject(require('./polymer-cordova.json'));

    return buildPolymer(projectCordova, true)
        .pipe($.if('elements/app-shell.html', $.crisper()))
        .pipe(gulp.dest(appDir));
});

gulp.task('generate-icons-ios', function() {
    return gulp.src('images/icon-full.png')
        .pipe($.responsive({
            '*.png': [29, 40, 50, 57, 58, 60, 72, 76, 80, 100, 114, 120, 144, 152, 180].map(function (width) {
                return {width: width, rename: {suffix: '-' + width}};
            })
        }))
        .pipe(gulp.dest(path.join(appDir, 'images/manifest')));
});

gulp.task('generate-icons', ['generate-icons-ios'], function () {
    return gulp.src('images/icon.png')
        .pipe($.responsive({
            '*.png': [48, 72, 96, 144, 192, 512].map(function (width) {
                return {width: width, rename: {suffix: '-' + width + 'x' + width}};
            })
        }))
        .pipe(gulp.dest(path.join(distDir, 'images/manifest')));
});

gulp.task('configure', function() {
    return gulp.src("elements/app-shell.html", { base: '.' })
        .pipe($.template({
            ENV: process.env
        }))
        .pipe(gulp.dest('.tmp'));
});
watches.push({
    src: ["elements/app-shell.html"],
    tasks: ['configure', browserSync.reload]
});

gulp.task('serve', ['configure'], function () {
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
        server: ['.tmp', '.']
    });

    watches.forEach(function (item) {
        gulp.watch(item.src, item.tasks);
    });
});


gulp.task("package-cordova", function (callback) {
    cordova.build({
        "options": {
            argv: []
        }
    }, callback);
});

gulp.task("serve:cordova", ['build-cordova:develop'], function(cb) {
    cordova.run({}, cb);
});

gulp.task('build', function(cb) {
    runSequence(
        'clean',
        ['polymer', 'generate-icons'],
        cb
    );
});

gulp.task('build-cordova', function(cb) {
    runSequence(
        'clean',
        'polymer-cordova', 'generate-icons',
        cb
    );
});
