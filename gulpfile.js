'use strict';

const builder = require('electron-builder');
const config = require('./scripts/gulp-config');
const cordova = require('cordova-lib').cordova;
const dotenv = require('dotenv');
const gulp = require('gulp');
const prompt = require('prompt');
const runSequence = require('run-sequence');

dotenv.config({ path: '.env-default' });

require('./scripts/gulp-meta');
require('./scripts/gulp-polymer');
require('./scripts/gulp-watch');

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

gulp.task('release:electron:mac', ['build-electron'], function () {
    process.chdir('./electron');
    return builder.build({
        targets: builder.Platform.MAC.createTarget(),
        config: config.electron,
        publish: 'always'
    });
});

gulp.task('release:electron:win', ['build-electron'], function () {
    process.chdir('./electron');
    return builder.build({
        targets: builder.Platform.WINDOWS.createTarget(),
        config: config.electron,
        publish: 'always'
    });
});


gulp.task('release:electron', ['build-electron'], function () {
    process.chdir('./electron');
    return builder.build({
        targets: [builder.Platform.WINDOWS.createTarget(), builder.Platform.MAC.createTarget()],
        config: config.electron,
        publish: 'always'
    });
});
