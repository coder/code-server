'use strict';

var path = require('path');

function replaceExt(npath, ext) {
  if (typeof npath !== 'string') {
    return npath;
  }

  if (npath.length === 0) {
    return npath;
  }

  var nFileName = path.basename(npath, path.extname(npath)) + ext;
  var nFilepath = path.join(path.dirname(npath), nFileName);

  // Because `path.join` removes the head './' from the given path.
  // This removal can cause a problem when passing the result to `require` or
  // `import`.
  if (startsWithSingleDot(npath)) {
    return '.' + path.sep + nFilepath;
  }

  return nFilepath;
}

function startsWithSingleDot(fpath) {
  var first2chars = fpath.slice(0, 2);
  return (first2chars === '.' + path.sep) ||
         (first2chars === './');
}

module.exports = replaceExt;
