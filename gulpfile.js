'use strict';

var gulp = require('gulp');
var del = require('del');
var $ = require('gulp-load-plugins')();

gulp.task('generate-icons', ['clean-icons'], function() {
    return gulp.src('images/icon.png')
        .pipe($.responsive({
            '*.png': [48, 72, 96, 144, 192, 512].map(function (width) {
                return { width: width, rename: { suffix: '-' + width + 'x' + width }};
            })
        }))
        .pipe(gulp.dest('images/manifest'));
});

gulp.task('clean-icons', function() {
    return del(['images/manifest/*.png']);
});