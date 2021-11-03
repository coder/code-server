"use strict";

var _helpers = require("./util/helpers");

(0, _helpers.test)('non-standard selector', '.icon.is-$(network)', function (t, tree) {
  var class1 = tree.nodes[0].nodes[0];
  t.deepEqual(class1.value, 'icon');
  t.deepEqual(class1.type, 'class');
  var class2 = tree.nodes[0].nodes[1];
  t.deepEqual(class2.value, 'is-$(network)');
  t.deepEqual(class2.type, 'class');
});
(0, _helpers.test)('at word in selector', 'em@il.com', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'em@il');
  t.deepEqual(tree.nodes[0].nodes[1].value, 'com');
});
(0, _helpers.test)('leading combinator', '> *', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '>');
  t.deepEqual(tree.nodes[0].nodes[1].value, '*');
});
(0, _helpers.test)('sass escapes', '.#{$classname}', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, "class");
  t.deepEqual(tree.nodes[0].nodes[0].value, "#{$classname}");
});
(0, _helpers.test)('sass escapes (2)', '[lang=#{$locale}]', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, "attribute");
  t.deepEqual(tree.nodes[0].nodes[0].attribute, "lang");
  t.deepEqual(tree.nodes[0].nodes[0].operator, "=");
  t.deepEqual(tree.nodes[0].nodes[0].value, "#{$locale}");
});
(0, _helpers.test)('placeholder', '%foo', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, "tag");
  t.deepEqual(tree.nodes[0].nodes[0].value, "%foo");
});
(0, _helpers.test)('styled selector', '${Step}', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, "tag");
  t.deepEqual(tree.nodes[0].nodes[0].value, "${Step}");
});
(0, _helpers.test)('styled selector (2)', '${Step}:nth-child(odd)', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, "tag");
  t.deepEqual(tree.nodes[0].nodes[0].value, "${Step}");
  t.deepEqual(tree.nodes[0].nodes[1].type, "pseudo");
  t.deepEqual(tree.nodes[0].nodes[1].value, ":nth-child");
  t.deepEqual(tree.nodes[0].nodes[1].nodes[0].nodes[0].type, "tag");
  t.deepEqual(tree.nodes[0].nodes[1].nodes[0].nodes[0].value, "odd");
});