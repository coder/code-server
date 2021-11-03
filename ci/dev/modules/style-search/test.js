var test = require("tape");
var styleSearch = require("./index");

function styleSearchResults(options) {
  const results = [];
  styleSearch(options, function(match) {
    results.push(match.startIndex);
  });
  return results;
}

test("default options", function(t) {
  t.deepEqual(styleSearchResults({
    source: "abc cba",
    target: "c",
  }), [ 2, 4 ]);
  t.deepEqual(styleSearchResults({
    source: "abc cb",
    target: "a",
  }), [0]);
  t.deepEqual(styleSearchResults({
    source: "abc cba",
    target: "b",
  }), [ 1, 5 ]);
  t.deepEqual(styleSearchResults({
    source: "abc \"var(--cba)\"",
    target: "a",
  }), [0]);
  t.end();
});

test("once", function(t) {
  t.deepEqual(styleSearchResults({
    source: "abc cba",
    target: "c",
    once: true,
  }), [2]);
  t.deepEqual(styleSearchResults({
    source: "abc cba",
    target: "a",
    once: true,
  }), [0]);
  t.deepEqual(styleSearchResults({
    source: "abc cba",
    target: "b",
    once: false,
  }), [ 1, 5 ]);
  t.end();
});

test("functionArguments: 'only'", function(t) {
  t.deepEqual(styleSearchResults({
    source: "abc var(--cba)",
    target: "c",
    functionArguments: "only",
  }), [10]);
  t.deepEqual(styleSearchResults({
    source: "abc var(--cba)",
    target: "a",
    functionArguments: "only",
  }), [12]);
  t.deepEqual(styleSearchResults({
    source: "abc \"var(--cba)\"",
    target: "a",
    functionArguments: "only",
  }), []);
  t.deepEqual(styleSearchResults({
    source: "translate(1px, calc(1px * 2))",
    target: "1",
    functionArguments: "only",
  }), [ 10, 20 ]);
  t.deepEqual(styleSearchResults({
    source: "var(--horse)",
    target: "v",
    functionArguments: "only",
  }), []);
  t.deepEqual(styleSearchResults({
    source: "abc (abc)",
    target: "b",
    functionArguments: "only",
  }), [], "parens without function is not interpreted as a function");
  t.deepEqual(styleSearchResults({
    source: "de$(abc)fg",
    target: "b",
    functionArguments: "only",
  }), [], "parens preceded by `$`, for postcss-simple-vars interpolation, not interpreted as a function");
  t.deepEqual(styleSearchResults({
    source: "de$(abc)fg",
    target: ")",
    functionArguments: "only",
  }), [], "closing paren of non-function is ignored");
  t.end();
});

test("functionArguments: 'skip'", function(t) {
  t.deepEqual(styleSearchResults({
    source: "abc var(--cba)",
    target: "c",
    functionArguments: "skip",
  }), [2]);
  t.deepEqual(styleSearchResults({
    source: "abc var(--cba)",
    target: "a",
    functionArguments: "skip",
  }), [0]);
  t.deepEqual(styleSearchResults({
    source: "abc \"a var(--cba)\"",
    target: "a",
    functionArguments: "skip",
  }), [0]);
  t.deepEqual(styleSearchResults({
    source: "translate(1px, calc(1px * 2))",
    target: "1",
    functionArguments: "skip",
  }), []);
  t.deepEqual(styleSearchResults({
    source: "var(--horse)",
    target: "v",
    functionArguments: "skip",
  }), []);
  t.deepEqual(styleSearchResults({
    source: "abc (def)",
    target: "e",
    functionArguments: "skip",
  }), [6], "parens without function is not interpreted as a function");
  t.end();
});

test("parentheticals: 'skip'", function(t) {
  t.deepEqual(styleSearchResults({
    source: "abc var(--cba)",
    target: "c",
    parentheticals: "skip",
  }), [2]);
  t.deepEqual(styleSearchResults({
    source: "abc var(--cba)",
    target: "a",
    parentheticals: "skip",
  }), [0]);
  t.deepEqual(styleSearchResults({
    source: "abc \"a var(--cba)\"",
    target: "a",
    parentheticals: "skip",
  }), [0]);
  t.deepEqual(styleSearchResults({
    source: "translate(1px, calc(1px * 2))",
    target: "1",
    parentheticals: "skip",
  }), []);
  t.deepEqual(styleSearchResults({
    source: "var(--horse)",
    target: "v",
    parentheticals: "skip",
  }), []);
  t.deepEqual(styleSearchResults({
    source: "abc (def)",
    target: "e",
    parentheticals: "skip",
  }), [], "parens without function are still ignored");
  t.end();
});

