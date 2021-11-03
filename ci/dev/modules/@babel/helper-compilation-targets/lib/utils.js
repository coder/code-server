"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.semverMin = semverMin;
exports.semverify = semverify;
exports.isUnreleasedVersion = isUnreleasedVersion;
exports.getLowestUnreleased = getLowestUnreleased;
exports.getHighestUnreleased = getHighestUnreleased;
exports.getLowestImplementedVersion = getLowestImplementedVersion;

var _helperValidatorOption = require("@babel/helper-validator-option");

var _targets = require("./targets");

const semver = require("semver");

const versionRegExp = /^(\d+|\d+.\d+)$/;
const v = new _helperValidatorOption.OptionValidator("@babel/helper-compilation-targets");

function semverMin(first, second) {
  return first && semver.lt(first, second) ? first : second;
}

function semverify(version) {
  if (typeof version === "string" && semver.valid(version)) {
    return version;
  }

  v.invariant(typeof version === "number" || typeof version === "string" && versionRegExp.test(version), `'${version}' is not a valid version`);
  const split = version.toString().split(".");

  while (split.length < 3) {
    split.push("0");
  }

  return split.join(".");
}

function isUnreleasedVersion(version, env) {
  const unreleasedLabel = _targets.unreleasedLabels[env];
  return !!unreleasedLabel && unreleasedLabel === version.toString().toLowerCase();
}

function getLowestUnreleased(a, b, env) {
  const unreleasedLabel = _targets.unreleasedLabels[env];
  const hasUnreleased = [a, b].some(item => item === unreleasedLabel);

  if (hasUnreleased) {
    return a === hasUnreleased ? b : a || b;
  }

  return semverMin(a, b);
}

function getHighestUnreleased(a, b, env) {
  return getLowestUnreleased(a, b, env) === a ? b : a;
}

function getLowestImplementedVersion(plugin, environment) {
  const result = plugin[environment];

  if (!result && environment === "android") {
    return plugin.chrome;
  }

  return result;
}