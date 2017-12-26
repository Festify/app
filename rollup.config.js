import minify from 'rollup-plugin-babel-minify';
import cjs from 'rollup-plugin-commonjs';
import copy from 'rollup-plugin-copy';
import nodeGlobals from 'rollup-plugin-node-globals';
import nodeBuiltins from 'rollup-plugin-node-builtins';
import nodeResolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import minifyLit from '@mraerino/rollup-plugin-minifyliterals';
import browsersync from 'rollup-plugin-browsersync';
import replace from 'rollup-plugin-replace';
import historyApi from 'connect-history-api-fallback';
import path from 'path';
import fs from 'fs';

const distTarget = './dist';
const dist = (dest = "") => path.join(distTarget, dest);

const srcTarget = './src';
const src = (dest = "") => path.join(srcTarget, dest);

const isProduction = process.env.NODE_ENV === 'production';

// load firebase config from ENV
const firebaseConfigPath = "./firebase.config.js";
if (process.env.FIREBASE_CONFIG) {
    const data = JSON.parse(process.env.FIREBASE_CONFIG);
    fs.writeFileSync(firebaseConfigPath, `export default ${JSON.stringify(data, null, 4)}`);
}

export default {
    input: src('index.ts'),
    output: {
        file: dist('index.js'),
        format: 'iife',
        sourcemap: !isProduction
    },
    plugins: [
        replace({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        }),
        nodeBuiltins(),
        nodeResolve({
            browser: true,
            customResolveOptions: {
                packageFilter: pkg => {
                    if (pkg['module']) {
                        pkg['main'] = pkg['module'];
                    } else if (pkg['jsnext:main']) {
                        pkg['main'] = pkg['jsnext:main'];
                    }

                    const fixedPackages = ['@firebase/util', '@firebase/database'];
                    if (fixedPackages.indexOf(pkg.name) !== -1) {
                        pkg['browser'] = pkg.main;
                    }

                    return pkg;
                },
            },
        }),
        typescript(),
        copy({
            [src('index.html')]: dist('index.html'),
        }),
        cjs(),
        nodeGlobals(),
        isProduction ? minifyLit({
            include: ['src/app.ts', 'src/{components,views}/**', 'node_modules/@polymer/{paper,iron}-*/**'],
            includeExtension: ['.ts', '.js'],
            literals: false,
            htmlminifier: {
                minifyCSS: true, // causes some kind of trouble currently
                collapseWhitespace: true
            }
        }) : null,
        isProduction ? minify({ comments: false }) : null,
        !!process.env.ROLLUP_WATCH ? browsersync({
            server: {
                baseDir: dist(),
                middleware: [historyApi()]
            },
            open: false,
            ui: false
        }) : null
    ].filter(plugin => plugin !== null),
    onwarn: err => console.error(err.toString()),
    watch: {
        include: 'src/**'
    }
};