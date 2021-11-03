// mocha/suite.js for normalize-selector.js

var normalizeSelector;
var assert;

if (typeof require == 'function') {
  // enable to re-use in a browser without require.js
  normalizeSelector = require('../../lib/normalize-selector.js');
  assert = require('assertik');
} else {
  assert = window.assertik;
}

suite('normalizeSelector');

test('should be function', function () {
  assert.equal(typeof normalizeSelector, 'function', 'wrong type');
});

test('should normalize BIG SELECTOR', function () {
  var selector = "*~*>*.foo[   href *=  \"/\"   ]:hover>*[  data-foo =   " +
                 "\"bar\"      ]:focus+*.baz::after";
  var expected = "* ~ * > *.foo[href*=\"/\"]:hover > *[data-foo=\"bar\"]:" +
                 "focus + *.baz::after";
  assert.equal(normalizeSelector(selector), expected);
});

test('should return optimized selector with no change', function () {
  assert.equal(normalizeSelector("#foo .bar"), "#foo .bar");
});

test('should trim whitespace', function () {
  assert.equal(normalizeSelector(" #foo   .bar "), "#foo .bar");
});

test('should separate between combinators', function () {
  assert.equal(normalizeSelector("#foo>.bar+.baz"), "#foo > .bar + .baz");
});

test('should not separate concatenated classes', function () {
  assert.equal(normalizeSelector("#foo.bar.baz"), "#foo.bar.baz");
});

test('should normalize asterisks', function () {
  var selector = " *.class[ data * = 'data' ] ";
  assert.equal(normalizeSelector(selector), "*.class[data*='data']");
});

test('should remove comments', function () {
  assert.equal(normalizeSelector(".e1 /* c2 */ .e2"), ".e1 .e2");
  assert.equal(normalizeSelector(" /*c1*/ .e1/*c2*/.e2 /*c3*/ .e3 /*c4*/ "), ".e1 .e2 .e3");
  assert.equal(normalizeSelector(" /*c1*/ .e1/*c2*/.e2 /*c3*/ .e3 "), ".e1 .e2 .e3");
  assert.equal(normalizeSelector("/*c1*/.e1/*c2*/.e2 /*c3*/ .e3"), ".e1 .e2 .e3");
  assert.equal(normalizeSelector(".e1/*c2*/.e2 /*c3*/ .e3"), ".e1 .e2 .e3");
});

test('should replace comments with single whitespace', function () {
  assert.equal(normalizeSelector("tag/* c2 */tag"), "tag tag");
});

test('should normalize parentheses', function() {
  var selector = "((a ) (b(c ) ) d )>*[ data-foo = \"bar\" ]";
  var expected = "((a)(b(c))d) > *[data-foo=\"bar\"]";
  assert.equal(normalizeSelector(selector), expected);
});

test('should normalize @-rule parentheses', function () {
  var selector = "@media  screen  and  ( color ),  projection  and  (color )";
  var expected = "@media screen and (color), projection and (color)";
  assert.equal(normalizeSelector(selector), expected);
});

test('should normalize @-rules with compound parentheses', function () {
  var selector = "@media  handheld  and  ( min-width : 20em ),   screen  " +
                 "and  ( min-width: 20em )";
  var expected = "@media handheld and (min-width:20em), screen and " +
                 "(min-width:20em)";
  assert.equal(normalizeSelector(selector), expected);
});

test('should normalize @-rules with operations', function () {
  var selector = "@media  screen  and  ( device-aspect-ratio : 2560 / 1440 )";
  var expected = "@media screen and (device-aspect-ratio:2560/1440)";
  assert.equal(normalizeSelector(selector), expected);
});

test('should normalize descriptors', function () {
  var selector = "@counter-style    triangle";
  assert.equal(normalizeSelector(selector), "@counter-style triangle");
});

test('should normalize case-insensitivity attribute selector', function () {
  assert.equal(normalizeSelector("[ att ~= val  i ]"), "[att~=val i]");
  assert.equal(normalizeSelector("#foo[  a  =  \"b\"  i  ]"), "#foo[a=\"b\" i]");
});

test('should normalize namespaced attribute selector', function () {
  var selector = ' unit[ sh | quantity = "200" ] ';
  var expected = 'unit[sh|quantity="200"]';
  assert.equal(normalizeSelector(selector), expected);
});

test('should normalize pseudo-classes', function () {
  var selector = "   :nth-last-of-type( )   ";
  assert.equal(normalizeSelector(selector), ":nth-last-of-type()");
});

test('should normalize pseudo-elements', function () {
  var selector = "   ::nth-fragment(   )   ";
  assert.equal(normalizeSelector(selector), "::nth-fragment()");
});

test('should normalize backslashes', function () {
  var selector = "#foo[ a = \" b \\\" c\\\\\" ]";
  var expected = "#foo[a=\" b \\\" c\\\\\"]";
  assert.equal(normalizeSelector(selector), expected);
});
