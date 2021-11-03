"use strict";

var _helpers = require("./util/helpers");

(0, _helpers.test)('match tags in the postcss namespace', 'postcss|button', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].namespace, 'postcss');
  t.deepEqual(tree.nodes[0].nodes[0].value, 'button');
});
(0, _helpers.test)('match everything in the postcss namespace', 'postcss|*', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].namespace, 'postcss');
  t.deepEqual(tree.nodes[0].nodes[0].value, '*');
});
(0, _helpers.test)('match any namespace', '*|button', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].namespace, '*');
  t.deepEqual(tree.nodes[0].nodes[0].value, 'button');
});
(0, _helpers.test)('match all elements within the postcss namespace', 'postcss|*', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].namespace, 'postcss');
  t.deepEqual(tree.nodes[0].nodes[0].value, '*');
});
(0, _helpers.test)('match all elements in all namespaces', '*|*', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].namespace, '*');
  t.deepEqual(tree.nodes[0].nodes[0].value, '*');
});
(0, _helpers.test)('match all elements without a namespace', '|*', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].namespace, true);
  t.deepEqual(tree.nodes[0].nodes[0].value, '*');
});
(0, _helpers.test)('match tags with no namespace', '|button', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].namespace, true);
  t.deepEqual(tree.nodes[0].nodes[0].value, 'button');
});
(0, _helpers.test)('match namespace inside attribute selector', '[postcss|href=test]', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].namespace, 'postcss');
  t.deepEqual(tree.nodes[0].nodes[0].value, 'test');
});
(0, _helpers.test)('match namespace inside attribute selector (2)', '[postcss|href]', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].namespace, 'postcss');
  t.deepEqual(tree.nodes[0].nodes[0].attribute, 'href');
});
(0, _helpers.test)('match namespace inside attribute selector (3)', '[*|href]', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].namespace, '*');
  t.deepEqual(tree.nodes[0].nodes[0].attribute, 'href');
});
(0, _helpers.test)('match default namespace inside attribute selector', '[|href]', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].namespace, true);
  t.deepEqual(tree.nodes[0].nodes[0].attribute, 'href');
});
(0, _helpers.test)('match default namespace inside attribute selector with spaces', '[ |href ]', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].namespace, true);
  t.deepEqual(tree.nodes[0].nodes[0].attribute, 'href');
});
(0, _helpers.test)('namespace with qualified id selector', 'ns|h1#foo', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].namespace, 'ns');
});
(0, _helpers.test)('namespace with qualified class selector', 'ns|h1.foo', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].namespace, 'ns');
});
(0, _helpers.test)('ns alias for namespace', 'f\\oo|h1.foo', function (t, tree) {
  var tag = tree.nodes[0].nodes[0];
  t.deepEqual(tag.namespace, 'foo');
  t.deepEqual(tag.ns, 'foo');
  tag.ns = "bar";
  t.deepEqual(tag.namespace, 'bar');
  t.deepEqual(tag.ns, 'bar');
});