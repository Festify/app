const $ = require('gulp-load-plugins')();
const gulp = require('gulp');
const path = require('path');
const { paths } = require('./gulp-config');
const Promise = require('bluebird');
const sharp = require('sharp');
const through2 = require('through2');
const Vinyl = require('vinyl');

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
        .pipe(gulp.dest(path.join(paths.appDir, 'images/manifest')))
        .pipe(gulp.dest(path.join(paths.webDir, 'images/manifest')));
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
        .pipe(gulp.dest(path.join(paths.appDir, 'images/manifest')));
});
