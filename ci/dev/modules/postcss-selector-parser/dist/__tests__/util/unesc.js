"use strict";

var _helpers = require("../util/helpers");

(0, _helpers.test)('id selector', '#foo', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'foo');
});
(0, _helpers.test)('escaped special char', '#w\\+', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'w+');
});
(0, _helpers.test)('tailing escape', '#foo\\', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'foo\\');
});
(0, _helpers.test)('double escape', '#wow\\\\k', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'wow\\k');
});
(0, _helpers.test)('leading numeric', '.\\31 23', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '123');
});
(0, _helpers.test)('emoji', '.\\🐐', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '🐐');
}); // https://www.w3.org/International/questions/qa-escapes#cssescapes

(0, _helpers.test)('hex escape', '.\\E9motion', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'émotion');
});
(0, _helpers.test)('hex escape with space', '.\\E9 dition', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'édition');
});
(0, _helpers.test)('hex escape with hex number', '.\\0000E9dition', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'édition');
});
(0, _helpers.test)('class selector with escaping', '.\\1D306', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '𝌆');
});
(0, _helpers.test)('class selector with escaping with more chars', '.\\1D306k', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '𝌆k');
});
(0, _helpers.test)('class selector with escaping with more chars with whitespace', '.wow\\1D306 k', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'wow𝌆k');
});
(0, _helpers.test)('handles 0 value hex', '\\0', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, String.fromCodePoint(0xFFFD));
});
(0, _helpers.test)('handles lone surrogate value hex', '\\DBFF', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, String.fromCodePoint(0xFFFD));
});
(0, _helpers.test)('handles out of bound values', '\\110000', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, String.fromCodePoint(0xFFFD));
});