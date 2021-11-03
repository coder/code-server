"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = normalizeOptions;

const path = require("path");

function normalizeOptions(config) {
  const {
    filename,
    cwd,
    filenameRelative = typeof filename === "string" ? path.relative(cwd, filename) : "unknown",
    sourceType = "module",
    inputSourceMap,
    sourceMaps = !!inputSourceMap,
    sourceRoot = config.options.moduleRoot,
    sourceFileName = path.basename(filenameRelative),
    comments = true,
    compact = "auto"
  } = config.options;
  const opts = config.options;
  const options = Object.assign({}, opts, {
    parserOpts: Object.assign({
      sourceType: path.extname(filenameRelative) === ".mjs" ? "module" : sourceType,
      sourceFileName: filename,
      plugins: []
    }, opts.parserOpts),
    generatorOpts: Object.assign({
      filename,
      auxiliaryCommentBefore: opts.auxiliaryCommentBefore,
      auxiliaryCommentAfter: opts.auxiliaryCommentAfter,
      retainLines: opts.retainLines,
      comments,
      shouldPrintComment: opts.shouldPrintComment,
      compact,
      minified: opts.minified,
      sourceMaps,
      sourceRoot,
      sourceFileName
    }, opts.generatorOpts)
  });

  for (const plugins of config.passes) {
    for (const plugin of plugins) {
      if (plugin.manipulateOptions) {
        plugin.manipulateOptions(options, options.parserOpts);
      }
    }
  }

  return options;
}