"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeConfigAPI = makeConfigAPI;
exports.makePresetAPI = makePresetAPI;
exports.makePluginAPI = makePluginAPI;

var _ = require("../../");

var _caching = require("../caching");

var Context = _interopRequireWildcard(require("../cache-contexts"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const semver = require("semver");

function makeConfigAPI(cache) {
  const env = value => cache.using(data => {
    if (typeof value === "undefined") return data.envName;

    if (typeof value === "function") {
      return (0, _caching.assertSimpleType)(value(data.envName));
    }

    if (!Array.isArray(value)) value = [value];
    return value.some(entry => {
      if (typeof entry !== "string") {
        throw new Error("Unexpected non-string value");
      }

      return entry === data.envName;
    });
  });

  const caller = cb => cache.using(data => (0, _caching.assertSimpleType)(cb(data.caller)));

  return {
    version: _.version,
    cache: cache.simple(),
    env,
    async: () => false,
    caller,
    assertVersion
  };
}

function makePresetAPI(cache) {
  const targets = () => JSON.parse(cache.using(data => JSON.stringify(data.targets)));

  return Object.assign({}, makeConfigAPI(cache), {
    targets
  });
}

function makePluginAPI(cache) {
  const assumption = name => cache.using(data => data.assumptions[name]);

  return Object.assign({}, makePresetAPI(cache), {
    assumption
  });
}

function assertVersion(range) {
  if (typeof range === "number") {
    if (!Number.isInteger(range)) {
      throw new Error("Expected string or integer value.");
    }

    range = `^${range}.0.0-0`;
  }

  if (typeof range !== "string") {
    throw new Error("Expected string or integer value.");
  }

  if (semver.satisfies(_.version, range)) return;
  const limit = Error.stackTraceLimit;

  if (typeof limit === "number" && limit < 25) {
    Error.stackTraceLimit = 25;
  }

  const err = new Error(`Requires Babel "${range}", but was loaded with "${_.version}". ` + `If you are sure you have a compatible version of @babel/core, ` + `it is likely that something in your build process is loading the ` + `wrong version. Inspect the stack trace of this error to look for ` + `the first entry that doesn't mention "@babel/core" or "babel-core" ` + `to see what is calling Babel.`);

  if (typeof limit === "number") {
    Error.stackTraceLimit = limit;
  }

  throw Object.assign(err, {
    code: "BABEL_VERSION_UNSUPPORTED",
    version: _.version,
    range
  });
}