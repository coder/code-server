"use strict";

var _helpers = require("./util/helpers");

(0, _helpers.test)('id selector', '#one', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'one');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
});
(0, _helpers.test)('id selector with universal', '*#z98y ', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '*');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'universal');
  t.deepEqual(tree.nodes[0].nodes[1].value, 'z98y');
  t.deepEqual(tree.nodes[0].nodes[1].type, 'id');
});
(0, _helpers.test)('id hack', '#one#two', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[1].type, 'id');
});
(0, _helpers.test)('id and class names mixed', '#one.two.three', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'one');
  t.deepEqual(tree.nodes[0].nodes[1].value, 'two');
  t.deepEqual(tree.nodes[0].nodes[2].value, 'three');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[1].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[2].type, 'class');
});
(0, _helpers.test)('qualified id', 'button#one', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, 'tag');
  t.deepEqual(tree.nodes[0].nodes[1].type, 'id');
});
(0, _helpers.test)('qualified id & class name', 'h1#one.two', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, 'tag');
  t.deepEqual(tree.nodes[0].nodes[1].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[2].type, 'class');
});
(0, _helpers.test)('extraneous non-combinating whitespace', '  #h1   ,  #h2   ', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'h1');
  t.deepEqual(tree.nodes[0].nodes[0].spaces.before, '  ');
  t.deepEqual(tree.nodes[0].nodes[0].spaces.after, '   ');
  t.deepEqual(tree.nodes[1].nodes[0].value, 'h2');
  t.deepEqual(tree.nodes[1].nodes[0].spaces.before, '  ');
  t.deepEqual(tree.nodes[1].nodes[0].spaces.after, '   ');
});
(0, _helpers.test)('Sass interpolation within a class', '.#{foo}', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes.length, 1);
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].value, '#{foo}');
});
(0, _helpers.test)('Sass interpolation within an id', '#foo#{bar}', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes.length, 1);
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].value, 'foo#{bar}');
});
(0, _helpers.test)('Less interpolation within an id', '#foo@{bar}', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes.length, 1);
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].value, 'foo@{bar}');
});
(0, _helpers.test)('id selector with escaping', '#\\#test', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '#test');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\#test');
});
(0, _helpers.test)('id selector with escaping (2)', '#-a-b-c-', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '-a-b-c-');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
});
(0, _helpers.test)('id selector with escaping (3)', '#u-m\\00002b', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'u-m+');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'u-m\\00002b');
});
(0, _helpers.test)('id selector with escaping (4)', '#♥', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '♥');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
});
(0, _helpers.test)('id selector with escaping (5)', '#©', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '©');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
});
(0, _helpers.test)('id selector with escaping (6)', '#“‘’”', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '“‘’”');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
});
(0, _helpers.test)('id selector with escaping (7)', '#☺☃', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '☺☃');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
});
(0, _helpers.test)('id selector with escaping (8)', '#⌘⌥', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '⌘⌥');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
});
(0, _helpers.test)('id selector with escaping (9)', '#𝄞♪♩♫♬', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '𝄞♪♩♫♬');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
});
(0, _helpers.test)('id selector with escaping (10)', '#💩', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '💩');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
});
(0, _helpers.test)('id selector with escaping (11)', '#\\?', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '?');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\?');
});
(0, _helpers.test)('id selector with escaping (12)', '#\\@', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '@');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\@');
});
(0, _helpers.test)('id selector with escaping (13)', '#\\.', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '.');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\.');
});
(0, _helpers.test)('id selector with escaping (14)', '#\\3A \\)', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, ':)');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\3A \\)');
});
(0, _helpers.test)('id selector with escaping (15)', '#\\3A \\`\\(', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, ':`(');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\3A \\`\\(');
});
(0, _helpers.test)('id selector with escaping (16)', '#\\31 23', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '123');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\31 23');
});
(0, _helpers.test)('id selector with escaping (17)', '#\\31 a2b3c', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '1a2b3c');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\31 a2b3c');
});
(0, _helpers.test)('id selector with escaping (18)', '#\\<p\\>', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '<p>');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\<p\\>');
});
(0, _helpers.test)('id selector with escaping (19)', '#\\<\\>\\<\\<\\<\\>\\>\\<\\>', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '<><<<>><>');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\<\\>\\<\\<\\<\\>\\>\\<\\>');
});
(0, _helpers.test)('id selector with escaping (20)', '#\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\[\\>\\+\\+\\+\\+\\+\\+\\+\\>\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\>\\+\\+\\+\\>\\+\\<\\<\\<\\<\\-\\]\\>\\+\\+\\.\\>\\+\\.\\+\\+\\+\\+\\+\\+\\+\\.\\.\\+\\+\\+\\.\\>\\+\\+\\.\\<\\<\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\.\\>\\.\\+\\+\\+\\.\\-\\-\\-\\-\\-\\-\\.\\-\\-\\-\\-\\-\\-\\-\\-\\.\\>\\+\\.\\>\\.', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\[\\>\\+\\+\\+\\+\\+\\+\\+\\>\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\>\\+\\+\\+\\>\\+\\<\\<\\<\\<\\-\\]\\>\\+\\+\\.\\>\\+\\.\\+\\+\\+\\+\\+\\+\\+\\.\\.\\+\\+\\+\\.\\>\\+\\+\\.\\<\\<\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\.\\>\\.\\+\\+\\+\\.\\-\\-\\-\\-\\-\\-\\.\\-\\-\\-\\-\\-\\-\\-\\-\\.\\>\\+\\.\\>\\.');
});
(0, _helpers.test)('id selector with escaping (21)', '#\\#', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '#');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\#');
});
(0, _helpers.test)('id selector with escaping (22)', '#\\#\\#', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '##');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\#\\#');
});
(0, _helpers.test)('id selector with escaping (23)', '#\\#\\.\\#\\.\\#', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '#.#.#');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\#\\.\\#\\.\\#');
});
(0, _helpers.test)('id selector with escaping (24)', '#\\_', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '_');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\_');
});
(0, _helpers.test)('id selector with escaping (25)', '#\\{\\}', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '{}');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\{\\}');
});
(0, _helpers.test)('id selector with escaping (26)', '#\\.fake\\-class', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '.fake-class');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\.fake\\-class');
});
(0, _helpers.test)('id selector with escaping (27)', '#foo\\.bar', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'foo.bar');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'foo\\.bar');
});
(0, _helpers.test)('id selector with escaping (28)', '#\\3A hover', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, ':hover');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\3A hover');
});
(0, _helpers.test)('id selector with escaping (29)', '#\\3A hover\\3A focus\\3A active', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, ':hover:focus:active');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\3A hover\\3A focus\\3A active');
});
(0, _helpers.test)('id selector with escaping (30)', '#\\[attr\\=value\\]', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '[attr=value]');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\[attr\\=value\\]');
});
(0, _helpers.test)('id selector with escaping (31)', '#f\\/o\\/o', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'f/o/o');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'f\\/o\\/o');
});
(0, _helpers.test)('id selector with escaping (32)', '#f\\\\o\\\\o', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'f\\o\\o');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'f\\\\o\\\\o');
});
(0, _helpers.test)('id selector with escaping (33)', '#f\\*o\\*o', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'f*o*o');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'f\\*o\\*o');
});
(0, _helpers.test)('id selector with escaping (34)', '#f\\!o\\!o', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'f!o!o');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'f\\!o\\!o');
});
(0, _helpers.test)('id selector with escaping (35)', '#f\\\'o\\\'o', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'f\'o\'o');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'f\\\'o\\\'o');
});
(0, _helpers.test)('id selector with escaping (36)', '#f\\~o\\~o', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'f~o~o');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'f\\~o\\~o');
});
(0, _helpers.test)('id selector with escaping (37)', '#f\\+o\\+o', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'f+o+o');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'id');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'f\\+o\\+o');
});