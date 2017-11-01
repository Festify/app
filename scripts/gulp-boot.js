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
const jsonEdit = require('gulp-json-editor');
const formatDate = require('date-fns/format');

async function getBranch() {
    return new Promise((res, rej) => {
        if (process.env.TRAVIS_BRANCH) {
            res(process.env.TRAVIS_BRANCH);
            return;
        }

        try {
            git.branch(res);
        } catch (e) {
            rej(e);
        }
    });
}

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

    return getBranch()
        .then(b => (b === 'master' || b === 'testing') ? b : 'develop')
        .then((branch) => Promise.map(envFiles, file => {
            const url = util.format(fileTemplate, branch, file);
            return new Promise(res => {
                request(url, { timeout: 5000 })
                    .on('error', () => {
                        console.warn(`Network request for env file ${file} failed. Per-branch configuration will not be performed.`);
                        res();
                    })
                    .pipe(fs.createWriteStream(file))
                    .once('finish', res);
            });
        }))
        .then(() => {
            const { error } = dotenv.load();
            return !error ? Promise.resolve() : Promise.reject(error);
        });
});

gulp.task('prepare-version', async () => {
    if(process.env.CI !== "true") {
        return;
    }
    const majorVersion = parseInt(require('../package.json').version); // stops at dots!
    const branch = await getBranch();
    gulp.src(['package.json', 'electron/package.json'], { base: '.' })
            .pipe(jsonEdit(data =>
                Object.assign(data, {
                    version: branch === 'master'
                        ? `${majorVersion}.${formatDate(new Date(), "YYYYMMDD.HHMM")}`
                        : `${majorVersion}.0.0-${branch}`
                })))
            .pipe(gulp.dest('.'))
});
