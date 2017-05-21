const fs = require('fs');
const path = require('path');

module.exports = function(context) {
    const filePath = path.join(context.opts.projectRoot, 'package.json');
    const obj = JSON.parse(fs.readFileSync(filePath).toString());
    const fixed = JSON.stringify(obj, null, 2) + '\n';
    fs.writeFileSync(filePath, fixed);
};
