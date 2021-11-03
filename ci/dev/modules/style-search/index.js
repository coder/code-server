var SKIP = 'skip';
var CHECK = 'check';
var ONLY = 'only';

module.exports = function (options, callback) {
  var source = options.source;
  var target = options.target;

  var skipComments = (options.comments) ? options.comments === SKIP : true;
  var skipStrings = (options.strings) ? options.strings === SKIP : true;
  var skipFunctionNames = (options.functionNames) ? options.functionNames === SKIP : true;
  var skipFunctionArguments = options.functionArguments === SKIP;
  var skipParentheticals = options.parentheticals === SKIP;

  var onceOptionUsed = false;
  Object.keys(options).forEach(function(key) {
    if (options[key] !== ONLY) return;
    if (!onceOptionUsed) {
      onceOptionUsed = true;
    } else {
      throw new Error('Only one syntax feature option can be the "only" one to check');
    }
  });

  var onlyComments = options.comments === ONLY;
  var onlyStrings = options.strings === ONLY;
  var onlyFunctionNames = options.functionNames === ONLY;
  var onlyFunctionArguments = options.functionArguments === ONLY;
  var onlyParentheticals = options.parentheticals === ONLY;

  var insideString = false;
  var insideComment = false;
  var insideSingleLineComment = false;
  var insideParens = false;
  var insideFunctionArguments = false;
  var openingParenCount = 0;
  var matchCount = 0;
  var openingQuote;

  var targetIsArray = Array.isArray(target);

  // If the target is just a string, it is easy to check whether
  // some index of the source matches it.
  // If the target is an array of strings, though, we have to
  // check whether some index of the source matches *any* of
  // those target strings (stopping after the first match).
  var getMatch = (function () {
    if (!targetIsArray) {
      return getMatchBase.bind(null, target);
    }
    return function(index) {
      for (var ti = 0, tl = target.length; ti < tl; ti++) {
        var checkResult = getMatchBase(target[ti], index);
        if (checkResult) return checkResult;
      }
      return false;
    }
  })();

  function getMatchBase(targetString, index) {
    var targetStringLength = targetString.length;

    // Target is a single character
    if (targetStringLength === 1 && source[index] !== targetString) return false;

    // Target is multiple characters
    if (source.substr(index, targetStringLength) !== targetString) return false;

    return {
      insideParens: insideParens,
      insideFunctionArguments: insideFunctionArguments,
      insideComment: insideComment,
      insideString: insideString,
      startIndex: index,
      endIndex: index + targetStringLength,
      target: targetString,
    };
  }

  for (var i = 0, l = source.length; i < l; i++) {
    var currentChar = source[i];

    // Register the beginning of a comment
    if (
      !insideString && !insideComment
      && currentChar === "/"
      && source[i - 1] !== "\\" // escaping
    ) {
      // standard comments
      if (source[i + 1] === "*") {
        insideComment = true;
        continue;
      }
      // single-line comments
      if (source[i + 1] === "/") {
        insideComment = true;
        insideSingleLineComment = true;
        continue;
      }
    }

    if (insideComment) {
      // Register the end of a standard comment
      if (
        !insideSingleLineComment
        && currentChar === "*"
        && source[i - 1] !== "\\" // escaping
        && source[i + 1] === "/"
        && source[i - 1] !== "/" // don't end if it's /*/
      ) {
        insideComment = false;
        continue;
      }

      // Register the end of a single-line comment
      if (
        insideSingleLineComment
        && currentChar === "\n"
      ) {
        insideComment = false;
        insideSingleLineComment = false;
      }

      if (skipComments) continue;
    }

    // Register the beginning of a string
    if (!insideComment && !insideString && (currentChar === "\"" || currentChar === "'")) {
      if (source[i - 1] === "\\") continue; // escaping

      openingQuote = currentChar;
      insideString = true;

      // For string-quotes rule
      if (target === currentChar) handleMatch(getMatch(i));
      continue;
    }

    if (insideString) {
      // Register the end of a string
      if (currentChar === openingQuote) {
        if (source[i - 1] === "\\") continue; // escaping
        insideString = false;
        continue;
      }

      if (skipStrings) continue;
    }

    // Register the beginning of parens/functions
    if (!insideString && !insideComment && currentChar === "(") {
      // Keep track of opening parentheticals so that we
      // know when the outermost function (possibly
      // containing nested functions) is closing
      openingParenCount++;

      insideParens = true;
      // Only inside a function if there is a function name
      // before the opening paren
      if (/[a-zA-Z]/.test(source[i - 1])) {
        insideFunctionArguments = true;
      }

      if (target === "(") handleMatch(getMatch(i));
      continue;
    }

    if (insideParens) {
      // Register the end of a function
      if (currentChar === ")") {
        openingParenCount--;
        // Do this here so the match is still technically inside a function
        if (target === ")") handleMatch(getMatch(i));
        if (openingParenCount === 0) {
          insideParens = false;
          insideFunctionArguments = false;
        }
        continue;
      }
    }

    var isFunctionName = /^[a-zA-Z]*\(/.test(source.slice(i));
    if (skipFunctionNames && isFunctionName) continue;
    if (onlyFunctionNames && !isFunctionName) continue;

    var match = getMatch(i);

    if (!match) continue;
    handleMatch(match);
    if (options.once) return;
  }

  function handleMatch(match) {
    if (onlyParentheticals && !insideParens) return;
    if (skipParentheticals && insideParens) return;
    if (onlyFunctionArguments && !insideFunctionArguments) return;
    if (skipFunctionArguments && insideFunctionArguments) return;
    if (onlyStrings && !insideString) return;
    if (onlyComments && !insideComment) return;
    matchCount++;
    callback(match, matchCount);
  }
}
