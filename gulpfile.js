'use strict';

const dotenv = require('dotenv');
const cordova = require('cordova-lib').cordova;
const fs = require('fs');
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
const request = require('request');
const git = require('git-rev');
const prompt = require('prompt');
const util = require('util');

const autoprefixer = require('autoprefixer');
const { HtmlSplitter, PolymerProject } = require('polymer-build');

const browserSync = require('browser-sync').create();
const historyApiFallback = require('connect-history-api-fallback');

dotenv.config({ path: '.env-default' });

const webDir = 'build';
const appDir = 'www';
const electronDir = 'electron/www';

const envFiles = ['.env', 'google-services.json', 'GoogleService-Info.plist'];

const watches = [{
    src: ["elements/**/*", "index.html"],
    tasks: browserSync.reload
}, {
    src: ["elements/app-shell.html"],
    tasks: ['configure', browserSync.reload]
}];

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

    const htmlSplitter = new HtmlSplitter();
    return stream
        .pipe(htmlSplitter.split())
        .pipe($.if(/\.html$/, $.htmlPostcss([
            autoprefixer({ browsers: ['last 2 versions'] })
        ])))
        .pipe($.if(
            file => path.extname(file.path) === '.js' &&
                file.path.indexOf('webcomponentsjs') === -1 &&
                file.path.indexOf('firebase') === -1,
            $.babel()
        ))
        .pipe($.if(
            file => path.extname(file.path) === '.js' &&
                file.path.indexOf('webcomponentsjs') === -1 &&
                file.path.indexOf('firebase') === -1,
            $.uglify()
        ))
        .pipe(htmlSplitter.rejoin())
        .pipe($.if(/\.html$/, $.htmlmin({
            collapseWhitespace: true,
            removeComments: true
        })))
        .pipe(project.addCustomElementsEs5Adapter())
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

gulp.task('clean', function() {
    return del([
        webDir,
        path.join(appDir, '**/*')
    ]);
});

gulp.task('configure', ['prepare-env'], function() {
    return gulp.src("elements/app-shell.html", { base: '.' })
        .pipe($.template({
            ENV: process.env
        }))
        .pipe(gulp.dest('.tmp'));
});

gulp.task('prepare-env', function () {
    const fileTemplate = process.env.FILE_URL_TEMPLATE;

    if (!fileTemplate) {
        console.warn("Cannot find .env file URL template. Per-branch env configuration will not be performed.")
        return Promise.resolve();
    }

    return new Promise((res, rej) => {
        if (process.env.CI) {
            res(process.env.TRAVIS_BRANCH);
        } else {
            try {
                git.branch(res);
            } catch (e) {
                rej(e);
            }
        }
    })
        .then(b => (b === 'master' || b === 'testing') ? b : 'develop')
        .then((branch) => Promise.map(envFiles, file => {
            const url = util.format(fileTemplate, branch, file);
            return new Promise((res, rej) => {
                request(url)
                    .pipe(fs.createWriteStream(file))
                    .once('error', rej)
                    .once('finish', res);
            });
        }))
        .then(() => {
            const { error } = dotenv.load();
            return !error ? Promise.resolve() : Promise.reject(error);
        });
});

gulp.task('polylint', function() {
    return gulp.src('app/elements/**/*.html')
        .pipe($.polylint())
        .pipe($.polylint.reporter($.polylint.reporter.stylishlike))
        .pipe($.polylint.reporter.fail({ buffer: true, ignoreWarnings: false }));
});

gulp.task('lint', ['polylint'], function() {
    //return gulp.src(['**/*.{js,html}','!node_modules/**'])
    // .pipe($.eslint())
    // .pipe($.eslint.format())
    // .pipe($.eslint.failAfterError());
});

gulp.task('polymer', ['prepare-env'], function () {
    const project = new PolymerProject(require('./polymer.json'));

    return buildPolymer(project)
        .pipe(gulp.dest(webDir));
});

gulp.task('polymer-electron', ['prepare-env'], function() {
    const projectElectron = new PolymerProject(require('./polymer-electron.json'));

    return buildPolymer(projectElectron)
        .pipe($.if('elements/app-shell.html', $.crisper()))
        .pipe(gulp.dest(electronDir))
});

