"use strict";

var _helpers = require("./util/helpers");

(0, _helpers.test)('universal selector', '*', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '*');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'universal');
});
(0, _helpers.test)('lobotomized owl', '* + *', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, 'universal');
  t.deepEqual(tree.nodes[0].nodes[1].type, 'combinator');
  t.deepEqual(tree.nodes[0].nodes[2].type, 'universal');
});
(0, _helpers.test)('universal selector with descendant combinator', '* *', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, 'universal');
  t.deepEqual(tree.nodes[0].nodes[1].type, 'combinator');
  t.deepEqual(tree.nodes[0].nodes[2].type, 'universal');
});
(0, _helpers.test)('universal selector with descendant combinator and extraneous non-combinating whitespace', '*         *', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, 'universal');
  t.deepEqual(tree.nodes[0].nodes[1].type, 'combinator');
  t.deepEqual(tree.nodes[0].nodes[2].type, 'universal');
});
(0, _helpers.test)('extraneous non-combinating whitespace', '  *   ,  *   ', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '*');
  t.deepEqual(tree.nodes[0].nodes[0].spaces.before, '  ');
  t.deepEqual(tree.nodes[0].nodes[0].spaces.after, '   ');
  t.deepEqual(tree.nodes[1].nodes[0].value, '*');
  t.deepEqual(tree.nodes[1].nodes[0].spaces.before, '  ');
  t.deepEqual(tree.nodes[1].nodes[0].spaces.after, '   ');
});
(0, _helpers.test)('qualified universal selector', '*[href] *:not(*.green)', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '*');
  t.deepEqual(tree.nodes[0].nodes[3].value, '*');
  t.deepEqual(tree.nodes[0].nodes[4].nodes[0].nodes[0].value, '*');
});
(0, _helpers.test)('universal selector with pseudo', '*::--webkit-media-controls-play-button', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '*');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'universal');
  t.deepEqual(tree.nodes[0].nodes[1].value, '::--webkit-media-controls-play-button');
  t.deepEqual(tree.nodes[0].nodes[1].type, 'pseudo');
});