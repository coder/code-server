"use strict";

var _ava = _interopRequireDefault(require("ava"));

var _ = _interopRequireDefault(require(".."));

var _helpers = require("./util/helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

(0, _ava["default"])('container#append', function (t) {
  var out = (0, _helpers.parse)('h1', function (selectors) {
    var selector = selectors.first;
    var clone = selector.first.clone({
      value: 'h2'
    });
    selectors.append(clone);
  });
  t.deepEqual(out, 'h1,h2');
});
(0, _ava["default"])('container#prepend', function (t) {
  var out = (0, _helpers.parse)('h2', function (selectors) {
    var selector = selectors.first;
    var clone = selector.first.clone({
      value: 'h1'
    });
    selectors.prepend(clone);
  });
  t.deepEqual(out, 'h1,h2');
});
(0, _ava["default"])('container#each', function (t) {
  var str = '';
  (0, _helpers.parse)('h1, h2:not(h3, h4)', function (selectors) {
    selectors.each(function (selector) {
      if (selector.first.type === 'tag') {
        str += selector.first.value;
      }
    });
  });
  t.deepEqual(str, 'h1h2');
});
(0, _ava["default"])('container#each (safe iteration)', function (t) {
  var out = (0, _helpers.parse)('.x, .y', function (selectors) {
    selectors.each(function (selector) {
      selector.parent.insertBefore(selector, _["default"].className({
        value: 'b'
      }));
      selector.parent.insertAfter(selector, _["default"].className({
        value: 'a'
      }));
    });
  });
  t.deepEqual(out, '.b,.x,.a,.b, .y,.a');
});
(0, _ava["default"])('container#each (early exit)', function (t) {
  var str = '';
  (0, _helpers.parse)('h1, h2, h3, h4', function (selectors) {
    var eachReturn = selectors.each(function (selector) {
      var tag = selector.first.value;
      str += tag;
      return tag !== 'h2';
    });
    t["false"](eachReturn);
  });
  t.deepEqual(str, 'h1h2');
});
(0, _ava["default"])('container#walk', function (t) {
  var str = '';
  (0, _helpers.parse)('h1, h2:not(h3, h4)', function (selectors) {
    selectors.walk(function (selector) {
      if (selector.type === 'tag') {
        str += selector.value;
      }
    });
  });
  t.deepEqual(str, 'h1h2h3h4');
});
(0, _ava["default"])('container#walk (safe iteration)', function (t) {
  var out = (0, _helpers.parse)('[class] + *[href] *:not(*.green)', function (selectors) {
    selectors.walkUniversals(function (selector) {
      var next = selector.next();

      if (next && next.type !== 'combinator') {
        selector.remove();
      }
    });
  });
  t.deepEqual(out, '[class] + [href] :not(.green)');
});
(0, _ava["default"])('container#walk (early exit)', function (t) {
  var str = '';
  (0, _helpers.parse)('h1, h2:not(h3, h4)', function (selectors) {
    var walkReturn = selectors.walk(function (selector) {
      if (selector.type === 'tag') {
        var tag = selector.value;
        str += tag;
        return tag !== 'h3';
      }
    });
    t["false"](walkReturn);
  });
  t.deepEqual(str, 'h1h2h3');
});
(0, _ava["default"])('container#walkAttribute', function (t) {
  var out = (0, _helpers.parse)('[href][class].class', function (selectors) {
    selectors.walkAttributes(function (attr) {
      if (attr.attribute === 'class') {
        attr.remove();
      }
    });
  });
  t.deepEqual(out, '[href].class');
});
(0, _ava["default"])('container#walkClass', function (t) {
  var out = (0, _helpers.parse)('.one, .two, .three:not(.four, .five)', function (selectors) {
    selectors.walkClasses(function (className) {
      className.value = className.value.slice(0, 1);
    });
  });
  t.deepEqual(out, '.o, .t, .t:not(.f, .f)');
});
(0, _ava["default"])('container#walkCombinator', function (t) {
  var out = (0, _helpers.parse)('h1 h2 h3 h4', function (selectors) {
    selectors.walkCombinators(function (comment) {
      comment.remove();
    });
  });
  t.deepEqual(out, 'h1h2h3h4');
});
(0, _ava["default"])('container#walkComment', function (t) {
  var out = (0, _helpers.parse)('.one/*test*/.two', function (selectors) {
    selectors.walkComments(function (comment) {
      comment.remove();
    });
  });
  t.deepEqual(out, '.one.two');
});
(0, _ava["default"])('container#walkId', function (t) {
  var out = (0, _helpers.parse)('h1#one, h2#two', function (selectors) {
    selectors.walkIds(function (id) {
      id.value = id.value.slice(0, 1);
    });
  });
  t.deepEqual(out, 'h1#o, h2#t');
});
(0, _ava["default"])('container#walkNesting', function (t) {
  var out = (0, _helpers.parse)('& h1', function (selectors) {
    selectors.walkNesting(function (node) {
      node.replaceWith(_["default"].tag({
        value: 'body'
      }));
    });
  });
  t.deepEqual(out, 'body h1');
});
(0, _ava["default"])('container#walkPseudo', function (t) {
  var out = (0, _helpers.parse)('a:before, a:after', function (selectors) {
    selectors.walkPseudos(function (pseudo) {
      pseudo.value = pseudo.value.slice(0, 2);
    });
  });
  t.deepEqual(out, 'a:b, a:a');
});
(0, _ava["default"])('container#walkTag', function (t) {
  var out = (0, _helpers.parse)('1 2 3', function (selectors) {
    selectors.walkTags(function (tag) {
      tag.value = 'h' + tag.value;
    });
  });
  t.deepEqual(out, 'h1 h2 h3');
});
(0, _ava["default"])('container#walkUniversal', function (t) {
  var out = (0, _helpers.parse)('*.class,*.class,*.class', function (selectors) {
    selectors.walkUniversals(function (universal) {
      universal.remove();
    });
  });
  t.deepEqual(out, '.class,.class,.class');
});
(0, _ava["default"])('container#map', function (t) {
  (0, _helpers.parse)('1 2 3', function (selectors) {
    var arr = selectors.first.map(function (selector) {
      if (/[0-9]/.test(selector.value)) {
        return 'h' + selector.value;
      }

      return selector.value;
    });
    t.deepEqual(arr, ['h1', ' ', 'h2', ' ', 'h3']);
  });
});
(0, _ava["default"])('container#every', function (t) {
  (0, _helpers.parse)('.one.two.three', function (selectors) {
    var allClasses = selectors.first.every(function (selector) {
      return selector.type === 'class';
    });
    t.truthy(allClasses);
  });
});
(0, _ava["default"])('container#some', function (t) {
  (0, _helpers.parse)('one#two.three', function (selectors) {
    var someClasses = selectors.first.some(function (selector) {
      return selector.type === 'class';
    });
    t.truthy(someClasses);
  });
});
(0, _ava["default"])('container#reduce', function (t) {
  (0, _helpers.parse)('h1, h2, h3, h4', function (selectors) {
    var str = selectors.reduce(function (memo, selector) {
      if (selector.first.type === 'tag') {
        memo += selector.first.value;
      }

      return memo;
    }, '');
    t.deepEqual(str, 'h1h2h3h4');
  });
});
(0, _ava["default"])('container#filter', function (t) {
  (0, _helpers.parse)('h1, h2, c1, c2', function (selectors) {
    var ast = selectors.filter(function (selector) {
      return ~selector.first.value.indexOf('h');
    });
    t.deepEqual(String(ast), 'h1, h2');
  });
});
(0, _ava["default"])('container#split', function (t) {
  (0, _helpers.parse)('h1 h2 >> h3', function (selectors) {
    var list = selectors.first.split(function (selector) {
      return selector.value === '>>';
    }).map(function (group) {
      return group.map(String);
    });
    t.deepEqual(list, [['h1', ' ', 'h2', ' >> '], ['h3']]);
    t.deepEqual(list.length, 2);
  });
});
(0, _ava["default"])('container#sort', function (t) {
  var out = (0, _helpers.parse)('h2,h3,h1,h4', function (selectors) {
    selectors.sort(function (a, b) {
      return a.first.value.slice(-1) - b.first.value.slice(-1);
    });
  });
  t.deepEqual(out, 'h1,h2,h3,h4');
});
(0, _ava["default"])('container#at', function (t) {
  (0, _helpers.parse)('h1, h2, h3', function (selectors) {
    t.deepEqual(selectors.at(1).first.value, 'h2');
  });
});
(0, _ava["default"])('container#first, container#last', function (t) {
  (0, _helpers.parse)('h1, h2, h3, h4', function (selectors) {
    t.deepEqual(selectors.first.first.value, 'h1');
    t.deepEqual(selectors.last.last.value, 'h4');
  });
});
(0, _ava["default"])('container#index', function (t) {
  (0, _helpers.parse)('h1 h2 h3', function (selectors) {
    var middle = selectors.first.at(1);
    t.deepEqual(selectors.first.index(middle), 1);
  });
});
(0, _ava["default"])('container#length', function (t) {
  (0, _helpers.parse)('h1, h2, h3', function (selectors) {
    t.deepEqual(selectors.length, 3);
  });
});
(0, _ava["default"])('container#removeChild', function (t) {
  var out = (0, _helpers.parse)('h1.class h2.class h3.class', function (selectors) {
    selectors.walk(function (selector) {
      if (selector.type === 'class') {
        selector.parent.removeChild(selector);
      }
    });
  });
  t.deepEqual(out, 'h1 h2 h3');
});
(0, _ava["default"])('container#removeAll, container#empty', function (t) {
  var wipe = function wipe(method) {
    return function (selectors) {
      return selectors[method]();
    };
  };

  var out1 = (0, _helpers.parse)('h1 h2, h2 h3, h3 h4', wipe('empty'));
  var out2 = (0, _helpers.parse)('h1 h2, h2 h3, h3 h4', wipe('removeAll'));
  t.deepEqual(out1, '');
  t.deepEqual(out2, '');
});
(0, _ava["default"])('container#insertBefore', function (t) {
  var out = (0, _helpers.parse)('h2', function (selectors) {
    var selector = selectors.first;
    var clone = selector.first.clone({
      value: 'h1'
    });
    selectors.insertBefore(selector, clone);
  });
  t.deepEqual(out, 'h1,h2');
});
(0, _ava["default"])('container#insertBefore and node#remove', function (t) {
  var out = (0, _helpers.parse)('h2', function (selectors) {
    var selector = selectors.first;

    var newSel = _["default"].tag({
      value: 'h1'
    });

    selectors.insertBefore(selector, newSel);
    newSel.remove();
  });
  t.deepEqual(out, 'h2');
});
(0, _ava["default"])('container#insertAfter', function (t) {
  var out = (0, _helpers.parse)('h1', function (selectors) {
    var selector = selectors.first;
    var clone = selector.first.clone({
      value: 'h2'
    });
    selectors.insertAfter(selector, clone);
  });
  t.deepEqual(out, 'h1,h2');
});
(0, _ava["default"])('container#insertAfter and node#remove', function (t) {
  var out = (0, _helpers.parse)('h2', function (selectors) {
    var selector = selectors.first;

    var newSel = _["default"].tag({
      value: 'h1'
    });

    selectors.insertAfter(selector, newSel);
    newSel.remove();
  });
  t.deepEqual(out, 'h2');
});
(0, _ava["default"])('container#insertAfter (during iteration)', function (t) {
  var out = (0, _helpers.parse)('h1, h2, h3', function (selectors) {
    selectors.walkTags(function (selector) {
      var attribute = _["default"].attribute({
        attribute: 'class'
      });

      selector.parent.insertAfter(selector, attribute);
    });
  });
  t.deepEqual(out, 'h1[class], h2[class], h3[class]');
});
(0, _ava["default"])('Container#atPosition first pseudo', function (t) {
  (0, _helpers.parse)(':not(.foo),\n#foo > :matches(ol, ul)', function (root) {
    var node = root.atPosition(1, 1);
    t.deepEqual(node.type, "pseudo");
    t.deepEqual(node.toString(), ":not(.foo)");
  });
});
(0, _ava["default"])('Container#atPosition class in pseudo', function (t) {
  (0, _helpers.parse)(':not(.foo),\n#foo > :matches(ol, ul)', function (root) {
    var node = root.atPosition(1, 6);
    t.deepEqual(node.type, "class");
    t.deepEqual(node.toString(), ".foo");
  });
});
(0, _ava["default"])('Container#atPosition id in second selector', function (t) {
  (0, _helpers.parse)(':not(.foo),\n#foo > :matches(ol, ul)', function (root) {
    var node = root.atPosition(2, 1);
    t.deepEqual(node.type, "id");
    t.deepEqual(node.toString(), "\n#foo");
  });
});
(0, _ava["default"])('Container#atPosition combinator in second selector', function (t) {
  (0, _helpers.parse)(':not(.foo),\n#foo > :matches(ol, ul)', function (root) {
    var node = root.atPosition(2, 6);
    t.deepEqual(node.type, "combinator");
    t.deepEqual(node.toString(), " > ");
    var nodeSpace = root.atPosition(2, 5);
    t.deepEqual(nodeSpace.type, "selector");
    t.deepEqual(nodeSpace.toString(), "\n#foo > :matches(ol, ul)");
  });
});
(0, _ava["default"])('Container#atPosition tag in second selector pseudo', function (t) {
  (0, _helpers.parse)(':not(.foo),\n#foo > :matches(ol, ul)', function (root) {
    var node = root.atPosition(2, 17);
    t.deepEqual(node.type, "tag");
    t.deepEqual(node.toString(), "ol");
  });
});
(0, _ava["default"])('Container#atPosition comma in second selector pseudo', function (t) {
  (0, _helpers.parse)(':not(.foo),\n#foo > :matches(ol, ul)', function (root) {
    var node = root.atPosition(2, 19);
    t.deepEqual(node.type, "pseudo");
    t.deepEqual(node.toString(), ":matches(ol, ul)");
  });
});