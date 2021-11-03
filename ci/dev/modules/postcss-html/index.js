"use strict";
const extract = require("./extract");
const syntax = require("postcss-syntax/syntax")(extract, "html");

module.exports = syntax;