test("ignores matches inside single-quote strings", function(t) {
  t.deepEqual(styleSearchResults({
    source: "abc 'abc'",
    target: "c",
  }), [2]);
  t.deepEqual(styleSearchResults({
    source: "abc 'abc' cba",
    target: "c",
  }), [ 2, 10 ]);
  t.end();
});

test("ignores matches inside double-quote strings", function(t) {
  t.deepEqual(styleSearchResults({
    source: 'abc "abc"',
    target: "c",
  }), [2]);
  t.deepEqual(styleSearchResults({
    source: 'abc "abc" cba',
    target: "c",
  }), [ 2, 10 ]);
  t.end();
});

test("strings: 'check'", function(t) {
  t.deepEqual(styleSearchResults({
    source: "abc 'abc'",
    target: "b",
    strings: "check",
  }), [ 1, 6 ]);

  t.deepEqual(styleSearchResults({
    source: "abc /* 'abc' */",
    target: "b",
    strings: "check",
  }), [1], "no strings inside comments");
  t.end();
});

test("strings: 'only'", function(t) {
  t.deepEqual(styleSearchResults({
    source: 'abc "abc"',
    target: "b",
    strings: "only",
  }), [6]);

  t.deepEqual(styleSearchResults({
    source: "p[href^='https://']:before { content: \"\/*\"; \n  top: 0;\n}",
    target: "\n",
    strings: "only",
  }), [], "comments do not start inside strings");

  t.end();
});

test("ignores matches inside comments", function(t) {
  t.deepEqual(styleSearchResults({
    source: "abc/*comment*/",
    target: "m",
  }), []);
  t.deepEqual(styleSearchResults({
    source: "abc/*command*/",
    target: "a",
  }), [0]);
  t.end();
});

test("comments: 'check'", function(t) {
  t.deepEqual(styleSearchResults({
    source: "abc/*abc*/",
    target: "b",
    comments: "check",
  }), [ 1, 6 ]);
  t.end();
});

test("comments: 'only'", function(t) {
  t.deepEqual(styleSearchResults({
    source: "abc/*abc*/",
    target: "b",
    comments: "only",
  }), [6]);
  t.deepEqual(styleSearchResults({
    source: "abc/*/abc*/",
    target: "b",
    comments: "only",
  }), [7]);
  t.deepEqual(styleSearchResults({
    source: "ab'c/*abc*/c'",
    target: "b",
    comments: "only",
  }), [], "no comments inside strings");
  t.end();
});

test("ignores matches inside single-line comment", function(t) {
  t.deepEqual(styleSearchResults({
    source: "abc // comment",
    target: "m",
  }), []);
  t.deepEqual(styleSearchResults({
    source: "abc // command",
    target: "a",
  }), [0]);
  // Triple-slash comments are used for sassdoc
  t.deepEqual(styleSearchResults({
    source: "abc /// it's all ok",
    target: "a",
  }), [0]);
  t.end();
});

test("handles escaped double-quotes in double-quote strings", function(t) {
  t.deepEqual(styleSearchResults({
    source: 'abc "ab\\"c"',
    target: "c",
  }), [2]);
  t.deepEqual(styleSearchResults({
    source: 'abc "a\\"bc" foo cba',
    target: "c",
  }), [ 2, 16 ]);
  t.end();
});

test("handles escaped double-quotes in single-quote strings", function(t) {
  t.deepEqual(styleSearchResults({
    source: "abc 'ab\\'c'",
    target: "c",
  }), [2]);
  t.deepEqual(styleSearchResults({
    source: "abc 'a\\'bc' foo cba",
    target: "c",
  }), [ 2, 16 ]);
  t.end();
});

test("count", function(t) {
  const endCounts = []
  styleSearch({ source: "123 123 123", target: "1" }, function(index, count) {
    endCounts.push(count);
  });
  t.deepEqual(endCounts, [ 1, 2, 3 ]);
  t.end();
});

test("finds parentheses", function(t) {
  t.deepEqual(styleSearchResults({
    source: "a { color: rgb(0,0,0); }",
    target: "(",
  }), [14]);
  t.deepEqual(styleSearchResults({
    source: "a { color: rgb(0,0,0); }",
    target: ")",
  }), [20]);
  t.end();
});

