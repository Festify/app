require('./gulp-boot');

const browserSync = require('browser-sync').create();
const gulp = require('gulp');
const historyApiFallback = require('connect-history-api-fallback');

const watches = [{
    src: ["elements/**/*", "index.html"],
    tasks: browserSync.reload
}, {
    src: ["elements/app-shell.html"],
    tasks: ['configure', browserSync.reload]
}];

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

gulp.task('serve', ['configure'], function () {
    return serve(['.tmp', '.']);
});

gulp.task('serve-output', ['configure'], function () {
    return serve(['build']);
});
