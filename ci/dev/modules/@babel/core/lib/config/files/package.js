"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findPackageData = findPackageData;

var _utils = require("./utils");

const path = require("path");

const PACKAGE_FILENAME = "package.json";

function* findPackageData(filepath) {
  let pkg = null;
  const directories = [];
  let isPackage = true;
  let dirname = path.dirname(filepath);

  while (!pkg && path.basename(dirname) !== "node_modules") {
    directories.push(dirname);
    pkg = yield* readConfigPackage(path.join(dirname, PACKAGE_FILENAME));
    const nextLoc = path.dirname(dirname);

    if (dirname === nextLoc) {
      isPackage = false;
      break;
    }

    dirname = nextLoc;
  }

  return {
    filepath,
    directories,
    pkg,
    isPackage
  };
}

const readConfigPackage = (0, _utils.makeStaticFileCache)((filepath, content) => {
  let options;

  try {
    options = JSON.parse(content);
  } catch (err) {
    err.message = `${filepath}: Error while parsing JSON - ${err.message}`;
    throw err;
  }

  if (!options) throw new Error(`${filepath}: No config detected`);

  if (typeof options !== "object") {
    throw new Error(`${filepath}: Config returned typeof ${typeof options}`);
  }

  if (Array.isArray(options)) {
    throw new Error(`${filepath}: Expected config object but found array`);
  }

  return {
    filepath,
    dirname: path.dirname(filepath),
    options
  };
});