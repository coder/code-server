"use strict";

var _helpers = require("./util/helpers");

(0, _helpers.test)('nesting selector', '&', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '&');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'nesting');
});
(0, _helpers.test)('nesting selector followed by a class', '& .class', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '&');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'nesting');
  t.deepEqual(tree.nodes[0].nodes[1].value, ' ');
  t.deepEqual(tree.nodes[0].nodes[1].type, 'combinator');
  t.deepEqual(tree.nodes[0].nodes[2].value, 'class');
  t.deepEqual(tree.nodes[0].nodes[2].type, 'class');
});
(0, _helpers.test)('&foo', '&foo', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '&');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'nesting');
  t.deepEqual(tree.nodes[0].nodes[1].value, 'foo');
  t.deepEqual(tree.nodes[0].nodes[1].type, 'tag');
});
(0, _helpers.test)('&-foo', '&-foo', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '&');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'nesting');
  t.deepEqual(tree.nodes[0].nodes[1].value, '-foo');
  t.deepEqual(tree.nodes[0].nodes[1].type, 'tag');
});
(0, _helpers.test)('&_foo', '&_foo', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '&');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'nesting');
  t.deepEqual(tree.nodes[0].nodes[1].value, '_foo');
  t.deepEqual(tree.nodes[0].nodes[1].type, 'tag');
});
(0, _helpers.test)('&|foo', '&|foo', function (t, tree) {
  var element = tree.nodes[0].nodes[0];
  t.deepEqual(element.value, 'foo');
  t.deepEqual(element.type, 'tag');
  t.deepEqual(element.namespace, '&');
});