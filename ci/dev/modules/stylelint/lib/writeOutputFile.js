'use strict';

const path = require('path');
const stripAnsi = require('strip-ansi');
const writeFileAtomic = require('write-file-atomic');

/**
 * @param {string} content
 * @param {string} filePath
 * @returns {Promise<void>}
 */
module.exports = (content, filePath) =>
	writeFileAtomic(path.normalize(filePath), stripAnsi(content));
