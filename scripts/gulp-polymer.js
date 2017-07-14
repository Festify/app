require('./gulp-boot');

const $ = require('gulp-load-plugins')();
const autoprefixer = require('autoprefixer');
const gulp = require('gulp');
const { HtmlSplitter, PolymerProject } = require('polymer-build');
const mergeStream = require('merge-stream');
const path = require('path');
const { paths } = require('./gulp-config');

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
            $.babili()
        ))
        .pipe(htmlSplitter.rejoin())
        .pipe($.if(/\.html$/, $.htmlmin({
            collapseWhitespace: true,
            removeComments: true
        })))
        .pipe(project.addCustomElementsEs5Adapter())
        .pipe(project.bundler())
        .pipe(project.addPushManifest());
}

gulp.task('polymer', ['prepare-env'], function () {
    const project = new PolymerProject(require('../polymer.json'));

    return buildPolymer(project)
        .pipe(gulp.dest(paths.webDir));
});

gulp.task('polymer-electron', ['prepare-env'], function() {
    const projectElectron = new PolymerProject(require('../polymer-electron.json'));

    return buildPolymer(projectElectron, true)
        .pipe(gulp.dest(paths.electronDir))
});

gulp.task('polymer-cordova', ['prepare-env'], function() {
    const projectCordova = new PolymerProject(require('../polymer-cordova.json'));

    return buildPolymer(projectCordova)
        .pipe(gulp.dest(paths.appDir))
});

gulp.task('polymer-cordova:develop', ['prepare-env'], function() {
    const projectCordova = new PolymerProject(require('../polymer-cordova.json'));

    return buildPolymer(projectCordova, true)
        .pipe(gulp.dest(paths.appDir));
});
