const { envFiles, paths } = require('./gulp-config');
const del = require('del');
const dotenv = require('dotenv');
const fs = require('fs');
const git = require('git-rev');
const gulp = require('gulp');
const path = require('path');
const Promise = require('bluebird');
const request = require('request');
const template = require('gulp-template');
const util = require('util');

gulp.task('configure', ['prepare-env'], function() {
    return gulp.src("elements/app-shell.html", { base: '.' })
        .pipe(template({ ENV: process.env }))
        .pipe(gulp.dest('.tmp'));
});

gulp.task('clean', function() {
    return del([
        paths.webDir,
        paths.electronDir,
        path.join(paths.appDir, '**/*')
    ]);
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
