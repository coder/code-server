"use strict";

var _helpers = require("./util/helpers");

(0, _helpers.test)('class name', '.one', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'one');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
});
(0, _helpers.test)('multiple class names', '.one.two.three', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'one');
  t.deepEqual(tree.nodes[0].nodes[1].value, 'two');
  t.deepEqual(tree.nodes[0].nodes[2].value, 'three');
});
(0, _helpers.test)('qualified class', 'button.btn-primary', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, 'tag');
  t.deepEqual(tree.nodes[0].nodes[1].type, 'class');
});
(0, _helpers.test)('escaped numbers in class name', '.\\31\\ 0', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].value, '1 0');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\31\\ 0');
});
(0, _helpers.test)('extraneous non-combinating whitespace', '  .h1   ,  .h2   ', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'h1');
  t.deepEqual(tree.nodes[0].nodes[0].spaces.before, '  ');
  t.deepEqual(tree.nodes[0].nodes[0].spaces.after, '   ');
  t.deepEqual(tree.nodes[1].nodes[0].value, 'h2');
  t.deepEqual(tree.nodes[1].nodes[0].spaces.before, '  ');
  t.deepEqual(tree.nodes[1].nodes[0].spaces.after, '   ');
});
(0, _helpers.test)('Less interpolation within a class', '.foo@{bar}', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes.length, 1);
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].value, 'foo@{bar}');
});
(0, _helpers.test)('ClassName#set value', ".fo\\o", function (t, selectors) {
  var className = selectors.first.first;
  t.deepEqual(className.raws, {
    value: "fo\\o"
  });
  className.value = "bar";
  t.deepEqual(className.raws, {});
});
(0, _helpers.test)('escaped dot in class name', '.foo\\.bar', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].value, 'foo.bar');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'foo\\.bar');
});
(0, _helpers.test)('class selector with escaping', '.♥', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '♥');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
});
(0, _helpers.test)('class selector with escaping (1)', '.©', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '©');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
});
(0, _helpers.test)('class selector with escaping (2)', '.“‘’”', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '“‘’”');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
});
(0, _helpers.test)('class selector with escaping (3)', '.☺☃', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '☺☃');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
});
(0, _helpers.test)('class selector with escaping (4)', '.⌘⌥', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '⌘⌥');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
});
(0, _helpers.test)('class selector with escaping (5)', '.𝄞♪♩♫♬', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '𝄞♪♩♫♬');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
});
(0, _helpers.test)('class selector with escaping (6)', '.💩', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '💩');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
});
(0, _helpers.test)('class selector with escaping (7)', '.\\?', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '?');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\?');
});
(0, _helpers.test)('class selector with escaping (8)', '.\\@', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '@');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\@');
});
(0, _helpers.test)('class selector with escaping (9)', '.\\.', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '.');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\.');
});
(0, _helpers.test)('class selector with escaping (10)', '.\\3A \\)', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, ':)');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\3A \\)');
});
(0, _helpers.test)('class selector with escaping (11)', '.\\3A \\`\\(', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, ':`(');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\3A \\`\\(');
});
(0, _helpers.test)('class selector with escaping (12)', '.\\31 23', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '123');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\31 23');
});
(0, _helpers.test)('class selector with escaping (13)', '.\\31 a2b3c', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '1a2b3c');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\31 a2b3c');
});
(0, _helpers.test)('class selector with escaping (14)', '.\\<p\\>', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '<p>');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\<p\\>');
});
(0, _helpers.test)('class selector with escaping (15)', '.\\<\\>\\<\\<\\<\\>\\>\\<\\>', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '<><<<>><>');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\<\\>\\<\\<\\<\\>\\>\\<\\>');
});
(0, _helpers.test)('class selector with escaping (16)', '.\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\[\\>\\+\\+\\+\\+\\+\\+\\+\\>\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\>\\+\\+\\+\\>\\+\\<\\<\\<\\<\\-\\]\\>\\+\\+\\.\\>\\+\\.\\+\\+\\+\\+\\+\\+\\+\\.\\.\\+\\+\\+\\.\\>\\+\\+\\.\\<\\<\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\.\\>\\.\\+\\+\\+\\.\\-\\-\\-\\-\\-\\-\\.\\-\\-\\-\\-\\-\\-\\-\\-\\.\\>\\+\\.\\>\\.', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\[\\>\\+\\+\\+\\+\\+\\+\\+\\>\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\>\\+\\+\\+\\>\\+\\<\\<\\<\\<\\-\\]\\>\\+\\+\\.\\>\\+\\.\\+\\+\\+\\+\\+\\+\\+\\.\\.\\+\\+\\+\\.\\>\\+\\+\\.\\<\\<\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\.\\>\\.\\+\\+\\+\\.\\-\\-\\-\\-\\-\\-\\.\\-\\-\\-\\-\\-\\-\\-\\-\\.\\>\\+\\.\\>\\.');
});
(0, _helpers.test)('class selector with escaping (17)', '.\\#', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '#');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\#');
});
(0, _helpers.test)('class selector with escaping (18)', '.\\#\\#', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '##');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\#\\#');
});
(0, _helpers.test)('class selector with escaping (19)', '.\\#\\.\\#\\.\\#', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '#.#.#');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\#\\.\\#\\.\\#');
});
(0, _helpers.test)('class selector with escaping (20)', '.\\_', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '_');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\_');
});
(0, _helpers.test)('class selector with escaping (21)', '.\\{\\}', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '{}');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\{\\}');
});
(0, _helpers.test)('class selector with escaping (22)', '.\\#fake\\-id', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '#fake-id');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\#fake\\-id');
});
(0, _helpers.test)('class selector with escaping (23)', '.foo\\.bar', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'foo.bar');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'foo\\.bar');
});
(0, _helpers.test)('class selector with escaping (24)', '.\\3A hover', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, ':hover');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\3A hover');
});
(0, _helpers.test)('class selector with escaping (25)', '.\\3A hover\\3A focus\\3A active', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, ':hover:focus:active');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\3A hover\\3A focus\\3A active');
});
(0, _helpers.test)('class selector with escaping (26)', '.\\[attr\\=value\\]', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '[attr=value]');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\[attr\\=value\\]');
});
(0, _helpers.test)('class selector with escaping (27)', '.f\\/o\\/o', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'f/o/o');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'f\\/o\\/o');
});
(0, _helpers.test)('class selector with escaping (28)', '.f\\\\o\\\\o', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'f\\o\\o');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'f\\\\o\\\\o');
});
(0, _helpers.test)('class selector with escaping (29)', '.f\\*o\\*o', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'f*o*o');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'f\\*o\\*o');
});
(0, _helpers.test)('class selector with escaping (30)', '.f\\!o\\!o', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'f!o!o');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'f\\!o\\!o');
});
(0, _helpers.test)('class selector with escaping (31)', '.f\\\'o\\\'o', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'f\'o\'o');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'f\\\'o\\\'o');
});
(0, _helpers.test)('class selector with escaping (32)', '.f\\~o\\~o', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'f~o~o');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'f\\~o\\~o');
});
(0, _helpers.test)('class selector with escaping (33)', '.f\\+o\\+o', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'f+o+o');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'f\\+o\\+o');
});
(0, _helpers.test)('class selector with escaping (34)', '.\\1D306', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, '𝌆');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, '\\1D306');
});
(0, _helpers.test)('class selector with escaping (35)', '.not-pseudo\\:focus', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'not-pseudo:focus');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'not-pseudo\\:focus');
});
(0, _helpers.test)('class selector with escaping (36)', '.not-pseudo\\:\\:focus', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].value, 'not-pseudo::focus');
  t.deepEqual(tree.nodes[0].nodes[0].type, 'class');
  t.deepEqual(tree.nodes[0].nodes[0].raws.value, 'not-pseudo\\:\\:focus');
});