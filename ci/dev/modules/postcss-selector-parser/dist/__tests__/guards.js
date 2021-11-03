"use strict";

var _ = _interopRequireDefault(require("../"));

var _helpers = require("./util/helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var node = function node(tree, n) {
  if (n === void 0) {
    n = 0;
  }

  return tree.nodes[0].nodes[n];
};

(0, _helpers.test)('attribute guard', '[foo]', function (t, tree) {
  var n = node(tree);
  t["true"](_["default"].isNode(n));
  t["false"](_["default"].isAttribute(undefined));
  t["true"](_["default"].isAttribute(n));
  t["false"](_["default"].isContainer(n));
  t["true"](_["default"].isNamespace(n));
});
(0, _helpers.test)('className guard', '.foo', function (t, tree) {
  var n = node(tree);
  t["true"](_["default"].isNode(n));
  t["false"](_["default"].isClassName(undefined));
  t["true"](_["default"].isClassName(n));
  t["false"](_["default"].isContainer(n));
  t["false"](_["default"].isNamespace(n));
});
(0, _helpers.test)('combinator guard', '.foo > .bar', function (t, tree) {
  var n = node(tree, 1);
  t["true"](_["default"].isNode(n));
  t["false"](_["default"].isCombinator(undefined));
  t["true"](_["default"].isCombinator(n));
  t["false"](_["default"].isContainer(n));
  t["false"](_["default"].isNamespace(n));
});
(0, _helpers.test)('comment guard', '/* foo */.foo > .bar', function (t, tree) {
  var n = node(tree);
  t["true"](_["default"].isNode(n));
  t["false"](_["default"].isComment(undefined));
  t["true"](_["default"].isComment(n));
  t["false"](_["default"].isContainer(n));
  t["false"](_["default"].isNamespace(n));
});
(0, _helpers.test)('id guard', '#ident', function (t, tree) {
  var n = node(tree);
  t["true"](_["default"].isNode(n));
  t["false"](_["default"].isIdentifier(undefined));
  t["true"](_["default"].isIdentifier(n));
  t["false"](_["default"].isContainer(n));
  t["false"](_["default"].isNamespace(n));
});
(0, _helpers.test)('nesting guard', '&.foo', function (t, tree) {
  var n = node(tree);
  t["true"](_["default"].isNode(n));
  t["false"](_["default"].isNesting(undefined));
  t["true"](_["default"].isNesting(n));
  t["false"](_["default"].isContainer(n));
  t["false"](_["default"].isNamespace(n));
});
(0, _helpers.test)('pseudo class guard', ':hover', function (t, tree) {
  var n = node(tree);
  t["true"](_["default"].isNode(n));
  t["false"](_["default"].isPseudo(undefined));
  t["true"](_["default"].isPseudo(n));
  t["true"](_["default"].isPseudoClass(n));
  t["false"](_["default"].isPseudoElement(n));
  t["true"](_["default"].isContainer(n));
  t["false"](_["default"].isNamespace(n));
});
(0, _helpers.test)('pseudo element guard', '::first-line', function (t, tree) {
  var n = node(tree);
  t["true"](_["default"].isNode(n));
  t["false"](_["default"].isPseudo(undefined));
  t["true"](_["default"].isPseudo(n));
  t["false"](_["default"].isPseudoClass(n));
  t["true"](_["default"].isPseudoElement(n));
  t["true"](_["default"].isContainer(n));
  t["false"](_["default"].isNamespace(n));
});
(0, _helpers.test)('special pseudo element guard', ':before:after', function (t, tree) {
  [node(tree), node(tree, 1)].forEach(function (n) {
    t["true"](_["default"].isPseudo(n));
    t["false"](_["default"].isPseudoClass(n));
    t["true"](_["default"].isPseudoElement(n));
    t["true"](_["default"].isContainer(n));
    t["false"](_["default"].isNamespace(n));
  });
});
(0, _helpers.test)('special pseudo element guard (uppercase)', ':BEFORE:AFTER', function (t, tree) {
  [node(tree), node(tree, 1)].forEach(function (n) {
    t["true"](_["default"].isPseudo(n));
    t["false"](_["default"].isPseudoClass(n));
    t["true"](_["default"].isPseudoElement(n));
    t["true"](_["default"].isContainer(n));
    t["false"](_["default"].isNamespace(n));
  });
});
(0, _helpers.test)('string guard', '"string"', function (t, tree) {
  var n = node(tree);
  t["true"](_["default"].isNode(n));
  t["false"](_["default"].isString(undefined));
  t["true"](_["default"].isString(n));
  t["false"](_["default"].isContainer(n));
  t["false"](_["default"].isNamespace(n));
});
(0, _helpers.test)('tag guard', 'h1', function (t, tree) {
  var n = node(tree);
  t["false"](_["default"].isNode(undefined));
  t["true"](_["default"].isNode(n));
  t["false"](_["default"].isTag(undefined));
  t["true"](_["default"].isTag(n));
  t["false"](_["default"].isContainer(n));
  t["true"](_["default"].isNamespace(n));
});
(0, _helpers.test)('universal guard', '*', function (t, tree) {
  var n = node(tree);
  t["true"](_["default"].isNode(n));
  t["false"](_["default"].isUniversal(undefined));
  t["true"](_["default"].isUniversal(n));
  t["false"](_["default"].isContainer(n));
  t["false"](_["default"].isNamespace(n));
});