test("functionNames: 'check'", function(t) {
  t.deepEqual(styleSearchResults({
    source: "a { color: rgb(0,0,0); }",
    target: "rgb",
  }), []);
  t.deepEqual(styleSearchResults({
    source: "a { color: rgb(0,0,0); }",
    target: "rgb",
    functionNames: "check"
  }), [11]);
  t.end();
});

test("non-single-character target", function(t) {
  t.deepEqual(styleSearchResults({
    source: "abc cba",
    target: "abc",
  }), [0]);
  t.deepEqual(styleSearchResults({
    source: "abc cba",
    target: "cb",
  }), [4]);
  t.deepEqual(styleSearchResults({
    source: "abc cba",
    target: "c c",
  }), [2]);
  t.deepEqual(styleSearchResults({
    source: "abc cba abc",
    target: "abc",
  }), [ 0, 8 ]);
  t.deepEqual(styleSearchResults({
    source: "abc cba 'abc'",
    target: "abc",
  }), [0]);
  t.deepEqual(styleSearchResults({
    source: "abc cb",
    target: "aa",
  }), []);
  t.end();
});

test("array target", function(t) {
  t.deepEqual(styleSearchResults({
    source: "abc cba",
    target: [ "a", "b" ],
  }), [ 0, 1, 5, 6 ]);
  t.deepEqual(styleSearchResults({
    source: "abc cba",
    target: [ "c", "b" ],
  }), [ 1, 2, 4, 5 ]);
  t.deepEqual(styleSearchResults({
    source: "abc cba",
    target: [ "bc", "a" ],
  }), [ 0, 1, 6 ]);
  t.deepEqual(styleSearchResults({
    source: "abc cba",
    target: [ "abc", "f" ],
  }), [0]);
  t.deepEqual(styleSearchResults({
    source: "abc cba",
    target: [ 0, 1, 2 ],
  }), []);
  t.end();
});

test("match object", function(t) {
  styleSearch({ source: "abc", target: "bc" }, function(match) {
    t.equal(match.startIndex, 1);
    t.equal(match.endIndex, 3);
    t.equal(match.target, "bc");
    t.equal(match.insideFunctionArguments, false);
    t.equal(match.insideComment, false);
  });

  const twoMatches = []
  styleSearch({ source: "abc bca", target: [ "bc ", "ca" ] }, function(match) {
    twoMatches.push(match);
  });
  const firstMatch = twoMatches[0]
  const secondMatch = twoMatches[1]
  t.equal(firstMatch.startIndex, 1);
  t.equal(firstMatch.endIndex, 4);
  t.equal(firstMatch.target, "bc ");
  t.equal(firstMatch.insideFunctionArguments, false);
  t.equal(firstMatch.insideComment, false);
  t.equal(secondMatch.startIndex, 5);
  t.equal(secondMatch.endIndex, 7);
  t.equal(secondMatch.target, "ca");
  t.equal(secondMatch.insideFunctionArguments, false);
  t.equal(secondMatch.insideComment, false);
  t.end();
});

test("match inside a function", function(t) {
  styleSearch({ source: "a { color: rgb(0, 0, 1); }", target: "1" }, function(match) {
    t.equal(match.insideFunctionArguments, true);
    t.equal(match.insideComment, false);
    t.end();
  });
});

test("match inside a comment", function(t) {
  styleSearch({
    source: "a { color: /* 1 */ pink; }",
    target: "1",
    comments: "check"
  }, function(match) {
    t.equal(match.insideFunctionArguments, false);
    t.equal(match.insideComment, true);
    t.end();
  });
});

test("match inside a block comment", function(t) {
  styleSearch({
    source: "a { color:\n/**\n * 0\n * 1\n */\npink; }",
    target: "1",
    comments: "check"
  }, function(match) {
    t.equal(match.insideFunctionArguments, false);
    t.equal(match.insideComment, true);
    t.end();
  });
});

test("match inside a comment inside function", function(t) {
  styleSearch({
    source: "a { color: rgb(0, 0, 0 /* 1 */); }",
    target: "1",
    comments: "check"
  }, function(match) {
    t.equal(match.insideFunctionArguments, true);
    t.equal(match.insideComment, true);
    t.end();
  });
});

test("error on multiple 'only' options", function(t) {
  t.throws(function() {
    styleSearch({
      source: "a {}",
      target: "a",
      comments: "only",
      strings: "only",
    }, function(match) {});
  }, /Only one syntax/);
  t.end();
});
