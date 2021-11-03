'use strict';




var _staticRequire = require('../core/staticRequire');var _staticRequire2 = _interopRequireDefault(_staticRequire);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);

var _debug = require('debug');var _debug2 = _interopRequireDefault(_debug);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}
const log = (0, _debug2.default)('eslint-plugin-import:rules:newline-after-import');

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------
/**
 * @fileoverview Rule to enforce new line after import not followed by another import.
 * @author Radek Benkel
 */function containsNodeOrEqual(outerNode, innerNode) {return outerNode.range[0] <= innerNode.range[0] && outerNode.range[1] >= innerNode.range[1];}

function getScopeBody(scope) {
  if (scope.block.type === 'SwitchStatement') {
    log('SwitchStatement scopes not supported');
    return null;
  }const

  body = scope.block.body;
  if (body && body.type === 'BlockStatement') {
    return body.body;
  }

  return body;
}

function findNodeIndexInScopeBody(body, nodeToFind) {
  return body.findIndex(node => containsNodeOrEqual(node, nodeToFind));
}

function getLineDifference(node, nextNode) {
  return nextNode.loc.start.line - node.loc.end.line;
}

function isClassWithDecorator(node) {
  return node.type === 'ClassDeclaration' && node.decorators && node.decorators.length;
}

function isExportDefaultClass(node) {
  return node.type === 'ExportDefaultDeclaration' && node.declaration.type === 'ClassDeclaration';
}

function isExportNameClass(node) {

  return node.type === 'ExportNamedDeclaration' && node.declaration && node.declaration.type === 'ClassDeclaration';
}

