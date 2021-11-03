"use strict";

var _types = require("../selectors/types");

var _helpers = require("./util/helpers");

(0, _helpers.test)('multiple combinating spaces', 'h1         h2', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'h1');
  t.deepEqual(tree.nodes[0].nodes[1].value, ' ');
  t.deepEqual(tree.nodes[0].nodes[1].toString(), '         ');
  t.deepEqual(tree.nodes[0].nodes[2].value, 'h2');
});
(0, _helpers.test)('column combinator', '.selected||td', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'selected');
  t.deepEqual(tree.nodes[0].nodes[1].value, '||');
  t.deepEqual(tree.nodes[0].nodes[2].value, 'td');
});
(0, _helpers.test)('column combinator (2)', '.selected || td', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'selected');
  t.deepEqual(tree.nodes[0].nodes[1].spaces.before, ' ');
  t.deepEqual(tree.nodes[0].nodes[1].value, '||');
  t.deepEqual(tree.nodes[0].nodes[1].spaces.after, ' ');
  t.deepEqual(tree.nodes[0].nodes[2].value, 'td');
});
(0, _helpers.test)('descendant combinator', 'h1 h2', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'h1');
  t.deepEqual(tree.nodes[0].nodes[1].value, ' ');
  t.deepEqual(tree.nodes[0].nodes[2].value, 'h2');
});
(0, _helpers.test)('multiple descendant combinators', 'h1 h2 h3 h4', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[1].value, ' ', 'should have a combinator');
  t.deepEqual(tree.nodes[0].nodes[3].value, ' ', 'should have a combinator');
  t.deepEqual(tree.nodes[0].nodes[5].value, ' ', 'should have a combinator');
});
(0, _helpers.test)('adjacent sibling combinator', 'h1~h2', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'h1');
  t.deepEqual(tree.nodes[0].nodes[1].value, '~');
  t.deepEqual(tree.nodes[0].nodes[2].value, 'h2');
});
(0, _helpers.test)('adjacent sibling combinator (2)', 'h1 ~h2', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'h1');
  t.deepEqual(tree.nodes[0].nodes[1].spaces.before, ' ');
  t.deepEqual(tree.nodes[0].nodes[1].value, '~');
  t.deepEqual(tree.nodes[0].nodes[2].value, 'h2');
});
(0, _helpers.test)('adjacent sibling combinator (3)', 'h1~ h2', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'h1');
  t.deepEqual(tree.nodes[0].nodes[1].value, '~');
  t.deepEqual(tree.nodes[0].nodes[1].spaces.after, ' ');
  t.deepEqual(tree.nodes[0].nodes[2].value, 'h2');
});
(0, _helpers.test)('adjacent sibling combinator (4)', 'h1 ~ h2', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'h1');
  t.deepEqual(tree.nodes[0].nodes[1].spaces.before, ' ');
  t.deepEqual(tree.nodes[0].nodes[1].value, '~');
  t.deepEqual(tree.nodes[0].nodes[1].spaces.after, ' ');
  t.deepEqual(tree.nodes[0].nodes[2].value, 'h2');
});
(0, _helpers.test)('adjacent sibling combinator (5)', 'h1~h2~h3', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'h1');
  t.deepEqual(tree.nodes[0].nodes[1].value, '~');
  t.deepEqual(tree.nodes[0].nodes[2].value, 'h2');
  t.deepEqual(tree.nodes[0].nodes[3].value, '~');
  t.deepEqual(tree.nodes[0].nodes[4].value, 'h3');
});
(0, _helpers.test)('piercing combinator', '.a >>> .b', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'a');
  t.deepEqual(tree.nodes[0].nodes[1].spaces.before, ' ');
  t.deepEqual(tree.nodes[0].nodes[1].value, '>>>');
  t.deepEqual(tree.nodes[0].nodes[1].spaces.after, ' ');
  t.deepEqual(tree.nodes[0].nodes[2].value, 'b');
});
(0, _helpers.test)('named combinators', 'a /deep/ b', function (t, tree) {
  var nodes = tree.nodes[0].nodes;
  t.deepEqual(nodes[0].value, 'a');
  t.deepEqual(nodes[1].type, _types.COMBINATOR);
  t.deepEqual(nodes[1].toString(), ' /deep/ ');
  t.deepEqual(nodes[1].value, '/deep/');
  t.deepEqual(nodes[2].value, 'b');
});
(0, _helpers.test)('named combinators with escapes', 'a /dee\\p/ b', function (t, tree) {
  var nodes = tree.nodes[0].nodes;
  t.deepEqual(nodes[0].value, 'a');
  t.deepEqual(nodes[1].type, _types.COMBINATOR);
  t.deepEqual(nodes[1].toString(), ' /dee\\p/ ');
  t.deepEqual(nodes[1].value, '/deep/');
  t.deepEqual(nodes[2].value, 'b');
});
(0, _helpers.test)('named combinators with escapes and uppercase', 'a /DeE\\p/ b', function (t, tree) {
  var nodes = tree.nodes[0].nodes;
  t.deepEqual(nodes[0].value, 'a');
  t.deepEqual(nodes[1].type, _types.COMBINATOR);
  t.deepEqual(nodes[1].toString(), ' /DeE\\p/ ');
  t.deepEqual(nodes[1].value, '/deep/');
  t.deepEqual(nodes[2].value, 'b');
});
(0, _helpers.test)('multiple combinators', 'h1~h2>h3', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[1].value, '~', 'should have a combinator');
  t.deepEqual(tree.nodes[0].nodes[3].value, '>', 'should have a combinator');
});
(0, _helpers.test)('multiple combinators with whitespaces', 'h1 + h2 > h3', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[1].value, '+', 'should have a combinator');
  t.deepEqual(tree.nodes[0].nodes[3].value, '>', 'should have a combinator');
});
(0, _helpers.test)('multiple combinators with whitespaces (2)', 'h1+ h2 >h3', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[1].value, '+', 'should have a combinator');
  t.deepEqual(tree.nodes[0].nodes[3].value, '>', 'should have a combinator');
});
(0, _helpers.test)('trailing combinator & spaces', 'p +        ', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'p', 'should be a paragraph');
  t.deepEqual(tree.nodes[0].nodes[1].value, '+', 'should have a combinator');
});
(0, _helpers.test)('trailing sibling combinator', 'p ~', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'p', 'should be a paragraph');
  t.deepEqual(tree.nodes[0].nodes[1].value, '~', 'should have a combinator');
});
(0, _helpers.test)('ending in comment has no trailing combinator', ".bar /* comment 3 */", function (t, tree) {
  var nodeTypes = tree.nodes[0].map(function (n) {
    return n.type;
  });
  t.deepEqual(nodeTypes, ["class"]);
});
(0, _helpers.test)('The combinating space is not a space character', ".bar\n.baz", function (t, tree) {
  var nodeTypes = tree.nodes[0].map(function (n) {
    return n.type;
  });
  t.deepEqual(nodeTypes, ["class", "combinator", "class"]);
  t.deepEqual(tree.nodes[0].nodes[1].value, ' ', 'should have a combinator');
  t.deepEqual(tree.nodes[0].nodes[1].raws.value, '\n', 'should have a raw combinator value');
});
(0, _helpers.test)('with spaces and a comment has only one combinator', ".bar /* comment 3 */ > .foo", function (t, tree) {
  var nodeTypes = tree.nodes[0].map(function (n) {
    return n.type;
  });
  t.deepEqual(nodeTypes, ["class", "combinator", "class"]);
});
(0, _helpers.test)('with a meaningful comment in the middle of a compound selector', "div/* wtf */.foo", function (t, tree) {
  var nodeTypes = tree.nodes[0].map(function (n) {
    return n.type;
  });
  t.deepEqual(nodeTypes, ["tag", "comment", "class"]);
});
(0, _helpers.test)('with a comment in the middle of a descendant selector', "div/* wtf */ .foo", function (t, tree) {
  var nodeTypes = tree.nodes[0].map(function (n) {
    return n.type;
  });
  t.deepEqual(nodeTypes, ["tag", "comment", "combinator", "class"]);
});