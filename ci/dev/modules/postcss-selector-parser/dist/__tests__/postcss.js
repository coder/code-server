"use strict";

var _ava = _interopRequireDefault(require("ava"));

var _postcss = _interopRequireDefault(require("postcss"));

var _helpers = require("./util/helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var cse = 'CssSyntaxError';

function showCode(t, selector) {
  var rule = _postcss["default"].parse(selector).first;

  try {
    (0, _helpers.parse)(rule);
  } catch (e) {
    if (e.name !== cse) {
      return;
    } // Removes ANSI codes from snapshot tests as it makes them illegible.
    // The formatting of this error is otherwise identical to e.toString()


    t.snapshot(cse + ": " + e.message + "\n\n" + e.showSourceCode(false) + "\n");
  }
}

(0, _ava["default"])('missing open square bracket', showCode, 'a b c] {}');
(0, _ava["default"])('missing open parenthesis', showCode, 'a b c) {}');
(0, _ava["default"])('missing pseudo class or pseudo element', showCode, 'a b c: {}');
(0, _ava["default"])('space in between colon and word (incorrect pseudo)', showCode, 'a b: c {}');
(0, _ava["default"])('string after colon (incorrect pseudo)', showCode, 'a b:"wow" {}'); // attribute selectors

(0, _ava["default"])('bad string attribute', showCode, '["hello"] {}');
(0, _ava["default"])('bad string attribute with value', showCode, '["foo"=bar] {}');
(0, _ava["default"])('bad parentheses', showCode, '[foo=(bar)] {}');
(0, _ava["default"])('bad lonely asterisk', showCode, '[*] {}');
(0, _ava["default"])('bad lonely pipe', showCode, '[|] {}');
(0, _ava["default"])('bad lonely caret', showCode, '[^] {}');
(0, _ava["default"])('bad lonely dollar', showCode, '[$] {}');
(0, _ava["default"])('bad lonely tilde', showCode, '[~] {}');
(0, _ava["default"])('bad lonely equals', showCode, '[=] {}');
(0, _ava["default"])('bad lonely operator', showCode, '[*=] {}');
(0, _ava["default"])('bad lonely operator (2)', showCode, '[|=] {}');
(0, _ava["default"])('bad doubled operator', showCode, '[href=foo=bar] {}');