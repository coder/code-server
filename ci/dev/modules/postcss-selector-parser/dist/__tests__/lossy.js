"use strict";

exports.__esModule = true;
exports.testLossy = exports.parse = void 0;

var _ava = _interopRequireDefault(require("ava"));

var _index = _interopRequireDefault(require("../index"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var parse = function parse(input, options, transform) {
  return (0, _index["default"])(transform).processSync(input, options);
};

exports.parse = parse;

var testLossy = function testLossy(t, input, expected) {
  var result = parse(input, {
    lossless: false
  });
  t.deepEqual(result, expected);
};

exports.testLossy = testLossy;
(0, _ava["default"])('combinator, descendant - single', testLossy, '.one .two', '.one .two');
(0, _ava["default"])('combinator, descendant - multiple', testLossy, '.one   .two', '.one .two');
(0, _ava["default"])('combinator, child - space before', testLossy, '.one >.two', '.one>.two');
(0, _ava["default"])('combinator, child - space after', testLossy, '.one> .two', '.one>.two');
(0, _ava["default"])('combinator, sibling - space before', testLossy, '.one ~.two', '.one~.two');
(0, _ava["default"])('combinator, sibling - space after', testLossy, '.one~ .two', '.one~.two');
(0, _ava["default"])('combinator, adj sibling - space before', testLossy, '.one +.two', '.one+.two');
(0, _ava["default"])('combinator, adj sibling - space after', testLossy, '.one+ .two', '.one+.two');
(0, _ava["default"])('classes, extraneous spaces', testLossy, '  .h1   ,  .h2   ', '.h1,.h2');
(0, _ava["default"])('ids, extraneous spaces', testLossy, '  #h1   ,  #h2   ', '#h1,#h2');
(0, _ava["default"])('attribute, spaces in selector', testLossy, 'h1[  href  *=  "test"  ]', 'h1[href*="test"]');
(0, _ava["default"])('attribute, insensitive flag 1', testLossy, '[href="test" i  ]', '[href="test"i]');
(0, _ava["default"])('attribute, insensitive flag 2', testLossy, '[href=TEsT i  ]', '[href=TEsT i]');
(0, _ava["default"])('attribute, insensitive flag 3', testLossy, '[href=test i  ]', '[href=test i]');
(0, _ava["default"])('attribute, extreneous whitespace', testLossy, '  [href]   ,  [class]   ', '[href],[class]');
(0, _ava["default"])('namespace, space before', testLossy, '   postcss|button', 'postcss|button');
(0, _ava["default"])('namespace, space after', testLossy, 'postcss|button     ', 'postcss|button');
(0, _ava["default"])('namespace - all elements, space before', testLossy, '   postcss|*', 'postcss|*');
(0, _ava["default"])('namespace - all elements, space after', testLossy, 'postcss|*     ', 'postcss|*');
(0, _ava["default"])('namespace - all namespaces, space before', testLossy, '   *|button', '*|button');
(0, _ava["default"])('namespace - all namespaces, space after', testLossy, '*|button     ', '*|button');
(0, _ava["default"])('namespace - all elements in all namespaces, space before', testLossy, '   *|*', '*|*');
(0, _ava["default"])('namespace - all elements in all namespaces, space after', testLossy, '*|*     ', '*|*');
(0, _ava["default"])('namespace - all elements without namespace, space before', testLossy, '   |*', '|*');
(0, _ava["default"])('namespace - all elements without namespace, space after', testLossy, '|*     ', '|*');
(0, _ava["default"])('namespace - tag with no namespace, space before', testLossy, '   |button', '|button');
(0, _ava["default"])('namespace - tag with no namespace, space after', testLossy, '|button     ', '|button');
(0, _ava["default"])('namespace - inside attribute, space before', testLossy, ' [  postcss|href=test]', '[postcss|href=test]');
(0, _ava["default"])('namespace - inside attribute, space after', testLossy, '[postcss|href=  test  ] ', '[postcss|href=test]');
(0, _ava["default"])('namespace - inside attribute (2), space before', testLossy, ' [  postcss|href]', '[postcss|href]');
(0, _ava["default"])('namespace - inside attribute (2), space after', testLossy, '[postcss|href ] ', '[postcss|href]');
(0, _ava["default"])('namespace - inside attribute (3), space before', testLossy, ' [  *|href=test]', '[*|href=test]');
(0, _ava["default"])('namespace - inside attribute (3), space after', testLossy, '[*|href=  test  ] ', '[*|href=test]');
(0, _ava["default"])('namespace - inside attribute (4), space after', testLossy, '[|href=  test  ] ', '[|href=test]');
(0, _ava["default"])('tag - extraneous whitespace', testLossy, '  h1   ,  h2   ', 'h1,h2');
(0, _ava["default"])('tag - trailing comma', testLossy, 'h1, ', 'h1,');
(0, _ava["default"])('tag - trailing comma (1)', testLossy, 'h1,', 'h1,');
(0, _ava["default"])('tag - trailing comma (2)', testLossy, 'h1', 'h1');
(0, _ava["default"])('tag - trailing slash (1)', testLossy, 'h1\\    ', 'h1\\ ');
(0, _ava["default"])('tag - trailing slash (2)', testLossy, 'h1\\    h2\\', 'h1\\  h2\\');
(0, _ava["default"])('universal - combinator', testLossy, ' * + * ', '*+*');
(0, _ava["default"])('universal - extraneous whitespace', testLossy, '  *   ,  *   ', '*,*');
(0, _ava["default"])('universal - qualified universal selector', testLossy, '*[href] *:not(*.green)', '*[href] *:not(*.green)');
(0, _ava["default"])('nesting - spacing before', testLossy, '  &.class', '&.class');
(0, _ava["default"])('nesting - spacing after', testLossy, '&.class  ', '&.class');
(0, _ava["default"])('nesting - spacing between', testLossy, '&  .class  ', '& .class');
(0, _ava["default"])('pseudo (single) - spacing before', testLossy, '  :after', ':after');
(0, _ava["default"])('pseudo (single) - spacing after', testLossy, ':after  ', ':after');
(0, _ava["default"])('pseudo (double) - spacing before', testLossy, '  ::after', '::after');
(0, _ava["default"])('pseudo (double) - spacing after', testLossy, '::after  ', '::after');
(0, _ava["default"])('pseudo - multiple', testLossy, ' *:target::before ,   a:after  ', '*:target::before,a:after');
(0, _ava["default"])('pseudo - negated', testLossy, 'h1:not( .heading )', 'h1:not(.heading)');
(0, _ava["default"])('pseudo - negated with combinators (1)', testLossy, 'h1:not(.heading > .title)   >  h1', 'h1:not(.heading>.title)>h1');
(0, _ava["default"])('pseudo - negated with combinators (2)', testLossy, '.foo:nth-child(2n + 1)', '.foo:nth-child(2n+1)');
(0, _ava["default"])('pseudo - extra whitespace', testLossy, 'a:not(   h2   )', 'a:not(h2)');
(0, _ava["default"])('comments - comment inside descendant selector', testLossy, "div /* wtf */.foo", "div /* wtf */.foo");
(0, _ava["default"])('comments - comment inside complex selector', testLossy, "div /* wtf */ > .foo", "div/* wtf */>.foo");
(0, _ava["default"])('comments - comment inside compound selector with space', testLossy, "div    /* wtf */    .foo", "div /* wtf */.foo");
(0, _ava["default"])('@words - space before', testLossy, '  @media', '@media');
(0, _ava["default"])('@words - space after', testLossy, '@media  ', '@media');
(0, _ava["default"])('@words - maintains space between', testLossy, '@media (min-width: 700px) and (orientation: landscape)', '@media (min-width: 700px) and (orientation: landscape)');
(0, _ava["default"])('@words - extraneous space between', testLossy, '@media  (min-width:  700px)  and   (orientation:   landscape)', '@media (min-width: 700px) and (orientation: landscape)');
(0, _ava["default"])('@words - multiple', testLossy, '@media (min-width: 700px), (min-height: 400px)', '@media (min-width: 700px),(min-height: 400px)');