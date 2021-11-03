#!/usr/bin/env node
'use strict';

var path$1 = require('path');
var fs$4 = require('fs');
var os = require('os');
var tty = require('tty');
var util$1 = require('util');
var stream_1 = require('stream');
var events_1 = require('events');
var readline = require('readline');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path$1);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs$4);
var os__default = /*#__PURE__*/_interopDefaultLegacy(os);
var tty__default = /*#__PURE__*/_interopDefaultLegacy(tty);
var util__default = /*#__PURE__*/_interopDefaultLegacy(util$1);
var stream_1__default = /*#__PURE__*/_interopDefaultLegacy(stream_1);
var events_1__default = /*#__PURE__*/_interopDefaultLegacy(events_1);
var readline__default = /*#__PURE__*/_interopDefaultLegacy(readline);

var packageJson = require("./package.json");

var semverCompare = function cmp(a, b) {
  var pa = a.split('.');
  var pb = b.split('.');

  for (var i = 0; i < 3; i++) {
    var na = Number(pa[i]);
    var nb = Number(pb[i]);
    if (na > nb) return 1;
    if (nb > na) return -1;
    if (!isNaN(na) && isNaN(nb)) return 1;
    if (isNaN(na) && !isNaN(nb)) return -1;
  }

  return 0;
};

var pleaseUpgradeNode = function pleaseUpgradeNode(pkg, opts) {
  var opts = opts || {};
  var requiredVersion = pkg.engines.node.replace('>=', '');
  var currentVersion = process.version.replace('v', '');

  if (semverCompare(currentVersion, requiredVersion) === -1) {
    if (opts.message) {
      console.error(opts.message(requiredVersion));
    } else {
      console.error(pkg.name + ' requires at least version ' + requiredVersion + ' of Node, please upgrade');
    }

    if (opts.hasOwnProperty('exitCode')) {
      process.exit(opts.exitCode);
    } else {
      process.exit(1);
    }
  }
};

var check = function (it) {
  return it && it.Math == Math && it;
};

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global$1 =
  // eslint-disable-next-line es/no-global-this -- safe
  check(typeof globalThis == 'object' && globalThis) ||
  check(typeof window == 'object' && window) ||
  // eslint-disable-next-line no-restricted-globals -- safe
  check(typeof self == 'object' && self) ||
  check(typeof global$1 == 'object' && global$1) ||
  // eslint-disable-next-line no-new-func -- fallback
  (function () { return this; })() || Function('return this')();

var fails = function (exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};

// Detect IE8's incomplete defineProperty implementation
var descriptors = !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
  return Object.defineProperty({}, 1, { get: function () { return 7; } })[1] != 7;
});

var $propertyIsEnumerable = {}.propertyIsEnumerable;
// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var getOwnPropertyDescriptor$1 = Object.getOwnPropertyDescriptor;

// Nashorn ~ JDK8 bug
var NASHORN_BUG = getOwnPropertyDescriptor$1 && !$propertyIsEnumerable.call({ 1: 2 }, 1);

// `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.es/ecma262/#sec-object.prototype.propertyisenumerable
var f$4 = NASHORN_BUG ? function propertyIsEnumerable(V) {
  var descriptor = getOwnPropertyDescriptor$1(this, V);
  return !!descriptor && descriptor.enumerable;
} : $propertyIsEnumerable;

var objectPropertyIsEnumerable = {
	f: f$4
};

var createPropertyDescriptor = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

var toString$1 = {}.toString;

var classofRaw = function (it) {
  return toString$1.call(it).slice(8, -1);
};

var split = ''.split;

// fallback for non-array-like ES3 and non-enumerable old V8 strings
var indexedObject = fails(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins -- safe
  return !Object('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classofRaw(it) == 'String' ? split.call(it, '') : Object(it);
} : Object;

// `RequireObjectCoercible` abstract operation
// https://tc39.es/ecma262/#sec-requireobjectcoercible
var requireObjectCoercible = function (it) {
  if (it == undefined) throw TypeError("Can't call method on " + it);
  return it;
};

// toObject with fallback for non-array-like ES3 strings



var toIndexedObject = function (it) {
  return indexedObject(requireObjectCoercible(it));
};

var isObject$3 = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

// `ToPrimitive` abstract operation
// https://tc39.es/ecma262/#sec-toprimitive
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
var toPrimitive = function (input, PREFERRED_STRING) {
  if (!isObject$3(input)) return input;
  var fn, val;
  if (PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject$3(val = fn.call(input))) return val;
  if (typeof (fn = input.valueOf) == 'function' && !isObject$3(val = fn.call(input))) return val;
  if (!PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject$3(val = fn.call(input))) return val;
  throw TypeError("Can't convert object to primitive value");
};

// `ToObject` abstract operation
// https://tc39.es/ecma262/#sec-toobject
var toObject = function (argument) {
  return Object(requireObjectCoercible(argument));
};

var hasOwnProperty$b = {}.hasOwnProperty;

var has$1 = Object.hasOwn || function hasOwn(it, key) {
  return hasOwnProperty$b.call(toObject(it), key);
};

var document = global$1.document;
// typeof document.createElement is 'object' in old IE
var EXISTS = isObject$3(document) && isObject$3(document.createElement);

var documentCreateElement = function (it) {
  return EXISTS ? document.createElement(it) : {};
};

// Thank's IE8 for his funny defineProperty
var ie8DomDefine = !descriptors && !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- requied for testing
  return Object.defineProperty(documentCreateElement('div'), 'a', {
    get: function () { return 7; }
  }).a != 7;
});

// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.es/ecma262/#sec-object.getownpropertydescriptor
var f$3 = descriptors ? $getOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject(O);
  P = toPrimitive(P, true);
  if (ie8DomDefine) try {
    return $getOwnPropertyDescriptor(O, P);
  } catch (error) { /* empty */ }
  if (has$1(O, P)) return createPropertyDescriptor(!objectPropertyIsEnumerable.f.call(O, P), O[P]);
};

var objectGetOwnPropertyDescriptor = {
	f: f$3
};

var anObject = function (it) {
  if (!isObject$3(it)) {
    throw TypeError(String(it) + ' is not an object');
  } return it;
};

// eslint-disable-next-line es/no-object-defineproperty -- safe
var $defineProperty = Object.defineProperty;

// `Object.defineProperty` method
// https://tc39.es/ecma262/#sec-object.defineproperty
var f$2 = descriptors ? $defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (ie8DomDefine) try {
    return $defineProperty(O, P, Attributes);
  } catch (error) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

var objectDefineProperty = {
	f: f$2
};

var createNonEnumerableProperty = descriptors ? function (object, key, value) {
  return objectDefineProperty.f(object, key, createPropertyDescriptor(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

function createCommonjsModule(fn) {
  var module = { exports: {} };
	return fn(module, module.exports), module.exports;
}

var setGlobal = function (key, value) {
  try {
    createNonEnumerableProperty(global$1, key, value);
  } catch (error) {
    global$1[key] = value;
  } return value;
};

var SHARED = '__core-js_shared__';
var store$1 = global$1[SHARED] || setGlobal(SHARED, {});

var sharedStore = store$1;

var functionToString = Function.toString;

// this helper broken in `core-js@3.4.1-3.4.4`, so we can't use `shared` helper
if (typeof sharedStore.inspectSource != 'function') {
  sharedStore.inspectSource = function (it) {
    return functionToString.call(it);
  };
}

var inspectSource = sharedStore.inspectSource;

var WeakMap$3 = global$1.WeakMap;

var nativeWeakMap = typeof WeakMap$3 === 'function' && /native code/.test(inspectSource(WeakMap$3));

var shared = createCommonjsModule(function (module) {
(module.exports = function (key, value) {
  return sharedStore[key] || (sharedStore[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: '3.14.0',
  mode: 'global',
  copyright: '© 2021 Denis Pushkarev (zloirock.ru)'
});
});

var id = 0;
var postfix = Math.random();

var uid = function (key) {
  return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
};

var keys$1 = shared('keys');

var sharedKey = function (key) {
  return keys$1[key] || (keys$1[key] = uid(key));
};

var hiddenKeys$1 = {};

var OBJECT_ALREADY_INITIALIZED = 'Object already initialized';
var WeakMap$2 = global$1.WeakMap;
var set, get$1, has;

var enforce = function (it) {
  return has(it) ? get$1(it) : set(it, {});
};

var getterFor = function (TYPE) {
  return function (it) {
    var state;
    if (!isObject$3(it) || (state = get$1(it)).type !== TYPE) {
      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
    } return state;
  };
};

if (nativeWeakMap || sharedStore.state) {
  var store = sharedStore.state || (sharedStore.state = new WeakMap$2());
  var wmget = store.get;
  var wmhas = store.has;
  var wmset = store.set;
  set = function (it, metadata) {
    if (wmhas.call(store, it)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    wmset.call(store, it, metadata);
    return metadata;
  };
  get$1 = function (it) {
    return wmget.call(store, it) || {};
  };
  has = function (it) {
    return wmhas.call(store, it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys$1[STATE] = true;
  set = function (it, metadata) {
    if (has$1(it, STATE)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    createNonEnumerableProperty(it, STATE, metadata);
    return metadata;
  };
  get$1 = function (it) {
    return has$1(it, STATE) ? it[STATE] : {};
  };
  has = function (it) {
    return has$1(it, STATE);
  };
}

var internalState = {
  set: set,
  get: get$1,
  has: has,
  enforce: enforce,
  getterFor: getterFor
};

var redefine = createCommonjsModule(function (module) {
var getInternalState = internalState.get;
var enforceInternalState = internalState.enforce;
var TEMPLATE = String(String).split('String');

(module.exports = function (O, key, value, options) {
  var unsafe = options ? !!options.unsafe : false;
  var simple = options ? !!options.enumerable : false;
  var noTargetGet = options ? !!options.noTargetGet : false;
  var state;
  if (typeof value == 'function') {
    if (typeof key == 'string' && !has$1(value, 'name')) {
      createNonEnumerableProperty(value, 'name', key);
    }
    state = enforceInternalState(value);
    if (!state.source) {
      state.source = TEMPLATE.join(typeof key == 'string' ? key : '');
    }
  }
  if (O === global$1) {
    if (simple) O[key] = value;
    else setGlobal(key, value);
    return;
  } else if (!unsafe) {
    delete O[key];
  } else if (!noTargetGet && O[key]) {
    simple = true;
  }
  if (simple) O[key] = value;
  else createNonEnumerableProperty(O, key, value);
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, 'toString', function toString() {
  return typeof this == 'function' && getInternalState(this).source || inspectSource(this);
});
});

var path = global$1;

var aFunction$1 = function (variable) {
  return typeof variable == 'function' ? variable : undefined;
};

var getBuiltIn = function (namespace, method) {
  return arguments.length < 2 ? aFunction$1(path[namespace]) || aFunction$1(global$1[namespace])
    : path[namespace] && path[namespace][method] || global$1[namespace] && global$1[namespace][method];
};

var ceil = Math.ceil;
var floor$1 = Math.floor;

// `ToInteger` abstract operation
// https://tc39.es/ecma262/#sec-tointeger
var toInteger = function (argument) {
  return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor$1 : ceil)(argument);
};

var min$1 = Math.min;

// `ToLength` abstract operation
// https://tc39.es/ecma262/#sec-tolength
var toLength = function (argument) {
  return argument > 0 ? min$1(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
};

var max = Math.max;
var min = Math.min;

// Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
var toAbsoluteIndex = function (index, length) {
  var integer = toInteger(index);
  return integer < 0 ? max(integer + length, 0) : min(integer, length);
};

// `Array.prototype.{ indexOf, includes }` methods implementation
var createMethod = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare -- NaN check
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare -- NaN check
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) {
      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

var arrayIncludes = {
  // `Array.prototype.includes` method
  // https://tc39.es/ecma262/#sec-array.prototype.includes
  includes: createMethod(true),
  // `Array.prototype.indexOf` method
  // https://tc39.es/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod(false)
};

var indexOf = arrayIncludes.indexOf;


var objectKeysInternal = function (object, names) {
  var O = toIndexedObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) !has$1(hiddenKeys$1, key) && has$1(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has$1(O, key = names[i++])) {
    ~indexOf(result, key) || result.push(key);
  }
  return result;
};

// IE8- don't enum bug keys
var enumBugKeys = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];

var hiddenKeys = enumBugKeys.concat('length', 'prototype');

// `Object.getOwnPropertyNames` method
// https://tc39.es/ecma262/#sec-object.getownpropertynames
// eslint-disable-next-line es/no-object-getownpropertynames -- safe
var f$1 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return objectKeysInternal(O, hiddenKeys);
};

var objectGetOwnPropertyNames = {
	f: f$1
};

// eslint-disable-next-line es/no-object-getownpropertysymbols -- safe
var f = Object.getOwnPropertySymbols;

var objectGetOwnPropertySymbols = {
	f: f
};

// all object keys, includes non-enumerable and symbols
var ownKeys = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
  var keys = objectGetOwnPropertyNames.f(anObject(it));
  var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
  return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
};

var copyConstructorProperties = function (target, source) {
  var keys = ownKeys(source);
  var defineProperty = objectDefineProperty.f;
  var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!has$1(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
  }
};

var replacement = /#|\.prototype\./;

var isForced = function (feature, detection) {
  var value = data[normalize(feature)];
  return value == POLYFILL ? true
    : value == NATIVE ? false
    : typeof detection == 'function' ? fails(detection)
    : !!detection;
};

var normalize = isForced.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data = isForced.data = {};
var NATIVE = isForced.NATIVE = 'N';
var POLYFILL = isForced.POLYFILL = 'P';

var isForced_1 = isForced;

var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;






/*
  options.target      - name of the target object
  options.global      - target is the global object
  options.stat        - export as static methods of target
  options.proto       - export as prototype methods of target
  options.real        - real prototype method for the `pure` version
  options.forced      - export even if the native feature is available
  options.bind        - bind methods to the target, required for the `pure` version
  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
  options.sham        - add a flag to not completely full polyfills
  options.enumerable  - export as enumerable property
  options.noTargetGet - prevent calling a getter on target
*/
var _export = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;
  if (GLOBAL) {
    target = global$1;
  } else if (STATIC) {
    target = global$1[TARGET] || setGlobal(TARGET, {});
  } else {
    target = (global$1[TARGET] || {}).prototype;
  }
  if (target) for (key in source) {
    sourceProperty = source[key];
    if (options.noTargetGet) {
      descriptor = getOwnPropertyDescriptor(target, key);
      targetProperty = descriptor && descriptor.value;
    } else targetProperty = target[key];
    FORCED = isForced_1(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
    // contained in target
    if (!FORCED && targetProperty !== undefined) {
      if (typeof sourceProperty === typeof targetProperty) continue;
      copyConstructorProperties(sourceProperty, targetProperty);
    }
    // add a flag to not completely full polyfills
    if (options.sham || (targetProperty && targetProperty.sham)) {
      createNonEnumerableProperty(sourceProperty, 'sham', true);
    }
    // extend global
    redefine(target, key, sourceProperty, options);
  }
};

var aFunction = function (it) {
  if (typeof it != 'function') {
    throw TypeError(String(it) + ' is not a function');
  } return it;
};

// TODO: use something more complex like timsort?
var floor = Math.floor;

var mergeSort = function (array, comparefn) {
  var length = array.length;
  var middle = floor(length / 2);
  return length < 8 ? insertionSort(array, comparefn) : merge$1(
    mergeSort(array.slice(0, middle), comparefn),
    mergeSort(array.slice(middle), comparefn),
    comparefn
  );
};

var insertionSort = function (array, comparefn) {
  var length = array.length;
  var i = 1;
  var element, j;

  while (i < length) {
    j = i;
    element = array[i];
    while (j && comparefn(array[j - 1], element) > 0) {
      array[j] = array[--j];
    }
    if (j !== i++) array[j] = element;
  } return array;
};

var merge$1 = function (left, right, comparefn) {
  var llength = left.length;
  var rlength = right.length;
  var lindex = 0;
  var rindex = 0;
  var result = [];

  while (lindex < llength || rindex < rlength) {
    if (lindex < llength && rindex < rlength) {
      result.push(comparefn(left[lindex], right[rindex]) <= 0 ? left[lindex++] : right[rindex++]);
    } else {
      result.push(lindex < llength ? left[lindex++] : right[rindex++]);
    }
  } return result;
};

var arraySort = mergeSort;

var arrayMethodIsStrict = function (METHOD_NAME, argument) {
  var method = [][METHOD_NAME];
  return !!method && fails(function () {
    // eslint-disable-next-line no-useless-call,no-throw-literal -- required for testing
    method.call(null, argument || function () { throw 1; }, 1);
  });
};

var engineUserAgent = getBuiltIn('navigator', 'userAgent') || '';

var firefox = engineUserAgent.match(/firefox\/(\d+)/i);

var engineFfVersion = !!firefox && +firefox[1];

var engineIsIeOrEdge = /MSIE|Trident/.test(engineUserAgent);

var process$1 = global$1.process;
var versions = process$1 && process$1.versions;
var v8 = versions && versions.v8;
var match, version;

if (v8) {
  match = v8.split('.');
  version = match[0] < 4 ? 1 : match[0] + match[1];
} else if (engineUserAgent) {
  match = engineUserAgent.match(/Edge\/(\d+)/);
  if (!match || match[1] >= 74) {
    match = engineUserAgent.match(/Chrome\/(\d+)/);
    if (match) version = match[1];
  }
}

var engineV8Version = version && +version;

var webkit = engineUserAgent.match(/AppleWebKit\/(\d+)\./);

var engineWebkitVersion = !!webkit && +webkit[1];

var test$1 = [];
var nativeSort = test$1.sort;

// IE8-
var FAILS_ON_UNDEFINED = fails(function () {
  test$1.sort(undefined);
});
// V8 bug
var FAILS_ON_NULL = fails(function () {
  test$1.sort(null);
});
// Old WebKit
var STRICT_METHOD = arrayMethodIsStrict('sort');

var STABLE_SORT = !fails(function () {
  // feature detection can be too slow, so check engines versions
  if (engineV8Version) return engineV8Version < 70;
  if (engineFfVersion && engineFfVersion > 3) return;
  if (engineIsIeOrEdge) return true;
  if (engineWebkitVersion) return engineWebkitVersion < 603;

  var result = '';
  var code, chr, value, index;

  // generate an array with more 512 elements (Chakra and old V8 fails only in this case)
  for (code = 65; code < 76; code++) {
    chr = String.fromCharCode(code);

    switch (code) {
      case 66: case 69: case 70: case 72: value = 3; break;
      case 68: case 71: value = 4; break;
      default: value = 2;
    }

    for (index = 0; index < 47; index++) {
      test$1.push({ k: chr + index, v: value });
    }
  }

  test$1.sort(function (a, b) { return b.v - a.v; });

  for (index = 0; index < test$1.length; index++) {
    chr = test$1[index].k.charAt(0);
    if (result.charAt(result.length - 1) !== chr) result += chr;
  }

  return result !== 'DGBEFHACIJK';
});

var FORCED = FAILS_ON_UNDEFINED || !FAILS_ON_NULL || !STRICT_METHOD || !STABLE_SORT;

var getSortCompare = function (comparefn) {
  return function (x, y) {
    if (y === undefined) return -1;
    if (x === undefined) return 1;
    if (comparefn !== undefined) return +comparefn(x, y) || 0;
    return String(x) > String(y) ? 1 : -1;
  };
};

// `Array.prototype.sort` method
// https://tc39.es/ecma262/#sec-array.prototype.sort
_export({ target: 'Array', proto: true, forced: FORCED }, {
  sort: function sort(comparefn) {
    if (comparefn !== undefined) aFunction(comparefn);

    var array = toObject(this);

    if (STABLE_SORT) return comparefn === undefined ? nativeSort.call(array) : nativeSort.call(array, comparefn);

    var items = [];
    var arrayLength = toLength(array.length);
    var itemsLength, index;

    for (index = 0; index < arrayLength; index++) {
      if (index in array) items.push(array[index]);
    }

    items = arraySort(items, getSortCompare(comparefn));
    itemsLength = items.length;
    index = 0;

    while (index < itemsLength) array[index] = items[index++];
    while (index < arrayLength) delete array[index++];

    return array;
  }
});

var fastJsonStableStringify = function (data, opts) {
  if (!opts) opts = {};
  if (typeof opts === 'function') opts = {
    cmp: opts
  };
  var cycles = typeof opts.cycles === 'boolean' ? opts.cycles : false;

  var cmp = opts.cmp && function (f) {
    return function (node) {
      return function (a, b) {
        var aobj = {
          key: a,
          value: node[a]
        };
        var bobj = {
          key: b,
          value: node[b]
        };
        return f(aobj, bobj);
      };
    };
  }(opts.cmp);

  var seen = [];
  return function stringify(node) {
    if (node && node.toJSON && typeof node.toJSON === 'function') {
      node = node.toJSON();
    }

    if (node === undefined) return;
    if (typeof node == 'number') return isFinite(node) ? '' + node : 'null';
    if (typeof node !== 'object') return JSON.stringify(node);
    var i, out;

    if (Array.isArray(node)) {
      out = '[';

      for (i = 0; i < node.length; i++) {
        if (i) out += ',';
        out += stringify(node[i]) || 'null';
      }

      return out + ']';
    }

    if (node === null) return 'null';

    if (seen.indexOf(node) !== -1) {
      if (cycles) return JSON.stringify('__cycle__');
      throw new TypeError('Converting circular structure to JSON');
    }

    var seenIndex = seen.push(node) - 1;
    var keys = Object.keys(node).sort(cmp && cmp(node));
    out = '';

    for (i = 0; i < keys.length; i++) {
      var key = keys[i];
      var value = stringify(node[key]);
      if (!value) continue;
      if (out) out += ',';
      out += JSON.stringify(key) + ':' + value;
    }

    seen.splice(seenIndex, 1);
    return '{' + out + '}';
  }(data);
};

var prettier$1 = require("./index.js");

var colorName = {
  "aliceblue": [240, 248, 255],
  "antiquewhite": [250, 235, 215],
  "aqua": [0, 255, 255],
  "aquamarine": [127, 255, 212],
  "azure": [240, 255, 255],
  "beige": [245, 245, 220],
  "bisque": [255, 228, 196],
  "black": [0, 0, 0],
  "blanchedalmond": [255, 235, 205],
  "blue": [0, 0, 255],
  "blueviolet": [138, 43, 226],
  "brown": [165, 42, 42],
  "burlywood": [222, 184, 135],
  "cadetblue": [95, 158, 160],
  "chartreuse": [127, 255, 0],
  "chocolate": [210, 105, 30],
  "coral": [255, 127, 80],
  "cornflowerblue": [100, 149, 237],
  "cornsilk": [255, 248, 220],
  "crimson": [220, 20, 60],
  "cyan": [0, 255, 255],
  "darkblue": [0, 0, 139],
  "darkcyan": [0, 139, 139],
  "darkgoldenrod": [184, 134, 11],
  "darkgray": [169, 169, 169],
  "darkgreen": [0, 100, 0],
  "darkgrey": [169, 169, 169],
  "darkkhaki": [189, 183, 107],
  "darkmagenta": [139, 0, 139],
  "darkolivegreen": [85, 107, 47],
  "darkorange": [255, 140, 0],
  "darkorchid": [153, 50, 204],
  "darkred": [139, 0, 0],
  "darksalmon": [233, 150, 122],
  "darkseagreen": [143, 188, 143],
  "darkslateblue": [72, 61, 139],
  "darkslategray": [47, 79, 79],
  "darkslategrey": [47, 79, 79],
  "darkturquoise": [0, 206, 209],
  "darkviolet": [148, 0, 211],
  "deeppink": [255, 20, 147],
  "deepskyblue": [0, 191, 255],
  "dimgray": [105, 105, 105],
  "dimgrey": [105, 105, 105],
  "dodgerblue": [30, 144, 255],
  "firebrick": [178, 34, 34],
  "floralwhite": [255, 250, 240],
  "forestgreen": [34, 139, 34],
  "fuchsia": [255, 0, 255],
  "gainsboro": [220, 220, 220],
  "ghostwhite": [248, 248, 255],
  "gold": [255, 215, 0],
  "goldenrod": [218, 165, 32],
  "gray": [128, 128, 128],
  "green": [0, 128, 0],
  "greenyellow": [173, 255, 47],
  "grey": [128, 128, 128],
  "honeydew": [240, 255, 240],
  "hotpink": [255, 105, 180],
  "indianred": [205, 92, 92],
  "indigo": [75, 0, 130],
  "ivory": [255, 255, 240],
  "khaki": [240, 230, 140],
  "lavender": [230, 230, 250],
  "lavenderblush": [255, 240, 245],
  "lawngreen": [124, 252, 0],
  "lemonchiffon": [255, 250, 205],
  "lightblue": [173, 216, 230],
  "lightcoral": [240, 128, 128],
  "lightcyan": [224, 255, 255],
  "lightgoldenrodyellow": [250, 250, 210],
  "lightgray": [211, 211, 211],
  "lightgreen": [144, 238, 144],
  "lightgrey": [211, 211, 211],
  "lightpink": [255, 182, 193],
  "lightsalmon": [255, 160, 122],
  "lightseagreen": [32, 178, 170],
  "lightskyblue": [135, 206, 250],
  "lightslategray": [119, 136, 153],
  "lightslategrey": [119, 136, 153],
  "lightsteelblue": [176, 196, 222],
  "lightyellow": [255, 255, 224],
  "lime": [0, 255, 0],
  "limegreen": [50, 205, 50],
  "linen": [250, 240, 230],
  "magenta": [255, 0, 255],
  "maroon": [128, 0, 0],
  "mediumaquamarine": [102, 205, 170],
  "mediumblue": [0, 0, 205],
  "mediumorchid": [186, 85, 211],
  "mediumpurple": [147, 112, 219],
  "mediumseagreen": [60, 179, 113],
  "mediumslateblue": [123, 104, 238],
  "mediumspringgreen": [0, 250, 154],
  "mediumturquoise": [72, 209, 204],
  "mediumvioletred": [199, 21, 133],
  "midnightblue": [25, 25, 112],
  "mintcream": [245, 255, 250],
  "mistyrose": [255, 228, 225],
  "moccasin": [255, 228, 181],
  "navajowhite": [255, 222, 173],
  "navy": [0, 0, 128],
  "oldlace": [253, 245, 230],
  "olive": [128, 128, 0],
  "olivedrab": [107, 142, 35],
  "orange": [255, 165, 0],
  "orangered": [255, 69, 0],
  "orchid": [218, 112, 214],
  "palegoldenrod": [238, 232, 170],
  "palegreen": [152, 251, 152],
  "paleturquoise": [175, 238, 238],
  "palevioletred": [219, 112, 147],
  "papayawhip": [255, 239, 213],
  "peachpuff": [255, 218, 185],
  "peru": [205, 133, 63],
  "pink": [255, 192, 203],
  "plum": [221, 160, 221],
  "powderblue": [176, 224, 230],
  "purple": [128, 0, 128],
  "rebeccapurple": [102, 51, 153],
  "red": [255, 0, 0],
  "rosybrown": [188, 143, 143],
  "royalblue": [65, 105, 225],
  "saddlebrown": [139, 69, 19],
  "salmon": [250, 128, 114],
  "sandybrown": [244, 164, 96],
  "seagreen": [46, 139, 87],
  "seashell": [255, 245, 238],
  "sienna": [160, 82, 45],
  "silver": [192, 192, 192],
  "skyblue": [135, 206, 235],
  "slateblue": [106, 90, 205],
  "slategray": [112, 128, 144],
  "slategrey": [112, 128, 144],
  "snow": [255, 250, 250],
  "springgreen": [0, 255, 127],
  "steelblue": [70, 130, 180],
  "tan": [210, 180, 140],
  "teal": [0, 128, 128],
  "thistle": [216, 191, 216],
  "tomato": [255, 99, 71],
  "turquoise": [64, 224, 208],
  "violet": [238, 130, 238],
  "wheat": [245, 222, 179],
  "white": [255, 255, 255],
  "whitesmoke": [245, 245, 245],
  "yellow": [255, 255, 0],
  "yellowgreen": [154, 205, 50]
};

/* MIT license */
/* eslint-disable no-mixed-operators */
// NOTE: conversions should only return primitive values (i.e. arrays, or
//       values that give correct `typeof` results).
//       do not use box values types (i.e. Number(), String(), etc.)

const reverseKeywords = {};

for (const key of Object.keys(colorName)) {
  reverseKeywords[colorName[key]] = key;
}

const convert$1 = {
  rgb: {
    channels: 3,
    labels: 'rgb'
  },
  hsl: {
    channels: 3,
    labels: 'hsl'
  },
  hsv: {
    channels: 3,
    labels: 'hsv'
  },
  hwb: {
    channels: 3,
    labels: 'hwb'
  },
  cmyk: {
    channels: 4,
    labels: 'cmyk'
  },
  xyz: {
    channels: 3,
    labels: 'xyz'
  },
  lab: {
    channels: 3,
    labels: 'lab'
  },
  lch: {
    channels: 3,
    labels: 'lch'
  },
  hex: {
    channels: 1,
    labels: ['hex']
  },
  keyword: {
    channels: 1,
    labels: ['keyword']
  },
  ansi16: {
    channels: 1,
    labels: ['ansi16']
  },
  ansi256: {
    channels: 1,
    labels: ['ansi256']
  },
  hcg: {
    channels: 3,
    labels: ['h', 'c', 'g']
  },
  apple: {
    channels: 3,
    labels: ['r16', 'g16', 'b16']
  },
  gray: {
    channels: 1,
    labels: ['gray']
  }
};
var conversions = convert$1; // Hide .channels and .labels properties

for (const model of Object.keys(convert$1)) {
  if (!('channels' in convert$1[model])) {
    throw new Error('missing channels property: ' + model);
  }

  if (!('labels' in convert$1[model])) {
    throw new Error('missing channel labels property: ' + model);
  }

  if (convert$1[model].labels.length !== convert$1[model].channels) {
    throw new Error('channel and label counts mismatch: ' + model);
  }

  const {
    channels,
    labels
  } = convert$1[model];
  delete convert$1[model].channels;
  delete convert$1[model].labels;
  Object.defineProperty(convert$1[model], 'channels', {
    value: channels
  });
  Object.defineProperty(convert$1[model], 'labels', {
    value: labels
  });
}

convert$1.rgb.hsl = function (rgb) {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  const delta = max - min;
  let h;
  let s;

  if (max === min) {
    h = 0;
  } else if (r === max) {
    h = (g - b) / delta;
  } else if (g === max) {
    h = 2 + (b - r) / delta;
  } else if (b === max) {
    h = 4 + (r - g) / delta;
  }

  h = Math.min(h * 60, 360);

  if (h < 0) {
    h += 360;
  }

  const l = (min + max) / 2;

  if (max === min) {
    s = 0;
  } else if (l <= 0.5) {
    s = delta / (max + min);
  } else {
    s = delta / (2 - max - min);
  }

  return [h, s * 100, l * 100];
};

convert$1.rgb.hsv = function (rgb) {
  let rdif;
  let gdif;
  let bdif;
  let h;
  let s;
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const v = Math.max(r, g, b);
  const diff = v - Math.min(r, g, b);

  const diffc = function (c) {
    return (v - c) / 6 / diff + 1 / 2;
  };

  if (diff === 0) {
    h = 0;
    s = 0;
  } else {
    s = diff / v;
    rdif = diffc(r);
    gdif = diffc(g);
    bdif = diffc(b);

    if (r === v) {
      h = bdif - gdif;
    } else if (g === v) {
      h = 1 / 3 + rdif - bdif;
    } else if (b === v) {
      h = 2 / 3 + gdif - rdif;
    }

    if (h < 0) {
      h += 1;
    } else if (h > 1) {
      h -= 1;
    }
  }

  return [h * 360, s * 100, v * 100];
};

convert$1.rgb.hwb = function (rgb) {
  const r = rgb[0];
  const g = rgb[1];
  let b = rgb[2];
  const h = convert$1.rgb.hsl(rgb)[0];
  const w = 1 / 255 * Math.min(r, Math.min(g, b));
  b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));
  return [h, w * 100, b * 100];
};

convert$1.rgb.cmyk = function (rgb) {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const k = Math.min(1 - r, 1 - g, 1 - b);
  const c = (1 - r - k) / (1 - k) || 0;
  const m = (1 - g - k) / (1 - k) || 0;
  const y = (1 - b - k) / (1 - k) || 0;
  return [c * 100, m * 100, y * 100, k * 100];
};

function comparativeDistance(x, y) {
  /*
  	See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance
  */
  return (x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2 + (x[2] - y[2]) ** 2;
}

convert$1.rgb.keyword = function (rgb) {
  const reversed = reverseKeywords[rgb];

  if (reversed) {
    return reversed;
  }

  let currentClosestDistance = Infinity;
  let currentClosestKeyword;

  for (const keyword of Object.keys(colorName)) {
    const value = colorName[keyword]; // Compute comparative distance

    const distance = comparativeDistance(rgb, value); // Check if its less, if so set as closest

    if (distance < currentClosestDistance) {
      currentClosestDistance = distance;
      currentClosestKeyword = keyword;
    }
  }

  return currentClosestKeyword;
};

convert$1.keyword.rgb = function (keyword) {
  return colorName[keyword];
};

convert$1.rgb.xyz = function (rgb) {
  let r = rgb[0] / 255;
  let g = rgb[1] / 255;
  let b = rgb[2] / 255; // Assume sRGB

  r = r > 0.04045 ? ((r + 0.055) / 1.055) ** 2.4 : r / 12.92;
  g = g > 0.04045 ? ((g + 0.055) / 1.055) ** 2.4 : g / 12.92;
  b = b > 0.04045 ? ((b + 0.055) / 1.055) ** 2.4 : b / 12.92;
  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
  return [x * 100, y * 100, z * 100];
};

convert$1.rgb.lab = function (rgb) {
  const xyz = convert$1.rgb.xyz(rgb);
  let x = xyz[0];
  let y = xyz[1];
  let z = xyz[2];
  x /= 95.047;
  y /= 100;
  z /= 108.883;
  x = x > 0.008856 ? x ** (1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? y ** (1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? z ** (1 / 3) : 7.787 * z + 16 / 116;
  const l = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);
  return [l, a, b];
};

convert$1.hsl.rgb = function (hsl) {
  const h = hsl[0] / 360;
  const s = hsl[1] / 100;
  const l = hsl[2] / 100;
  let t2;
  let t3;
  let val;

  if (s === 0) {
    val = l * 255;
    return [val, val, val];
  }

  if (l < 0.5) {
    t2 = l * (1 + s);
  } else {
    t2 = l + s - l * s;
  }

  const t1 = 2 * l - t2;
  const rgb = [0, 0, 0];

  for (let i = 0; i < 3; i++) {
    t3 = h + 1 / 3 * -(i - 1);

    if (t3 < 0) {
      t3++;
    }

    if (t3 > 1) {
      t3--;
    }

    if (6 * t3 < 1) {
      val = t1 + (t2 - t1) * 6 * t3;
    } else if (2 * t3 < 1) {
      val = t2;
    } else if (3 * t3 < 2) {
      val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
    } else {
      val = t1;
    }

    rgb[i] = val * 255;
  }

  return rgb;
};

convert$1.hsl.hsv = function (hsl) {
  const h = hsl[0];
  let s = hsl[1] / 100;
  let l = hsl[2] / 100;
  let smin = s;
  const lmin = Math.max(l, 0.01);
  l *= 2;
  s *= l <= 1 ? l : 2 - l;
  smin *= lmin <= 1 ? lmin : 2 - lmin;
  const v = (l + s) / 2;
  const sv = l === 0 ? 2 * smin / (lmin + smin) : 2 * s / (l + s);
  return [h, sv * 100, v * 100];
};

convert$1.hsv.rgb = function (hsv) {
  const h = hsv[0] / 60;
  const s = hsv[1] / 100;
  let v = hsv[2] / 100;
  const hi = Math.floor(h) % 6;
  const f = h - Math.floor(h);
  const p = 255 * v * (1 - s);
  const q = 255 * v * (1 - s * f);
  const t = 255 * v * (1 - s * (1 - f));
  v *= 255;

  switch (hi) {
    case 0:
      return [v, t, p];

    case 1:
      return [q, v, p];

    case 2:
      return [p, v, t];

    case 3:
      return [p, q, v];

    case 4:
      return [t, p, v];

    case 5:
      return [v, p, q];
  }
};

convert$1.hsv.hsl = function (hsv) {
  const h = hsv[0];
  const s = hsv[1] / 100;
  const v = hsv[2] / 100;
  const vmin = Math.max(v, 0.01);
  let sl;
  let l;
  l = (2 - s) * v;
  const lmin = (2 - s) * vmin;
  sl = s * vmin;
  sl /= lmin <= 1 ? lmin : 2 - lmin;
  sl = sl || 0;
  l /= 2;
  return [h, sl * 100, l * 100];
}; // http://dev.w3.org/csswg/css-color/#hwb-to-rgb


convert$1.hwb.rgb = function (hwb) {
  const h = hwb[0] / 360;
  let wh = hwb[1] / 100;
  let bl = hwb[2] / 100;
  const ratio = wh + bl;
  let f; // Wh + bl cant be > 1

  if (ratio > 1) {
    wh /= ratio;
    bl /= ratio;
  }

  const i = Math.floor(6 * h);
  const v = 1 - bl;
  f = 6 * h - i;

  if ((i & 0x01) !== 0) {
    f = 1 - f;
  }

  const n = wh + f * (v - wh); // Linear interpolation

  let r;
  let g;
  let b;
  /* eslint-disable max-statements-per-line,no-multi-spaces */

  switch (i) {
    default:
    case 6:
    case 0:
      r = v;
      g = n;
      b = wh;
      break;

    case 1:
      r = n;
      g = v;
      b = wh;
      break;

    case 2:
      r = wh;
      g = v;
      b = n;
      break;

    case 3:
      r = wh;
      g = n;
      b = v;
      break;

    case 4:
      r = n;
      g = wh;
      b = v;
      break;

    case 5:
      r = v;
      g = wh;
      b = n;
      break;
  }
  /* eslint-enable max-statements-per-line,no-multi-spaces */


  return [r * 255, g * 255, b * 255];
};

convert$1.cmyk.rgb = function (cmyk) {
  const c = cmyk[0] / 100;
  const m = cmyk[1] / 100;
  const y = cmyk[2] / 100;
  const k = cmyk[3] / 100;
  const r = 1 - Math.min(1, c * (1 - k) + k);
  const g = 1 - Math.min(1, m * (1 - k) + k);
  const b = 1 - Math.min(1, y * (1 - k) + k);
  return [r * 255, g * 255, b * 255];
};

convert$1.xyz.rgb = function (xyz) {
  const x = xyz[0] / 100;
  const y = xyz[1] / 100;
  const z = xyz[2] / 100;
  let r;
  let g;
  let b;
  r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  b = x * 0.0557 + y * -0.2040 + z * 1.0570; // Assume sRGB

  r = r > 0.0031308 ? 1.055 * r ** (1.0 / 2.4) - 0.055 : r * 12.92;
  g = g > 0.0031308 ? 1.055 * g ** (1.0 / 2.4) - 0.055 : g * 12.92;
  b = b > 0.0031308 ? 1.055 * b ** (1.0 / 2.4) - 0.055 : b * 12.92;
  r = Math.min(Math.max(0, r), 1);
  g = Math.min(Math.max(0, g), 1);
  b = Math.min(Math.max(0, b), 1);
  return [r * 255, g * 255, b * 255];
};

convert$1.xyz.lab = function (xyz) {
  let x = xyz[0];
  let y = xyz[1];
  let z = xyz[2];
  x /= 95.047;
  y /= 100;
  z /= 108.883;
  x = x > 0.008856 ? x ** (1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? y ** (1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? z ** (1 / 3) : 7.787 * z + 16 / 116;
  const l = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);
  return [l, a, b];
};

convert$1.lab.xyz = function (lab) {
  const l = lab[0];
  const a = lab[1];
  const b = lab[2];
  let x;
  let y;
  let z;
  y = (l + 16) / 116;
  x = a / 500 + y;
  z = y - b / 200;
  const y2 = y ** 3;
  const x2 = x ** 3;
  const z2 = z ** 3;
  y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
  x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
  z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;
  x *= 95.047;
  y *= 100;
  z *= 108.883;
  return [x, y, z];
};

convert$1.lab.lch = function (lab) {
  const l = lab[0];
  const a = lab[1];
  const b = lab[2];
  let h;
  const hr = Math.atan2(b, a);
  h = hr * 360 / 2 / Math.PI;

  if (h < 0) {
    h += 360;
  }

  const c = Math.sqrt(a * a + b * b);
  return [l, c, h];
};

convert$1.lch.lab = function (lch) {
  const l = lch[0];
  const c = lch[1];
  const h = lch[2];
  const hr = h / 360 * 2 * Math.PI;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  return [l, a, b];
};

convert$1.rgb.ansi16 = function (args, saturation = null) {
  const [r, g, b] = args;
  let value = saturation === null ? convert$1.rgb.hsv(args)[2] : saturation; // Hsv -> ansi16 optimization

  value = Math.round(value / 50);

  if (value === 0) {
    return 30;
  }

  let ansi = 30 + (Math.round(b / 255) << 2 | Math.round(g / 255) << 1 | Math.round(r / 255));

  if (value === 2) {
    ansi += 60;
  }

  return ansi;
};

convert$1.hsv.ansi16 = function (args) {
  // Optimization here; we already know the value and don't need to get
  // it converted for us.
  return convert$1.rgb.ansi16(convert$1.hsv.rgb(args), args[2]);
};

convert$1.rgb.ansi256 = function (args) {
  const r = args[0];
  const g = args[1];
  const b = args[2]; // We use the extended greyscale palette here, with the exception of
  // black and white. normal palette only has 4 greyscale shades.

  if (r === g && g === b) {
    if (r < 8) {
      return 16;
    }

    if (r > 248) {
      return 231;
    }

    return Math.round((r - 8) / 247 * 24) + 232;
  }

  const ansi = 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5);
  return ansi;
};

convert$1.ansi16.rgb = function (args) {
  let color = args % 10; // Handle greyscale

  if (color === 0 || color === 7) {
    if (args > 50) {
      color += 3.5;
    }

    color = color / 10.5 * 255;
    return [color, color, color];
  }

  const mult = (~~(args > 50) + 1) * 0.5;
  const r = (color & 1) * mult * 255;
  const g = (color >> 1 & 1) * mult * 255;
  const b = (color >> 2 & 1) * mult * 255;
  return [r, g, b];
};

convert$1.ansi256.rgb = function (args) {
  // Handle greyscale
  if (args >= 232) {
    const c = (args - 232) * 10 + 8;
    return [c, c, c];
  }

  args -= 16;
  let rem;
  const r = Math.floor(args / 36) / 5 * 255;
  const g = Math.floor((rem = args % 36) / 6) / 5 * 255;
  const b = rem % 6 / 5 * 255;
  return [r, g, b];
};

convert$1.rgb.hex = function (args) {
  const integer = ((Math.round(args[0]) & 0xFF) << 16) + ((Math.round(args[1]) & 0xFF) << 8) + (Math.round(args[2]) & 0xFF);
  const string = integer.toString(16).toUpperCase();
  return '000000'.substring(string.length) + string;
};

convert$1.hex.rgb = function (args) {
  const match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);

  if (!match) {
    return [0, 0, 0];
  }

  let colorString = match[0];

  if (match[0].length === 3) {
    colorString = colorString.split('').map(char => {
      return char + char;
    }).join('');
  }

  const integer = parseInt(colorString, 16);
  const r = integer >> 16 & 0xFF;
  const g = integer >> 8 & 0xFF;
  const b = integer & 0xFF;
  return [r, g, b];
};

convert$1.rgb.hcg = function (rgb) {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const max = Math.max(Math.max(r, g), b);
  const min = Math.min(Math.min(r, g), b);
  const chroma = max - min;
  let grayscale;
  let hue;

  if (chroma < 1) {
    grayscale = min / (1 - chroma);
  } else {
    grayscale = 0;
  }

  if (chroma <= 0) {
    hue = 0;
  } else if (max === r) {
    hue = (g - b) / chroma % 6;
  } else if (max === g) {
    hue = 2 + (b - r) / chroma;
  } else {
    hue = 4 + (r - g) / chroma;
  }

  hue /= 6;
  hue %= 1;
  return [hue * 360, chroma * 100, grayscale * 100];
};

convert$1.hsl.hcg = function (hsl) {
  const s = hsl[1] / 100;
  const l = hsl[2] / 100;
  const c = l < 0.5 ? 2.0 * s * l : 2.0 * s * (1.0 - l);
  let f = 0;

  if (c < 1.0) {
    f = (l - 0.5 * c) / (1.0 - c);
  }

  return [hsl[0], c * 100, f * 100];
};

convert$1.hsv.hcg = function (hsv) {
  const s = hsv[1] / 100;
  const v = hsv[2] / 100;
  const c = s * v;
  let f = 0;

  if (c < 1.0) {
    f = (v - c) / (1 - c);
  }

  return [hsv[0], c * 100, f * 100];
};

convert$1.hcg.rgb = function (hcg) {
  const h = hcg[0] / 360;
  const c = hcg[1] / 100;
  const g = hcg[2] / 100;

  if (c === 0.0) {
    return [g * 255, g * 255, g * 255];
  }

  const pure = [0, 0, 0];
  const hi = h % 1 * 6;
  const v = hi % 1;
  const w = 1 - v;
  let mg = 0;
  /* eslint-disable max-statements-per-line */

  switch (Math.floor(hi)) {
    case 0:
      pure[0] = 1;
      pure[1] = v;
      pure[2] = 0;
      break;

    case 1:
      pure[0] = w;
      pure[1] = 1;
      pure[2] = 0;
      break;

    case 2:
      pure[0] = 0;
      pure[1] = 1;
      pure[2] = v;
      break;

    case 3:
      pure[0] = 0;
      pure[1] = w;
      pure[2] = 1;
      break;

    case 4:
      pure[0] = v;
      pure[1] = 0;
      pure[2] = 1;
      break;

    default:
      pure[0] = 1;
      pure[1] = 0;
      pure[2] = w;
  }
  /* eslint-enable max-statements-per-line */


  mg = (1.0 - c) * g;
  return [(c * pure[0] + mg) * 255, (c * pure[1] + mg) * 255, (c * pure[2] + mg) * 255];
};

convert$1.hcg.hsv = function (hcg) {
  const c = hcg[1] / 100;
  const g = hcg[2] / 100;
  const v = c + g * (1.0 - c);
  let f = 0;

  if (v > 0.0) {
    f = c / v;
  }

  return [hcg[0], f * 100, v * 100];
};

convert$1.hcg.hsl = function (hcg) {
  const c = hcg[1] / 100;
  const g = hcg[2] / 100;
  const l = g * (1.0 - c) + 0.5 * c;
  let s = 0;

  if (l > 0.0 && l < 0.5) {
    s = c / (2 * l);
  } else if (l >= 0.5 && l < 1.0) {
    s = c / (2 * (1 - l));
  }

  return [hcg[0], s * 100, l * 100];
};

convert$1.hcg.hwb = function (hcg) {
  const c = hcg[1] / 100;
  const g = hcg[2] / 100;
  const v = c + g * (1.0 - c);
  return [hcg[0], (v - c) * 100, (1 - v) * 100];
};

convert$1.hwb.hcg = function (hwb) {
  const w = hwb[1] / 100;
  const b = hwb[2] / 100;
  const v = 1 - b;
  const c = v - w;
  let g = 0;

  if (c < 1) {
    g = (v - c) / (1 - c);
  }

  return [hwb[0], c * 100, g * 100];
};

convert$1.apple.rgb = function (apple) {
  return [apple[0] / 65535 * 255, apple[1] / 65535 * 255, apple[2] / 65535 * 255];
};

convert$1.rgb.apple = function (rgb) {
  return [rgb[0] / 255 * 65535, rgb[1] / 255 * 65535, rgb[2] / 255 * 65535];
};

convert$1.gray.rgb = function (args) {
  return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
};

convert$1.gray.hsl = function (args) {
  return [0, 0, args[0]];
};

convert$1.gray.hsv = convert$1.gray.hsl;

convert$1.gray.hwb = function (gray) {
  return [0, 100, gray[0]];
};

convert$1.gray.cmyk = function (gray) {
  return [0, 0, 0, gray[0]];
};

convert$1.gray.lab = function (gray) {
  return [gray[0], 0, 0];
};

convert$1.gray.hex = function (gray) {
  const val = Math.round(gray[0] / 100 * 255) & 0xFF;
  const integer = (val << 16) + (val << 8) + val;
  const string = integer.toString(16).toUpperCase();
  return '000000'.substring(string.length) + string;
};

convert$1.rgb.gray = function (rgb) {
  const val = (rgb[0] + rgb[1] + rgb[2]) / 3;
  return [val / 255 * 100];
};

/*
	This function routes a model to all other models.

	all functions that are routed have a property `.conversion` attached
	to the returned synthetic function. This property is an array
	of strings, each with the steps in between the 'from' and 'to'
	color models (inclusive).

	conversions that are not possible simply are not included.
*/

function buildGraph() {
  const graph = {}; // https://jsperf.com/object-keys-vs-for-in-with-closure/3

  const models = Object.keys(conversions);

  for (let len = models.length, i = 0; i < len; i++) {
    graph[models[i]] = {
      // http://jsperf.com/1-vs-infinity
      // micro-opt, but this is simple.
      distance: -1,
      parent: null
    };
  }

  return graph;
} // https://en.wikipedia.org/wiki/Breadth-first_search


function deriveBFS(fromModel) {
  const graph = buildGraph();
  const queue = [fromModel]; // Unshift -> queue -> pop

  graph[fromModel].distance = 0;

  while (queue.length) {
    const current = queue.pop();
    const adjacents = Object.keys(conversions[current]);

    for (let len = adjacents.length, i = 0; i < len; i++) {
      const adjacent = adjacents[i];
      const node = graph[adjacent];

      if (node.distance === -1) {
        node.distance = graph[current].distance + 1;
        node.parent = current;
        queue.unshift(adjacent);
      }
    }
  }

  return graph;
}

function link(from, to) {
  return function (args) {
    return to(from(args));
  };
}

function wrapConversion(toModel, graph) {
  const path = [graph[toModel].parent, toModel];
  let fn = conversions[graph[toModel].parent][toModel];
  let cur = graph[toModel].parent;

  while (graph[cur].parent) {
    path.unshift(graph[cur].parent);
    fn = link(conversions[graph[cur].parent][cur], fn);
    cur = graph[cur].parent;
  }

  fn.conversion = path;
  return fn;
}

var route = function (fromModel) {
  const graph = deriveBFS(fromModel);
  const conversion = {};
  const models = Object.keys(graph);

  for (let len = models.length, i = 0; i < len; i++) {
    const toModel = models[i];
    const node = graph[toModel];

    if (node.parent === null) {
      // No possible conversion, or this node is the source model.
      continue;
    }

    conversion[toModel] = wrapConversion(toModel, graph);
  }

  return conversion;
};

const convert = {};
const models = Object.keys(conversions);

function wrapRaw(fn) {
  const wrappedFn = function (...args) {
    const arg0 = args[0];

    if (arg0 === undefined || arg0 === null) {
      return arg0;
    }

    if (arg0.length > 1) {
      args = arg0;
    }

    return fn(args);
  }; // Preserve .conversion property if there is one


  if ('conversion' in fn) {
    wrappedFn.conversion = fn.conversion;
  }

  return wrappedFn;
}

function wrapRounded(fn) {
  const wrappedFn = function (...args) {
    const arg0 = args[0];

    if (arg0 === undefined || arg0 === null) {
      return arg0;
    }

    if (arg0.length > 1) {
      args = arg0;
    }

    const result = fn(args); // We're assuming the result is an array here.
    // see notice in conversions.js; don't use box types
    // in conversion functions.

    if (typeof result === 'object') {
      for (let len = result.length, i = 0; i < len; i++) {
        result[i] = Math.round(result[i]);
      }
    }

    return result;
  }; // Preserve .conversion property if there is one


  if ('conversion' in fn) {
    wrappedFn.conversion = fn.conversion;
  }

  return wrappedFn;
}

models.forEach(fromModel => {
  convert[fromModel] = {};
  Object.defineProperty(convert[fromModel], 'channels', {
    value: conversions[fromModel].channels
  });
  Object.defineProperty(convert[fromModel], 'labels', {
    value: conversions[fromModel].labels
  });
  const routes = route(fromModel);
  const routeModels = Object.keys(routes);
  routeModels.forEach(toModel => {
    const fn = routes[toModel];
    convert[fromModel][toModel] = wrapRounded(fn);
    convert[fromModel][toModel].raw = wrapRaw(fn);
  });
});
var colorConvert = convert;

var ansiStyles = createCommonjsModule(function (module) {

  const wrapAnsi16 = (fn, offset) => (...args) => {
    const code = fn(...args);
    return `\u001B[${code + offset}m`;
  };

  const wrapAnsi256 = (fn, offset) => (...args) => {
    const code = fn(...args);
    return `\u001B[${38 + offset};5;${code}m`;
  };

  const wrapAnsi16m = (fn, offset) => (...args) => {
    const rgb = fn(...args);
    return `\u001B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
  };

  const ansi2ansi = n => n;

  const rgb2rgb = (r, g, b) => [r, g, b];

  const setLazyProperty = (object, property, get) => {
    Object.defineProperty(object, property, {
      get: () => {
        const value = get();
        Object.defineProperty(object, property, {
          value,
          enumerable: true,
          configurable: true
        });
        return value;
      },
      enumerable: true,
      configurable: true
    });
  };
  /** @type {typeof import('color-convert')} */


  let colorConvert$1;

  const makeDynamicStyles = (wrap, targetSpace, identity, isBackground) => {
    if (colorConvert$1 === undefined) {
      colorConvert$1 = colorConvert;
    }

    const offset = isBackground ? 10 : 0;
    const styles = {};

    for (const [sourceSpace, suite] of Object.entries(colorConvert$1)) {
      const name = sourceSpace === 'ansi16' ? 'ansi' : sourceSpace;

      if (sourceSpace === targetSpace) {
        styles[name] = wrap(identity, offset);
      } else if (typeof suite === 'object') {
        styles[name] = wrap(suite[targetSpace], offset);
      }
    }

    return styles;
  };

  function assembleStyles() {
    const codes = new Map();
    const styles = {
      modifier: {
        reset: [0, 0],
        // 21 isn't widely supported and 22 does the same thing
        bold: [1, 22],
        dim: [2, 22],
        italic: [3, 23],
        underline: [4, 24],
        inverse: [7, 27],
        hidden: [8, 28],
        strikethrough: [9, 29]
      },
      color: {
        black: [30, 39],
        red: [31, 39],
        green: [32, 39],
        yellow: [33, 39],
        blue: [34, 39],
        magenta: [35, 39],
        cyan: [36, 39],
        white: [37, 39],
        // Bright color
        blackBright: [90, 39],
        redBright: [91, 39],
        greenBright: [92, 39],
        yellowBright: [93, 39],
        blueBright: [94, 39],
        magentaBright: [95, 39],
        cyanBright: [96, 39],
        whiteBright: [97, 39]
      },
      bgColor: {
        bgBlack: [40, 49],
        bgRed: [41, 49],
        bgGreen: [42, 49],
        bgYellow: [43, 49],
        bgBlue: [44, 49],
        bgMagenta: [45, 49],
        bgCyan: [46, 49],
        bgWhite: [47, 49],
        // Bright color
        bgBlackBright: [100, 49],
        bgRedBright: [101, 49],
        bgGreenBright: [102, 49],
        bgYellowBright: [103, 49],
        bgBlueBright: [104, 49],
        bgMagentaBright: [105, 49],
        bgCyanBright: [106, 49],
        bgWhiteBright: [107, 49]
      }
    }; // Alias bright black as gray (and grey)

    styles.color.gray = styles.color.blackBright;
    styles.bgColor.bgGray = styles.bgColor.bgBlackBright;
    styles.color.grey = styles.color.blackBright;
    styles.bgColor.bgGrey = styles.bgColor.bgBlackBright;

    for (const [groupName, group] of Object.entries(styles)) {
      for (const [styleName, style] of Object.entries(group)) {
        styles[styleName] = {
          open: `\u001B[${style[0]}m`,
          close: `\u001B[${style[1]}m`
        };
        group[styleName] = styles[styleName];
        codes.set(style[0], style[1]);
      }

      Object.defineProperty(styles, groupName, {
        value: group,
        enumerable: false
      });
    }

    Object.defineProperty(styles, 'codes', {
      value: codes,
      enumerable: false
    });
    styles.color.close = '\u001B[39m';
    styles.bgColor.close = '\u001B[49m';
    setLazyProperty(styles.color, 'ansi', () => makeDynamicStyles(wrapAnsi16, 'ansi16', ansi2ansi, false));
    setLazyProperty(styles.color, 'ansi256', () => makeDynamicStyles(wrapAnsi256, 'ansi256', ansi2ansi, false));
    setLazyProperty(styles.color, 'ansi16m', () => makeDynamicStyles(wrapAnsi16m, 'rgb', rgb2rgb, false));
    setLazyProperty(styles.bgColor, 'ansi', () => makeDynamicStyles(wrapAnsi16, 'ansi16', ansi2ansi, true));
    setLazyProperty(styles.bgColor, 'ansi256', () => makeDynamicStyles(wrapAnsi256, 'ansi256', ansi2ansi, true));
    setLazyProperty(styles.bgColor, 'ansi16m', () => makeDynamicStyles(wrapAnsi16m, 'rgb', rgb2rgb, true));
    return styles;
  } // Make the export immutable


  Object.defineProperty(module, 'exports', {
    enumerable: true,
    get: assembleStyles
  });
});

var hasFlag = (flag, argv = process.argv) => {
  const prefix = flag.startsWith('-') ? '' : flag.length === 1 ? '-' : '--';
  const position = argv.indexOf(prefix + flag);
  const terminatorPosition = argv.indexOf('--');
  return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
};

const {
  env
} = process;
let forceColor;

if (hasFlag('no-color') || hasFlag('no-colors') || hasFlag('color=false') || hasFlag('color=never')) {
  forceColor = 0;
} else if (hasFlag('color') || hasFlag('colors') || hasFlag('color=true') || hasFlag('color=always')) {
  forceColor = 1;
}

if ('FORCE_COLOR' in env) {
  if (env.FORCE_COLOR === 'true') {
    forceColor = 1;
  } else if (env.FORCE_COLOR === 'false') {
    forceColor = 0;
  } else {
    forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
  }
}

function translateLevel(level) {
  if (level === 0) {
    return false;
  }

  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3
  };
}

function supportsColor(haveStream, streamIsTTY) {
  if (forceColor === 0) {
    return 0;
  }

  if (hasFlag('color=16m') || hasFlag('color=full') || hasFlag('color=truecolor')) {
    return 3;
  }

  if (hasFlag('color=256')) {
    return 2;
  }

  if (haveStream && !streamIsTTY && forceColor === undefined) {
    return 0;
  }

  const min = forceColor || 0;

  if (env.TERM === 'dumb') {
    return min;
  }

  if (process.platform === 'win32') {
    // Windows 10 build 10586 is the first Windows release that supports 256 colors.
    // Windows 10 build 14931 is the first release that supports 16m/TrueColor.
    const osRelease = os__default['default'].release().split('.');

    if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
      return Number(osRelease[2]) >= 14931 ? 3 : 2;
    }

    return 1;
  }

  if ('CI' in env) {
    if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI', 'GITHUB_ACTIONS', 'BUILDKITE'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
      return 1;
    }

    return min;
  }

  if ('TEAMCITY_VERSION' in env) {
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
  }

  if (env.COLORTERM === 'truecolor') {
    return 3;
  }

  if ('TERM_PROGRAM' in env) {
    const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

    switch (env.TERM_PROGRAM) {
      case 'iTerm.app':
        return version >= 3 ? 3 : 2;

      case 'Apple_Terminal':
        return 2;
      // No default
    }
  }

  if (/-256(color)?$/i.test(env.TERM)) {
    return 2;
  }

  if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
    return 1;
  }

  if ('COLORTERM' in env) {
    return 1;
  }

  return min;
}

function getSupportLevel(stream) {
  const level = supportsColor(stream, stream && stream.isTTY);
  return translateLevel(level);
}

var supportsColor_1 = {
  supportsColor: getSupportLevel,
  stdout: translateLevel(supportsColor(true, tty__default['default'].isatty(1))),
  stderr: translateLevel(supportsColor(true, tty__default['default'].isatty(2)))
};

const stringReplaceAll$1 = (string, substring, replacer) => {
  let index = string.indexOf(substring);

  if (index === -1) {
    return string;
  }

  const substringLength = substring.length;
  let endIndex = 0;
  let returnValue = '';

  do {
    returnValue += string.substr(endIndex, index - endIndex) + substring + replacer;
    endIndex = index + substringLength;
    index = string.indexOf(substring, endIndex);
  } while (index !== -1);

  returnValue += string.substr(endIndex);
  return returnValue;
};

const stringEncaseCRLFWithFirstIndex$1 = (string, prefix, postfix, index) => {
  let endIndex = 0;
  let returnValue = '';

  do {
    const gotCR = string[index - 1] === '\r';
    returnValue += string.substr(endIndex, (gotCR ? index - 1 : index) - endIndex) + prefix + (gotCR ? '\r\n' : '\n') + postfix;
    endIndex = index + 1;
    index = string.indexOf('\n', endIndex);
  } while (index !== -1);

  returnValue += string.substr(endIndex);
  return returnValue;
};

var util = {
  stringReplaceAll: stringReplaceAll$1,
  stringEncaseCRLFWithFirstIndex: stringEncaseCRLFWithFirstIndex$1
};

const TEMPLATE_REGEX = /(?:\\(u(?:[a-f\d]{4}|\{[a-f\d]{1,6}\})|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
const STYLE_REGEX = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
const STRING_REGEX = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
const ESCAPE_REGEX = /\\(u(?:[a-f\d]{4}|{[a-f\d]{1,6}})|x[a-f\d]{2}|.)|([^\\])/gi;
const ESCAPES = new Map([['n', '\n'], ['r', '\r'], ['t', '\t'], ['b', '\b'], ['f', '\f'], ['v', '\v'], ['0', '\0'], ['\\', '\\'], ['e', '\u001B'], ['a', '\u0007']]);

function unescape(c) {
  const u = c[0] === 'u';
  const bracket = c[1] === '{';

  if (u && !bracket && c.length === 5 || c[0] === 'x' && c.length === 3) {
    return String.fromCharCode(parseInt(c.slice(1), 16));
  }

  if (u && bracket) {
    return String.fromCodePoint(parseInt(c.slice(2, -1), 16));
  }

  return ESCAPES.get(c) || c;
}

function parseArguments(name, arguments_) {
  const results = [];
  const chunks = arguments_.trim().split(/\s*,\s*/g);
  let matches;

  for (const chunk of chunks) {
    const number = Number(chunk);

    if (!Number.isNaN(number)) {
      results.push(number);
    } else if (matches = chunk.match(STRING_REGEX)) {
      results.push(matches[2].replace(ESCAPE_REGEX, (m, escape, character) => escape ? unescape(escape) : character));
    } else {
      throw new Error(`Invalid Chalk template style argument: ${chunk} (in style '${name}')`);
    }
  }

  return results;
}

function parseStyle(style) {
  STYLE_REGEX.lastIndex = 0;
  const results = [];
  let matches;

  while ((matches = STYLE_REGEX.exec(style)) !== null) {
    const name = matches[1];

    if (matches[2]) {
      const args = parseArguments(name, matches[2]);
      results.push([name].concat(args));
    } else {
      results.push([name]);
    }
  }

  return results;
}

function buildStyle(chalk, styles) {
  const enabled = {};

  for (const layer of styles) {
    for (const style of layer.styles) {
      enabled[style[0]] = layer.inverse ? null : style.slice(1);
    }
  }

  let current = chalk;

  for (const [styleName, styles] of Object.entries(enabled)) {
    if (!Array.isArray(styles)) {
      continue;
    }

    if (!(styleName in current)) {
      throw new Error(`Unknown Chalk style: ${styleName}`);
    }

    current = styles.length > 0 ? current[styleName](...styles) : current[styleName];
  }

  return current;
}

var templates = (chalk, temporary) => {
  const styles = [];
  const chunks = [];
  let chunk = []; // eslint-disable-next-line max-params

  temporary.replace(TEMPLATE_REGEX, (m, escapeCharacter, inverse, style, close, character) => {
    if (escapeCharacter) {
      chunk.push(unescape(escapeCharacter));
    } else if (style) {
      const string = chunk.join('');
      chunk = [];
      chunks.push(styles.length === 0 ? string : buildStyle(chalk, styles)(string));
      styles.push({
        inverse,
        styles: parseStyle(style)
      });
    } else if (close) {
      if (styles.length === 0) {
        throw new Error('Found extraneous } in Chalk template literal');
      }

      chunks.push(buildStyle(chalk, styles)(chunk.join('')));
      chunk = [];
      styles.pop();
    } else {
      chunk.push(character);
    }
  });
  chunks.push(chunk.join(''));

  if (styles.length > 0) {
    const errMessage = `Chalk template literal is missing ${styles.length} closing bracket${styles.length === 1 ? '' : 's'} (\`}\`)`;
    throw new Error(errMessage);
  }

  return chunks.join('');
};

const {
  stdout: stdoutColor,
  stderr: stderrColor
} = supportsColor_1;
const {
  stringReplaceAll,
  stringEncaseCRLFWithFirstIndex
} = util;
const {
  isArray: isArray$2
} = Array; // `supportsColor.level` → `ansiStyles.color[name]` mapping

const levelMapping = ['ansi', 'ansi', 'ansi256', 'ansi16m'];
const styles = Object.create(null);

const applyOptions = (object, options = {}) => {
  if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
    throw new Error('The `level` option should be an integer from 0 to 3');
  } // Detect level if not set manually


  const colorLevel = stdoutColor ? stdoutColor.level : 0;
  object.level = options.level === undefined ? colorLevel : options.level;
};

class ChalkClass {
  constructor(options) {
    // eslint-disable-next-line no-constructor-return
    return chalkFactory(options);
  }

}

const chalkFactory = options => {
  const chalk = {};
  applyOptions(chalk, options);

  chalk.template = (...arguments_) => chalkTag(chalk.template, ...arguments_);

  Object.setPrototypeOf(chalk, Chalk.prototype);
  Object.setPrototypeOf(chalk.template, chalk);

  chalk.template.constructor = () => {
    throw new Error('`chalk.constructor()` is deprecated. Use `new chalk.Instance()` instead.');
  };

  chalk.template.Instance = ChalkClass;
  return chalk.template;
};

function Chalk(options) {
  return chalkFactory(options);
}

for (const [styleName, style] of Object.entries(ansiStyles)) {
  styles[styleName] = {
    get() {
      const builder = createBuilder(this, createStyler(style.open, style.close, this._styler), this._isEmpty);
      Object.defineProperty(this, styleName, {
        value: builder
      });
      return builder;
    }

  };
}

styles.visible = {
  get() {
    const builder = createBuilder(this, this._styler, true);
    Object.defineProperty(this, 'visible', {
      value: builder
    });
    return builder;
  }

};
const usedModels = ['rgb', 'hex', 'keyword', 'hsl', 'hsv', 'hwb', 'ansi', 'ansi256'];

for (const model of usedModels) {
  styles[model] = {
    get() {
      const {
        level
      } = this;
      return function (...arguments_) {
        const styler = createStyler(ansiStyles.color[levelMapping[level]][model](...arguments_), ansiStyles.color.close, this._styler);
        return createBuilder(this, styler, this._isEmpty);
      };
    }

  };
}

for (const model of usedModels) {
  const bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
  styles[bgModel] = {
    get() {
      const {
        level
      } = this;
      return function (...arguments_) {
        const styler = createStyler(ansiStyles.bgColor[levelMapping[level]][model](...arguments_), ansiStyles.bgColor.close, this._styler);
        return createBuilder(this, styler, this._isEmpty);
      };
    }

  };
}

const proto = Object.defineProperties(() => {}, Object.assign(Object.assign({}, styles), {}, {
  level: {
    enumerable: true,

    get() {
      return this._generator.level;
    },

    set(level) {
      this._generator.level = level;
    }

  }
}));

const createStyler = (open, close, parent) => {
  let openAll;
  let closeAll;

  if (parent === undefined) {
    openAll = open;
    closeAll = close;
  } else {
    openAll = parent.openAll + open;
    closeAll = close + parent.closeAll;
  }

  return {
    open,
    close,
    openAll,
    closeAll,
    parent
  };
};

const createBuilder = (self, _styler, _isEmpty) => {
  const builder = (...arguments_) => {
    if (isArray$2(arguments_[0]) && isArray$2(arguments_[0].raw)) {
      // Called as a template literal, for example: chalk.red`2 + 3 = {bold ${2+3}}`
      return applyStyle(builder, chalkTag(builder, ...arguments_));
    } // Single argument is hot path, implicit coercion is faster than anything
    // eslint-disable-next-line no-implicit-coercion


    return applyStyle(builder, arguments_.length === 1 ? '' + arguments_[0] : arguments_.join(' '));
  }; // We alter the prototype because we must return a function, but there is
  // no way to create a function with a different prototype


  Object.setPrototypeOf(builder, proto);
  builder._generator = self;
  builder._styler = _styler;
  builder._isEmpty = _isEmpty;
  return builder;
};

const applyStyle = (self, string) => {
  if (self.level <= 0 || !string) {
    return self._isEmpty ? '' : string;
  }

  let styler = self._styler;

  if (styler === undefined) {
    return string;
  }

  const {
    openAll,
    closeAll
  } = styler;

  if (string.indexOf('\u001B') !== -1) {
    while (styler !== undefined) {
      // Replace any instances already present with a re-opening code
      // otherwise only the part of the string until said closing code
      // will be colored, and the rest will simply be 'plain'.
      string = stringReplaceAll(string, styler.close, styler.open);
      styler = styler.parent;
    }
  } // We can move both next actions out of loop, because remaining actions in loop won't have
  // any/visible effect on parts we add here. Close the styling before a linebreak and reopen
  // after next line to fix a bleed issue on macOS: https://github.com/chalk/chalk/pull/92


  const lfIndex = string.indexOf('\n');

  if (lfIndex !== -1) {
    string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
  }

  return openAll + string + closeAll;
};

let template;

const chalkTag = (chalk, ...strings) => {
  const [firstString] = strings;

  if (!isArray$2(firstString) || !isArray$2(firstString.raw)) {
    // If chalk() was called by itself or with a string,
    // return the string itself as a string.
    return strings.join(' ');
  }

  const arguments_ = strings.slice(1);
  const parts = [firstString.raw[0]];

  for (let i = 1; i < firstString.length; i++) {
    parts.push(String(arguments_[i - 1]).replace(/[{}\\]/g, '\\$&'), String(firstString.raw[i]));
  }

  if (template === undefined) {
    template = templates;
  }

  return template(chalk, parts.join(''));
};

Object.defineProperties(Chalk.prototype, styles);
const chalk = Chalk(); // eslint-disable-line new-cap

chalk.supportsColor = stdoutColor;
chalk.stderr = Chalk({
  level: stderrColor ? stderrColor.level : 0
}); // eslint-disable-line new-cap

chalk.stderr.supportsColor = stderrColor;
var source = chalk;

var require$$1 = require("./third-party.js");

var prettierInternal = prettier$1.__internal;

// `IsArray` abstract operation
// https://tc39.es/ecma262/#sec-isarray
// eslint-disable-next-line es/no-array-isarray -- safe
var isArray$1 = Array.isArray || function isArray(arg) {
  return classofRaw(arg) == 'Array';
};

// optional / simple context binding
var functionBindContext = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 0: return function () {
      return fn.call(that);
    };
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

// `FlattenIntoArray` abstract operation
// https://tc39.github.io/proposal-flatMap/#sec-FlattenIntoArray
var flattenIntoArray = function (target, original, source, sourceLen, start, depth, mapper, thisArg) {
  var targetIndex = start;
  var sourceIndex = 0;
  var mapFn = mapper ? functionBindContext(mapper, thisArg, 3) : false;
  var element;

  while (sourceIndex < sourceLen) {
    if (sourceIndex in source) {
      element = mapFn ? mapFn(source[sourceIndex], sourceIndex, original) : source[sourceIndex];

      if (depth > 0 && isArray$1(element)) {
        targetIndex = flattenIntoArray(target, original, element, toLength(element.length), targetIndex, depth - 1) - 1;
      } else {
        if (targetIndex >= 0x1FFFFFFFFFFFFF) throw TypeError('Exceed the acceptable array length');
        target[targetIndex] = element;
      }

      targetIndex++;
    }
    sourceIndex++;
  }
  return targetIndex;
};

var flattenIntoArray_1 = flattenIntoArray;

/* eslint-disable es/no-symbol -- required for testing */

// eslint-disable-next-line es/no-object-getownpropertysymbols -- required for testing
var nativeSymbol = !!Object.getOwnPropertySymbols && !fails(function () {
  var symbol = Symbol();
  // Chrome 38 Symbol has incorrect toString conversion
  // `get-own-property-symbols` polyfill symbols converted to object are not Symbol instances
  return !String(symbol) || !(Object(symbol) instanceof Symbol) ||
    // Chrome 38-40 symbols are not inherited from DOM collections prototypes to instances
    !Symbol.sham && engineV8Version && engineV8Version < 41;
});

/* eslint-disable es/no-symbol -- required for testing */

var useSymbolAsUid = nativeSymbol
  && !Symbol.sham
  && typeof Symbol.iterator == 'symbol';

var WellKnownSymbolsStore = shared('wks');
var Symbol$2 = global$1.Symbol;
var createWellKnownSymbol = useSymbolAsUid ? Symbol$2 : Symbol$2 && Symbol$2.withoutSetter || uid;

var wellKnownSymbol = function (name) {
  if (!has$1(WellKnownSymbolsStore, name) || !(nativeSymbol || typeof WellKnownSymbolsStore[name] == 'string')) {
    if (nativeSymbol && has$1(Symbol$2, name)) {
      WellKnownSymbolsStore[name] = Symbol$2[name];
    } else {
      WellKnownSymbolsStore[name] = createWellKnownSymbol('Symbol.' + name);
    }
  } return WellKnownSymbolsStore[name];
};

var SPECIES = wellKnownSymbol('species');

// `ArraySpeciesCreate` abstract operation
// https://tc39.es/ecma262/#sec-arrayspeciescreate
var arraySpeciesCreate = function (originalArray, length) {
  var C;
  if (isArray$1(originalArray)) {
    C = originalArray.constructor;
    // cross-realm fallback
    if (typeof C == 'function' && (C === Array || isArray$1(C.prototype))) C = undefined;
    else if (isObject$3(C)) {
      C = C[SPECIES];
      if (C === null) C = undefined;
    }
  } return new (C === undefined ? Array : C)(length === 0 ? 0 : length);
};

// `Array.prototype.flatMap` method
// https://tc39.es/ecma262/#sec-array.prototype.flatmap
_export({ target: 'Array', proto: true }, {
  flatMap: function flatMap(callbackfn /* , thisArg */) {
    var O = toObject(this);
    var sourceLen = toLength(O.length);
    var A;
    aFunction(callbackfn);
    A = arraySpeciesCreate(O, 0);
    A.length = flattenIntoArray_1(A, O, O, sourceLen, 0, 1, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    return A;
  }
});

var array$2 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.splitWhen = exports.flatten = void 0;

  function flatten(items) {
    return items.reduce((collection, item) => [].concat(collection, item), []);
  }

  exports.flatten = flatten;

  function splitWhen(items, predicate) {
    const result = [[]];
    let groupIndex = 0;

    for (const item of items) {
      if (predicate(item)) {
        groupIndex++;
        result[groupIndex] = [];
      } else {
        result[groupIndex].push(item);
      }
    }

    return result;
  }

  exports.splitWhen = splitWhen;
});

var errno = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.isEnoentCodeError = void 0;

  function isEnoentCodeError(error) {
    return error.code === 'ENOENT';
  }

  exports.isEnoentCodeError = isEnoentCodeError;
});

var fs$3 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.createDirentFromStats = void 0;

  class DirentFromStats {
    constructor(name, stats) {
      this.name = name;
      this.isBlockDevice = stats.isBlockDevice.bind(stats);
      this.isCharacterDevice = stats.isCharacterDevice.bind(stats);
      this.isDirectory = stats.isDirectory.bind(stats);
      this.isFIFO = stats.isFIFO.bind(stats);
      this.isFile = stats.isFile.bind(stats);
      this.isSocket = stats.isSocket.bind(stats);
      this.isSymbolicLink = stats.isSymbolicLink.bind(stats);
    }

  }

  function createDirentFromStats(name, stats) {
    return new DirentFromStats(name, stats);
  }

  exports.createDirentFromStats = createDirentFromStats;
});

var path_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.removeLeadingDotSegment = exports.escape = exports.makeAbsolute = exports.unixify = void 0;
  const LEADING_DOT_SEGMENT_CHARACTERS_COUNT = 2; // ./ or .\\

  const UNESCAPED_GLOB_SYMBOLS_RE = /(\\?)([()*?[\]{|}]|^!|[!+@](?=\())/g;
  /**
   * Designed to work only with simple paths: `dir\\file`.
   */

  function unixify(filepath) {
    return filepath.replace(/\\/g, '/');
  }

  exports.unixify = unixify;

  function makeAbsolute(cwd, filepath) {
    return path__default['default'].resolve(cwd, filepath);
  }

  exports.makeAbsolute = makeAbsolute;

  function escape(pattern) {
    return pattern.replace(UNESCAPED_GLOB_SYMBOLS_RE, '\\$2');
  }

  exports.escape = escape;

  function removeLeadingDotSegment(entry) {
    // We do not use `startsWith` because this is 10x slower than current implementation for some cases.
    // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
    if (entry.charAt(0) === '.') {
      const secondCharactery = entry.charAt(1);

      if (secondCharactery === '/' || secondCharactery === '\\') {
        return entry.slice(LEADING_DOT_SEGMENT_CHARACTERS_COUNT);
      }
    }

    return entry;
  }

  exports.removeLeadingDotSegment = removeLeadingDotSegment;
});

/*!
 * is-extglob <https://github.com/jonschlinkert/is-extglob>
 *
 * Copyright (c) 2014-2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */
var isExtglob = function isExtglob(str) {
  if (typeof str !== 'string' || str === '') {
    return false;
  }

  var match;

  while (match = /(\\).|([@?!+*]\(.*\))/g.exec(str)) {
    if (match[2]) return true;
    str = str.slice(match.index + match[0].length);
  }

  return false;
};

/*!
 * is-glob <https://github.com/jonschlinkert/is-glob>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */
var chars = {
  '{': '}',
  '(': ')',
  '[': ']'
};
var strictRegex = /\\(.)|(^!|\*|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\))/;
var relaxedRegex = /\\(.)|(^!|[*?{}()[\]]|\(\?)/;

var isGlob = function isGlob(str, options) {
  if (typeof str !== 'string' || str === '') {
    return false;
  }

  if (isExtglob(str)) {
    return true;
  }

  var regex = strictRegex;
  var match; // optionally relax regex

  if (options && options.strict === false) {
    regex = relaxedRegex;
  }

  while (match = regex.exec(str)) {
    if (match[2]) return true;
    var idx = match.index + match[0].length; // if an open bracket/brace/paren is escaped,
    // set the index to the next closing character

    var open = match[1];
    var close = open ? chars[open] : null;

    if (open && close) {
      var n = str.indexOf(close, idx);

      if (n !== -1) {
        idx = n + 1;
      }
    }

    str = str.slice(idx);
  }

  return false;
};

var pathPosixDirname = path__default['default'].posix.dirname;
var isWin32 = os__default['default'].platform() === 'win32';
var slash = '/';
var backslash = /\\/g;
var enclosure = /[\{\[].*[\}\]]$/;
var globby = /(^|[^\\])([\{\[]|\([^\)]+$)/;
var escaped = /\\([\!\*\?\|\[\]\(\)\{\}])/g;
/**
 * @param {string} str
 * @param {Object} opts
 * @param {boolean} [opts.flipBackslashes=true]
 * @returns {string}
 */

var globParent = function globParent(str, opts) {
  var options = Object.assign({
    flipBackslashes: true
  }, opts); // flip windows path separators

  if (options.flipBackslashes && isWin32 && str.indexOf(slash) < 0) {
    str = str.replace(backslash, slash);
  } // special case for strings ending in enclosure containing path separator


  if (enclosure.test(str)) {
    str += slash;
  } // preserves full path in case of trailing path separator


  str += 'a'; // remove path parts that are globby

  do {
    str = pathPosixDirname(str);
  } while (isGlob(str) || globby.test(str)); // remove escape chars and return result


  return str.replace(escaped, '$1');
};

var utils$3 = createCommonjsModule(function (module, exports) {

  exports.isInteger = num => {
    if (typeof num === 'number') {
      return Number.isInteger(num);
    }

    if (typeof num === 'string' && num.trim() !== '') {
      return Number.isInteger(Number(num));
    }

    return false;
  };
  /**
   * Find a node of the given type
   */


  exports.find = (node, type) => node.nodes.find(node => node.type === type);
  /**
   * Find a node of the given type
   */


  exports.exceedsLimit = (min, max, step = 1, limit) => {
    if (limit === false) return false;
    if (!exports.isInteger(min) || !exports.isInteger(max)) return false;
    return (Number(max) - Number(min)) / Number(step) >= limit;
  };
  /**
   * Escape the given node with '\\' before node.value
   */


  exports.escapeNode = (block, n = 0, type) => {
    let node = block.nodes[n];
    if (!node) return;

    if (type && node.type === type || node.type === 'open' || node.type === 'close') {
      if (node.escaped !== true) {
        node.value = '\\' + node.value;
        node.escaped = true;
      }
    }
  };
  /**
   * Returns true if the given brace node should be enclosed in literal braces
   */


  exports.encloseBrace = node => {
    if (node.type !== 'brace') return false;

    if (node.commas >> 0 + node.ranges >> 0 === 0) {
      node.invalid = true;
      return true;
    }

    return false;
  };
  /**
   * Returns true if a brace node is invalid.
   */


  exports.isInvalidBrace = block => {
    if (block.type !== 'brace') return false;
    if (block.invalid === true || block.dollar) return true;

    if (block.commas >> 0 + block.ranges >> 0 === 0) {
      block.invalid = true;
      return true;
    }

    if (block.open !== true || block.close !== true) {
      block.invalid = true;
      return true;
    }

    return false;
  };
  /**
   * Returns true if a node is an open or close node
   */


  exports.isOpenOrClose = node => {
    if (node.type === 'open' || node.type === 'close') {
      return true;
    }

    return node.open === true || node.close === true;
  };
  /**
   * Reduce an array of text nodes.
   */


  exports.reduce = nodes => nodes.reduce((acc, node) => {
    if (node.type === 'text') acc.push(node.value);
    if (node.type === 'range') node.type = 'text';
    return acc;
  }, []);
  /**
   * Flatten an array
   */


  exports.flatten = (...args) => {
    const result = [];

    const flat = arr => {
      for (let i = 0; i < arr.length; i++) {
        let ele = arr[i];
        Array.isArray(ele) ? flat(ele) : ele !== void 0 && result.push(ele);
      }

      return result;
    };

    flat(args);
    return result;
  };
});

var stringify$1 = (ast, options = {}) => {
  let stringify = (node, parent = {}) => {
    let invalidBlock = options.escapeInvalid && utils$3.isInvalidBrace(parent);
    let invalidNode = node.invalid === true && options.escapeInvalid === true;
    let output = '';

    if (node.value) {
      if ((invalidBlock || invalidNode) && utils$3.isOpenOrClose(node)) {
        return '\\' + node.value;
      }

      return node.value;
    }

    if (node.value) {
      return node.value;
    }

    if (node.nodes) {
      for (let child of node.nodes) {
        output += stringify(child);
      }
    }

    return output;
  };

  return stringify(ast);
};

/*!
 * is-number <https://github.com/jonschlinkert/is-number>
 *
 * Copyright (c) 2014-present, Jon Schlinkert.
 * Released under the MIT License.
 */

var isNumber$2 = function (num) {
  if (typeof num === 'number') {
    return num - num === 0;
  }

  if (typeof num === 'string' && num.trim() !== '') {
    return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
  }

  return false;
};

const toRegexRange = (min, max, options) => {
  if (isNumber$2(min) === false) {
    throw new TypeError('toRegexRange: expected the first argument to be a number');
  }

  if (max === void 0 || min === max) {
    return String(min);
  }

  if (isNumber$2(max) === false) {
    throw new TypeError('toRegexRange: expected the second argument to be a number.');
  }

  let opts = Object.assign({
    relaxZeros: true
  }, options);

  if (typeof opts.strictZeros === 'boolean') {
    opts.relaxZeros = opts.strictZeros === false;
  }

  let relax = String(opts.relaxZeros);
  let shorthand = String(opts.shorthand);
  let capture = String(opts.capture);
  let wrap = String(opts.wrap);
  let cacheKey = min + ':' + max + '=' + relax + shorthand + capture + wrap;

  if (toRegexRange.cache.hasOwnProperty(cacheKey)) {
    return toRegexRange.cache[cacheKey].result;
  }

  let a = Math.min(min, max);
  let b = Math.max(min, max);

  if (Math.abs(a - b) === 1) {
    let result = min + '|' + max;

    if (opts.capture) {
      return `(${result})`;
    }

    if (opts.wrap === false) {
      return result;
    }

    return `(?:${result})`;
  }

  let isPadded = hasPadding(min) || hasPadding(max);
  let state = {
    min,
    max,
    a,
    b
  };
  let positives = [];
  let negatives = [];

  if (isPadded) {
    state.isPadded = isPadded;
    state.maxLen = String(state.max).length;
  }

  if (a < 0) {
    let newMin = b < 0 ? Math.abs(b) : 1;
    negatives = splitToPatterns(newMin, Math.abs(a), state, opts);
    a = state.a = 0;
  }

  if (b >= 0) {
    positives = splitToPatterns(a, b, state, opts);
  }

  state.negatives = negatives;
  state.positives = positives;
  state.result = collatePatterns(negatives, positives);

  if (opts.capture === true) {
    state.result = `(${state.result})`;
  } else if (opts.wrap !== false && positives.length + negatives.length > 1) {
    state.result = `(?:${state.result})`;
  }

  toRegexRange.cache[cacheKey] = state;
  return state.result;
};

function collatePatterns(neg, pos, options) {
  let onlyNegative = filterPatterns(neg, pos, '-', false) || [];
  let onlyPositive = filterPatterns(pos, neg, '', false) || [];
  let intersected = filterPatterns(neg, pos, '-?', true) || [];
  let subpatterns = onlyNegative.concat(intersected).concat(onlyPositive);
  return subpatterns.join('|');
}

function splitToRanges(min, max) {
  let nines = 1;
  let zeros = 1;
  let stop = countNines(min, nines);
  let stops = new Set([max]);

  while (min <= stop && stop <= max) {
    stops.add(stop);
    nines += 1;
    stop = countNines(min, nines);
  }

  stop = countZeros(max + 1, zeros) - 1;

  while (min < stop && stop <= max) {
    stops.add(stop);
    zeros += 1;
    stop = countZeros(max + 1, zeros) - 1;
  }

  stops = [...stops];
  stops.sort(compare);
  return stops;
}
/**
 * Convert a range to a regex pattern
 * @param {Number} `start`
 * @param {Number} `stop`
 * @return {String}
 */


function rangeToPattern(start, stop, options) {
  if (start === stop) {
    return {
      pattern: start,
      count: [],
      digits: 0
    };
  }

  let zipped = zip(start, stop);
  let digits = zipped.length;
  let pattern = '';
  let count = 0;

  for (let i = 0; i < digits; i++) {
    let [startDigit, stopDigit] = zipped[i];

    if (startDigit === stopDigit) {
      pattern += startDigit;
    } else if (startDigit !== '0' || stopDigit !== '9') {
      pattern += toCharacterClass(startDigit, stopDigit);
    } else {
      count++;
    }
  }

  if (count) {
    pattern += options.shorthand === true ? '\\d' : '[0-9]';
  }

  return {
    pattern,
    count: [count],
    digits
  };
}

function splitToPatterns(min, max, tok, options) {
  let ranges = splitToRanges(min, max);
  let tokens = [];
  let start = min;
  let prev;

  for (let i = 0; i < ranges.length; i++) {
    let max = ranges[i];
    let obj = rangeToPattern(String(start), String(max), options);
    let zeros = '';

    if (!tok.isPadded && prev && prev.pattern === obj.pattern) {
      if (prev.count.length > 1) {
        prev.count.pop();
      }

      prev.count.push(obj.count[0]);
      prev.string = prev.pattern + toQuantifier(prev.count);
      start = max + 1;
      continue;
    }

    if (tok.isPadded) {
      zeros = padZeros(max, tok, options);
    }

    obj.string = zeros + obj.pattern + toQuantifier(obj.count);
    tokens.push(obj);
    start = max + 1;
    prev = obj;
  }

  return tokens;
}

function filterPatterns(arr, comparison, prefix, intersection, options) {
  let result = [];

  for (let ele of arr) {
    let {
      string
    } = ele; // only push if _both_ are negative...

    if (!intersection && !contains(comparison, 'string', string)) {
      result.push(prefix + string);
    } // or _both_ are positive


    if (intersection && contains(comparison, 'string', string)) {
      result.push(prefix + string);
    }
  }

  return result;
}
/**
 * Zip strings
 */


function zip(a, b) {
  let arr = [];

  for (let i = 0; i < a.length; i++) arr.push([a[i], b[i]]);

  return arr;
}

function compare(a, b) {
  return a > b ? 1 : b > a ? -1 : 0;
}

function contains(arr, key, val) {
  return arr.some(ele => ele[key] === val);
}

function countNines(min, len) {
  return Number(String(min).slice(0, -len) + '9'.repeat(len));
}

function countZeros(integer, zeros) {
  return integer - integer % Math.pow(10, zeros);
}

function toQuantifier(digits) {
  let [start = 0, stop = ''] = digits;

  if (stop || start > 1) {
    return `{${start + (stop ? ',' + stop : '')}}`;
  }

  return '';
}

function toCharacterClass(a, b, options) {
  return `[${a}${b - a === 1 ? '' : '-'}${b}]`;
}

function hasPadding(str) {
  return /^-?(0+)\d/.test(str);
}

function padZeros(value, tok, options) {
  if (!tok.isPadded) {
    return value;
  }

  let diff = Math.abs(tok.maxLen - String(value).length);
  let relax = options.relaxZeros !== false;

  switch (diff) {
    case 0:
      return '';

    case 1:
      return relax ? '0?' : '0';

    case 2:
      return relax ? '0{0,2}' : '00';

    default:
      {
        return relax ? `0{0,${diff}}` : `0{${diff}}`;
      }
  }
}
/**
 * Cache
 */


toRegexRange.cache = {};

toRegexRange.clearCache = () => toRegexRange.cache = {};
/**
 * Expose `toRegexRange`
 */


var toRegexRange_1 = toRegexRange;

const isObject$2 = val => val !== null && typeof val === 'object' && !Array.isArray(val);

const transform = toNumber => {
  return value => toNumber === true ? Number(value) : String(value);
};

const isValidValue = value => {
  return typeof value === 'number' || typeof value === 'string' && value !== '';
};

const isNumber$1 = num => Number.isInteger(+num);

const zeros = input => {
  let value = `${input}`;
  let index = -1;
  if (value[0] === '-') value = value.slice(1);
  if (value === '0') return false;

  while (value[++index] === '0');

  return index > 0;
};

const stringify = (start, end, options) => {
  if (typeof start === 'string' || typeof end === 'string') {
    return true;
  }

  return options.stringify === true;
};

const pad = (input, maxLength, toNumber) => {
  if (maxLength > 0) {
    let dash = input[0] === '-' ? '-' : '';
    if (dash) input = input.slice(1);
    input = dash + input.padStart(dash ? maxLength - 1 : maxLength, '0');
  }

  if (toNumber === false) {
    return String(input);
  }

  return input;
};

const toMaxLen = (input, maxLength) => {
  let negative = input[0] === '-' ? '-' : '';

  if (negative) {
    input = input.slice(1);
    maxLength--;
  }

  while (input.length < maxLength) input = '0' + input;

  return negative ? '-' + input : input;
};

const toSequence = (parts, options) => {
  parts.negatives.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  parts.positives.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  let prefix = options.capture ? '' : '?:';
  let positives = '';
  let negatives = '';
  let result;

  if (parts.positives.length) {
    positives = parts.positives.join('|');
  }

  if (parts.negatives.length) {
    negatives = `-(${prefix}${parts.negatives.join('|')})`;
  }

  if (positives && negatives) {
    result = `${positives}|${negatives}`;
  } else {
    result = positives || negatives;
  }

  if (options.wrap) {
    return `(${prefix}${result})`;
  }

  return result;
};

const toRange = (a, b, isNumbers, options) => {
  if (isNumbers) {
    return toRegexRange_1(a, b, Object.assign({
      wrap: false
    }, options));
  }

  let start = String.fromCharCode(a);
  if (a === b) return start;
  let stop = String.fromCharCode(b);
  return `[${start}-${stop}]`;
};

const toRegex = (start, end, options) => {
  if (Array.isArray(start)) {
    let wrap = options.wrap === true;
    let prefix = options.capture ? '' : '?:';
    return wrap ? `(${prefix}${start.join('|')})` : start.join('|');
  }

  return toRegexRange_1(start, end, options);
};

const rangeError = (...args) => {
  return new RangeError('Invalid range arguments: ' + util__default['default'].inspect(...args));
};

const invalidRange = (start, end, options) => {
  if (options.strictRanges === true) throw rangeError([start, end]);
  return [];
};

const invalidStep = (step, options) => {
  if (options.strictRanges === true) {
    throw new TypeError(`Expected step "${step}" to be a number`);
  }

  return [];
};

const fillNumbers = (start, end, step = 1, options = {}) => {
  let a = Number(start);
  let b = Number(end);

  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    if (options.strictRanges === true) throw rangeError([start, end]);
    return [];
  } // fix negative zero


  if (a === 0) a = 0;
  if (b === 0) b = 0;
  let descending = a > b;
  let startString = String(start);
  let endString = String(end);
  let stepString = String(step);
  step = Math.max(Math.abs(step), 1);
  let padded = zeros(startString) || zeros(endString) || zeros(stepString);
  let maxLen = padded ? Math.max(startString.length, endString.length, stepString.length) : 0;
  let toNumber = padded === false && stringify(start, end, options) === false;
  let format = options.transform || transform(toNumber);

  if (options.toRegex && step === 1) {
    return toRange(toMaxLen(start, maxLen), toMaxLen(end, maxLen), true, options);
  }

  let parts = {
    negatives: [],
    positives: []
  };

  let push = num => parts[num < 0 ? 'negatives' : 'positives'].push(Math.abs(num));

  let range = [];
  let index = 0;

  while (descending ? a >= b : a <= b) {
    if (options.toRegex === true && step > 1) {
      push(a);
    } else {
      range.push(pad(format(a, index), maxLen, toNumber));
    }

    a = descending ? a - step : a + step;
    index++;
  }

  if (options.toRegex === true) {
    return step > 1 ? toSequence(parts, options) : toRegex(range, null, Object.assign({
      wrap: false
    }, options));
  }

  return range;
};

const fillLetters = (start, end, step = 1, options = {}) => {
  if (!isNumber$1(start) && start.length > 1 || !isNumber$1(end) && end.length > 1) {
    return invalidRange(start, end, options);
  }

  let format = options.transform || (val => String.fromCharCode(val));

  let a = `${start}`.charCodeAt(0);
  let b = `${end}`.charCodeAt(0);
  let descending = a > b;
  let min = Math.min(a, b);
  let max = Math.max(a, b);

  if (options.toRegex && step === 1) {
    return toRange(min, max, false, options);
  }

  let range = [];
  let index = 0;

  while (descending ? a >= b : a <= b) {
    range.push(format(a, index));
    a = descending ? a - step : a + step;
    index++;
  }

  if (options.toRegex === true) {
    return toRegex(range, null, {
      wrap: false,
      options
    });
  }

  return range;
};

const fill = (start, end, step, options = {}) => {
  if (end == null && isValidValue(start)) {
    return [start];
  }

  if (!isValidValue(start) || !isValidValue(end)) {
    return invalidRange(start, end, options);
  }

  if (typeof step === 'function') {
    return fill(start, end, 1, {
      transform: step
    });
  }

  if (isObject$2(step)) {
    return fill(start, end, 0, step);
  }

  let opts = Object.assign({}, options);
  if (opts.capture === true) opts.wrap = true;
  step = step || opts.step || 1;

  if (!isNumber$1(step)) {
    if (step != null && !isObject$2(step)) return invalidStep(step, opts);
    return fill(start, end, 1, step);
  }

  if (isNumber$1(start) && isNumber$1(end)) {
    return fillNumbers(start, end, step, opts);
  }

  return fillLetters(start, end, Math.max(Math.abs(step), 1), opts);
};

var fillRange = fill;

const compile = (ast, options = {}) => {
  let walk = (node, parent = {}) => {
    let invalidBlock = utils$3.isInvalidBrace(parent);
    let invalidNode = node.invalid === true && options.escapeInvalid === true;
    let invalid = invalidBlock === true || invalidNode === true;
    let prefix = options.escapeInvalid === true ? '\\' : '';
    let output = '';

    if (node.isOpen === true) {
      return prefix + node.value;
    }

    if (node.isClose === true) {
      return prefix + node.value;
    }

    if (node.type === 'open') {
      return invalid ? prefix + node.value : '(';
    }

    if (node.type === 'close') {
      return invalid ? prefix + node.value : ')';
    }

    if (node.type === 'comma') {
      return node.prev.type === 'comma' ? '' : invalid ? node.value : '|';
    }

    if (node.value) {
      return node.value;
    }

    if (node.nodes && node.ranges > 0) {
      let args = utils$3.reduce(node.nodes);
      let range = fillRange(...args, Object.assign(Object.assign({}, options), {}, {
        wrap: false,
        toRegex: true
      }));

      if (range.length !== 0) {
        return args.length > 1 && range.length > 1 ? `(${range})` : range;
      }
    }

    if (node.nodes) {
      for (let child of node.nodes) {
        output += walk(child, node);
      }
    }

    return output;
  };

  return walk(ast);
};

var compile_1 = compile;

const append = (queue = '', stash = '', enclose = false) => {
  let result = [];
  queue = [].concat(queue);
  stash = [].concat(stash);
  if (!stash.length) return queue;

  if (!queue.length) {
    return enclose ? utils$3.flatten(stash).map(ele => `{${ele}}`) : stash;
  }

  for (let item of queue) {
    if (Array.isArray(item)) {
      for (let value of item) {
        result.push(append(value, stash, enclose));
      }
    } else {
      for (let ele of stash) {
        if (enclose === true && typeof ele === 'string') ele = `{${ele}}`;
        result.push(Array.isArray(ele) ? append(item, ele, enclose) : item + ele);
      }
    }
  }

  return utils$3.flatten(result);
};

const expand = (ast, options = {}) => {
  let rangeLimit = options.rangeLimit === void 0 ? 1000 : options.rangeLimit;

  let walk = (node, parent = {}) => {
    node.queue = [];
    let p = parent;
    let q = parent.queue;

    while (p.type !== 'brace' && p.type !== 'root' && p.parent) {
      p = p.parent;
      q = p.queue;
    }

    if (node.invalid || node.dollar) {
      q.push(append(q.pop(), stringify$1(node, options)));
      return;
    }

    if (node.type === 'brace' && node.invalid !== true && node.nodes.length === 2) {
      q.push(append(q.pop(), ['{}']));
      return;
    }

    if (node.nodes && node.ranges > 0) {
      let args = utils$3.reduce(node.nodes);

      if (utils$3.exceedsLimit(...args, options.step, rangeLimit)) {
        throw new RangeError('expanded array length exceeds range limit. Use options.rangeLimit to increase or disable the limit.');
      }

      let range = fillRange(...args, options);

      if (range.length === 0) {
        range = stringify$1(node, options);
      }

      q.push(append(q.pop(), range));
      node.nodes = [];
      return;
    }

    let enclose = utils$3.encloseBrace(node);
    let queue = node.queue;
    let block = node;

    while (block.type !== 'brace' && block.type !== 'root' && block.parent) {
      block = block.parent;
      queue = block.queue;
    }

    for (let i = 0; i < node.nodes.length; i++) {
      let child = node.nodes[i];

      if (child.type === 'comma' && node.type === 'brace') {
        if (i === 1) queue.push('');
        queue.push('');
        continue;
      }

      if (child.type === 'close') {
        q.push(append(q.pop(), queue, enclose));
        continue;
      }

      if (child.value && child.type !== 'open') {
        queue.push(append(queue.pop(), child.value));
        continue;
      }

      if (child.nodes) {
        walk(child, node);
      }
    }

    return queue;
  };

  return utils$3.flatten(walk(ast));
};

var expand_1 = expand;

var constants$2 = {
  MAX_LENGTH: 1024 * 64,
  // Digits
  CHAR_0: '0',

  /* 0 */
  CHAR_9: '9',

  /* 9 */
  // Alphabet chars.
  CHAR_UPPERCASE_A: 'A',

  /* A */
  CHAR_LOWERCASE_A: 'a',

  /* a */
  CHAR_UPPERCASE_Z: 'Z',

  /* Z */
  CHAR_LOWERCASE_Z: 'z',

  /* z */
  CHAR_LEFT_PARENTHESES: '(',

  /* ( */
  CHAR_RIGHT_PARENTHESES: ')',

  /* ) */
  CHAR_ASTERISK: '*',

  /* * */
  // Non-alphabetic chars.
  CHAR_AMPERSAND: '&',

  /* & */
  CHAR_AT: '@',

  /* @ */
  CHAR_BACKSLASH: '\\',

  /* \ */
  CHAR_BACKTICK: '`',

  /* ` */
  CHAR_CARRIAGE_RETURN: '\r',

  /* \r */
  CHAR_CIRCUMFLEX_ACCENT: '^',

  /* ^ */
  CHAR_COLON: ':',

  /* : */
  CHAR_COMMA: ',',

  /* , */
  CHAR_DOLLAR: '$',

  /* . */
  CHAR_DOT: '.',

  /* . */
  CHAR_DOUBLE_QUOTE: '"',

  /* " */
  CHAR_EQUAL: '=',

  /* = */
  CHAR_EXCLAMATION_MARK: '!',

  /* ! */
  CHAR_FORM_FEED: '\f',

  /* \f */
  CHAR_FORWARD_SLASH: '/',

  /* / */
  CHAR_HASH: '#',

  /* # */
  CHAR_HYPHEN_MINUS: '-',

  /* - */
  CHAR_LEFT_ANGLE_BRACKET: '<',

  /* < */
  CHAR_LEFT_CURLY_BRACE: '{',

  /* { */
  CHAR_LEFT_SQUARE_BRACKET: '[',

  /* [ */
  CHAR_LINE_FEED: '\n',

  /* \n */
  CHAR_NO_BREAK_SPACE: '\u00A0',

  /* \u00A0 */
  CHAR_PERCENT: '%',

  /* % */
  CHAR_PLUS: '+',

  /* + */
  CHAR_QUESTION_MARK: '?',

  /* ? */
  CHAR_RIGHT_ANGLE_BRACKET: '>',

  /* > */
  CHAR_RIGHT_CURLY_BRACE: '}',

  /* } */
  CHAR_RIGHT_SQUARE_BRACKET: ']',

  /* ] */
  CHAR_SEMICOLON: ';',

  /* ; */
  CHAR_SINGLE_QUOTE: '\'',

  /* ' */
  CHAR_SPACE: ' ',

  /*   */
  CHAR_TAB: '\t',

  /* \t */
  CHAR_UNDERSCORE: '_',

  /* _ */
  CHAR_VERTICAL_LINE: '|',

  /* | */
  CHAR_ZERO_WIDTH_NOBREAK_SPACE: '\uFEFF'
  /* \uFEFF */

};

/**
 * Constants
 */


const {
  MAX_LENGTH: MAX_LENGTH$1,
  CHAR_BACKSLASH,

  /* \ */
  CHAR_BACKTICK,

  /* ` */
  CHAR_COMMA: CHAR_COMMA$1,

  /* , */
  CHAR_DOT: CHAR_DOT$1,

  /* . */
  CHAR_LEFT_PARENTHESES: CHAR_LEFT_PARENTHESES$1,

  /* ( */
  CHAR_RIGHT_PARENTHESES: CHAR_RIGHT_PARENTHESES$1,

  /* ) */
  CHAR_LEFT_CURLY_BRACE: CHAR_LEFT_CURLY_BRACE$1,

  /* { */
  CHAR_RIGHT_CURLY_BRACE: CHAR_RIGHT_CURLY_BRACE$1,

  /* } */
  CHAR_LEFT_SQUARE_BRACKET: CHAR_LEFT_SQUARE_BRACKET$1,

  /* [ */
  CHAR_RIGHT_SQUARE_BRACKET: CHAR_RIGHT_SQUARE_BRACKET$1,

  /* ] */
  CHAR_DOUBLE_QUOTE,

  /* " */
  CHAR_SINGLE_QUOTE,

  /* ' */
  CHAR_NO_BREAK_SPACE,
  CHAR_ZERO_WIDTH_NOBREAK_SPACE
} = constants$2;
/**
 * parse
 */

const parse$2 = (input, options = {}) => {
  if (typeof input !== 'string') {
    throw new TypeError('Expected a string');
  }

  let opts = options || {};
  let max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH$1, opts.maxLength) : MAX_LENGTH$1;

  if (input.length > max) {
    throw new SyntaxError(`Input length (${input.length}), exceeds max characters (${max})`);
  }

  let ast = {
    type: 'root',
    input,
    nodes: []
  };
  let stack = [ast];
  let block = ast;
  let prev = ast;
  let brackets = 0;
  let length = input.length;
  let index = 0;
  let depth = 0;
  let value;
  /**
   * Helpers
   */

  const advance = () => input[index++];

  const push = node => {
    if (node.type === 'text' && prev.type === 'dot') {
      prev.type = 'text';
    }

    if (prev && prev.type === 'text' && node.type === 'text') {
      prev.value += node.value;
      return;
    }

    block.nodes.push(node);
    node.parent = block;
    node.prev = prev;
    prev = node;
    return node;
  };

  push({
    type: 'bos'
  });

  while (index < length) {
    block = stack[stack.length - 1];
    value = advance();
    /**
     * Invalid chars
     */

    if (value === CHAR_ZERO_WIDTH_NOBREAK_SPACE || value === CHAR_NO_BREAK_SPACE) {
      continue;
    }
    /**
     * Escaped chars
     */


    if (value === CHAR_BACKSLASH) {
      push({
        type: 'text',
        value: (options.keepEscaping ? value : '') + advance()
      });
      continue;
    }
    /**
     * Right square bracket (literal): ']'
     */


    if (value === CHAR_RIGHT_SQUARE_BRACKET$1) {
      push({
        type: 'text',
        value: '\\' + value
      });
      continue;
    }
    /**
     * Left square bracket: '['
     */


    if (value === CHAR_LEFT_SQUARE_BRACKET$1) {
      brackets++;
      let next;

      while (index < length && (next = advance())) {
        value += next;

        if (next === CHAR_LEFT_SQUARE_BRACKET$1) {
          brackets++;
          continue;
        }

        if (next === CHAR_BACKSLASH) {
          value += advance();
          continue;
        }

        if (next === CHAR_RIGHT_SQUARE_BRACKET$1) {
          brackets--;

          if (brackets === 0) {
            break;
          }
        }
      }

      push({
        type: 'text',
        value
      });
      continue;
    }
    /**
     * Parentheses
     */


    if (value === CHAR_LEFT_PARENTHESES$1) {
      block = push({
        type: 'paren',
        nodes: []
      });
      stack.push(block);
      push({
        type: 'text',
        value
      });
      continue;
    }

    if (value === CHAR_RIGHT_PARENTHESES$1) {
      if (block.type !== 'paren') {
        push({
          type: 'text',
          value
        });
        continue;
      }

      block = stack.pop();
      push({
        type: 'text',
        value
      });
      block = stack[stack.length - 1];
      continue;
    }
    /**
     * Quotes: '|"|`
     */


    if (value === CHAR_DOUBLE_QUOTE || value === CHAR_SINGLE_QUOTE || value === CHAR_BACKTICK) {
      let open = value;
      let next;

      if (options.keepQuotes !== true) {
        value = '';
      }

      while (index < length && (next = advance())) {
        if (next === CHAR_BACKSLASH) {
          value += next + advance();
          continue;
        }

        if (next === open) {
          if (options.keepQuotes === true) value += next;
          break;
        }

        value += next;
      }

      push({
        type: 'text',
        value
      });
      continue;
    }
    /**
     * Left curly brace: '{'
     */


    if (value === CHAR_LEFT_CURLY_BRACE$1) {
      depth++;
      let dollar = prev.value && prev.value.slice(-1) === '$' || block.dollar === true;
      let brace = {
        type: 'brace',
        open: true,
        close: false,
        dollar,
        depth,
        commas: 0,
        ranges: 0,
        nodes: []
      };
      block = push(brace);
      stack.push(block);
      push({
        type: 'open',
        value
      });
      continue;
    }
    /**
     * Right curly brace: '}'
     */


    if (value === CHAR_RIGHT_CURLY_BRACE$1) {
      if (block.type !== 'brace') {
        push({
          type: 'text',
          value
        });
        continue;
      }

      let type = 'close';
      block = stack.pop();
      block.close = true;
      push({
        type,
        value
      });
      depth--;
      block = stack[stack.length - 1];
      continue;
    }
    /**
     * Comma: ','
     */


    if (value === CHAR_COMMA$1 && depth > 0) {
      if (block.ranges > 0) {
        block.ranges = 0;
        let open = block.nodes.shift();
        block.nodes = [open, {
          type: 'text',
          value: stringify$1(block)
        }];
      }

      push({
        type: 'comma',
        value
      });
      block.commas++;
      continue;
    }
    /**
     * Dot: '.'
     */


    if (value === CHAR_DOT$1 && depth > 0 && block.commas === 0) {
      let siblings = block.nodes;

      if (depth === 0 || siblings.length === 0) {
        push({
          type: 'text',
          value
        });
        continue;
      }

      if (prev.type === 'dot') {
        block.range = [];
        prev.value += value;
        prev.type = 'range';

        if (block.nodes.length !== 3 && block.nodes.length !== 5) {
          block.invalid = true;
          block.ranges = 0;
          prev.type = 'text';
          continue;
        }

        block.ranges++;
        block.args = [];
        continue;
      }

      if (prev.type === 'range') {
        siblings.pop();
        let before = siblings[siblings.length - 1];
        before.value += prev.value + value;
        prev = before;
        block.ranges--;
        continue;
      }

      push({
        type: 'dot',
        value
      });
      continue;
    }
    /**
     * Text
     */


    push({
      type: 'text',
      value
    });
  } // Mark imbalanced braces and brackets as invalid


  do {
    block = stack.pop();

    if (block.type !== 'root') {
      block.nodes.forEach(node => {
        if (!node.nodes) {
          if (node.type === 'open') node.isOpen = true;
          if (node.type === 'close') node.isClose = true;
          if (!node.nodes) node.type = 'text';
          node.invalid = true;
        }
      }); // get the location of the block on parent.nodes (block's siblings)

      let parent = stack[stack.length - 1];
      let index = parent.nodes.indexOf(block); // replace the (invalid) block with it's nodes

      parent.nodes.splice(index, 1, ...block.nodes);
    }
  } while (stack.length > 0);

  push({
    type: 'eos'
  });
  return ast;
};

var parse_1$1 = parse$2;

/**
 * Expand the given pattern or create a regex-compatible string.
 *
 * ```js
 * const braces = require('braces');
 * console.log(braces('{a,b,c}', { compile: true })); //=> ['(a|b|c)']
 * console.log(braces('{a,b,c}')); //=> ['a', 'b', 'c']
 * ```
 * @param {String} `str`
 * @param {Object} `options`
 * @return {String}
 * @api public
 */


const braces = (input, options = {}) => {
  let output = [];

  if (Array.isArray(input)) {
    for (let pattern of input) {
      let result = braces.create(pattern, options);

      if (Array.isArray(result)) {
        output.push(...result);
      } else {
        output.push(result);
      }
    }
  } else {
    output = [].concat(braces.create(input, options));
  }

  if (options && options.expand === true && options.nodupes === true) {
    output = [...new Set(output)];
  }

  return output;
};
/**
 * Parse the given `str` with the given `options`.
 *
 * ```js
 * // braces.parse(pattern, [, options]);
 * const ast = braces.parse('a/{b,c}/d');
 * console.log(ast);
 * ```
 * @param {String} pattern Brace pattern to parse
 * @param {Object} options
 * @return {Object} Returns an AST
 * @api public
 */


braces.parse = (input, options = {}) => parse_1$1(input, options);
/**
 * Creates a braces string from an AST, or an AST node.
 *
 * ```js
 * const braces = require('braces');
 * let ast = braces.parse('foo/{a,b}/bar');
 * console.log(stringify(ast.nodes[2])); //=> '{a,b}'
 * ```
 * @param {String} `input` Brace pattern or AST.
 * @param {Object} `options`
 * @return {Array} Returns an array of expanded values.
 * @api public
 */


braces.stringify = (input, options = {}) => {
  if (typeof input === 'string') {
    return stringify$1(braces.parse(input, options), options);
  }

  return stringify$1(input, options);
};
/**
 * Compiles a brace pattern into a regex-compatible, optimized string.
 * This method is called by the main [braces](#braces) function by default.
 *
 * ```js
 * const braces = require('braces');
 * console.log(braces.compile('a/{b,c}/d'));
 * //=> ['a/(b|c)/d']
 * ```
 * @param {String} `input` Brace pattern or AST.
 * @param {Object} `options`
 * @return {Array} Returns an array of expanded values.
 * @api public
 */


braces.compile = (input, options = {}) => {
  if (typeof input === 'string') {
    input = braces.parse(input, options);
  }

  return compile_1(input, options);
};
/**
 * Expands a brace pattern into an array. This method is called by the
 * main [braces](#braces) function when `options.expand` is true. Before
 * using this method it's recommended that you read the [performance notes](#performance))
 * and advantages of using [.compile](#compile) instead.
 *
 * ```js
 * const braces = require('braces');
 * console.log(braces.expand('a/{b,c}/d'));
 * //=> ['a/b/d', 'a/c/d'];
 * ```
 * @param {String} `pattern` Brace pattern
 * @param {Object} `options`
 * @return {Array} Returns an array of expanded values.
 * @api public
 */


braces.expand = (input, options = {}) => {
  if (typeof input === 'string') {
    input = braces.parse(input, options);
  }

  let result = expand_1(input, options); // filter out empty strings if specified

  if (options.noempty === true) {
    result = result.filter(Boolean);
  } // filter out duplicates if specified


  if (options.nodupes === true) {
    result = [...new Set(result)];
  }

  return result;
};
/**
 * Processes a brace pattern and returns either an expanded array
 * (if `options.expand` is true), a highly optimized regex-compatible string.
 * This method is called by the main [braces](#braces) function.
 *
 * ```js
 * const braces = require('braces');
 * console.log(braces.create('user-{200..300}/project-{a,b,c}-{1..10}'))
 * //=> 'user-(20[0-9]|2[1-9][0-9]|300)/project-(a|b|c)-([1-9]|10)'
 * ```
 * @param {String} `pattern` Brace pattern
 * @param {Object} `options`
 * @return {Array} Returns an array of expanded values.
 * @api public
 */


braces.create = (input, options = {}) => {
  if (input === '' || input.length < 3) {
    return [input];
  }

  return options.expand !== true ? braces.compile(input, options) : braces.expand(input, options);
};
/**
 * Expose "braces"
 */


var braces_1 = braces;

const WIN_SLASH = '\\\\/';
const WIN_NO_SLASH = `[^${WIN_SLASH}]`;
/**
 * Posix glob regex
 */

const DOT_LITERAL = '\\.';
const PLUS_LITERAL = '\\+';
const QMARK_LITERAL = '\\?';
const SLASH_LITERAL = '\\/';
const ONE_CHAR = '(?=.)';
const QMARK = '[^/]';
const END_ANCHOR = `(?:${SLASH_LITERAL}|$)`;
const START_ANCHOR = `(?:^|${SLASH_LITERAL})`;
const DOTS_SLASH = `${DOT_LITERAL}{1,2}${END_ANCHOR}`;
const NO_DOT = `(?!${DOT_LITERAL})`;
const NO_DOTS = `(?!${START_ANCHOR}${DOTS_SLASH})`;
const NO_DOT_SLASH = `(?!${DOT_LITERAL}{0,1}${END_ANCHOR})`;
const NO_DOTS_SLASH = `(?!${DOTS_SLASH})`;
const QMARK_NO_DOT = `[^.${SLASH_LITERAL}]`;
const STAR = `${QMARK}*?`;
const POSIX_CHARS = {
  DOT_LITERAL,
  PLUS_LITERAL,
  QMARK_LITERAL,
  SLASH_LITERAL,
  ONE_CHAR,
  QMARK,
  END_ANCHOR,
  DOTS_SLASH,
  NO_DOT,
  NO_DOTS,
  NO_DOT_SLASH,
  NO_DOTS_SLASH,
  QMARK_NO_DOT,
  STAR,
  START_ANCHOR
};
/**
 * Windows glob regex
 */

const WINDOWS_CHARS = Object.assign(Object.assign({}, POSIX_CHARS), {}, {
  SLASH_LITERAL: `[${WIN_SLASH}]`,
  QMARK: WIN_NO_SLASH,
  STAR: `${WIN_NO_SLASH}*?`,
  DOTS_SLASH: `${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$)`,
  NO_DOT: `(?!${DOT_LITERAL})`,
  NO_DOTS: `(?!(?:^|[${WIN_SLASH}])${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
  NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}(?:[${WIN_SLASH}]|$))`,
  NO_DOTS_SLASH: `(?!${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
  QMARK_NO_DOT: `[^.${WIN_SLASH}]`,
  START_ANCHOR: `(?:^|[${WIN_SLASH}])`,
  END_ANCHOR: `(?:[${WIN_SLASH}]|$)`
});
/**
 * POSIX Bracket Regex
 */

const POSIX_REGEX_SOURCE$1 = {
  alnum: 'a-zA-Z0-9',
  alpha: 'a-zA-Z',
  ascii: '\\x00-\\x7F',
  blank: ' \\t',
  cntrl: '\\x00-\\x1F\\x7F',
  digit: '0-9',
  graph: '\\x21-\\x7E',
  lower: 'a-z',
  print: '\\x20-\\x7E ',
  punct: '\\-!"#$%&\'()\\*+,./:;<=>?@[\\]^_`{|}~',
  space: ' \\t\\r\\n\\v\\f',
  upper: 'A-Z',
  word: 'A-Za-z0-9_',
  xdigit: 'A-Fa-f0-9'
};
var constants$1 = {
  MAX_LENGTH: 1024 * 64,
  POSIX_REGEX_SOURCE: POSIX_REGEX_SOURCE$1,
  // regular expressions
  REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g,
  REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/,
  REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/,
  REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g,
  REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g,
  REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g,
  // Replace globs with equivalent patterns to reduce parsing time.
  REPLACEMENTS: {
    '***': '*',
    '**/**': '**',
    '**/**/**': '**'
  },
  // Digits
  CHAR_0: 48,

  /* 0 */
  CHAR_9: 57,

  /* 9 */
  // Alphabet chars.
  CHAR_UPPERCASE_A: 65,

  /* A */
  CHAR_LOWERCASE_A: 97,

  /* a */
  CHAR_UPPERCASE_Z: 90,

  /* Z */
  CHAR_LOWERCASE_Z: 122,

  /* z */
  CHAR_LEFT_PARENTHESES: 40,

  /* ( */
  CHAR_RIGHT_PARENTHESES: 41,

  /* ) */
  CHAR_ASTERISK: 42,

  /* * */
  // Non-alphabetic chars.
  CHAR_AMPERSAND: 38,

  /* & */
  CHAR_AT: 64,

  /* @ */
  CHAR_BACKWARD_SLASH: 92,

  /* \ */
  CHAR_CARRIAGE_RETURN: 13,

  /* \r */
  CHAR_CIRCUMFLEX_ACCENT: 94,

  /* ^ */
  CHAR_COLON: 58,

  /* : */
  CHAR_COMMA: 44,

  /* , */
  CHAR_DOT: 46,

  /* . */
  CHAR_DOUBLE_QUOTE: 34,

  /* " */
  CHAR_EQUAL: 61,

  /* = */
  CHAR_EXCLAMATION_MARK: 33,

  /* ! */
  CHAR_FORM_FEED: 12,

  /* \f */
  CHAR_FORWARD_SLASH: 47,

  /* / */
  CHAR_GRAVE_ACCENT: 96,

  /* ` */
  CHAR_HASH: 35,

  /* # */
  CHAR_HYPHEN_MINUS: 45,

  /* - */
  CHAR_LEFT_ANGLE_BRACKET: 60,

  /* < */
  CHAR_LEFT_CURLY_BRACE: 123,

  /* { */
  CHAR_LEFT_SQUARE_BRACKET: 91,

  /* [ */
  CHAR_LINE_FEED: 10,

  /* \n */
  CHAR_NO_BREAK_SPACE: 160,

  /* \u00A0 */
  CHAR_PERCENT: 37,

  /* % */
  CHAR_PLUS: 43,

  /* + */
  CHAR_QUESTION_MARK: 63,

  /* ? */
  CHAR_RIGHT_ANGLE_BRACKET: 62,

  /* > */
  CHAR_RIGHT_CURLY_BRACE: 125,

  /* } */
  CHAR_RIGHT_SQUARE_BRACKET: 93,

  /* ] */
  CHAR_SEMICOLON: 59,

  /* ; */
  CHAR_SINGLE_QUOTE: 39,

  /* ' */
  CHAR_SPACE: 32,

  /*   */
  CHAR_TAB: 9,

  /* \t */
  CHAR_UNDERSCORE: 95,

  /* _ */
  CHAR_VERTICAL_LINE: 124,

  /* | */
  CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279,

  /* \uFEFF */
  SEP: path__default['default'].sep,

  /**
   * Create EXTGLOB_CHARS
   */
  extglobChars(chars) {
    return {
      '!': {
        type: 'negate',
        open: '(?:(?!(?:',
        close: `))${chars.STAR})`
      },
      '?': {
        type: 'qmark',
        open: '(?:',
        close: ')?'
      },
      '+': {
        type: 'plus',
        open: '(?:',
        close: ')+'
      },
      '*': {
        type: 'star',
        open: '(?:',
        close: ')*'
      },
      '@': {
        type: 'at',
        open: '(?:',
        close: ')'
      }
    };
  },

  /**
   * Create GLOB_CHARS
   */
  globChars(win32) {
    return win32 === true ? WINDOWS_CHARS : POSIX_CHARS;
  }

};

var utils$2 = createCommonjsModule(function (module, exports) {

  const win32 = process.platform === 'win32';
  const {
    REGEX_BACKSLASH,
    REGEX_REMOVE_BACKSLASH,
    REGEX_SPECIAL_CHARS,
    REGEX_SPECIAL_CHARS_GLOBAL
  } = constants$1;

  exports.isObject = val => val !== null && typeof val === 'object' && !Array.isArray(val);

  exports.hasRegexChars = str => REGEX_SPECIAL_CHARS.test(str);

  exports.isRegexChar = str => str.length === 1 && exports.hasRegexChars(str);

  exports.escapeRegex = str => str.replace(REGEX_SPECIAL_CHARS_GLOBAL, '\\$1');

  exports.toPosixSlashes = str => str.replace(REGEX_BACKSLASH, '/');

  exports.removeBackslashes = str => {
    return str.replace(REGEX_REMOVE_BACKSLASH, match => {
      return match === '\\' ? '' : match;
    });
  };

  exports.supportsLookbehinds = () => {
    const segs = process.version.slice(1).split('.').map(Number);

    if (segs.length === 3 && segs[0] >= 9 || segs[0] === 8 && segs[1] >= 10) {
      return true;
    }

    return false;
  };

  exports.isWindows = options => {
    if (options && typeof options.windows === 'boolean') {
      return options.windows;
    }

    return win32 === true || path__default['default'].sep === '\\';
  };

  exports.escapeLast = (input, char, lastIdx) => {
    const idx = input.lastIndexOf(char, lastIdx);
    if (idx === -1) return input;
    if (input[idx - 1] === '\\') return exports.escapeLast(input, char, idx - 1);
    return `${input.slice(0, idx)}\\${input.slice(idx)}`;
  };

  exports.removePrefix = (input, state = {}) => {
    let output = input;

    if (output.startsWith('./')) {
      output = output.slice(2);
      state.prefix = './';
    }

    return output;
  };

  exports.wrapOutput = (input, state = {}, options = {}) => {
    const prepend = options.contains ? '' : '^';
    const append = options.contains ? '' : '$';
    let output = `${prepend}(?:${input})${append}`;

    if (state.negated === true) {
      output = `(?:^(?!${output}).*$)`;
    }

    return output;
  };
});

const {
  CHAR_ASTERISK,

  /* * */
  CHAR_AT,

  /* @ */
  CHAR_BACKWARD_SLASH,

  /* \ */
  CHAR_COMMA,

  /* , */
  CHAR_DOT,

  /* . */
  CHAR_EXCLAMATION_MARK,

  /* ! */
  CHAR_FORWARD_SLASH,

  /* / */
  CHAR_LEFT_CURLY_BRACE,

  /* { */
  CHAR_LEFT_PARENTHESES,

  /* ( */
  CHAR_LEFT_SQUARE_BRACKET,

  /* [ */
  CHAR_PLUS,

  /* + */
  CHAR_QUESTION_MARK,

  /* ? */
  CHAR_RIGHT_CURLY_BRACE,

  /* } */
  CHAR_RIGHT_PARENTHESES,

  /* ) */
  CHAR_RIGHT_SQUARE_BRACKET
  /* ] */

} = constants$1;

const isPathSeparator = code => {
  return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
};

const depth = token => {
  if (token.isPrefix !== true) {
    token.depth = token.isGlobstar ? Infinity : 1;
  }
};
/**
 * Quickly scans a glob pattern and returns an object with a handful of
 * useful properties, like `isGlob`, `path` (the leading non-glob, if it exists),
 * `glob` (the actual pattern), `negated` (true if the path starts with `!` but not
 * with `!(`) and `negatedExtglob` (true if the path starts with `!(`).
 *
 * ```js
 * const pm = require('picomatch');
 * console.log(pm.scan('foo/bar/*.js'));
 * { isGlob: true, input: 'foo/bar/*.js', base: 'foo/bar', glob: '*.js' }
 * ```
 * @param {String} `str`
 * @param {Object} `options`
 * @return {Object} Returns an object with tokens and regex source string.
 * @api public
 */


const scan = (input, options) => {
  const opts = options || {};
  const length = input.length - 1;
  const scanToEnd = opts.parts === true || opts.scanToEnd === true;
  const slashes = [];
  const tokens = [];
  const parts = [];
  let str = input;
  let index = -1;
  let start = 0;
  let lastIndex = 0;
  let isBrace = false;
  let isBracket = false;
  let isGlob = false;
  let isExtglob = false;
  let isGlobstar = false;
  let braceEscaped = false;
  let backslashes = false;
  let negated = false;
  let negatedExtglob = false;
  let finished = false;
  let braces = 0;
  let prev;
  let code;
  let token = {
    value: '',
    depth: 0,
    isGlob: false
  };

  const eos = () => index >= length;

  const peek = () => str.charCodeAt(index + 1);

  const advance = () => {
    prev = code;
    return str.charCodeAt(++index);
  };

  while (index < length) {
    code = advance();
    let next;

    if (code === CHAR_BACKWARD_SLASH) {
      backslashes = token.backslashes = true;
      code = advance();

      if (code === CHAR_LEFT_CURLY_BRACE) {
        braceEscaped = true;
      }

      continue;
    }

    if (braceEscaped === true || code === CHAR_LEFT_CURLY_BRACE) {
      braces++;

      while (eos() !== true && (code = advance())) {
        if (code === CHAR_BACKWARD_SLASH) {
          backslashes = token.backslashes = true;
          advance();
          continue;
        }

        if (code === CHAR_LEFT_CURLY_BRACE) {
          braces++;
          continue;
        }

        if (braceEscaped !== true && code === CHAR_DOT && (code = advance()) === CHAR_DOT) {
          isBrace = token.isBrace = true;
          isGlob = token.isGlob = true;
          finished = true;

          if (scanToEnd === true) {
            continue;
          }

          break;
        }

        if (braceEscaped !== true && code === CHAR_COMMA) {
          isBrace = token.isBrace = true;
          isGlob = token.isGlob = true;
          finished = true;

          if (scanToEnd === true) {
            continue;
          }

          break;
        }

        if (code === CHAR_RIGHT_CURLY_BRACE) {
          braces--;

          if (braces === 0) {
            braceEscaped = false;
            isBrace = token.isBrace = true;
            finished = true;
            break;
          }
        }
      }

      if (scanToEnd === true) {
        continue;
      }

      break;
    }

    if (code === CHAR_FORWARD_SLASH) {
      slashes.push(index);
      tokens.push(token);
      token = {
        value: '',
        depth: 0,
        isGlob: false
      };
      if (finished === true) continue;

      if (prev === CHAR_DOT && index === start + 1) {
        start += 2;
        continue;
      }

      lastIndex = index + 1;
      continue;
    }

    if (opts.noext !== true) {
      const isExtglobChar = code === CHAR_PLUS || code === CHAR_AT || code === CHAR_ASTERISK || code === CHAR_QUESTION_MARK || code === CHAR_EXCLAMATION_MARK;

      if (isExtglobChar === true && peek() === CHAR_LEFT_PARENTHESES) {
        isGlob = token.isGlob = true;
        isExtglob = token.isExtglob = true;
        finished = true;

        if (code === CHAR_EXCLAMATION_MARK && index === start) {
          negatedExtglob = true;
        }

        if (scanToEnd === true) {
          while (eos() !== true && (code = advance())) {
            if (code === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              code = advance();
              continue;
            }

            if (code === CHAR_RIGHT_PARENTHESES) {
              isGlob = token.isGlob = true;
              finished = true;
              break;
            }
          }

          continue;
        }

        break;
      }
    }

    if (code === CHAR_ASTERISK) {
      if (prev === CHAR_ASTERISK) isGlobstar = token.isGlobstar = true;
      isGlob = token.isGlob = true;
      finished = true;

      if (scanToEnd === true) {
        continue;
      }

      break;
    }

    if (code === CHAR_QUESTION_MARK) {
      isGlob = token.isGlob = true;
      finished = true;

      if (scanToEnd === true) {
        continue;
      }

      break;
    }

    if (code === CHAR_LEFT_SQUARE_BRACKET) {
      while (eos() !== true && (next = advance())) {
        if (next === CHAR_BACKWARD_SLASH) {
          backslashes = token.backslashes = true;
          advance();
          continue;
        }

        if (next === CHAR_RIGHT_SQUARE_BRACKET) {
          isBracket = token.isBracket = true;
          isGlob = token.isGlob = true;
          finished = true;
          break;
        }
      }

      if (scanToEnd === true) {
        continue;
      }

      break;
    }

    if (opts.nonegate !== true && code === CHAR_EXCLAMATION_MARK && index === start) {
      negated = token.negated = true;
      start++;
      continue;
    }

    if (opts.noparen !== true && code === CHAR_LEFT_PARENTHESES) {
      isGlob = token.isGlob = true;

      if (scanToEnd === true) {
        while (eos() !== true && (code = advance())) {
          if (code === CHAR_LEFT_PARENTHESES) {
            backslashes = token.backslashes = true;
            code = advance();
            continue;
          }

          if (code === CHAR_RIGHT_PARENTHESES) {
            finished = true;
            break;
          }
        }

        continue;
      }

      break;
    }

    if (isGlob === true) {
      finished = true;

      if (scanToEnd === true) {
        continue;
      }

      break;
    }
  }

  if (opts.noext === true) {
    isExtglob = false;
    isGlob = false;
  }

  let base = str;
  let prefix = '';
  let glob = '';

  if (start > 0) {
    prefix = str.slice(0, start);
    str = str.slice(start);
    lastIndex -= start;
  }

  if (base && isGlob === true && lastIndex > 0) {
    base = str.slice(0, lastIndex);
    glob = str.slice(lastIndex);
  } else if (isGlob === true) {
    base = '';
    glob = str;
  } else {
    base = str;
  }

  if (base && base !== '' && base !== '/' && base !== str) {
    if (isPathSeparator(base.charCodeAt(base.length - 1))) {
      base = base.slice(0, -1);
    }
  }

  if (opts.unescape === true) {
    if (glob) glob = utils$2.removeBackslashes(glob);

    if (base && backslashes === true) {
      base = utils$2.removeBackslashes(base);
    }
  }

  const state = {
    prefix,
    input,
    start,
    base,
    glob,
    isBrace,
    isBracket,
    isGlob,
    isExtglob,
    isGlobstar,
    negated,
    negatedExtglob
  };

  if (opts.tokens === true) {
    state.maxDepth = 0;

    if (!isPathSeparator(code)) {
      tokens.push(token);
    }

    state.tokens = tokens;
  }

  if (opts.parts === true || opts.tokens === true) {
    let prevIndex;

    for (let idx = 0; idx < slashes.length; idx++) {
      const n = prevIndex ? prevIndex + 1 : start;
      const i = slashes[idx];
      const value = input.slice(n, i);

      if (opts.tokens) {
        if (idx === 0 && start !== 0) {
          tokens[idx].isPrefix = true;
          tokens[idx].value = prefix;
        } else {
          tokens[idx].value = value;
        }

        depth(tokens[idx]);
        state.maxDepth += tokens[idx].depth;
      }

      if (idx !== 0 || value !== '') {
        parts.push(value);
      }

      prevIndex = i;
    }

    if (prevIndex && prevIndex + 1 < input.length) {
      const value = input.slice(prevIndex + 1);
      parts.push(value);

      if (opts.tokens) {
        tokens[tokens.length - 1].value = value;
        depth(tokens[tokens.length - 1]);
        state.maxDepth += tokens[tokens.length - 1].depth;
      }
    }

    state.slashes = slashes;
    state.parts = parts;
  }

  return state;
};

var scan_1 = scan;

/**
 * Constants
 */


const {
  MAX_LENGTH,
  POSIX_REGEX_SOURCE,
  REGEX_NON_SPECIAL_CHARS,
  REGEX_SPECIAL_CHARS_BACKREF,
  REPLACEMENTS
} = constants$1;
/**
 * Helpers
 */

const expandRange = (args, options) => {
  if (typeof options.expandRange === 'function') {
    return options.expandRange(...args, options);
  }

  args.sort();
  const value = `[${args.join('-')}]`;

  try {
    /* eslint-disable-next-line no-new */
    new RegExp(value);
  } catch (ex) {
    return args.map(v => utils$2.escapeRegex(v)).join('..');
  }

  return value;
};
/**
 * Create the message for a syntax error
 */


const syntaxError = (type, char) => {
  return `Missing ${type}: "${char}" - use "\\\\${char}" to match literal characters`;
};
/**
 * Parse the given input string.
 * @param {String} input
 * @param {Object} options
 * @return {Object}
 */


const parse$1 = (input, options) => {
  if (typeof input !== 'string') {
    throw new TypeError('Expected a string');
  }

  input = REPLACEMENTS[input] || input;
  const opts = Object.assign({}, options);
  const max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
  let len = input.length;

  if (len > max) {
    throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
  }

  const bos = {
    type: 'bos',
    value: '',
    output: opts.prepend || ''
  };
  const tokens = [bos];
  const capture = opts.capture ? '' : '?:';
  const win32 = utils$2.isWindows(options); // create constants based on platform, for windows or posix

  const PLATFORM_CHARS = constants$1.globChars(win32);
  const EXTGLOB_CHARS = constants$1.extglobChars(PLATFORM_CHARS);
  const {
    DOT_LITERAL,
    PLUS_LITERAL,
    SLASH_LITERAL,
    ONE_CHAR,
    DOTS_SLASH,
    NO_DOT,
    NO_DOT_SLASH,
    NO_DOTS_SLASH,
    QMARK,
    QMARK_NO_DOT,
    STAR,
    START_ANCHOR
  } = PLATFORM_CHARS;

  const globstar = opts => {
    return `(${capture}(?:(?!${START_ANCHOR}${opts.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
  };

  const nodot = opts.dot ? '' : NO_DOT;
  const qmarkNoDot = opts.dot ? QMARK : QMARK_NO_DOT;
  let star = opts.bash === true ? globstar(opts) : STAR;

  if (opts.capture) {
    star = `(${star})`;
  } // minimatch options support


  if (typeof opts.noext === 'boolean') {
    opts.noextglob = opts.noext;
  }

  const state = {
    input,
    index: -1,
    start: 0,
    dot: opts.dot === true,
    consumed: '',
    output: '',
    prefix: '',
    backtrack: false,
    negated: false,
    brackets: 0,
    braces: 0,
    parens: 0,
    quotes: 0,
    globstar: false,
    tokens
  };
  input = utils$2.removePrefix(input, state);
  len = input.length;
  const extglobs = [];
  const braces = [];
  const stack = [];
  let prev = bos;
  let value;
  /**
   * Tokenizing helpers
   */

  const eos = () => state.index === len - 1;

  const peek = state.peek = (n = 1) => input[state.index + n];

  const advance = state.advance = () => input[++state.index] || '';

  const remaining = () => input.slice(state.index + 1);

  const consume = (value = '', num = 0) => {
    state.consumed += value;
    state.index += num;
  };

  const append = token => {
    state.output += token.output != null ? token.output : token.value;
    consume(token.value);
  };

  const negate = () => {
    let count = 1;

    while (peek() === '!' && (peek(2) !== '(' || peek(3) === '?')) {
      advance();
      state.start++;
      count++;
    }

    if (count % 2 === 0) {
      return false;
    }

    state.negated = true;
    state.start++;
    return true;
  };

  const increment = type => {
    state[type]++;
    stack.push(type);
  };

  const decrement = type => {
    state[type]--;
    stack.pop();
  };
  /**
   * Push tokens onto the tokens array. This helper speeds up
   * tokenizing by 1) helping us avoid backtracking as much as possible,
   * and 2) helping us avoid creating extra tokens when consecutive
   * characters are plain text. This improves performance and simplifies
   * lookbehinds.
   */


  const push = tok => {
    if (prev.type === 'globstar') {
      const isBrace = state.braces > 0 && (tok.type === 'comma' || tok.type === 'brace');
      const isExtglob = tok.extglob === true || extglobs.length && (tok.type === 'pipe' || tok.type === 'paren');

      if (tok.type !== 'slash' && tok.type !== 'paren' && !isBrace && !isExtglob) {
        state.output = state.output.slice(0, -prev.output.length);
        prev.type = 'star';
        prev.value = '*';
        prev.output = star;
        state.output += prev.output;
      }
    }

    if (extglobs.length && tok.type !== 'paren') {
      extglobs[extglobs.length - 1].inner += tok.value;
    }

    if (tok.value || tok.output) append(tok);

    if (prev && prev.type === 'text' && tok.type === 'text') {
      prev.value += tok.value;
      prev.output = (prev.output || '') + tok.value;
      return;
    }

    tok.prev = prev;
    tokens.push(tok);
    prev = tok;
  };

  const extglobOpen = (type, value) => {
    const token = Object.assign(Object.assign({}, EXTGLOB_CHARS[value]), {}, {
      conditions: 1,
      inner: ''
    });
    token.prev = prev;
    token.parens = state.parens;
    token.output = state.output;
    const output = (opts.capture ? '(' : '') + token.open;
    increment('parens');
    push({
      type,
      value,
      output: state.output ? '' : ONE_CHAR
    });
    push({
      type: 'paren',
      extglob: true,
      value: advance(),
      output
    });
    extglobs.push(token);
  };

  const extglobClose = token => {
    let output = token.close + (opts.capture ? ')' : '');
    let rest;

    if (token.type === 'negate') {
      let extglobStar = star;

      if (token.inner && token.inner.length > 1 && token.inner.includes('/')) {
        extglobStar = globstar(opts);
      }

      if (extglobStar !== star || eos() || /^\)+$/.test(remaining())) {
        output = token.close = `)$))${extglobStar}`;
      }

      if (token.inner.includes('*') && (rest = remaining()) && /^\.[^\\/.]+$/.test(rest)) {
        output = token.close = `)${rest})${extglobStar})`;
      }

      if (token.prev.type === 'bos') {
        state.negatedExtglob = true;
      }
    }

    push({
      type: 'paren',
      extglob: true,
      value,
      output
    });
    decrement('parens');
  };
  /**
   * Fast paths
   */


  if (opts.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(input)) {
    let backslashes = false;
    let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m, esc, chars, first, rest, index) => {
      if (first === '\\') {
        backslashes = true;
        return m;
      }

      if (first === '?') {
        if (esc) {
          return esc + first + (rest ? QMARK.repeat(rest.length) : '');
        }

        if (index === 0) {
          return qmarkNoDot + (rest ? QMARK.repeat(rest.length) : '');
        }

        return QMARK.repeat(chars.length);
      }

      if (first === '.') {
        return DOT_LITERAL.repeat(chars.length);
      }

      if (first === '*') {
        if (esc) {
          return esc + first + (rest ? star : '');
        }

        return star;
      }

      return esc ? m : `\\${m}`;
    });

    if (backslashes === true) {
      if (opts.unescape === true) {
        output = output.replace(/\\/g, '');
      } else {
        output = output.replace(/\\+/g, m => {
          return m.length % 2 === 0 ? '\\\\' : m ? '\\' : '';
        });
      }
    }

    if (output === input && opts.contains === true) {
      state.output = input;
      return state;
    }

    state.output = utils$2.wrapOutput(output, state, options);
    return state;
  }
  /**
   * Tokenize input until we reach end-of-string
   */


  while (!eos()) {
    value = advance();

    if (value === '\u0000') {
      continue;
    }
    /**
     * Escaped characters
     */


    if (value === '\\') {
      const next = peek();

      if (next === '/' && opts.bash !== true) {
        continue;
      }

      if (next === '.' || next === ';') {
        continue;
      }

      if (!next) {
        value += '\\';
        push({
          type: 'text',
          value
        });
        continue;
      } // collapse slashes to reduce potential for exploits


      const match = /^\\+/.exec(remaining());
      let slashes = 0;

      if (match && match[0].length > 2) {
        slashes = match[0].length;
        state.index += slashes;

        if (slashes % 2 !== 0) {
          value += '\\';
        }
      }

      if (opts.unescape === true) {
        value = advance();
      } else {
        value += advance();
      }

      if (state.brackets === 0) {
        push({
          type: 'text',
          value
        });
        continue;
      }
    }
    /**
     * If we're inside a regex character class, continue
     * until we reach the closing bracket.
     */


    if (state.brackets > 0 && (value !== ']' || prev.value === '[' || prev.value === '[^')) {
      if (opts.posix !== false && value === ':') {
        const inner = prev.value.slice(1);

        if (inner.includes('[')) {
          prev.posix = true;

          if (inner.includes(':')) {
            const idx = prev.value.lastIndexOf('[');
            const pre = prev.value.slice(0, idx);
            const rest = prev.value.slice(idx + 2);
            const posix = POSIX_REGEX_SOURCE[rest];

            if (posix) {
              prev.value = pre + posix;
              state.backtrack = true;
              advance();

              if (!bos.output && tokens.indexOf(prev) === 1) {
                bos.output = ONE_CHAR;
              }

              continue;
            }
          }
        }
      }

      if (value === '[' && peek() !== ':' || value === '-' && peek() === ']') {
        value = `\\${value}`;
      }

      if (value === ']' && (prev.value === '[' || prev.value === '[^')) {
        value = `\\${value}`;
      }

      if (opts.posix === true && value === '!' && prev.value === '[') {
        value = '^';
      }

      prev.value += value;
      append({
        value
      });
      continue;
    }
    /**
     * If we're inside a quoted string, continue
     * until we reach the closing double quote.
     */


    if (state.quotes === 1 && value !== '"') {
      value = utils$2.escapeRegex(value);
      prev.value += value;
      append({
        value
      });
      continue;
    }
    /**
     * Double quotes
     */


    if (value === '"') {
      state.quotes = state.quotes === 1 ? 0 : 1;

      if (opts.keepQuotes === true) {
        push({
          type: 'text',
          value
        });
      }

      continue;
    }
    /**
     * Parentheses
     */


    if (value === '(') {
      increment('parens');
      push({
        type: 'paren',
        value
      });
      continue;
    }

    if (value === ')') {
      if (state.parens === 0 && opts.strictBrackets === true) {
        throw new SyntaxError(syntaxError('opening', '('));
      }

      const extglob = extglobs[extglobs.length - 1];

      if (extglob && state.parens === extglob.parens + 1) {
        extglobClose(extglobs.pop());
        continue;
      }

      push({
        type: 'paren',
        value,
        output: state.parens ? ')' : '\\)'
      });
      decrement('parens');
      continue;
    }
    /**
     * Square brackets
     */


    if (value === '[') {
      if (opts.nobracket === true || !remaining().includes(']')) {
        if (opts.nobracket !== true && opts.strictBrackets === true) {
          throw new SyntaxError(syntaxError('closing', ']'));
        }

        value = `\\${value}`;
      } else {
        increment('brackets');
      }

      push({
        type: 'bracket',
        value
      });
      continue;
    }

    if (value === ']') {
      if (opts.nobracket === true || prev && prev.type === 'bracket' && prev.value.length === 1) {
        push({
          type: 'text',
          value,
          output: `\\${value}`
        });
        continue;
      }

      if (state.brackets === 0) {
        if (opts.strictBrackets === true) {
          throw new SyntaxError(syntaxError('opening', '['));
        }

        push({
          type: 'text',
          value,
          output: `\\${value}`
        });
        continue;
      }

      decrement('brackets');
      const prevValue = prev.value.slice(1);

      if (prev.posix !== true && prevValue[0] === '^' && !prevValue.includes('/')) {
        value = `/${value}`;
      }

      prev.value += value;
      append({
        value
      }); // when literal brackets are explicitly disabled
      // assume we should match with a regex character class

      if (opts.literalBrackets === false || utils$2.hasRegexChars(prevValue)) {
        continue;
      }

      const escaped = utils$2.escapeRegex(prev.value);
      state.output = state.output.slice(0, -prev.value.length); // when literal brackets are explicitly enabled
      // assume we should escape the brackets to match literal characters

      if (opts.literalBrackets === true) {
        state.output += escaped;
        prev.value = escaped;
        continue;
      } // when the user specifies nothing, try to match both


      prev.value = `(${capture}${escaped}|${prev.value})`;
      state.output += prev.value;
      continue;
    }
    /**
     * Braces
     */


    if (value === '{' && opts.nobrace !== true) {
      increment('braces');
      const open = {
        type: 'brace',
        value,
        output: '(',
        outputIndex: state.output.length,
        tokensIndex: state.tokens.length
      };
      braces.push(open);
      push(open);
      continue;
    }

    if (value === '}') {
      const brace = braces[braces.length - 1];

      if (opts.nobrace === true || !brace) {
        push({
          type: 'text',
          value,
          output: value
        });
        continue;
      }

      let output = ')';

      if (brace.dots === true) {
        const arr = tokens.slice();
        const range = [];

        for (let i = arr.length - 1; i >= 0; i--) {
          tokens.pop();

          if (arr[i].type === 'brace') {
            break;
          }

          if (arr[i].type !== 'dots') {
            range.unshift(arr[i].value);
          }
        }

        output = expandRange(range, opts);
        state.backtrack = true;
      }

      if (brace.comma !== true && brace.dots !== true) {
        const out = state.output.slice(0, brace.outputIndex);
        const toks = state.tokens.slice(brace.tokensIndex);
        brace.value = brace.output = '\\{';
        value = output = '\\}';
        state.output = out;

        for (const t of toks) {
          state.output += t.output || t.value;
        }
      }

      push({
        type: 'brace',
        value,
        output
      });
      decrement('braces');
      braces.pop();
      continue;
    }
    /**
     * Pipes
     */


    if (value === '|') {
      if (extglobs.length > 0) {
        extglobs[extglobs.length - 1].conditions++;
      }

      push({
        type: 'text',
        value
      });
      continue;
    }
    /**
     * Commas
     */


    if (value === ',') {
      let output = value;
      const brace = braces[braces.length - 1];

      if (brace && stack[stack.length - 1] === 'braces') {
        brace.comma = true;
        output = '|';
      }

      push({
        type: 'comma',
        value,
        output
      });
      continue;
    }
    /**
     * Slashes
     */


    if (value === '/') {
      // if the beginning of the glob is "./", advance the start
      // to the current index, and don't add the "./" characters
      // to the state. This greatly simplifies lookbehinds when
      // checking for BOS characters like "!" and "." (not "./")
      if (prev.type === 'dot' && state.index === state.start + 1) {
        state.start = state.index + 1;
        state.consumed = '';
        state.output = '';
        tokens.pop();
        prev = bos; // reset "prev" to the first token

        continue;
      }

      push({
        type: 'slash',
        value,
        output: SLASH_LITERAL
      });
      continue;
    }
    /**
     * Dots
     */


    if (value === '.') {
      if (state.braces > 0 && prev.type === 'dot') {
        if (prev.value === '.') prev.output = DOT_LITERAL;
        const brace = braces[braces.length - 1];
        prev.type = 'dots';
        prev.output += value;
        prev.value += value;
        brace.dots = true;
        continue;
      }

      if (state.braces + state.parens === 0 && prev.type !== 'bos' && prev.type !== 'slash') {
        push({
          type: 'text',
          value,
          output: DOT_LITERAL
        });
        continue;
      }

      push({
        type: 'dot',
        value,
        output: DOT_LITERAL
      });
      continue;
    }
    /**
     * Question marks
     */


    if (value === '?') {
      const isGroup = prev && prev.value === '(';

      if (!isGroup && opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        extglobOpen('qmark', value);
        continue;
      }

      if (prev && prev.type === 'paren') {
        const next = peek();
        let output = value;

        if (next === '<' && !utils$2.supportsLookbehinds()) {
          throw new Error('Node.js v10 or higher is required for regex lookbehinds');
        }

        if (prev.value === '(' && !/[!=<:]/.test(next) || next === '<' && !/<([!=]|\w+>)/.test(remaining())) {
          output = `\\${value}`;
        }

        push({
          type: 'text',
          value,
          output
        });
        continue;
      }

      if (opts.dot !== true && (prev.type === 'slash' || prev.type === 'bos')) {
        push({
          type: 'qmark',
          value,
          output: QMARK_NO_DOT
        });
        continue;
      }

      push({
        type: 'qmark',
        value,
        output: QMARK
      });
      continue;
    }
    /**
     * Exclamation
     */


    if (value === '!') {
      if (opts.noextglob !== true && peek() === '(') {
        if (peek(2) !== '?' || !/[!=<:]/.test(peek(3))) {
          extglobOpen('negate', value);
          continue;
        }
      }

      if (opts.nonegate !== true && state.index === 0) {
        negate();
        continue;
      }
    }
    /**
     * Plus
     */


    if (value === '+') {
      if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        extglobOpen('plus', value);
        continue;
      }

      if (prev && prev.value === '(' || opts.regex === false) {
        push({
          type: 'plus',
          value,
          output: PLUS_LITERAL
        });
        continue;
      }

      if (prev && (prev.type === 'bracket' || prev.type === 'paren' || prev.type === 'brace') || state.parens > 0) {
        push({
          type: 'plus',
          value
        });
        continue;
      }

      push({
        type: 'plus',
        value: PLUS_LITERAL
      });
      continue;
    }
    /**
     * Plain text
     */


    if (value === '@') {
      if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        push({
          type: 'at',
          extglob: true,
          value,
          output: ''
        });
        continue;
      }

      push({
        type: 'text',
        value
      });
      continue;
    }
    /**
     * Plain text
     */


    if (value !== '*') {
      if (value === '$' || value === '^') {
        value = `\\${value}`;
      }

      const match = REGEX_NON_SPECIAL_CHARS.exec(remaining());

      if (match) {
        value += match[0];
        state.index += match[0].length;
      }

      push({
        type: 'text',
        value
      });
      continue;
    }
    /**
     * Stars
     */


    if (prev && (prev.type === 'globstar' || prev.star === true)) {
      prev.type = 'star';
      prev.star = true;
      prev.value += value;
      prev.output = star;
      state.backtrack = true;
      state.globstar = true;
      consume(value);
      continue;
    }

    let rest = remaining();

    if (opts.noextglob !== true && /^\([^?]/.test(rest)) {
      extglobOpen('star', value);
      continue;
    }

    if (prev.type === 'star') {
      if (opts.noglobstar === true) {
        consume(value);
        continue;
      }

      const prior = prev.prev;
      const before = prior.prev;
      const isStart = prior.type === 'slash' || prior.type === 'bos';
      const afterStar = before && (before.type === 'star' || before.type === 'globstar');

      if (opts.bash === true && (!isStart || rest[0] && rest[0] !== '/')) {
        push({
          type: 'star',
          value,
          output: ''
        });
        continue;
      }

      const isBrace = state.braces > 0 && (prior.type === 'comma' || prior.type === 'brace');
      const isExtglob = extglobs.length && (prior.type === 'pipe' || prior.type === 'paren');

      if (!isStart && prior.type !== 'paren' && !isBrace && !isExtglob) {
        push({
          type: 'star',
          value,
          output: ''
        });
        continue;
      } // strip consecutive `/**/`


      while (rest.slice(0, 3) === '/**') {
        const after = input[state.index + 4];

        if (after && after !== '/') {
          break;
        }

        rest = rest.slice(3);
        consume('/**', 3);
      }

      if (prior.type === 'bos' && eos()) {
        prev.type = 'globstar';
        prev.value += value;
        prev.output = globstar(opts);
        state.output = prev.output;
        state.globstar = true;
        consume(value);
        continue;
      }

      if (prior.type === 'slash' && prior.prev.type !== 'bos' && !afterStar && eos()) {
        state.output = state.output.slice(0, -(prior.output + prev.output).length);
        prior.output = `(?:${prior.output}`;
        prev.type = 'globstar';
        prev.output = globstar(opts) + (opts.strictSlashes ? ')' : '|$)');
        prev.value += value;
        state.globstar = true;
        state.output += prior.output + prev.output;
        consume(value);
        continue;
      }

      if (prior.type === 'slash' && prior.prev.type !== 'bos' && rest[0] === '/') {
        const end = rest[1] !== void 0 ? '|$' : '';
        state.output = state.output.slice(0, -(prior.output + prev.output).length);
        prior.output = `(?:${prior.output}`;
        prev.type = 'globstar';
        prev.output = `${globstar(opts)}${SLASH_LITERAL}|${SLASH_LITERAL}${end})`;
        prev.value += value;
        state.output += prior.output + prev.output;
        state.globstar = true;
        consume(value + advance());
        push({
          type: 'slash',
          value: '/',
          output: ''
        });
        continue;
      }

      if (prior.type === 'bos' && rest[0] === '/') {
        prev.type = 'globstar';
        prev.value += value;
        prev.output = `(?:^|${SLASH_LITERAL}|${globstar(opts)}${SLASH_LITERAL})`;
        state.output = prev.output;
        state.globstar = true;
        consume(value + advance());
        push({
          type: 'slash',
          value: '/',
          output: ''
        });
        continue;
      } // remove single star from output


      state.output = state.output.slice(0, -prev.output.length); // reset previous token to globstar

      prev.type = 'globstar';
      prev.output = globstar(opts);
      prev.value += value; // reset output with globstar

      state.output += prev.output;
      state.globstar = true;
      consume(value);
      continue;
    }

    const token = {
      type: 'star',
      value,
      output: star
    };

    if (opts.bash === true) {
      token.output = '.*?';

      if (prev.type === 'bos' || prev.type === 'slash') {
        token.output = nodot + token.output;
      }

      push(token);
      continue;
    }

    if (prev && (prev.type === 'bracket' || prev.type === 'paren') && opts.regex === true) {
      token.output = value;
      push(token);
      continue;
    }

    if (state.index === state.start || prev.type === 'slash' || prev.type === 'dot') {
      if (prev.type === 'dot') {
        state.output += NO_DOT_SLASH;
        prev.output += NO_DOT_SLASH;
      } else if (opts.dot === true) {
        state.output += NO_DOTS_SLASH;
        prev.output += NO_DOTS_SLASH;
      } else {
        state.output += nodot;
        prev.output += nodot;
      }

      if (peek() !== '*') {
        state.output += ONE_CHAR;
        prev.output += ONE_CHAR;
      }
    }

    push(token);
  }

  while (state.brackets > 0) {
    if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', ']'));
    state.output = utils$2.escapeLast(state.output, '[');
    decrement('brackets');
  }

  while (state.parens > 0) {
    if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', ')'));
    state.output = utils$2.escapeLast(state.output, '(');
    decrement('parens');
  }

  while (state.braces > 0) {
    if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', '}'));
    state.output = utils$2.escapeLast(state.output, '{');
    decrement('braces');
  }

  if (opts.strictSlashes !== true && (prev.type === 'star' || prev.type === 'bracket')) {
    push({
      type: 'maybe_slash',
      value: '',
      output: `${SLASH_LITERAL}?`
    });
  } // rebuild the output if we had to backtrack at any point


  if (state.backtrack === true) {
    state.output = '';

    for (const token of state.tokens) {
      state.output += token.output != null ? token.output : token.value;

      if (token.suffix) {
        state.output += token.suffix;
      }
    }
  }

  return state;
};
/**
 * Fast paths for creating regular expressions for common glob patterns.
 * This can significantly speed up processing and has very little downside
 * impact when none of the fast paths match.
 */


parse$1.fastpaths = (input, options) => {
  const opts = Object.assign({}, options);
  const max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
  const len = input.length;

  if (len > max) {
    throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
  }

  input = REPLACEMENTS[input] || input;
  const win32 = utils$2.isWindows(options); // create constants based on platform, for windows or posix

  const {
    DOT_LITERAL,
    SLASH_LITERAL,
    ONE_CHAR,
    DOTS_SLASH,
    NO_DOT,
    NO_DOTS,
    NO_DOTS_SLASH,
    STAR,
    START_ANCHOR
  } = constants$1.globChars(win32);
  const nodot = opts.dot ? NO_DOTS : NO_DOT;
  const slashDot = opts.dot ? NO_DOTS_SLASH : NO_DOT;
  const capture = opts.capture ? '' : '?:';
  const state = {
    negated: false,
    prefix: ''
  };
  let star = opts.bash === true ? '.*?' : STAR;

  if (opts.capture) {
    star = `(${star})`;
  }

  const globstar = opts => {
    if (opts.noglobstar === true) return star;
    return `(${capture}(?:(?!${START_ANCHOR}${opts.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
  };

  const create = str => {
    switch (str) {
      case '*':
        return `${nodot}${ONE_CHAR}${star}`;

      case '.*':
        return `${DOT_LITERAL}${ONE_CHAR}${star}`;

      case '*.*':
        return `${nodot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;

      case '*/*':
        return `${nodot}${star}${SLASH_LITERAL}${ONE_CHAR}${slashDot}${star}`;

      case '**':
        return nodot + globstar(opts);

      case '**/*':
        return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${ONE_CHAR}${star}`;

      case '**/*.*':
        return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;

      case '**/.*':
        return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${DOT_LITERAL}${ONE_CHAR}${star}`;

      default:
        {
          const match = /^(.*?)\.(\w+)$/.exec(str);
          if (!match) return;
          const source = create(match[1]);
          if (!source) return;
          return source + DOT_LITERAL + match[2];
        }
    }
  };

  const output = utils$2.removePrefix(input, state);
  let source = create(output);

  if (source && opts.strictSlashes !== true) {
    source += `${SLASH_LITERAL}?`;
  }

  return source;
};

var parse_1 = parse$1;

const isObject$1 = val => val && typeof val === 'object' && !Array.isArray(val);
/**
 * Creates a matcher function from one or more glob patterns. The
 * returned function takes a string to match as its first argument,
 * and returns true if the string is a match. The returned matcher
 * function also takes a boolean as the second argument that, when true,
 * returns an object with additional information.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch(glob[, options]);
 *
 * const isMatch = picomatch('*.!(*a)');
 * console.log(isMatch('a.a')); //=> false
 * console.log(isMatch('a.b')); //=> true
 * ```
 * @name picomatch
 * @param {String|Array} `globs` One or more glob patterns.
 * @param {Object=} `options`
 * @return {Function=} Returns a matcher function.
 * @api public
 */


const picomatch$1 = (glob, options, returnState = false) => {
  if (Array.isArray(glob)) {
    const fns = glob.map(input => picomatch$1(input, options, returnState));

    const arrayMatcher = str => {
      for (const isMatch of fns) {
        const state = isMatch(str);
        if (state) return state;
      }

      return false;
    };

    return arrayMatcher;
  }

  const isState = isObject$1(glob) && glob.tokens && glob.input;

  if (glob === '' || typeof glob !== 'string' && !isState) {
    throw new TypeError('Expected pattern to be a non-empty string');
  }

  const opts = options || {};
  const posix = utils$2.isWindows(options);
  const regex = isState ? picomatch$1.compileRe(glob, options) : picomatch$1.makeRe(glob, options, false, true);
  const state = regex.state;
  delete regex.state;

  let isIgnored = () => false;

  if (opts.ignore) {
    const ignoreOpts = Object.assign(Object.assign({}, options), {}, {
      ignore: null,
      onMatch: null,
      onResult: null
    });
    isIgnored = picomatch$1(opts.ignore, ignoreOpts, returnState);
  }

  const matcher = (input, returnObject = false) => {
    const {
      isMatch,
      match,
      output
    } = picomatch$1.test(input, regex, options, {
      glob,
      posix
    });
    const result = {
      glob,
      state,
      regex,
      posix,
      input,
      output,
      match,
      isMatch
    };

    if (typeof opts.onResult === 'function') {
      opts.onResult(result);
    }

    if (isMatch === false) {
      result.isMatch = false;
      return returnObject ? result : false;
    }

    if (isIgnored(input)) {
      if (typeof opts.onIgnore === 'function') {
        opts.onIgnore(result);
      }

      result.isMatch = false;
      return returnObject ? result : false;
    }

    if (typeof opts.onMatch === 'function') {
      opts.onMatch(result);
    }

    return returnObject ? result : true;
  };

  if (returnState) {
    matcher.state = state;
  }

  return matcher;
};
/**
 * Test `input` with the given `regex`. This is used by the main
 * `picomatch()` function to test the input string.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.test(input, regex[, options]);
 *
 * console.log(picomatch.test('foo/bar', /^(?:([^/]*?)\/([^/]*?))$/));
 * // { isMatch: true, match: [ 'foo/', 'foo', 'bar' ], output: 'foo/bar' }
 * ```
 * @param {String} `input` String to test.
 * @param {RegExp} `regex`
 * @return {Object} Returns an object with matching info.
 * @api public
 */


picomatch$1.test = (input, regex, options, {
  glob,
  posix
} = {}) => {
  if (typeof input !== 'string') {
    throw new TypeError('Expected input to be a string');
  }

  if (input === '') {
    return {
      isMatch: false,
      output: ''
    };
  }

  const opts = options || {};
  const format = opts.format || (posix ? utils$2.toPosixSlashes : null);
  let match = input === glob;
  let output = match && format ? format(input) : input;

  if (match === false) {
    output = format ? format(input) : input;
    match = output === glob;
  }

  if (match === false || opts.capture === true) {
    if (opts.matchBase === true || opts.basename === true) {
      match = picomatch$1.matchBase(input, regex, options, posix);
    } else {
      match = regex.exec(output);
    }
  }

  return {
    isMatch: Boolean(match),
    match,
    output
  };
};
/**
 * Match the basename of a filepath.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.matchBase(input, glob[, options]);
 * console.log(picomatch.matchBase('foo/bar.js', '*.js'); // true
 * ```
 * @param {String} `input` String to test.
 * @param {RegExp|String} `glob` Glob pattern or regex created by [.makeRe](#makeRe).
 * @return {Boolean}
 * @api public
 */


picomatch$1.matchBase = (input, glob, options, posix = utils$2.isWindows(options)) => {
  const regex = glob instanceof RegExp ? glob : picomatch$1.makeRe(glob, options);
  return regex.test(path__default['default'].basename(input));
};
/**
 * Returns true if **any** of the given glob `patterns` match the specified `string`.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.isMatch(string, patterns[, options]);
 *
 * console.log(picomatch.isMatch('a.a', ['b.*', '*.a'])); //=> true
 * console.log(picomatch.isMatch('a.a', 'b.*')); //=> false
 * ```
 * @param {String|Array} str The string to test.
 * @param {String|Array} patterns One or more glob patterns to use for matching.
 * @param {Object} [options] See available [options](#options).
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */


picomatch$1.isMatch = (str, patterns, options) => picomatch$1(patterns, options)(str);
/**
 * Parse a glob pattern to create the source string for a regular
 * expression.
 *
 * ```js
 * const picomatch = require('picomatch');
 * const result = picomatch.parse(pattern[, options]);
 * ```
 * @param {String} `pattern`
 * @param {Object} `options`
 * @return {Object} Returns an object with useful properties and output to be used as a regex source string.
 * @api public
 */


picomatch$1.parse = (pattern, options) => {
  if (Array.isArray(pattern)) return pattern.map(p => picomatch$1.parse(p, options));
  return parse_1(pattern, Object.assign(Object.assign({}, options), {}, {
    fastpaths: false
  }));
};
/**
 * Scan a glob pattern to separate the pattern into segments.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.scan(input[, options]);
 *
 * const result = picomatch.scan('!./foo/*.js');
 * console.log(result);
 * { prefix: '!./',
 *   input: '!./foo/*.js',
 *   start: 3,
 *   base: 'foo',
 *   glob: '*.js',
 *   isBrace: false,
 *   isBracket: false,
 *   isGlob: true,
 *   isExtglob: false,
 *   isGlobstar: false,
 *   negated: true }
 * ```
 * @param {String} `input` Glob pattern to scan.
 * @param {Object} `options`
 * @return {Object} Returns an object with
 * @api public
 */


picomatch$1.scan = (input, options) => scan_1(input, options);
/**
 * Compile a regular expression from the `state` object returned by the
 * [parse()](#parse) method.
 *
 * @param {Object} `state`
 * @param {Object} `options`
 * @param {Boolean} `returnOutput` Intended for implementors, this argument allows you to return the raw output from the parser.
 * @param {Boolean} `returnState` Adds the state to a `state` property on the returned regex. Useful for implementors and debugging.
 * @return {RegExp}
 * @api public
 */


picomatch$1.compileRe = (state, options, returnOutput = false, returnState = false) => {
  if (returnOutput === true) {
    return state.output;
  }

  const opts = options || {};
  const prepend = opts.contains ? '' : '^';
  const append = opts.contains ? '' : '$';
  let source = `${prepend}(?:${state.output})${append}`;

  if (state && state.negated === true) {
    source = `^(?!${source}).*$`;
  }

  const regex = picomatch$1.toRegex(source, options);

  if (returnState === true) {
    regex.state = state;
  }

  return regex;
};
/**
 * Create a regular expression from a parsed glob pattern.
 *
 * ```js
 * const picomatch = require('picomatch');
 * const state = picomatch.parse('*.js');
 * // picomatch.compileRe(state[, options]);
 *
 * console.log(picomatch.compileRe(state));
 * //=> /^(?:(?!\.)(?=.)[^/]*?\.js)$/
 * ```
 * @param {String} `state` The object returned from the `.parse` method.
 * @param {Object} `options`
 * @param {Boolean} `returnOutput` Implementors may use this argument to return the compiled output, instead of a regular expression. This is not exposed on the options to prevent end-users from mutating the result.
 * @param {Boolean} `returnState` Implementors may use this argument to return the state from the parsed glob with the returned regular expression.
 * @return {RegExp} Returns a regex created from the given pattern.
 * @api public
 */


picomatch$1.makeRe = (input, options = {}, returnOutput = false, returnState = false) => {
  if (!input || typeof input !== 'string') {
    throw new TypeError('Expected a non-empty string');
  }

  let parsed = {
    negated: false,
    fastpaths: true
  };

  if (options.fastpaths !== false && (input[0] === '.' || input[0] === '*')) {
    parsed.output = parse_1.fastpaths(input, options);
  }

  if (!parsed.output) {
    parsed = parse_1(input, options);
  }

  return picomatch$1.compileRe(parsed, options, returnOutput, returnState);
};
/**
 * Create a regular expression from the given regex source string.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.toRegex(source[, options]);
 *
 * const { output } = picomatch.parse('*.js');
 * console.log(picomatch.toRegex(output));
 * //=> /^(?:(?!\.)(?=.)[^/]*?\.js)$/
 * ```
 * @param {String} `source` Regular expression source string.
 * @param {Object} `options`
 * @return {RegExp}
 * @api public
 */


picomatch$1.toRegex = (source, options) => {
  try {
    const opts = options || {};
    return new RegExp(source, opts.flags || (opts.nocase ? 'i' : ''));
  } catch (err) {
    if (options && options.debug === true) throw err;
    return /$^/;
  }
};
/**
 * Picomatch constants.
 * @return {Object}
 */


picomatch$1.constants = constants$1;
/**
 * Expose "picomatch"
 */

var picomatch_1 = picomatch$1;

var picomatch = picomatch_1;

const isEmptyString = val => val === '' || val === './';
/**
 * Returns an array of strings that match one or more glob patterns.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm(list, patterns[, options]);
 *
 * console.log(mm(['a.js', 'a.txt'], ['*.js']));
 * //=> [ 'a.js' ]
 * ```
 * @param {String|Array<string>} `list` List of strings to match.
 * @param {String|Array<string>} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options)
 * @return {Array} Returns an array of matches
 * @summary false
 * @api public
 */


const micromatch = (list, patterns, options) => {
  patterns = [].concat(patterns);
  list = [].concat(list);
  let omit = new Set();
  let keep = new Set();
  let items = new Set();
  let negatives = 0;

  let onResult = state => {
    items.add(state.output);

    if (options && options.onResult) {
      options.onResult(state);
    }
  };

  for (let i = 0; i < patterns.length; i++) {
    let isMatch = picomatch(String(patterns[i]), Object.assign(Object.assign({}, options), {}, {
      onResult
    }), true);
    let negated = isMatch.state.negated || isMatch.state.negatedExtglob;
    if (negated) negatives++;

    for (let item of list) {
      let matched = isMatch(item, true);
      let match = negated ? !matched.isMatch : matched.isMatch;
      if (!match) continue;

      if (negated) {
        omit.add(matched.output);
      } else {
        omit.delete(matched.output);
        keep.add(matched.output);
      }
    }
  }

  let result = negatives === patterns.length ? [...items] : [...keep];
  let matches = result.filter(item => !omit.has(item));

  if (options && matches.length === 0) {
    if (options.failglob === true) {
      throw new Error(`No matches found for "${patterns.join(', ')}"`);
    }

    if (options.nonull === true || options.nullglob === true) {
      return options.unescape ? patterns.map(p => p.replace(/\\/g, '')) : patterns;
    }
  }

  return matches;
};
/**
 * Backwards compatibility
 */


micromatch.match = micromatch;
/**
 * Returns a matcher function from the given glob `pattern` and `options`.
 * The returned function takes a string to match as its only argument and returns
 * true if the string is a match.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.matcher(pattern[, options]);
 *
 * const isMatch = mm.matcher('*.!(*a)');
 * console.log(isMatch('a.a')); //=> false
 * console.log(isMatch('a.b')); //=> true
 * ```
 * @param {String} `pattern` Glob pattern
 * @param {Object} `options`
 * @return {Function} Returns a matcher function.
 * @api public
 */

micromatch.matcher = (pattern, options) => picomatch(pattern, options);
/**
 * Returns true if **any** of the given glob `patterns` match the specified `string`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.isMatch(string, patterns[, options]);
 *
 * console.log(mm.isMatch('a.a', ['b.*', '*.a'])); //=> true
 * console.log(mm.isMatch('a.a', 'b.*')); //=> false
 * ```
 * @param {String} `str` The string to test.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `[options]` See available [options](#options).
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */


micromatch.isMatch = (str, patterns, options) => picomatch(patterns, options)(str);
/**
 * Backwards compatibility
 */


micromatch.any = micromatch.isMatch;
/**
 * Returns a list of strings that _**do not match any**_ of the given `patterns`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.not(list, patterns[, options]);
 *
 * console.log(mm.not(['a.a', 'b.b', 'c.c'], '*.a'));
 * //=> ['b.b', 'c.c']
 * ```
 * @param {Array} `list` Array of strings to match.
 * @param {String|Array} `patterns` One or more glob pattern to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Array} Returns an array of strings that **do not match** the given patterns.
 * @api public
 */

micromatch.not = (list, patterns, options = {}) => {
  patterns = [].concat(patterns).map(String);
  let result = new Set();
  let items = [];

  let onResult = state => {
    if (options.onResult) options.onResult(state);
    items.push(state.output);
  };

  let matches = micromatch(list, patterns, Object.assign(Object.assign({}, options), {}, {
    onResult
  }));

  for (let item of items) {
    if (!matches.includes(item)) {
      result.add(item);
    }
  }

  return [...result];
};
/**
 * Returns true if the given `string` contains the given pattern. Similar
 * to [.isMatch](#isMatch) but the pattern can match any part of the string.
 *
 * ```js
 * var mm = require('micromatch');
 * // mm.contains(string, pattern[, options]);
 *
 * console.log(mm.contains('aa/bb/cc', '*b'));
 * //=> true
 * console.log(mm.contains('aa/bb/cc', '*d'));
 * //=> false
 * ```
 * @param {String} `str` The string to match.
 * @param {String|Array} `patterns` Glob pattern to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if any of the patterns matches any part of `str`.
 * @api public
 */


micromatch.contains = (str, pattern, options) => {
  if (typeof str !== 'string') {
    throw new TypeError(`Expected a string: "${util__default['default'].inspect(str)}"`);
  }

  if (Array.isArray(pattern)) {
    return pattern.some(p => micromatch.contains(str, p, options));
  }

  if (typeof pattern === 'string') {
    if (isEmptyString(str) || isEmptyString(pattern)) {
      return false;
    }

    if (str.includes(pattern) || str.startsWith('./') && str.slice(2).includes(pattern)) {
      return true;
    }
  }

  return micromatch.isMatch(str, pattern, Object.assign(Object.assign({}, options), {}, {
    contains: true
  }));
};
/**
 * Filter the keys of the given object with the given `glob` pattern
 * and `options`. Does not attempt to match nested keys. If you need this feature,
 * use [glob-object][] instead.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.matchKeys(object, patterns[, options]);
 *
 * const obj = { aa: 'a', ab: 'b', ac: 'c' };
 * console.log(mm.matchKeys(obj, '*b'));
 * //=> { ab: 'b' }
 * ```
 * @param {Object} `object` The object with keys to filter.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Object} Returns an object with only keys that match the given patterns.
 * @api public
 */


micromatch.matchKeys = (obj, patterns, options) => {
  if (!utils$2.isObject(obj)) {
    throw new TypeError('Expected the first argument to be an object');
  }

  let keys = micromatch(Object.keys(obj), patterns, options);
  let res = {};

  for (let key of keys) res[key] = obj[key];

  return res;
};
/**
 * Returns true if some of the strings in the given `list` match any of the given glob `patterns`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.some(list, patterns[, options]);
 *
 * console.log(mm.some(['foo.js', 'bar.js'], ['*.js', '!foo.js']));
 * // true
 * console.log(mm.some(['foo.js'], ['*.js', '!foo.js']));
 * // false
 * ```
 * @param {String|Array} `list` The string or array of strings to test. Returns as soon as the first match is found.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if any `patterns` matches any of the strings in `list`
 * @api public
 */


micromatch.some = (list, patterns, options) => {
  let items = [].concat(list);

  for (let pattern of [].concat(patterns)) {
    let isMatch = picomatch(String(pattern), options);

    if (items.some(item => isMatch(item))) {
      return true;
    }
  }

  return false;
};
/**
 * Returns true if every string in the given `list` matches
 * any of the given glob `patterns`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.every(list, patterns[, options]);
 *
 * console.log(mm.every('foo.js', ['foo.js']));
 * // true
 * console.log(mm.every(['foo.js', 'bar.js'], ['*.js']));
 * // true
 * console.log(mm.every(['foo.js', 'bar.js'], ['*.js', '!foo.js']));
 * // false
 * console.log(mm.every(['foo.js'], ['*.js', '!foo.js']));
 * // false
 * ```
 * @param {String|Array} `list` The string or array of strings to test.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if all `patterns` matches all of the strings in `list`
 * @api public
 */


micromatch.every = (list, patterns, options) => {
  let items = [].concat(list);

  for (let pattern of [].concat(patterns)) {
    let isMatch = picomatch(String(pattern), options);

    if (!items.every(item => isMatch(item))) {
      return false;
    }
  }

  return true;
};
/**
 * Returns true if **all** of the given `patterns` match
 * the specified string.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.all(string, patterns[, options]);
 *
 * console.log(mm.all('foo.js', ['foo.js']));
 * // true
 *
 * console.log(mm.all('foo.js', ['*.js', '!foo.js']));
 * // false
 *
 * console.log(mm.all('foo.js', ['*.js', 'foo.js']));
 * // true
 *
 * console.log(mm.all('foo.js', ['*.js', 'f*', '*o*', '*o.js']));
 * // true
 * ```
 * @param {String|Array} `str` The string to test.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */


micromatch.all = (str, patterns, options) => {
  if (typeof str !== 'string') {
    throw new TypeError(`Expected a string: "${util__default['default'].inspect(str)}"`);
  }

  return [].concat(patterns).every(p => picomatch(p, options)(str));
};
/**
 * Returns an array of matches captured by `pattern` in `string, or `null` if the pattern did not match.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.capture(pattern, string[, options]);
 *
 * console.log(mm.capture('test/*.js', 'test/foo.js'));
 * //=> ['foo']
 * console.log(mm.capture('test/*.js', 'foo/bar.css'));
 * //=> null
 * ```
 * @param {String} `glob` Glob pattern to use for matching.
 * @param {String} `input` String to match
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Array|null} Returns an array of captures if the input matches the glob pattern, otherwise `null`.
 * @api public
 */


micromatch.capture = (glob, input, options) => {
  let posix = utils$2.isWindows(options);
  let regex = picomatch.makeRe(String(glob), Object.assign(Object.assign({}, options), {}, {
    capture: true
  }));
  let match = regex.exec(posix ? utils$2.toPosixSlashes(input) : input);

  if (match) {
    return match.slice(1).map(v => v === void 0 ? '' : v);
  }
};
/**
 * Create a regular expression from the given glob `pattern`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.makeRe(pattern[, options]);
 *
 * console.log(mm.makeRe('*.js'));
 * //=> /^(?:(\.[\\\/])?(?!\.)(?=.)[^\/]*?\.js)$/
 * ```
 * @param {String} `pattern` A glob pattern to convert to regex.
 * @param {Object} `options`
 * @return {RegExp} Returns a regex created from the given pattern.
 * @api public
 */


micromatch.makeRe = (...args) => picomatch.makeRe(...args);
/**
 * Scan a glob pattern to separate the pattern into segments. Used
 * by the [split](#split) method.
 *
 * ```js
 * const mm = require('micromatch');
 * const state = mm.scan(pattern[, options]);
 * ```
 * @param {String} `pattern`
 * @param {Object} `options`
 * @return {Object} Returns an object with
 * @api public
 */


micromatch.scan = (...args) => picomatch.scan(...args);
/**
 * Parse a glob pattern to create the source string for a regular
 * expression.
 *
 * ```js
 * const mm = require('micromatch');
 * const state = mm(pattern[, options]);
 * ```
 * @param {String} `glob`
 * @param {Object} `options`
 * @return {Object} Returns an object with useful properties and output to be used as regex source string.
 * @api public
 */


micromatch.parse = (patterns, options) => {
  let res = [];

  for (let pattern of [].concat(patterns || [])) {
    for (let str of braces_1(String(pattern), options)) {
      res.push(picomatch.parse(str, options));
    }
  }

  return res;
};
/**
 * Process the given brace `pattern`.
 *
 * ```js
 * const { braces } = require('micromatch');
 * console.log(braces('foo/{a,b,c}/bar'));
 * //=> [ 'foo/(a|b|c)/bar' ]
 *
 * console.log(braces('foo/{a,b,c}/bar', { expand: true }));
 * //=> [ 'foo/a/bar', 'foo/b/bar', 'foo/c/bar' ]
 * ```
 * @param {String} `pattern` String with brace pattern to process.
 * @param {Object} `options` Any [options](#options) to change how expansion is performed. See the [braces][] library for all available options.
 * @return {Array}
 * @api public
 */


micromatch.braces = (pattern, options) => {
  if (typeof pattern !== 'string') throw new TypeError('Expected a string');

  if (options && options.nobrace === true || !/\{.*\}/.test(pattern)) {
    return [pattern];
  }

  return braces_1(pattern, options);
};
/**
 * Expand braces
 */


micromatch.braceExpand = (pattern, options) => {
  if (typeof pattern !== 'string') throw new TypeError('Expected a string');
  return micromatch.braces(pattern, Object.assign(Object.assign({}, options), {}, {
    expand: true
  }));
};
/**
 * Expose micromatch
 */


var micromatch_1 = micromatch;

var pattern = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.matchAny = exports.convertPatternsToRe = exports.makeRe = exports.getPatternParts = exports.expandBraceExpansion = exports.expandPatternsWithBraceExpansion = exports.isAffectDepthOfReadingPattern = exports.endsWithSlashGlobStar = exports.hasGlobStar = exports.getBaseDirectory = exports.getPositivePatterns = exports.getNegativePatterns = exports.isPositivePattern = exports.isNegativePattern = exports.convertToNegativePattern = exports.convertToPositivePattern = exports.isDynamicPattern = exports.isStaticPattern = void 0;
  const GLOBSTAR = '**';
  const ESCAPE_SYMBOL = '\\';
  const COMMON_GLOB_SYMBOLS_RE = /[*?]|^!/;
  const REGEX_CHARACTER_CLASS_SYMBOLS_RE = /\[.*]/;
  const REGEX_GROUP_SYMBOLS_RE = /(?:^|[^!*+?@])\(.*\|.*\)/;
  const GLOB_EXTENSION_SYMBOLS_RE = /[!*+?@]\(.*\)/;
  const BRACE_EXPANSIONS_SYMBOLS_RE = /{.*(?:,|\.\.).*}/;

  function isStaticPattern(pattern, options = {}) {
    return !isDynamicPattern(pattern, options);
  }

  exports.isStaticPattern = isStaticPattern;

  function isDynamicPattern(pattern, options = {}) {
    /**
     * A special case with an empty string is necessary for matching patterns that start with a forward slash.
     * An empty string cannot be a dynamic pattern.
     * For example, the pattern `/lib/*` will be spread into parts: '', 'lib', '*'.
     */
    if (pattern === '') {
      return false;
    }
    /**
     * When the `caseSensitiveMatch` option is disabled, all patterns must be marked as dynamic, because we cannot check
     * filepath directly (without read directory).
     */


    if (options.caseSensitiveMatch === false || pattern.includes(ESCAPE_SYMBOL)) {
      return true;
    }

    if (COMMON_GLOB_SYMBOLS_RE.test(pattern) || REGEX_CHARACTER_CLASS_SYMBOLS_RE.test(pattern) || REGEX_GROUP_SYMBOLS_RE.test(pattern)) {
      return true;
    }

    if (options.extglob !== false && GLOB_EXTENSION_SYMBOLS_RE.test(pattern)) {
      return true;
    }

    if (options.braceExpansion !== false && BRACE_EXPANSIONS_SYMBOLS_RE.test(pattern)) {
      return true;
    }

    return false;
  }

  exports.isDynamicPattern = isDynamicPattern;

  function convertToPositivePattern(pattern) {
    return isNegativePattern(pattern) ? pattern.slice(1) : pattern;
  }

  exports.convertToPositivePattern = convertToPositivePattern;

  function convertToNegativePattern(pattern) {
    return '!' + pattern;
  }

  exports.convertToNegativePattern = convertToNegativePattern;

  function isNegativePattern(pattern) {
    return pattern.startsWith('!') && pattern[1] !== '(';
  }

  exports.isNegativePattern = isNegativePattern;

  function isPositivePattern(pattern) {
    return !isNegativePattern(pattern);
  }

  exports.isPositivePattern = isPositivePattern;

  function getNegativePatterns(patterns) {
    return patterns.filter(isNegativePattern);
  }

  exports.getNegativePatterns = getNegativePatterns;

  function getPositivePatterns(patterns) {
    return patterns.filter(isPositivePattern);
  }

  exports.getPositivePatterns = getPositivePatterns;

  function getBaseDirectory(pattern) {
    return globParent(pattern, {
      flipBackslashes: false
    });
  }

  exports.getBaseDirectory = getBaseDirectory;

  function hasGlobStar(pattern) {
    return pattern.includes(GLOBSTAR);
  }

  exports.hasGlobStar = hasGlobStar;

  function endsWithSlashGlobStar(pattern) {
    return pattern.endsWith('/' + GLOBSTAR);
  }

  exports.endsWithSlashGlobStar = endsWithSlashGlobStar;

  function isAffectDepthOfReadingPattern(pattern) {
    const basename = path__default['default'].basename(pattern);
    return endsWithSlashGlobStar(pattern) || isStaticPattern(basename);
  }

  exports.isAffectDepthOfReadingPattern = isAffectDepthOfReadingPattern;

  function expandPatternsWithBraceExpansion(patterns) {
    return patterns.reduce((collection, pattern) => {
      return collection.concat(expandBraceExpansion(pattern));
    }, []);
  }

  exports.expandPatternsWithBraceExpansion = expandPatternsWithBraceExpansion;

  function expandBraceExpansion(pattern) {
    return micromatch_1.braces(pattern, {
      expand: true,
      nodupes: true
    });
  }

  exports.expandBraceExpansion = expandBraceExpansion;

  function getPatternParts(pattern, options) {
    let {
      parts
    } = picomatch.scan(pattern, Object.assign(Object.assign({}, options), {
      parts: true
    }));
    /**
     * The scan method returns an empty array in some cases.
     * See micromatch/picomatch#58 for more details.
     */

    if (parts.length === 0) {
      parts = [pattern];
    }
    /**
     * The scan method does not return an empty part for the pattern with a forward slash.
     * This is another part of micromatch/picomatch#58.
     */


    if (parts[0].startsWith('/')) {
      parts[0] = parts[0].slice(1);
      parts.unshift('');
    }

    return parts;
  }

  exports.getPatternParts = getPatternParts;

  function makeRe(pattern, options) {
    return micromatch_1.makeRe(pattern, options);
  }

  exports.makeRe = makeRe;

  function convertPatternsToRe(patterns, options) {
    return patterns.map(pattern => makeRe(pattern, options));
  }

  exports.convertPatternsToRe = convertPatternsToRe;

  function matchAny(entry, patternsRe) {
    return patternsRe.some(patternRe => patternRe.test(entry));
  }

  exports.matchAny = matchAny;
});

/*
 * merge2
 * https://github.com/teambition/merge2
 *
 * Copyright (c) 2014-2020 Teambition
 * Licensed under the MIT license.
 */


const PassThrough = stream_1__default['default'].PassThrough;
const slice = Array.prototype.slice;
var merge2_1 = merge2;

function merge2() {
  const streamsQueue = [];
  const args = slice.call(arguments);
  let merging = false;
  let options = args[args.length - 1];

  if (options && !Array.isArray(options) && options.pipe == null) {
    args.pop();
  } else {
    options = {};
  }

  const doEnd = options.end !== false;
  const doPipeError = options.pipeError === true;

  if (options.objectMode == null) {
    options.objectMode = true;
  }

  if (options.highWaterMark == null) {
    options.highWaterMark = 64 * 1024;
  }

  const mergedStream = PassThrough(options);

  function addStream() {
    for (let i = 0, len = arguments.length; i < len; i++) {
      streamsQueue.push(pauseStreams(arguments[i], options));
    }

    mergeStream();
    return this;
  }

  function mergeStream() {
    if (merging) {
      return;
    }

    merging = true;
    let streams = streamsQueue.shift();

    if (!streams) {
      process.nextTick(endStream);
      return;
    }

    if (!Array.isArray(streams)) {
      streams = [streams];
    }

    let pipesCount = streams.length + 1;

    function next() {
      if (--pipesCount > 0) {
        return;
      }

      merging = false;
      mergeStream();
    }

    function pipe(stream) {
      function onend() {
        stream.removeListener('merge2UnpipeEnd', onend);
        stream.removeListener('end', onend);

        if (doPipeError) {
          stream.removeListener('error', onerror);
        }

        next();
      }

      function onerror(err) {
        mergedStream.emit('error', err);
      } // skip ended stream


      if (stream._readableState.endEmitted) {
        return next();
      }

      stream.on('merge2UnpipeEnd', onend);
      stream.on('end', onend);

      if (doPipeError) {
        stream.on('error', onerror);
      }

      stream.pipe(mergedStream, {
        end: false
      }); // compatible for old stream

      stream.resume();
    }

    for (let i = 0; i < streams.length; i++) {
      pipe(streams[i]);
    }

    next();
  }

  function endStream() {
    merging = false; // emit 'queueDrain' when all streams merged.

    mergedStream.emit('queueDrain');

    if (doEnd) {
      mergedStream.end();
    }
  }

  mergedStream.setMaxListeners(0);
  mergedStream.add = addStream;
  mergedStream.on('unpipe', function (stream) {
    stream.emit('merge2UnpipeEnd');
  });

  if (args.length) {
    addStream.apply(null, args);
  }

  return mergedStream;
} // check and pause streams for pipe.


function pauseStreams(streams, options) {
  if (!Array.isArray(streams)) {
    // Backwards-compat with old-style streams
    if (!streams._readableState && streams.pipe) {
      streams = streams.pipe(PassThrough(options));
    }

    if (!streams._readableState || !streams.pause || !streams.pipe) {
      throw new Error('Only readable stream can be merged.');
    }

    streams.pause();
  } else {
    for (let i = 0, len = streams.length; i < len; i++) {
      streams[i] = pauseStreams(streams[i], options);
    }
  }

  return streams;
}

var stream$3 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.merge = void 0;

  function merge(streams) {
    const mergedStream = merge2_1(streams);
    streams.forEach(stream => {
      stream.once('error', error => mergedStream.emit('error', error));
    });
    mergedStream.once('close', () => propagateCloseEventToSources(streams));
    mergedStream.once('end', () => propagateCloseEventToSources(streams));
    return mergedStream;
  }

  exports.merge = merge;

  function propagateCloseEventToSources(streams) {
    streams.forEach(stream => stream.emit('close'));
  }
});

var string = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.isEmpty = exports.isString = void 0;

  function isString(input) {
    return typeof input === 'string';
  }

  exports.isString = isString;

  function isEmpty(input) {
    return input === '';
  }

  exports.isEmpty = isEmpty;
});

var utils$1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.string = exports.stream = exports.pattern = exports.path = exports.fs = exports.errno = exports.array = void 0;
  exports.array = array$2;
  exports.errno = errno;
  exports.fs = fs$3;
  exports.path = path_1;
  exports.pattern = pattern;
  exports.stream = stream$3;
  exports.string = string;
});

var tasks = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.convertPatternGroupToTask = exports.convertPatternGroupsToTasks = exports.groupPatternsByBaseDirectory = exports.getNegativePatternsAsPositive = exports.getPositivePatterns = exports.convertPatternsToTasks = exports.generate = void 0;

  function generate(patterns, settings) {
    const positivePatterns = getPositivePatterns(patterns);
    const negativePatterns = getNegativePatternsAsPositive(patterns, settings.ignore);
    const staticPatterns = positivePatterns.filter(pattern => utils$1.pattern.isStaticPattern(pattern, settings));
    const dynamicPatterns = positivePatterns.filter(pattern => utils$1.pattern.isDynamicPattern(pattern, settings));
    const staticTasks = convertPatternsToTasks(staticPatterns, negativePatterns,
    /* dynamic */
    false);
    const dynamicTasks = convertPatternsToTasks(dynamicPatterns, negativePatterns,
    /* dynamic */
    true);
    return staticTasks.concat(dynamicTasks);
  }

  exports.generate = generate;

  function convertPatternsToTasks(positive, negative, dynamic) {
    const positivePatternsGroup = groupPatternsByBaseDirectory(positive); // When we have a global group – there is no reason to divide the patterns into independent tasks.
    // In this case, the global task covers the rest.

    if ('.' in positivePatternsGroup) {
      const task = convertPatternGroupToTask('.', positive, negative, dynamic);
      return [task];
    }

    return convertPatternGroupsToTasks(positivePatternsGroup, negative, dynamic);
  }

  exports.convertPatternsToTasks = convertPatternsToTasks;

  function getPositivePatterns(patterns) {
    return utils$1.pattern.getPositivePatterns(patterns);
  }

  exports.getPositivePatterns = getPositivePatterns;

  function getNegativePatternsAsPositive(patterns, ignore) {
    const negative = utils$1.pattern.getNegativePatterns(patterns).concat(ignore);
    const positive = negative.map(utils$1.pattern.convertToPositivePattern);
    return positive;
  }

  exports.getNegativePatternsAsPositive = getNegativePatternsAsPositive;

  function groupPatternsByBaseDirectory(patterns) {
    const group = {};
    return patterns.reduce((collection, pattern) => {
      const base = utils$1.pattern.getBaseDirectory(pattern);

      if (base in collection) {
        collection[base].push(pattern);
      } else {
        collection[base] = [pattern];
      }

      return collection;
    }, group);
  }

  exports.groupPatternsByBaseDirectory = groupPatternsByBaseDirectory;

  function convertPatternGroupsToTasks(positive, negative, dynamic) {
    return Object.keys(positive).map(base => {
      return convertPatternGroupToTask(base, positive[base], negative, dynamic);
    });
  }

  exports.convertPatternGroupsToTasks = convertPatternGroupsToTasks;

  function convertPatternGroupToTask(base, positive, negative, dynamic) {
    return {
      dynamic,
      positive,
      negative,
      base,
      patterns: [].concat(positive, negative.map(utils$1.pattern.convertToNegativePattern))
    };
  }

  exports.convertPatternGroupToTask = convertPatternGroupToTask;
});

var async$4 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.read = void 0;

  function read(path, settings, callback) {
    settings.fs.lstat(path, (lstatError, lstat) => {
      if (lstatError !== null) {
        callFailureCallback(callback, lstatError);
        return;
      }

      if (!lstat.isSymbolicLink() || !settings.followSymbolicLink) {
        callSuccessCallback(callback, lstat);
        return;
      }

      settings.fs.stat(path, (statError, stat) => {
        if (statError !== null) {
          if (settings.throwErrorOnBrokenSymbolicLink) {
            callFailureCallback(callback, statError);
            return;
          }

          callSuccessCallback(callback, lstat);
          return;
        }

        if (settings.markSymbolicLink) {
          stat.isSymbolicLink = () => true;
        }

        callSuccessCallback(callback, stat);
      });
    });
  }

  exports.read = read;

  function callFailureCallback(callback, error) {
    callback(error);
  }

  function callSuccessCallback(callback, result) {
    callback(null, result);
  }
});

var sync$5 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.read = void 0;

  function read(path, settings) {
    const lstat = settings.fs.lstatSync(path);

    if (!lstat.isSymbolicLink() || !settings.followSymbolicLink) {
      return lstat;
    }

    try {
      const stat = settings.fs.statSync(path);

      if (settings.markSymbolicLink) {
        stat.isSymbolicLink = () => true;
      }

      return stat;
    } catch (error) {
      if (!settings.throwErrorOnBrokenSymbolicLink) {
        return lstat;
      }

      throw error;
    }
  }

  exports.read = read;
});

var fs_1$1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.createFileSystemAdapter = exports.FILE_SYSTEM_ADAPTER = void 0;
  exports.FILE_SYSTEM_ADAPTER = {
    lstat: fs__default['default'].lstat,
    stat: fs__default['default'].stat,
    lstatSync: fs__default['default'].lstatSync,
    statSync: fs__default['default'].statSync
  };

  function createFileSystemAdapter(fsMethods) {
    if (fsMethods === undefined) {
      return exports.FILE_SYSTEM_ADAPTER;
    }

    return Object.assign(Object.assign({}, exports.FILE_SYSTEM_ADAPTER), fsMethods);
  }

  exports.createFileSystemAdapter = createFileSystemAdapter;
});

class Settings$2 {
  constructor(_options = {}) {
    this._options = _options;
    this.followSymbolicLink = this._getValue(this._options.followSymbolicLink, true);
    this.fs = fs_1$1.createFileSystemAdapter(this._options.fs);
    this.markSymbolicLink = this._getValue(this._options.markSymbolicLink, false);
    this.throwErrorOnBrokenSymbolicLink = this._getValue(this._options.throwErrorOnBrokenSymbolicLink, true);
  }

  _getValue(option, value) {
    return option !== null && option !== void 0 ? option : value;
  }

}

var _default$m = Settings$2;
var settings$3 = /*#__PURE__*/Object.defineProperty({
  default: _default$m
}, '__esModule', {
  value: true
});

var out$3 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.statSync = exports.stat = exports.Settings = void 0;
  exports.Settings = settings$3.default;

  function stat(path, optionsOrSettingsOrCallback, callback) {
    if (typeof optionsOrSettingsOrCallback === 'function') {
      async$4.read(path, getSettings(), optionsOrSettingsOrCallback);
      return;
    }

    async$4.read(path, getSettings(optionsOrSettingsOrCallback), callback);
  }

  exports.stat = stat;

  function statSync(path, optionsOrSettings) {
    const settings = getSettings(optionsOrSettings);
    return sync$5.read(path, settings);
  }

  exports.statSync = statSync;

  function getSettings(settingsOrOptions = {}) {
    if (settingsOrOptions instanceof settings$3.default) {
      return settingsOrOptions;
    }

    return new settings$3.default(settingsOrOptions);
  }
});

/*! queue-microtask. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
let promise$1;
var queueMicrotask_1 = typeof queueMicrotask === 'function' ? queueMicrotask.bind(typeof window !== 'undefined' ? window : global) // reuse resolved promise, and allocate it lazily
: cb => (promise$1 || (promise$1 = Promise.resolve())).then(cb).catch(err => setTimeout(() => {
  throw err;
}, 0));

/*! run-parallel. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
var runParallel_1 = runParallel;

function runParallel(tasks, cb) {
  let results, pending, keys;
  let isSync = true;

  if (Array.isArray(tasks)) {
    results = [];
    pending = tasks.length;
  } else {
    keys = Object.keys(tasks);
    results = {};
    pending = keys.length;
  }

  function done(err) {
    function end() {
      if (cb) cb(err, results);
      cb = null;
    }

    if (isSync) queueMicrotask_1(end);else end();
  }

  function each(i, err, result) {
    results[i] = result;

    if (--pending === 0 || err) {
      done(err);
    }
  }

  if (!pending) {
    // empty
    done(null);
  } else if (keys) {
    // object
    keys.forEach(function (key) {
      tasks[key](function (err, result) {
        each(key, err, result);
      });
    });
  } else {
    // array
    tasks.forEach(function (task, i) {
      task(function (err, result) {
        each(i, err, result);
      });
    });
  }

  isSync = false;
}

var constants = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.IS_SUPPORT_READDIR_WITH_FILE_TYPES = void 0;
  const NODE_PROCESS_VERSION_PARTS = process.versions.node.split('.');

  if (NODE_PROCESS_VERSION_PARTS[0] === undefined || NODE_PROCESS_VERSION_PARTS[1] === undefined) {
    throw new Error(`Unexpected behavior. The 'process.versions.node' variable has invalid value: ${process.versions.node}`);
  }

  const MAJOR_VERSION = Number.parseInt(NODE_PROCESS_VERSION_PARTS[0], 10);
  const MINOR_VERSION = Number.parseInt(NODE_PROCESS_VERSION_PARTS[1], 10);
  const SUPPORTED_MAJOR_VERSION = 10;
  const SUPPORTED_MINOR_VERSION = 10;
  const IS_MATCHED_BY_MAJOR = MAJOR_VERSION > SUPPORTED_MAJOR_VERSION;
  const IS_MATCHED_BY_MAJOR_AND_MINOR = MAJOR_VERSION === SUPPORTED_MAJOR_VERSION && MINOR_VERSION >= SUPPORTED_MINOR_VERSION;
  /**
   * IS `true` for Node.js 10.10 and greater.
   */

  exports.IS_SUPPORT_READDIR_WITH_FILE_TYPES = IS_MATCHED_BY_MAJOR || IS_MATCHED_BY_MAJOR_AND_MINOR;
});

var fs$2 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.createDirentFromStats = void 0;

  class DirentFromStats {
    constructor(name, stats) {
      this.name = name;
      this.isBlockDevice = stats.isBlockDevice.bind(stats);
      this.isCharacterDevice = stats.isCharacterDevice.bind(stats);
      this.isDirectory = stats.isDirectory.bind(stats);
      this.isFIFO = stats.isFIFO.bind(stats);
      this.isFile = stats.isFile.bind(stats);
      this.isSocket = stats.isSocket.bind(stats);
      this.isSymbolicLink = stats.isSymbolicLink.bind(stats);
    }

  }

  function createDirentFromStats(name, stats) {
    return new DirentFromStats(name, stats);
  }

  exports.createDirentFromStats = createDirentFromStats;
});

var utils = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.fs = void 0;
  exports.fs = fs$2;
});

var common$1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.joinPathSegments = void 0;

  function joinPathSegments(a, b, separator) {
    /**
     * The correct handling of cases when the first segment is a root (`/`, `C:/`) or UNC path (`//?/C:/`).
     */
    if (a.endsWith(separator)) {
      return a + b;
    }

    return a + separator + b;
  }

  exports.joinPathSegments = joinPathSegments;
});

var async$3 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.readdir = exports.readdirWithFileTypes = exports.read = void 0;

  function read(directory, settings, callback) {
    if (!settings.stats && constants.IS_SUPPORT_READDIR_WITH_FILE_TYPES) {
      readdirWithFileTypes(directory, settings, callback);
      return;
    }

    readdir(directory, settings, callback);
  }

  exports.read = read;

  function readdirWithFileTypes(directory, settings, callback) {
    settings.fs.readdir(directory, {
      withFileTypes: true
    }, (readdirError, dirents) => {
      if (readdirError !== null) {
        callFailureCallback(callback, readdirError);
        return;
      }

      const entries = dirents.map(dirent => ({
        dirent,
        name: dirent.name,
        path: common$1.joinPathSegments(directory, dirent.name, settings.pathSegmentSeparator)
      }));

      if (!settings.followSymbolicLinks) {
        callSuccessCallback(callback, entries);
        return;
      }

      const tasks = entries.map(entry => makeRplTaskEntry(entry, settings));
      runParallel_1(tasks, (rplError, rplEntries) => {
        if (rplError !== null) {
          callFailureCallback(callback, rplError);
          return;
        }

        callSuccessCallback(callback, rplEntries);
      });
    });
  }

  exports.readdirWithFileTypes = readdirWithFileTypes;

  function makeRplTaskEntry(entry, settings) {
    return done => {
      if (!entry.dirent.isSymbolicLink()) {
        done(null, entry);
        return;
      }

      settings.fs.stat(entry.path, (statError, stats) => {
        if (statError !== null) {
          if (settings.throwErrorOnBrokenSymbolicLink) {
            done(statError);
            return;
          }

          done(null, entry);
          return;
        }

        entry.dirent = utils.fs.createDirentFromStats(entry.name, stats);
        done(null, entry);
      });
    };
  }

  function readdir(directory, settings, callback) {
    settings.fs.readdir(directory, (readdirError, names) => {
      if (readdirError !== null) {
        callFailureCallback(callback, readdirError);
        return;
      }

      const tasks = names.map(name => {
        const path = common$1.joinPathSegments(directory, name, settings.pathSegmentSeparator);
        return done => {
          out$3.stat(path, settings.fsStatSettings, (error, stats) => {
            if (error !== null) {
              done(error);
              return;
            }

            const entry = {
              name,
              path,
              dirent: utils.fs.createDirentFromStats(name, stats)
            };

            if (settings.stats) {
              entry.stats = stats;
            }

            done(null, entry);
          });
        };
      });
      runParallel_1(tasks, (rplError, entries) => {
        if (rplError !== null) {
          callFailureCallback(callback, rplError);
          return;
        }

        callSuccessCallback(callback, entries);
      });
    });
  }

  exports.readdir = readdir;

  function callFailureCallback(callback, error) {
    callback(error);
  }

  function callSuccessCallback(callback, result) {
    callback(null, result);
  }
});

var sync$4 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.readdir = exports.readdirWithFileTypes = exports.read = void 0;

  function read(directory, settings) {
    if (!settings.stats && constants.IS_SUPPORT_READDIR_WITH_FILE_TYPES) {
      return readdirWithFileTypes(directory, settings);
    }

    return readdir(directory, settings);
  }

  exports.read = read;

  function readdirWithFileTypes(directory, settings) {
    const dirents = settings.fs.readdirSync(directory, {
      withFileTypes: true
    });
    return dirents.map(dirent => {
      const entry = {
        dirent,
        name: dirent.name,
        path: common$1.joinPathSegments(directory, dirent.name, settings.pathSegmentSeparator)
      };

      if (entry.dirent.isSymbolicLink() && settings.followSymbolicLinks) {
        try {
          const stats = settings.fs.statSync(entry.path);
          entry.dirent = utils.fs.createDirentFromStats(entry.name, stats);
        } catch (error) {
          if (settings.throwErrorOnBrokenSymbolicLink) {
            throw error;
          }
        }
      }

      return entry;
    });
  }

  exports.readdirWithFileTypes = readdirWithFileTypes;

  function readdir(directory, settings) {
    const names = settings.fs.readdirSync(directory);
    return names.map(name => {
      const entryPath = common$1.joinPathSegments(directory, name, settings.pathSegmentSeparator);
      const stats = out$3.statSync(entryPath, settings.fsStatSettings);
      const entry = {
        name,
        path: entryPath,
        dirent: utils.fs.createDirentFromStats(name, stats)
      };

      if (settings.stats) {
        entry.stats = stats;
      }

      return entry;
    });
  }

  exports.readdir = readdir;
});

var fs_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.createFileSystemAdapter = exports.FILE_SYSTEM_ADAPTER = void 0;
  exports.FILE_SYSTEM_ADAPTER = {
    lstat: fs__default['default'].lstat,
    stat: fs__default['default'].stat,
    lstatSync: fs__default['default'].lstatSync,
    statSync: fs__default['default'].statSync,
    readdir: fs__default['default'].readdir,
    readdirSync: fs__default['default'].readdirSync
  };

  function createFileSystemAdapter(fsMethods) {
    if (fsMethods === undefined) {
      return exports.FILE_SYSTEM_ADAPTER;
    }

    return Object.assign(Object.assign({}, exports.FILE_SYSTEM_ADAPTER), fsMethods);
  }

  exports.createFileSystemAdapter = createFileSystemAdapter;
});

class Settings$1 {
  constructor(_options = {}) {
    this._options = _options;
    this.followSymbolicLinks = this._getValue(this._options.followSymbolicLinks, false);
    this.fs = fs_1.createFileSystemAdapter(this._options.fs);
    this.pathSegmentSeparator = this._getValue(this._options.pathSegmentSeparator, path__default['default'].sep);
    this.stats = this._getValue(this._options.stats, false);
    this.throwErrorOnBrokenSymbolicLink = this._getValue(this._options.throwErrorOnBrokenSymbolicLink, true);
    this.fsStatSettings = new out$3.Settings({
      followSymbolicLink: this.followSymbolicLinks,
      fs: this.fs,
      throwErrorOnBrokenSymbolicLink: this.throwErrorOnBrokenSymbolicLink
    });
  }

  _getValue(option, value) {
    return option !== null && option !== void 0 ? option : value;
  }

}

var _default$l = Settings$1;
var settings$2 = /*#__PURE__*/Object.defineProperty({
  default: _default$l
}, '__esModule', {
  value: true
});

var out$2 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.Settings = exports.scandirSync = exports.scandir = void 0;
  exports.Settings = settings$2.default;

  function scandir(path, optionsOrSettingsOrCallback, callback) {
    if (typeof optionsOrSettingsOrCallback === 'function') {
      async$3.read(path, getSettings(), optionsOrSettingsOrCallback);
      return;
    }

    async$3.read(path, getSettings(optionsOrSettingsOrCallback), callback);
  }

  exports.scandir = scandir;

  function scandirSync(path, optionsOrSettings) {
    const settings = getSettings(optionsOrSettings);
    return sync$4.read(path, settings);
  }

  exports.scandirSync = scandirSync;

  function getSettings(settingsOrOptions = {}) {
    if (settingsOrOptions instanceof settings$2.default) {
      return settingsOrOptions;
    }

    return new settings$2.default(settingsOrOptions);
  }
});

function reusify(Constructor) {
  var head = new Constructor();
  var tail = head;

  function get() {
    var current = head;

    if (current.next) {
      head = current.next;
    } else {
      head = new Constructor();
      tail = head;
    }

    current.next = null;
    return current;
  }

  function release(obj) {
    tail.next = obj;
    tail = obj;
  }

  return {
    get: get,
    release: release
  };
}

var reusify_1 = reusify;

function fastqueue(context, worker, concurrency) {
  if (typeof context === 'function') {
    concurrency = worker;
    worker = context;
    context = null;
  }

  if (concurrency < 1) {
    throw new Error('fastqueue concurrency must be greater than 1');
  }

  var cache = reusify_1(Task);
  var queueHead = null;
  var queueTail = null;
  var _running = 0;
  var errorHandler = null;
  var self = {
    push: push,
    drain: noop,
    saturated: noop,
    pause: pause,
    paused: false,
    concurrency: concurrency,
    running: running,
    resume: resume,
    idle: idle,
    length: length,
    getQueue: getQueue,
    unshift: unshift,
    empty: noop,
    kill: kill,
    killAndDrain: killAndDrain,
    error: error
  };
  return self;

  function running() {
    return _running;
  }

  function pause() {
    self.paused = true;
  }

  function length() {
    var current = queueHead;
    var counter = 0;

    while (current) {
      current = current.next;
      counter++;
    }

    return counter;
  }

  function getQueue() {
    var current = queueHead;
    var tasks = [];

    while (current) {
      tasks.push(current.value);
      current = current.next;
    }

    return tasks;
  }

  function resume() {
    if (!self.paused) return;
    self.paused = false;

    for (var i = 0; i < self.concurrency; i++) {
      _running++;
      release();
    }
  }

  function idle() {
    return _running === 0 && self.length() === 0;
  }

  function push(value, done) {
    var current = cache.get();
    current.context = context;
    current.release = release;
    current.value = value;
    current.callback = done || noop;
    current.errorHandler = errorHandler;

    if (_running === self.concurrency || self.paused) {
      if (queueTail) {
        queueTail.next = current;
        queueTail = current;
      } else {
        queueHead = current;
        queueTail = current;
        self.saturated();
      }
    } else {
      _running++;
      worker.call(context, current.value, current.worked);
    }
  }

  function unshift(value, done) {
    var current = cache.get();
    current.context = context;
    current.release = release;
    current.value = value;
    current.callback = done || noop;

    if (_running === self.concurrency || self.paused) {
      if (queueHead) {
        current.next = queueHead;
        queueHead = current;
      } else {
        queueHead = current;
        queueTail = current;
        self.saturated();
      }
    } else {
      _running++;
      worker.call(context, current.value, current.worked);
    }
  }

  function release(holder) {
    if (holder) {
      cache.release(holder);
    }

    var next = queueHead;

    if (next) {
      if (!self.paused) {
        if (queueTail === queueHead) {
          queueTail = null;
        }

        queueHead = next.next;
        next.next = null;
        worker.call(context, next.value, next.worked);

        if (queueTail === null) {
          self.empty();
        }
      } else {
        _running--;
      }
    } else if (--_running === 0) {
      self.drain();
    }
  }

  function kill() {
    queueHead = null;
    queueTail = null;
    self.drain = noop;
  }

  function killAndDrain() {
    queueHead = null;
    queueTail = null;
    self.drain();
    self.drain = noop;
  }

  function error(handler) {
    errorHandler = handler;
  }
}

function noop() {}

function Task() {
  this.value = null;
  this.callback = noop;
  this.next = null;
  this.release = noop;
  this.context = null;
  this.errorHandler = null;
  var self = this;

  this.worked = function worked(err, result) {
    var callback = self.callback;
    var errorHandler = self.errorHandler;
    var val = self.value;
    self.value = null;
    self.callback = noop;

    if (self.errorHandler) {
      errorHandler(err, val);
    }

    callback.call(self.context, err, result);
    self.release(self);
  };
}

function queueAsPromised(context, worker, concurrency) {
  if (typeof context === 'function') {
    concurrency = worker;
    worker = context;
    context = null;
  }

  function asyncWrapper(arg, cb) {
    worker.call(this, arg).then(function (res) {
      cb(null, res);
    }, cb);
  }

  var queue = fastqueue(context, asyncWrapper, concurrency);
  var pushCb = queue.push;
  var unshiftCb = queue.unshift;
  queue.push = push;
  queue.unshift = unshift;
  return queue;

  function push(value) {
    return new Promise(function (resolve, reject) {
      pushCb(value, function (err, result) {
        if (err) {
          reject(err);
          return;
        }

        resolve(result);
      });
    });
  }

  function unshift(value) {
    return new Promise(function (resolve, reject) {
      unshiftCb(value, function (err, result) {
        if (err) {
          reject(err);
          return;
        }

        resolve(result);
      });
    });
  }
}

var queue = fastqueue;
var promise = queueAsPromised;
queue.promise = promise;

var common = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.joinPathSegments = exports.replacePathSegmentSeparator = exports.isAppliedFilter = exports.isFatalError = void 0;

  function isFatalError(settings, error) {
    if (settings.errorFilter === null) {
      return true;
    }

    return !settings.errorFilter(error);
  }

  exports.isFatalError = isFatalError;

  function isAppliedFilter(filter, value) {
    return filter === null || filter(value);
  }

  exports.isAppliedFilter = isAppliedFilter;

  function replacePathSegmentSeparator(filepath, separator) {
    return filepath.split(/[/\\]/).join(separator);
  }

  exports.replacePathSegmentSeparator = replacePathSegmentSeparator;

  function joinPathSegments(a, b, separator) {
    if (a === '') {
      return b;
    }
    /**
     * The correct handling of cases when the first segment is a root (`/`, `C:/`) or UNC path (`//?/C:/`).
     */


    if (a.endsWith(separator)) {
      return a + b;
    }

    return a + separator + b;
  }

  exports.joinPathSegments = joinPathSegments;
});

class Reader$1 {
  constructor(_root, _settings) {
    this._root = _root;
    this._settings = _settings;
    this._root = common.replacePathSegmentSeparator(_root, _settings.pathSegmentSeparator);
  }

}

var _default$k = Reader$1;
var reader$1 = /*#__PURE__*/Object.defineProperty({
  default: _default$k
}, '__esModule', {
  value: true
});

class AsyncReader extends reader$1.default {
  constructor(_root, _settings) {
    super(_root, _settings);
    this._settings = _settings;
    this._scandir = out$2.scandir;
    this._emitter = new events_1__default['default'].EventEmitter();
    this._queue = queue(this._worker.bind(this), this._settings.concurrency);
    this._isFatalError = false;
    this._isDestroyed = false;

    this._queue.drain = () => {
      if (!this._isFatalError) {
        this._emitter.emit('end');
      }
    };
  }

  read() {
    this._isFatalError = false;
    this._isDestroyed = false;
    setImmediate(() => {
      this._pushToQueue(this._root, this._settings.basePath);
    });
    return this._emitter;
  }

  get isDestroyed() {
    return this._isDestroyed;
  }

  destroy() {
    if (this._isDestroyed) {
      throw new Error('The reader is already destroyed');
    }

    this._isDestroyed = true;

    this._queue.killAndDrain();
  }

  onEntry(callback) {
    this._emitter.on('entry', callback);
  }

  onError(callback) {
    this._emitter.once('error', callback);
  }

  onEnd(callback) {
    this._emitter.once('end', callback);
  }

  _pushToQueue(directory, base) {
    const queueItem = {
      directory,
      base
    };

    this._queue.push(queueItem, error => {
      if (error !== null) {
        this._handleError(error);
      }
    });
  }

  _worker(item, done) {
    this._scandir(item.directory, this._settings.fsScandirSettings, (error, entries) => {
      if (error !== null) {
        done(error, undefined);
        return;
      }

      for (const entry of entries) {
        this._handleEntry(entry, item.base);
      }

      done(null, undefined);
    });
  }

  _handleError(error) {
    if (this._isDestroyed || !common.isFatalError(this._settings, error)) {
      return;
    }

    this._isFatalError = true;
    this._isDestroyed = true;

    this._emitter.emit('error', error);
  }

  _handleEntry(entry, base) {
    if (this._isDestroyed || this._isFatalError) {
      return;
    }

    const fullpath = entry.path;

    if (base !== undefined) {
      entry.path = common.joinPathSegments(base, entry.name, this._settings.pathSegmentSeparator);
    }

    if (common.isAppliedFilter(this._settings.entryFilter, entry)) {
      this._emitEntry(entry);
    }

    if (entry.dirent.isDirectory() && common.isAppliedFilter(this._settings.deepFilter, entry)) {
      this._pushToQueue(fullpath, entry.path);
    }
  }

  _emitEntry(entry) {
    this._emitter.emit('entry', entry);
  }

}

var _default$j = AsyncReader;
var async$2 = /*#__PURE__*/Object.defineProperty({
  default: _default$j
}, '__esModule', {
  value: true
});

class AsyncProvider {
  constructor(_root, _settings) {
    this._root = _root;
    this._settings = _settings;
    this._reader = new async$2.default(this._root, this._settings);
    this._storage = new Set();
  }

  read(callback) {
    this._reader.onError(error => {
      callFailureCallback(callback, error);
    });

    this._reader.onEntry(entry => {
      this._storage.add(entry);
    });

    this._reader.onEnd(() => {
      callSuccessCallback(callback, [...this._storage]);
    });

    this._reader.read();
  }

}

var _default$i = AsyncProvider;

function callFailureCallback(callback, error) {
  callback(error);
}

function callSuccessCallback(callback, entries) {
  callback(null, entries);
}

var async$1 = /*#__PURE__*/Object.defineProperty({
  default: _default$i
}, '__esModule', {
  value: true
});

class StreamProvider {
  constructor(_root, _settings) {
    this._root = _root;
    this._settings = _settings;
    this._reader = new async$2.default(this._root, this._settings);
    this._stream = new stream_1__default['default'].Readable({
      objectMode: true,
      read: () => {},
      destroy: () => {
        if (!this._reader.isDestroyed) {
          this._reader.destroy();
        }
      }
    });
  }

  read() {
    this._reader.onError(error => {
      this._stream.emit('error', error);
    });

    this._reader.onEntry(entry => {
      this._stream.push(entry);
    });

    this._reader.onEnd(() => {
      this._stream.push(null);
    });

    this._reader.read();

    return this._stream;
  }

}

var _default$h = StreamProvider;
var stream$2 = /*#__PURE__*/Object.defineProperty({
  default: _default$h
}, '__esModule', {
  value: true
});

class SyncReader extends reader$1.default {
  constructor() {
    super(...arguments);
    this._scandir = out$2.scandirSync;
    this._storage = new Set();
    this._queue = new Set();
  }

  read() {
    this._pushToQueue(this._root, this._settings.basePath);

    this._handleQueue();

    return [...this._storage];
  }

  _pushToQueue(directory, base) {
    this._queue.add({
      directory,
      base
    });
  }

  _handleQueue() {
    for (const item of this._queue.values()) {
      this._handleDirectory(item.directory, item.base);
    }
  }

  _handleDirectory(directory, base) {
    try {
      const entries = this._scandir(directory, this._settings.fsScandirSettings);

      for (const entry of entries) {
        this._handleEntry(entry, base);
      }
    } catch (error) {
      this._handleError(error);
    }
  }

  _handleError(error) {
    if (!common.isFatalError(this._settings, error)) {
      return;
    }

    throw error;
  }

  _handleEntry(entry, base) {
    const fullpath = entry.path;

    if (base !== undefined) {
      entry.path = common.joinPathSegments(base, entry.name, this._settings.pathSegmentSeparator);
    }

    if (common.isAppliedFilter(this._settings.entryFilter, entry)) {
      this._pushToStorage(entry);
    }

    if (entry.dirent.isDirectory() && common.isAppliedFilter(this._settings.deepFilter, entry)) {
      this._pushToQueue(fullpath, entry.path);
    }
  }

  _pushToStorage(entry) {
    this._storage.add(entry);
  }

}

var _default$g = SyncReader;
var sync$3 = /*#__PURE__*/Object.defineProperty({
  default: _default$g
}, '__esModule', {
  value: true
});

class SyncProvider {
  constructor(_root, _settings) {
    this._root = _root;
    this._settings = _settings;
    this._reader = new sync$3.default(this._root, this._settings);
  }

  read() {
    return this._reader.read();
  }

}

var _default$f = SyncProvider;
var sync$2 = /*#__PURE__*/Object.defineProperty({
  default: _default$f
}, '__esModule', {
  value: true
});

class Settings {
  constructor(_options = {}) {
    this._options = _options;
    this.basePath = this._getValue(this._options.basePath, undefined);
    this.concurrency = this._getValue(this._options.concurrency, Number.POSITIVE_INFINITY);
    this.deepFilter = this._getValue(this._options.deepFilter, null);
    this.entryFilter = this._getValue(this._options.entryFilter, null);
    this.errorFilter = this._getValue(this._options.errorFilter, null);
    this.pathSegmentSeparator = this._getValue(this._options.pathSegmentSeparator, path__default['default'].sep);
    this.fsScandirSettings = new out$2.Settings({
      followSymbolicLinks: this._options.followSymbolicLinks,
      fs: this._options.fs,
      pathSegmentSeparator: this._options.pathSegmentSeparator,
      stats: this._options.stats,
      throwErrorOnBrokenSymbolicLink: this._options.throwErrorOnBrokenSymbolicLink
    });
  }

  _getValue(option, value) {
    return option !== null && option !== void 0 ? option : value;
  }

}

var _default$e = Settings;
var settings$1 = /*#__PURE__*/Object.defineProperty({
  default: _default$e
}, '__esModule', {
  value: true
});

var out$1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.Settings = exports.walkStream = exports.walkSync = exports.walk = void 0;
  exports.Settings = settings$1.default;

  function walk(directory, optionsOrSettingsOrCallback, callback) {
    if (typeof optionsOrSettingsOrCallback === 'function') {
      new async$1.default(directory, getSettings()).read(optionsOrSettingsOrCallback);
      return;
    }

    new async$1.default(directory, getSettings(optionsOrSettingsOrCallback)).read(callback);
  }

  exports.walk = walk;

  function walkSync(directory, optionsOrSettings) {
    const settings = getSettings(optionsOrSettings);
    const provider = new sync$2.default(directory, settings);
    return provider.read();
  }

  exports.walkSync = walkSync;

  function walkStream(directory, optionsOrSettings) {
    const settings = getSettings(optionsOrSettings);
    const provider = new stream$2.default(directory, settings);
    return provider.read();
  }

  exports.walkStream = walkStream;

  function getSettings(settingsOrOptions = {}) {
    if (settingsOrOptions instanceof settings$1.default) {
      return settingsOrOptions;
    }

    return new settings$1.default(settingsOrOptions);
  }
});

class Reader {
  constructor(_settings) {
    this._settings = _settings;
    this._fsStatSettings = new out$3.Settings({
      followSymbolicLink: this._settings.followSymbolicLinks,
      fs: this._settings.fs,
      throwErrorOnBrokenSymbolicLink: this._settings.followSymbolicLinks
    });
  }

  _getFullEntryPath(filepath) {
    return path__default['default'].resolve(this._settings.cwd, filepath);
  }

  _makeEntry(stats, pattern) {
    const entry = {
      name: pattern,
      path: pattern,
      dirent: utils$1.fs.createDirentFromStats(pattern, stats)
    };

    if (this._settings.stats) {
      entry.stats = stats;
    }

    return entry;
  }

  _isFatalError(error) {
    return !utils$1.errno.isEnoentCodeError(error) && !this._settings.suppressErrors;
  }

}

var _default$d = Reader;
var reader = /*#__PURE__*/Object.defineProperty({
  default: _default$d
}, '__esModule', {
  value: true
});

class ReaderStream extends reader.default {
  constructor() {
    super(...arguments);
    this._walkStream = out$1.walkStream;
    this._stat = out$3.stat;
  }

  dynamic(root, options) {
    return this._walkStream(root, options);
  }

  static(patterns, options) {
    const filepaths = patterns.map(this._getFullEntryPath, this);
    const stream = new stream_1__default['default'].PassThrough({
      objectMode: true
    });

    stream._write = (index, _enc, done) => {
      return this._getEntry(filepaths[index], patterns[index], options).then(entry => {
        if (entry !== null && options.entryFilter(entry)) {
          stream.push(entry);
        }

        if (index === filepaths.length - 1) {
          stream.end();
        }

        done();
      }).catch(done);
    };

    for (let i = 0; i < filepaths.length; i++) {
      stream.write(i);
    }

    return stream;
  }

  _getEntry(filepath, pattern, options) {
    return this._getStat(filepath).then(stats => this._makeEntry(stats, pattern)).catch(error => {
      if (options.errorFilter(error)) {
        return null;
      }

      throw error;
    });
  }

  _getStat(filepath) {
    return new Promise((resolve, reject) => {
      this._stat(filepath, this._fsStatSettings, (error, stats) => {
        return error === null ? resolve(stats) : reject(error);
      });
    });
  }

}

var _default$c = ReaderStream;
var stream$1 = /*#__PURE__*/Object.defineProperty({
  default: _default$c
}, '__esModule', {
  value: true
});

class Matcher {
  constructor(_patterns, _settings, _micromatchOptions) {
    this._patterns = _patterns;
    this._settings = _settings;
    this._micromatchOptions = _micromatchOptions;
    this._storage = [];

    this._fillStorage();
  }

  _fillStorage() {
    /**
     * The original pattern may include `{,*,**,a/*}`, which will lead to problems with matching (unresolved level).
     * So, before expand patterns with brace expansion into separated patterns.
     */
    const patterns = utils$1.pattern.expandPatternsWithBraceExpansion(this._patterns);

    for (const pattern of patterns) {
      const segments = this._getPatternSegments(pattern);

      const sections = this._splitSegmentsIntoSections(segments);

      this._storage.push({
        complete: sections.length <= 1,
        pattern,
        segments,
        sections
      });
    }
  }

  _getPatternSegments(pattern) {
    const parts = utils$1.pattern.getPatternParts(pattern, this._micromatchOptions);
    return parts.map(part => {
      const dynamic = utils$1.pattern.isDynamicPattern(part, this._settings);

      if (!dynamic) {
        return {
          dynamic: false,
          pattern: part
        };
      }

      return {
        dynamic: true,
        pattern: part,
        patternRe: utils$1.pattern.makeRe(part, this._micromatchOptions)
      };
    });
  }

  _splitSegmentsIntoSections(segments) {
    return utils$1.array.splitWhen(segments, segment => segment.dynamic && utils$1.pattern.hasGlobStar(segment.pattern));
  }

}

var _default$b = Matcher;
var matcher = /*#__PURE__*/Object.defineProperty({
  default: _default$b
}, '__esModule', {
  value: true
});

class PartialMatcher extends matcher.default {
  match(filepath) {
    const parts = filepath.split('/');
    const levels = parts.length;

    const patterns = this._storage.filter(info => !info.complete || info.segments.length > levels);

    for (const pattern of patterns) {
      const section = pattern.sections[0];
      /**
       * In this case, the pattern has a globstar and we must read all directories unconditionally,
       * but only if the level has reached the end of the first group.
       *
       * fixtures/{a,b}/**
       *  ^ true/false  ^ always true
      */

      if (!pattern.complete && levels > section.length) {
        return true;
      }

      const match = parts.every((part, index) => {
        const segment = pattern.segments[index];

        if (segment.dynamic && segment.patternRe.test(part)) {
          return true;
        }

        if (!segment.dynamic && segment.pattern === part) {
          return true;
        }

        return false;
      });

      if (match) {
        return true;
      }
    }

    return false;
  }

}

var _default$a = PartialMatcher;
var partial = /*#__PURE__*/Object.defineProperty({
  default: _default$a
}, '__esModule', {
  value: true
});

class DeepFilter {
  constructor(_settings, _micromatchOptions) {
    this._settings = _settings;
    this._micromatchOptions = _micromatchOptions;
  }

  getFilter(basePath, positive, negative) {
    const matcher = this._getMatcher(positive);

    const negativeRe = this._getNegativePatternsRe(negative);

    return entry => this._filter(basePath, entry, matcher, negativeRe);
  }

  _getMatcher(patterns) {
    return new partial.default(patterns, this._settings, this._micromatchOptions);
  }

  _getNegativePatternsRe(patterns) {
    const affectDepthOfReadingPatterns = patterns.filter(utils$1.pattern.isAffectDepthOfReadingPattern);
    return utils$1.pattern.convertPatternsToRe(affectDepthOfReadingPatterns, this._micromatchOptions);
  }

  _filter(basePath, entry, matcher, negativeRe) {
    if (this._isSkippedByDeep(basePath, entry.path)) {
      return false;
    }

    if (this._isSkippedSymbolicLink(entry)) {
      return false;
    }

    const filepath = utils$1.path.removeLeadingDotSegment(entry.path);

    if (this._isSkippedByPositivePatterns(filepath, matcher)) {
      return false;
    }

    return this._isSkippedByNegativePatterns(filepath, negativeRe);
  }

  _isSkippedByDeep(basePath, entryPath) {
    /**
     * Avoid unnecessary depth calculations when it doesn't matter.
     */
    if (this._settings.deep === Infinity) {
      return false;
    }

    return this._getEntryLevel(basePath, entryPath) >= this._settings.deep;
  }

  _getEntryLevel(basePath, entryPath) {
    const entryPathDepth = entryPath.split('/').length;

    if (basePath === '') {
      return entryPathDepth;
    }

    const basePathDepth = basePath.split('/').length;
    return entryPathDepth - basePathDepth;
  }

  _isSkippedSymbolicLink(entry) {
    return !this._settings.followSymbolicLinks && entry.dirent.isSymbolicLink();
  }

  _isSkippedByPositivePatterns(entryPath, matcher) {
    return !this._settings.baseNameMatch && !matcher.match(entryPath);
  }

  _isSkippedByNegativePatterns(entryPath, patternsRe) {
    return !utils$1.pattern.matchAny(entryPath, patternsRe);
  }

}

var _default$9 = DeepFilter;
var deep = /*#__PURE__*/Object.defineProperty({
  default: _default$9
}, '__esModule', {
  value: true
});

class EntryFilter {
  constructor(_settings, _micromatchOptions) {
    this._settings = _settings;
    this._micromatchOptions = _micromatchOptions;
    this.index = new Map();
  }

  getFilter(positive, negative) {
    const positiveRe = utils$1.pattern.convertPatternsToRe(positive, this._micromatchOptions);
    const negativeRe = utils$1.pattern.convertPatternsToRe(negative, this._micromatchOptions);
    return entry => this._filter(entry, positiveRe, negativeRe);
  }

  _filter(entry, positiveRe, negativeRe) {
    if (this._settings.unique && this._isDuplicateEntry(entry)) {
      return false;
    }

    if (this._onlyFileFilter(entry) || this._onlyDirectoryFilter(entry)) {
      return false;
    }

    if (this._isSkippedByAbsoluteNegativePatterns(entry.path, negativeRe)) {
      return false;
    }

    const filepath = this._settings.baseNameMatch ? entry.name : entry.path;
    const isMatched = this._isMatchToPatterns(filepath, positiveRe) && !this._isMatchToPatterns(entry.path, negativeRe);

    if (this._settings.unique && isMatched) {
      this._createIndexRecord(entry);
    }

    return isMatched;
  }

  _isDuplicateEntry(entry) {
    return this.index.has(entry.path);
  }

  _createIndexRecord(entry) {
    this.index.set(entry.path, undefined);
  }

  _onlyFileFilter(entry) {
    return this._settings.onlyFiles && !entry.dirent.isFile();
  }

  _onlyDirectoryFilter(entry) {
    return this._settings.onlyDirectories && !entry.dirent.isDirectory();
  }

  _isSkippedByAbsoluteNegativePatterns(entryPath, patternsRe) {
    if (!this._settings.absolute) {
      return false;
    }

    const fullpath = utils$1.path.makeAbsolute(this._settings.cwd, entryPath);
    return utils$1.pattern.matchAny(fullpath, patternsRe);
  }

  _isMatchToPatterns(entryPath, patternsRe) {
    const filepath = utils$1.path.removeLeadingDotSegment(entryPath);
    return utils$1.pattern.matchAny(filepath, patternsRe);
  }

}

var _default$8 = EntryFilter;
var entry$1 = /*#__PURE__*/Object.defineProperty({
  default: _default$8
}, '__esModule', {
  value: true
});

class ErrorFilter {
  constructor(_settings) {
    this._settings = _settings;
  }

  getFilter() {
    return error => this._isNonFatalError(error);
  }

  _isNonFatalError(error) {
    return utils$1.errno.isEnoentCodeError(error) || this._settings.suppressErrors;
  }

}

var _default$7 = ErrorFilter;
var error = /*#__PURE__*/Object.defineProperty({
  default: _default$7
}, '__esModule', {
  value: true
});

class EntryTransformer {
  constructor(_settings) {
    this._settings = _settings;
  }

  getTransformer() {
    return entry => this._transform(entry);
  }

  _transform(entry) {
    let filepath = entry.path;

    if (this._settings.absolute) {
      filepath = utils$1.path.makeAbsolute(this._settings.cwd, filepath);
      filepath = utils$1.path.unixify(filepath);
    }

    if (this._settings.markDirectories && entry.dirent.isDirectory()) {
      filepath += '/';
    }

    if (!this._settings.objectMode) {
      return filepath;
    }

    return Object.assign(Object.assign({}, entry), {
      path: filepath
    });
  }

}

var _default$6 = EntryTransformer;
var entry = /*#__PURE__*/Object.defineProperty({
  default: _default$6
}, '__esModule', {
  value: true
});

class Provider {
  constructor(_settings) {
    this._settings = _settings;
    this.errorFilter = new error.default(this._settings);
    this.entryFilter = new entry$1.default(this._settings, this._getMicromatchOptions());
    this.deepFilter = new deep.default(this._settings, this._getMicromatchOptions());
    this.entryTransformer = new entry.default(this._settings);
  }

  _getRootDirectory(task) {
    return path__default['default'].resolve(this._settings.cwd, task.base);
  }

  _getReaderOptions(task) {
    const basePath = task.base === '.' ? '' : task.base;
    return {
      basePath,
      pathSegmentSeparator: '/',
      concurrency: this._settings.concurrency,
      deepFilter: this.deepFilter.getFilter(basePath, task.positive, task.negative),
      entryFilter: this.entryFilter.getFilter(task.positive, task.negative),
      errorFilter: this.errorFilter.getFilter(),
      followSymbolicLinks: this._settings.followSymbolicLinks,
      fs: this._settings.fs,
      stats: this._settings.stats,
      throwErrorOnBrokenSymbolicLink: this._settings.throwErrorOnBrokenSymbolicLink,
      transform: this.entryTransformer.getTransformer()
    };
  }

  _getMicromatchOptions() {
    return {
      dot: this._settings.dot,
      matchBase: this._settings.baseNameMatch,
      nobrace: !this._settings.braceExpansion,
      nocase: !this._settings.caseSensitiveMatch,
      noext: !this._settings.extglob,
      noglobstar: !this._settings.globstar,
      posix: true,
      strictSlashes: false
    };
  }

}

var _default$5 = Provider;
var provider = /*#__PURE__*/Object.defineProperty({
  default: _default$5
}, '__esModule', {
  value: true
});

class ProviderAsync extends provider.default {
  constructor() {
    super(...arguments);
    this._reader = new stream$1.default(this._settings);
  }

  read(task) {
    const root = this._getRootDirectory(task);

    const options = this._getReaderOptions(task);

    const entries = [];
    return new Promise((resolve, reject) => {
      const stream = this.api(root, task, options);
      stream.once('error', reject);
      stream.on('data', entry => entries.push(options.transform(entry)));
      stream.once('end', () => resolve(entries));
    });
  }

  api(root, task, options) {
    if (task.dynamic) {
      return this._reader.dynamic(root, options);
    }

    return this._reader.static(task.patterns, options);
  }

}

var _default$4 = ProviderAsync;
var async = /*#__PURE__*/Object.defineProperty({
  default: _default$4
}, '__esModule', {
  value: true
});

class ProviderStream extends provider.default {
  constructor() {
    super(...arguments);
    this._reader = new stream$1.default(this._settings);
  }

  read(task) {
    const root = this._getRootDirectory(task);

    const options = this._getReaderOptions(task);

    const source = this.api(root, task, options);
    const destination = new stream_1__default['default'].Readable({
      objectMode: true,
      read: () => {}
    });
    source.once('error', error => destination.emit('error', error)).on('data', entry => destination.emit('data', options.transform(entry))).once('end', () => destination.emit('end'));
    destination.once('close', () => source.destroy());
    return destination;
  }

  api(root, task, options) {
    if (task.dynamic) {
      return this._reader.dynamic(root, options);
    }

    return this._reader.static(task.patterns, options);
  }

}

var _default$3 = ProviderStream;
var stream = /*#__PURE__*/Object.defineProperty({
  default: _default$3
}, '__esModule', {
  value: true
});

class ReaderSync extends reader.default {
  constructor() {
    super(...arguments);
    this._walkSync = out$1.walkSync;
    this._statSync = out$3.statSync;
  }

  dynamic(root, options) {
    return this._walkSync(root, options);
  }

  static(patterns, options) {
    const entries = [];

    for (const pattern of patterns) {
      const filepath = this._getFullEntryPath(pattern);

      const entry = this._getEntry(filepath, pattern, options);

      if (entry === null || !options.entryFilter(entry)) {
        continue;
      }

      entries.push(entry);
    }

    return entries;
  }

  _getEntry(filepath, pattern, options) {
    try {
      const stats = this._getStat(filepath);

      return this._makeEntry(stats, pattern);
    } catch (error) {
      if (options.errorFilter(error)) {
        return null;
      }

      throw error;
    }
  }

  _getStat(filepath) {
    return this._statSync(filepath, this._fsStatSettings);
  }

}

var _default$2 = ReaderSync;
var sync$1 = /*#__PURE__*/Object.defineProperty({
  default: _default$2
}, '__esModule', {
  value: true
});

class ProviderSync extends provider.default {
  constructor() {
    super(...arguments);
    this._reader = new sync$1.default(this._settings);
  }

  read(task) {
    const root = this._getRootDirectory(task);

    const options = this._getReaderOptions(task);

    const entries = this.api(root, task, options);
    return entries.map(options.transform);
  }

  api(root, task, options) {
    if (task.dynamic) {
      return this._reader.dynamic(root, options);
    }

    return this._reader.static(task.patterns, options);
  }

}

var _default$1 = ProviderSync;
var sync = /*#__PURE__*/Object.defineProperty({
  default: _default$1
}, '__esModule', {
  value: true
});

var settings = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.DEFAULT_FILE_SYSTEM_ADAPTER = void 0;
  /**
   * The `os.cpus` method can return zero. We expect the number of cores to be greater than zero.
   * https://github.com/nodejs/node/blob/7faeddf23a98c53896f8b574a6e66589e8fb1eb8/lib/os.js#L106-L107
   */

  const CPU_COUNT = Math.max(os__default['default'].cpus().length, 1);
  exports.DEFAULT_FILE_SYSTEM_ADAPTER = {
    lstat: fs__default['default'].lstat,
    lstatSync: fs__default['default'].lstatSync,
    stat: fs__default['default'].stat,
    statSync: fs__default['default'].statSync,
    readdir: fs__default['default'].readdir,
    readdirSync: fs__default['default'].readdirSync
  };

  class Settings {
    constructor(_options = {}) {
      this._options = _options;
      this.absolute = this._getValue(this._options.absolute, false);
      this.baseNameMatch = this._getValue(this._options.baseNameMatch, false);
      this.braceExpansion = this._getValue(this._options.braceExpansion, true);
      this.caseSensitiveMatch = this._getValue(this._options.caseSensitiveMatch, true);
      this.concurrency = this._getValue(this._options.concurrency, CPU_COUNT);
      this.cwd = this._getValue(this._options.cwd, process.cwd());
      this.deep = this._getValue(this._options.deep, Infinity);
      this.dot = this._getValue(this._options.dot, false);
      this.extglob = this._getValue(this._options.extglob, true);
      this.followSymbolicLinks = this._getValue(this._options.followSymbolicLinks, true);
      this.fs = this._getFileSystemMethods(this._options.fs);
      this.globstar = this._getValue(this._options.globstar, true);
      this.ignore = this._getValue(this._options.ignore, []);
      this.markDirectories = this._getValue(this._options.markDirectories, false);
      this.objectMode = this._getValue(this._options.objectMode, false);
      this.onlyDirectories = this._getValue(this._options.onlyDirectories, false);
      this.onlyFiles = this._getValue(this._options.onlyFiles, true);
      this.stats = this._getValue(this._options.stats, false);
      this.suppressErrors = this._getValue(this._options.suppressErrors, false);
      this.throwErrorOnBrokenSymbolicLink = this._getValue(this._options.throwErrorOnBrokenSymbolicLink, false);
      this.unique = this._getValue(this._options.unique, true);

      if (this.onlyDirectories) {
        this.onlyFiles = false;
      }

      if (this.stats) {
        this.objectMode = true;
      }
    }

    _getValue(option, value) {
      return option === undefined ? value : option;
    }

    _getFileSystemMethods(methods = {}) {
      return Object.assign(Object.assign({}, exports.DEFAULT_FILE_SYSTEM_ADAPTER), methods);
    }

  }

  exports.default = Settings;
});

async function FastGlob(source, options) {
  assertPatternsInput(source);
  const works = getWorks(source, async.default, options);
  const result = await Promise.all(works);
  return utils$1.array.flatten(result);
} // https://github.com/typescript-eslint/typescript-eslint/issues/60
// eslint-disable-next-line no-redeclare


(function (FastGlob) {
  function sync$1(source, options) {
    assertPatternsInput(source);
    const works = getWorks(source, sync.default, options);
    return utils$1.array.flatten(works);
  }

  FastGlob.sync = sync$1;

  function stream$1(source, options) {
    assertPatternsInput(source);
    const works = getWorks(source, stream.default, options);
    /**
     * The stream returned by the provider cannot work with an asynchronous iterator.
     * To support asynchronous iterators, regardless of the number of tasks, we always multiplex streams.
     * This affects performance (+25%). I don't see best solution right now.
     */

    return utils$1.stream.merge(works);
  }

  FastGlob.stream = stream$1;

  function generateTasks(source, options) {
    assertPatternsInput(source);
    const patterns = [].concat(source);
    const settings$1 = new settings.default(options);
    return tasks.generate(patterns, settings$1);
  }

  FastGlob.generateTasks = generateTasks;

  function isDynamicPattern(source, options) {
    assertPatternsInput(source);
    const settings$1 = new settings.default(options);
    return utils$1.pattern.isDynamicPattern(source, settings$1);
  }

  FastGlob.isDynamicPattern = isDynamicPattern;

  function escapePath(source) {
    assertPatternsInput(source);
    return utils$1.path.escape(source);
  }

  FastGlob.escapePath = escapePath;
})(FastGlob || (FastGlob = {}));

function getWorks(source, _Provider, options) {
  const patterns = [].concat(source);
  const settings$1 = new settings.default(options);
  const tasks$1 = tasks.generate(patterns, settings$1);
  const provider = new _Provider(settings$1);
  return tasks$1.map(provider.read, provider);
}

function assertPatternsInput(input) {
  const source = [].concat(input);
  const isValidSource = source.every(item => utils$1.string.isString(item) && !utils$1.string.isEmpty(item));

  if (!isValidSource) {
    throw new TypeError('Patterns must be a string (non empty) or an array of strings');
  }
}

var out = FastGlob;

const {
  promises: fs$1
} = fs__default['default'];
/** @typedef {import('./context').Context} Context */

/**
 * @param {Context} context
 */

async function* expandPatterns$1(context) {
  const cwd = process.cwd();
  const seen = new Set();
  let noResults = true;

  for await (const pathOrError of expandPatternsInternal(context)) {
    noResults = false;

    if (typeof pathOrError !== "string") {
      yield pathOrError;
      continue;
    }

    const relativePath = path__default['default'].relative(cwd, pathOrError); // filter out duplicates

    if (seen.has(relativePath)) {
      continue;
    }

    seen.add(relativePath);
    yield relativePath;
  }

  if (noResults && context.argv["error-on-unmatched-pattern"] !== false) {
    // If there was no files and no other errors, let's yield a general error.
    yield {
      error: `No matching files. Patterns: ${context.filePatterns.join(" ")}`
    };
  }
}
/**
 * @param {Context} context
 */


async function* expandPatternsInternal(context) {
  // Ignores files in version control systems directories and `node_modules`
  const silentlyIgnoredDirs = [".git", ".svn", ".hg"];

  if (context.argv["with-node-modules"] !== true) {
    silentlyIgnoredDirs.push("node_modules");
  }

  const globOptions = {
    dot: true,
    ignore: silentlyIgnoredDirs.map(dir => "**/" + dir)
  };
  let supportedFilesGlob;
  const cwd = process.cwd();
  /** @type {Array<{ type: 'file' | 'dir' | 'glob'; glob: string; input: string; }>} */

  const entries = [];

  for (const pattern of context.filePatterns) {
    const absolutePath = path__default['default'].resolve(cwd, pattern);

    if (containsIgnoredPathSegment(absolutePath, cwd, silentlyIgnoredDirs)) {
      continue;
    }

    const stat = await statSafe(absolutePath);

    if (stat) {
      if (stat.isFile()) {
        entries.push({
          type: "file",
          glob: escapePathForGlob(fixWindowsSlashes$1(pattern)),
          input: pattern
        });
      } else if (stat.isDirectory()) {
        /*
        1. Remove trailing `/`, `fast-glob` can't find files for `src//*.js` pattern
        2. Cleanup dirname, when glob `src/../*.js` pattern with `fast-glob`,
          it returns files like 'src/../index.js'
        */
        const relativePath = path__default['default'].relative(cwd, absolutePath) || ".";
        entries.push({
          type: "dir",
          glob: escapePathForGlob(fixWindowsSlashes$1(relativePath)) + "/" + getSupportedFilesGlob(),
          input: pattern
        });
      }
    } else if (pattern[0] === "!") {
      // convert negative patterns to `ignore` entries
      globOptions.ignore.push(fixWindowsSlashes$1(pattern.slice(1)));
    } else {
      entries.push({
        type: "glob",
        glob: fixWindowsSlashes$1(pattern),
        input: pattern
      });
    }
  }

  for (const {
    type,
    glob,
    input
  } of entries) {
    let result;

    try {
      result = await out(glob, globOptions);
    } catch ({
      message
    }) {
      /* istanbul ignore next */
      yield {
        error: `${errorMessages.globError[type]}: ${input}\n${message}`
      };
      /* istanbul ignore next */

      continue;
    }

    if (result.length === 0) {
      if (context.argv["error-on-unmatched-pattern"] !== false) {
        yield {
          error: `${errorMessages.emptyResults[type]}: "${input}".`
        };
      }
    } else {
      yield* sortPaths(result);
    }
  }

  function getSupportedFilesGlob() {
    if (!supportedFilesGlob) {
      const extensions = context.languages.flatMap(lang => lang.extensions || []);
      const filenames = context.languages.flatMap(lang => lang.filenames || []);
      supportedFilesGlob = `**/{${[...extensions.map(ext => "*" + (ext[0] === "." ? ext : "." + ext)), ...filenames]}}`;
    }

    return supportedFilesGlob;
  }
}

const errorMessages = {
  globError: {
    file: "Unable to resolve file",
    dir: "Unable to expand directory",
    glob: "Unable to expand glob pattern"
  },
  emptyResults: {
    file: "Explicitly specified file was ignored due to negative glob patterns",
    dir: "No supported files were found in the directory",
    glob: "No files matching the pattern were found"
  }
};
/**
 * @param {string} absolutePath
 * @param {string} cwd
 * @param {string[]} ignoredDirectories
 */

function containsIgnoredPathSegment(absolutePath, cwd, ignoredDirectories) {
  return path__default['default'].relative(cwd, absolutePath).split(path__default['default'].sep).some(dir => ignoredDirectories.includes(dir));
}
/**
 * @param {string[]} paths
 */


function sortPaths(paths) {
  return paths.sort((a, b) => a.localeCompare(b));
}
/**
 * Get stats of a given path.
 * @param {string} filePath The path to target file.
 * @returns {Promise<import('fs').Stats | undefined>} The stats.
 */


async function statSafe(filePath) {
  try {
    return await fs$1.stat(filePath);
  } catch (error) {
    /* istanbul ignore next */
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}
/**
 * This function should be replaced with `fastGlob.escapePath` when these issues are fixed:
 * - https://github.com/mrmlnc/fast-glob/issues/261
 * - https://github.com/mrmlnc/fast-glob/issues/262
 * @param {string} path
 */


function escapePathForGlob(path) {
  return out.escapePath(path.replace(/\\/g, "\0") // Workaround for fast-glob#262 (part 1)
  ).replace(/\\!/g, "@(!)") // Workaround for fast-glob#261
  .replace(/\0/g, "@(\\\\)"); // Workaround for fast-glob#262 (part 2)
}

const isWindows = path__default['default'].sep === "\\";
/**
 * Using backslashes in globs is probably not okay, but not accepting
 * backslashes as path separators on Windows is even more not okay.
 * https://github.com/prettier/prettier/pull/6776#discussion_r380723717
 * https://github.com/mrmlnc/fast-glob#how-to-write-patterns-on-windows
 * @param {string} pattern
 */

function fixWindowsSlashes$1(pattern) {
  return isWindows ? pattern.replace(/\\/g, "/") : pattern;
}

var expandPatterns_1 = {
  expandPatterns: expandPatterns$1,
  fixWindowsSlashes: fixWindowsSlashes$1
};

var iterators = {};

var ITERATOR$1 = wellKnownSymbol('iterator');
var ArrayPrototype = Array.prototype;

// check on default Array iterator
var isArrayIteratorMethod = function (it) {
  return it !== undefined && (iterators.Array === it || ArrayPrototype[ITERATOR$1] === it);
};

var TO_STRING_TAG$1 = wellKnownSymbol('toStringTag');
var test = {};

test[TO_STRING_TAG$1] = 'z';

var toStringTagSupport = String(test) === '[object z]';

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
// ES3 wrong here
var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (error) { /* empty */ }
};

// getting tag from ES6+ `Object.prototype.toString`
var classof = toStringTagSupport ? classofRaw : function (it) {
  var O, tag, result;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG)) == 'string' ? tag
    // builtinTag case
    : CORRECT_ARGUMENTS ? classofRaw(O)
    // ES3 arguments fallback
    : (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
};

var ITERATOR = wellKnownSymbol('iterator');

var getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR]
    || it['@@iterator']
    || iterators[classof(it)];
};

var iteratorClose = function (iterator) {
  var returnMethod = iterator['return'];
  if (returnMethod !== undefined) {
    return anObject(returnMethod.call(iterator)).value;
  }
};

var Result = function (stopped, result) {
  this.stopped = stopped;
  this.result = result;
};

var iterate = function (iterable, unboundFunction, options) {
  var that = options && options.that;
  var AS_ENTRIES = !!(options && options.AS_ENTRIES);
  var IS_ITERATOR = !!(options && options.IS_ITERATOR);
  var INTERRUPTED = !!(options && options.INTERRUPTED);
  var fn = functionBindContext(unboundFunction, that, 1 + AS_ENTRIES + INTERRUPTED);
  var iterator, iterFn, index, length, result, next, step;

  var stop = function (condition) {
    if (iterator) iteratorClose(iterator);
    return new Result(true, condition);
  };

  var callFn = function (value) {
    if (AS_ENTRIES) {
      anObject(value);
      return INTERRUPTED ? fn(value[0], value[1], stop) : fn(value[0], value[1]);
    } return INTERRUPTED ? fn(value, stop) : fn(value);
  };

  if (IS_ITERATOR) {
    iterator = iterable;
  } else {
    iterFn = getIteratorMethod(iterable);
    if (typeof iterFn != 'function') throw TypeError('Target is not iterable');
    // optimisation for array iterators
    if (isArrayIteratorMethod(iterFn)) {
      for (index = 0, length = toLength(iterable.length); length > index; index++) {
        result = callFn(iterable[index]);
        if (result && result instanceof Result) return result;
      } return new Result(false);
    }
    iterator = iterFn.call(iterable);
  }

  next = iterator.next;
  while (!(step = next.call(iterator)).done) {
    try {
      result = callFn(step.value);
    } catch (error) {
      iteratorClose(iterator);
      throw error;
    }
    if (typeof result == 'object' && result && result instanceof Result) return result;
  } return new Result(false);
};

var createProperty = function (object, key, value) {
  var propertyKey = toPrimitive(key);
  if (propertyKey in object) objectDefineProperty.f(object, propertyKey, createPropertyDescriptor(0, value));
  else object[propertyKey] = value;
};

// `Object.fromEntries` method
// https://github.com/tc39/proposal-object-from-entries
_export({ target: 'Object', stat: true }, {
  fromEntries: function fromEntries(iterable) {
    var obj = {};
    iterate(iterable, function (k, v) {
      createProperty(obj, k, v);
    }, { AS_ENTRIES: true });
    return obj;
  }
});

/*!
 * dashify <https://github.com/jonschlinkert/dashify>
 *
 * Copyright (c) 2015-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

var dashify = (str, options) => {
  if (typeof str !== 'string') throw new TypeError('expected a string');
  return str.trim().replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\W/g, m => /[À-ž]/.test(m) ? m : '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, m => options && options.condense ? '-' : m).toLowerCase();
};

var minimist = function (args, opts) {
  if (!opts) opts = {};
  var flags = {
    bools: {},
    strings: {},
    unknownFn: null
  };

  if (typeof opts['unknown'] === 'function') {
    flags.unknownFn = opts['unknown'];
  }

  if (typeof opts['boolean'] === 'boolean' && opts['boolean']) {
    flags.allBools = true;
  } else {
    [].concat(opts['boolean']).filter(Boolean).forEach(function (key) {
      flags.bools[key] = true;
    });
  }

  var aliases = {};
  Object.keys(opts.alias || {}).forEach(function (key) {
    aliases[key] = [].concat(opts.alias[key]);
    aliases[key].forEach(function (x) {
      aliases[x] = [key].concat(aliases[key].filter(function (y) {
        return x !== y;
      }));
    });
  });
  [].concat(opts.string).filter(Boolean).forEach(function (key) {
    flags.strings[key] = true;

    if (aliases[key]) {
      flags.strings[aliases[key]] = true;
    }
  });
  var defaults = opts['default'] || {};
  var argv = {
    _: []
  };
  Object.keys(flags.bools).forEach(function (key) {
    setArg(key, defaults[key] === undefined ? false : defaults[key]);
  });
  var notFlags = [];

  if (args.indexOf('--') !== -1) {
    notFlags = args.slice(args.indexOf('--') + 1);
    args = args.slice(0, args.indexOf('--'));
  }

  function argDefined(key, arg) {
    return flags.allBools && /^--[^=]+$/.test(arg) || flags.strings[key] || flags.bools[key] || aliases[key];
  }

  function setArg(key, val, arg) {
    if (arg && flags.unknownFn && !argDefined(key, arg)) {
      if (flags.unknownFn(arg) === false) return;
    }

    var value = !flags.strings[key] && isNumber(val) ? Number(val) : val;
    setKey(argv, key.split('.'), value);
    (aliases[key] || []).forEach(function (x) {
      setKey(argv, x.split('.'), value);
    });
  }

  function setKey(obj, keys, value) {
    var o = obj;

    for (var i = 0; i < keys.length - 1; i++) {
      var key = keys[i];
      if (key === '__proto__') return;
      if (o[key] === undefined) o[key] = {};
      if (o[key] === Object.prototype || o[key] === Number.prototype || o[key] === String.prototype) o[key] = {};
      if (o[key] === Array.prototype) o[key] = [];
      o = o[key];
    }

    var key = keys[keys.length - 1];
    if (key === '__proto__') return;
    if (o === Object.prototype || o === Number.prototype || o === String.prototype) o = {};
    if (o === Array.prototype) o = [];

    if (o[key] === undefined || flags.bools[key] || typeof o[key] === 'boolean') {
      o[key] = value;
    } else if (Array.isArray(o[key])) {
      o[key].push(value);
    } else {
      o[key] = [o[key], value];
    }
  }

  function aliasIsBoolean(key) {
    return aliases[key].some(function (x) {
      return flags.bools[x];
    });
  }

  for (var i = 0; i < args.length; i++) {
    var arg = args[i];

    if (/^--.+=/.test(arg)) {
      // Using [\s\S] instead of . because js doesn't support the
      // 'dotall' regex modifier. See:
      // http://stackoverflow.com/a/1068308/13216
      var m = arg.match(/^--([^=]+)=([\s\S]*)$/);
      var key = m[1];
      var value = m[2];

      if (flags.bools[key]) {
        value = value !== 'false';
      }

      setArg(key, value, arg);
    } else if (/^--no-.+/.test(arg)) {
      var key = arg.match(/^--no-(.+)/)[1];
      setArg(key, false, arg);
    } else if (/^--.+/.test(arg)) {
      var key = arg.match(/^--(.+)/)[1];
      var next = args[i + 1];

      if (next !== undefined && !/^-/.test(next) && !flags.bools[key] && !flags.allBools && (aliases[key] ? !aliasIsBoolean(key) : true)) {
        setArg(key, next, arg);
        i++;
      } else if (/^(true|false)$/.test(next)) {
        setArg(key, next === 'true', arg);
        i++;
      } else {
        setArg(key, flags.strings[key] ? '' : true, arg);
      }
    } else if (/^-[^-]+/.test(arg)) {
      var letters = arg.slice(1, -1).split('');
      var broken = false;

      for (var j = 0; j < letters.length; j++) {
        var next = arg.slice(j + 2);

        if (next === '-') {
          setArg(letters[j], next, arg);
          continue;
        }

        if (/[A-Za-z]/.test(letters[j]) && /=/.test(next)) {
          setArg(letters[j], next.split('=')[1], arg);
          broken = true;
          break;
        }

        if (/[A-Za-z]/.test(letters[j]) && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
          setArg(letters[j], next, arg);
          broken = true;
          break;
        }

        if (letters[j + 1] && letters[j + 1].match(/\W/)) {
          setArg(letters[j], arg.slice(j + 2), arg);
          broken = true;
          break;
        } else {
          setArg(letters[j], flags.strings[letters[j]] ? '' : true, arg);
        }
      }

      var key = arg.slice(-1)[0];

      if (!broken && key !== '-') {
        if (args[i + 1] && !/^(-|--)[^-]/.test(args[i + 1]) && !flags.bools[key] && (aliases[key] ? !aliasIsBoolean(key) : true)) {
          setArg(key, args[i + 1], arg);
          i++;
        } else if (args[i + 1] && /^(true|false)$/.test(args[i + 1])) {
          setArg(key, args[i + 1] === 'true', arg);
          i++;
        } else {
          setArg(key, flags.strings[key] ? '' : true, arg);
        }
      }
    } else {
      if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
        argv._.push(flags.strings['_'] || !isNumber(arg) ? arg : Number(arg));
      }

      if (opts.stopEarly) {
        argv._.push.apply(argv._, args.slice(i + 1));

        break;
      }
    }
  }

  Object.keys(defaults).forEach(function (key) {
    if (!hasKey(argv, key.split('.'))) {
      setKey(argv, key.split('.'), defaults[key]);
      (aliases[key] || []).forEach(function (x) {
        setKey(argv, x.split('.'), defaults[key]);
      });
    }
  });

  if (opts['--']) {
    argv['--'] = new Array();
    notFlags.forEach(function (key) {
      argv['--'].push(key);
    });
  } else {
    notFlags.forEach(function (key) {
      argv._.push(key);
    });
  }

  return argv;
};

function hasKey(obj, keys) {
  var o = obj;
  keys.slice(0, -1).forEach(function (key) {
    o = o[key] || {};
  });
  var key = keys[keys.length - 1];
  return key in o;
}

function isNumber(x) {
  if (typeof x === 'number') return true;
  if (/^0x[0-9a-f]+$/i.test(x)) return true;
  return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
}

const PLACEHOLDER = null;
/**
 * unspecified boolean flag without default value is parsed as `undefined` instead of `false`
 */

var minimist_1 = function (args, options) {
  const boolean = options.boolean || [];
  const defaults = options.default || {};
  const booleanWithoutDefault = boolean.filter(key => !(key in defaults));
  const newDefaults = Object.assign(Object.assign({}, defaults), Object.fromEntries(booleanWithoutDefault.map(key => [key, PLACEHOLDER])));
  const parsed = minimist(args, Object.assign(Object.assign({}, options), {}, {
    default: newDefaults
  }));
  return Object.fromEntries(Object.entries(parsed).filter(([, value]) => value !== PLACEHOLDER));
};

/**
 * A specialized version of `baseAggregator` for arrays.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} setter The function to set `accumulator` values.
 * @param {Function} iteratee The iteratee to transform keys.
 * @param {Object} accumulator The initial aggregated object.
 * @returns {Function} Returns `accumulator`.
 */
function arrayAggregator(array, setter, iteratee, accumulator) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    var value = array[index];
    setter(accumulator, value, iteratee(value), array);
  }

  return accumulator;
}

var _arrayAggregator = arrayAggregator;

/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function (object, iteratee, keysFunc) {
    var index = -1,
        iterable = Object(object),
        props = keysFunc(object),
        length = props.length;

    while (length--) {
      var key = props[fromRight ? length : ++index];

      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }

    return object;
  };
}

var _createBaseFor = createBaseFor;

/**
 * The base implementation of `baseForOwn` which iterates over `object`
 * properties returned by `keysFunc` and invokes `iteratee` for each property.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */

var baseFor = _createBaseFor();
var _baseFor = baseFor;

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }

  return result;
}

var _baseTimes = baseTimes;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;
var _freeGlobal = freeGlobal;

/** Detect free variable `self`. */

var freeSelf = typeof self == 'object' && self && self.Object === Object && self;
/** Used as a reference to the global object. */

var root = _freeGlobal || freeSelf || Function('return this')();
var _root = root;

/** Built-in value references. */

var Symbol$1 = _root.Symbol;
var _Symbol = Symbol$1;

/** Used for built-in method references. */

var objectProto$d = Object.prototype;
/** Used to check objects for own properties. */

var hasOwnProperty$a = objectProto$d.hasOwnProperty;
/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */

var nativeObjectToString$1 = objectProto$d.toString;
/** Built-in value references. */

var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : undefined;
/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */

function getRawTag(value) {
  var isOwn = hasOwnProperty$a.call(value, symToStringTag$1),
      tag = value[symToStringTag$1];

  try {
    value[symToStringTag$1] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString$1.call(value);

  if (unmasked) {
    if (isOwn) {
      value[symToStringTag$1] = tag;
    } else {
      delete value[symToStringTag$1];
    }
  }

  return result;
}

var _getRawTag = getRawTag;

/** Used for built-in method references. */
var objectProto$c = Object.prototype;
/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */

var nativeObjectToString = objectProto$c.toString;
/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */

function objectToString(value) {
  return nativeObjectToString.call(value);
}

var _objectToString = objectToString;

/** `Object#toString` result references. */

var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';
/** Built-in value references. */

var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;
/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */

function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }

  return symToStringTag && symToStringTag in Object(value) ? _getRawTag(value) : _objectToString(value);
}

var _baseGetTag = baseGetTag;

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

var isObjectLike_1 = isObjectLike;

/** `Object#toString` result references. */

var argsTag$2 = '[object Arguments]';
/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */

function baseIsArguments(value) {
  return isObjectLike_1(value) && _baseGetTag(value) == argsTag$2;
}

var _baseIsArguments = baseIsArguments;

/** Used for built-in method references. */

var objectProto$b = Object.prototype;
/** Used to check objects for own properties. */

var hasOwnProperty$9 = objectProto$b.hasOwnProperty;
/** Built-in value references. */

var propertyIsEnumerable$1 = objectProto$b.propertyIsEnumerable;
/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */

var isArguments = _baseIsArguments(function () {
  return arguments;
}()) ? _baseIsArguments : function (value) {
  return isObjectLike_1(value) && hasOwnProperty$9.call(value, 'callee') && !propertyIsEnumerable$1.call(value, 'callee');
};
var isArguments_1 = isArguments;

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;
var isArray_1 = isArray;

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

var stubFalse_1 = stubFalse;

var isBuffer_1 = createCommonjsModule(function (module, exports) {
  /** Detect free variable `exports`. */
  var freeExports = exports && !exports.nodeType && exports;
  /** Detect free variable `module`. */

  var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;
  /** Detect the popular CommonJS extension `module.exports`. */

  var moduleExports = freeModule && freeModule.exports === freeExports;
  /** Built-in value references. */

  var Buffer = moduleExports ? _root.Buffer : undefined;
  /* Built-in method references for those with the same name as other `lodash` methods. */

  var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;
  /**
   * Checks if `value` is a buffer.
   *
   * @static
   * @memberOf _
   * @since 4.3.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
   * @example
   *
   * _.isBuffer(new Buffer(2));
   * // => true
   *
   * _.isBuffer(new Uint8Array(2));
   * // => false
   */

  var isBuffer = nativeIsBuffer || stubFalse_1;
  module.exports = isBuffer;
});

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER$1 = 9007199254740991;
/** Used to detect unsigned integer values. */

var reIsUint = /^(?:0|[1-9]\d*)$/;
/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */

function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER$1 : length;
  return !!length && (type == 'number' || type != 'symbol' && reIsUint.test(value)) && value > -1 && value % 1 == 0 && value < length;
}

var _isIndex = isIndex;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;
/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */

function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

var isLength_1 = isLength;

/** `Object#toString` result references. */

var argsTag$1 = '[object Arguments]',
    arrayTag$1 = '[object Array]',
    boolTag$1 = '[object Boolean]',
    dateTag$1 = '[object Date]',
    errorTag$1 = '[object Error]',
    funcTag$1 = '[object Function]',
    mapTag$2 = '[object Map]',
    numberTag$1 = '[object Number]',
    objectTag$2 = '[object Object]',
    regexpTag$1 = '[object RegExp]',
    setTag$2 = '[object Set]',
    stringTag$1 = '[object String]',
    weakMapTag$1 = '[object WeakMap]';
var arrayBufferTag$1 = '[object ArrayBuffer]',
    dataViewTag$2 = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';
/** Used to identify `toStringTag` values of typed arrays. */

var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag$1] = typedArrayTags[arrayTag$1] = typedArrayTags[arrayBufferTag$1] = typedArrayTags[boolTag$1] = typedArrayTags[dataViewTag$2] = typedArrayTags[dateTag$1] = typedArrayTags[errorTag$1] = typedArrayTags[funcTag$1] = typedArrayTags[mapTag$2] = typedArrayTags[numberTag$1] = typedArrayTags[objectTag$2] = typedArrayTags[regexpTag$1] = typedArrayTags[setTag$2] = typedArrayTags[stringTag$1] = typedArrayTags[weakMapTag$1] = false;
/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */

function baseIsTypedArray(value) {
  return isObjectLike_1(value) && isLength_1(value.length) && !!typedArrayTags[_baseGetTag(value)];
}

var _baseIsTypedArray = baseIsTypedArray;

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function (value) {
    return func(value);
  };
}

var _baseUnary = baseUnary;

var _nodeUtil = createCommonjsModule(function (module, exports) {
  /** Detect free variable `exports`. */
  var freeExports = exports && !exports.nodeType && exports;
  /** Detect free variable `module`. */

  var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;
  /** Detect the popular CommonJS extension `module.exports`. */

  var moduleExports = freeModule && freeModule.exports === freeExports;
  /** Detect free variable `process` from Node.js. */

  var freeProcess = moduleExports && _freeGlobal.process;
  /** Used to access faster Node.js helpers. */

  var nodeUtil = function () {
    try {
      // Use `util.types` for Node.js 10+.
      var types = freeModule && freeModule.require && freeModule.require('util').types;

      if (types) {
        return types;
      } // Legacy `process.binding('util')` for Node.js < 10.


      return freeProcess && freeProcess.binding && freeProcess.binding('util');
    } catch (e) {}
  }();

  module.exports = nodeUtil;
});

/* Node.js helper references. */

var nodeIsTypedArray = _nodeUtil && _nodeUtil.isTypedArray;
/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */

var isTypedArray = nodeIsTypedArray ? _baseUnary(nodeIsTypedArray) : _baseIsTypedArray;
var isTypedArray_1 = isTypedArray;

/** Used for built-in method references. */

var objectProto$a = Object.prototype;
/** Used to check objects for own properties. */

var hasOwnProperty$8 = objectProto$a.hasOwnProperty;
/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */

function arrayLikeKeys(value, inherited) {
  var isArr = isArray_1(value),
      isArg = !isArr && isArguments_1(value),
      isBuff = !isArr && !isArg && isBuffer_1(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray_1(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? _baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty$8.call(value, key)) && !(skipIndexes && ( // Safari 9 has enumerable `arguments.length` in strict mode.
    key == 'length' || // Node.js 0.10 has enumerable non-index properties on buffers.
    isBuff && (key == 'offset' || key == 'parent') || // PhantomJS 2 has enumerable non-index properties on typed arrays.
    isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset') || // Skip index properties.
    _isIndex(key, length)))) {
      result.push(key);
    }
  }

  return result;
}

var _arrayLikeKeys = arrayLikeKeys;

/** Used for built-in method references. */
var objectProto$9 = Object.prototype;
/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */

function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = typeof Ctor == 'function' && Ctor.prototype || objectProto$9;
  return value === proto;
}

var _isPrototype = isPrototype;

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function (arg) {
    return func(transform(arg));
  };
}

var _overArg = overArg;

/* Built-in method references for those with the same name as other `lodash` methods. */

var nativeKeys = _overArg(Object.keys, Object);
var _nativeKeys = nativeKeys;

/** Used for built-in method references. */

var objectProto$8 = Object.prototype;
/** Used to check objects for own properties. */

var hasOwnProperty$7 = objectProto$8.hasOwnProperty;
/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */

function baseKeys(object) {
  if (!_isPrototype(object)) {
    return _nativeKeys(object);
  }

  var result = [];

  for (var key in Object(object)) {
    if (hasOwnProperty$7.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }

  return result;
}

var _baseKeys = baseKeys;

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

var isObject_1 = isObject;

/** `Object#toString` result references. */

var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';
/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */

function isFunction(value) {
  if (!isObject_1(value)) {
    return false;
  } // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.


  var tag = _baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

var isFunction_1 = isFunction;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */

function isArrayLike(value) {
  return value != null && isLength_1(value.length) && !isFunction_1(value);
}

var isArrayLike_1 = isArrayLike;

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */

function keys(object) {
  return isArrayLike_1(object) ? _arrayLikeKeys(object) : _baseKeys(object);
}

var keys_1 = keys;

/**
 * The base implementation of `_.forOwn` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */

function baseForOwn(object, iteratee) {
  return object && _baseFor(object, iteratee, keys_1);
}

var _baseForOwn = baseForOwn;

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */

function createBaseEach(eachFunc, fromRight) {
  return function (collection, iteratee) {
    if (collection == null) {
      return collection;
    }

    if (!isArrayLike_1(collection)) {
      return eachFunc(collection, iteratee);
    }

    var length = collection.length,
        index = fromRight ? length : -1,
        iterable = Object(collection);

    while (fromRight ? index-- : ++index < length) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }

    return collection;
  };
}

var _createBaseEach = createBaseEach;

/**
 * The base implementation of `_.forEach` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 */

var baseEach = _createBaseEach(_baseForOwn);
var _baseEach = baseEach;

/**
 * Aggregates elements of `collection` on `accumulator` with keys transformed
 * by `iteratee` and values set by `setter`.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} setter The function to set `accumulator` values.
 * @param {Function} iteratee The iteratee to transform keys.
 * @param {Object} accumulator The initial aggregated object.
 * @returns {Function} Returns `accumulator`.
 */

function baseAggregator(collection, setter, iteratee, accumulator) {
  _baseEach(collection, function (value, key, collection) {
    setter(accumulator, value, iteratee(value), collection);
  });
  return accumulator;
}

var _baseAggregator = baseAggregator;

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

var _listCacheClear = listCacheClear;

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || value !== value && other !== other;
}

var eq_1 = eq;

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */

function assocIndexOf(array, key) {
  var length = array.length;

  while (length--) {
    if (eq_1(array[length][0], key)) {
      return length;
    }
  }

  return -1;
}

var _assocIndexOf = assocIndexOf;

/** Used for built-in method references. */

var arrayProto = Array.prototype;
/** Built-in value references. */

var splice = arrayProto.splice;
/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */

function listCacheDelete(key) {
  var data = this.__data__,
      index = _assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }

  var lastIndex = data.length - 1;

  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }

  --this.size;
  return true;
}

var _listCacheDelete = listCacheDelete;

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */

function listCacheGet(key) {
  var data = this.__data__,
      index = _assocIndexOf(data, key);
  return index < 0 ? undefined : data[index][1];
}

var _listCacheGet = listCacheGet;

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */

function listCacheHas(key) {
  return _assocIndexOf(this.__data__, key) > -1;
}

var _listCacheHas = listCacheHas;

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */

function listCacheSet(key, value) {
  var data = this.__data__,
      index = _assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }

  return this;
}

var _listCacheSet = listCacheSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */

function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;
  this.clear();

  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
} // Add methods to `ListCache`.


ListCache.prototype.clear = _listCacheClear;
ListCache.prototype['delete'] = _listCacheDelete;
ListCache.prototype.get = _listCacheGet;
ListCache.prototype.has = _listCacheHas;
ListCache.prototype.set = _listCacheSet;
var _ListCache = ListCache;

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */

function stackClear() {
  this.__data__ = new _ListCache();
  this.size = 0;
}

var _stackClear = stackClear;

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);
  this.size = data.size;
  return result;
}

var _stackDelete = stackDelete;

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

var _stackGet = stackGet;

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

var _stackHas = stackHas;

/** Used to detect overreaching core-js shims. */

var coreJsData = _root['__core-js_shared__'];
var _coreJsData = coreJsData;

/** Used to detect methods masquerading as native. */

var maskSrcKey = function () {
  var uid = /[^.]+$/.exec(_coreJsData && _coreJsData.keys && _coreJsData.keys.IE_PROTO || '');
  return uid ? 'Symbol(src)_1.' + uid : '';
}();
/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */


function isMasked(func) {
  return !!maskSrcKey && maskSrcKey in func;
}

var _isMasked = isMasked;

/** Used for built-in method references. */
var funcProto$1 = Function.prototype;
/** Used to resolve the decompiled source of functions. */

var funcToString$1 = funcProto$1.toString;
/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */

function toSource(func) {
  if (func != null) {
    try {
      return funcToString$1.call(func);
    } catch (e) {}

    try {
      return func + '';
    } catch (e) {}
  }

  return '';
}

var _toSource = toSource;

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */

var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
/** Used to detect host constructors (Safari). */

var reIsHostCtor = /^\[object .+?Constructor\]$/;
/** Used for built-in method references. */

var funcProto = Function.prototype,
    objectProto$7 = Object.prototype;
/** Used to resolve the decompiled source of functions. */

var funcToString = funcProto.toString;
/** Used to check objects for own properties. */

var hasOwnProperty$6 = objectProto$7.hasOwnProperty;
/** Used to detect if a method is native. */

var reIsNative = RegExp('^' + funcToString.call(hasOwnProperty$6).replace(reRegExpChar, '\\$&').replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');
/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */

function baseIsNative(value) {
  if (!isObject_1(value) || _isMasked(value)) {
    return false;
  }

  var pattern = isFunction_1(value) ? reIsNative : reIsHostCtor;
  return pattern.test(_toSource(value));
}

var _baseIsNative = baseIsNative;

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

var _getValue = getValue;

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */

function getNative(object, key) {
  var value = _getValue(object, key);
  return _baseIsNative(value) ? value : undefined;
}

var _getNative = getNative;

/* Built-in method references that are verified to be native. */

var Map$1 = _getNative(_root, 'Map');
var _Map = Map$1;

/* Built-in method references that are verified to be native. */

var nativeCreate = _getNative(Object, 'create');
var _nativeCreate = nativeCreate;

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */

function hashClear() {
  this.__data__ = _nativeCreate ? _nativeCreate(null) : {};
  this.size = 0;
}

var _hashClear = hashClear;

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

var _hashDelete = hashDelete;

/** Used to stand-in for `undefined` hash values. */

var HASH_UNDEFINED$2 = '__lodash_hash_undefined__';
/** Used for built-in method references. */

var objectProto$6 = Object.prototype;
/** Used to check objects for own properties. */

var hasOwnProperty$5 = objectProto$6.hasOwnProperty;
/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */

function hashGet(key) {
  var data = this.__data__;

  if (_nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED$2 ? undefined : result;
  }

  return hasOwnProperty$5.call(data, key) ? data[key] : undefined;
}

var _hashGet = hashGet;

/** Used for built-in method references. */

var objectProto$5 = Object.prototype;
/** Used to check objects for own properties. */

var hasOwnProperty$4 = objectProto$5.hasOwnProperty;
/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */

function hashHas(key) {
  var data = this.__data__;
  return _nativeCreate ? data[key] !== undefined : hasOwnProperty$4.call(data, key);
}

var _hashHas = hashHas;

/** Used to stand-in for `undefined` hash values. */

var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';
/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */

function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = _nativeCreate && value === undefined ? HASH_UNDEFINED$1 : value;
  return this;
}

var _hashSet = hashSet;

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */

function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;
  this.clear();

  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
} // Add methods to `Hash`.


Hash.prototype.clear = _hashClear;
Hash.prototype['delete'] = _hashDelete;
Hash.prototype.get = _hashGet;
Hash.prototype.has = _hashHas;
Hash.prototype.set = _hashSet;
var _Hash = Hash;

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */

function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new _Hash(),
    'map': new (_Map || _ListCache)(),
    'string': new _Hash()
  };
}

var _mapCacheClear = mapCacheClear;

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean' ? value !== '__proto__' : value === null;
}

var _isKeyable = isKeyable;

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */

function getMapData(map, key) {
  var data = map.__data__;
  return _isKeyable(key) ? data[typeof key == 'string' ? 'string' : 'hash'] : data.map;
}

var _getMapData = getMapData;

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */

function mapCacheDelete(key) {
  var result = _getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

var _mapCacheDelete = mapCacheDelete;

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */

function mapCacheGet(key) {
  return _getMapData(this, key).get(key);
}

var _mapCacheGet = mapCacheGet;

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */

function mapCacheHas(key) {
  return _getMapData(this, key).has(key);
}

var _mapCacheHas = mapCacheHas;

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */

function mapCacheSet(key, value) {
  var data = _getMapData(this, key),
      size = data.size;
  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

var _mapCacheSet = mapCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */

function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;
  this.clear();

  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
} // Add methods to `MapCache`.


MapCache.prototype.clear = _mapCacheClear;
MapCache.prototype['delete'] = _mapCacheDelete;
MapCache.prototype.get = _mapCacheGet;
MapCache.prototype.has = _mapCacheHas;
MapCache.prototype.set = _mapCacheSet;
var _MapCache = MapCache;

/** Used as the size to enable large array optimizations. */

var LARGE_ARRAY_SIZE = 200;
/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */

function stackSet(key, value) {
  var data = this.__data__;

  if (data instanceof _ListCache) {
    var pairs = data.__data__;

    if (!_Map || pairs.length < LARGE_ARRAY_SIZE - 1) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }

    data = this.__data__ = new _MapCache(pairs);
  }

  data.set(key, value);
  this.size = data.size;
  return this;
}

var _stackSet = stackSet;

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */

function Stack(entries) {
  var data = this.__data__ = new _ListCache(entries);
  this.size = data.size;
} // Add methods to `Stack`.


Stack.prototype.clear = _stackClear;
Stack.prototype['delete'] = _stackDelete;
Stack.prototype.get = _stackGet;
Stack.prototype.has = _stackHas;
Stack.prototype.set = _stackSet;
var _Stack = Stack;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';
/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */

function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED);

  return this;
}

var _setCacheAdd = setCacheAdd;

/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

var _setCacheHas = setCacheHas;

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */

function SetCache(values) {
  var index = -1,
      length = values == null ? 0 : values.length;
  this.__data__ = new _MapCache();

  while (++index < length) {
    this.add(values[index]);
  }
} // Add methods to `SetCache`.


SetCache.prototype.add = SetCache.prototype.push = _setCacheAdd;
SetCache.prototype.has = _setCacheHas;
var _SetCache = SetCache;

/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }

  return false;
}

var _arraySome = arraySome;

/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas(cache, key) {
  return cache.has(key);
}

var _cacheHas = cacheHas;

/** Used to compose bitmasks for value comparisons. */

var COMPARE_PARTIAL_FLAG$5 = 1,
    COMPARE_UNORDERED_FLAG$3 = 2;
/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */

function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG$5,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  } // Check that cyclic values are equal.


  var arrStacked = stack.get(array);
  var othStacked = stack.get(other);

  if (arrStacked && othStacked) {
    return arrStacked == other && othStacked == array;
  }

  var index = -1,
      result = true,
      seen = bitmask & COMPARE_UNORDERED_FLAG$3 ? new _SetCache() : undefined;
  stack.set(array, other);
  stack.set(other, array); // Ignore non-index properties.

  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index];

    if (customizer) {
      var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
    }

    if (compared !== undefined) {
      if (compared) {
        continue;
      }

      result = false;
      break;
    } // Recursively compare arrays (susceptible to call stack limits).


    if (seen) {
      if (!_arraySome(other, function (othValue, othIndex) {
        if (!_cacheHas(seen, othIndex) && (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
          return seen.push(othIndex);
        }
      })) {
        result = false;
        break;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
      result = false;
      break;
    }
  }

  stack['delete'](array);
  stack['delete'](other);
  return result;
}

var _equalArrays = equalArrays;

/** Built-in value references. */

var Uint8Array = _root.Uint8Array;
var _Uint8Array = Uint8Array;

/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
  var index = -1,
      result = Array(map.size);
  map.forEach(function (value, key) {
    result[++index] = [key, value];
  });
  return result;
}

var _mapToArray = mapToArray;

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);
  set.forEach(function (value) {
    result[++index] = value;
  });
  return result;
}

var _setToArray = setToArray;

/** Used to compose bitmasks for value comparisons. */

var COMPARE_PARTIAL_FLAG$4 = 1,
    COMPARE_UNORDERED_FLAG$2 = 2;
/** `Object#toString` result references. */

var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    mapTag$1 = '[object Map]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    setTag$1 = '[object Set]',
    stringTag = '[object String]',
    symbolTag$1 = '[object Symbol]';
var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag$1 = '[object DataView]';
/** Used to convert symbols to primitives and strings. */

var symbolProto$1 = _Symbol ? _Symbol.prototype : undefined,
    symbolValueOf = symbolProto$1 ? symbolProto$1.valueOf : undefined;
/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */

function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag$1:
      if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
        return false;
      }

      object = object.buffer;
      other = other.buffer;

    case arrayBufferTag:
      if (object.byteLength != other.byteLength || !equalFunc(new _Uint8Array(object), new _Uint8Array(other))) {
        return false;
      }

      return true;

    case boolTag:
    case dateTag:
    case numberTag:
      // Coerce booleans to `1` or `0` and dates to milliseconds.
      // Invalid dates are coerced to `NaN`.
      return eq_1(+object, +other);

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
      // for more details.
      return object == other + '';

    case mapTag$1:
      var convert = _mapToArray;

    case setTag$1:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG$4;
      convert || (convert = _setToArray);

      if (object.size != other.size && !isPartial) {
        return false;
      } // Assume cyclic values are equal.


      var stacked = stack.get(object);

      if (stacked) {
        return stacked == other;
      }

      bitmask |= COMPARE_UNORDERED_FLAG$2; // Recursively compare objects (susceptible to call stack limits).

      stack.set(object, other);
      var result = _equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
      stack['delete'](object);
      return result;

    case symbolTag$1:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }

  }

  return false;
}

var _equalByTag = equalByTag;

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }

  return array;
}

var _arrayPush = arrayPush;

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */

function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray_1(object) ? result : _arrayPush(result, symbolsFunc(object));
}

var _baseGetAllKeys = baseGetAllKeys;

/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];

    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }

  return result;
}

var _arrayFilter = arrayFilter;

/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

var stubArray_1 = stubArray;

/** Used for built-in method references. */

var objectProto$4 = Object.prototype;
/** Built-in value references. */

var propertyIsEnumerable = objectProto$4.propertyIsEnumerable;
/* Built-in method references for those with the same name as other `lodash` methods. */

var nativeGetSymbols = Object.getOwnPropertySymbols;
/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */

var getSymbols = !nativeGetSymbols ? stubArray_1 : function (object) {
  if (object == null) {
    return [];
  }

  object = Object(object);
  return _arrayFilter(nativeGetSymbols(object), function (symbol) {
    return propertyIsEnumerable.call(object, symbol);
  });
};
var _getSymbols = getSymbols;

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */

function getAllKeys(object) {
  return _baseGetAllKeys(object, keys_1, _getSymbols);
}

var _getAllKeys = getAllKeys;

/** Used to compose bitmasks for value comparisons. */

var COMPARE_PARTIAL_FLAG$3 = 1;
/** Used for built-in method references. */

var objectProto$3 = Object.prototype;
/** Used to check objects for own properties. */

var hasOwnProperty$3 = objectProto$3.hasOwnProperty;
/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */

function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG$3,
      objProps = _getAllKeys(object),
      objLength = objProps.length,
      othProps = _getAllKeys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isPartial) {
    return false;
  }

  var index = objLength;

  while (index--) {
    var key = objProps[index];

    if (!(isPartial ? key in other : hasOwnProperty$3.call(other, key))) {
      return false;
    }
  } // Check that cyclic values are equal.


  var objStacked = stack.get(object);
  var othStacked = stack.get(other);

  if (objStacked && othStacked) {
    return objStacked == other && othStacked == object;
  }

  var result = true;
  stack.set(object, other);
  stack.set(other, object);
  var skipCtor = isPartial;

  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key];

    if (customizer) {
      var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
    } // Recursively compare objects (susceptible to call stack limits).


    if (!(compared === undefined ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
      result = false;
      break;
    }

    skipCtor || (skipCtor = key == 'constructor');
  }

  if (result && !skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor; // Non `Object` object instances with different constructors are not equal.

    if (objCtor != othCtor && 'constructor' in object && 'constructor' in other && !(typeof objCtor == 'function' && objCtor instanceof objCtor && typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      result = false;
    }
  }

  stack['delete'](object);
  stack['delete'](other);
  return result;
}

var _equalObjects = equalObjects;

/* Built-in method references that are verified to be native. */

var DataView = _getNative(_root, 'DataView');
var _DataView = DataView;

/* Built-in method references that are verified to be native. */

var Promise$1 = _getNative(_root, 'Promise');
var _Promise = Promise$1;

/* Built-in method references that are verified to be native. */

var Set$1 = _getNative(_root, 'Set');
var _Set = Set$1;

/* Built-in method references that are verified to be native. */

var WeakMap$1 = _getNative(_root, 'WeakMap');
var _WeakMap = WeakMap$1;

/** `Object#toString` result references. */

var mapTag = '[object Map]',
    objectTag$1 = '[object Object]',
    promiseTag = '[object Promise]',
    setTag = '[object Set]',
    weakMapTag = '[object WeakMap]';
var dataViewTag = '[object DataView]';
/** Used to detect maps, sets, and weakmaps. */

var dataViewCtorString = _toSource(_DataView),
    mapCtorString = _toSource(_Map),
    promiseCtorString = _toSource(_Promise),
    setCtorString = _toSource(_Set),
    weakMapCtorString = _toSource(_WeakMap);
/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */

var getTag = _baseGetTag; // Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.

if (_DataView && getTag(new _DataView(new ArrayBuffer(1))) != dataViewTag || _Map && getTag(new _Map()) != mapTag || _Promise && getTag(_Promise.resolve()) != promiseTag || _Set && getTag(new _Set()) != setTag || _WeakMap && getTag(new _WeakMap()) != weakMapTag) {
  getTag = function (value) {
    var result = _baseGetTag(value),
        Ctor = result == objectTag$1 ? value.constructor : undefined,
        ctorString = Ctor ? _toSource(Ctor) : '';

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString:
          return dataViewTag;

        case mapCtorString:
          return mapTag;

        case promiseCtorString:
          return promiseTag;

        case setCtorString:
          return setTag;

        case weakMapCtorString:
          return weakMapTag;
      }
    }

    return result;
  };
}

var _getTag = getTag;

/** Used to compose bitmasks for value comparisons. */

var COMPARE_PARTIAL_FLAG$2 = 1;
/** `Object#toString` result references. */

var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    objectTag = '[object Object]';
/** Used for built-in method references. */

var objectProto$2 = Object.prototype;
/** Used to check objects for own properties. */

var hasOwnProperty$2 = objectProto$2.hasOwnProperty;
/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */

function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = isArray_1(object),
      othIsArr = isArray_1(other),
      objTag = objIsArr ? arrayTag : _getTag(object),
      othTag = othIsArr ? arrayTag : _getTag(other);
  objTag = objTag == argsTag ? objectTag : objTag;
  othTag = othTag == argsTag ? objectTag : othTag;
  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && isBuffer_1(object)) {
    if (!isBuffer_1(other)) {
      return false;
    }

    objIsArr = true;
    objIsObj = false;
  }

  if (isSameTag && !objIsObj) {
    stack || (stack = new _Stack());
    return objIsArr || isTypedArray_1(object) ? _equalArrays(object, other, bitmask, customizer, equalFunc, stack) : _equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
  }

  if (!(bitmask & COMPARE_PARTIAL_FLAG$2)) {
    var objIsWrapped = objIsObj && hasOwnProperty$2.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty$2.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;
      stack || (stack = new _Stack());
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }

  if (!isSameTag) {
    return false;
  }

  stack || (stack = new _Stack());
  return _equalObjects(object, other, bitmask, customizer, equalFunc, stack);
}

var _baseIsEqualDeep = baseIsEqualDeep;

/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Unordered comparison
 *  2 - Partial comparison
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */

function baseIsEqual(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }

  if (value == null || other == null || !isObjectLike_1(value) && !isObjectLike_1(other)) {
    return value !== value && other !== other;
  }

  return _baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
}

var _baseIsEqual = baseIsEqual;

/** Used to compose bitmasks for value comparisons. */

var COMPARE_PARTIAL_FLAG$1 = 1,
    COMPARE_UNORDERED_FLAG$1 = 2;
/**
 * The base implementation of `_.isMatch` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Object} source The object of property values to match.
 * @param {Array} matchData The property names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparisons.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */

function baseIsMatch(object, source, matchData, customizer) {
  var index = matchData.length,
      length = index,
      noCustomizer = !customizer;

  if (object == null) {
    return !length;
  }

  object = Object(object);

  while (index--) {
    var data = matchData[index];

    if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
      return false;
    }
  }

  while (++index < length) {
    data = matchData[index];
    var key = data[0],
        objValue = object[key],
        srcValue = data[1];

    if (noCustomizer && data[2]) {
      if (objValue === undefined && !(key in object)) {
        return false;
      }
    } else {
      var stack = new _Stack();

      if (customizer) {
        var result = customizer(objValue, srcValue, key, object, source, stack);
      }

      if (!(result === undefined ? _baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG$1 | COMPARE_UNORDERED_FLAG$1, customizer, stack) : result)) {
        return false;
      }
    }
  }

  return true;
}

var _baseIsMatch = baseIsMatch;

/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */

function isStrictComparable(value) {
  return value === value && !isObject_1(value);
}

var _isStrictComparable = isStrictComparable;

/**
 * Gets the property names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */

function getMatchData(object) {
  var result = keys_1(object),
      length = result.length;

  while (length--) {
    var key = result[length],
        value = object[key];
    result[length] = [key, value, _isStrictComparable(value)];
  }

  return result;
}

var _getMatchData = getMatchData;

/**
 * A specialized version of `matchesProperty` for source values suitable
 * for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function matchesStrictComparable(key, srcValue) {
  return function (object) {
    if (object == null) {
      return false;
    }

    return object[key] === srcValue && (srcValue !== undefined || key in Object(object));
  };
}

var _matchesStrictComparable = matchesStrictComparable;

/**
 * The base implementation of `_.matches` which doesn't clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new spec function.
 */

function baseMatches(source) {
  var matchData = _getMatchData(source);

  if (matchData.length == 1 && matchData[0][2]) {
    return _matchesStrictComparable(matchData[0][0], matchData[0][1]);
  }

  return function (object) {
    return object === source || _baseIsMatch(object, source, matchData);
  };
}

var _baseMatches = baseMatches;

/** `Object#toString` result references. */

var symbolTag = '[object Symbol]';
/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */

function isSymbol(value) {
  return typeof value == 'symbol' || isObjectLike_1(value) && _baseGetTag(value) == symbolTag;
}

var isSymbol_1 = isSymbol;

/** Used to match property names within property paths. */

var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;
/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */

function isKey(value, object) {
  if (isArray_1(value)) {
    return false;
  }

  var type = typeof value;

  if (type == 'number' || type == 'symbol' || type == 'boolean' || value == null || isSymbol_1(value)) {
    return true;
  }

  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
}

var _isKey = isKey;

/** Error message constants. */

var FUNC_ERROR_TEXT = 'Expected a function';
/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */

function memoize(func, resolver) {
  if (typeof func != 'function' || resolver != null && typeof resolver != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }

  var memoized = function () {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }

    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };

  memoized.cache = new (memoize.Cache || _MapCache)();
  return memoized;
} // Expose `MapCache`.


memoize.Cache = _MapCache;
var memoize_1 = memoize;

/** Used as the maximum memoize cache size. */

var MAX_MEMOIZE_SIZE = 500;
/**
 * A specialized version of `_.memoize` which clears the memoized function's
 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
 *
 * @private
 * @param {Function} func The function to have its output memoized.
 * @returns {Function} Returns the new memoized function.
 */

function memoizeCapped(func) {
  var result = memoize_1(func, function (key) {
    if (cache.size === MAX_MEMOIZE_SIZE) {
      cache.clear();
    }

    return key;
  });
  var cache = result.cache;
  return result;
}

var _memoizeCapped = memoizeCapped;

/** Used to match property names within property paths. */

var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
/** Used to match backslashes in property paths. */

var reEscapeChar = /\\(\\)?/g;
/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */

var stringToPath = _memoizeCapped(function (string) {
  var result = [];

  if (string.charCodeAt(0) === 46
  /* . */
  ) {
      result.push('');
    }

  string.replace(rePropName, function (match, number, quote, subString) {
    result.push(quote ? subString.replace(reEscapeChar, '$1') : number || match);
  });
  return result;
});
var _stringToPath = stringToPath;

/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }

  return result;
}

var _arrayMap = arrayMap;

/** Used as references for various `Number` constants. */

var INFINITY$1 = 1 / 0;
/** Used to convert symbols to primitives and strings. */

var symbolProto = _Symbol ? _Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;
/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */

function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }

  if (isArray_1(value)) {
    // Recursively convert values (susceptible to call stack limits).
    return _arrayMap(value, baseToString) + '';
  }

  if (isSymbol_1(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }

  var result = value + '';
  return result == '0' && 1 / value == -INFINITY$1 ? '-0' : result;
}

var _baseToString = baseToString;

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */

function toString(value) {
  return value == null ? '' : _baseToString(value);
}

var toString_1 = toString;

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @param {Object} [object] The object to query keys on.
 * @returns {Array} Returns the cast property path array.
 */

function castPath(value, object) {
  if (isArray_1(value)) {
    return value;
  }

  return _isKey(value, object) ? [value] : _stringToPath(toString_1(value));
}

var _castPath = castPath;

/** Used as references for various `Number` constants. */

var INFINITY = 1 / 0;
/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */

function toKey(value) {
  if (typeof value == 'string' || isSymbol_1(value)) {
    return value;
  }

  var result = value + '';
  return result == '0' && 1 / value == -INFINITY ? '-0' : result;
}

var _toKey = toKey;

/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */

function baseGet(object, path) {
  path = _castPath(path, object);
  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[_toKey(path[index++])];
  }

  return index && index == length ? object : undefined;
}

var _baseGet = baseGet;

/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.get(object, 'a[0].b.c');
 * // => 3
 *
 * _.get(object, ['a', '0', 'b', 'c']);
 * // => 3
 *
 * _.get(object, 'a.b.c', 'default');
 * // => 'default'
 */

function get(object, path, defaultValue) {
  var result = object == null ? undefined : _baseGet(object, path);
  return result === undefined ? defaultValue : result;
}

var get_1 = get;

/**
 * The base implementation of `_.hasIn` without support for deep paths.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {Array|string} key The key to check.
 * @returns {boolean} Returns `true` if `key` exists, else `false`.
 */
function baseHasIn(object, key) {
  return object != null && key in Object(object);
}

var _baseHasIn = baseHasIn;

/**
 * Checks if `path` exists on `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @param {Function} hasFunc The function to check properties.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 */

function hasPath(object, path, hasFunc) {
  path = _castPath(path, object);
  var index = -1,
      length = path.length,
      result = false;

  while (++index < length) {
    var key = _toKey(path[index]);

    if (!(result = object != null && hasFunc(object, key))) {
      break;
    }

    object = object[key];
  }

  if (result || ++index != length) {
    return result;
  }

  length = object == null ? 0 : object.length;
  return !!length && isLength_1(length) && _isIndex(key, length) && (isArray_1(object) || isArguments_1(object));
}

var _hasPath = hasPath;

/**
 * Checks if `path` is a direct or inherited property of `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 * @example
 *
 * var object = _.create({ 'a': _.create({ 'b': 2 }) });
 *
 * _.hasIn(object, 'a');
 * // => true
 *
 * _.hasIn(object, 'a.b');
 * // => true
 *
 * _.hasIn(object, ['a', 'b']);
 * // => true
 *
 * _.hasIn(object, 'b');
 * // => false
 */

function hasIn(object, path) {
  return object != null && _hasPath(object, path, _baseHasIn);
}

var hasIn_1 = hasIn;

/** Used to compose bitmasks for value comparisons. */

var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;
/**
 * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */

function baseMatchesProperty(path, srcValue) {
  if (_isKey(path) && _isStrictComparable(srcValue)) {
    return _matchesStrictComparable(_toKey(path), srcValue);
  }

  return function (object) {
    var objValue = get_1(object, path);
    return objValue === undefined && objValue === srcValue ? hasIn_1(object, path) : _baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
  };
}

var _baseMatchesProperty = baseMatchesProperty;

/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

var identity_1 = identity;

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function baseProperty(key) {
  return function (object) {
    return object == null ? undefined : object[key];
  };
}

var _baseProperty = baseProperty;

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 */

function basePropertyDeep(path) {
  return function (object) {
    return _baseGet(object, path);
  };
}

var _basePropertyDeep = basePropertyDeep;

/**
 * Creates a function that returns the value at `path` of a given object.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': 2 } },
 *   { 'a': { 'b': 1 } }
 * ];
 *
 * _.map(objects, _.property('a.b'));
 * // => [2, 1]
 *
 * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
 * // => [1, 2]
 */

function property(path) {
  return _isKey(path) ? _baseProperty(_toKey(path)) : _basePropertyDeep(path);
}

var property_1 = property;

/**
 * The base implementation of `_.iteratee`.
 *
 * @private
 * @param {*} [value=_.identity] The value to convert to an iteratee.
 * @returns {Function} Returns the iteratee.
 */

function baseIteratee(value) {
  // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
  // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
  if (typeof value == 'function') {
    return value;
  }

  if (value == null) {
    return identity_1;
  }

  if (typeof value == 'object') {
    return isArray_1(value) ? _baseMatchesProperty(value[0], value[1]) : _baseMatches(value);
  }

  return property_1(value);
}

var _baseIteratee = baseIteratee;

/**
 * Creates a function like `_.groupBy`.
 *
 * @private
 * @param {Function} setter The function to set accumulator values.
 * @param {Function} [initializer] The accumulator object initializer.
 * @returns {Function} Returns the new aggregator function.
 */

function createAggregator(setter, initializer) {
  return function (collection, iteratee) {
    var func = isArray_1(collection) ? _arrayAggregator : _baseAggregator,
        accumulator = initializer ? initializer() : {};
    return func(collection, setter, _baseIteratee(iteratee), accumulator);
  };
}

var _createAggregator = createAggregator;

/**
 * Creates an array of elements split into two groups, the first of which
 * contains elements `predicate` returns truthy for, the second of which
 * contains elements `predicate` returns falsey for. The predicate is
 * invoked with one argument: (value).
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @returns {Array} Returns the array of grouped elements.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'age': 36, 'active': false },
 *   { 'user': 'fred',    'age': 40, 'active': true },
 *   { 'user': 'pebbles', 'age': 1,  'active': false }
 * ];
 *
 * _.partition(users, function(o) { return o.active; });
 * // => objects for [['fred'], ['barney', 'pebbles']]
 *
 * // The `_.matches` iteratee shorthand.
 * _.partition(users, { 'age': 1, 'active': false });
 * // => objects for [['pebbles'], ['barney', 'fred']]
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.partition(users, ['active', false]);
 * // => objects for [['barney', 'pebbles'], ['fred']]
 *
 * // The `_.property` iteratee shorthand.
 * _.partition(users, 'active');
 * // => objects for [['fred'], ['barney', 'pebbles']]
 */

var partition = _createAggregator(function (result, value, key) {
  result[key ? 0 : 1].push(value);
}, function () {
  return [[], []];
});
var partition_1 = partition;

var createMinimistOptions = function createMinimistOptions(detailedOptions) {
  const [boolean, string] = partition_1(detailedOptions, ({
    type
  }) => type === "boolean").map(detailedOptions => detailedOptions.flatMap(({
    name,
    alias
  }) => alias ? [name, alias] : [name]));
  const defaults = Object.fromEntries(detailedOptions.filter(option => !option.deprecated && (!option.forwardToApi || option.name === "plugin" || option.name === "plugin-search-dir") && option.default !== undefined).map(option => [option.name, option.default]));
  return {
    // we use vnopts' AliasSchema to handle aliases for better error messages
    alias: {},
    boolean,
    string,
    default: defaults
  };
};

const {
  optionsNormalizer
} = prettierInternal;

function getOptions(argv, detailedOptions) {
  return Object.fromEntries(detailedOptions.filter(({
    forwardToApi
  }) => forwardToApi).map(({
    forwardToApi,
    name
  }) => [forwardToApi, argv[name]]));
}

function cliifyOptions(object, apiDetailedOptionMap) {
  return Object.fromEntries(Object.entries(object || {}).map(([key, value]) => {
    const apiOption = apiDetailedOptionMap[key];
    const cliKey = apiOption ? apiOption.name : key;
    return [dashify(cliKey), value];
  }));
}

function createApiDetailedOptionMap(detailedOptions) {
  return Object.fromEntries(detailedOptions.filter(option => option.forwardToApi && option.forwardToApi !== option.name).map(option => [option.forwardToApi, option]));
}

function parseArgsToOptions(context, overrideDefaults) {
  const minimistOptions = createMinimistOptions(context.detailedOptions);
  const apiDetailedOptionMap = createApiDetailedOptionMap(context.detailedOptions);
  return getOptions(optionsNormalizer.normalizeCliOptions(minimist_1(context.rawArguments, {
    string: minimistOptions.string,
    boolean: minimistOptions.boolean,
    default: cliifyOptions(overrideDefaults, apiDetailedOptionMap)
  }), context.detailedOptions, {
    logger: false
  }), context.detailedOptions);
}

async function getOptionsOrDie(context, filePath) {
  try {
    if (context.argv.config === false) {
      context.logger.debug("'--no-config' option found, skip loading config file.");
      return null;
    }

    context.logger.debug(context.argv.config ? `load config file from '${context.argv.config}'` : `resolve config from '${filePath}'`);
    const options = await prettier$1.resolveConfig(filePath, {
      editorconfig: context.argv.editorconfig,
      config: context.argv.config
    });
    context.logger.debug("loaded options `" + JSON.stringify(options) + "`");
    return options;
  } catch (error) {
    context.logger.error(`Invalid configuration file \`${filePath}\`: ` + error.message);
    process.exit(2);
  }
}

function applyConfigPrecedence(context, options) {
  try {
    switch (context.argv["config-precedence"]) {
      case "cli-override":
        return parseArgsToOptions(context, options);

      case "file-override":
        return Object.assign(Object.assign({}, parseArgsToOptions(context)), options);

      case "prefer-file":
        return options || parseArgsToOptions(context);
    }
  } catch (error) {
    /* istanbul ignore next */
    context.logger.error(error.toString());
    /* istanbul ignore next */

    process.exit(2);
  }
}

async function getOptionsForFile$1(context, filepath) {
  const options = await getOptionsOrDie(context, filepath);
  const hasPlugins = options && options.plugins;

  if (hasPlugins) {
    context.pushContextPlugins(options.plugins);
  }

  const appliedOptions = Object.assign({
    filepath
  }, applyConfigPrecedence(context, options && optionsNormalizer.normalizeApiOptions(options, context.supportOptions, {
    logger: context.logger
  })));
  context.logger.debug(`applied config-precedence (${context.argv["config-precedence"]}): ` + `${JSON.stringify(appliedOptions)}`);

  if (hasPlugins) {
    context.popContextPlugins();
  }

  return appliedOptions;
}

var option = {
  getOptionsForFile: getOptionsForFile$1,
  createMinimistOptions
};

const {
  isCI
} = require$$1; // Some CI pipelines incorrectly report process.stdout.isTTY status,
// which causes unwanted lines in the output. An additional check for isCI() helps.
// See https://github.com/prettier/prettier/issues/5801

var isTty = function isTTY() {
  return process.stdout.isTTY && !isCI();
};

/*istanbul ignore start*/
var base = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports["default"] = Diff;
  /*istanbul ignore end*/

  function Diff() {}

  Diff.prototype = {
    /*istanbul ignore start*/

    /*istanbul ignore end*/
    diff: function diff(oldString, newString) {
      /*istanbul ignore start*/
      var
      /*istanbul ignore end*/
      options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var callback = options.callback;

      if (typeof options === 'function') {
        callback = options;
        options = {};
      }

      this.options = options;
      var self = this;

      function done(value) {
        if (callback) {
          setTimeout(function () {
            callback(undefined, value);
          }, 0);
          return true;
        } else {
          return value;
        }
      } // Allow subclasses to massage the input prior to running


      oldString = this.castInput(oldString);
      newString = this.castInput(newString);
      oldString = this.removeEmpty(this.tokenize(oldString));
      newString = this.removeEmpty(this.tokenize(newString));
      var newLen = newString.length,
          oldLen = oldString.length;
      var editLength = 1;
      var maxEditLength = newLen + oldLen;
      var bestPath = [{
        newPos: -1,
        components: []
      }]; // Seed editLength = 0, i.e. the content starts with the same values

      var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);

      if (bestPath[0].newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
        // Identity per the equality and tokenizer
        return done([{
          value: this.join(newString),
          count: newString.length
        }]);
      } // Main worker method. checks all permutations of a given edit length for acceptance.


      function execEditLength() {
        for (var diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
          var basePath =
          /*istanbul ignore start*/
          void 0
          /*istanbul ignore end*/
          ;

          var addPath = bestPath[diagonalPath - 1],
              removePath = bestPath[diagonalPath + 1],
              _oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;

          if (addPath) {
            // No one else is going to attempt to use this value, clear it
            bestPath[diagonalPath - 1] = undefined;
          }

          var canAdd = addPath && addPath.newPos + 1 < newLen,
              canRemove = removePath && 0 <= _oldPos && _oldPos < oldLen;

          if (!canAdd && !canRemove) {
            // If this path is a terminal then prune
            bestPath[diagonalPath] = undefined;
            continue;
          } // Select the diagonal that we want to branch from. We select the prior
          // path whose position in the new string is the farthest from the origin
          // and does not pass the bounds of the diff graph


          if (!canAdd || canRemove && addPath.newPos < removePath.newPos) {
            basePath = clonePath(removePath);
            self.pushComponent(basePath.components, undefined, true);
          } else {
            basePath = addPath; // No need to clone, we've pulled it from the list

            basePath.newPos++;
            self.pushComponent(basePath.components, true, undefined);
          }

          _oldPos = self.extractCommon(basePath, newString, oldString, diagonalPath); // If we have hit the end of both strings, then we are done

          if (basePath.newPos + 1 >= newLen && _oldPos + 1 >= oldLen) {
            return done(buildValues(self, basePath.components, newString, oldString, self.useLongestToken));
          } else {
            // Otherwise track this path as a potential candidate and continue.
            bestPath[diagonalPath] = basePath;
          }
        }

        editLength++;
      } // Performs the length of edit iteration. Is a bit fugly as this has to support the
      // sync and async mode which is never fun. Loops over execEditLength until a value
      // is produced.


      if (callback) {
        (function exec() {
          setTimeout(function () {
            // This should not happen, but we want to be safe.

            /* istanbul ignore next */
            if (editLength > maxEditLength) {
              return callback();
            }

            if (!execEditLength()) {
              exec();
            }
          }, 0);
        })();
      } else {
        while (editLength <= maxEditLength) {
          var ret = execEditLength();

          if (ret) {
            return ret;
          }
        }
      }
    },

    /*istanbul ignore start*/

    /*istanbul ignore end*/
    pushComponent: function pushComponent(components, added, removed) {
      var last = components[components.length - 1];

      if (last && last.added === added && last.removed === removed) {
        // We need to clone here as the component clone operation is just
        // as shallow array clone
        components[components.length - 1] = {
          count: last.count + 1,
          added: added,
          removed: removed
        };
      } else {
        components.push({
          count: 1,
          added: added,
          removed: removed
        });
      }
    },

    /*istanbul ignore start*/

    /*istanbul ignore end*/
    extractCommon: function extractCommon(basePath, newString, oldString, diagonalPath) {
      var newLen = newString.length,
          oldLen = oldString.length,
          newPos = basePath.newPos,
          oldPos = newPos - diagonalPath,
          commonCount = 0;

      while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
        newPos++;
        oldPos++;
        commonCount++;
      }

      if (commonCount) {
        basePath.components.push({
          count: commonCount
        });
      }

      basePath.newPos = newPos;
      return oldPos;
    },

    /*istanbul ignore start*/

    /*istanbul ignore end*/
    equals: function equals(left, right) {
      if (this.options.comparator) {
        return this.options.comparator(left, right);
      } else {
        return left === right || this.options.ignoreCase && left.toLowerCase() === right.toLowerCase();
      }
    },

    /*istanbul ignore start*/

    /*istanbul ignore end*/
    removeEmpty: function removeEmpty(array) {
      var ret = [];

      for (var i = 0; i < array.length; i++) {
        if (array[i]) {
          ret.push(array[i]);
        }
      }

      return ret;
    },

    /*istanbul ignore start*/

    /*istanbul ignore end*/
    castInput: function castInput(value) {
      return value;
    },

    /*istanbul ignore start*/

    /*istanbul ignore end*/
    tokenize: function tokenize(value) {
      return value.split('');
    },

    /*istanbul ignore start*/

    /*istanbul ignore end*/
    join: function join(chars) {
      return chars.join('');
    }
  };

  function buildValues(diff, components, newString, oldString, useLongestToken) {
    var componentPos = 0,
        componentLen = components.length,
        newPos = 0,
        oldPos = 0;

    for (; componentPos < componentLen; componentPos++) {
      var component = components[componentPos];

      if (!component.removed) {
        if (!component.added && useLongestToken) {
          var value = newString.slice(newPos, newPos + component.count);
          value = value.map(function (value, i) {
            var oldValue = oldString[oldPos + i];
            return oldValue.length > value.length ? oldValue : value;
          });
          component.value = diff.join(value);
        } else {
          component.value = diff.join(newString.slice(newPos, newPos + component.count));
        }

        newPos += component.count; // Common case

        if (!component.added) {
          oldPos += component.count;
        }
      } else {
        component.value = diff.join(oldString.slice(oldPos, oldPos + component.count));
        oldPos += component.count; // Reverse add and remove so removes are output first to match common convention
        // The diffing algorithm is tied to add then remove output and this is the simplest
        // route to get the desired output with minimal overhead.

        if (componentPos && components[componentPos - 1].added) {
          var tmp = components[componentPos - 1];
          components[componentPos - 1] = components[componentPos];
          components[componentPos] = tmp;
        }
      }
    } // Special case handle for when one terminal is ignored (i.e. whitespace).
    // For this case we merge the terminal into the prior string and drop the change.
    // This is only available for string mode.


    var lastComponent = components[componentLen - 1];

    if (componentLen > 1 && typeof lastComponent.value === 'string' && (lastComponent.added || lastComponent.removed) && diff.equals('', lastComponent.value)) {
      components[componentLen - 2].value += lastComponent.value;
      components.pop();
    }

    return components;
  }

  function clonePath(path) {
    return {
      newPos: path.newPos,
      components: path.components.slice(0)
    };
  }
});

/*istanbul ignore start*/
var character = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.diffChars = diffChars;
  exports.characterDiff = void 0;
  /*istanbul ignore end*/

  var
  /*istanbul ignore start*/
  _base = _interopRequireDefault(base)
  /*istanbul ignore end*/
  ;
  /*istanbul ignore start*/


  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      "default": obj
    };
  }
  /*istanbul ignore end*/


  var characterDiff = new
  /*istanbul ignore start*/
  _base
  /*istanbul ignore end*/
  [
  /*istanbul ignore start*/
  "default"
  /*istanbul ignore end*/
  ]();
  /*istanbul ignore start*/

  exports.characterDiff = characterDiff;
  /*istanbul ignore end*/

  function diffChars(oldStr, newStr, options) {
    return characterDiff.diff(oldStr, newStr, options);
  }
});

/*istanbul ignore start*/

var generateOptions_1 = generateOptions;
/*istanbul ignore end*/

function generateOptions(options, defaults) {
  if (typeof options === 'function') {
    defaults.callback = options;
  } else if (options) {
    for (var name in options) {
      /* istanbul ignore else */
      if (options.hasOwnProperty(name)) {
        defaults[name] = options[name];
      }
    }
  }

  return defaults;
}

var params = /*#__PURE__*/Object.defineProperty({
  generateOptions: generateOptions_1
}, '__esModule', {
  value: true
});

/*istanbul ignore start*/
var word = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.diffWords = diffWords;
  exports.diffWordsWithSpace = diffWordsWithSpace;
  exports.wordDiff = void 0;
  /*istanbul ignore end*/

  var
  /*istanbul ignore start*/
  _base = _interopRequireDefault(base)
  /*istanbul ignore end*/
  ;
  /*istanbul ignore start*/


  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      "default": obj
    };
  }
  /*istanbul ignore end*/
  // Based on https://en.wikipedia.org/wiki/Latin_script_in_Unicode
  //
  // Ranges and exceptions:
  // Latin-1 Supplement, 0080–00FF
  //  - U+00D7  × Multiplication sign
  //  - U+00F7  ÷ Division sign
  // Latin Extended-A, 0100–017F
  // Latin Extended-B, 0180–024F
  // IPA Extensions, 0250–02AF
  // Spacing Modifier Letters, 02B0–02FF
  //  - U+02C7  ˇ &#711;  Caron
  //  - U+02D8  ˘ &#728;  Breve
  //  - U+02D9  ˙ &#729;  Dot Above
  //  - U+02DA  ˚ &#730;  Ring Above
  //  - U+02DB  ˛ &#731;  Ogonek
  //  - U+02DC  ˜ &#732;  Small Tilde
  //  - U+02DD  ˝ &#733;  Double Acute Accent
  // Latin Extended Additional, 1E00–1EFF


  var extendedWordChars = /^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/;
  var reWhitespace = /\S/;
  var wordDiff = new
  /*istanbul ignore start*/
  _base
  /*istanbul ignore end*/
  [
  /*istanbul ignore start*/
  "default"
  /*istanbul ignore end*/
  ]();
  /*istanbul ignore start*/

  exports.wordDiff = wordDiff;
  /*istanbul ignore end*/

  wordDiff.equals = function (left, right) {
    if (this.options.ignoreCase) {
      left = left.toLowerCase();
      right = right.toLowerCase();
    }

    return left === right || this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right);
  };

  wordDiff.tokenize = function (value) {
    // All whitespace symbols except newline group into one token, each newline - in separate token
    var tokens = value.split(/([^\S\r\n]+|[()[\]{}'"\r\n]|\b)/); // Join the boundary splits that we do not consider to be boundaries. This is primarily the extended Latin character set.

    for (var i = 0; i < tokens.length - 1; i++) {
      // If we have an empty string in the next field and we have only word chars before and after, merge
      if (!tokens[i + 1] && tokens[i + 2] && extendedWordChars.test(tokens[i]) && extendedWordChars.test(tokens[i + 2])) {
        tokens[i] += tokens[i + 2];
        tokens.splice(i + 1, 2);
        i--;
      }
    }

    return tokens;
  };

  function diffWords(oldStr, newStr, options) {
    options =
    /*istanbul ignore start*/
    (/*istanbul ignore end*/

    /*istanbul ignore start*/
    0, params
    /*istanbul ignore end*/
    .
    /*istanbul ignore start*/
    generateOptions
    /*istanbul ignore end*/
    )(options, {
      ignoreWhitespace: true
    });
    return wordDiff.diff(oldStr, newStr, options);
  }

  function diffWordsWithSpace(oldStr, newStr, options) {
    return wordDiff.diff(oldStr, newStr, options);
  }
});

/*istanbul ignore start*/
var line = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.diffLines = diffLines;
  exports.diffTrimmedLines = diffTrimmedLines;
  exports.lineDiff = void 0;
  /*istanbul ignore end*/

  var
  /*istanbul ignore start*/
  _base = _interopRequireDefault(base)
  /*istanbul ignore end*/
  ;
  /*istanbul ignore start*/


  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      "default": obj
    };
  }
  /*istanbul ignore end*/


  var lineDiff = new
  /*istanbul ignore start*/
  _base
  /*istanbul ignore end*/
  [
  /*istanbul ignore start*/
  "default"
  /*istanbul ignore end*/
  ]();
  /*istanbul ignore start*/

  exports.lineDiff = lineDiff;
  /*istanbul ignore end*/

  lineDiff.tokenize = function (value) {
    var retLines = [],
        linesAndNewlines = value.split(/(\n|\r\n)/); // Ignore the final empty token that occurs if the string ends with a new line

    if (!linesAndNewlines[linesAndNewlines.length - 1]) {
      linesAndNewlines.pop();
    } // Merge the content and line separators into single tokens


    for (var i = 0; i < linesAndNewlines.length; i++) {
      var line = linesAndNewlines[i];

      if (i % 2 && !this.options.newlineIsToken) {
        retLines[retLines.length - 1] += line;
      } else {
        if (this.options.ignoreWhitespace) {
          line = line.trim();
        }

        retLines.push(line);
      }
    }

    return retLines;
  };

  function diffLines(oldStr, newStr, callback) {
    return lineDiff.diff(oldStr, newStr, callback);
  }

  function diffTrimmedLines(oldStr, newStr, callback) {
    var options =
    /*istanbul ignore start*/
    (/*istanbul ignore end*/

    /*istanbul ignore start*/
    0, params
    /*istanbul ignore end*/
    .
    /*istanbul ignore start*/
    generateOptions
    /*istanbul ignore end*/
    )(callback, {
      ignoreWhitespace: true
    });
    return lineDiff.diff(oldStr, newStr, options);
  }
});

/*istanbul ignore start*/
var sentence = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.diffSentences = diffSentences;
  exports.sentenceDiff = void 0;
  /*istanbul ignore end*/

  var
  /*istanbul ignore start*/
  _base = _interopRequireDefault(base)
  /*istanbul ignore end*/
  ;
  /*istanbul ignore start*/


  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      "default": obj
    };
  }
  /*istanbul ignore end*/


  var sentenceDiff = new
  /*istanbul ignore start*/
  _base
  /*istanbul ignore end*/
  [
  /*istanbul ignore start*/
  "default"
  /*istanbul ignore end*/
  ]();
  /*istanbul ignore start*/

  exports.sentenceDiff = sentenceDiff;
  /*istanbul ignore end*/

  sentenceDiff.tokenize = function (value) {
    return value.split(/(\S.+?[.!?])(?=\s+|$)/);
  };

  function diffSentences(oldStr, newStr, callback) {
    return sentenceDiff.diff(oldStr, newStr, callback);
  }
});

/*istanbul ignore start*/
var css = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.diffCss = diffCss;
  exports.cssDiff = void 0;
  /*istanbul ignore end*/

  var
  /*istanbul ignore start*/
  _base = _interopRequireDefault(base)
  /*istanbul ignore end*/
  ;
  /*istanbul ignore start*/


  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      "default": obj
    };
  }
  /*istanbul ignore end*/


  var cssDiff = new
  /*istanbul ignore start*/
  _base
  /*istanbul ignore end*/
  [
  /*istanbul ignore start*/
  "default"
  /*istanbul ignore end*/
  ]();
  /*istanbul ignore start*/

  exports.cssDiff = cssDiff;
  /*istanbul ignore end*/

  cssDiff.tokenize = function (value) {
    return value.split(/([{}:;,]|\s+)/);
  };

  function diffCss(oldStr, newStr, callback) {
    return cssDiff.diff(oldStr, newStr, callback);
  }
});

var json = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.diffJson = diffJson;
  exports.canonicalize = canonicalize;
  exports.jsonDiff = void 0;
  /*istanbul ignore end*/

  var
  /*istanbul ignore start*/
  _base = _interopRequireDefault(base)
  /*istanbul ignore end*/
  ;
  /*istanbul ignore start*/


  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      "default": obj
    };
  }

  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function _typeof(obj) {
        return typeof obj;
      };
    } else {
      _typeof = function _typeof(obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }
  /*istanbul ignore end*/


  var objectPrototypeToString = Object.prototype.toString;
  var jsonDiff = new
  /*istanbul ignore start*/
  _base
  /*istanbul ignore end*/
  [
  /*istanbul ignore start*/
  "default"
  /*istanbul ignore end*/
  ](); // Discriminate between two lines of pretty-printed, serialized JSON where one of them has a
  // dangling comma and the other doesn't. Turns out including the dangling comma yields the nicest output:

  /*istanbul ignore start*/

  exports.jsonDiff = jsonDiff;
  /*istanbul ignore end*/

  jsonDiff.useLongestToken = true;
  jsonDiff.tokenize =
  /*istanbul ignore start*/
  line
  /*istanbul ignore end*/
  .
  /*istanbul ignore start*/
  lineDiff
  /*istanbul ignore end*/
  .tokenize;

  jsonDiff.castInput = function (value) {
    /*istanbul ignore start*/
    var _this$options =
    /*istanbul ignore end*/
    this.options,
        undefinedReplacement = _this$options.undefinedReplacement,
        _this$options$stringi = _this$options.stringifyReplacer,
        stringifyReplacer = _this$options$stringi === void 0 ? function (k, v)
    /*istanbul ignore start*/
    {
      return (
        /*istanbul ignore end*/
        typeof v === 'undefined' ? undefinedReplacement : v
      );
    } : _this$options$stringi;
    return typeof value === 'string' ? value : JSON.stringify(canonicalize(value, null, null, stringifyReplacer), stringifyReplacer, '  ');
  };

  jsonDiff.equals = function (left, right) {
    return (
      /*istanbul ignore start*/
      _base
      /*istanbul ignore end*/
      [
      /*istanbul ignore start*/
      "default"
      /*istanbul ignore end*/
      ].prototype.equals.call(jsonDiff, left.replace(/,([\r\n])/g, '$1'), right.replace(/,([\r\n])/g, '$1'))
    );
  };

  function diffJson(oldObj, newObj, options) {
    return jsonDiff.diff(oldObj, newObj, options);
  } // This function handles the presence of circular references by bailing out when encountering an
  // object that is already on the "stack" of items being processed. Accepts an optional replacer


  function canonicalize(obj, stack, replacementStack, replacer, key) {
    stack = stack || [];
    replacementStack = replacementStack || [];

    if (replacer) {
      obj = replacer(key, obj);
    }

    var i;

    for (i = 0; i < stack.length; i += 1) {
      if (stack[i] === obj) {
        return replacementStack[i];
      }
    }

    var canonicalizedObj;

    if ('[object Array]' === objectPrototypeToString.call(obj)) {
      stack.push(obj);
      canonicalizedObj = new Array(obj.length);
      replacementStack.push(canonicalizedObj);

      for (i = 0; i < obj.length; i += 1) {
        canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack, replacer, key);
      }

      stack.pop();
      replacementStack.pop();
      return canonicalizedObj;
    }

    if (obj && obj.toJSON) {
      obj = obj.toJSON();
    }

    if (
    /*istanbul ignore start*/
    _typeof(
    /*istanbul ignore end*/
    obj) === 'object' && obj !== null) {
      stack.push(obj);
      canonicalizedObj = {};
      replacementStack.push(canonicalizedObj);

      var sortedKeys = [],
          _key;

      for (_key in obj) {
        /* istanbul ignore else */
        if (obj.hasOwnProperty(_key)) {
          sortedKeys.push(_key);
        }
      }

      sortedKeys.sort();

      for (i = 0; i < sortedKeys.length; i += 1) {
        _key = sortedKeys[i];
        canonicalizedObj[_key] = canonicalize(obj[_key], stack, replacementStack, replacer, _key);
      }

      stack.pop();
      replacementStack.pop();
    } else {
      canonicalizedObj = obj;
    }

    return canonicalizedObj;
  }
});

/*istanbul ignore start*/
var array$1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.diffArrays = diffArrays;
  exports.arrayDiff = void 0;
  /*istanbul ignore end*/

  var
  /*istanbul ignore start*/
  _base = _interopRequireDefault(base)
  /*istanbul ignore end*/
  ;
  /*istanbul ignore start*/


  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      "default": obj
    };
  }
  /*istanbul ignore end*/


  var arrayDiff = new
  /*istanbul ignore start*/
  _base
  /*istanbul ignore end*/
  [
  /*istanbul ignore start*/
  "default"
  /*istanbul ignore end*/
  ]();
  /*istanbul ignore start*/

  exports.arrayDiff = arrayDiff;
  /*istanbul ignore end*/

  arrayDiff.tokenize = function (value) {
    return value.slice();
  };

  arrayDiff.join = arrayDiff.removeEmpty = function (value) {
    return value;
  };

  function diffArrays(oldArr, newArr, callback) {
    return arrayDiff.diff(oldArr, newArr, callback);
  }
});

/*istanbul ignore start*/

var parsePatch_1 = parsePatch;
/*istanbul ignore end*/

function parsePatch(uniDiff) {
  /*istanbul ignore start*/
  var
  /*istanbul ignore end*/
  options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var diffstr = uniDiff.split(/\r\n|[\n\v\f\r\x85]/),
      delimiters = uniDiff.match(/\r\n|[\n\v\f\r\x85]/g) || [],
      list = [],
      i = 0;

  function parseIndex() {
    var index = {};
    list.push(index); // Parse diff metadata

    while (i < diffstr.length) {
      var line = diffstr[i]; // File header found, end parsing diff metadata

      if (/^(\-\-\-|\+\+\+|@@)\s/.test(line)) {
        break;
      } // Diff index


      var header = /^(?:Index:|diff(?: -r \w+)+)\s+(.+?)\s*$/.exec(line);

      if (header) {
        index.index = header[1];
      }

      i++;
    } // Parse file headers if they are defined. Unified diff requires them, but
    // there's no technical issues to have an isolated hunk without file header


    parseFileHeader(index);
    parseFileHeader(index); // Parse hunks

    index.hunks = [];

    while (i < diffstr.length) {
      var _line = diffstr[i];

      if (/^(Index:|diff|\-\-\-|\+\+\+)\s/.test(_line)) {
        break;
      } else if (/^@@/.test(_line)) {
        index.hunks.push(parseHunk());
      } else if (_line && options.strict) {
        // Ignore unexpected content unless in strict mode
        throw new Error('Unknown line ' + (i + 1) + ' ' + JSON.stringify(_line));
      } else {
        i++;
      }
    }
  } // Parses the --- and +++ headers, if none are found, no lines
  // are consumed.


  function parseFileHeader(index) {
    var fileHeader = /^(---|\+\+\+)\s+(.*)$/.exec(diffstr[i]);

    if (fileHeader) {
      var keyPrefix = fileHeader[1] === '---' ? 'old' : 'new';
      var data = fileHeader[2].split('\t', 2);
      var fileName = data[0].replace(/\\\\/g, '\\');

      if (/^".*"$/.test(fileName)) {
        fileName = fileName.substr(1, fileName.length - 2);
      }

      index[keyPrefix + 'FileName'] = fileName;
      index[keyPrefix + 'Header'] = (data[1] || '').trim();
      i++;
    }
  } // Parses a hunk
  // This assumes that we are at the start of a hunk.


  function parseHunk() {
    var chunkHeaderIndex = i,
        chunkHeaderLine = diffstr[i++],
        chunkHeader = chunkHeaderLine.split(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    var hunk = {
      oldStart: +chunkHeader[1],
      oldLines: typeof chunkHeader[2] === 'undefined' ? 1 : +chunkHeader[2],
      newStart: +chunkHeader[3],
      newLines: typeof chunkHeader[4] === 'undefined' ? 1 : +chunkHeader[4],
      lines: [],
      linedelimiters: []
    }; // Unified Diff Format quirk: If the chunk size is 0,
    // the first number is one lower than one would expect.
    // https://www.artima.com/weblogs/viewpost.jsp?thread=164293

    if (hunk.oldLines === 0) {
      hunk.oldStart += 1;
    }

    if (hunk.newLines === 0) {
      hunk.newStart += 1;
    }

    var addCount = 0,
        removeCount = 0;

    for (; i < diffstr.length; i++) {
      // Lines starting with '---' could be mistaken for the "remove line" operation
      // But they could be the header for the next file. Therefore prune such cases out.
      if (diffstr[i].indexOf('--- ') === 0 && i + 2 < diffstr.length && diffstr[i + 1].indexOf('+++ ') === 0 && diffstr[i + 2].indexOf('@@') === 0) {
        break;
      }

      var operation = diffstr[i].length == 0 && i != diffstr.length - 1 ? ' ' : diffstr[i][0];

      if (operation === '+' || operation === '-' || operation === ' ' || operation === '\\') {
        hunk.lines.push(diffstr[i]);
        hunk.linedelimiters.push(delimiters[i] || '\n');

        if (operation === '+') {
          addCount++;
        } else if (operation === '-') {
          removeCount++;
        } else if (operation === ' ') {
          addCount++;
          removeCount++;
        }
      } else {
        break;
      }
    } // Handle the empty block count case


    if (!addCount && hunk.newLines === 1) {
      hunk.newLines = 0;
    }

    if (!removeCount && hunk.oldLines === 1) {
      hunk.oldLines = 0;
    } // Perform optional sanity checking


    if (options.strict) {
      if (addCount !== hunk.newLines) {
        throw new Error('Added line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
      }

      if (removeCount !== hunk.oldLines) {
        throw new Error('Removed line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
      }
    }

    return hunk;
  }

  while (i < diffstr.length) {
    parseIndex();
  }

  return list;
}

var parse = /*#__PURE__*/Object.defineProperty({
  parsePatch: parsePatch_1
}, '__esModule', {
  value: true
});

/*istanbul ignore start*/
var distanceIterator = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports["default"] = _default;
  /*istanbul ignore end*/
  // Iterator that traverses in the range of [min, max], stepping
  // by distance from a given start position. I.e. for [0, 4], with
  // start of 2, this will iterate 2, 3, 1, 4, 0.

  function
  /*istanbul ignore start*/
  _default
  /*istanbul ignore end*/
  (start, minLine, maxLine) {
    var wantForward = true,
        backwardExhausted = false,
        forwardExhausted = false,
        localOffset = 1;
    return function iterator() {
      if (wantForward && !forwardExhausted) {
        if (backwardExhausted) {
          localOffset++;
        } else {
          wantForward = false;
        } // Check if trying to fit beyond text length, and if not, check it fits
        // after offset location (or desired location on first iteration)


        if (start + localOffset <= maxLine) {
          return localOffset;
        }

        forwardExhausted = true;
      }

      if (!backwardExhausted) {
        if (!forwardExhausted) {
          wantForward = true;
        } // Check if trying to fit before text beginning, and if not, check it fits
        // before offset location


        if (minLine <= start - localOffset) {
          return -localOffset++;
        }

        backwardExhausted = true;
        return iterator();
      } // We tried to fit hunk before text beginning and beyond text length, then
      // hunk can't fit on the text. Return undefined

    };
  }
});

/*istanbul ignore start*/

var applyPatch_1 = applyPatch;
var applyPatches_1 = applyPatches;
/*istanbul ignore end*/

var
/*istanbul ignore start*/
_distanceIterator = _interopRequireDefault(distanceIterator)
/*istanbul ignore end*/
;
/*istanbul ignore start*/


function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}
/*istanbul ignore end*/


function applyPatch(source, uniDiff) {
  /*istanbul ignore start*/
  var
  /*istanbul ignore end*/
  options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (typeof uniDiff === 'string') {
    uniDiff =
    /*istanbul ignore start*/
    (/*istanbul ignore end*/

    /*istanbul ignore start*/
    0, parse
    /*istanbul ignore end*/
    .
    /*istanbul ignore start*/
    parsePatch
    /*istanbul ignore end*/
    )(uniDiff);
  }

  if (Array.isArray(uniDiff)) {
    if (uniDiff.length > 1) {
      throw new Error('applyPatch only works with a single input.');
    }

    uniDiff = uniDiff[0];
  } // Apply the diff to the input


  var lines = source.split(/\r\n|[\n\v\f\r\x85]/),
      delimiters = source.match(/\r\n|[\n\v\f\r\x85]/g) || [],
      hunks = uniDiff.hunks,
      compareLine = options.compareLine || function (lineNumber, line, operation, patchContent)
  /*istanbul ignore start*/
  {
    return (
      /*istanbul ignore end*/
      line === patchContent
    );
  },
      errorCount = 0,
      fuzzFactor = options.fuzzFactor || 0,
      minLine = 0,
      offset = 0,
      removeEOFNL,
      addEOFNL;
  /**
   * Checks if the hunk exactly fits on the provided location
   */


  function hunkFits(hunk, toPos) {
    for (var j = 0; j < hunk.lines.length; j++) {
      var line = hunk.lines[j],
          operation = line.length > 0 ? line[0] : ' ',
          content = line.length > 0 ? line.substr(1) : line;

      if (operation === ' ' || operation === '-') {
        // Context sanity check
        if (!compareLine(toPos + 1, lines[toPos], operation, content)) {
          errorCount++;

          if (errorCount > fuzzFactor) {
            return false;
          }
        }

        toPos++;
      }
    }

    return true;
  } // Search best fit offsets for each hunk based on the previous ones


  for (var i = 0; i < hunks.length; i++) {
    var hunk = hunks[i],
        maxLine = lines.length - hunk.oldLines,
        localOffset = 0,
        toPos = offset + hunk.oldStart - 1;
    var iterator =
    /*istanbul ignore start*/
    (/*istanbul ignore end*/

    /*istanbul ignore start*/
    0, _distanceIterator
    /*istanbul ignore end*/
    [
    /*istanbul ignore start*/
    "default"
    /*istanbul ignore end*/
    ])(toPos, minLine, maxLine);

    for (; localOffset !== undefined; localOffset = iterator()) {
      if (hunkFits(hunk, toPos + localOffset)) {
        hunk.offset = offset += localOffset;
        break;
      }
    }

    if (localOffset === undefined) {
      return false;
    } // Set lower text limit to end of the current hunk, so next ones don't try
    // to fit over already patched text


    minLine = hunk.offset + hunk.oldStart + hunk.oldLines;
  } // Apply patch hunks


  var diffOffset = 0;

  for (var _i = 0; _i < hunks.length; _i++) {
    var _hunk = hunks[_i],
        _toPos = _hunk.oldStart + _hunk.offset + diffOffset - 1;

    diffOffset += _hunk.newLines - _hunk.oldLines;

    for (var j = 0; j < _hunk.lines.length; j++) {
      var line = _hunk.lines[j],
          operation = line.length > 0 ? line[0] : ' ',
          content = line.length > 0 ? line.substr(1) : line,
          delimiter = _hunk.linedelimiters[j];

      if (operation === ' ') {
        _toPos++;
      } else if (operation === '-') {
        lines.splice(_toPos, 1);
        delimiters.splice(_toPos, 1);
        /* istanbul ignore else */
      } else if (operation === '+') {
        lines.splice(_toPos, 0, content);
        delimiters.splice(_toPos, 0, delimiter);
        _toPos++;
      } else if (operation === '\\') {
        var previousOperation = _hunk.lines[j - 1] ? _hunk.lines[j - 1][0] : null;

        if (previousOperation === '+') {
          removeEOFNL = true;
        } else if (previousOperation === '-') {
          addEOFNL = true;
        }
      }
    }
  } // Handle EOFNL insertion/removal


  if (removeEOFNL) {
    while (!lines[lines.length - 1]) {
      lines.pop();
      delimiters.pop();
    }
  } else if (addEOFNL) {
    lines.push('');
    delimiters.push('\n');
  }

  for (var _k = 0; _k < lines.length - 1; _k++) {
    lines[_k] = lines[_k] + delimiters[_k];
  }

  return lines.join('');
} // Wrapper that supports multiple file patches via callbacks.


function applyPatches(uniDiff, options) {
  if (typeof uniDiff === 'string') {
    uniDiff =
    /*istanbul ignore start*/
    (/*istanbul ignore end*/

    /*istanbul ignore start*/
    0, parse
    /*istanbul ignore end*/
    .
    /*istanbul ignore start*/
    parsePatch
    /*istanbul ignore end*/
    )(uniDiff);
  }

  var currentIndex = 0;

  function processIndex() {
    var index = uniDiff[currentIndex++];

    if (!index) {
      return options.complete();
    }

    options.loadFile(index, function (err, data) {
      if (err) {
        return options.complete(err);
      }

      var updatedContent = applyPatch(data, index, options);
      options.patched(index, updatedContent, function (err) {
        if (err) {
          return options.complete(err);
        }

        processIndex();
      });
    });
  }

  processIndex();
}

var apply$1 = /*#__PURE__*/Object.defineProperty({
  applyPatch: applyPatch_1,
  applyPatches: applyPatches_1
}, '__esModule', {
  value: true
});

/*istanbul ignore start*/

var structuredPatch_1 = structuredPatch;
var formatPatch_1 = formatPatch;
var createTwoFilesPatch_1 = createTwoFilesPatch;
var createPatch_1 = createPatch;
/*istanbul ignore end*/

/*istanbul ignore start*/

function _toConsumableArray$1(arr) {
  return _arrayWithoutHoles$1(arr) || _iterableToArray$1(arr) || _unsupportedIterableToArray$1(arr) || _nonIterableSpread$1();
}

function _nonIterableSpread$1() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _unsupportedIterableToArray$1(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray$1(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$1(o, minLen);
}

function _iterableToArray$1(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}

function _arrayWithoutHoles$1(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray$1(arr);
}

function _arrayLikeToArray$1(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }

  return arr2;
}
/*istanbul ignore end*/


function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  if (!options) {
    options = {};
  }

  if (typeof options.context === 'undefined') {
    options.context = 4;
  }

  var diff =
  /*istanbul ignore start*/
  (/*istanbul ignore end*/

  /*istanbul ignore start*/
  0, line
  /*istanbul ignore end*/
  .
  /*istanbul ignore start*/
  diffLines
  /*istanbul ignore end*/
  )(oldStr, newStr, options);
  diff.push({
    value: '',
    lines: []
  }); // Append an empty value to make cleanup easier

  function contextLines(lines) {
    return lines.map(function (entry) {
      return ' ' + entry;
    });
  }

  var hunks = [];
  var oldRangeStart = 0,
      newRangeStart = 0,
      curRange = [],
      oldLine = 1,
      newLine = 1;
  /*istanbul ignore start*/

  var _loop = function _loop(
  /*istanbul ignore end*/
  i) {
    var current = diff[i],
        lines = current.lines || current.value.replace(/\n$/, '').split('\n');
    current.lines = lines;

    if (current.added || current.removed) {
      /*istanbul ignore start*/
      var _curRange;
      /*istanbul ignore end*/
      // If we have previous context, start with that


      if (!oldRangeStart) {
        var prev = diff[i - 1];
        oldRangeStart = oldLine;
        newRangeStart = newLine;

        if (prev) {
          curRange = options.context > 0 ? contextLines(prev.lines.slice(-options.context)) : [];
          oldRangeStart -= curRange.length;
          newRangeStart -= curRange.length;
        }
      } // Output our changes

      /*istanbul ignore start*/

      /*istanbul ignore end*/

      /*istanbul ignore start*/


      (_curRange =
      /*istanbul ignore end*/
      curRange).push.apply(
      /*istanbul ignore start*/
      _curRange
      /*istanbul ignore end*/
      ,
      /*istanbul ignore start*/
      _toConsumableArray$1(
      /*istanbul ignore end*/
      lines.map(function (entry) {
        return (current.added ? '+' : '-') + entry;
      }))); // Track the updated file position


      if (current.added) {
        newLine += lines.length;
      } else {
        oldLine += lines.length;
      }
    } else {
      // Identical context lines. Track line changes
      if (oldRangeStart) {
        // Close out any changes that have been output (or join overlapping)
        if (lines.length <= options.context * 2 && i < diff.length - 2) {
          /*istanbul ignore start*/
          var _curRange2;
          /*istanbul ignore end*/
          // Overlapping

          /*istanbul ignore start*/

          /*istanbul ignore end*/

          /*istanbul ignore start*/


          (_curRange2 =
          /*istanbul ignore end*/
          curRange).push.apply(
          /*istanbul ignore start*/
          _curRange2
          /*istanbul ignore end*/
          ,
          /*istanbul ignore start*/
          _toConsumableArray$1(
          /*istanbul ignore end*/
          contextLines(lines)));
        } else {
          /*istanbul ignore start*/
          var _curRange3;
          /*istanbul ignore end*/
          // end the range and output


          var contextSize = Math.min(lines.length, options.context);
          /*istanbul ignore start*/

          /*istanbul ignore end*/

          /*istanbul ignore start*/

          (_curRange3 =
          /*istanbul ignore end*/
          curRange).push.apply(
          /*istanbul ignore start*/
          _curRange3
          /*istanbul ignore end*/
          ,
          /*istanbul ignore start*/
          _toConsumableArray$1(
          /*istanbul ignore end*/
          contextLines(lines.slice(0, contextSize))));

          var hunk = {
            oldStart: oldRangeStart,
            oldLines: oldLine - oldRangeStart + contextSize,
            newStart: newRangeStart,
            newLines: newLine - newRangeStart + contextSize,
            lines: curRange
          };

          if (i >= diff.length - 2 && lines.length <= options.context) {
            // EOF is inside this hunk
            var oldEOFNewline = /\n$/.test(oldStr);
            var newEOFNewline = /\n$/.test(newStr);
            var noNlBeforeAdds = lines.length == 0 && curRange.length > hunk.oldLines;

            if (!oldEOFNewline && noNlBeforeAdds && oldStr.length > 0) {
              // special case: old has no eol and no trailing context; no-nl can end up before adds
              // however, if the old file is empty, do not output the no-nl line
              curRange.splice(hunk.oldLines, 0, '\\ No newline at end of file');
            }

            if (!oldEOFNewline && !noNlBeforeAdds || !newEOFNewline) {
              curRange.push('\\ No newline at end of file');
            }
          }

          hunks.push(hunk);
          oldRangeStart = 0;
          newRangeStart = 0;
          curRange = [];
        }
      }

      oldLine += lines.length;
      newLine += lines.length;
    }
  };

  for (var i = 0; i < diff.length; i++) {
    /*istanbul ignore start*/
    _loop(
    /*istanbul ignore end*/
    i);
  }

  return {
    oldFileName: oldFileName,
    newFileName: newFileName,
    oldHeader: oldHeader,
    newHeader: newHeader,
    hunks: hunks
  };
}

function formatPatch(diff) {
  var ret = [];

  if (diff.oldFileName == diff.newFileName) {
    ret.push('Index: ' + diff.oldFileName);
  }

  ret.push('===================================================================');
  ret.push('--- ' + diff.oldFileName + (typeof diff.oldHeader === 'undefined' ? '' : '\t' + diff.oldHeader));
  ret.push('+++ ' + diff.newFileName + (typeof diff.newHeader === 'undefined' ? '' : '\t' + diff.newHeader));

  for (var i = 0; i < diff.hunks.length; i++) {
    var hunk = diff.hunks[i]; // Unified Diff Format quirk: If the chunk size is 0,
    // the first number is one lower than one would expect.
    // https://www.artima.com/weblogs/viewpost.jsp?thread=164293

    if (hunk.oldLines === 0) {
      hunk.oldStart -= 1;
    }

    if (hunk.newLines === 0) {
      hunk.newStart -= 1;
    }

    ret.push('@@ -' + hunk.oldStart + ',' + hunk.oldLines + ' +' + hunk.newStart + ',' + hunk.newLines + ' @@');
    ret.push.apply(ret, hunk.lines);
  }

  return ret.join('\n') + '\n';
}

function createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  return formatPatch(structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options));
}

function createPatch(fileName, oldStr, newStr, oldHeader, newHeader, options) {
  return createTwoFilesPatch(fileName, fileName, oldStr, newStr, oldHeader, newHeader, options);
}

var create = /*#__PURE__*/Object.defineProperty({
  structuredPatch: structuredPatch_1,
  formatPatch: formatPatch_1,
  createTwoFilesPatch: createTwoFilesPatch_1,
  createPatch: createPatch_1
}, '__esModule', {
  value: true
});

/*istanbul ignore start*/

var arrayEqual_1 = arrayEqual;
var arrayStartsWith_1 = arrayStartsWith;
/*istanbul ignore end*/

function arrayEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  return arrayStartsWith(a, b);
}

function arrayStartsWith(array, start) {
  if (start.length > array.length) {
    return false;
  }

  for (var i = 0; i < start.length; i++) {
    if (start[i] !== array[i]) {
      return false;
    }
  }

  return true;
}

var array = /*#__PURE__*/Object.defineProperty({
  arrayEqual: arrayEqual_1,
  arrayStartsWith: arrayStartsWith_1
}, '__esModule', {
  value: true
});

/*istanbul ignore start*/

var calcLineCount_1 = calcLineCount;
var merge_2 = merge;
/*istanbul ignore end*/

/*istanbul ignore start*/

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }

  return arr2;
}
/*istanbul ignore end*/


function calcLineCount(hunk) {
  /*istanbul ignore start*/
  var _calcOldNewLineCount =
  /*istanbul ignore end*/
  calcOldNewLineCount(hunk.lines),
      oldLines = _calcOldNewLineCount.oldLines,
      newLines = _calcOldNewLineCount.newLines;

  if (oldLines !== undefined) {
    hunk.oldLines = oldLines;
  } else {
    delete hunk.oldLines;
  }

  if (newLines !== undefined) {
    hunk.newLines = newLines;
  } else {
    delete hunk.newLines;
  }
}

function merge(mine, theirs, base) {
  mine = loadPatch(mine, base);
  theirs = loadPatch(theirs, base);
  var ret = {}; // For index we just let it pass through as it doesn't have any necessary meaning.
  // Leaving sanity checks on this to the API consumer that may know more about the
  // meaning in their own context.

  if (mine.index || theirs.index) {
    ret.index = mine.index || theirs.index;
  }

  if (mine.newFileName || theirs.newFileName) {
    if (!fileNameChanged(mine)) {
      // No header or no change in ours, use theirs (and ours if theirs does not exist)
      ret.oldFileName = theirs.oldFileName || mine.oldFileName;
      ret.newFileName = theirs.newFileName || mine.newFileName;
      ret.oldHeader = theirs.oldHeader || mine.oldHeader;
      ret.newHeader = theirs.newHeader || mine.newHeader;
    } else if (!fileNameChanged(theirs)) {
      // No header or no change in theirs, use ours
      ret.oldFileName = mine.oldFileName;
      ret.newFileName = mine.newFileName;
      ret.oldHeader = mine.oldHeader;
      ret.newHeader = mine.newHeader;
    } else {
      // Both changed... figure it out
      ret.oldFileName = selectField(ret, mine.oldFileName, theirs.oldFileName);
      ret.newFileName = selectField(ret, mine.newFileName, theirs.newFileName);
      ret.oldHeader = selectField(ret, mine.oldHeader, theirs.oldHeader);
      ret.newHeader = selectField(ret, mine.newHeader, theirs.newHeader);
    }
  }

  ret.hunks = [];
  var mineIndex = 0,
      theirsIndex = 0,
      mineOffset = 0,
      theirsOffset = 0;

  while (mineIndex < mine.hunks.length || theirsIndex < theirs.hunks.length) {
    var mineCurrent = mine.hunks[mineIndex] || {
      oldStart: Infinity
    },
        theirsCurrent = theirs.hunks[theirsIndex] || {
      oldStart: Infinity
    };

    if (hunkBefore(mineCurrent, theirsCurrent)) {
      // This patch does not overlap with any of the others, yay.
      ret.hunks.push(cloneHunk(mineCurrent, mineOffset));
      mineIndex++;
      theirsOffset += mineCurrent.newLines - mineCurrent.oldLines;
    } else if (hunkBefore(theirsCurrent, mineCurrent)) {
      // This patch does not overlap with any of the others, yay.
      ret.hunks.push(cloneHunk(theirsCurrent, theirsOffset));
      theirsIndex++;
      mineOffset += theirsCurrent.newLines - theirsCurrent.oldLines;
    } else {
      // Overlap, merge as best we can
      var mergedHunk = {
        oldStart: Math.min(mineCurrent.oldStart, theirsCurrent.oldStart),
        oldLines: 0,
        newStart: Math.min(mineCurrent.newStart + mineOffset, theirsCurrent.oldStart + theirsOffset),
        newLines: 0,
        lines: []
      };
      mergeLines(mergedHunk, mineCurrent.oldStart, mineCurrent.lines, theirsCurrent.oldStart, theirsCurrent.lines);
      theirsIndex++;
      mineIndex++;
      ret.hunks.push(mergedHunk);
    }
  }

  return ret;
}

function loadPatch(param, base) {
  if (typeof param === 'string') {
    if (/^@@/m.test(param) || /^Index:/m.test(param)) {
      return (
        /*istanbul ignore start*/
        (/*istanbul ignore end*/

        /*istanbul ignore start*/
        0, parse
        /*istanbul ignore end*/
        .
        /*istanbul ignore start*/
        parsePatch
        /*istanbul ignore end*/
        )(param)[0]
      );
    }

    if (!base) {
      throw new Error('Must provide a base reference or pass in a patch');
    }

    return (
      /*istanbul ignore start*/
      (/*istanbul ignore end*/

      /*istanbul ignore start*/
      0, create
      /*istanbul ignore end*/
      .
      /*istanbul ignore start*/
      structuredPatch
      /*istanbul ignore end*/
      )(undefined, undefined, base, param)
    );
  }

  return param;
}

function fileNameChanged(patch) {
  return patch.newFileName && patch.newFileName !== patch.oldFileName;
}

function selectField(index, mine, theirs) {
  if (mine === theirs) {
    return mine;
  } else {
    index.conflict = true;
    return {
      mine: mine,
      theirs: theirs
    };
  }
}

function hunkBefore(test, check) {
  return test.oldStart < check.oldStart && test.oldStart + test.oldLines < check.oldStart;
}

function cloneHunk(hunk, offset) {
  return {
    oldStart: hunk.oldStart,
    oldLines: hunk.oldLines,
    newStart: hunk.newStart + offset,
    newLines: hunk.newLines,
    lines: hunk.lines
  };
}

function mergeLines(hunk, mineOffset, mineLines, theirOffset, theirLines) {
  // This will generally result in a conflicted hunk, but there are cases where the context
  // is the only overlap where we can successfully merge the content here.
  var mine = {
    offset: mineOffset,
    lines: mineLines,
    index: 0
  },
      their = {
    offset: theirOffset,
    lines: theirLines,
    index: 0
  }; // Handle any leading content

  insertLeading(hunk, mine, their);
  insertLeading(hunk, their, mine); // Now in the overlap content. Scan through and select the best changes from each.

  while (mine.index < mine.lines.length && their.index < their.lines.length) {
    var mineCurrent = mine.lines[mine.index],
        theirCurrent = their.lines[their.index];

    if ((mineCurrent[0] === '-' || mineCurrent[0] === '+') && (theirCurrent[0] === '-' || theirCurrent[0] === '+')) {
      // Both modified ...
      mutualChange(hunk, mine, their);
    } else if (mineCurrent[0] === '+' && theirCurrent[0] === ' ') {
      /*istanbul ignore start*/
      var _hunk$lines;
      /*istanbul ignore end*/
      // Mine inserted

      /*istanbul ignore start*/

      /*istanbul ignore end*/

      /*istanbul ignore start*/


      (_hunk$lines =
      /*istanbul ignore end*/
      hunk.lines).push.apply(
      /*istanbul ignore start*/
      _hunk$lines
      /*istanbul ignore end*/
      ,
      /*istanbul ignore start*/
      _toConsumableArray(
      /*istanbul ignore end*/
      collectChange(mine)));
    } else if (theirCurrent[0] === '+' && mineCurrent[0] === ' ') {
      /*istanbul ignore start*/
      var _hunk$lines2;
      /*istanbul ignore end*/
      // Theirs inserted

      /*istanbul ignore start*/

      /*istanbul ignore end*/

      /*istanbul ignore start*/


      (_hunk$lines2 =
      /*istanbul ignore end*/
      hunk.lines).push.apply(
      /*istanbul ignore start*/
      _hunk$lines2
      /*istanbul ignore end*/
      ,
      /*istanbul ignore start*/
      _toConsumableArray(
      /*istanbul ignore end*/
      collectChange(their)));
    } else if (mineCurrent[0] === '-' && theirCurrent[0] === ' ') {
      // Mine removed or edited
      removal(hunk, mine, their);
    } else if (theirCurrent[0] === '-' && mineCurrent[0] === ' ') {
      // Their removed or edited
      removal(hunk, their, mine, true);
    } else if (mineCurrent === theirCurrent) {
      // Context identity
      hunk.lines.push(mineCurrent);
      mine.index++;
      their.index++;
    } else {
      // Context mismatch
      conflict(hunk, collectChange(mine), collectChange(their));
    }
  } // Now push anything that may be remaining


  insertTrailing(hunk, mine);
  insertTrailing(hunk, their);
  calcLineCount(hunk);
}

function mutualChange(hunk, mine, their) {
  var myChanges = collectChange(mine),
      theirChanges = collectChange(their);

  if (allRemoves(myChanges) && allRemoves(theirChanges)) {
    // Special case for remove changes that are supersets of one another
    if (
    /*istanbul ignore start*/
    (/*istanbul ignore end*/

    /*istanbul ignore start*/
    0, array
    /*istanbul ignore end*/
    .
    /*istanbul ignore start*/
    arrayStartsWith
    /*istanbul ignore end*/
    )(myChanges, theirChanges) && skipRemoveSuperset(their, myChanges, myChanges.length - theirChanges.length)) {
      /*istanbul ignore start*/
      var _hunk$lines3;
      /*istanbul ignore end*/

      /*istanbul ignore start*/

      /*istanbul ignore end*/

      /*istanbul ignore start*/


      (_hunk$lines3 =
      /*istanbul ignore end*/
      hunk.lines).push.apply(
      /*istanbul ignore start*/
      _hunk$lines3
      /*istanbul ignore end*/
      ,
      /*istanbul ignore start*/
      _toConsumableArray(
      /*istanbul ignore end*/
      myChanges));

      return;
    } else if (
    /*istanbul ignore start*/
    (/*istanbul ignore end*/

    /*istanbul ignore start*/
    0, array
    /*istanbul ignore end*/
    .
    /*istanbul ignore start*/
    arrayStartsWith
    /*istanbul ignore end*/
    )(theirChanges, myChanges) && skipRemoveSuperset(mine, theirChanges, theirChanges.length - myChanges.length)) {
      /*istanbul ignore start*/
      var _hunk$lines4;
      /*istanbul ignore end*/

      /*istanbul ignore start*/

      /*istanbul ignore end*/

      /*istanbul ignore start*/


      (_hunk$lines4 =
      /*istanbul ignore end*/
      hunk.lines).push.apply(
      /*istanbul ignore start*/
      _hunk$lines4
      /*istanbul ignore end*/
      ,
      /*istanbul ignore start*/
      _toConsumableArray(
      /*istanbul ignore end*/
      theirChanges));

      return;
    }
  } else if (
  /*istanbul ignore start*/
  (/*istanbul ignore end*/

  /*istanbul ignore start*/
  0, array
  /*istanbul ignore end*/
  .
  /*istanbul ignore start*/
  arrayEqual
  /*istanbul ignore end*/
  )(myChanges, theirChanges)) {
    /*istanbul ignore start*/
    var _hunk$lines5;
    /*istanbul ignore end*/

    /*istanbul ignore start*/

    /*istanbul ignore end*/

    /*istanbul ignore start*/


    (_hunk$lines5 =
    /*istanbul ignore end*/
    hunk.lines).push.apply(
    /*istanbul ignore start*/
    _hunk$lines5
    /*istanbul ignore end*/
    ,
    /*istanbul ignore start*/
    _toConsumableArray(
    /*istanbul ignore end*/
    myChanges));

    return;
  }

  conflict(hunk, myChanges, theirChanges);
}

function removal(hunk, mine, their, swap) {
  var myChanges = collectChange(mine),
      theirChanges = collectContext(their, myChanges);

  if (theirChanges.merged) {
    /*istanbul ignore start*/
    var _hunk$lines6;
    /*istanbul ignore end*/

    /*istanbul ignore start*/

    /*istanbul ignore end*/

    /*istanbul ignore start*/


    (_hunk$lines6 =
    /*istanbul ignore end*/
    hunk.lines).push.apply(
    /*istanbul ignore start*/
    _hunk$lines6
    /*istanbul ignore end*/
    ,
    /*istanbul ignore start*/
    _toConsumableArray(
    /*istanbul ignore end*/
    theirChanges.merged));
  } else {
    conflict(hunk, swap ? theirChanges : myChanges, swap ? myChanges : theirChanges);
  }
}

function conflict(hunk, mine, their) {
  hunk.conflict = true;
  hunk.lines.push({
    conflict: true,
    mine: mine,
    theirs: their
  });
}

function insertLeading(hunk, insert, their) {
  while (insert.offset < their.offset && insert.index < insert.lines.length) {
    var line = insert.lines[insert.index++];
    hunk.lines.push(line);
    insert.offset++;
  }
}

function insertTrailing(hunk, insert) {
  while (insert.index < insert.lines.length) {
    var line = insert.lines[insert.index++];
    hunk.lines.push(line);
  }
}

function collectChange(state) {
  var ret = [],
      operation = state.lines[state.index][0];

  while (state.index < state.lines.length) {
    var line = state.lines[state.index]; // Group additions that are immediately after subtractions and treat them as one "atomic" modify change.

    if (operation === '-' && line[0] === '+') {
      operation = '+';
    }

    if (operation === line[0]) {
      ret.push(line);
      state.index++;
    } else {
      break;
    }
  }

  return ret;
}

function collectContext(state, matchChanges) {
  var changes = [],
      merged = [],
      matchIndex = 0,
      contextChanges = false,
      conflicted = false;

  while (matchIndex < matchChanges.length && state.index < state.lines.length) {
    var change = state.lines[state.index],
        match = matchChanges[matchIndex]; // Once we've hit our add, then we are done

    if (match[0] === '+') {
      break;
    }

    contextChanges = contextChanges || change[0] !== ' ';
    merged.push(match);
    matchIndex++; // Consume any additions in the other block as a conflict to attempt
    // to pull in the remaining context after this

    if (change[0] === '+') {
      conflicted = true;

      while (change[0] === '+') {
        changes.push(change);
        change = state.lines[++state.index];
      }
    }

    if (match.substr(1) === change.substr(1)) {
      changes.push(change);
      state.index++;
    } else {
      conflicted = true;
    }
  }

  if ((matchChanges[matchIndex] || '')[0] === '+' && contextChanges) {
    conflicted = true;
  }

  if (conflicted) {
    return changes;
  }

  while (matchIndex < matchChanges.length) {
    merged.push(matchChanges[matchIndex++]);
  }

  return {
    merged: merged,
    changes: changes
  };
}

function allRemoves(changes) {
  return changes.reduce(function (prev, change) {
    return prev && change[0] === '-';
  }, true);
}

function skipRemoveSuperset(state, removeChanges, delta) {
  for (var i = 0; i < delta; i++) {
    var changeContent = removeChanges[removeChanges.length - delta + i].substr(1);

    if (state.lines[state.index + i] !== ' ' + changeContent) {
      return false;
    }
  }

  state.index += delta;
  return true;
}

function calcOldNewLineCount(lines) {
  var oldLines = 0;
  var newLines = 0;
  lines.forEach(function (line) {
    if (typeof line !== 'string') {
      var myCount = calcOldNewLineCount(line.mine);
      var theirCount = calcOldNewLineCount(line.theirs);

      if (oldLines !== undefined) {
        if (myCount.oldLines === theirCount.oldLines) {
          oldLines += myCount.oldLines;
        } else {
          oldLines = undefined;
        }
      }

      if (newLines !== undefined) {
        if (myCount.newLines === theirCount.newLines) {
          newLines += myCount.newLines;
        } else {
          newLines = undefined;
        }
      }
    } else {
      if (newLines !== undefined && (line[0] === '+' || line[0] === ' ')) {
        newLines++;
      }

      if (oldLines !== undefined && (line[0] === '-' || line[0] === ' ')) {
        oldLines++;
      }
    }
  });
  return {
    oldLines: oldLines,
    newLines: newLines
  };
}

var merge_1 = /*#__PURE__*/Object.defineProperty({
  calcLineCount: calcLineCount_1,
  merge: merge_2
}, '__esModule', {
  value: true
});

/*istanbul ignore start*/

var convertChangesToDMP_1 = convertChangesToDMP;
/*istanbul ignore end*/
// See: http://code.google.com/p/google-diff-match-patch/wiki/API

function convertChangesToDMP(changes) {
  var ret = [],
      change,
      operation;

  for (var i = 0; i < changes.length; i++) {
    change = changes[i];

    if (change.added) {
      operation = 1;
    } else if (change.removed) {
      operation = -1;
    } else {
      operation = 0;
    }

    ret.push([operation, change.value]);
  }

  return ret;
}

var dmp = /*#__PURE__*/Object.defineProperty({
  convertChangesToDMP: convertChangesToDMP_1
}, '__esModule', {
  value: true
});

/*istanbul ignore start*/

var convertChangesToXML_1 = convertChangesToXML;
/*istanbul ignore end*/

function convertChangesToXML(changes) {
  var ret = [];

  for (var i = 0; i < changes.length; i++) {
    var change = changes[i];

    if (change.added) {
      ret.push('<ins>');
    } else if (change.removed) {
      ret.push('<del>');
    }

    ret.push(escapeHTML(change.value));

    if (change.added) {
      ret.push('</ins>');
    } else if (change.removed) {
      ret.push('</del>');
    }
  }

  return ret.join('');
}

function escapeHTML(s) {
  var n = s;
  n = n.replace(/&/g, '&amp;');
  n = n.replace(/</g, '&lt;');
  n = n.replace(/>/g, '&gt;');
  n = n.replace(/"/g, '&quot;');
  return n;
}

var xml = /*#__PURE__*/Object.defineProperty({
  convertChangesToXML: convertChangesToXML_1
}, '__esModule', {
  value: true
});

/*istanbul ignore start*/
var lib$1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "Diff", {
    enumerable: true,
    get: function get() {
      return _base["default"];
    }
  });
  Object.defineProperty(exports, "diffChars", {
    enumerable: true,
    get: function get() {
      return character.diffChars;
    }
  });
  Object.defineProperty(exports, "diffWords", {
    enumerable: true,
    get: function get() {
      return word.diffWords;
    }
  });
  Object.defineProperty(exports, "diffWordsWithSpace", {
    enumerable: true,
    get: function get() {
      return word.diffWordsWithSpace;
    }
  });
  Object.defineProperty(exports, "diffLines", {
    enumerable: true,
    get: function get() {
      return line.diffLines;
    }
  });
  Object.defineProperty(exports, "diffTrimmedLines", {
    enumerable: true,
    get: function get() {
      return line.diffTrimmedLines;
    }
  });
  Object.defineProperty(exports, "diffSentences", {
    enumerable: true,
    get: function get() {
      return sentence.diffSentences;
    }
  });
  Object.defineProperty(exports, "diffCss", {
    enumerable: true,
    get: function get() {
      return css.diffCss;
    }
  });
  Object.defineProperty(exports, "diffJson", {
    enumerable: true,
    get: function get() {
      return json.diffJson;
    }
  });
  Object.defineProperty(exports, "canonicalize", {
    enumerable: true,
    get: function get() {
      return json.canonicalize;
    }
  });
  Object.defineProperty(exports, "diffArrays", {
    enumerable: true,
    get: function get() {
      return array$1.diffArrays;
    }
  });
  Object.defineProperty(exports, "applyPatch", {
    enumerable: true,
    get: function get() {
      return apply$1.applyPatch;
    }
  });
  Object.defineProperty(exports, "applyPatches", {
    enumerable: true,
    get: function get() {
      return apply$1.applyPatches;
    }
  });
  Object.defineProperty(exports, "parsePatch", {
    enumerable: true,
    get: function get() {
      return parse.parsePatch;
    }
  });
  Object.defineProperty(exports, "merge", {
    enumerable: true,
    get: function get() {
      return merge_1.merge;
    }
  });
  Object.defineProperty(exports, "structuredPatch", {
    enumerable: true,
    get: function get() {
      return create.structuredPatch;
    }
  });
  Object.defineProperty(exports, "createTwoFilesPatch", {
    enumerable: true,
    get: function get() {
      return create.createTwoFilesPatch;
    }
  });
  Object.defineProperty(exports, "createPatch", {
    enumerable: true,
    get: function get() {
      return create.createPatch;
    }
  });
  Object.defineProperty(exports, "convertChangesToDMP", {
    enumerable: true,
    get: function get() {
      return dmp.convertChangesToDMP;
    }
  });
  Object.defineProperty(exports, "convertChangesToXML", {
    enumerable: true,
    get: function get() {
      return xml.convertChangesToXML;
    }
  });
  /*istanbul ignore end*/

  var
  /*istanbul ignore start*/
  _base = _interopRequireDefault(base)
  /*istanbul ignore end*/
  ;
  /*istanbul ignore start*/


  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      "default": obj
    };
  }
  /*istanbul ignore end*/

});

const {
  promises: fs
} = fs__default['default']; // eslint-disable-next-line no-restricted-modules
// eslint-disable-next-line no-restricted-modules

const {
  getStdin
} = require$$1;
const {
  createIgnorer,
  errors
} = prettierInternal;
const {
  expandPatterns,
  fixWindowsSlashes
} = expandPatterns_1;
const {
  getOptionsForFile
} = option;

function diff(a, b) {
  return lib$1.createTwoFilesPatch("", "", a, b, "", "", {
    context: 2
  });
}

function handleError(context, filename, error, printedFilename) {
  if (error instanceof errors.UndefinedParserError) {
    // Can't test on CI, `isTTY()` is always false, see ./is-tty.js

    /* istanbul ignore next */
    if ((context.argv.write || context.argv["ignore-unknown"]) && printedFilename) {
      printedFilename.clear();
    }

    if (context.argv["ignore-unknown"]) {
      return;
    }

    if (!context.argv.check && !context.argv["list-different"]) {
      process.exitCode = 2;
    }

    context.logger.error(error.message);
    return;
  }

  if (context.argv.write) {
    // Add newline to split errors from filename line.
    process.stdout.write("\n");
  }

  const isParseError = Boolean(error && error.loc);
  const isValidationError = /^Invalid \S+ value\./.test(error && error.message);

  if (isParseError) {
    // `invalid.js: SyntaxError: Unexpected token (1:1)`.
    context.logger.error(`${filename}: ${String(error)}`);
  } else if (isValidationError || error instanceof errors.ConfigError) {
    // `Invalid printWidth value. Expected an integer, but received 0.5.`
    context.logger.error(error.message); // If validation fails for one file, it will fail for all of them.

    process.exit(1);
  } else if (error instanceof errors.DebugError) {
    // `invalid.js: Some debug error message`
    context.logger.error(`${filename}: ${error.message}`);
  } else {
    // `invalid.js: Error: Some unexpected error\n[stack trace]`

    /* istanbul ignore next */
    context.logger.error(filename + ": " + (error.stack || error));
  } // Don't exit the process if one file failed


  process.exitCode = 2;
}

function writeOutput(context, result, options) {
  // Don't use `console.log` here since it adds an extra newline at the end.
  process.stdout.write(context.argv["debug-check"] ? result.filepath : result.formatted);

  if (options && options.cursorOffset >= 0) {
    process.stderr.write(result.cursorOffset + "\n");
  }
}

function listDifferent(context, input, options, filename) {
  if (!context.argv.check && !context.argv["list-different"]) {
    return;
  }

  try {
    if (!options.filepath && !options.parser) {
      throw new errors.UndefinedParserError("No parser and no file path given, couldn't infer a parser.");
    }

    if (!prettier$1.check(input, options)) {
      if (!context.argv.write) {
        context.logger.log(filename);
        process.exitCode = 1;
      }
    }
  } catch (error) {
    context.logger.error(error.message);
  }

  return true;
}

function format$1(context, input, opt) {
  if (!opt.parser && !opt.filepath) {
    throw new errors.UndefinedParserError("No parser and no file path given, couldn't infer a parser.");
  }

  if (context.argv["debug-print-doc"]) {
    const doc = prettier$1.__debug.printToDoc(input, opt);

    return {
      formatted: prettier$1.__debug.formatDoc(doc) + "\n"
    };
  }

  if (context.argv["debug-print-comments"]) {
    return {
      formatted: prettier$1.format(JSON.stringify(prettier$1.formatWithCursor(input, opt).comments || []), {
        parser: "json"
      })
    };
  }

  if (context.argv["debug-check"]) {
    const pp = prettier$1.format(input, opt);
    const pppp = prettier$1.format(pp, opt);

    if (pp !== pppp) {
      throw new errors.DebugError("prettier(input) !== prettier(prettier(input))\n" + diff(pp, pppp));
    } else {
      const stringify = obj => JSON.stringify(obj, null, 2);

      const ast = stringify(prettier$1.__debug.parse(input, opt,
      /* massage */
      true).ast);
      const past = stringify(prettier$1.__debug.parse(pp, opt,
      /* massage */
      true).ast);
      /* istanbul ignore next */

      if (ast !== past) {
        const MAX_AST_SIZE = 2097152; // 2MB

        const astDiff = ast.length > MAX_AST_SIZE || past.length > MAX_AST_SIZE ? "AST diff too large to render" : diff(ast, past);
        throw new errors.DebugError("ast(input) !== ast(prettier(input))\n" + astDiff + "\n" + diff(input, pp));
      }
    }

    return {
      formatted: pp,
      filepath: opt.filepath || "(stdin)\n"
    };
  }
  /* istanbul ignore next */


  if (context.argv["debug-benchmark"]) {
    let benchmark;

    try {
      // eslint-disable-next-line import/no-extraneous-dependencies
      benchmark = require("benchmark");
    } catch {
      context.logger.debug("'--debug-benchmark' requires the 'benchmark' package to be installed.");
      process.exit(2);
    }

    context.logger.debug("'--debug-benchmark' option found, measuring formatWithCursor with 'benchmark' module.");
    const suite = new benchmark.Suite();
    suite.add("format", () => {
      prettier$1.formatWithCursor(input, opt);
    }).on("cycle", event => {
      const results = {
        benchmark: String(event.target),
        hz: event.target.hz,
        ms: event.target.times.cycle * 1000
      };
      context.logger.debug("'--debug-benchmark' measurements for formatWithCursor: " + JSON.stringify(results, null, 2));
    }).run({
      async: false
    });
  } else if (context.argv["debug-repeat"] > 0) {
    const repeat = context.argv["debug-repeat"];
    context.logger.debug("'--debug-repeat' option found, running formatWithCursor " + repeat + " times.");
    let totalMs = 0;

    for (let i = 0; i < repeat; ++i) {
      // should be using `performance.now()`, but only `Date` is cross-platform enough
      const startMs = Date.now();
      prettier$1.formatWithCursor(input, opt);
      totalMs += Date.now() - startMs;
    }

    const averageMs = totalMs / repeat;
    const results = {
      repeat,
      hz: 1000 / averageMs,
      ms: averageMs
    };
    context.logger.debug("'--debug-repeat' measurements for formatWithCursor: " + JSON.stringify(results, null, 2));
  }

  return prettier$1.formatWithCursor(input, opt);
}

async function createIgnorerFromContextOrDie(context) {
  try {
    return await createIgnorer(context.argv["ignore-path"], context.argv["with-node-modules"]);
  } catch (e) {
    context.logger.error(e.message);
    process.exit(2);
  }
}

async function formatStdin$1(context) {
  const filepath = context.argv["stdin-filepath"] ? path__default['default'].resolve(process.cwd(), context.argv["stdin-filepath"]) : process.cwd();
  const ignorer = await createIgnorerFromContextOrDie(context); // If there's an ignore-path set, the filename must be relative to the
  // ignore path, not the current working directory.

  const relativeFilepath = context.argv["ignore-path"] ? path__default['default'].relative(path__default['default'].dirname(context.argv["ignore-path"]), filepath) : path__default['default'].relative(process.cwd(), filepath);

  try {
    const input = await getStdin();

    if (relativeFilepath && ignorer.ignores(fixWindowsSlashes(relativeFilepath))) {
      writeOutput(context, {
        formatted: input
      });
      return;
    }

    const options = await getOptionsForFile(context, filepath);

    if (listDifferent(context, input, options, "(stdin)")) {
      return;
    }

    writeOutput(context, format$1(context, input, options), options);
  } catch (error) {
    handleError(context, relativeFilepath || "stdin", error);
  }
}

async function formatFiles$1(context) {
  // The ignorer will be used to filter file paths after the glob is checked,
  // before any files are actually written
  const ignorer = await createIgnorerFromContextOrDie(context);
  let numberOfUnformattedFilesFound = 0;

  if (context.argv.check) {
    context.logger.log("Checking formatting...");
  }

  for await (const pathOrError of expandPatterns(context)) {
    if (typeof pathOrError === "object") {
      context.logger.error(pathOrError.error); // Don't exit, but set the exit code to 2

      process.exitCode = 2;
      continue;
    }

    const filename = pathOrError; // If there's an ignore-path set, the filename must be relative to the
    // ignore path, not the current working directory.

    const ignoreFilename = context.argv["ignore-path"] ? path__default['default'].relative(path__default['default'].dirname(context.argv["ignore-path"]), filename) : filename;
    const fileIgnored = ignorer.ignores(fixWindowsSlashes(ignoreFilename));

    if (fileIgnored && (context.argv["debug-check"] || context.argv.write || context.argv.check || context.argv["list-different"])) {
      continue;
    }

    const options = Object.assign(Object.assign({}, await getOptionsForFile(context, filename)), {}, {
      filepath: filename
    });
    let printedFilename;

    if (isTty()) {
      printedFilename = context.logger.log(filename, {
        newline: false,
        clearable: true
      });
    }

    let input;

    try {
      input = await fs.readFile(filename, "utf8");
    } catch (error) {
      // Add newline to split errors from filename line.

      /* istanbul ignore next */
      context.logger.log("");
      /* istanbul ignore next */

      context.logger.error(`Unable to read file: ${filename}\n${error.message}`); // Don't exit the process if one file failed

      /* istanbul ignore next */

      process.exitCode = 2;
      /* istanbul ignore next */

      continue;
    }

    if (fileIgnored) {
      writeOutput(context, {
        formatted: input
      }, options);
      continue;
    }

    const start = Date.now();
    let result;
    let output;

    try {
      result = format$1(context, input, options);
      output = result.formatted;
    } catch (error) {
      handleError(context, filename, error, printedFilename);
      continue;
    }

    const isDifferent = output !== input;

    if (printedFilename) {
      // Remove previously printed filename to log it with duration.
      printedFilename.clear();
    }

    if (context.argv.write) {
      // Don't write the file if it won't change in order not to invalidate
      // mtime based caches.
      if (isDifferent) {
        if (!context.argv.check && !context.argv["list-different"]) {
          context.logger.log(`${filename} ${Date.now() - start}ms`);
        }

        try {
          await fs.writeFile(filename, output, "utf8");
        } catch (error) {
          /* istanbul ignore next */
          context.logger.error(`Unable to write file: ${filename}\n${error.message}`); // Don't exit the process if one file failed

          /* istanbul ignore next */

          process.exitCode = 2;
        }
      } else if (!context.argv.check && !context.argv["list-different"]) {
        context.logger.log(`${source.grey(filename)} ${Date.now() - start}ms`);
      }
    } else if (context.argv["debug-check"]) {
      /* istanbul ignore else */
      if (result.filepath) {
        context.logger.log(result.filepath);
      } else {
        process.exitCode = 2;
      }
    } else if (!context.argv.check && !context.argv["list-different"]) {
      writeOutput(context, result, options);
    }

    if (isDifferent) {
      if (context.argv.check) {
        context.logger.warn(filename);
      } else if (context.argv["list-different"]) {
        context.logger.log(filename);
      }

      numberOfUnformattedFilesFound += 1;
    }
  } // Print check summary based on expected exit code


  if (context.argv.check) {
    if (numberOfUnformattedFilesFound === 0) {
      context.logger.log("All matched files use Prettier code style!");
    } else {
      context.logger.warn(context.argv.write ? "Code style issues fixed in the above file(s)." : "Code style issues found in the above file(s). Forgot to run Prettier?");
    }
  } // Ensure non-zero exitCode when using --check/list-different is not combined with --write


  if ((context.argv.check || context.argv["list-different"]) && numberOfUnformattedFilesFound > 0 && !process.exitCode && !context.argv.write) {
    process.exitCode = 1;
  }
}

var format_1 = {
  format: format$1,
  formatStdin: formatStdin$1,
  formatFiles: formatFiles$1
};

var defineProperty = function () {
  try {
    var func = _getNative(Object, 'defineProperty');
    func({}, '', {});
    return func;
  } catch (e) {}
}();

var _defineProperty = defineProperty;

/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */

function baseAssignValue(object, key, value) {
  if (key == '__proto__' && _defineProperty) {
    _defineProperty(object, key, {
      'configurable': true,
      'enumerable': true,
      'value': value,
      'writable': true
    });
  } else {
    object[key] = value;
  }
}

var _baseAssignValue = baseAssignValue;

/** Used for built-in method references. */

var objectProto$1 = Object.prototype;
/** Used to check objects for own properties. */

var hasOwnProperty$1 = objectProto$1.hasOwnProperty;
/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */

function assignValue(object, key, value) {
  var objValue = object[key];

  if (!(hasOwnProperty$1.call(object, key) && eq_1(objValue, value)) || value === undefined && !(key in object)) {
    _baseAssignValue(object, key, value);
  }
}

var _assignValue = assignValue;

/**
 * The base implementation of `_.set`.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to set.
 * @param {*} value The value to set.
 * @param {Function} [customizer] The function to customize path creation.
 * @returns {Object} Returns `object`.
 */

function baseSet(object, path, value, customizer) {
  if (!isObject_1(object)) {
    return object;
  }

  path = _castPath(path, object);
  var index = -1,
      length = path.length,
      lastIndex = length - 1,
      nested = object;

  while (nested != null && ++index < length) {
    var key = _toKey(path[index]),
        newValue = value;

    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return object;
    }

    if (index != lastIndex) {
      var objValue = nested[key];
      newValue = customizer ? customizer(objValue, key, nested) : undefined;

      if (newValue === undefined) {
        newValue = isObject_1(objValue) ? objValue : _isIndex(path[index + 1]) ? [] : {};
      }
    }

    _assignValue(nested, key, newValue);
    nested = nested[key];
  }

  return object;
}

var _baseSet = baseSet;

/**
 * The base implementation of  `_.pickBy` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The source object.
 * @param {string[]} paths The property paths to pick.
 * @param {Function} predicate The function invoked per property.
 * @returns {Object} Returns the new object.
 */

function basePickBy(object, paths, predicate) {
  var index = -1,
      length = paths.length,
      result = {};

  while (++index < length) {
    var path = paths[index],
        value = _baseGet(object, path);

    if (predicate(value, path)) {
      _baseSet(result, _castPath(path, object), value);
    }
  }

  return result;
}

var _basePickBy = basePickBy;

/**
 * The base implementation of `_.pick` without support for individual
 * property identifiers.
 *
 * @private
 * @param {Object} object The source object.
 * @param {string[]} paths The property paths to pick.
 * @returns {Object} Returns the new object.
 */

function basePick(object, paths) {
  return _basePickBy(object, paths, function (value, path) {
    return hasIn_1(object, path);
  });
}

var _basePick = basePick;

/** Built-in value references. */

var spreadableSymbol = _Symbol ? _Symbol.isConcatSpreadable : undefined;
/**
 * Checks if `value` is a flattenable `arguments` object or array.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
 */

function isFlattenable(value) {
  return isArray_1(value) || isArguments_1(value) || !!(spreadableSymbol && value && value[spreadableSymbol]);
}

var _isFlattenable = isFlattenable;

/**
 * The base implementation of `_.flatten` with support for restricting flattening.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {number} depth The maximum recursion depth.
 * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
 * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */

function baseFlatten(array, depth, predicate, isStrict, result) {
  var index = -1,
      length = array.length;
  predicate || (predicate = _isFlattenable);
  result || (result = []);

  while (++index < length) {
    var value = array[index];

    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten(value, depth - 1, predicate, isStrict, result);
      } else {
        _arrayPush(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }

  return result;
}

var _baseFlatten = baseFlatten;

/**
 * Flattens `array` a single level deep.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to flatten.
 * @returns {Array} Returns the new flattened array.
 * @example
 *
 * _.flatten([1, [2, [3, [4]], 5]]);
 * // => [1, 2, [3, [4]], 5]
 */

function flatten(array) {
  var length = array == null ? 0 : array.length;
  return length ? _baseFlatten(array, 1) : [];
}

var flatten_1 = flatten;

/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0:
      return func.call(thisArg);

    case 1:
      return func.call(thisArg, args[0]);

    case 2:
      return func.call(thisArg, args[0], args[1]);

    case 3:
      return func.call(thisArg, args[0], args[1], args[2]);
  }

  return func.apply(thisArg, args);
}

var _apply = apply;

/* Built-in method references for those with the same name as other `lodash` methods. */

var nativeMax = Math.max;
/**
 * A specialized version of `baseRest` which transforms the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @param {Function} transform The rest array transform.
 * @returns {Function} Returns the new function.
 */

function overRest(func, start, transform) {
  start = nativeMax(start === undefined ? func.length - 1 : start, 0);
  return function () {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }

    index = -1;
    var otherArgs = Array(start + 1);

    while (++index < start) {
      otherArgs[index] = args[index];
    }

    otherArgs[start] = transform(array);
    return _apply(func, this, otherArgs);
  };
}

var _overRest = overRest;

/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new constant function.
 * @example
 *
 * var objects = _.times(2, _.constant({ 'a': 1 }));
 *
 * console.log(objects);
 * // => [{ 'a': 1 }, { 'a': 1 }]
 *
 * console.log(objects[0] === objects[1]);
 * // => true
 */
function constant$1(value) {
  return function () {
    return value;
  };
}

var constant_1 = constant$1;

/**
 * The base implementation of `setToString` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */

var baseSetToString = !_defineProperty ? identity_1 : function (func, string) {
  return _defineProperty(func, 'toString', {
    'configurable': true,
    'enumerable': false,
    'value': constant_1(string),
    'writable': true
  });
};
var _baseSetToString = baseSetToString;

/** Used to detect hot functions by number of calls within a span of milliseconds. */
var HOT_COUNT = 800,
    HOT_SPAN = 16;
/* Built-in method references for those with the same name as other `lodash` methods. */

var nativeNow = Date.now;
/**
 * Creates a function that'll short out and invoke `identity` instead
 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
 * milliseconds.
 *
 * @private
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new shortable function.
 */

function shortOut(func) {
  var count = 0,
      lastCalled = 0;
  return function () {
    var stamp = nativeNow(),
        remaining = HOT_SPAN - (stamp - lastCalled);
    lastCalled = stamp;

    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }

    return func.apply(undefined, arguments);
  };
}

var _shortOut = shortOut;

/**
 * Sets the `toString` method of `func` to return `string`.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */

var setToString = _shortOut(_baseSetToString);
var _setToString = setToString;

/**
 * A specialized version of `baseRest` which flattens the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @returns {Function} Returns the new function.
 */

function flatRest(func) {
  return _setToString(_overRest(func, undefined, flatten_1), func + '');
}

var _flatRest = flatRest;

/**
 * Creates an object composed of the picked `object` properties.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The source object.
 * @param {...(string|string[])} [paths] The property paths to pick.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'a': 1, 'b': '2', 'c': 3 };
 *
 * _.pick(object, ['a', 'c']);
 * // => { 'a': 1, 'c': 3 }
 */

var pick = _flatRest(function (object, paths) {
  return object == null ? {} : _basePick(object, paths);
});
var pick_1 = pick;

var lib = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.outdent = void 0; // In the absence of a WeakSet or WeakMap implementation, don't break, but don't cache either.

  function noop() {
    var args = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
  }

  function createWeakMap() {
    if (typeof WeakMap !== "undefined") {
      return new WeakMap();
    } else {
      return fakeSetOrMap();
    }
  }
  /**
   * Creates and returns a no-op implementation of a WeakMap / WeakSet that never stores anything.
   */


  function fakeSetOrMap() {
    return {
      add: noop,
      delete: noop,
      get: noop,
      set: noop,
      has: function (k) {
        return false;
      }
    };
  } // Safe hasOwnProperty


  var hop = Object.prototype.hasOwnProperty;

  var has = function (obj, prop) {
    return hop.call(obj, prop);
  }; // Copy all own enumerable properties from source to target


  function extend(target, source) {
    for (var prop in source) {
      if (has(source, prop)) {
        target[prop] = source[prop];
      }
    }

    return target;
  }

  var reLeadingNewline = /^[ \t]*(?:\r\n|\r|\n)/;
  var reTrailingNewline = /(?:\r\n|\r|\n)[ \t]*$/;
  var reStartsWithNewlineOrIsEmpty = /^(?:[\r\n]|$)/;
  var reDetectIndentation = /(?:\r\n|\r|\n)([ \t]*)(?:[^ \t\r\n]|$)/;
  var reOnlyWhitespaceWithAtLeastOneNewline = /^[ \t]*[\r\n][ \t\r\n]*$/;

  function _outdentArray(strings, firstInterpolatedValueSetsIndentationLevel, options) {
    // If first interpolated value is a reference to outdent,
    // determine indentation level from the indentation of the interpolated value.
    var indentationLevel = 0;
    var match = strings[0].match(reDetectIndentation);

    if (match) {
      indentationLevel = match[1].length;
    }

    var reSource = "(\\r\\n|\\r|\\n).{0," + indentationLevel + "}";
    var reMatchIndent = new RegExp(reSource, "g");

    if (firstInterpolatedValueSetsIndentationLevel) {
      strings = strings.slice(1);
    }

    var newline = options.newline,
        trimLeadingNewline = options.trimLeadingNewline,
        trimTrailingNewline = options.trimTrailingNewline;
    var normalizeNewlines = typeof newline === "string";
    var l = strings.length;
    var outdentedStrings = strings.map(function (v, i) {
      // Remove leading indentation from all lines
      v = v.replace(reMatchIndent, "$1"); // Trim a leading newline from the first string

      if (i === 0 && trimLeadingNewline) {
        v = v.replace(reLeadingNewline, "");
      } // Trim a trailing newline from the last string


      if (i === l - 1 && trimTrailingNewline) {
        v = v.replace(reTrailingNewline, "");
      } // Normalize newlines


      if (normalizeNewlines) {
        v = v.replace(/\r\n|\n|\r/g, function (_) {
          return newline;
        });
      }

      return v;
    });
    return outdentedStrings;
  }

  function concatStringsAndValues(strings, values) {
    var ret = "";

    for (var i = 0, l = strings.length; i < l; i++) {
      ret += strings[i];

      if (i < l - 1) {
        ret += values[i];
      }
    }

    return ret;
  }

  function isTemplateStringsArray(v) {
    return has(v, "raw") && has(v, "length");
  }
  /**
   * It is assumed that opts will not change.  If this is a problem, clone your options object and pass the clone to
   * makeInstance
   * @param options
   * @return {outdent}
   */


  function createInstance(options) {
    /** Cache of pre-processed template literal arrays */
    var arrayAutoIndentCache = createWeakMap();
    /**
       * Cache of pre-processed template literal arrays, where first interpolated value is a reference to outdent,
       * before interpolated values are injected.
       */

    var arrayFirstInterpSetsIndentCache = createWeakMap();

    function outdent(stringsOrOptions) {
      var values = [];

      for (var _i = 1; _i < arguments.length; _i++) {
        values[_i - 1] = arguments[_i];
      }
      /* tslint:enable:no-shadowed-variable */


      if (isTemplateStringsArray(stringsOrOptions)) {
        var strings = stringsOrOptions; // Is first interpolated value a reference to outdent, alone on its own line, without any preceding non-whitespace?

        var firstInterpolatedValueSetsIndentationLevel = (values[0] === outdent || values[0] === defaultOutdent) && reOnlyWhitespaceWithAtLeastOneNewline.test(strings[0]) && reStartsWithNewlineOrIsEmpty.test(strings[1]); // Perform outdentation

        var cache = firstInterpolatedValueSetsIndentationLevel ? arrayFirstInterpSetsIndentCache : arrayAutoIndentCache;
        var renderedArray = cache.get(strings);

        if (!renderedArray) {
          renderedArray = _outdentArray(strings, firstInterpolatedValueSetsIndentationLevel, options);
          cache.set(strings, renderedArray);
        }
        /** If no interpolated values, skip concatenation step */


        if (values.length === 0) {
          return renderedArray[0];
        }
        /** Concatenate string literals with interpolated values */


        var rendered = concatStringsAndValues(renderedArray, firstInterpolatedValueSetsIndentationLevel ? values.slice(1) : values);
        return rendered;
      } else {
        // Create and return a new instance of outdent with the given options
        return createInstance(extend(extend({}, options), stringsOrOptions || {}));
      }
    }

    var fullOutdent = extend(outdent, {
      string: function (str) {
        return _outdentArray([str], false, options)[0];
      }
    });
    return fullOutdent;
  }

  var defaultOutdent = createInstance({
    trimLeadingNewline: true,
    trimTrailingNewline: true
  });
  exports.outdent = defaultOutdent; // Named exports.  Simple and preferred.
  // import outdent from 'outdent';

  exports.default = defaultOutdent;

  {
    // In webpack harmony-modules environments, module.exports is read-only,
    // so we fail gracefully.
    try {
      module.exports = defaultOutdent;
      Object.defineProperty(defaultOutdent, "__esModule", {
        value: true
      });
      defaultOutdent.default = defaultOutdent;
      defaultOutdent.outdent = defaultOutdent;
    } catch (e) {}
  }
});

const {
  outdent
} = lib;
const {
  coreOptions: coreOptions$1
} = prettierInternal;
const categoryOrder = [coreOptions$1.CATEGORY_OUTPUT, coreOptions$1.CATEGORY_FORMAT, coreOptions$1.CATEGORY_CONFIG, coreOptions$1.CATEGORY_EDITOR, coreOptions$1.CATEGORY_OTHER];
/**
 * {
 *   [optionName]: {
 *     // The type of the option. For 'choice', see also `choices` below.
 *     // When passing a type other than the ones listed below, the option is
 *     // treated as taking any string as argument, and `--option <${type}>` will
 *     // be displayed in --help.
 *     type: "boolean" | "choice" | "int" | string;
 *
 *     // Default value to be passed to the minimist option `default`.
 *     default?: any;
 *
 *     // Alias name to be passed to the minimist option `alias`.
 *     alias?: string;
 *
 *     // For grouping options by category in --help.
 *     category?: string;
 *
 *     // Description to be displayed in --help. If omitted, the option won't be
 *     // shown at all in --help (but see also `oppositeDescription` below).
 *     description?: string;
 *
 *     // Description for `--no-${name}` to be displayed in --help. If omitted,
 *     // `--no-${name}` won't be shown.
 *     oppositeDescription?: string;
 *
 *     // Indicate if this option is simply passed to the API.
 *     // true: use camelified name as the API option name.
 *     // string: use this value as the API option name.
 *     forwardToApi?: boolean | string;
 *
 *     // Indicate that a CLI flag should be an array when forwarded to the API.
 *     array?: boolean;
 *
 *     // Specify available choices for validation. They will also be displayed
 *     // in --help as <a|b|c>.
 *     // Use an object instead of a string if a choice is deprecated and should
 *     // be treated as `redirect` instead, or if you'd like to add description for
 *     // the choice.
 *     choices?: Array<
 *       | string
 *       | { value: string, description?: string, deprecated?: boolean, redirect?: string }
 *     >;
 *
 *     // If the option has a value that is an exception to the regular value
 *     // constraints, indicate that value here (or use a function for more
 *     // flexibility).
 *     exception?: ((value: any) => boolean);
 *
 *     // Indicate that the option is deprecated. Use a string to add an extra
 *     // message to --help for the option, for example to suggest a replacement
 *     // option.
 *     deprecated?: true | string;
 *   }
 * }
 *
 * Note: The options below are sorted alphabetically.
 */

const options = {
  check: {
    type: "boolean",
    category: coreOptions$1.CATEGORY_OUTPUT,
    alias: "c",
    description: outdent`
      Check if the given files are formatted, print a human-friendly summary
      message and paths to unformatted files (see also --list-different).
    `
  },
  color: {
    // The supports-color package (a sub sub dependency) looks directly at
    // `process.argv` for `--no-color` and such-like options. The reason it is
    // listed here is to avoid "Ignored unknown option: --no-color" warnings.
    // See https://github.com/chalk/supports-color/#info for more information.
    type: "boolean",
    default: true,
    description: "Colorize error messages.",
    oppositeDescription: "Do not colorize error messages."
  },
  config: {
    type: "path",
    category: coreOptions$1.CATEGORY_CONFIG,
    description: "Path to a Prettier configuration file (.prettierrc, package.json, prettier.config.js).",
    oppositeDescription: "Do not look for a configuration file.",
    exception: value => value === false
  },
  "config-precedence": {
    type: "choice",
    category: coreOptions$1.CATEGORY_CONFIG,
    default: "cli-override",
    choices: [{
      value: "cli-override",
      description: "CLI options take precedence over config file"
    }, {
      value: "file-override",
      description: "Config file take precedence over CLI options"
    }, {
      value: "prefer-file",
      description: outdent`
          If a config file is found will evaluate it and ignore other CLI options.
          If no config file is found CLI options will evaluate as normal.
        `
    }],
    description: "Define in which order config files and CLI options should be evaluated."
  },
  "debug-benchmark": {
    // Run the formatting benchmarks. Requires 'benchmark' module to be installed.
    type: "boolean"
  },
  "debug-check": {
    // Run the formatting once again on the formatted output, throw if different.
    type: "boolean"
  },
  "debug-print-doc": {
    type: "boolean"
  },
  "debug-print-comments": {
    type: "boolean"
  },
  "debug-repeat": {
    // Repeat the formatting a few times and measure the average duration.
    type: "int",
    default: 0
  },
  editorconfig: {
    type: "boolean",
    category: coreOptions$1.CATEGORY_CONFIG,
    description: "Take .editorconfig into account when parsing configuration.",
    oppositeDescription: "Don't take .editorconfig into account when parsing configuration.",
    default: true
  },
  "error-on-unmatched-pattern": {
    type: "boolean",
    oppositeDescription: "Prevent errors when pattern is unmatched."
  },
  "find-config-path": {
    type: "path",
    category: coreOptions$1.CATEGORY_CONFIG,
    description: "Find and print the path to a configuration file for the given input file."
  },
  "file-info": {
    type: "path",
    description: outdent`
      Extract the following info (as JSON) for a given file path. Reported fields:
      * ignored (boolean) - true if file path is filtered by --ignore-path
      * inferredParser (string | null) - name of parser inferred from file path
    `
  },
  help: {
    type: "flag",
    alias: "h",
    description: outdent`
      Show CLI usage, or details about the given flag.
      Example: --help write
    `,
    exception: value => value === ""
  },
  "ignore-path": {
    type: "path",
    category: coreOptions$1.CATEGORY_CONFIG,
    default: ".prettierignore",
    description: "Path to a file with patterns describing files to ignore."
  },
  "ignore-unknown": {
    type: "boolean",
    alias: "u",
    description: "Ignore unknown files."
  },
  "list-different": {
    type: "boolean",
    category: coreOptions$1.CATEGORY_OUTPUT,
    alias: "l",
    description: "Print the names of files that are different from Prettier's formatting (see also --check)."
  },
  loglevel: {
    type: "choice",
    description: "What level of logs to report.",
    default: "log",
    choices: ["silent", "error", "warn", "log", "debug"]
  },
  "support-info": {
    type: "boolean",
    description: "Print support information as JSON."
  },
  version: {
    type: "boolean",
    alias: "v",
    description: "Print Prettier version."
  },
  "with-node-modules": {
    type: "boolean",
    category: coreOptions$1.CATEGORY_CONFIG,
    description: "Process files inside 'node_modules' directory."
  },
  write: {
    type: "boolean",
    alias: "w",
    category: coreOptions$1.CATEGORY_OUTPUT,
    description: "Edit files in-place. (Beware!)"
  }
};
const usageSummary = outdent`
  Usage: prettier [options] [file/dir/glob ...]

  By default, output is written to stdout.
  Stdin is read if it is piped to Prettier and no files are given.
`;
var constant = {
  categoryOrder,
  options,
  usageSummary
};

const {
  coreOptions
} = prettierInternal;

function normalizeDetailedOption(name, option) {
  return Object.assign(Object.assign({
    category: coreOptions.CATEGORY_OTHER
  }, option), {}, {
    choices: option.choices && option.choices.map(choice => {
      const newChoice = Object.assign({
        description: "",
        deprecated: false
      }, typeof choice === "object" ? choice : {
        value: choice
      });
      /* istanbul ignore next */

      if (newChoice.value === true) {
        newChoice.value = ""; // backward compatibility for original boolean option
      }

      return newChoice;
    })
  });
}

function normalizeDetailedOptionMap$2(detailedOptionMap) {
  return Object.fromEntries(Object.entries(detailedOptionMap).sort(([leftName], [rightName]) => leftName.localeCompare(rightName)).map(([name, option]) => [name, normalizeDetailedOption(name, option)]));
}

function createDetailedOptionMap$2(supportOptions) {
  return Object.fromEntries(supportOptions.map(option => {
    const newOption = Object.assign(Object.assign({}, option), {}, {
      name: option.cliName || dashify(option.name),
      description: option.cliDescription || option.description,
      category: option.cliCategory || coreOptions.CATEGORY_FORMAT,
      forwardToApi: option.name
    });
    /* istanbul ignore next */

    if (option.deprecated) {
      delete newOption.forwardToApi;
      delete newOption.description;
      delete newOption.oppositeDescription;
      newOption.deprecated = true;
    }

    return [newOption.name, newOption];
  }));
}

var optionMap = {
  normalizeDetailedOptionMap: normalizeDetailedOptionMap$2,
  createDetailedOptionMap: createDetailedOptionMap$2
};

const {
  optionsModule,
  optionsNormalizer: {
    normalizeCliOptions
  },
  utils: {
    arrayify
  }
} = prettierInternal;
const {
  createDetailedOptionMap: createDetailedOptionMap$1,
  normalizeDetailedOptionMap: normalizeDetailedOptionMap$1
} = optionMap;
/**
 * @typedef {Object} Context
 * @property logger
 * @property {string[]} rawArguments
 * @property argv
 * @property {string[]} filePatterns
 * @property {any[]} supportOptions
 * @property detailedOptions
 * @property detailedOptionMap
 * @property apiDefaultOptions
 * @property languages
 * @property {Partial<Context>[]} stack
 * @property pushContextPlugins
 * @property popContextPlugins
 */

class Context$1 {
  constructor({
    rawArguments,
    logger
  }) {
    this.rawArguments = rawArguments;
    this.logger = logger;
    this.stack = [];
    const {
      plugin: plugins,
      "plugin-search-dir": pluginSearchDirs
    } = parseArgvWithoutPlugins$1(rawArguments, logger, ["plugin", "plugin-search-dir"]);
    this.pushContextPlugins(plugins, pluginSearchDirs);
    const argv = parseArgv(rawArguments, this.detailedOptions, logger);
    this.argv = argv;
    this.filePatterns = argv._.map(file => String(file));
  }
  /**
   * @param {string[]} plugins
   * @param {string[]=} pluginSearchDirs
   */


  pushContextPlugins(plugins, pluginSearchDirs) {
    this.stack.push(pick_1(this, ["supportOptions", "detailedOptions", "detailedOptionMap", "apiDefaultOptions", "languages"]));
    Object.assign(this, getContextOptions(plugins, pluginSearchDirs));
  }

  popContextPlugins() {
    Object.assign(this, this.stack.pop());
  }

}

function getContextOptions(plugins, pluginSearchDirs) {
  const {
    options: supportOptions,
    languages
  } = prettier$1.getSupportInfo({
    showDeprecated: true,
    showUnreleased: true,
    showInternal: true,
    plugins,
    pluginSearchDirs
  });
  const detailedOptionMap = normalizeDetailedOptionMap$1(Object.assign(Object.assign({}, createDetailedOptionMap$1(supportOptions)), constant.options));
  const detailedOptions = arrayify(detailedOptionMap, "name");
  const apiDefaultOptions = Object.assign(Object.assign({}, optionsModule.hiddenDefaults), Object.fromEntries(supportOptions.filter(({
    deprecated
  }) => !deprecated).map(option => [option.name, option.default])));
  return {
    supportOptions,
    detailedOptions,
    detailedOptionMap,
    apiDefaultOptions,
    languages
  };
}

function parseArgv(rawArguments, detailedOptions, logger, keys) {
  const minimistOptions = createMinimistOptions(detailedOptions);
  let argv = minimist_1(rawArguments, minimistOptions);

  if (keys) {
    detailedOptions = detailedOptions.filter(option => keys.includes(option.name));
    argv = pick_1(argv, keys);
  }

  return normalizeCliOptions(argv, detailedOptions, {
    logger
  });
}

const detailedOptionsWithoutPlugins = getContextOptions().detailedOptions;

function parseArgvWithoutPlugins$1(rawArguments, logger, keys) {
  return parseArgv(rawArguments, detailedOptionsWithoutPlugins, logger, typeof keys === "string" ? [keys] : keys);
}

var context = {
  Context: Context$1,
  parseArgvWithoutPlugins: parseArgvWithoutPlugins$1
};

// `Array.prototype.flat` method
// https://tc39.es/ecma262/#sec-array.prototype.flat
_export({ target: 'Array', proto: true }, {
  flat: function flat(/* depthArg = 1 */) {
    var depthArg = arguments.length ? arguments[0] : undefined;
    var O = toObject(this);
    var sourceLen = toLength(O.length);
    var A = arraySpeciesCreate(O, 0);
    A.length = flattenIntoArray_1(A, O, O, sourceLen, 0, depthArg === undefined ? 1 : toInteger(depthArg));
    return A;
  }
});

/** Used for built-in method references. */

var objectProto = Object.prototype;
/** Used to check objects for own properties. */

var hasOwnProperty = objectProto.hasOwnProperty;
/**
 * Creates an object composed of keys generated from the results of running
 * each element of `collection` thru `iteratee`. The order of grouped values
 * is determined by the order they occur in `collection`. The corresponding
 * value of each key is an array of elements responsible for generating the
 * key. The iteratee is invoked with one argument: (value).
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The iteratee to transform keys.
 * @returns {Object} Returns the composed aggregate object.
 * @example
 *
 * _.groupBy([6.1, 4.2, 6.3], Math.floor);
 * // => { '4': [4.2], '6': [6.1, 6.3] }
 *
 * // The `_.property` iteratee shorthand.
 * _.groupBy(['one', 'two', 'three'], 'length');
 * // => { '3': ['one', 'two'], '5': ['three'] }
 */

var groupBy = _createAggregator(function (result, value, key) {
  if (hasOwnProperty.call(result, key)) {
    result[key].push(value);
  } else {
    _baseAssignValue(result, key, [value]);
  }
});
var groupBy_1 = groupBy;

const preserveCamelCase = (string, locale) => {
  let isLastCharLower = false;
  let isLastCharUpper = false;
  let isLastLastCharUpper = false;

  for (let i = 0; i < string.length; i++) {
    const character = string[i];

    if (isLastCharLower && /[\p{Lu}]/u.test(character)) {
      string = string.slice(0, i) + '-' + string.slice(i);
      isLastCharLower = false;
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = true;
      i++;
    } else if (isLastCharUpper && isLastLastCharUpper && /[\p{Ll}]/u.test(character)) {
      string = string.slice(0, i - 1) + '-' + string.slice(i - 1);
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = false;
      isLastCharLower = true;
    } else {
      isLastCharLower = character.toLocaleLowerCase(locale) === character && character.toLocaleUpperCase(locale) !== character;
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = character.toLocaleUpperCase(locale) === character && character.toLocaleLowerCase(locale) !== character;
    }
  }

  return string;
};

const preserveConsecutiveUppercase = input => {
  return input.replace(/^[\p{Lu}](?![\p{Lu}])/gu, m1 => m1.toLowerCase());
};

const postProcess = (input, options) => {
  return input.replace(/[_.\- ]+([\p{Alpha}\p{N}_]|$)/gu, (_, p1) => p1.toLocaleUpperCase(options.locale)).replace(/\d+([\p{Alpha}\p{N}_]|$)/gu, m => m.toLocaleUpperCase(options.locale));
};

const camelCase = (input, options) => {
  if (!(typeof input === 'string' || Array.isArray(input))) {
    throw new TypeError('Expected the input to be `string | string[]`');
  }

  options = Object.assign({
    pascalCase: false,
    preserveConsecutiveUppercase: false
  }, options);

  if (Array.isArray(input)) {
    input = input.map(x => x.trim()).filter(x => x.length).join('-');
  } else {
    input = input.trim();
  }

  if (input.length === 0) {
    return '';
  }

  if (input.length === 1) {
    return options.pascalCase ? input.toLocaleUpperCase(options.locale) : input.toLocaleLowerCase(options.locale);
  }

  const hasUpperCase = input !== input.toLocaleLowerCase(options.locale);

  if (hasUpperCase) {
    input = preserveCamelCase(input, options.locale);
  }

  input = input.replace(/^[_.\- ]+/, '');

  if (options.preserveConsecutiveUppercase) {
    input = preserveConsecutiveUppercase(input);
  } else {
    input = input.toLocaleLowerCase();
  }

  if (options.pascalCase) {
    input = input.charAt(0).toLocaleUpperCase(options.locale) + input.slice(1);
  }

  return postProcess(input, options);
};

var camelcase = camelCase; // TODO: Remove this for the next major release

var _default = camelCase;
camelcase.default = _default;

const OPTION_USAGE_THRESHOLD = 25;
const CHOICE_USAGE_MARGIN = 3;
const CHOICE_USAGE_INDENTATION = 2;

function indent(str, spaces) {
  return str.replace(/^/gm, " ".repeat(spaces));
}

function createDefaultValueDisplay(value) {
  return Array.isArray(value) ? `[${value.map(createDefaultValueDisplay).join(", ")}]` : value;
}

function getOptionDefaultValue(context, optionName) {
  // --no-option
  if (!(optionName in context.detailedOptionMap)) {
    return;
  }

  const option = context.detailedOptionMap[optionName];

  if (option.default !== undefined) {
    return option.default;
  }

  const optionCamelName = camelcase(optionName);

  if (optionCamelName in context.apiDefaultOptions) {
    return context.apiDefaultOptions[optionCamelName];
  }
}

function createOptionUsageHeader(option) {
  const name = `--${option.name}`;
  const alias = option.alias ? `-${option.alias},` : null;
  const type = createOptionUsageType(option);
  return [alias, name, type].filter(Boolean).join(" ");
}

function createOptionUsageRow(header, content, threshold) {
  const separator = header.length >= threshold ? `\n${" ".repeat(threshold)}` : " ".repeat(threshold - header.length);
  const description = content.replace(/\n/g, `\n${" ".repeat(threshold)}`);
  return `${header}${separator}${description}`;
}

function createOptionUsageType(option) {
  switch (option.type) {
    case "boolean":
      return null;

    case "choice":
      return `<${option.choices.filter(choice => !choice.deprecated && choice.since !== null).map(choice => choice.value).join("|")}>`;

    default:
      return `<${option.type}>`;
  }
}

function createChoiceUsages(choices, margin, indentation) {
  const activeChoices = choices.filter(choice => !choice.deprecated && choice.since !== null);
  const threshold = Math.max(0, ...activeChoices.map(choice => choice.value.length)) + margin;
  return activeChoices.map(choice => indent(createOptionUsageRow(choice.value, choice.description, threshold), indentation));
}

function createOptionUsage(context, option, threshold) {
  const header = createOptionUsageHeader(option);
  const optionDefaultValue = getOptionDefaultValue(context, option.name);
  return createOptionUsageRow(header, `${option.description}${optionDefaultValue === undefined ? "" : `\nDefaults to ${createDefaultValueDisplay(optionDefaultValue)}.`}`, threshold);
}

function getOptionsWithOpposites(options) {
  // Add --no-foo after --foo.
  const optionsWithOpposites = options.map(option => [option.description ? option : null, option.oppositeDescription ? Object.assign(Object.assign({}, option), {}, {
    name: `no-${option.name}`,
    type: "boolean",
    description: option.oppositeDescription
  }) : null]);
  return optionsWithOpposites.flat().filter(Boolean);
}

function createUsage$1(context) {
  const options = getOptionsWithOpposites(context.detailedOptions).filter( // remove unnecessary option (e.g. `semi`, `color`, etc.), which is only used for --help <flag>
  option => !(option.type === "boolean" && option.oppositeDescription && !option.name.startsWith("no-")));
  const groupedOptions = groupBy_1(options, option => option.category);
  const firstCategories = constant.categoryOrder.slice(0, -1);
  const lastCategories = constant.categoryOrder.slice(-1);
  const restCategories = Object.keys(groupedOptions).filter(category => !constant.categoryOrder.includes(category));
  const allCategories = [...firstCategories, ...restCategories, ...lastCategories];
  const optionsUsage = allCategories.map(category => {
    const categoryOptions = groupedOptions[category].map(option => createOptionUsage(context, option, OPTION_USAGE_THRESHOLD)).join("\n");
    return `${category} options:\n\n${indent(categoryOptions, 2)}`;
  });
  return [constant.usageSummary, ...optionsUsage, ""].join("\n\n");
}

function createDetailedUsage$1(context, flag) {
  const option = getOptionsWithOpposites(context.detailedOptions).find(option => option.name === flag || option.alias === flag);
  const header = createOptionUsageHeader(option);
  const description = `\n\n${indent(option.description, 2)}`;
  const choices = option.type !== "choice" ? "" : `\n\nValid options:\n\n${createChoiceUsages(option.choices, CHOICE_USAGE_MARGIN, CHOICE_USAGE_INDENTATION).join("\n")}`;
  const optionDefaultValue = getOptionDefaultValue(context, option.name);
  const defaults = optionDefaultValue !== undefined ? `\n\nDefault: ${createDefaultValueDisplay(optionDefaultValue)}` : "";
  const pluginDefaults = option.pluginDefaults && Object.keys(option.pluginDefaults).length > 0 ? `\nPlugin defaults:${Object.entries(option.pluginDefaults).map(([key, value]) => `\n* ${key}: ${createDefaultValueDisplay(value)}`)}` : "";
  return `${header}${description}${choices}${defaults}${pluginDefaults}`;
}

var usage = {
  createUsage: createUsage$1,
  createDetailedUsage: createDetailedUsage$1
};

var ansiRegex = ({
  onlyFirst = false
} = {}) => {
  const pattern = ['[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)', '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'].join('|');
  return new RegExp(pattern, onlyFirst ? undefined : 'g');
};

var stripAnsi = string => typeof string === 'string' ? string.replace(ansiRegex(), '') : string;

var clone_1 = createCommonjsModule(function (module) {
  var clone = function () {
    /**
     * Clones (copies) an Object using deep copying.
     *
     * This function supports circular references by default, but if you are certain
     * there are no circular references in your object, you can save some CPU time
     * by calling clone(obj, false).
     *
     * Caution: if `circular` is false and `parent` contains circular references,
     * your program may enter an infinite loop and crash.
     *
     * @param `parent` - the object to be cloned
     * @param `circular` - set to true if the object to be cloned may contain
     *    circular references. (optional - true by default)
     * @param `depth` - set to a number if the object is only to be cloned to
     *    a particular depth. (optional - defaults to Infinity)
     * @param `prototype` - sets the prototype to be used when cloning an object.
     *    (optional - defaults to parent prototype).
    */

    function clone(parent, circular, depth, prototype) {

      if (typeof circular === 'object') {
        depth = circular.depth;
        prototype = circular.prototype;
        circular = circular.circular;
      } // maintain two arrays for circular references, where corresponding parents
      // and children have the same index


      var allParents = [];
      var allChildren = [];
      var useBuffer = typeof Buffer != 'undefined';
      if (typeof circular == 'undefined') circular = true;
      if (typeof depth == 'undefined') depth = Infinity; // recurse this function so we don't reset allParents and allChildren

      function _clone(parent, depth) {
        // cloning null always returns null
        if (parent === null) return null;
        if (depth == 0) return parent;
        var child;
        var proto;

        if (typeof parent != 'object') {
          return parent;
        }

        if (clone.__isArray(parent)) {
          child = [];
        } else if (clone.__isRegExp(parent)) {
          child = new RegExp(parent.source, __getRegExpFlags(parent));
          if (parent.lastIndex) child.lastIndex = parent.lastIndex;
        } else if (clone.__isDate(parent)) {
          child = new Date(parent.getTime());
        } else if (useBuffer && Buffer.isBuffer(parent)) {
          if (Buffer.allocUnsafe) {
            // Node.js >= 4.5.0
            child = Buffer.allocUnsafe(parent.length);
          } else {
            // Older Node.js versions
            child = new Buffer(parent.length);
          }

          parent.copy(child);
          return child;
        } else {
          if (typeof prototype == 'undefined') {
            proto = Object.getPrototypeOf(parent);
            child = Object.create(proto);
          } else {
            child = Object.create(prototype);
            proto = prototype;
          }
        }

        if (circular) {
          var index = allParents.indexOf(parent);

          if (index != -1) {
            return allChildren[index];
          }

          allParents.push(parent);
          allChildren.push(child);
        }

        for (var i in parent) {
          var attrs;

          if (proto) {
            attrs = Object.getOwnPropertyDescriptor(proto, i);
          }

          if (attrs && attrs.set == null) {
            continue;
          }

          child[i] = _clone(parent[i], depth - 1);
        }

        return child;
      }

      return _clone(parent, depth);
    }
    /**
     * Simple flat clone using prototype, accepts only objects, usefull for property
     * override on FLAT configuration object (no nested props).
     *
     * USE WITH CAUTION! This may not behave as you wish if you do not know how this
     * works.
     */


    clone.clonePrototype = function clonePrototype(parent) {
      if (parent === null) return null;

      var c = function () {};

      c.prototype = parent;
      return new c();
    }; // private utility functions


    function __objToStr(o) {
      return Object.prototype.toString.call(o);
    }
    clone.__objToStr = __objToStr;

    function __isDate(o) {
      return typeof o === 'object' && __objToStr(o) === '[object Date]';
    }
    clone.__isDate = __isDate;

    function __isArray(o) {
      return typeof o === 'object' && __objToStr(o) === '[object Array]';
    }
    clone.__isArray = __isArray;

    function __isRegExp(o) {
      return typeof o === 'object' && __objToStr(o) === '[object RegExp]';
    }
    clone.__isRegExp = __isRegExp;

    function __getRegExpFlags(re) {
      var flags = '';
      if (re.global) flags += 'g';
      if (re.ignoreCase) flags += 'i';
      if (re.multiline) flags += 'm';
      return flags;
    }
    clone.__getRegExpFlags = __getRegExpFlags;
    return clone;
  }();

  if (module.exports) {
    module.exports = clone;
  }
});

var defaults = function (options, defaults) {
  options = options || {};
  Object.keys(defaults).forEach(function (key) {
    if (typeof options[key] === 'undefined') {
      options[key] = clone_1(defaults[key]);
    }
  });
  return options;
};

var combining = [[0x0300, 0x036F], [0x0483, 0x0486], [0x0488, 0x0489], [0x0591, 0x05BD], [0x05BF, 0x05BF], [0x05C1, 0x05C2], [0x05C4, 0x05C5], [0x05C7, 0x05C7], [0x0600, 0x0603], [0x0610, 0x0615], [0x064B, 0x065E], [0x0670, 0x0670], [0x06D6, 0x06E4], [0x06E7, 0x06E8], [0x06EA, 0x06ED], [0x070F, 0x070F], [0x0711, 0x0711], [0x0730, 0x074A], [0x07A6, 0x07B0], [0x07EB, 0x07F3], [0x0901, 0x0902], [0x093C, 0x093C], [0x0941, 0x0948], [0x094D, 0x094D], [0x0951, 0x0954], [0x0962, 0x0963], [0x0981, 0x0981], [0x09BC, 0x09BC], [0x09C1, 0x09C4], [0x09CD, 0x09CD], [0x09E2, 0x09E3], [0x0A01, 0x0A02], [0x0A3C, 0x0A3C], [0x0A41, 0x0A42], [0x0A47, 0x0A48], [0x0A4B, 0x0A4D], [0x0A70, 0x0A71], [0x0A81, 0x0A82], [0x0ABC, 0x0ABC], [0x0AC1, 0x0AC5], [0x0AC7, 0x0AC8], [0x0ACD, 0x0ACD], [0x0AE2, 0x0AE3], [0x0B01, 0x0B01], [0x0B3C, 0x0B3C], [0x0B3F, 0x0B3F], [0x0B41, 0x0B43], [0x0B4D, 0x0B4D], [0x0B56, 0x0B56], [0x0B82, 0x0B82], [0x0BC0, 0x0BC0], [0x0BCD, 0x0BCD], [0x0C3E, 0x0C40], [0x0C46, 0x0C48], [0x0C4A, 0x0C4D], [0x0C55, 0x0C56], [0x0CBC, 0x0CBC], [0x0CBF, 0x0CBF], [0x0CC6, 0x0CC6], [0x0CCC, 0x0CCD], [0x0CE2, 0x0CE3], [0x0D41, 0x0D43], [0x0D4D, 0x0D4D], [0x0DCA, 0x0DCA], [0x0DD2, 0x0DD4], [0x0DD6, 0x0DD6], [0x0E31, 0x0E31], [0x0E34, 0x0E3A], [0x0E47, 0x0E4E], [0x0EB1, 0x0EB1], [0x0EB4, 0x0EB9], [0x0EBB, 0x0EBC], [0x0EC8, 0x0ECD], [0x0F18, 0x0F19], [0x0F35, 0x0F35], [0x0F37, 0x0F37], [0x0F39, 0x0F39], [0x0F71, 0x0F7E], [0x0F80, 0x0F84], [0x0F86, 0x0F87], [0x0F90, 0x0F97], [0x0F99, 0x0FBC], [0x0FC6, 0x0FC6], [0x102D, 0x1030], [0x1032, 0x1032], [0x1036, 0x1037], [0x1039, 0x1039], [0x1058, 0x1059], [0x1160, 0x11FF], [0x135F, 0x135F], [0x1712, 0x1714], [0x1732, 0x1734], [0x1752, 0x1753], [0x1772, 0x1773], [0x17B4, 0x17B5], [0x17B7, 0x17BD], [0x17C6, 0x17C6], [0x17C9, 0x17D3], [0x17DD, 0x17DD], [0x180B, 0x180D], [0x18A9, 0x18A9], [0x1920, 0x1922], [0x1927, 0x1928], [0x1932, 0x1932], [0x1939, 0x193B], [0x1A17, 0x1A18], [0x1B00, 0x1B03], [0x1B34, 0x1B34], [0x1B36, 0x1B3A], [0x1B3C, 0x1B3C], [0x1B42, 0x1B42], [0x1B6B, 0x1B73], [0x1DC0, 0x1DCA], [0x1DFE, 0x1DFF], [0x200B, 0x200F], [0x202A, 0x202E], [0x2060, 0x2063], [0x206A, 0x206F], [0x20D0, 0x20EF], [0x302A, 0x302F], [0x3099, 0x309A], [0xA806, 0xA806], [0xA80B, 0xA80B], [0xA825, 0xA826], [0xFB1E, 0xFB1E], [0xFE00, 0xFE0F], [0xFE20, 0xFE23], [0xFEFF, 0xFEFF], [0xFFF9, 0xFFFB], [0x10A01, 0x10A03], [0x10A05, 0x10A06], [0x10A0C, 0x10A0F], [0x10A38, 0x10A3A], [0x10A3F, 0x10A3F], [0x1D167, 0x1D169], [0x1D173, 0x1D182], [0x1D185, 0x1D18B], [0x1D1AA, 0x1D1AD], [0x1D242, 0x1D244], [0xE0001, 0xE0001], [0xE0020, 0xE007F], [0xE0100, 0xE01EF]];

var DEFAULTS = {
  nul: 0,
  control: 0
};

var wcwidth_1 = function wcwidth(str) {
  return wcswidth(str, DEFAULTS);
};

var config = function (opts) {
  opts = defaults(opts || {}, DEFAULTS);
  return function wcwidth(str) {
    return wcswidth(str, opts);
  };
};
/*
 *  The following functions define the column width of an ISO 10646
 *  character as follows:
 *  - The null character (U+0000) has a column width of 0.
 *  - Other C0/C1 control characters and DEL will lead to a return value
 *    of -1.
 *  - Non-spacing and enclosing combining characters (general category
 *    code Mn or Me in the
 *    Unicode database) have a column width of 0.
 *  - SOFT HYPHEN (U+00AD) has a column width of 1.
 *  - Other format characters (general category code Cf in the Unicode
 *    database) and ZERO WIDTH
 *    SPACE (U+200B) have a column width of 0.
 *  - Hangul Jamo medial vowels and final consonants (U+1160-U+11FF)
 *    have a column width of 0.
 *  - Spacing characters in the East Asian Wide (W) or East Asian
 *    Full-width (F) category as
 *    defined in Unicode Technical Report #11 have a column width of 2.
 *  - All remaining characters (including all printable ISO 8859-1 and
 *    WGL4 characters, Unicode control characters, etc.) have a column
 *    width of 1.
 *  This implementation assumes that characters are encoded in ISO 10646.
*/


function wcswidth(str, opts) {
  if (typeof str !== 'string') return wcwidth(str, opts);
  var s = 0;

  for (var i = 0; i < str.length; i++) {
    var n = wcwidth(str.charCodeAt(i), opts);
    if (n < 0) return -1;
    s += n;
  }

  return s;
}

function wcwidth(ucs, opts) {
  // test for 8-bit control characters
  if (ucs === 0) return opts.nul;
  if (ucs < 32 || ucs >= 0x7f && ucs < 0xa0) return opts.control; // binary search in table of non-spacing characters

  if (bisearch(ucs)) return 0; // if we arrive here, ucs is not a combining or C0/C1 control character

  return 1 + (ucs >= 0x1100 && (ucs <= 0x115f || // Hangul Jamo init. consonants
  ucs == 0x2329 || ucs == 0x232a || ucs >= 0x2e80 && ucs <= 0xa4cf && ucs != 0x303f || // CJK ... Yi
  ucs >= 0xac00 && ucs <= 0xd7a3 || // Hangul Syllables
  ucs >= 0xf900 && ucs <= 0xfaff || // CJK Compatibility Ideographs
  ucs >= 0xfe10 && ucs <= 0xfe19 || // Vertical forms
  ucs >= 0xfe30 && ucs <= 0xfe6f || // CJK Compatibility Forms
  ucs >= 0xff00 && ucs <= 0xff60 || // Fullwidth Forms
  ucs >= 0xffe0 && ucs <= 0xffe6 || ucs >= 0x20000 && ucs <= 0x2fffd || ucs >= 0x30000 && ucs <= 0x3fffd));
}

function bisearch(ucs) {
  var min = 0;
  var max = combining.length - 1;
  var mid;
  if (ucs < combining[0][0] || ucs > combining[max][1]) return false;

  while (max >= min) {
    mid = Math.floor((min + max) / 2);
    if (ucs > combining[mid][1]) min = mid + 1;else if (ucs < combining[mid][0]) max = mid - 1;else return true;
  }

  return false;
}
wcwidth_1.config = config;

const countLines = (stream, text) => {
  const columns = stream.columns || 80;
  let lineCount = 0;

  for (const line of stripAnsi(text).split("\n")) {
    lineCount += Math.max(1, Math.ceil(wcwidth_1(line) / columns));
  }

  return lineCount;
};

const clear = (stream, text) => () => {
  const lineCount = countLines(stream, text);

  for (let line = 0; line < lineCount; line++) {
    if (line > 0) {
      readline__default['default'].moveCursor(stream, 0, -1);
    }

    readline__default['default'].clearLine(stream, 0);
    readline__default['default'].cursorTo(stream, 0);
  }
};

const emptyLogResult = {
  clear() {}

};

function createLogger$1(logLevel = "log") {
  return {
    logLevel,
    warn: createLogFunc("warn", "yellow"),
    error: createLogFunc("error", "red"),
    debug: createLogFunc("debug", "blue"),
    log: createLogFunc("log")
  };

  function createLogFunc(loggerName, color) {
    if (!shouldLog(loggerName)) {
      return () => emptyLogResult;
    }

    const prefix = color ? `[${source[color](loggerName)}] ` : "";
    const stream = process[loggerName === "log" ? "stdout" : "stderr"];
    return (message, options) => {
      options = Object.assign({
        newline: true,
        clearable: false
      }, options);
      message = message.replace(/^/gm, prefix) + (options.newline ? "\n" : "");
      stream.write(message);

      if (options.clearable) {
        return {
          clear: clear(stream, message)
        };
      }
    };
  }

  function shouldLog(loggerName) {
    switch (logLevel) {
      case "silent":
        return false;

      case "debug":
        if (loggerName === "debug") {
          return true;
        }

      // fall through

      case "log":
        if (loggerName === "log") {
          return true;
        }

      // fall through

      case "warn":
        if (loggerName === "warn") {
          return true;
        }

      // fall through

      case "error":
        return loggerName === "error";
    }
  }
}

var logger = {
  createLogger: createLogger$1
};

const {
  format,
  formatStdin,
  formatFiles
} = format_1;
const {
  Context,
  parseArgvWithoutPlugins
} = context;
const {
  normalizeDetailedOptionMap,
  createDetailedOptionMap
} = optionMap;
const {
  createDetailedUsage,
  createUsage
} = usage;
const {
  createLogger
} = logger;

async function logResolvedConfigPathOrDie(context) {
  const file = context.argv["find-config-path"];
  const configFile = await prettier$1.resolveConfigFile(file);

  if (configFile) {
    context.logger.log(path__default['default'].relative(process.cwd(), configFile));
  } else {
    throw new Error(`Can not find configure file for "${file}"`);
  }
}

async function logFileInfoOrDie(context) {
  const options = {
    ignorePath: context.argv["ignore-path"],
    withNodeModules: context.argv["with-node-modules"],
    plugins: context.argv.plugin,
    pluginSearchDirs: context.argv["plugin-search-dir"],
    resolveConfig: context.argv.config !== false
  };
  context.logger.log(prettier$1.format(fastJsonStableStringify(await prettier$1.getFileInfo(context.argv["file-info"], options)), {
    parser: "json"
  }));
}

var core = {
  Context,
  createDetailedOptionMap,
  createDetailedUsage,
  createUsage,
  format,
  formatFiles,
  formatStdin,
  logResolvedConfigPathOrDie,
  logFileInfoOrDie,
  normalizeDetailedOptionMap,
  parseArgvWithoutPlugins,
  createLogger
};

pleaseUpgradeNode(packageJson); // eslint-disable-next-line import/order
// eslint-disable-next-line no-restricted-modules

async function run(rawArguments) {
  // Create a default level logger, so we can log errors during `logLevel` parsing
  let logger = core.createLogger();

  try {
    const logLevel = core.parseArgvWithoutPlugins(rawArguments, logger, "loglevel").loglevel;

    if (logLevel !== logger.logLevel) {
      logger = core.createLogger(logLevel);
    }

    await main(rawArguments, logger);
  } catch (error) {
    logger.error(error.message);
    process.exitCode = 1;
  }
}

async function main(rawArguments, logger) {
  const context = new core.Context({
    rawArguments,
    logger
  });
  logger.debug(`normalized argv: ${JSON.stringify(context.argv)}`);

  if (context.argv.check && context.argv["list-different"]) {
    throw new Error("Cannot use --check and --list-different together.");
  }

  if (context.argv.write && context.argv["debug-check"]) {
    throw new Error("Cannot use --write and --debug-check together.");
  }

  if (context.argv["find-config-path"] && context.filePatterns.length > 0) {
    throw new Error("Cannot use --find-config-path with multiple files");
  }

  if (context.argv["file-info"] && context.filePatterns.length > 0) {
    throw new Error("Cannot use --file-info with multiple files");
  }

  if (context.argv.version) {
    logger.log(prettier$1.version);
    return;
  }

  if (context.argv.help !== undefined) {
    logger.log(typeof context.argv.help === "string" && context.argv.help !== "" ? core.createDetailedUsage(context, context.argv.help) : core.createUsage(context));
    return;
  }

  if (context.argv["support-info"]) {
    logger.log(prettier$1.format(fastJsonStableStringify(prettier$1.getSupportInfo()), {
      parser: "json"
    }));
    return;
  }

  const hasFilePatterns = context.filePatterns.length > 0;
  const useStdin = !hasFilePatterns && (!process.stdin.isTTY || context.argv["stdin-filepath"]);

  if (context.argv["find-config-path"]) {
    await core.logResolvedConfigPathOrDie(context);
  } else if (context.argv["file-info"]) {
    await core.logFileInfoOrDie(context);
  } else if (useStdin) {
    await core.formatStdin(context);
  } else if (hasFilePatterns) {
    await core.formatFiles(context);
  } else {
    logger.log(core.createUsage(context));
    process.exitCode = 1;
  }
}

var cli = {
  run
};

var prettier = cli.run(process.argv.slice(2));

module.exports = prettier;
