'use strict';

const builder = require('electron-builder');
const config = require('./scripts/gulp-config');
const cordova = require('cordova-lib').cordova;
const dotenv = require('dotenv');
const gulp = require('gulp');
const prompt = require('prompt');
const runSequence = require('run-sequence');
const bump = require('gulp-bump');

dotenv.config({ path: '.env-default' });

require('./scripts/gulp-meta');
require('./scripts/gulp-polymer');
require('./scripts/gulp-watch');

// Build bases
gulp.task('build:web', ['polymer', 'generate-icons', 'prepare-version']);
gulp.task('build:mobile', ['polymer-cordova', 'generate-splash-screens', 'generate-icons']);
gulp.task('build:desktop', ['polymer-electron', 'prepare-version']);

// User-facing tasks
gulp.task('build', ['clean'], function(cb) {
    runSequence('build:web', cb);
});

gulp.task('build-cordova', ['clean'], function(cb) {
    runSequence('build:mobile', cb);
});

gulp.task('build-electron', ['clean'], function (cb) {
    runSequence('build:desktop', cb);
});

gulp.task('build-all', ['clean'], function(cb) {
    runSequence(
        ['build:web', 'build:mobile', 'build:desktop'],
        cb
    );
});

// Packaging tasks
gulp.task('release:cordova:android-apk', ['build-cordova'], function(cb) {
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

gulp.task('release:cordova:android', ['release:cordova:android-apk'], function() {
    return gulp.src('platforms/android/build/outputs/apk/android-release.apk')
        .pipe(gulp.dest('build-mobile'));
});

const bumpVersion = (type) => gulp.src(['./package.json', './electron/package.json', './config.xml'], {base: '.'})
    .pipe(bump({type: type}))
    .pipe(gulp.dest('./'));

gulp.task('bump', () => bumpVersion('patch'));
gulp.task('bump:patch', () => bumpVersion('patch'));
gulp.task('bump:minor', () => bumpVersion('minor'));
gulp.task('bump:major', () => bumpVersion('major'));
