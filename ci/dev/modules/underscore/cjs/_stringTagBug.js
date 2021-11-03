Object.defineProperty(exports, '__esModule', { value: true });

var _setup = require('./_setup.js');
var _hasObjectTag = require('./_hasObjectTag.js');

// In IE 10 - Edge 13, `DataView` has string tag `'[object Object]'`.
// In IE 11, the most common among them, this problem also applies to
// `Map`, `WeakMap` and `Set`.
var hasStringTagBug = (
      _setup.supportsDataView && _hasObjectTag(new DataView(new ArrayBuffer(8)))
    ),
    isIE11 = (typeof Map !== 'undefined' && _hasObjectTag(new Map));

exports.hasStringTagBug = hasStringTagBug;
exports.isIE11 = isIE11;
