"use strict";

var _ava = _interopRequireDefault(require("ava"));

var _index = _interopRequireDefault(require("../index"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// Node creation
var nodeTypes = [['attribute', '[href]', {
  attribute: 'href'
}], ['className', '.classy', {
  value: 'classy'
}], ['combinator', ' >> ', {
  value: '>>',
  spaces: {
    before: ' ',
    after: ' '
  }
}], ['comment', '/* comment */', {
  value: '/* comment */'
}], ['id', '#test', {
  value: 'test'
}], ['nesting', '&'], ['pseudo', '::before', {
  value: '::before'
}], ['string', '"wow"', {
  value: '"wow"'
}], ['tag', 'button', {
  value: 'button'
}], ['universal', '*']];
nodeTypes.forEach(function (type) {
  (0, _ava["default"])("parser#" + type[0], function (t) {
    var node = _index["default"][type[0]](type[2] || {});

    t.deepEqual(String(node), type[1]);
  });
});
(0, _ava["default"])('string constants', function (t) {
  t.truthy(_index["default"].TAG);
  t.truthy(_index["default"].STRING);
  t.truthy(_index["default"].SELECTOR);
  t.truthy(_index["default"].ROOT);
  t.truthy(_index["default"].PSEUDO);
  t.truthy(_index["default"].NESTING);
  t.truthy(_index["default"].ID);
  t.truthy(_index["default"].COMMENT);
  t.truthy(_index["default"].COMBINATOR);
  t.truthy(_index["default"].CLASS);
  t.truthy(_index["default"].ATTRIBUTE);
  t.truthy(_index["default"].UNIVERSAL);
});
(0, _ava["default"])('construct a whole tree', function (t) {
  var root = _index["default"].root();

  var selector = _index["default"].selector();

  selector.append(_index["default"].id({
    value: 'tree'
  }));
  root.append(selector);
  t.deepEqual(String(root), '#tree');
});
(0, _ava["default"])('no operation', function (t) {
  t.notThrows(function () {
    return (0, _index["default"])().processSync('h1 h2 h3');
  });
});
(0, _ava["default"])('empty selector string', function (t) {
  t.notThrows(function () {
    return (0, _index["default"])(function (selectors) {
      selectors.walk(function (selector) {
        selector.type = 'tag';
      });
    }).processSync('');
  });
});
(0, _ava["default"])('async parser', function (t) {
  return (0, _index["default"])(function (selectors) {
    return new Promise(function (res) {
      setTimeout(function () {
        selectors.first.nodes[0].value = 'bar';
        res();
      }, 1);
    });
  }).process('foo').then(function (result) {
    t.deepEqual(result, 'bar');
  });
});
(0, _ava["default"])('parse errors with the async parser', function (t) {
  return (0, _index["default"])(function (selectors) {
    return new Promise(function (res) {
      setTimeout(function () {
        selectors.first.nodes[0].value = 'bar';
        res();
      }, 1);
    });
  }).process('a b: c')["catch"](function (err) {
    return t.truthy(err);
  });
});
(0, _ava["default"])('parse errors within the async processor', function (t) {
  return (0, _index["default"])(function (selectors) {
    return new Promise(function (res, rej) {
      setTimeout(function () {
        rej(selectors.error("async error"));
      }, 1);
    });
  }).process('.foo')["catch"](function (err) {
    return t.truthy(err);
  });
});
(0, _ava["default"])('parse errors within the async processor before the promise returns', function (t) {
  return (0, _index["default"])(function (selectors) {
    throw selectors.error("async error");
  }).process('.foo')["catch"](function (err) {
    return t.truthy(err);
  });
});
(0, _ava["default"])('returning a promise to the sync processor fails', function (t) {
  t["throws"](function () {
    return (0, _index["default"])(function () {
      return new Promise(function (res) {
        setTimeout(function () {
          res();
        }, 1);
      });
    }).processSync('.foo');
  });
});
(0, _ava["default"])('Passing a rule works async', function (t) {
  var rule = {
    selector: '.foo'
  };
  return (0, _index["default"])(function (root) {
    return new Promise(function (res) {
      setTimeout(function () {
        root.walkClasses(function (node) {
          node.value = "bar";
        });
        res();
      }, 1);
    });
  }).process(rule).then(function (newSel) {
    t.deepEqual(newSel, ".bar");
    t.deepEqual(rule.selector, ".bar");
  });
});
(0, _ava["default"])('Passing a rule with mutation disabled works async', function (t) {
  var rule = {
    selector: '.foo'
  };
  return (0, _index["default"])(function (root) {
    return new Promise(function (res) {
      setTimeout(function () {
        root.walkClasses(function (node) {
          node.value = "bar";
        });
        res();
      }, 1);
    });
  }).process(rule, {
    updateSelector: false
  }).then(function (newSel) {
    t.deepEqual(newSel, ".bar");
    t.deepEqual(rule.selector, ".foo");
  });
});
(0, _ava["default"])('Passing a rule with mutation works sync', function (t) {
  var rule = {
    selector: '.foo'
  };
  var newSel = (0, _index["default"])(function (root) {
    root.walkClasses(function (node) {
      node.value = "bar";
    });
  }).processSync(rule, {
    updateSelector: true
  });
  t.deepEqual(newSel, ".bar");
  t.deepEqual(rule.selector, ".bar");
});
(0, _ava["default"])('Transform a selector synchronously', function (t) {
  var rule = {
    selector: '.foo'
  };
  var count = (0, _index["default"])(function (root) {
    var classCount = 0;
    root.walkClasses(function (node) {
      classCount++;
      node.value = "bar";
    });
    return classCount;
  }).transformSync(rule, {
    updateSelector: true
  });
  t.deepEqual(count, 1);
  t.deepEqual(rule.selector, ".bar");
});
(0, _ava["default"])('Transform a selector asynchronously', function (t) {
  var rule = {
    selector: '.foo'
  };
  return (0, _index["default"])(function (root) {
    return new Promise(function (res) {
      setTimeout(function () {
        var classCount = 0;
        root.walkClasses(function (node) {
          classCount++;
          node.value = "bar";
        });
        res(classCount);
      }, 1);
    });
  }).transform(rule, {
    updateSelector: true
  }).then(function (count) {
    t.deepEqual(count, 1);
    t.deepEqual(rule.selector, ".bar");
  });
});
(0, _ava["default"])('get AST of a selector synchronously', function (t) {
  var rule = {
    selector: '.foo'
  };
  var ast = (0, _index["default"])(function (root) {
    var classCount = 0;
    root.walkClasses(function (node) {
      classCount++;
      node.value = "bar";
    });
    return classCount;
  }).astSync(rule, {
    updateSelector: true
  });
  t.deepEqual(ast.nodes[0].nodes[0].value, "bar");
  t.deepEqual(rule.selector, ".bar");
});
(0, _ava["default"])('get AST a selector asynchronously', function (t) {
  var rule = {
    selector: '.foo'
  };
  return (0, _index["default"])(function (root) {
    return new Promise(function (res) {
      setTimeout(function () {
        var classCount = 0;
        root.walkClasses(function (node) {
          classCount++;
          node.value = "bar";
        });
        res(classCount);
      }, 1);
    });
  }).ast(rule, {
    updateSelector: true
  }).then(function (ast) {
    t.deepEqual(ast.nodes[0].nodes[0].value, "bar");
    t.deepEqual(rule.selector, ".bar");
  });
});