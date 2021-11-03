"use strict";

exports.__esModule = true;
exports.test = test;
exports.nodeVersionAtLeast = nodeVersionAtLeast;
exports.nodeVersionBefore = nodeVersionBefore;
exports["throws"] = exports.parse = void 0;

var _process = _interopRequireDefault(require("process"));

var _util = _interopRequireDefault(require("util"));

var _ava = _interopRequireDefault(require("ava"));

var _semver = _interopRequireDefault(require("semver"));

var _index = _interopRequireDefault(require("../../index"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var parse = function parse(input, transform) {
  return (0, _index["default"])(transform).processSync(input);
};

exports.parse = parse;

function test(spec, input, callback, only, disabled, serial) {
  var _this = this;

  if (only === void 0) {
    only = false;
  }

  if (disabled === void 0) {
    disabled = false;
  }

  if (serial === void 0) {
    serial = false;
  }

  var tester = only ? _ava["default"].only : _ava["default"];
  tester = disabled ? tester.skip : tester;
  tester = serial ? tester.serial : tester;

  if (callback) {
    tester(spec + " (tree)", function (t) {
      var tree = (0, _index["default"])().astSync(input);

      var debug = _util["default"].inspect(tree, false, null);

      return callback.call(_this, t, tree, debug);
    });
  }

  tester(spec + " (toString)", function (t) {
    var result = (0, _index["default"])().processSync(input);
    t.deepEqual(result, input);
  });
}

test.only = function (spec, input, callback) {
  return test(spec, input, callback, true);
};

test.skip = function (spec, input, callback) {
  return test(spec, input, callback, false, true);
};

test.serial = function (spec, input, callback) {
  return test(spec, input, callback, false, false, true);
};

var _throws = function _throws(spec, input, validator) {
  (0, _ava["default"])(spec + " (throws)", function (t) {
    t["throws"](function () {
      return (0, _index["default"])().processSync(input);
    }, validator ? {
      message: validator
    } : {
      instanceOf: Error
    });
  });
};

exports["throws"] = _throws;

function nodeVersionAtLeast(version) {
  return _semver["default"].gte(_process["default"].versions.node, version);
}

function nodeVersionBefore(version) {
  return _semver["default"].lt(_process["default"].versions.node, version);
}