module.exports = {
  meta: {
    type: 'layout',
    docs: {
      url: (0, _docsUrl2.default)('newline-after-import') },

    fixable: 'whitespace',
    schema: [
    {
      'type': 'object',
      'properties': {
        'count': {
          'type': 'integer',
          'minimum': 1 } },


      'additionalProperties': false }] },



  create: function (context) {
    let level = 0;
    const requireCalls = [];

    function checkForNewLine(node, nextNode, type) {
      if (isExportDefaultClass(nextNode) || isExportNameClass(nextNode)) {
        const classNode = nextNode.declaration;

        if (isClassWithDecorator(classNode)) {
          nextNode = classNode.decorators[0];
        }
      } else if (isClassWithDecorator(nextNode)) {
        nextNode = nextNode.decorators[0];
      }

      const options = context.options[0] || { count: 1 };
      const lineDifference = getLineDifference(node, nextNode);
      const EXPECTED_LINE_DIFFERENCE = options.count + 1;

      if (lineDifference < EXPECTED_LINE_DIFFERENCE) {
        let column = node.loc.start.column;

        if (node.loc.start.line !== node.loc.end.line) {
          column = 0;
        }

        context.report({
          loc: {
            line: node.loc.end.line,
            column },

          message: `Expected ${options.count} empty line${options.count > 1 ? 's' : ''} \
after ${type} statement not followed by another ${type}.`,
          fix: fixer => fixer.insertTextAfter(
          node,
          '\n'.repeat(EXPECTED_LINE_DIFFERENCE - lineDifference)) });


      }
    }

    function incrementLevel() {
      level++;
    }
    function decrementLevel() {
      level--;
    }

    function checkImport(node) {const
      parent = node.parent;
      const nodePosition = parent.body.indexOf(node);
      const nextNode = parent.body[nodePosition + 1];

      // skip "export import"s
      if (node.type === 'TSImportEqualsDeclaration' && node.isExport) {
        return;
      }

      if (nextNode && nextNode.type !== 'ImportDeclaration' && (nextNode.type !== 'TSImportEqualsDeclaration' || nextNode.isExport)) {
        checkForNewLine(node, nextNode, 'import');
      }
    }

    return {
      ImportDeclaration: checkImport,
      TSImportEqualsDeclaration: checkImport,
      CallExpression: function (node) {
        if ((0, _staticRequire2.default)(node) && level === 0) {
          requireCalls.push(node);
        }
      },
      'Program:exit': function () {
        log('exit processing for', context.getFilename());
        const scopeBody = getScopeBody(context.getScope());
        log('got scope:', scopeBody);

        requireCalls.forEach(function (node, index) {
          const nodePosition = findNodeIndexInScopeBody(scopeBody, node);
          log('node position in scope:', nodePosition);

          const statementWithRequireCall = scopeBody[nodePosition];
          const nextStatement = scopeBody[nodePosition + 1];
          const nextRequireCall = requireCalls[index + 1];

          if (nextRequireCall && containsNodeOrEqual(statementWithRequireCall, nextRequireCall)) {
            return;
          }

          if (nextStatement && (
          !nextRequireCall || !containsNodeOrEqual(nextStatement, nextRequireCall))) {

            checkForNewLine(statementWithRequireCall, nextStatement, 'require');
          }
        });
      },
      FunctionDeclaration: incrementLevel,
      FunctionExpression: incrementLevel,
      ArrowFunctionExpression: incrementLevel,
      BlockStatement: incrementLevel,
      ObjectExpression: incrementLevel,
      Decorator: incrementLevel,
      'FunctionDeclaration:exit': decrementLevel,
      'FunctionExpression:exit': decrementLevel,
      'ArrowFunctionExpression:exit': decrementLevel,
      'BlockStatement:exit': decrementLevel,
      'ObjectExpression:exit': decrementLevel,
      'Decorator:exit': decrementLevel };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uZXdsaW5lLWFmdGVyLWltcG9ydC5qcyJdLCJuYW1lcyI6WyJsb2ciLCJjb250YWluc05vZGVPckVxdWFsIiwib3V0ZXJOb2RlIiwiaW5uZXJOb2RlIiwicmFuZ2UiLCJnZXRTY29wZUJvZHkiLCJzY29wZSIsImJsb2NrIiwidHlwZSIsImJvZHkiLCJmaW5kTm9kZUluZGV4SW5TY29wZUJvZHkiLCJub2RlVG9GaW5kIiwiZmluZEluZGV4Iiwibm9kZSIsImdldExpbmVEaWZmZXJlbmNlIiwibmV4dE5vZGUiLCJsb2MiLCJzdGFydCIsImxpbmUiLCJlbmQiLCJpc0NsYXNzV2l0aERlY29yYXRvciIsImRlY29yYXRvcnMiLCJsZW5ndGgiLCJpc0V4cG9ydERlZmF1bHRDbGFzcyIsImRlY2xhcmF0aW9uIiwiaXNFeHBvcnROYW1lQ2xhc3MiLCJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsImRvY3MiLCJ1cmwiLCJmaXhhYmxlIiwic2NoZW1hIiwiY3JlYXRlIiwiY29udGV4dCIsImxldmVsIiwicmVxdWlyZUNhbGxzIiwiY2hlY2tGb3JOZXdMaW5lIiwiY2xhc3NOb2RlIiwib3B0aW9ucyIsImNvdW50IiwibGluZURpZmZlcmVuY2UiLCJFWFBFQ1RFRF9MSU5FX0RJRkZFUkVOQ0UiLCJjb2x1bW4iLCJyZXBvcnQiLCJtZXNzYWdlIiwiZml4IiwiZml4ZXIiLCJpbnNlcnRUZXh0QWZ0ZXIiLCJyZXBlYXQiLCJpbmNyZW1lbnRMZXZlbCIsImRlY3JlbWVudExldmVsIiwiY2hlY2tJbXBvcnQiLCJwYXJlbnQiLCJub2RlUG9zaXRpb24iLCJpbmRleE9mIiwiaXNFeHBvcnQiLCJJbXBvcnREZWNsYXJhdGlvbiIsIlRTSW1wb3J0RXF1YWxzRGVjbGFyYXRpb24iLCJDYWxsRXhwcmVzc2lvbiIsInB1c2giLCJnZXRGaWxlbmFtZSIsInNjb3BlQm9keSIsImdldFNjb3BlIiwiZm9yRWFjaCIsImluZGV4Iiwic3RhdGVtZW50V2l0aFJlcXVpcmVDYWxsIiwibmV4dFN0YXRlbWVudCIsIm5leHRSZXF1aXJlQ2FsbCIsIkZ1bmN0aW9uRGVjbGFyYXRpb24iLCJGdW5jdGlvbkV4cHJlc3Npb24iLCJBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbiIsIkJsb2NrU3RhdGVtZW50IiwiT2JqZWN0RXhwcmVzc2lvbiIsIkRlY29yYXRvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFLQSxzRDtBQUNBLHFDOztBQUVBLDhCO0FBQ0EsTUFBTUEsTUFBTSxxQkFBTSxpREFBTixDQUFaOztBQUVBO0FBQ0E7QUFDQTtBQWJBOzs7R0FlQSxTQUFTQyxtQkFBVCxDQUE2QkMsU0FBN0IsRUFBd0NDLFNBQXhDLEVBQW1ELENBQ2pELE9BQU9ELFVBQVVFLEtBQVYsQ0FBZ0IsQ0FBaEIsS0FBc0JELFVBQVVDLEtBQVYsQ0FBZ0IsQ0FBaEIsQ0FBdEIsSUFBNENGLFVBQVVFLEtBQVYsQ0FBZ0IsQ0FBaEIsS0FBc0JELFVBQVVDLEtBQVYsQ0FBZ0IsQ0FBaEIsQ0FBekUsQ0FDRDs7QUFFRCxTQUFTQyxZQUFULENBQXNCQyxLQUF0QixFQUE2QjtBQUMzQixNQUFJQSxNQUFNQyxLQUFOLENBQVlDLElBQVosS0FBcUIsaUJBQXpCLEVBQTRDO0FBQzFDUixRQUFJLHNDQUFKO0FBQ0EsV0FBTyxJQUFQO0FBQ0QsR0FKMEI7O0FBTW5CUyxNQU5tQixHQU1WSCxNQUFNQyxLQU5JLENBTW5CRSxJQU5tQjtBQU8zQixNQUFJQSxRQUFRQSxLQUFLRCxJQUFMLEtBQWMsZ0JBQTFCLEVBQTRDO0FBQzFDLFdBQU9DLEtBQUtBLElBQVo7QUFDRDs7QUFFRCxTQUFPQSxJQUFQO0FBQ0Q7O0FBRUQsU0FBU0Msd0JBQVQsQ0FBa0NELElBQWxDLEVBQXdDRSxVQUF4QyxFQUFvRDtBQUNsRCxTQUFPRixLQUFLRyxTQUFMLENBQWdCQyxJQUFELElBQVVaLG9CQUFvQlksSUFBcEIsRUFBMEJGLFVBQTFCLENBQXpCLENBQVA7QUFDRDs7QUFFRCxTQUFTRyxpQkFBVCxDQUEyQkQsSUFBM0IsRUFBaUNFLFFBQWpD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LEVBQWdCb0QsS0FBaEIsRUFBdUI7QUFDMUMsZ0JBQU1YLGVBQWU1Qyx5QkFBeUJvRCxTQUF6QixFQUFvQ2pELElBQXBDLENBQXJCO0FBQ0FiLGNBQUkseUJBQUosRUFBK0JzRCxZQUEvQjs7QUFFQSxnQkFBTVksMkJBQTJCSixVQUFVUixZQUFWLENBQWpDO0FBQ0EsZ0JBQU1hLGdCQUFnQkwsVUFBVVIsZUFBZSxDQUF6QixDQUF0QjtBQUNBLGdCQUFNYyxrQkFBa0JoQyxhQUFhNkIsUUFBUSxDQUFyQixDQUF4Qjs7QUFFQSxjQUFJRyxtQkFBbUJuRSxvQkFBb0JpRSx3QkFBcEIsRUFBOENFLGVBQTlDLENBQXZCLEVBQXVGO0FBQ3JGO0FBQ0Q7O0FBRUQsY0FBSUQ7QUFDQSxXQUFDQyxlQUFELElBQW9CLENBQUNuRSxvQkFBb0JrRSxhQUFwQixFQUFtQ0MsZUFBbkMsQ0FEckIsQ0FBSixFQUMrRTs7QUFFN0UvQiw0QkFBZ0I2Qix3QkFBaEIsRUFBMENDLGFBQTFDLEVBQXlELFNBQXpEO0FBQ0Q7QUFDRixTQWpCRDtBQWtCRCxPQS9CSTtBQWdDTEUsMkJBQXFCbkIsY0FoQ2hCO0FBaUNMb0IsMEJBQW9CcEIsY0FqQ2Y7QUFrQ0xxQiwrQkFBeUJyQixjQWxDcEI7QUFtQ0xzQixzQkFBZ0J0QixjQW5DWDtBQW9DTHVCLHdCQUFrQnZCLGNBcENiO0FBcUNMd0IsaUJBQVd4QixjQXJDTjtBQXNDTCxrQ0FBNEJDLGNBdEN2QjtBQXVDTCxpQ0FBMkJBLGNBdkN0QjtBQXdDTCxzQ0FBZ0NBLGNBeEMzQjtBQXlDTCw2QkFBdUJBLGNBekNsQjtBQTBDTCwrQkFBeUJBLGNBMUNwQjtBQTJDTCx3QkFBa0JBLGNBM0NiLEVBQVA7O0FBNkNELEdBaEljLEVBQWpCIiwiZmlsZSI6Im5ld2xpbmUtYWZ0ZXItaW1wb3J0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFJ1bGUgdG8gZW5mb3JjZSBuZXcgbGluZSBhZnRlciBpbXBvcnQgbm90IGZvbGxvd2VkIGJ5IGFub3RoZXIgaW1wb3J0LlxuICogQGF1dGhvciBSYWRlayBCZW5rZWxcbiAqL1xuXG5pbXBvcnQgaXNTdGF0aWNSZXF1aXJlIGZyb20gJy4uL2NvcmUvc3RhdGljUmVxdWlyZSc7XG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJztcblxuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbmNvbnN0IGxvZyA9IGRlYnVnKCdlc2xpbnQtcGx1Z2luLWltcG9ydDpydWxlczpuZXdsaW5lLWFmdGVyLWltcG9ydCcpO1xuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUnVsZSBEZWZpbml0aW9uXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5mdW5jdGlvbiBjb250YWluc05vZGVPckVxdWFsKG91dGVyTm9kZSwgaW5uZXJOb2RlKSB7XG4gIHJldHVybiBvdXRlck5vZGUucmFuZ2VbMF0gPD0gaW5uZXJOb2RlLnJhbmdlWzBdICYmIG91dGVyTm9kZS5yYW5nZVsxXSA+PSBpbm5lck5vZGUucmFuZ2VbMV07XG59XG5cbmZ1bmN0aW9uIGdldFNjb3BlQm9keShzY29wZSkge1xuICBpZiAoc2NvcGUuYmxvY2sudHlwZSA9PT0gJ1N3aXRjaFN0YXRlbWVudCcpIHtcbiAgICBsb2coJ1N3aXRjaFN0YXRlbWVudCBzY29wZXMgbm90IHN1cHBvcnRlZCcpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgeyBib2R5IH0gPSBzY29wZS5ibG9jaztcbiAgaWYgKGJvZHkgJiYgYm9keS50eXBlID09PSAnQmxvY2tTdGF0ZW1lbnQnKSB7XG4gICAgcmV0dXJuIGJvZHkuYm9keTtcbiAgfVxuXG4gIHJldHVybiBib2R5O1xufVxuXG5mdW5jdGlvbiBmaW5kTm9kZUluZGV4SW5TY29wZUJvZHkoYm9keSwgbm9kZVRvRmluZCkge1xuICByZXR1cm4gYm9keS5maW5kSW5kZXgoKG5vZGUpID0+IGNvbnRhaW5zTm9kZU9yRXF1YWwobm9kZSwgbm9kZVRvRmluZCkpO1xufVxuXG5mdW5jdGlvbiBnZXRMaW5lRGlmZmVyZW5jZShub2RlLCBuZXh0Tm9kZSkge1xuICByZXR1cm4gbmV4dE5vZGUubG9jLnN0YXJ0LmxpbmUgLSBub2RlLmxvYy5lbmQubGluZTtcbn1cblxuZnVuY3Rpb24gaXNDbGFzc1dpdGhEZWNvcmF0b3Iobm9kZSkge1xuICByZXR1cm4gbm9kZS50eXBlID09PSAnQ2xhc3NEZWNsYXJhdGlvbicgJiYgbm9kZS5kZWNvcmF0b3JzICYmIG5vZGUuZGVjb3JhdG9ycy5sZW5ndGg7XG59XG5cbmZ1bmN0aW9uIGlzRXhwb3J0RGVmYXVsdENsYXNzKG5vZGUpIHtcbiAgcmV0dXJuIG5vZGUudHlwZSA9PT0gJ0V4cG9ydERlZmF1bHREZWNsYXJhdGlvbicgJiYgbm9kZS5kZWNsYXJhdGlvbi50eXBlID09PSAnQ2xhc3NEZWNsYXJhdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzRXhwb3J0TmFtZUNsYXNzKG5vZGUpIHtcbiAgXG4gIHJldHVybiBub2RlLnR5cGUgPT09ICdFeHBvcnROYW1lZERlY2xhcmF0aW9uJyAmJiBub2RlLmRlY2xhcmF0aW9uICYmIG5vZGUuZGVjbGFyYXRpb24udHlwZSA9PT0gJ0NsYXNzRGVjbGFyYXRpb24nO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdsYXlvdXQnLFxuICAgIGRvY3M6IHtcbiAgICAgIHVybDogZG9jc1VybCgnbmV3bGluZS1hZnRlci1pbXBvcnQnKSxcbiAgICB9LFxuICAgIGZpeGFibGU6ICd3aGl0ZXNwYWNlJyxcbiAgICBzY2hlbWE6IFtcbiAgICAgIHtcbiAgICAgICAgJ3R5cGUnOiAnb2JqZWN0JyxcbiAgICAgICAgJ3Byb3BlcnRpZXMnOiB7XG4gICAgICAgICAgJ2NvdW50Jzoge1xuICAgICAgICAgICAgJ3R5cGUnOiAnaW50ZWdlcicsXG4gICAgICAgICAgICAnbWluaW11bSc6IDEsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgJ2FkZGl0aW9uYWxQcm9wZXJ0aWVzJzogZmFsc2UsXG4gICAgICB9LFxuICAgIF0sXG4gIH0sXG4gIGNyZWF0ZTogZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICBsZXQgbGV2ZWwgPSAwO1xuICAgIGNvbnN0IHJlcXVpcmVDYWxscyA9IFtdO1xuXG4gICAgZnVuY3Rpb24gY2hlY2tGb3JOZXdMaW5lKG5vZGUsIG5leHROb2RlLCB0eXBlKSB7XG4gICAgICBpZiAoaXNFeHBvcnREZWZhdWx0Q2xhc3MobmV4dE5vZGUpIHx8IGlzRXhwb3J0TmFtZUNsYXNzKG5leHROb2RlKSkge1xuICAgICAgICBjb25zdCBjbGFzc05vZGUgPSBuZXh0Tm9kZS5kZWNsYXJhdGlvbjtcblxuICAgICAgICBpZiAoaXNDbGFzc1dpdGhEZWNvcmF0b3IoY2xhc3NOb2RlKSkge1xuICAgICAgICAgIG5leHROb2RlID0gY2xhc3NOb2RlLmRlY29yYXRvcnNbMF07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaXNDbGFzc1dpdGhEZWNvcmF0b3IobmV4dE5vZGUpKSB7XG4gICAgICAgIG5leHROb2RlID0gbmV4dE5vZGUuZGVjb3JhdG9yc1swXTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgb3B0aW9ucyA9IGNvbnRleHQub3B0aW9uc1swXSB8fCB7IGNvdW50OiAxIH07XG4gICAgICBjb25zdCBsaW5lRGlmZmVyZW5jZSA9IGdldExpbmVEaWZmZXJlbmNlKG5vZGUsIG5leHROb2RlKTtcbiAgICAgIGNvbnN0IEVYUEVDVEVEX0xJTkVfRElGRkVSRU5DRSA9IG9wdGlvbnMuY291bnQgKyAxO1xuXG4gICAgICBpZiAobGluZURpZmZlcmVuY2UgPCBFWFBFQ1RFRF9MSU5FX0RJRkZFUkVOQ0UpIHtcbiAgICAgICAgbGV0IGNvbHVtbiA9IG5vZGUubG9jLnN0YXJ0LmNvbHVtbjtcblxuICAgICAgICBpZiAobm9kZS5sb2Muc3RhcnQubGluZSAhPT0gbm9kZS5sb2MuZW5kLmxpbmUpIHtcbiAgICAgICAgICBjb2x1bW4gPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgIGxvYzoge1xuICAgICAgICAgICAgbGluZTogbm9kZS5sb2MuZW5kLmxpbmUsXG4gICAgICAgICAgICBjb2x1bW4sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBtZXNzYWdlOiBgRXhwZWN0ZWQgJHtvcHRpb25zLmNvdW50fSBlbXB0eSBsaW5lJHtvcHRpb25zLmNvdW50ID4gMSA/ICdzJyA6ICcnfSBcXFxuYWZ0ZXIgJHt0eXBlfSBzdGF0ZW1lbnQgbm90IGZvbGxvd2VkIGJ5IGFub3RoZXIgJHt0eXBlfS5gLFxuICAgICAgICAgIGZpeDogZml4ZXIgPT4gZml4ZXIuaW5zZXJ0VGV4dEFmdGVyKFxuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICdcXG4nLnJlcGVhdChFWFBFQ1RFRF9MSU5FX0RJRkZFUkVOQ0UgLSBsaW5lRGlmZmVyZW5jZSlcbiAgICAgICAgICApLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbmNyZW1lbnRMZXZlbCgpIHtcbiAgICAgIGxldmVsKys7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRlY3JlbWVudExldmVsKCkge1xuICAgICAgbGV2ZWwtLTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja0ltcG9ydChub2RlKSB7XG4gICAgICBjb25zdCB7IHBhcmVudCB9ID0gbm9kZTtcbiAgICAgIGNvbnN0IG5vZGVQb3NpdGlvbiA9IHBhcmVudC5ib2R5LmluZGV4T2Yobm9kZSk7XG4gICAgICBjb25zdCBuZXh0Tm9kZSA9IHBhcmVudC5ib2R5W25vZGVQb3NpdGlvbiArIDFdO1xuICAgICAgICBcbiAgICAgIC8vIHNraXAgXCJleHBvcnQgaW1wb3J0XCJzXG4gICAgICBpZiAobm9kZS50eXBlID09PSAnVFNJbXBvcnRFcXVhbHNEZWNsYXJhdGlvbicgJiYgbm9kZS5pc0V4cG9ydCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChuZXh0Tm9kZSAmJiBuZXh0Tm9kZS50eXBlICE9PSAnSW1wb3J0RGVjbGFyYXRpb24nICYmIChuZXh0Tm9kZS50eXBlICE9PSAnVFNJbXBvcnRFcXVhbHNEZWNsYXJhdGlvbicgfHwgbmV4dE5vZGUuaXNFeHBvcnQpKSB7XG4gICAgICAgIGNoZWNrRm9yTmV3TGluZShub2RlLCBuZXh0Tm9kZSwgJ2ltcG9ydCcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBJbXBvcnREZWNsYXJhdGlvbjogY2hlY2tJbXBvcnQsXG4gICAgICBUU0ltcG9ydEVxdWFsc0RlY2xhcmF0aW9uOiBjaGVja0ltcG9ydCxcbiAgICAgIENhbGxFeHByZXNzaW9uOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIGlmIChpc1N0YXRpY1JlcXVpcmUobm9kZSkgJiYgbGV2ZWwgPT09IDApIHtcbiAgICAgICAgICByZXF1aXJlQ2FsbHMucHVzaChub2RlKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgICdQcm9ncmFtOmV4aXQnOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxvZygnZXhpdCBwcm9jZXNzaW5nIGZvcicsIGNvbnRleHQuZ2V0RmlsZW5hbWUoKSk7XG4gICAgICAgIGNvbnN0IHNjb3BlQm9keSA9IGdldFNjb3BlQm9keShjb250ZXh0LmdldFNjb3BlKCkpO1xuICAgICAgICBsb2coJ2dvdCBzY29wZTonLCBzY29wZUJvZHkpO1xuXG4gICAgICAgIHJlcXVpcmVDYWxscy5mb3JFYWNoKGZ1bmN0aW9uIChub2RlLCBpbmRleCkge1xuICAgICAgICAgIGNvbnN0IG5vZGVQb3NpdGlvbiA9IGZpbmROb2RlSW5kZXhJblNjb3BlQm9keShzY29wZUJvZHksIG5vZGUpO1xuICAgICAgICAgIGxvZygnbm9kZSBwb3NpdGlvbiBpbiBzY29wZTonLCBub2RlUG9zaXRpb24pO1xuXG4gICAgICAgICAgY29uc3Qgc3RhdGVtZW50V2l0aFJlcXVpcmVDYWxsID0gc2NvcGVCb2R5W25vZGVQb3NpdGlvbl07XG4gICAgICAgICAgY29uc3QgbmV4dFN0YXRlbWVudCA9IHNjb3BlQm9keVtub2RlUG9zaXRpb24gKyAxXTtcbiAgICAgICAgICBjb25zdCBuZXh0UmVxdWlyZUNhbGwgPSByZXF1aXJlQ2FsbHNbaW5kZXggKyAxXTtcblxuICAgICAgICAgIGlmIChuZXh0UmVxdWlyZUNhbGwgJiYgY29udGFpbnNOb2RlT3JFcXVhbChzdGF0ZW1lbnRXaXRoUmVxdWlyZUNhbGwsIG5leHRSZXF1aXJlQ2FsbCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAobmV4dFN0YXRlbWVudCAmJlxuICAgICAgICAgICAgICghbmV4dFJlcXVpcmVDYWxsIHx8ICFjb250YWluc05vZGVPckVxdWFsKG5leHRTdGF0ZW1lbnQsIG5leHRSZXF1aXJlQ2FsbCkpKSB7XG5cbiAgICAgICAgICAgIGNoZWNrRm9yTmV3TGluZShzdGF0ZW1lbnRXaXRoUmVxdWlyZUNhbGwsIG5leHRTdGF0ZW1lbnQsICdyZXF1aXJlJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBGdW5jdGlvbkRlY2xhcmF0aW9uOiBpbmNyZW1lbnRMZXZlbCxcbiAgICAgIEZ1bmN0aW9uRXhwcmVzc2lvbjogaW5jcmVtZW50TGV2ZWwsXG4gICAgICBBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbjogaW5jcmVtZW50TGV2ZWwsXG4gICAgICBCbG9ja1N0YXRlbWVudDogaW5jcmVtZW50TGV2ZWwsXG4gICAgICBPYmplY3RFeHByZXNzaW9uOiBpbmNyZW1lbnRMZXZlbCxcbiAgICAgIERlY29yYXRvcjogaW5jcmVtZW50TGV2ZWwsXG4gICAgICAnRnVuY3Rpb25EZWNsYXJhdGlvbjpleGl0JzogZGVjcmVtZW50TGV2ZWwsXG4gICAgICAnRnVuY3Rpb25FeHByZXNzaW9uOmV4aXQnOiBkZWNyZW1lbnRMZXZlbCxcbiAgICAgICdBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbjpleGl0JzogZGVjcmVtZW50TGV2ZWwsXG4gICAgICAnQmxvY2tTdGF0ZW1lbnQ6ZXhpdCc6IGRlY3JlbWVudExldmVsLFxuICAgICAgJ09iamVjdEV4cHJlc3Npb246ZXhpdCc6IGRlY3JlbWVudExldmVsLFxuICAgICAgJ0RlY29yYXRvcjpleGl0JzogZGVjcmVtZW50TGV2ZWwsXG4gICAgfTtcbiAgfSxcbn07XG4iXX0=