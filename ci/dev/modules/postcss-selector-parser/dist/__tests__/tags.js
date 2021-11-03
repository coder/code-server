"use strict";

var _helpers = require("./util/helpers");

(0, _helpers.test)('tag selector', 'h1', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'h1');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'tag');
});
(0, _helpers.test)('multiple tag selectors', 'h1, h2', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'h1');
  t.deepEqual(tree.nodes[1].nodes[0].value, 'h2');
});
(0, _helpers.test)('extraneous non-combinating whitespace', '  h1   ,  h2   ', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'h1');
  t.deepEqual(tree.nodes[0].nodes[0].spaces.before, '  ');
  t.deepEqual(tree.nodes[0].nodes[0].spaces.after, '   ');
  t.deepEqual(tree.nodes[1].nodes[0].value, 'h2');
  t.deepEqual(tree.nodes[1].nodes[0].spaces.before, '  ');
  t.deepEqual(tree.nodes[1].nodes[0].spaces.after, '   ');
});
(0, _helpers.test)('tag with trailing comma', 'h1,', function (t, tree) {
  t.deepEqual(tree.trailingComma, true);
});
(0, _helpers.test)('tag with trailing slash', 'h1\\', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'h1\\');
});
(0, _helpers.test)('tag with attribute', 'label[for="email"]', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'label');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'tag');
  t.deepEqual(tree.nodes[0].nodes[1].value, 'email');
  t.deepEqual(tree.nodes[0].nodes[1].attribute, 'for');
  t.deepEqual(tree.nodes[0].nodes[1].operator, '=');
  t.deepEqual(tree.nodes[0].nodes[1].type, 'attribute');
  t.deepEqual(tree.nodes[0].nodes[1].quoteMark, '"');
});