'use strict';

const extract = require('./extract');
const syntax = require('postcss-syntax/syntax')(extract, 'jsx');

module.exports = syntax;
