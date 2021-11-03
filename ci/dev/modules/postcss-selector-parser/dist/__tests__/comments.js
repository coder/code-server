"use strict";

var _helpers = require("./util/helpers");

(0, _helpers.test)('comments', '/*test comment*/h2', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '/*test comment*/');
  t.deepEqual(tree.nodes[0].nodes[1].value, 'h2');
});
(0, _helpers.test)('comments (2)', '.a  /*test comment*/label', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[1].type, 'combinator');
  t.deepEqual(tree.nodes[0].nodes[1].value, ' ');
  t.deepEqual(tree.nodes[0].nodes[1].spaces.after, ' ');
  t.deepEqual(tree.nodes[0].nodes[1].rawSpaceAfter, ' /*test comment*/');
  t.deepEqual(tree.nodes[0].nodes[2].type, 'tag');
});
(0, _helpers.test)('comments (3)', '.a  /*test comment*/  label', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[1].type, 'combinator');
  t.deepEqual(tree.nodes[0].nodes[1].value, ' ');
  t.deepEqual(tree.nodes[0].nodes[1].spaces.before, '   ');
  t.deepEqual(tree.nodes[0].nodes[1].rawSpaceBefore, '  /*test comment*/ ');
  t.deepEqual(tree.nodes[0].nodes[2].type, 'tag');
});
(0, _helpers.test)('multiple comments and other things', 'h1/*test*/h2/*test*/.test/*test*/', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, 'tag', 'should have a tag');
  t.deepEqual(tree.nodes[0].nodes[1].type, 'comment', 'should have a comment');
  t.deepEqual(tree.nodes[0].nodes[2].type, 'tag', 'should have a tag');
  t.deepEqual(tree.nodes[0].nodes[3].type, 'comment', 'should have a comment');
  t.deepEqual(tree.nodes[0].nodes[4].type, 'class', 'should have a class name');
  t.deepEqual(tree.nodes[0].nodes[5].type, 'comment', 'should have a comment');
});
(0, _helpers.test)('ending in comment', ".bar /* comment 3 */", function (t, tree) {
  var classname = tree.nodes[0].nodes[0];
  t.deepEqual(classname.type, 'class', 'should have a tag');
  t.deepEqual(classname.spaces.after, ' ');
  t.deepEqual(classname.raws.spaces.after, ' /* comment 3 */');
});
(0, _helpers.test)('comments in selector list', 'h2, /*test*/ h4', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, 'tag');
  t.deepEqual(tree.nodes[0].nodes[0].value, 'h2');
  t.deepEqual(tree.nodes[1].nodes[0].rawSpaceBefore, ' ');
  t.deepEqual(tree.nodes[1].nodes[0].type, 'comment');
  t.deepEqual(tree.nodes[1].nodes[0].value, '/*test*/');
  t.deepEqual(tree.nodes[1].nodes[1].rawSpaceBefore, ' ');
  t.deepEqual(tree.nodes[1].nodes[1].type, 'tag');
  t.deepEqual(tree.nodes[1].nodes[1].value, 'h4');
});
(0, _helpers.test)('comments in selector list (2)', 'h2,/*test*/h4', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, 'tag');
  t.deepEqual(tree.nodes[0].nodes[0].value, 'h2');
  t.deepEqual(tree.nodes[1].nodes[0].rawSpaceBefore, '');
  t.deepEqual(tree.nodes[1].nodes[0].type, 'comment');
  t.deepEqual(tree.nodes[1].nodes[0].value, '/*test*/');
  t.deepEqual(tree.nodes[1].nodes[1].type, 'tag');
  t.deepEqual(tree.nodes[1].nodes[1].value, 'h4');
  t.deepEqual(tree.nodes[1].nodes[1].rawSpaceBefore, '');
});
(0, _helpers.test)('comments in selector list (3)', 'h2/*test*/, h4', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, 'tag');
  t.deepEqual(tree.nodes[0].nodes[0].value, 'h2');
  t.deepEqual(tree.nodes[0].nodes[1].rawSpaceBefore, '');
  t.deepEqual(tree.nodes[0].nodes[1].type, 'comment');
  t.deepEqual(tree.nodes[0].nodes[1].value, '/*test*/');
  t.deepEqual(tree.nodes[1].nodes[0].type, 'tag');
  t.deepEqual(tree.nodes[1].nodes[0].value, 'h4');
  t.deepEqual(tree.nodes[1].nodes[0].rawSpaceBefore, ' ');
});
(0, _helpers.test)('comments in selector list (4)', 'h2, /*test*/ /*test*/ h4', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, 'tag');
  t.deepEqual(tree.nodes[0].nodes[0].value, 'h2');
  t.deepEqual(tree.nodes[1].nodes[0].rawSpaceBefore, ' ');
  t.deepEqual(tree.nodes[1].nodes[0].type, 'comment');
  t.deepEqual(tree.nodes[1].nodes[0].value, '/*test*/');
  t.deepEqual(tree.nodes[1].nodes[1].rawSpaceBefore, ' ');
  t.deepEqual(tree.nodes[1].nodes[1].type, 'comment');
  t.deepEqual(tree.nodes[1].nodes[1].value, '/*test*/');
  t.deepEqual(tree.nodes[1].nodes[2].rawSpaceBefore, ' ');
  t.deepEqual(tree.nodes[1].nodes[2].type, 'tag');
  t.deepEqual(tree.nodes[1].nodes[2].value, 'h4');
});