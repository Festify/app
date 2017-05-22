const cordova = require('cordova-lib').cordova.raw;
const { difference } = require('lodash');

module.exports = function(context) {
    const plugins = require('../package.json').cordova.plugins;
    const pluginsPresent = context.opts.cordova.plugins;
    const installPlugins = difference(Object.keys(plugins), pluginsPresent)
        .filter(key => 'spec' in plugins[key]);

    return installPlugins.reduce((p, plugin) => {
        console.log(`Installing ${plugin} from git...`);
        return p.then(() => cordova.plugin('add', plugins[plugin].spec, {
            argv: ['--nofetch', '--nosave']
        }));
    }, Promise.resolve());
};
