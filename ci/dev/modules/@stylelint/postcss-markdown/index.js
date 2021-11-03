"use strict";
const extract = require("./extract");
const syntax = require("postcss-syntax/syntax")(extract, "markdown");

module.exports = syntax;
