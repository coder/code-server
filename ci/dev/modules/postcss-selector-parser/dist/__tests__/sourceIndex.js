"use strict";

var _helpers = require("./util/helpers");

(0, _helpers.test)('universal selector', '*', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].source.start.column, 1);
  t.deepEqual(tree.nodes[0].nodes[0].source.end.column, 1);
  t.deepEqual(tree.nodes[0].nodes[0].sourceIndex, 0);
});
(0, _helpers.test)('lobotomized owl selector', ' * + * ', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].source.start.column, 2);
  t.deepEqual(tree.nodes[0].nodes[0].source.end.column, 2);
  t.deepEqual(tree.nodes[0].nodes[0].sourceIndex, 1);
  t.deepEqual(tree.nodes[0].nodes[1].source.start.column, 4);
  t.deepEqual(tree.nodes[0].nodes[1].source.end.column, 4);
  t.deepEqual(tree.nodes[0].nodes[1].sourceIndex, 3);
  t.deepEqual(tree.nodes[0].nodes[2].source.start.column, 6);
  t.deepEqual(tree.nodes[0].nodes[2].source.end.column, 6);
  t.deepEqual(tree.nodes[0].nodes[2].sourceIndex, 5);
});
(0, _helpers.test)('comment', '/**\n * Hello!\n */', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].source.start.column, 1);
  t.deepEqual(tree.nodes[0].nodes[0].source.end.column, 3);
  t.deepEqual(tree.nodes[0].nodes[0].sourceIndex, 0);
});
(0, _helpers.test)('comment & universal selectors', '*/*test*/*', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].source.start.column, 1);
  t.deepEqual(tree.nodes[0].nodes[0].source.end.column, 1);
  t.deepEqual(tree.nodes[0].nodes[0].sourceIndex, 0);
  t.deepEqual(tree.nodes[0].nodes[1].source.start.column, 2);
  t.deepEqual(tree.nodes[0].nodes[1].source.end.column, 9);
  t.deepEqual(tree.nodes[0].nodes[1].sourceIndex, 1);
  t.deepEqual(tree.nodes[0].nodes[2].source.start.column, 10);
  t.deepEqual(tree.nodes[0].nodes[2].source.end.column, 10);
  t.deepEqual(tree.nodes[0].nodes[2].sourceIndex, 9);
});
(0, _helpers.test)('tag selector', 'h1', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].source.start.column, 1);
  t.deepEqual(tree.nodes[0].nodes[0].source.end.column, 2);
  t.deepEqual(tree.nodes[0].nodes[0].sourceIndex, 0);
});
(0, _helpers.test)('id selector', '#id', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].source.start.column, 1);
  t.deepEqual(tree.nodes[0].nodes[0].source.end.column, 3);
  t.deepEqual(tree.nodes[0].nodes[0].sourceIndex, 0);
});
(0, _helpers.test)('tag selector followed by id selector', 'h1, #id', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].source.start.column, 1);
  t.deepEqual(tree.nodes[0].nodes[0].source.end.column, 2);
  t.deepEqual(tree.nodes[0].nodes[0].sourceIndex, 0);
  t.deepEqual(tree.nodes[1].nodes[0].source.start.column, 5);
  t.deepEqual(tree.nodes[1].nodes[0].source.end.column, 7);
  t.deepEqual(tree.nodes[1].nodes[0].sourceIndex, 4);
});
(0, _helpers.test)('multiple id selectors', '#one#two', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].source.start.column, 1);
  t.deepEqual(tree.nodes[0].nodes[0].source.end.column, 4);
  t.deepEqual(tree.nodes[0].nodes[0].sourceIndex, 0);
  t.deepEqual(tree.nodes[0].nodes[1].source.start.column, 5);
  t.deepEqual(tree.nodes[0].nodes[1].source.end.column, 8);
  t.deepEqual(tree.nodes[0].nodes[1].sourceIndex, 4);
});
(0, _helpers.test)('multiple id selectors (2)', '#one#two#three#four', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[2].source.start.column, 9);
  t.deepEqual(tree.nodes[0].nodes[2].source.end.column, 14);
  t.deepEqual(tree.nodes[0].nodes[2].sourceIndex, 8);
  t.deepEqual(tree.nodes[0].nodes[3].source.start.column, 15);
  t.deepEqual(tree.nodes[0].nodes[3].source.end.column, 19);
  t.deepEqual(tree.nodes[0].nodes[3].sourceIndex, 14);
});
(0, _helpers.test)('multiple id selectors (3)', '#one#two,#three#four', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[1].source.start.column, 5);
  t.deepEqual(tree.nodes[0].nodes[1].source.end.column, 8);
  t.deepEqual(tree.nodes[0].nodes[1].sourceIndex, 4);
  t.deepEqual(tree.nodes[1].nodes[1].source.start.column, 16);
  t.deepEqual(tree.nodes[1].nodes[1].source.end.column, 20);
  t.deepEqual(tree.nodes[1].nodes[1].sourceIndex, 15);
});
(0, _helpers.test)('multiple class selectors', '.one.two,.three.four', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[1].source.start.column, 5);
  t.deepEqual(tree.nodes[0].nodes[1].source.end.column, 8);
  t.deepEqual(tree.nodes[0].nodes[1].sourceIndex, 4);
  t.deepEqual(tree.nodes[1].nodes[1].source.start.column, 16);
  t.deepEqual(tree.nodes[1].nodes[1].source.end.column, 20);
  t.deepEqual(tree.nodes[1].nodes[1].sourceIndex, 15);
});
(0, _helpers.test)('attribute selector', '[name="james"]', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].source.start.line, 1);
  t.deepEqual(tree.nodes[0].nodes[0].source.start.column, 1);
  t.deepEqual(tree.nodes[0].nodes[0].source.end.column, 14);
  t.deepEqual(tree.nodes[0].nodes[0].sourceIndex, 0);
});
(0, _helpers.test)('multiple attribute selectors', '[name="james"][name="ed"],[name="snakeman"][name="a"]', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].source.start.line, 1);
  t.deepEqual(tree.nodes[0].nodes[0].source.start.column, 1);
  t.deepEqual(tree.nodes[0].nodes[0].source.end.line, 1);
  t.deepEqual(tree.nodes[0].nodes[0].source.end.column, 14);
  t.deepEqual(tree.nodes[0].nodes[0].sourceIndex, 0);
  t.deepEqual(tree.nodes[0].nodes[1].source.start.line, 1);
  t.deepEqual(tree.nodes[0].nodes[1].source.start.column, 15);
  t.deepEqual(tree.nodes[0].nodes[1].source.end.line, 1);
  t.deepEqual(tree.nodes[0].nodes[1].source.end.column, 25);
  t.deepEqual(tree.nodes[0].nodes[1].sourceIndex, 14);
  t.deepEqual(tree.nodes[1].nodes[0].source.start.line, 1);
  t.deepEqual(tree.nodes[1].nodes[0].source.start.column, 27);
  t.deepEqual(tree.nodes[1].nodes[0].source.end.line, 1);
  t.deepEqual(tree.nodes[1].nodes[0].source.end.column, 43);
  t.deepEqual(tree.nodes[1].nodes[0].sourceIndex, 26);
  t.deepEqual(tree.nodes[1].nodes[1].source.start.line, 1);
  t.deepEqual(tree.nodes[1].nodes[1].source.start.column, 44);
  t.deepEqual(tree.nodes[1].nodes[1].source.end.line, 1);
  t.deepEqual(tree.nodes[1].nodes[1].source.end.column, 53);
  t.deepEqual(tree.nodes[1].nodes[1].sourceIndex, 43);
});
(0, _helpers.test)('pseudo-class', 'h1:first-child', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[1].source.start.line, 1);
  t.deepEqual(tree.nodes[0].nodes[1].source.start.column, 3);
  t.deepEqual(tree.nodes[0].nodes[1].source.end.column, 14);
  t.deepEqual(tree.nodes[0].nodes[1].sourceIndex, 2);
});
(0, _helpers.test)('pseudo-class with argument', 'h1:not(.strudel, .food)', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[1].source.start.line, 1);
  t.deepEqual(tree.nodes[0].nodes[1].source.start.column, 3);
  t.deepEqual(tree.nodes[0].nodes[1].source.end.column, 23);
  t.deepEqual(tree.nodes[0].nodes[1].sourceIndex, 2);
});
(0, _helpers.test)('pseudo-element', 'h1::before', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[1].source.start.line, 1);
  t.deepEqual(tree.nodes[0].nodes[1].source.start.column, 3);
  t.deepEqual(tree.nodes[0].nodes[1].source.end.column, 10);
  t.deepEqual(tree.nodes[0].nodes[1].sourceIndex, 2);
});
(0, _helpers.test)('multiple pseudos', 'h1:not(.food)::before, a:first-child', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[1].source.start.line, 1);
  t.deepEqual(tree.nodes[0].nodes[1].source.start.column, 3);
  t.deepEqual(tree.nodes[0].nodes[1].source.end.column, 13);
  t.deepEqual(tree.nodes[0].nodes[1].sourceIndex, 2);
  t.deepEqual(tree.nodes[0].nodes[2].source.start.line, 1);
  t.deepEqual(tree.nodes[0].nodes[2].source.start.column, 14);
  t.deepEqual(tree.nodes[0].nodes[2].source.end.column, 21);
  t.deepEqual(tree.nodes[0].nodes[2].sourceIndex, 13);
  t.deepEqual(tree.nodes[1].nodes[1].source.start.line, 1);
  t.deepEqual(tree.nodes[1].nodes[1].source.start.column, 25);
  t.deepEqual(tree.nodes[1].nodes[1].source.end.column, 36);
  t.deepEqual(tree.nodes[1].nodes[1].sourceIndex, 24);
});
(0, _helpers.test)('combinators', 'div > h1 span', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[1].source.start.line, 1, "> start line");
  t.deepEqual(tree.nodes[0].nodes[1].source.start.column, 5, "> start column");
  t.deepEqual(tree.nodes[0].nodes[1].source.end.column, 5, "> end column");
  t.deepEqual(tree.nodes[0].nodes[1].sourceIndex, 4, "> sourceIndex");
  t.deepEqual(tree.nodes[0].nodes[3].source.start.line, 1, "' ' start line");
  t.deepEqual(tree.nodes[0].nodes[3].source.start.column, 9, "' ' start column");
  t.deepEqual(tree.nodes[0].nodes[3].source.end.column, 9, "' ' end column");
  t.deepEqual(tree.nodes[0].nodes[3].sourceIndex, 8, "' ' sourceIndex");
});
(0, _helpers.test)('combinators surrounded by superfluous spaces', 'div   >  h1 ~   span   a', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[1].source.start.line, 1, "> start line");
  t.deepEqual(tree.nodes[0].nodes[1].source.start.column, 7, "> start column");
  t.deepEqual(tree.nodes[0].nodes[1].source.end.column, 7, "> end column");
  t.deepEqual(tree.nodes[0].nodes[1].sourceIndex, 6, "> sourceIndex");
  t.deepEqual(tree.nodes[0].nodes[3].source.start.line, 1, "~ start line");
  t.deepEqual(tree.nodes[0].nodes[3].source.start.column, 13, "~ start column");
  t.deepEqual(tree.nodes[0].nodes[3].source.end.column, 13, "~ end column");
  t.deepEqual(tree.nodes[0].nodes[3].sourceIndex, 12, "~ sourceIndex");
  t.deepEqual(tree.nodes[0].nodes[5].source.start.line, 1, "' ' start line");
  t.deepEqual(tree.nodes[0].nodes[5].source.start.column, 21, "' ' start column");
  t.deepEqual(tree.nodes[0].nodes[5].source.end.column, 23, "' ' end column");
  t.deepEqual(tree.nodes[0].nodes[5].sourceIndex, 20, "' ' sourceIndex");
});
(0, _helpers.test)('multiple id selectors on different lines', '#one,\n#two', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].source.start.line, 1);
  t.deepEqual(tree.nodes[0].nodes[0].source.start.column, 1);
  t.deepEqual(tree.nodes[0].nodes[0].source.end.column, 4);
  t.deepEqual(tree.nodes[0].nodes[0].sourceIndex, 0);
  t.deepEqual(tree.nodes[1].nodes[0].source.start.line, 2);
  t.deepEqual(tree.nodes[1].nodes[0].source.start.column, 1);
  t.deepEqual(tree.nodes[1].nodes[0].source.end.column, 4);
  t.deepEqual(tree.nodes[1].nodes[0].sourceIndex, 6);
});
(0, _helpers.test)('multiple id selectors on different CRLF lines', '#one,\r\n#two,\r\n#three', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].source.start.line, 1, '#one start line');
  t.deepEqual(tree.nodes[0].nodes[0].source.start.column, 1, '#one start column');
  t.deepEqual(tree.nodes[0].nodes[0].source.end.column, 4, '#one end column');
  t.deepEqual(tree.nodes[0].nodes[0].sourceIndex, 0, '#one sourceIndex');
  t.deepEqual(tree.nodes[1].nodes[0].source.start.line, 2, '#two start line');
  t.deepEqual(tree.nodes[1].nodes[0].source.start.column, 1, '#two start column');
  t.deepEqual(tree.nodes[1].nodes[0].source.end.column, 4, '#two end column');
  t.deepEqual(tree.nodes[1].nodes[0].sourceIndex, 7, '#two sourceIndex');
  t.deepEqual(tree.nodes[2].nodes[0].source.start.line, 3, '#three start line');
  t.deepEqual(tree.nodes[2].nodes[0].source.start.column, 1, '#three start column');
  t.deepEqual(tree.nodes[2].nodes[0].source.end.column, 6, '#three end column');
  t.deepEqual(tree.nodes[2].nodes[0].sourceIndex, 14, '#three sourceIndex');
});
(0, _helpers.test)('id, tag, pseudo, and class selectors on different lines with indentation', '\t#one,\n\th1:after,\n\t\t.two', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[0].source.start.line, 1, '#one start line');
  t.deepEqual(tree.nodes[0].nodes[0].source.start.column, 2, '#one start column');
  t.deepEqual(tree.nodes[0].nodes[0].source.end.column, 5, '#one end column');
  t.deepEqual(tree.nodes[0].nodes[0].sourceIndex, 1, '#one sourceIndex');
  t.deepEqual(tree.nodes[1].nodes[0].source.start.line, 2, 'h1 start line');
  t.deepEqual(tree.nodes[1].nodes[0].source.start.column, 2, 'h1 start column');
  t.deepEqual(tree.nodes[1].nodes[0].source.end.column, 3, 'h1 end column');
  t.deepEqual(tree.nodes[1].nodes[0].sourceIndex, 8, 'h1 sourceIndex');
  t.deepEqual(tree.nodes[1].nodes[1].source.start.line, 2, ':after start line');
  t.deepEqual(tree.nodes[1].nodes[1].source.start.column, 4, ':after start column');
  t.deepEqual(tree.nodes[1].nodes[1].source.end.column, 9, ':after end column');
  t.deepEqual(tree.nodes[1].nodes[1].sourceIndex, 10, ':after sourceIndex');
  t.deepEqual(tree.nodes[2].nodes[0].source.start.line, 3, '.two start line');
  t.deepEqual(tree.nodes[2].nodes[0].source.start.column, 3, '.two start column');
  t.deepEqual(tree.nodes[2].nodes[0].source.end.column, 6, '.two end column');
  t.deepEqual(tree.nodes[2].nodes[0].sourceIndex, 20, '.two sourceIndex');
});
(0, _helpers.test)('pseudo with arguments spanning multiple lines', 'h1:not(\n\t.one,\n\t.two\n)', function (t, tree) {
  t.deepEqual(tree.nodes[0].nodes[1].source.start.line, 1, ':not start line');
  t.deepEqual(tree.nodes[0].nodes[1].source.start.column, 3, ':not start column');
  t.deepEqual(tree.nodes[0].nodes[1].source.end.line, 4, ':not end line');
  t.deepEqual(tree.nodes[0].nodes[1].source.end.column, 1, ':not end column');
  t.deepEqual(tree.nodes[0].nodes[1].sourceIndex, 2, ':not sourceIndex');
  t.deepEqual(tree.nodes[0].nodes[1].nodes[0].nodes[0].source.start.line, 2, '.one start line');
  t.deepEqual(tree.nodes[0].nodes[1].nodes[0].nodes[0].source.start.column, 2, '.one start column');
  t.deepEqual(tree.nodes[0].nodes[1].nodes[0].nodes[0].source.end.line, 2, '.one end line');
  t.deepEqual(tree.nodes[0].nodes[1].nodes[0].nodes[0].source.end.column, 5, '.one end column');
  t.deepEqual(tree.nodes[0].nodes[1].nodes[0].nodes[0].sourceIndex, 9, '.one sourceIndex');
  t.deepEqual(tree.nodes[0].nodes[1].nodes[1].nodes[0].source.start.line, 3, '.two start line');
  t.deepEqual(tree.nodes[0].nodes[1].nodes[1].nodes[0].source.start.column, 2, '.two start column');
  t.deepEqual(tree.nodes[0].nodes[1].nodes[1].nodes[0].source.end.line, 3, '.two end line');
  t.deepEqual(tree.nodes[0].nodes[1].nodes[1].nodes[0].source.end.column, 5, '.two end column');
  t.deepEqual(tree.nodes[0].nodes[1].nodes[1].nodes[0].sourceIndex, 16, '.two sourceIndex');
});