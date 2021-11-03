"use strict";

var _ava = _interopRequireDefault(require("ava"));

var _stripComments = _interopRequireDefault(require("../../src/util/stripComments"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

(0, _ava["default"])("stripComments()", function (t) {
  t.deepEqual((0, _stripComments["default"])("aaa/**/bbb"), "aaabbb");
  t.deepEqual((0, _stripComments["default"])("aaa/*bbb"), "aaa");
  t.deepEqual((0, _stripComments["default"])("aaa/*xxx*/bbb"), "aaabbb");
  t.deepEqual((0, _stripComments["default"])("aaa/*/xxx/*/bbb"), "aaabbb");
  t.deepEqual((0, _stripComments["default"])("aaa/*x*/bbb/**/"), "aaabbb");
  t.deepEqual((0, _stripComments["default"])("/**/aaa/*x*/bbb/**/"), "aaabbb");
  t.deepEqual((0, _stripComments["default"])("/**/"), "");
});