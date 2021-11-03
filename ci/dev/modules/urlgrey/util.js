
var isObject = function (o){
  return (typeof o === "object") &&
         (o !== null) &&
         (Object.prototype.toString.call(o) === '[object Object]');
};
exports.isObject = isObject;
exports.isString = function(o){
  return Object.prototype.toString.call(o) === '[object String]';
};
exports.isArray = function(o){
  return Object.prototype.toString.call(o) === "[object Array]";
};
exports.isBoolean = function(o) {
  return typeof o === 'boolean';
};
exports.isNumber = function(o) {
  return typeof o === 'number' && isFinite(o);
};
exports.isNull = function(o) {
  return o === null;
};

exports.keys = function (object) {
  if (!isObject(object)) {
    throw new TypeError("Object.keys called on a non-object");
  }

  var result = [];
  for (var name in object) {
    if (hasOwnProperty.call(object, name)) {
      result.push(name);
    }
  }
  return result;
};

// String.prototype.substr - negative index don't work in IE8
if ('ab'.substr(-1) !== 'b') {
  exports.substr = function (str, start, length) {
    // did we get a negative start, calculate how much it is from the beginning of the string
    if (start < 0) { start = str.length + start; }

    // call the original function
    return str.substr(start, length);
  };
} else {
  exports.substr = function (str, start, length) {
    return str.substr(start, length);
  };
}

// Array.prototype.map is supported in IE9
exports.map = function map(xs, fn) {
  if (xs.map) { return xs.map(fn); }
  var out = new Array(xs.length);
  for (var i = 0; i < xs.length; i++) {
    out[i] = fn(xs[i], i, xs);
  }
  return out;
};
