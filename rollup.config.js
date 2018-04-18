import historyApi from 'connect-history-api-fallback';
import * as fs from 'fs';
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
import uglify from 'rollup-plugin-uglify';
import path from 'path';

const distTarget = './build';
const dist = (dest = "") => path.join(distTarget, dest);

const srcTarget = './src';
const src = (dest = "") => path.join(srcTarget, dest);

const isProduction = process.env.NODE_ENV === 'production';

if (!fs.existsSync('build')) {
    fs.mkdirSync('build');
}

const plugins = [
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
    cjs(),
    nodeGlobals(),
    isProduction ? minifyLit({
        include: ['src/index.ts', 'src/{components,views}/**', 'node_modules/@polymer/{paper,iron}-*/**'],
        includeExtension: ['.ts', '.js'],
        literals: false,
        htmlminifier: {
            minifyCSS: true, // causes some kind of trouble currently
            collapseWhitespace: true
        }
    }) : null,
    isProduction ? uglify() : null,
    !!process.env.ROLLUP_WATCH ? browsersync({
        port: process.env.PORT || 3000,
        server: {
            baseDir: dist(),
            middleware: [historyApi()]
        },
        open: false,
        ui: false
    }) : null,
].filter(plugin => plugin !== null);

const baseOptions = {
    input: [src('index.ts'), src('views/view-party.ts'), src('views/view-tv.ts')],
    experimentalDynamicImport: true,
    experimentalCodeSplitting: true,
    plugins,
    onwarn: err => console.error(err.toString()),
    watch: { include: 'src/**/*' },
};

export default [{
    ...baseOptions,
    output: {
        dir: dist('module'),
        format: 'es',
        sourcemap: true,
    },
}, {
    ...baseOptions,
    output: {
        dir: dist('nomodule'),
        format: 'system',
        sourcemap: true,
    },
}];
