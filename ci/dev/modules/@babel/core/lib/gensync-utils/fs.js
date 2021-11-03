"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stat = exports.exists = exports.readFile = void 0;

const fs = require("fs");

const gensync = require("gensync");

const readFile = gensync({
  sync: fs.readFileSync,
  errback: fs.readFile
});
exports.readFile = readFile;
const exists = gensync({
  sync(path) {
    try {
      fs.accessSync(path);
      return true;
    } catch (_unused) {
      return false;
    }
  },

  errback: (path, cb) => fs.access(path, undefined, err => cb(null, !err))
});
exports.exists = exists;
const stat = gensync({
  sync: fs.statSync,
  errback: fs.stat
});
exports.stat = stat;