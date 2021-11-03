'use strict';
const findUp = require('find-up');

module.exports = cwd => findUp('package.json', {cwd});
module.exports.sync = cwd => findUp.sync('package.json', {cwd});
