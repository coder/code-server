"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeStaticFileCache = makeStaticFileCache;

var _caching = require("../caching");

var fs = _interopRequireWildcard(require("../../gensync-utils/fs"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const nodeFs = require("fs");

function makeStaticFileCache(fn) {
  return (0, _caching.makeStrongCache)(function* (filepath, cache) {
    const cached = cache.invalidate(() => fileMtime(filepath));

    if (cached === null) {
      return null;
    }

    return fn(filepath, yield* fs.readFile(filepath, "utf8"));
  });
}

function fileMtime(filepath) {
  try {
    return +nodeFs.statSync(filepath).mtime;
  } catch (e) {
    if (e.code !== "ENOENT" && e.code !== "ENOTDIR") throw e;
  }

  return null;
}