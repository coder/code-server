'use strict';var _slicedToArray = function () {function sliceIterator(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"]) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}return function (arr, i) {if (Array.isArray(arr)) {return arr;} else if (Symbol.iterator in Object(arr)) {return sliceIterator(arr, i);} else {throw new TypeError("Invalid attempt to destructure non-iterable instance");}};}();var _resolve = require('eslint-module-utils/resolve');var _resolve2 = _interopRequireDefault(_resolve);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _toConsumableArray(arr) {if (Array.isArray(arr)) {for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];return arr2;} else {return Array.from(arr);}}function _toArray(arr) {return Array.isArray(arr) ? arr : Array.from(arr);}

function checkImports(imported, context) {
  for (const _ref of imported.entries()) {var _ref2 = _slicedToArray(_ref, 2);const module = _ref2[0];const nodes = _ref2[1];
    if (nodes.length > 1) {
      const message = `'${module}' imported multiple times.`;var _nodes = _toArray(
      nodes);const first = _nodes[0],rest = _nodes.slice(1);
      const sourceCode = context.getSourceCode();
      const fix = getFix(first, rest, sourceCode);

      context.report({
        node: first.source,
        message,
        fix // Attach the autofix (if any) to the first import.
      });

      for (const node of rest) {
        context.report({
          node: node.source,
          message });

      }
    }
  }
}

function getFix(first, rest, sourceCode) {
  // Sorry ESLint <= 3 users, no autofix for you. Autofixing duplicate imports
  // requires multiple `fixer.whatever()` calls in the `fix`: We both need to
  // update the first one, and remove the rest. Support for multiple
  // `fixer.whatever()` in a single `fix` was added in ESLint 4.1.
  // `sourceCode.getCommentsBefore` was added in 4.0, so that's an easy thing to
  // check for.
  if (typeof sourceCode.getCommentsBefore !== 'function') {
    return undefined;
  }

  // Adjusting the first import might make it multiline, which could break
  // `eslint-disable-next-line` comments and similar, so bail if the first
  // import has comments. Also, if the first import is `import * as ns from
  // './foo'` there's nothing we can do.
  if (hasProblematicComments(first, sourceCode) || hasNamespace(first)) {
    return undefined;
  }

  const defaultImportNames = new Set(
  [first].concat(_toConsumableArray(rest)).map(getDefaultImportName).filter(Boolean));


  // Bail if there are multiple different default import names – it's up to the
  // user to choose which one to keep.
  if (defaultImportNames.size > 1) {
    return undefined;
  }

  // Leave it to the user to handle comments. Also skip `import * as ns from
  // './foo'` imports, since they cannot be merged into another import.
  const restWithoutComments = rest.filter(node => !(
  hasProblematicComments(node, sourceCode) ||
  hasNamespace(node)));


  const specifiers = restWithoutComments.
  map(node => {
    const tokens = sourceCode.getTokens(node);
    const openBrace = tokens.find(token => isPunctuator(token, '{'));
    const closeBrace = tokens.find(token => isPunctuator(token, '}'));

    if (openBrace == null || closeBrace == null) {
      return undefined;
    }

    return {
      importNode: node,
      text: sourceCode.text.slice(openBrace.range[1], closeBrace.range[0]),
      hasTrailingComma: isPunctuator(sourceCode.getTokenBefore(closeBrace), ','),
      isEmpty: !hasSpecifiers(node) };

  }).
  filter(Boolean);

  const unnecessaryImports = restWithoutComments.filter(node =>
  !hasSpecifiers(node) &&
  !hasNamespace(node) &&
  !specifiers.some(specifier => specifier.importNode === node));


  const shouldAddDefault = getDefaultImportName(first) == null && defaultImportNames.size === 1;
  const shouldAddSpecifiers = specifiers.length > 0;
  const shouldRemoveUnnecessary = unnecessaryImports.length > 0;

  if (!(shouldAddDefault || shouldAddSpecifiers || shouldRemoveUnnecessary)) {
    return undefined;
  }

  return fixer => {
    const tokens = sourceCode.getTokens(first);
    const openBrace = tokens.find(token => isPunctuator(token, '{'));
    const closeBrace = tokens.find(token => isPunctuator(token, '}'));
    const firstToken = sourceCode.getFirstToken(first);var _defaultImportNames = _slicedToArray(
    defaultImportNames, 1);const defaultImportName = _defaultImportNames[0];

    const firstHasTrailingComma =
    closeBrace != null &&
    isPunctuator(sourceCode.getTokenBefore(closeBrace), ',');
    const firstIsEmpty = !hasSpecifiers(first);var _specifiers$reduce =

    specifiers.reduce(
    (_ref3, specifier) => {var _ref4 = _slicedToArray(_ref3, 2);let result = _ref4[0],needsComma = _ref4[1];
      return [
      needsComma && !specifier.isEmpty ?
      `${result},${specifier.text}` :
      `${result}${specifier.text}`,
      specifier.isEmpty ? needsComma : true];

    },
    ['', !firstHasTrailingComma && !firstIsEmpty]),_specifiers$reduce2 = _slicedToArray(_specifiers$reduce, 1);const specifiersText = _specifiers$reduce2[0];


    const fixes = [];

    if (shouldAddDefault && openBrace == null && shouldAddSpecifiers) {
      // `import './foo'` → `import def, {...} from './foo'`
      fixes.push(
      fixer.insertTextAfter(firstToken, ` ${defaultImportName}, {${specifiersText}} from`));

    } else if (shouldAddDefault && openBrace == null && !shouldAddSpecifiers) {
      // `import './foo'` → `import def from './foo'`
      fixes.push(fixer.insertTextAfter(firstToken, ` ${defaultImportName} from`));
    } else if (shouldAddDefault && openBrace != null && closeBrace != null) {
      // `import {...} from './foo'` → `import def, {...} from './foo'`
      fixes.push(fixer.insertTextAfter(firstToken, ` ${defaultImportName},`));
      if (shouldAddSpecifiers) {
        // `import def, {...} from './foo'` → `import def, {..., ...} from './foo'`
        fixes.push(fixer.insertTextBefore(closeBrace, specifiersText));
      }
    } else if (!shouldAddDefault && openBrace == null && shouldAddSpecifiers) {
      if (first.specifiers.length === 0) {
        // `import './foo'` → `import {...} from './foo'`
        fixes.push(fixer.insertTextAfter(firstToken, ` {${specifiersText}} from`));
      } else {
        // `import def from './foo'` → `import def, {...} from './foo'`
        fixes.push(fixer.insertTextAfter(first.specifiers[0], `, {${specifiersText}}`));
      }
    } else if (!shouldAddDefault && openBrace != null && closeBrace != null) {
      // `import {...} './foo'` → `import {..., ...} from './foo'`
      fixes.push(fixer.insertTextBefore(closeBrace, specifiersText));
    }

    // Remove imports whose specifiers have been moved into the first import.
    for (const specifier of specifiers) {
      fixes.push(fixer.remove(specifier.importNode));
    }

    // Remove imports whose default import has been moved to the first import,
    // and side-effect-only imports that are unnecessary due to the first
    // import.
    for (const node of unnecessaryImports) {
      fixes.push(fixer.remove(node));
    }

    return fixes;
  };
}

function isPunctuator(node, value) {
  return node.type === 'Punctuator' && node.value === value;
}

// Get the name of the default import of `node`, if any.
function getDefaultImportName(node) {
  const defaultSpecifier = node.specifiers.
  find(specifier => specifier.type === 'ImportDefaultSpecifier');
  return defaultSpecifier != null ? defaultSpecifier.local.name : undefined;
}

// Checks whether `node` has a namespace import.
function hasNamespace(node) {
  const specifiers = node.specifiers.
  filter(specifier => specifier.type === 'ImportNamespaceSpecifier');
  return specifiers.length > 0;
}

// Checks whether `node` has any non-default specifiers.
function hasSpecifiers(node) {
  const specifiers = node.specifiers.
  filter(specifier => specifier.type === 'ImportSpecifier');
  return specifiers.length > 0;
}

// It's not obvious what the user wants to do with comments associated with
// duplicate imports, so skip imports with comments when autofixing.
function hasProblematicComments(node, sourceCode) {
  return (
    hasCommentBefore(node, sourceCode) ||
    hasCommentAfter(node, sourceCode) ||
    hasCommentInsideNonSpecifiers(node, sourceCode));

}

// Checks whether `node` has a comment (that ends) on the previous line or on
// the same line as `node` (starts).
function hasCommentBefore(node, sourceCode) {
  return sourceCode.getCommentsBefore(node).
  some(comment => comment.loc.end.line >= node.loc.start.line - 1);
}

// Checks whether `node` has a comment (that starts) on the same line as `node`
// (ends).
function hasCommentAfter(node, sourceCode) {
  return sourceCode.getCommentsAfter(node).
  some(comment => comment.loc.start.line === node.loc.end.line);
}

// Checks whether `node` has any comments _inside,_ except inside the `{...}`
// part (if any).
function hasCommentInsideNonSpecifiers(node, sourceCode) {
  const tokens = sourceCode.getTokens(node);
  const openBraceIndex = tokens.findIndex(token => isPunctuator(token, '{'));
  const closeBraceIndex = tokens.findIndex(token => isPunctuator(token, '}'));
  // Slice away the first token, since we're no looking for comments _before_
  // `node` (only inside). If there's a `{...}` part, look for comments before
  // the `{`, but not before the `}` (hence the `+1`s).
  const someTokens = openBraceIndex >= 0 && closeBraceIndex >= 0 ?
  tokens.slice(1, openBraceIndex + 1).concat(tokens.slice(closeBraceIndex + 1)) :
  tokens.slice(1);
  return someTokens.some(token => sourceCode.getCommentsBefore(token).length > 0);
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: (0, _docsUrl2.default)('no-duplicates') },

    fixable: 'code',
    schema: [
    {
      type: 'object',
      properties: {
        considerQueryString: {
          type: 'boolean' } },


      additionalProperties: false }] },




  create: function (context) {
    // Prepare the resolver from options.
    const considerQueryStringOption = context.options[0] &&
    context.options[0]['considerQueryString'];
    const defaultResolver = sourcePath => (0, _resolve2.default)(sourcePath, context) || sourcePath;
    const resolver = considerQueryStringOption ? sourcePath => {
      const parts = sourcePath.match(/^([^?]*)\?(.*)$/);
      if (!parts) {
        return defaultResolver(sourcePath);
      }
      return defaultResolver(parts[1]) + '?' + parts[2];
    } : defaultResolver;

    const imported = new Map();
    const nsImported = new Map();
    const typesImported = new Map();
    return {
      'ImportDeclaration': function (n) {
        // resolved path will cover aliased duplicates
        const resolvedPath = resolver(n.source.value);
        const importMap = n.importKind === 'type' ? typesImported :
        hasNamespace(n) ? nsImported : imported;

        if (importMap.has(resolvedPath)) {
          importMap.get(resolvedPath).push(n);
        } else {
          importMap.set(resolvedPath, [n]);
        }
      },

      'Program:exit': function () {
        checkImports(imported, context);
        checkImports(nsImported, context);
        checkImports(typesImported, context);
      } };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1kdXBsaWNhdGVzLmpzIl0sIm5hbWVzIjpbImNoZWNrSW1wb3J0cyIsImltcG9ydGVkIiwiY29udGV4dCIsImVudHJpZXMiLCJtb2R1bGUiLCJub2RlcyIsImxlbmd0aCIsIm1lc3NhZ2UiLCJmaXJzdCIsInJlc3QiLCJzb3VyY2VDb2RlIiwiZ2V0U291cmNlQ29kZSIsImZpeCIsImdldEZpeCIsInJlcG9ydCIsIm5vZGUiLCJzb3VyY2UiLCJnZXRDb21tZW50c0JlZm9yZSIsInVuZGVmaW5lZCIsImhhc1Byb2JsZW1hdGljQ29tbWVudHMiLCJoYXNOYW1lc3BhY2UiLCJkZWZhdWx0SW1wb3J0TmFtZXMiLCJTZXQiLCJtYXAiLCJnZXREZWZhdWx0SW1wb3J0TmFtZSIsImZpbHRlciIsIkJvb2xlYW4iLCJzaXplIiwicmVzdFdpdGhvdXRDb21tZW50cyIsInNwZWNpZmllcnMiLCJ0b2tlbnMiLCJnZXRUb2tlbnMiLCJvcGVuQnJhY2UiLCJmaW5kIiwidG9rZW4iLCJpc1B1bmN0dWF0b3IiLCJjbG9zZUJyYWNlIiwiaW1wb3J0Tm9kZSIsInRleHQiLCJzbGljZSIsInJhbmdlIiwiaGFzVHJhaWxpbmdDb21tYSIsImdldFRva2VuQmVmb3JlIiwiaXNFbXB0eSIsImhhc1NwZWNpZmllcnMiLCJ1bm5lY2Vzc2FyeUltcG9ydHMiLCJzb21lIiwic3BlY2lmaWVyIiwic2hvdWxkQWRkRGVmYXVsdCIsInNob3VsZEFkZFNwZWNpZmllcnMiLCJzaG91bGRSZW1vdmVVbm5lY2Vzc2FyeSIsImZpeGVyIiwiZmlyc3RUb2tlbiIsImdldEZpcnN0VG9rZW4iLCJkZWZhdWx0SW1wb3J0TmFtZSIsImZpcnN0SGFzVHJhaWxpbmdDb21tYSIsImZpcnN0SXNFbXB0eSIsInJlZHVjZSIsInJlc3VsdCIsIm5lZWRzQ29tbWEiLCJzcGVjaWZpZXJzVGV4dCIsImZpeGVzIiwicHVzaCIsImluc2VydFRleHRBZnRlciIsImluc2VydFRleHRCZWZvcmUiLCJyZW1vdmUiLCJ2YWx1ZSIsInR5cGUiLCJkZWZhdWx0U3BlY2lmaWVyIiwibG9jYWwiLCJuYW1lIiwiaGFzQ29tbWVudEJlZm9yZSIsImhhc0NvbW1lbnRBZnRlciIsImhhc0NvbW1lbnRJbnNpZGVOb25TcGVjaWZpZXJzIiwiY29tbWVudCIsImxvYyIsImVuZCIsImxpbmUiLCJzdGFydCIsImdldENvbW1lbnRzQWZ0ZXIiLCJvcGVuQnJhY2VJbmRleCIsImZpbmRJbmRleCIsImNsb3NlQnJhY2VJbmRleCIsInNvbWVUb2tlbnMiLCJjb25jYXQiLCJleHBvcnRzIiwibWV0YSIsImRvY3MiLCJ1cmwiLCJmaXhhYmxlIiwic2NoZW1hIiwicHJvcGVydGllcyIsImNvbnNpZGVyUXVlcnlTdHJpbmciLCJhZGRpdGlvbmFsUHJvcGVydGllcyIsImNyZWF0ZSIsImNvbnNpZGVyUXVlcnlTdHJpbmdPcHRpb24iLCJvcHRpb25zIiwiZGVmYXVsdFJlc29sdmVyIiwic291cmNlUGF0aCIsInJlc29sdmVyIiwicGFydHMiLCJtYXRjaCIsIk1hcCIsIm5zSW1wb3J0ZWQiLCJ0eXBlc0ltcG9ydGVkIiwibiIsInJlc29sdmVkUGF0aCIsImltcG9ydE1hcCIsImltcG9ydEtpbmQiLCJoYXMiLCJnZXQiLCJzZXQiXSwibWFwcGluZ3MiOiJxb0JBQUEsc0Q7QUFDQSxxQzs7QUFFQSxTQUFTQSxZQUFULENBQXNCQyxRQUF0QixFQUFnQ0MsT0FBaEMsRUFBeUM7QUFDdkMscUJBQThCRCxTQUFTRSxPQUFULEVBQTlCLEVBQWtELDJDQUF0Q0MsTUFBc0Msa0JBQTlCQyxLQUE4QjtBQUNoRCxRQUFJQSxNQUFNQyxNQUFOLEdBQWUsQ0FBbkIsRUFBc0I7QUFDcEIsWUFBTUMsVUFBVyxJQUFHSCxNQUFPLDRCQUEzQixDQURvQjtBQUVLQyxXQUZMLFFBRWJHLEtBRmEsYUFFSEMsSUFGRztBQUdwQixZQUFNQyxhQUFhUixRQUFRUyxhQUFSLEVBQW5CO0FBQ0EsWUFBTUMsTUFBTUMsT0FBT0wsS0FBUCxFQUFjQyxJQUFkLEVBQW9C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c29sdmUgZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy9yZXNvbHZlJztcbmltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnO1xuXG5mdW5jdGlvbiBjaGVja0ltcG9ydHMoaW1wb3J0ZWQsIGNvbnRleHQpIHtcbiAgZm9yIChjb25zdCBbbW9kdWxlLCBub2Rlc10gb2YgaW1wb3J0ZWQuZW50cmllcygpKSB7XG4gICAgaWYgKG5vZGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBgJyR7bW9kdWxlfScgaW1wb3J0ZWQgbXVsdGlwbGUgdGltZXMuYDtcbiAgICAgIGNvbnN0IFtmaXJzdCwgLi4ucmVzdF0gPSBub2RlcztcbiAgICAgIGNvbnN0IHNvdXJjZUNvZGUgPSBjb250ZXh0LmdldFNvdXJjZUNvZGUoKTtcbiAgICAgIGNvbnN0IGZpeCA9IGdldEZpeChmaXJzdCwgcmVzdCwgc291cmNlQ29kZSk7XG5cbiAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgbm9kZTogZmlyc3Quc291cmNlLFxuICAgICAgICBtZXNzYWdlLFxuICAgICAgICBmaXgsIC8vIEF0dGFjaCB0aGUgYXV0b2ZpeCAoaWYgYW55KSB0byB0aGUgZmlyc3QgaW1wb3J0LlxuICAgICAgfSk7XG5cbiAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiByZXN0KSB7XG4gICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICBub2RlOiBub2RlLnNvdXJjZSxcbiAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0Rml4KGZpcnN0LCByZXN0LCBzb3VyY2VDb2RlKSB7XG4gIC8vIFNvcnJ5IEVTTGludCA8PSAzIHVzZXJzLCBubyBhdXRvZml4IGZvciB5b3UuIEF1dG9maXhpbmcgZHVwbGljYXRlIGltcG9ydHNcbiAgLy8gcmVxdWlyZXMgbXVsdGlwbGUgYGZpeGVyLndoYXRldmVyKClgIGNhbGxzIGluIHRoZSBgZml4YDogV2UgYm90aCBuZWVkIHRvXG4gIC8vIHVwZGF0ZSB0aGUgZmlyc3Qgb25lLCBhbmQgcmVtb3ZlIHRoZSByZXN0LiBTdXBwb3J0IGZvciBtdWx0aXBsZVxuICAvLyBgZml4ZXIud2hhdGV2ZXIoKWAgaW4gYSBzaW5nbGUgYGZpeGAgd2FzIGFkZGVkIGluIEVTTGludCA0LjEuXG4gIC8vIGBzb3VyY2VDb2RlLmdldENvbW1lbnRzQmVmb3JlYCB3YXMgYWRkZWQgaW4gNC4wLCBzbyB0aGF0J3MgYW4gZWFzeSB0aGluZyB0b1xuICAvLyBjaGVjayBmb3IuXG4gIGlmICh0eXBlb2Ygc291cmNlQ29kZS5nZXRDb21tZW50c0JlZm9yZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBBZGp1c3RpbmcgdGhlIGZpcnN0IGltcG9ydCBtaWdodCBtYWtlIGl0IG11bHRpbGluZSwgd2hpY2ggY291bGQgYnJlYWtcbiAgLy8gYGVzbGludC1kaXNhYmxlLW5leHQtbGluZWAgY29tbWVudHMgYW5kIHNpbWlsYXIsIHNvIGJhaWwgaWYgdGhlIGZpcnN0XG4gIC8vIGltcG9ydCBoYXMgY29tbWVudHMuIEFsc28sIGlmIHRoZSBmaXJzdCBpbXBvcnQgaXMgYGltcG9ydCAqIGFzIG5zIGZyb21cbiAgLy8gJy4vZm9vJ2AgdGhlcmUncyBub3RoaW5nIHdlIGNhbiBkby5cbiAgaWYgKGhhc1Byb2JsZW1hdGljQ29tbWVudHMoZmlyc3QsIHNvdXJjZUNvZGUpIHx8IGhhc05hbWVzcGFjZShmaXJzdCkpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgY29uc3QgZGVmYXVsdEltcG9ydE5hbWVzID0gbmV3IFNldChcbiAgICBbZmlyc3QsIC4uLnJlc3RdLm1hcChnZXREZWZhdWx0SW1wb3J0TmFtZSkuZmlsdGVyKEJvb2xlYW4pXG4gICk7XG5cbiAgLy8gQmFpbCBpZiB0aGVyZSBhcmUgbXVsdGlwbGUgZGlmZmVyZW50IGRlZmF1bHQgaW1wb3J0IG5hbWVzIOKAkyBpdCdzIHVwIHRvIHRoZVxuICAvLyB1c2VyIHRvIGNob29zZSB3aGljaCBvbmUgdG8ga2VlcC5cbiAgaWYgKGRlZmF1bHRJbXBvcnROYW1lcy5zaXplID4gMSkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBMZWF2ZSBpdCB0byB0aGUgdXNlciB0byBoYW5kbGUgY29tbWVudHMuIEFsc28gc2tpcCBgaW1wb3J0ICogYXMgbnMgZnJvbVxuICAvLyAnLi9mb28nYCBpbXBvcnRzLCBzaW5jZSB0aGV5IGNhbm5vdCBiZSBtZXJnZWQgaW50byBhbm90aGVyIGltcG9ydC5cbiAgY29uc3QgcmVzdFdpdGhvdXRDb21tZW50cyA9IHJlc3QuZmlsdGVyKG5vZGUgPT4gIShcbiAgICBoYXNQcm9ibGVtYXRpY0NvbW1lbnRzKG5vZGUsIHNvdXJjZUNvZGUpIHx8XG4gICAgaGFzTmFtZXNwYWNlKG5vZGUpXG4gICkpO1xuXG4gIGNvbnN0IHNwZWNpZmllcnMgPSByZXN0V2l0aG91dENvbW1lbnRzXG4gICAgLm1hcChub2RlID0+IHtcbiAgICAgIGNvbnN0IHRva2VucyA9IHNvdXJjZUNvZGUuZ2V0VG9rZW5zKG5vZGUpO1xuICAgICAgY29uc3Qgb3BlbkJyYWNlID0gdG9rZW5zLmZpbmQodG9rZW4gPT4gaXNQdW5jdHVhdG9yKHRva2VuLCAneycpKTtcbiAgICAgIGNvbnN0IGNsb3NlQnJhY2UgPSB0b2tlbnMuZmluZCh0b2tlbiA9PiBpc1B1bmN0dWF0b3IodG9rZW4sICd9JykpO1xuXG4gICAgICBpZiAob3BlbkJyYWNlID09IG51bGwgfHwgY2xvc2VCcmFjZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGltcG9ydE5vZGU6IG5vZGUsXG4gICAgICAgIHRleHQ6IHNvdXJjZUNvZGUudGV4dC5zbGljZShvcGVuQnJhY2UucmFuZ2VbMV0sIGNsb3NlQnJhY2UucmFuZ2VbMF0pLFxuICAgICAgICBoYXNUcmFpbGluZ0NvbW1hOiBpc1B1bmN0dWF0b3Ioc291cmNlQ29kZS5nZXRUb2tlbkJlZm9yZShjbG9zZUJyYWNlKSwgJywnKSxcbiAgICAgICAgaXNFbXB0eTogIWhhc1NwZWNpZmllcnMobm9kZSksXG4gICAgICB9O1xuICAgIH0pXG4gICAgLmZpbHRlcihCb29sZWFuKTtcblxuICBjb25zdCB1bm5lY2Vzc2FyeUltcG9ydHMgPSByZXN0V2l0aG91dENvbW1lbnRzLmZpbHRlcihub2RlID0+XG4gICAgIWhhc1NwZWNpZmllcnMobm9kZSkgJiZcbiAgICAhaGFzTmFtZXNwYWNlKG5vZGUpICYmXG4gICAgIXNwZWNpZmllcnMuc29tZShzcGVjaWZpZXIgPT4gc3BlY2lmaWVyLmltcG9ydE5vZGUgPT09IG5vZGUpXG4gICk7XG5cbiAgY29uc3Qgc2hvdWxkQWRkRGVmYXVsdCA9IGdldERlZmF1bHRJbXBvcnROYW1lKGZpcnN0KSA9PSBudWxsICYmIGRlZmF1bHRJbXBvcnROYW1lcy5zaXplID09PSAxO1xuICBjb25zdCBzaG91bGRBZGRTcGVjaWZpZXJzID0gc3BlY2lmaWVycy5sZW5ndGggPiAwO1xuICBjb25zdCBzaG91bGRSZW1vdmVVbm5lY2Vzc2FyeSA9IHVubmVjZXNzYXJ5SW1wb3J0cy5sZW5ndGggPiAwO1xuXG4gIGlmICghKHNob3VsZEFkZERlZmF1bHQgfHwgc2hvdWxkQWRkU3BlY2lmaWVycyB8fCBzaG91bGRSZW1vdmVVbm5lY2Vzc2FyeSkpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcmV0dXJuIGZpeGVyID0+IHtcbiAgICBjb25zdCB0b2tlbnMgPSBzb3VyY2VDb2RlLmdldFRva2VucyhmaXJzdCk7XG4gICAgY29uc3Qgb3BlbkJyYWNlID0gdG9rZW5zLmZpbmQodG9rZW4gPT4gaXNQdW5jdHVhdG9yKHRva2VuLCAneycpKTtcbiAgICBjb25zdCBjbG9zZUJyYWNlID0gdG9rZW5zLmZpbmQodG9rZW4gPT4gaXNQdW5jdHVhdG9yKHRva2VuLCAnfScpKTtcbiAgICBjb25zdCBmaXJzdFRva2VuID0gc291cmNlQ29kZS5nZXRGaXJzdFRva2VuKGZpcnN0KTtcbiAgICBjb25zdCBbZGVmYXVsdEltcG9ydE5hbWVdID0gZGVmYXVsdEltcG9ydE5hbWVzO1xuXG4gICAgY29uc3QgZmlyc3RIYXNUcmFpbGluZ0NvbW1hID1cbiAgICAgIGNsb3NlQnJhY2UgIT0gbnVsbCAmJlxuICAgICAgaXNQdW5jdHVhdG9yKHNvdXJjZUNvZGUuZ2V0VG9rZW5CZWZvcmUoY2xvc2VCcmFjZSksICcsJyk7XG4gICAgY29uc3QgZmlyc3RJc0VtcHR5ID0gIWhhc1NwZWNpZmllcnMoZmlyc3QpO1xuXG4gICAgY29uc3QgW3NwZWNpZmllcnNUZXh0XSA9IHNwZWNpZmllcnMucmVkdWNlKFxuICAgICAgKFtyZXN1bHQsIG5lZWRzQ29tbWFdLCBzcGVjaWZpZXIpID0+IHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICBuZWVkc0NvbW1hICYmICFzcGVjaWZpZXIuaXNFbXB0eVxuICAgICAgICAgICAgPyBgJHtyZXN1bHR9LCR7c3BlY2lmaWVyLnRleHR9YFxuICAgICAgICAgICAgOiBgJHtyZXN1bHR9JHtzcGVjaWZpZXIudGV4dH1gLFxuICAgICAgICAgIHNwZWNpZmllci5pc0VtcHR5ID8gbmVlZHNDb21tYSA6IHRydWUsXG4gICAgICAgIF07XG4gICAgICB9LFxuICAgICAgWycnLCAhZmlyc3RIYXNUcmFpbGluZ0NvbW1hICYmICFmaXJzdElzRW1wdHldXG4gICAgKTtcblxuICAgIGNvbnN0IGZpeGVzID0gW107XG5cbiAgICBpZiAoc2hvdWxkQWRkRGVmYXVsdCAmJiBvcGVuQnJhY2UgPT0gbnVsbCAmJiBzaG91bGRBZGRTcGVjaWZpZXJzKSB7XG4gICAgICAvLyBgaW1wb3J0ICcuL2ZvbydgIOKGkiBgaW1wb3J0IGRlZiwgey4uLn0gZnJvbSAnLi9mb28nYFxuICAgICAgZml4ZXMucHVzaChcbiAgICAgICAgZml4ZXIuaW5zZXJ0VGV4dEFmdGVyKGZpcnN0VG9rZW4sIGAgJHtkZWZhdWx0SW1wb3J0TmFtZX0sIHske3NwZWNpZmllcnNUZXh0fX0gZnJvbWApXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAoc2hvdWxkQWRkRGVmYXVsdCAmJiBvcGVuQnJhY2UgPT0gbnVsbCAmJiAhc2hvdWxkQWRkU3BlY2lmaWVycykge1xuICAgICAgLy8gYGltcG9ydCAnLi9mb28nYCDihpIgYGltcG9ydCBkZWYgZnJvbSAnLi9mb28nYFxuICAgICAgZml4ZXMucHVzaChmaXhlci5pbnNlcnRUZXh0QWZ0ZXIoZmlyc3RUb2tlbiwgYCAke2RlZmF1bHRJbXBvcnROYW1lfSBmcm9tYCkpO1xuICAgIH0gZWxzZSBpZiAoc2hvdWxkQWRkRGVmYXVsdCAmJiBvcGVuQnJhY2UgIT0gbnVsbCAmJiBjbG9zZUJyYWNlICE9IG51bGwpIHtcbiAgICAgIC8vIGBpbXBvcnQgey4uLn0gZnJvbSAnLi9mb28nYCDihpIgYGltcG9ydCBkZWYsIHsuLi59IGZyb20gJy4vZm9vJ2BcbiAgICAgIGZpeGVzLnB1c2goZml4ZXIuaW5zZXJ0VGV4dEFmdGVyKGZpcnN0VG9rZW4sIGAgJHtkZWZhdWx0SW1wb3J0TmFtZX0sYCkpO1xuICAgICAgaWYgKHNob3VsZEFkZFNwZWNpZmllcnMpIHtcbiAgICAgICAgLy8gYGltcG9ydCBkZWYsIHsuLi59IGZyb20gJy4vZm9vJ2Ag4oaSIGBpbXBvcnQgZGVmLCB7Li4uLCAuLi59IGZyb20gJy4vZm9vJ2BcbiAgICAgICAgZml4ZXMucHVzaChmaXhlci5pbnNlcnRUZXh0QmVmb3JlKGNsb3NlQnJhY2UsIHNwZWNpZmllcnNUZXh0KSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghc2hvdWxkQWRkRGVmYXVsdCAmJiBvcGVuQnJhY2UgPT0gbnVsbCAmJiBzaG91bGRBZGRTcGVjaWZpZXJzKSB7XG4gICAgICBpZiAoZmlyc3Quc3BlY2lmaWVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgLy8gYGltcG9ydCAnLi9mb28nYCDihpIgYGltcG9ydCB7Li4ufSBmcm9tICcuL2ZvbydgXG4gICAgICAgIGZpeGVzLnB1c2goZml4ZXIuaW5zZXJ0VGV4dEFmdGVyKGZpcnN0VG9rZW4sIGAgeyR7c3BlY2lmaWVyc1RleHR9fSBmcm9tYCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gYGltcG9ydCBkZWYgZnJvbSAnLi9mb28nYCDihpIgYGltcG9ydCBkZWYsIHsuLi59IGZyb20gJy4vZm9vJ2BcbiAgICAgICAgZml4ZXMucHVzaChmaXhlci5pbnNlcnRUZXh0QWZ0ZXIoZmlyc3Quc3BlY2lmaWVyc1swXSwgYCwgeyR7c3BlY2lmaWVyc1RleHR9fWApKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCFzaG91bGRBZGREZWZhdWx0ICYmIG9wZW5CcmFjZSAhPSBudWxsICYmIGNsb3NlQnJhY2UgIT0gbnVsbCkge1xuICAgICAgLy8gYGltcG9ydCB7Li4ufSAnLi9mb28nYCDihpIgYGltcG9ydCB7Li4uLCAuLi59IGZyb20gJy4vZm9vJ2BcbiAgICAgIGZpeGVzLnB1c2goZml4ZXIuaW5zZXJ0VGV4dEJlZm9yZShjbG9zZUJyYWNlLCBzcGVjaWZpZXJzVGV4dCkpO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZSBpbXBvcnRzIHdob3NlIHNwZWNpZmllcnMgaGF2ZSBiZWVuIG1vdmVkIGludG8gdGhlIGZpcnN0IGltcG9ydC5cbiAgICBmb3IgKGNvbnN0IHNwZWNpZmllciBvZiBzcGVjaWZpZXJzKSB7XG4gICAgICBmaXhlcy5wdXNoKGZpeGVyLnJlbW92ZShzcGVjaWZpZXIuaW1wb3J0Tm9kZSkpO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZSBpbXBvcnRzIHdob3NlIGRlZmF1bHQgaW1wb3J0IGhhcyBiZWVuIG1vdmVkIHRvIHRoZSBmaXJzdCBpbXBvcnQsXG4gICAgLy8gYW5kIHNpZGUtZWZmZWN0LW9ubHkgaW1wb3J0cyB0aGF0IGFyZSB1bm5lY2Vzc2FyeSBkdWUgdG8gdGhlIGZpcnN0XG4gICAgLy8gaW1wb3J0LlxuICAgIGZvciAoY29uc3Qgbm9kZSBvZiB1bm5lY2Vzc2FyeUltcG9ydHMpIHtcbiAgICAgIGZpeGVzLnB1c2goZml4ZXIucmVtb3ZlKG5vZGUpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZml4ZXM7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGlzUHVuY3R1YXRvcihub2RlLCB2YWx1ZSkge1xuICByZXR1cm4gbm9kZS50eXBlID09PSAnUHVuY3R1YXRvcicgJiYgbm9kZS52YWx1ZSA9PT0gdmFsdWU7XG59XG5cbi8vIEdldCB0aGUgbmFtZSBvZiB0aGUgZGVmYXVsdCBpbXBvcnQgb2YgYG5vZGVgLCBpZiBhbnkuXG5mdW5jdGlvbiBnZXREZWZhdWx0SW1wb3J0TmFtZShub2RlKSB7XG4gIGNvbnN0IGRlZmF1bHRTcGVjaWZpZXIgPSBub2RlLnNwZWNpZmllcnNcbiAgICAuZmluZChzcGVjaWZpZXIgPT4gc3BlY2lmaWVyLnR5cGUgPT09ICdJbXBvcnREZWZhdWx0U3BlY2lmaWVyJyk7XG4gIHJldHVybiBkZWZhdWx0U3BlY2lmaWVyICE9IG51bGwgPyBkZWZhdWx0U3BlY2lmaWVyLmxvY2FsLm5hbWUgOiB1bmRlZmluZWQ7XG59XG5cbi8vIENoZWNrcyB3aGV0aGVyIGBub2RlYCBoYXMgYSBuYW1lc3BhY2UgaW1wb3J0LlxuZnVuY3Rpb24gaGFzTmFtZXNwYWNlKG5vZGUpIHtcbiAgY29uc3Qgc3BlY2lmaWVycyA9IG5vZGUuc3BlY2lmaWVyc1xuICAgIC5maWx0ZXIoc3BlY2lmaWVyID0+IHNwZWNpZmllci50eXBlID09PSAnSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyJyk7XG4gIHJldHVybiBzcGVjaWZpZXJzLmxlbmd0aCA+IDA7XG59XG5cbi8vIENoZWNrcyB3aGV0aGVyIGBub2RlYCBoYXMgYW55IG5vbi1kZWZhdWx0IHNwZWNpZmllcnMuXG5mdW5jdGlvbiBoYXNTcGVjaWZpZXJzKG5vZGUpIHtcbiAgY29uc3Qgc3BlY2lmaWVycyA9IG5vZGUuc3BlY2lmaWVyc1xuICAgIC5maWx0ZXIoc3BlY2lmaWVyID0+IHNwZWNpZmllci50eXBlID09PSAnSW1wb3J0U3BlY2lmaWVyJyk7XG4gIHJldHVybiBzcGVjaWZpZXJzLmxlbmd0aCA+IDA7XG59XG5cbi8vIEl0J3Mgbm90IG9idmlvdXMgd2hhdCB0aGUgdXNlciB3YW50cyB0byBkbyB3aXRoIGNvbW1lbnRzIGFzc29jaWF0ZWQgd2l0aFxuLy8gZHVwbGljYXRlIGltcG9ydHMsIHNvIHNraXAgaW1wb3J0cyB3aXRoIGNvbW1lbnRzIHdoZW4gYXV0b2ZpeGluZy5cbmZ1bmN0aW9uIGhhc1Byb2JsZW1hdGljQ29tbWVudHMobm9kZSwgc291cmNlQ29kZSkge1xuICByZXR1cm4gKFxuICAgIGhhc0NvbW1lbnRCZWZvcmUobm9kZSwgc291cmNlQ29kZSkgfHxcbiAgICBoYXNDb21tZW50QWZ0ZXIobm9kZSwgc291cmNlQ29kZSkgfHxcbiAgICBoYXNDb21tZW50SW5zaWRlTm9uU3BlY2lmaWVycyhub2RlLCBzb3VyY2VDb2RlKVxuICApO1xufVxuXG4vLyBDaGVja3Mgd2hldGhlciBgbm9kZWAgaGFzIGEgY29tbWVudCAodGhhdCBlbmRzKSBvbiB0aGUgcHJldmlvdXMgbGluZSBvciBvblxuLy8gdGhlIHNhbWUgbGluZSBhcyBgbm9kZWAgKHN0YXJ0cykuXG5mdW5jdGlvbiBoYXNDb21tZW50QmVmb3JlKG5vZGUsIHNvdXJjZUNvZGUpIHtcbiAgcmV0dXJuIHNvdXJjZUNvZGUuZ2V0Q29tbWVudHNCZWZvcmUobm9kZSlcbiAgICAuc29tZShjb21tZW50ID0+IGNvbW1lbnQubG9jLmVuZC5saW5lID49IG5vZGUubG9jLnN0YXJ0LmxpbmUgLSAxKTtcbn1cblxuLy8gQ2hlY2tzIHdoZXRoZXIgYG5vZGVgIGhhcyBhIGNvbW1lbnQgKHRoYXQgc3RhcnRzKSBvbiB0aGUgc2FtZSBsaW5lIGFzIGBub2RlYFxuLy8gKGVuZHMpLlxuZnVuY3Rpb24gaGFzQ29tbWVudEFmdGVyKG5vZGUsIHNvdXJjZUNvZGUpIHtcbiAgcmV0dXJuIHNvdXJjZUNvZGUuZ2V0Q29tbWVudHNBZnRlcihub2RlKVxuICAgIC5zb21lKGNvbW1lbnQgPT4gY29tbWVudC5sb2Muc3RhcnQubGluZSA9PT0gbm9kZS5sb2MuZW5kLmxpbmUpO1xufVxuXG4vLyBDaGVja3Mgd2hldGhlciBgbm9kZWAgaGFzIGFueSBjb21tZW50cyBfaW5zaWRlLF8gZXhjZXB0IGluc2lkZSB0aGUgYHsuLi59YFxuLy8gcGFydCAoaWYgYW55KS5cbmZ1bmN0aW9uIGhhc0NvbW1lbnRJbnNpZGVOb25TcGVjaWZpZXJzKG5vZGUsIHNvdXJjZUNvZGUpIHtcbiAgY29uc3QgdG9rZW5zID0gc291cmNlQ29kZS5nZXRUb2tlbnMobm9kZSk7XG4gIGNvbnN0IG9wZW5CcmFjZUluZGV4ID0gdG9rZW5zLmZpbmRJbmRleCh0b2tlbiA9PiBpc1B1bmN0dWF0b3IodG9rZW4sICd7JykpO1xuICBjb25zdCBjbG9zZUJyYWNlSW5kZXggPSB0b2tlbnMuZmluZEluZGV4KHRva2VuID0+IGlzUHVuY3R1YXRvcih0b2tlbiwgJ30nKSk7XG4gIC8vIFNsaWNlIGF3YXkgdGhlIGZpcnN0IHRva2VuLCBzaW5jZSB3ZSdyZSBubyBsb29raW5nIGZvciBjb21tZW50cyBfYmVmb3JlX1xuICAvLyBgbm9kZWAgKG9ubHkgaW5zaWRlKS4gSWYgdGhlcmUncyBhIGB7Li4ufWAgcGFydCwgbG9vayBmb3IgY29tbWVudHMgYmVmb3JlXG4gIC8vIHRoZSBge2AsIGJ1dCBub3QgYmVmb3JlIHRoZSBgfWAgKGhlbmNlIHRoZSBgKzFgcykuXG4gIGNvbnN0IHNvbWVUb2tlbnMgPSBvcGVuQnJhY2VJbmRleCA+PSAwICYmIGNsb3NlQnJhY2VJbmRleCA+PSAwXG4gICAgPyB0b2tlbnMuc2xpY2UoMSwgb3BlbkJyYWNlSW5kZXggKyAxKS5jb25jYXQodG9rZW5zLnNsaWNlKGNsb3NlQnJhY2VJbmRleCArIDEpKVxuICAgIDogdG9rZW5zLnNsaWNlKDEpO1xuICByZXR1cm4gc29tZVRva2Vucy5zb21lKHRva2VuID0+IHNvdXJjZUNvZGUuZ2V0Q29tbWVudHNCZWZvcmUodG9rZW4pLmxlbmd0aCA+IDApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdwcm9ibGVtJyxcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ25vLWR1cGxpY2F0ZXMnKSxcbiAgICB9LFxuICAgIGZpeGFibGU6ICdjb2RlJyxcbiAgICBzY2hlbWE6IFtcbiAgICAgIHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBjb25zaWRlclF1ZXJ5U3RyaW5nOiB7XG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYWRkaXRpb25hbFByb3BlcnRpZXM6IGZhbHNlLFxuICAgICAgfSxcbiAgICBdLFxuICB9LFxuXG4gIGNyZWF0ZTogZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICAvLyBQcmVwYXJlIHRoZSByZXNvbHZlciBmcm9tIG9wdGlvbnMuXG4gICAgY29uc3QgY29uc2lkZXJRdWVyeVN0cmluZ09wdGlvbiA9IGNvbnRleHQub3B0aW9uc1swXSAmJlxuICAgICAgY29udGV4dC5vcHRpb25zWzBdWydjb25zaWRlclF1ZXJ5U3RyaW5nJ107XG4gICAgY29uc3QgZGVmYXVsdFJlc29sdmVyID0gc291cmNlUGF0aCA9PiByZXNvbHZlKHNvdXJjZVBhdGgsIGNvbnRleHQpIHx8IHNvdXJjZVBhdGg7XG4gICAgY29uc3QgcmVzb2x2ZXIgPSBjb25zaWRlclF1ZXJ5U3RyaW5nT3B0aW9uID8gKHNvdXJjZVBhdGggPT4ge1xuICAgICAgY29uc3QgcGFydHMgPSBzb3VyY2VQYXRoLm1hdGNoKC9eKFteP10qKVxcPyguKikkLyk7XG4gICAgICBpZiAoIXBhcnRzKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0UmVzb2x2ZXIoc291cmNlUGF0aCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGVmYXVsdFJlc29sdmVyKHBhcnRzWzFdKSArICc/JyArIHBhcnRzWzJdO1xuICAgIH0pIDogZGVmYXVsdFJlc29sdmVyO1xuXG4gICAgY29uc3QgaW1wb3J0ZWQgPSBuZXcgTWFwKCk7XG4gICAgY29uc3QgbnNJbXBvcnRlZCA9IG5ldyBNYXAoKTtcbiAgICBjb25zdCB0eXBlc0ltcG9ydGVkID0gbmV3IE1hcCgpO1xuICAgIHJldHVybiB7XG4gICAgICAnSW1wb3J0RGVjbGFyYXRpb24nOiBmdW5jdGlvbiAobikge1xuICAgICAgICAvLyByZXNvbHZlZCBwYXRoIHdpbGwgY292ZXIgYWxpYXNlZCBkdXBsaWNhdGVzXG4gICAgICAgIGNvbnN0IHJlc29sdmVkUGF0aCA9IHJlc29sdmVyKG4uc291cmNlLnZhbHVlKTtcbiAgICAgICAgY29uc3QgaW1wb3J0TWFwID0gbi5pbXBvcnRLaW5kID09PSAndHlwZScgPyB0eXBlc0ltcG9ydGVkIDpcbiAgICAgICAgICAoaGFzTmFtZXNwYWNlKG4pID8gbnNJbXBvcnRlZCA6IGltcG9ydGVkKTtcblxuICAgICAgICBpZiAoaW1wb3J0TWFwLmhhcyhyZXNvbHZlZFBhdGgpKSB7XG4gICAgICAgICAgaW1wb3J0TWFwLmdldChyZXNvbHZlZFBhdGgpLnB1c2gobik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW1wb3J0TWFwLnNldChyZXNvbHZlZFBhdGgsIFtuXSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgICdQcm9ncmFtOmV4aXQnOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNoZWNrSW1wb3J0cyhpbXBvcnRlZCwgY29udGV4dCk7XG4gICAgICAgIGNoZWNrSW1wb3J0cyhuc0ltcG9ydGVkLCBjb250ZXh0KTtcbiAgICAgICAgY2hlY2tJbXBvcnRzKHR5cGVzSW1wb3J0ZWQsIGNvbnRleHQpO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxufTtcbiJdfQ==