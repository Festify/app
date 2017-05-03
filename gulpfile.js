'use strict';

require('dotenv').config({silent: true});

const cordova = require('cordova-lib').cordova;
const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const del = require('del');
const mergeStream = require('merge-stream');
const path = require('path');
const Promise = require('bluebird');
const runSequence = require('run-sequence');
const sharp = require('sharp');
const through2 = require('through2');
const Vinyl = require('vinyl');

const autoprefixer = require('autoprefixer');
const PolymerProject = require('polymer-build').PolymerProject;
const htmlSplitter = new (require('polymer-build').HtmlSplitter)();

const browserSync = require('browser-sync').create();
const historyApiFallback = require('connect-history-api-fallback');

const webDir = 'build';
const appDir = 'www';

let watches = [{
    src: ["elements/**/*", "index.html"],
    tasks: browserSync.reload
}];

gulp.task('clean', function() {
    return del([
        webDir,
        path.join(appDir, '**/*')
    ]);
});

const cssProcessors = [
    autoprefixer({ browsers: ['last 2 versions'] })
];

function buildPolymer(project, develop) {
    const sources = project.sources()
        .pipe($.if(['index.html', 'app.html'], $.useref()))
        .pipe($.if('elements/app-shell.html', $.template({
            ENV: process.env
        })));
    const stream = mergeStream(sources, project.dependencies());

    if (develop) {
        return stream.pipe(project.bundler());
    }

    return stream
        .pipe(htmlSplitter.split())
        .pipe($.if(/\.html$/, $.htmlPostcss(cssProcessors)))
        .pipe($.if(['elements/**/*.js'], $.babel()))
        .pipe($.if(function(file) {
            return path.extname(file.path) === '.js' &&
                file.contents.toString().indexOf('@polymerBehavior') === -1;
        }, $.uglify({ preserveComments: 'license' })))
        .pipe(htmlSplitter.rejoin())
        .pipe($.if(/\.html$/, $.htmlmin({
            collapseWhitespace: true,
            removeComments: true
        })))
        .pipe(project.bundler());
}

function serve(directories) {
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
        server: directories
    });

    watches.forEach(function (item) {
        gulp.watch(item.src, item.tasks);
    });
}

gulp.task('polymer', function () {
    const project = new PolymerProject(require('./polymer.json'));

    return buildPolymer(project)
        .pipe(gulp.dest(webDir));
});

gulp.task('polymer-cordova', function() {
    const projectCordova = new PolymerProject(require('./polymer-cordova.json'));

    return buildPolymer(projectCordova)
        .pipe($.if('elements/app-shell.html', $.crisper()))
        .pipe(gulp.dest(appDir))
});

gulp.task('polymer-cordova:develop', function() {
    const projectCordova = new PolymerProject(require('./polymer-cordova.json'));

    return buildPolymer(projectCordova, true)
        .pipe($.if('elements/app-shell.html', $.crisper()))
        .pipe(gulp.dest(appDir));
});

gulp.task('generate-icons', function() {
    function responsify(sizes) {
        return $.responsive({
            '*.png': sizes.map(w => ({
                width: w,
                rename: { suffix: `-${w}` }
            }))
        }, { withMetadata: false });
    }

    const fullSizes = [
        29, 40, 50, 57,
        58, 60, 72, 76,
        80, 100, 114, 120,
        144, 152, 180
    ];
    const openSizes = [
        36, 48, 72, 96,
        144, 192, 512
    ];

    const full = gulp.src('images/icon-full.png')
        .pipe(responsify(fullSizes));
    const open = gulp.src('images/icon.png')
        .pipe(responsify(openSizes));

    return mergeStream(full, open)
        .pipe(gulp.dest(path.join(appDir, 'images/manifest')))
        .pipe(gulp.dest(path.join(webDir, 'images/manifest')));
});

gulp.task('generate-splash-screens', function () {
    const sizes = [
        // Android
        { size: [200, 320], height: 80, name: "platforms/android/res/drawable-port-ldpi/screen" },
        { size: [320, 480], height: 120, name: "platforms/android/res/drawable-port-mdpi/screen" },
        { size: [480, 800], height: 192, name: "platforms/android/res/drawable-port-hdpi/screen" },
        { size: [720, 1280], height: 288, name: "platforms/android/res/drawable-port-xhdpi/screen" },

        // iOS
        { size: [2208, 2208], height: 497, name: "res/ios/Default@3x~universal~anyany" },
        { size: [2732, 2732], height: 616, name: "res/ios/Default@2x~universal~anyany" },
    ];

    return gulp.src('images/icon.png')
        .pipe(through2.obj(function (file, _, cb) { // must be function
            const img = sharp(file.contents)
                .background('#1c1f24')
                .flatten();

            return Promise.map(sizes, ({ size, height, name }) => {
                let [outputWidth, outputHeight] = size;
                let tb = (outputHeight - height) / 2;
                let lr = (outputWidth - height) / 2;

                return img.clone()
                    .resize(height)
                    .extend({
                        top: Math.floor(tb),
                        bottom: Math.ceil(tb),
                        left: Math.floor(lr),
                        right: Math.ceil(lr)
                    })
                    .png()
                    .toBuffer()
                    .then(buf => this.push(new Vinyl({
                        contents: buf,
                        path: name + '.png'
                    })));
            })
                .then(() => cb());
        }))
        .pipe(gulp.dest(''));
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
    return serve(['.tmp', '.']);
});

gulp.task('serve-output', ['configure'], function () {
    return serve(['build']);
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
        ['polymer-cordova', 'generate-icons', 'generate-splash-screens'],
        cb
    );
});

gulp.task('build-all', function(cb) {
    runSequence(
        'clean',
        ['polymer', 'polymer-cordova', 'generate-icons', 'generate-splash-screens'],
        cb
    );
});