gulp.task('polymer-cordova', ['prepare-env'], function() {
    const projectCordova = new PolymerProject(require('./polymer-cordova.json'));

    return buildPolymer(projectCordova)
        .pipe($.if('elements/app-shell.html', $.crisper()))
        .pipe(gulp.dest(appDir))
});

gulp.task('polymer-cordova:develop', ['prepare-env'], function() {
    const projectCordova = new PolymerProject(require('./polymer-cordova.json'));

    return buildPolymer(projectCordova, true)
        .pipe($.if('elements/app-shell.html', $.crisper()))
        .pipe(gulp.dest(appDir));
});

gulp.task('generate-icons', function() {
    const fullSizes = [
        29, 36, 40, 48,
        50, 57, 58, 60,
        72, 76, 80, 96,
        100, 114, 120, 144,
        152, 180, 192, 512
    ];

    return gulp.src(['images/icon-full.png', 'images/icon.png'])
        .pipe($.responsive({
            '*.png': fullSizes.map(w => ({
                width: w,
                rename: { suffix: `-${w}` }
            }))
        }, { withMetadata: false }))
        .pipe(gulp.dest(path.join(appDir, 'images/manifest')))
        .pipe(gulp.dest(path.join(webDir, 'images/manifest')));
});

gulp.task('generate-splash-screens', function () {
    const sizes = [
        // Android
        { size: [200, 320], height: 80, name: "splash-ldpi" },
        { size: [320, 480], height: 120, name: "splash-mdpi" },
        { size: [480, 800], height: 192, name: "splash-hdpi" },
        { size: [720, 1280], height: 288, name: "splash-xhdpi" },

        // iOS
        { size: [2208, 2208], height: 497, name: "Default@3x~universal~anyany" },
        { size: [2732, 2732], height: 616, name: "Default@2x~universal~anyany" },
    ];

    return gulp.src('images/icon.png')
        .pipe(through2.obj(function (file, _, cb) { // must be function
            const img = sharp(file.contents)
                .background('#1c1f24')
                .flatten();

            return Promise.map(sizes, ({ size, height, name }) => {
                const [outputWidth, outputHeight] = size;
                const tb = (outputHeight - height) / 2;
                const lr = (outputWidth - height) / 2;

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
        .pipe(gulp.dest('www/images/manifest'));
});

// Build bases
gulp.task('build:web', ['polymer', 'generate-icons']);
gulp.task('build:mobile', ['polymer-cordova', 'generate-splash-screens', 'generate-icons']);
gulp.task('build:desktop', ['polymer-electron']);

// User-facing tasks
gulp.task('build', ['clean'], function(cb) {
    runSequence('build:web', cb);
});

gulp.task('build-cordova', ['clean'], function(cb) {
    runSequence('build:mobile', cb);
});

gulp.task('build-all', ['clean'], function(cb) {
    runSequence(
        ['build:web', 'build:mobile', 'build:desktop'],
        cb
    );
});

// Cordova tasks
gulp.task('cordova:release:android-apk', ['build-cordova'], function(cb) {
    prompt.message = "";
    prompt.delimiter = "";
    prompt.colors = false;
    prompt.start();
    prompt.get({
        properties: {
            password: {
                description: "Keystore/Key password:",
                hidden: true
            }
        }
    }, function(err, result) {
        if(err){
            return cb(err);
        }
        cordova.raw.build({
            platforms: ['android'],
            options: {
                release: true,
                argv: [
                    "--keystore", "../android-sign/upload.keystore",
                    "--alias", "upload",
                    "--storePassword", result.password,
                    "--password", result.password
                ]
            }
        }).done(cb);
    });
});

gulp.task('cordova:release:android', ['cordova:release:android-apk'], function() {
    return gulp.src('platforms/android/build/outputs/apk/android-release.apk')
        .pipe(gulp.dest('build-mobile'));
});

gulp.task('serve', ['configure'], function () {
    return serve(['.tmp', '.']);
});

gulp.task('serve-output', ['configure'], function () {
    return serve(['build']);
});
