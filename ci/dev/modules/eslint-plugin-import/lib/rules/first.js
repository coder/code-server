'use strict';var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function getImportValue(node) {
  return node.type === 'ImportDeclaration' ?
  node.source.value :
  node.moduleReference.expression.value;
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('first') },

    fixable: 'code',
    schema: [
    {
      type: 'string',
      enum: ['absolute-first', 'disable-absolute-first'] }] },




  create: function (context) {
    function isPossibleDirective(node) {
      return node.type === 'ExpressionStatement' &&
      node.expression.type === 'Literal' &&
      typeof node.expression.value === 'string';
    }

    return {
      'Program': function (n) {
        const body = n.body;
        const absoluteFirst = context.options[0] === 'absolute-first';
        const message = 'Import in body of module; reorder to top.';
        const sourceCode = context.getSourceCode();
        const originSourceCode = sourceCode.getText();
        let nonImportCount = 0;
        let anyExpressions = false;
        let anyRelative = false;
        let lastLegalImp = null;
        const errorInfos = [];
        let shouldSort = true;
        let lastSortNodesIndex = 0;
        body.forEach(function (node, index) {
          if (!anyExpressions && isPossibleDirective(node)) {
            return;
          }

          anyExpressions = true;

          if (node.type === 'ImportDeclaration' || node.type === 'TSImportEqualsDeclaration') {
            if (absoluteFirst) {
              if (/^\./.test(getImportValue(node))) {
                anyRelative = true;
              } else if (anyRelative) {
                context.report({
                  node: node.type === 'ImportDeclaration' ? node.source : node.moduleReference,
                  message: 'Absolute imports should come before relative imports.' });

              }
            }
            if (nonImportCount > 0) {
              for (const variable of context.getDeclaredVariables(node)) {
                if (!shouldSort) break;
                const references = variable.references;
                if (references.length) {
                  for (const reference of references) {
                    if (reference.identifier.range[0] < node.range[1]) {
                      shouldSort = false;
                      break;
                    }
                  }
                }
              }
              shouldSort && (lastSortNodesIndex = errorInfos.length);
              errorInfos.push({
                node,
                range: [body[index - 1].range[1], node.range[1]] });

            } else {
              lastLegalImp = node;
            }
          } else {
            nonImportCount++;
          }
        });
        if (!errorInfos.length) return;
        errorInfos.forEach(function (errorInfo, index) {
          const node = errorInfo.node;
          const infos = {
            node,
            message };

          if (index < lastSortNodesIndex) {
            infos.fix = function (fixer) {
              return fixer.insertTextAfter(node, '');
            };
          } else if (index === lastSortNodesIndex) {
            const sortNodes = errorInfos.slice(0, lastSortNodesIndex + 1);
            infos.fix = function (fixer) {
              const removeFixers = sortNodes.map(function (_errorInfo) {
                return fixer.removeRange(_errorInfo.range);
              });
              const range = [0, removeFixers[removeFixers.length - 1].range[1]];
              let insertSourceCode = sortNodes.map(function (_errorInfo) {
                const nodeSourceCode = String.prototype.slice.apply(
                originSourceCode, _errorInfo.range);

                if (/\S/.test(nodeSourceCode[0])) {
                  return '\n' + nodeSourceCode;
                }
                return nodeSourceCode;
              }).join('');
              let insertFixer = null;
              let replaceSourceCode = '';
              if (!lastLegalImp) {
                insertSourceCode =
                insertSourceCode.trim() + insertSourceCode.match(/^(\s+)/)[0];
              }
              insertFixer = lastLegalImp ?
              fixer.insertTextAfter(lastLegalImp, insertSourceCode) :
              fixer.insertTextBefore(body[0], insertSourceCode);
              const fixers = [insertFixer].concat(removeFixers);
              fixers.forEach(function (computedFixer, i) {
                replaceSourceCode += originSourceCode.slice(
                fixers[i - 1] ? fixers[i - 1].range[1] : 0, computedFixer.range[0]) +
                computedFixer.text;
              });
              return fixer.replaceTextRange(range, replaceSourceCode);
            };
          }
          context.report(infos);
        });
      } };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9maXJzdC5qcyJdLCJuYW1lcyI6WyJnZXRJbXBvcnRWYWx1ZSIsIm5vZGUiLCJ0eXBlIiwic291cmNlIiwidmFsdWUiLCJtb2R1bGVSZWZlcmVuY2UiLCJleHByZXNzaW9uIiwibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJkb2NzIiwidXJsIiwiZml4YWJsZSIsInNjaGVtYSIsImVudW0iLCJjcmVhdGUiLCJjb250ZXh0IiwiaXNQb3NzaWJsZURpcmVjdGl2ZSIsIm4iLCJib2R5IiwiYWJzb2x1dGVGaXJzdCIsIm9wdGlvbnMiLCJtZXNzYWdlIiwic291cmNlQ29kZSIsImdldFNvdXJjZUNvZGUiLCJvcmlnaW5Tb3VyY2VDb2RlIiwiZ2V0VGV4dCIsIm5vbkltcG9ydENvdW50IiwiYW55RXhwcmVzc2lvbnMiLCJhbnlSZWxhdGl2ZSIsImxhc3RMZWdhbEltcCIsImVycm9ySW5mb3MiLCJzaG91bGRTb3J0IiwibGFzdFNvcnROb2Rlc0luZGV4IiwiZm9yRWFjaCIsImluZGV4IiwidGVzdCIsInJlcG9ydCIsInZhcmlhYmxlIiwiZ2V0RGVjbGFyZWRWYXJpYWJsZXMiLCJyZWZlcmVuY2VzIiwibGVuZ3RoIiwicmVmZXJlbmNlIiwiaWRlbnRpZmllciIsInJhbmdlIiwicHVzaCIsImVycm9ySW5mbyIsImluZm9zIiwiZml4IiwiZml4ZXIiLCJpbnNlcnRUZXh0QWZ0ZXIiLCJzb3J0Tm9kZXMiLCJzbGljZSIsInJlbW92ZUZpeGVycyIsIm1hcCIsIl9lcnJvckluZm8iLCJyZW1vdmVSYW5nZSIsImluc2VydFNvdXJjZUNvZGUiLCJub2RlU291cmNlQ29kZSIsIlN0cmluZyIsInByb3RvdHlwZSIsImFwcGx5Iiwiam9pbiIsImluc2VydEZpeGVyIiwicmVwbGFjZVNvdXJjZUNvZGUiLCJ0cmltIiwibWF0Y2giLCJpbnNlcnRUZXh0QmVmb3JlIiwiZml4ZXJzIiwiY29uY2F0IiwiY29tcHV0ZWRGaXhlciIsImkiLCJ0ZXh0IiwicmVw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bEIwQiw4QkFBY0UsSUFGbEI7QUFHRCxlQUpEO0FBS0EscUJBQU92QixNQUFNd0IsZ0JBQU4sQ0FBdUI3QixLQUF2QixFQUE4Qm9CLGlCQUE5QixDQUFQO0FBQ0QsYUE5QkQ7QUErQkQ7QUFDRGhELGtCQUFRcUIsTUFBUixDQUFlVSxLQUFmO0FBQ0QsU0E3Q0Q7QUE4Q0QsT0F4R0ksRUFBUDs7QUEwR0QsR0FoSWMsRUFBakIiLCJmaWxlIjoiZmlyc3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJztcblxuZnVuY3Rpb24gZ2V0SW1wb3J0VmFsdWUobm9kZSkge1xuICByZXR1cm4gbm9kZS50eXBlID09PSAnSW1wb3J0RGVjbGFyYXRpb24nXG4gICAgPyBub2RlLnNvdXJjZS52YWx1ZVxuICAgIDogbm9kZS5tb2R1bGVSZWZlcmVuY2UuZXhwcmVzc2lvbi52YWx1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGE6IHtcbiAgICB0eXBlOiAnc3VnZ2VzdGlvbicsXG4gICAgZG9jczoge1xuICAgICAgdXJsOiBkb2NzVXJsKCdmaXJzdCcpLFxuICAgIH0sXG4gICAgZml4YWJsZTogJ2NvZGUnLFxuICAgIHNjaGVtYTogW1xuICAgICAge1xuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgZW51bTogWydhYnNvbHV0ZS1maXJzdCcsICdkaXNhYmxlLWFic29sdXRlLWZpcnN0J10sXG4gICAgICB9LFxuICAgIF0sXG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbiAoY29udGV4dCkge1xuICAgIGZ1bmN0aW9uIGlzUG9zc2libGVEaXJlY3RpdmUgKG5vZGUpIHtcbiAgICAgIHJldHVybiBub2RlLnR5cGUgPT09ICdFeHByZXNzaW9uU3RhdGVtZW50JyAmJlxuICAgICAgICBub2RlLmV4cHJlc3Npb24udHlwZSA9PT0gJ0xpdGVyYWwnICYmXG4gICAgICAgIHR5cGVvZiBub2RlLmV4cHJlc3Npb24udmFsdWUgPT09ICdzdHJpbmcnO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAnUHJvZ3JhbSc6IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgIGNvbnN0IGJvZHkgPSBuLmJvZHk7XG4gICAgICAgIGNvbnN0IGFic29sdXRlRmlyc3QgPSBjb250ZXh0Lm9wdGlvbnNbMF0gPT09ICdhYnNvbHV0ZS1maXJzdCc7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSAnSW1wb3J0IGluIGJvZHkgb2YgbW9kdWxlOyByZW9yZGVyIHRvIHRvcC4nO1xuICAgICAgICBjb25zdCBzb3VyY2VDb2RlID0gY29udGV4dC5nZXRTb3VyY2VDb2RlKCk7XG4gICAgICAgIGNvbnN0IG9yaWdpblNvdXJjZUNvZGUgPSBzb3VyY2VDb2RlLmdldFRleHQoKTtcbiAgICAgICAgbGV0IG5vbkltcG9ydENvdW50ID0gMDtcbiAgICAgICAgbGV0IGFueUV4cHJlc3Npb25zID0gZmFsc2U7XG4gICAgICAgIGxldCBhbnlSZWxhdGl2ZSA9IGZhbHNlO1xuICAgICAgICBsZXQgbGFzdExlZ2FsSW1wID0gbnVsbDtcbiAgICAgICAgY29uc3QgZXJyb3JJbmZvcyA9IFtdO1xuICAgICAgICBsZXQgc2hvdWxkU29ydCA9IHRydWU7XG4gICAgICAgIGxldCBsYXN0U29ydE5vZGVzSW5kZXggPSAwO1xuICAgICAgICBib2R5LmZvckVhY2goZnVuY3Rpb24gKG5vZGUsIGluZGV4KXtcbiAgICAgICAgICBpZiAoIWFueUV4cHJlc3Npb25zICYmIGlzUG9zc2libGVEaXJlY3RpdmUobm9kZSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhbnlFeHByZXNzaW9ucyA9IHRydWU7XG5cbiAgICAgICAgICBpZiAobm9kZS50eXBlID09PSAnSW1wb3J0RGVjbGFyYXRpb24nIHx8IG5vZGUudHlwZSA9PT0gJ1RTSW1wb3J0RXF1YWxzRGVjbGFyYXRpb24nKSB7XG4gICAgICAgICAgICBpZiAoYWJzb2x1dGVGaXJzdCkge1xuICAgICAgICAgICAgICBpZiAoL15cXC4vLnRlc3QoZ2V0SW1wb3J0VmFsdWUobm9kZSkpKSB7XG4gICAgICAgICAgICAgICAgYW55UmVsYXRpdmUgPSB0cnVlO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFueVJlbGF0aXZlKSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgICAgICAgICAgbm9kZTogbm9kZS50eXBlID09PSAnSW1wb3J0RGVjbGFyYXRpb24nID8gbm9kZS5zb3VyY2UgOiBub2RlLm1vZHVsZVJlZmVyZW5jZSxcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdBYnNvbHV0ZSBpbXBvcnRzIHNob3VsZCBjb21lIGJlZm9yZSByZWxhdGl2ZSBpbXBvcnRzLicsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub25JbXBvcnRDb3VudCA+IDApIHtcbiAgICAgICAgICAgICAgZm9yIChjb25zdCB2YXJpYWJsZSBvZiBjb250ZXh0LmdldERlY2xhcmVkVmFyaWFibGVzKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzaG91bGRTb3J0KSBicmVhaztcbiAgICAgICAgICAgICAgICBjb25zdCByZWZlcmVuY2VzID0gdmFyaWFibGUucmVmZXJlbmNlcztcbiAgICAgICAgICAgICAgICBpZiAocmVmZXJlbmNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcmVmZXJlbmNlIG9mIHJlZmVyZW5jZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlZmVyZW5jZS5pZGVudGlmaWVyLnJhbmdlWzBdIDwgbm9kZS5yYW5nZVsxXSkge1xuICAgICAgICAgICAgICAgICAgICAgIHNob3VsZFNvcnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzaG91bGRTb3J0ICYmIChsYXN0U29ydE5vZGVzSW5kZXggPSBlcnJvckluZm9zLmxlbmd0aCk7XG4gICAgICAgICAgICAgIGVycm9ySW5mb3MucHVzaCh7XG4gICAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAgICByYW5nZTogW2JvZHlbaW5kZXggLSAxXS5yYW5nZVsxXSwgbm9kZS5yYW5nZVsxXV0sXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbGFzdExlZ2FsSW1wID0gbm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9uSW1wb3J0Q291bnQrKztcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIWVycm9ySW5mb3MubGVuZ3RoKSByZXR1cm47XG4gICAgICAgIGVycm9ySW5mb3MuZm9yRWFjaChmdW5jdGlvbiAoZXJyb3JJbmZvLCBpbmRleCkge1xuICAgICAgICAgIGNvbnN0IG5vZGUgPSBlcnJvckluZm8ubm9kZTtcbiAgICAgICAgICBjb25zdCBpbmZvcyA9IHtcbiAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgIH07XG4gICAgICAgICAgaWYgKGluZGV4IDwgbGFzdFNvcnROb2Rlc0luZGV4KSB7XG4gICAgICAgICAgICBpbmZvcy5maXggPSBmdW5jdGlvbiAoZml4ZXIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZpeGVyLmluc2VydFRleHRBZnRlcihub2RlLCAnJyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0gZWxzZSBpZiAoaW5kZXggPT09IGxhc3RTb3J0Tm9kZXNJbmRleCkge1xuICAgICAgICAgICAgY29uc3Qgc29ydE5vZGVzID0gZXJyb3JJbmZvcy5zbGljZSgwLCBsYXN0U29ydE5vZGVzSW5kZXggKyAxKTtcbiAgICAgICAgICAgIGluZm9zLmZpeCA9IGZ1bmN0aW9uIChmaXhlcikge1xuICAgICAgICAgICAgICBjb25zdCByZW1vdmVGaXhlcnMgPSBzb3J0Tm9kZXMubWFwKGZ1bmN0aW9uIChfZXJyb3JJbmZvKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpeGVyLnJlbW92ZVJhbmdlKF9lcnJvckluZm8ucmFuZ2UpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgY29uc3QgcmFuZ2UgPSBbMCwgcmVtb3ZlRml4ZXJzW3JlbW92ZUZpeGVycy5sZW5ndGggLSAxXS5yYW5nZVsxXV07XG4gICAgICAgICAgICAgIGxldCBpbnNlcnRTb3VyY2VDb2RlID0gc29ydE5vZGVzLm1hcChmdW5jdGlvbiAoX2Vycm9ySW5mbykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVTb3VyY2VDb2RlID0gU3RyaW5nLnByb3RvdHlwZS5zbGljZS5hcHBseShcbiAgICAgICAgICAgICAgICAgIG9yaWdpblNvdXJjZUNvZGUsIF9lcnJvckluZm8ucmFuZ2VcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGlmICgvXFxTLy50ZXN0KG5vZGVTb3VyY2VDb2RlWzBdKSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXG4nICsgbm9kZVNvdXJjZUNvZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlU291cmNlQ29kZTtcbiAgICAgICAgICAgICAgfSkuam9pbignJyk7XG4gICAgICAgICAgICAgIGxldCBpbnNlcnRGaXhlciA9IG51bGw7XG4gICAgICAgICAgICAgIGxldCByZXBsYWNlU291cmNlQ29kZSA9ICcnO1xuICAgICAgICAgICAgICBpZiAoIWxhc3RMZWdhbEltcCkge1xuICAgICAgICAgICAgICAgIGluc2VydFNvdXJjZUNvZGUgPVxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRTb3VyY2VDb2RlLnRyaW0oKSArIGluc2VydFNvdXJjZUNvZGUubWF0Y2goL14oXFxzKykvKVswXTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpbnNlcnRGaXhlciA9IGxhc3RMZWdhbEltcCA/XG4gICAgICAgICAgICAgICAgZml4ZXIuaW5zZXJ0VGV4dEFmdGVyKGxhc3RMZWdhbEltcCwgaW5zZXJ0U291cmNlQ29kZSkgOlxuICAgICAgICAgICAgICAgIGZpeGVyLmluc2VydFRleHRCZWZvcmUoYm9keVswXSwgaW5zZXJ0U291cmNlQ29kZSk7XG4gICAgICAgICAgICAgIGNvbnN0IGZpeGVycyA9IFtpbnNlcnRGaXhlcl0uY29uY2F0KHJlbW92ZUZpeGVycyk7XG4gICAgICAgICAgICAgIGZpeGVycy5mb3JFYWNoKGZ1bmN0aW9uIChjb21wdXRlZEZpeGVyLCBpKSB7XG4gICAgICAgICAgICAgICAgcmVwbGFjZVNvdXJjZUNvZGUgKz0gKG9yaWdpblNvdXJjZUNvZGUuc2xpY2UoXG4gICAgICAgICAgICAgICAgICBmaXhlcnNbaSAtIDFdID8gZml4ZXJzW2kgLSAxXS5yYW5nZVsxXSA6IDAsIGNvbXB1dGVkRml4ZXIucmFuZ2VbMF1cbiAgICAgICAgICAgICAgICApICsgY29tcHV0ZWRGaXhlci50ZXh0KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBmaXhlci5yZXBsYWNlVGV4dFJhbmdlKHJhbmdlLCByZXBsYWNlU291cmNlQ29kZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb250ZXh0LnJlcG9ydChpbmZvcyk7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxufTtcbiJdfQ==