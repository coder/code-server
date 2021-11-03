define(['./_tagTester', './isFunction', './isArrayBuffer', './_stringTagBug'], function (_tagTester, isFunction, isArrayBuffer, _stringTagBug) {

  var isDataView = _tagTester('DataView');

  // In IE 10 - Edge 13, we need a different heuristic
  // to determine whether an object is a `DataView`.
  function ie10IsDataView(obj) {
    return obj != null && isFunction(obj.getInt8) && isArrayBuffer(obj.buffer);
  }

  var isDataView$1 = (_stringTagBug.hasStringTagBug ? ie10IsDataView : isDataView);

  return isDataView$1;

});
