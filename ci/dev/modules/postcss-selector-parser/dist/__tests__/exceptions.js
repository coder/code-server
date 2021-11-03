"use strict";

var _helpers = require("./util/helpers");

// Unclosed elements
(0, _helpers["throws"])('unclosed string', 'a[href="wow]');
(0, _helpers["throws"])('unclosed comment', '/* oops');
(0, _helpers["throws"])('unclosed pseudo element', 'button::');
(0, _helpers["throws"])('unclosed pseudo class', 'a:');
(0, _helpers["throws"])('unclosed attribute selector', '[name="james"][href');
(0, _helpers["throws"])('no opening parenthesis', ')');
(0, _helpers["throws"])('no opening parenthesis (2)', ':global.foo)');
(0, _helpers["throws"])('no opening parenthesis (3)', 'h1:not(h2:not(h3)))');
(0, _helpers["throws"])('no opening square bracket', ']');
(0, _helpers["throws"])('no opening square bracket (2)', ':global.foo]');
(0, _helpers["throws"])('no opening square bracket (3)', '[global]]');
(0, _helpers["throws"])('bad pseudo element', 'button::"after"');
(0, _helpers["throws"])('missing closing parenthesis in pseudo', ':not([attr="test"]:not([attr="test"])');
(0, _helpers["throws"])('bad syntax', '-moz-osx-font-smoothing: grayscale');
(0, _helpers["throws"])('bad syntax (2)', '! .body');
(0, _helpers["throws"])('missing backslash for semicolon', '.;');
(0, _helpers["throws"])('missing backslash for semicolon (2)', '.\;');
(0, _helpers["throws"])('unexpected / foo', '-Option\/root', "Unexpected '/'. Escaping special characters with \\ may help.");
(0, _helpers["throws"])('bang in selector', '.foo !optional', "Unexpected '!'. Escaping special characters with \\ may help.");