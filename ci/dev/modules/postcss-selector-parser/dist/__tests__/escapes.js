"use strict";

var _helpers = require("./util/helpers");

(0, _helpers.test)('escaped semicolon in class', '.\\;', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, ';');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\;');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
});
(0, _helpers.test)('escaped semicolon in id', '#\\;', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, ';');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\;');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
}); // This is a side-effect of allowing media queries to be parsed. Not sure it shouldn't just be an error.

(0, _helpers.test)('bare parens capture contents as a string', '(h1)', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '(h1)');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'string');
});