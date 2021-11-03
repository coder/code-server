'use strict';var _slicedToArray = function () {function sliceIterator(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"]) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}return function (arr, i) {if (Array.isArray(arr)) {return arr;} else if (Symbol.iterator in Object(arr)) {return sliceIterator(arr, i);} else {throw new TypeError("Invalid attempt to destructure non-iterable instance");}};}();

var _minimatch = require('minimatch');var _minimatch2 = _interopRequireDefault(_minimatch);
var _importType = require('../core/importType');var _importType2 = _interopRequireDefault(_importType);
var _staticRequire = require('../core/staticRequire');var _staticRequire2 = _interopRequireDefault(_staticRequire);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const defaultGroups = ['builtin', 'external', 'parent', 'sibling', 'index'];

// REPORTING AND FIXING

function reverse(array) {
  return array.map(function (v) {
    return Object.assign({}, v, { rank: -v.rank });
  }).reverse();
}

function getTokensOrCommentsAfter(sourceCode, node, count) {
  let currentNodeOrToken = node;
  const result = [];
  for (let i = 0; i < count; i++) {
    currentNodeOrToken = sourceCode.getTokenOrCommentAfter(currentNodeOrToken);
    if (currentNodeOrToken == null) {
      break;
    }
    result.push(currentNodeOrToken);
  }
  return result;
}

function getTokensOrCommentsBefore(sourceCode, node, count) {
  let currentNodeOrToken = node;
  const result = [];
  for (let i = 0; i < count; i++) {
    currentNodeOrToken = sourceCode.getTokenOrCommentBefore(currentNodeOrToken);
    if (currentNodeOrToken == null) {
      break;
    }
    result.push(currentNodeOrToken);
  }
  return result.reverse();
}

function takeTokensAfterWhile(sourceCode, node, condition) {
  const tokens = getTokensOrCommentsAfter(sourceCode, node, 100);
  const result = [];
  for (let i = 0; i < tokens.length; i++) {
    if (condition(tokens[i])) {
      result.push(tokens[i]);
    } else
    {
      break;
    }
  }
  return result;
}

function takeTokensBeforeWhile(sourceCode, node, condition) {
  const tokens = getTokensOrCommentsBefore(sourceCode, node, 100);
  const result = [];
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (condition(tokens[i])) {
      result.push(tokens[i]);
    } else
    {
      break;
    }
  }
  return result.reverse();
}

function findOutOfOrder(imported) {
  if (imported.length === 0) {
    return [];
  }
  let maxSeenRankNode = imported[0];
  return imported.filter(function (importedModule) {
    const res = importedModule.rank < maxSeenRankNode.rank;
    if (maxSeenRankNode.rank < importedModule.rank) {
      maxSeenRankNode = importedModule;
    }
    return res;
  });
}

function findRootNode(node) {
  let parent = node;
  while (parent.parent != null && parent.parent.body == null) {
    parent = parent.parent;
  }
  return parent;
}

function findEndOfLineWithComments(sourceCode, node) {
  const tokensToEndOfLine = takeTokensAfterWhile(sourceCode, node, commentOnSameLineAs(node));
  const endOfTokens = tokensToEndOfLine.length > 0 ?
  tokensToEndOfLine[tokensToEndOfLine.length - 1].range[1] :
  node.range[1];
  let result = endOfTokens;
  for (let i = endOfTokens; i < sourceCode.text.length; i++) {
    if (sourceCode.text[i] === '\n') {
      result = i + 1;
      break;
    }
    if (sourceCode.text[i] !== ' ' && sourceCode.text[i] !== '\t' && sourceCode.text[i] !== '\r') {
      break;
    }
    result = i + 1;
  }
  return result;
}

function commentOnSameLineAs(node) {
  return token => (token.type === 'Block' || token.type === 'Line') &&
  token.loc.start.line === token.loc.end.line &&
  token.loc.end.line === node.loc.end.line;
}

function findStartOfLineWithComments(sourceCode, node) {
  const tokensToEndOfLine = takeTokensBeforeWhile(sourceCode, node, commentOnSameLineAs(node));
  const startOfTokens = tokensToEndOfLine.length > 0 ? tokensToEndOfLine[0].range[0] : node.range[0];
  let result = startOfTokens;
  for (let i = startOfTokens - 1; i > 0; i--) {
    if (sourceCode.text[i] !== ' ' && sourceCode.text[i] !== '\t') {
      break;
    }
    result = i;
  }
  return result;
}

function isPlainRequireModule(node) {
  if (node.type !== 'VariableDeclaration') {
    return false;
  }
  if (node.declarations.length !== 1) {
    return false;
  }
  const decl = node.declarations[0];
  const result = decl.id && (
  decl.id.type === 'Identifier' || decl.id.type === 'ObjectPattern') &&
  decl.init != null &&
  decl.init.type === 'CallExpression' &&
  decl.init.callee != null &&
  decl.init.callee.name === 'require' &&
  decl.init.arguments != null &&
  decl.init.arguments.length === 1 &&
  decl.init.arguments[0].type === 'Literal';
  return result;
}

function isPlainImportModule(node) {
  return node.type === 'ImportDeclaration' && node.specifiers != null && node.specifiers.length > 0;
}

function isPlainImportEquals(node) {
  return node.type === 'TSImportEqualsDeclaration' && node.moduleReference.expression;
}

function canCrossNodeWhileReorder(node) {
  return isPlainRequireModule(node) || isPlainImportModule(node) || isPlainImportEquals(node);
}

function canReorderItems(firstNode, secondNode) {
  const parent = firstNode.parent;var _sort =
  [
  parent.body.indexOf(firstNode),
  parent.body.indexOf(secondNode)].
  sort(),_sort2 = _slicedToArray(_sort, 2);const firstIndex = _sort2[0],secondIndex = _sort2[1];
  const nodesBetween = parent.body.slice(firstIndex, secondIndex + 1);
  for (const nodeBetween of nodesBetween) {
    if (!canCrossNodeWhileReorder(nodeBetween)) {
      return false;
    }
  }
  return true;
}

function fixOutOfOrder(context, firstNode, secondNode, order) {
  const sourceCode = context.getSourceCode();

  const firstRoot = findRootNode(firstNode.node);
  const firstRootStart = findStartOfLineWithComments(sourceCode, firstRoot);
  const firstRootEnd = findEndOfLineWithComments(sourceCode, firstRoot);

  const secondRoot = findRootNode(secondNode.node);
  const secondRootStart = findStartOfLineWithComments(sourceCode, secondRoot);
  const secondRootEnd = findEndOfLineWithComments(sourceCode, secondRoot);
  const canFix = canReorderItems(firstRoot, secondRoot);

  let newCode = sourceCode.text.substring(secondRootStart, secondRootEnd);
  if (newCode[newCode.length - 1] !== '\n') {
    newCode = newCode + '\n';
  }

  const message = `\`${secondNode.displayName}\` import should occur ${order} import of \`${firstNode.displayName}\``;

  if (order === 'before') {
    context.report({
      node: secondNode.node,
      message: message,
      fix: canFix && (fixer =>
      fixer.replaceTextRange(
      [firstRootStart, secondRootEnd],
      newCode + sourceCode.text.substring(firstRootStart, secondRootStart))) });


  } else if (order === 'after') {
    context.report({
      node: secondNode.node,
      message: message,
      fix: canFix && (fixer =>
      fixer.replaceTextRange(
      [secondRootStart, firstRootEnd],
      sourceCode.text.substring(secondRootEnd, firstRootEnd) + newCode)) });


  }
}

function reportOutOfOrder(context, imported, outOfOrder, order) {
  outOfOrder.forEach(function (imp) {
    const found = imported.find(function hasHigherRank(importedItem) {
      return importedItem.rank > imp.rank;
    });
    fixOutOfOrder(context, found, imp, order);
  });
}

function makeOutOfOrderReport(context, imported) {
  const outOfOrder = findOutOfOrder(imported);
  if (!outOfOrder.length) {
    return;
  }
  // There are things to report. Try to minimize the number of reported errors.
  const reversedImported = reverse(imported);
  const reversedOrder = findOutOfOrder(reversedImported);
  if (reversedOrder.length < outOfOrder.length) {
    reportOutOfOrder(context, reversedImported, reversedOrder, 'after');
    return;
  }
  reportOutOfOrder(context, imported, outOfOrder, 'before');
}

function getSorter(ascending) {
  const multiplier = ascending ? 1 : -1;

  return function importsSorter(importA, importB) {
    let result;

    if (importA < importB) {
      result = -1;
    } else if (importA > importB) {
      result = 1;
    } else {
      result = 0;
    }

    return result * multiplier;
  };
}

function mutateRanksToAlphabetize(imported, alphabetizeOptions) {
  const groupedByRanks = imported.reduce(function (acc, importedItem) {
    if (!Array.isArray(acc[importedItem.rank])) {
      acc[importedItem.rank] = [];
    }
    acc[importedItem.rank].push(importedItem);
    return acc;
  }, {});

  const groupRanks = Object.keys(groupedByRanks);

  const sorterFn = getSorter(alphabetizeOptions.order === 'asc');
  const comparator = alphabetizeOptions.caseInsensitive ?
  (a, b) => sorterFn(String(a.value).toLowerCase(), String(b.value).toLowerCase()) :
  (a, b) => sorterFn(a.value, b.value);

  // sort imports locally within their group
  groupRanks.forEach(function (groupRank) {
    groupedByRanks[groupRank].sort(comparator);
  });

  // assign globally unique rank to each import
  let newRank = 0;
  const alphabetizedRanks = groupRanks.sort().reduce(function (acc, groupRank) {
    groupedByRanks[groupRank].forEach(function (importedItem) {
      acc[`${importedItem.value}|${importedItem.node.importKind}`] = parseInt(groupRank, 10) + newRank;
      newRank += 1;
    });
    return acc;
  }, {});

  // mutate the original group-rank with alphabetized-rank
  imported.forEach(function (importedItem) {
    importedItem.rank = alphabetizedRanks[`${importedItem.value}|${importedItem.node.importKind}`];
  });
}

// DETECTING

function computePathRank(ranks, pathGroups, path, maxPosition) {
  for (let i = 0, l = pathGroups.length; i < l; i++) {var _pathGroups$i =
    pathGroups[i];const pattern = _pathGroups$i.pattern,patternOptions = _pathGroups$i.patternOptions,group = _pathGroups$i.group;var _pathGroups$i$positio = _pathGroups$i.position;const position = _pathGroups$i$positio === undefined ? 1 : _pathGroups$i$positio;
    if ((0, _minimatch2.default)(path, pattern, patternOptions || { nocomment: true })) {
      return ranks[group] + position / maxPosition;
    }
  }
}

function computeRank(context, ranks, importEntry, excludedImportTypes) {
  let impType;
  let rank;
  if (importEntry.type === 'import:object') {
    impType = 'object';
  } else if (importEntry.node.importKind === 'type' && ranks.omittedTypes.indexOf('type') === -1) {
    impType = 'type';
  } else {
    impType = (0, _importType2.default)(importEntry.value, context);
  }
  if (!excludedImportTypes.has(impType)) {
    rank = computePathRank(ranks.groups, ranks.pathGroups, importEntry.value, ranks.maxPosition);
  }
  if (typeof rank === 'undefined') {
    rank = ranks.groups[impType];
  }
  if (importEntry.type !== 'import' && !importEntry.type.startsWith('import:')) {
    rank += 100;
  }

  return rank;
}

function registerNode(context, importEntry, ranks, imported, excludedImportTypes) {
  const rank = computeRank(context, ranks, importEntry, excludedImportTypes);
  if (rank !== -1) {
    imported.push(Object.assign({}, importEntry, { rank }));
  }
}

function isModuleLevelRequire(node) {
  let n = node;
  // Handle cases like `const baz = require('foo').bar.baz`
  // and `const foo = require('foo')()`
  while (
  n.parent.type === 'MemberExpression' && n.parent.object === n ||
  n.parent.type === 'CallExpression' && n.parent.callee === n)
  {
    n = n.parent;
  }
  return (
    n.parent.type === 'VariableDeclarator' &&
    n.parent.parent.type === 'VariableDeclaration' &&
    n.parent.parent.parent.type === 'Program');

}

const types = ['builtin', 'external', 'internal', 'unknown', 'parent', 'sibling', 'index', 'object', 'type'];

// Creates an object with type-rank pairs.
// Example: { index: 0, sibling: 1, parent: 1, external: 1, builtin: 2, internal: 2 }
// Will throw an error if it contains a type that does not exist, or has a duplicate
function convertGroupsToRanks(groups) {
  const rankObject = groups.reduce(function (res, group, index) {
    if (typeof group === 'string') {
      group = [group];
    }
    group.forEach(function (groupItem) {
      if (types.indexOf(groupItem) === -1) {
        throw new Error('Incorrect configuration of the rule: Unknown type `' +
        JSON.stringify(groupItem) + '`');
      }
      if (res[groupItem] !== undefined) {
        throw new Error('Incorrect configuration of the rule: `' + groupItem + '` is duplicated');
      }
      res[groupItem] = index;
    });
    return res;
  }, {});

  const omittedTypes = types.filter(function (type) {
    return rankObject[type] === undefined;
  });

  const ranks = omittedTypes.reduce(function (res, type) {
    res[type] = groups.length;
    return res;
  }, rankObject);

  return { groups: ranks, omittedTypes };
}

function convertPathGroupsForRanks(pathGroups) {
  const after = {};
  const before = {};

  const transformed = pathGroups.map((pathGroup, index) => {const
    group = pathGroup.group,positionString = pathGroup.position;
    let position = 0;
    if (positionString === 'after') {
      if (!after[group]) {
        after[group] = 1;
      }
      position = after[group]++;
    } else if (positionString === 'before') {
      if (!before[group]) {
        before[group] = [];
      }
      before[group].push(index);
    }

    return Object.assign({}, pathGroup, { position });
  });

  let maxPosition = 1;

  Object.keys(before).forEach(group => {
    const groupLength = before[group].length;
    before[group].forEach((groupIndex, index) => {
      transformed[groupIndex].position = -1 * (groupLength - index);
    });
    maxPosition = Math.max(maxPosition, groupLength);
  });

  Object.keys(after).forEach(key => {
    const groupNextPosition = after[key];
    maxPosition = Math.max(maxPosition, groupNextPosition - 1);
  });

  return {
    pathGroups: transformed,
    maxPosition: maxPosition > 10 ? Math.pow(10, Math.ceil(Math.log10(maxPosition))) : 10 };

}

function fixNewLineAfterImport(context, previousImport) {
  const prevRoot = findRootNode(previousImport.node);
  const tokensToEndOfLine = takeTokensAfterWhile(
  context.getSourceCode(), prevRoot, commentOnSameLineAs(prevRoot));

  let endOfLine = prevRoot.range[1];
  if (tokensToEndOfLine.length > 0) {
    endOfLine = tokensToEndOfLine[tokensToEndOfLine.length - 1].range[1];
  }
  return fixer => fixer.insertTextAfterRange([prevRoot.range[0], endOfLine], '\n');
}

function removeNewLineAfterImport(context, currentImport, previousImport) {
  const sourceCode = context.getSourceCode();
  const prevRoot = findRootNode(previousImport.node);
  const currRoot = findRootNode(currentImport.node);
  const rangeToRemove = [
  findEndOfLineWithComments(sourceCode, prevRoot),
  findStartOfLineWithComments(sourceCode, currRoot)];

  if (/^\s*$/.test(sourceCode.text.substring(rangeToRemove[0], rangeToRemove[1]))) {
    return fixer => fixer.removeRange(rangeToRemove);
  }
  return undefined;
}

function makeNewlinesBetweenReport(context, imported, newlinesBetweenImports) {
  const getNumberOfEmptyLinesBetween = (currentImport, previousImport) => {
    const linesBetweenImports = context.getSourceCode().lines.slice(
    previousImport.node.loc.end.line,
    currentImport.node.loc.start.line - 1);


    return linesBetweenImports.filter(line => !line.trim().length).length;
  };
  let previousImport = imported[0];

  imported.slice(1).forEach(function (currentImport) {
    const emptyLinesBetween = getNumberOfEmptyLinesBetween(currentImport, previousImport);

    if (newlinesBetweenImports === 'always' ||
    newlinesBetweenImports === 'always-and-inside-groups') {
      if (currentImport.rank !== previousImport.rank && emptyLinesBetween === 0) {
        context.report({
          node: previousImport.node,
          message: 'There should be at least one empty line between import groups',
          fix: fixNewLineAfterImport(context, previousImport) });

      } else if (currentImport.rank === previousImport.rank &&
      emptyLinesBetween > 0 &&
      newlinesBetweenImports !== 'always-and-inside-groups') {
        context.report({
          node: previousImport.node,
          message: 'There should be no empty line within import group',
          fix: removeNewLineAfterImport(context, currentImport, previousImport) });

      }
    } else if (emptyLinesBetween > 0) {
      context.report({
        node: previousImport.node,
        message: 'There should be no empty line between import groups',
        fix: removeNewLineAfterImport(context, currentImport, previousImport) });

    }

    previousImport = currentImport;
  });
}

function getAlphabetizeConfig(options) {
  const alphabetize = options.alphabetize || {};
  const order = alphabetize.order || 'ignore';
  const caseInsensitive = alphabetize.caseInsensitive || false;

  return { order, caseInsensitive };
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('order') },


    fixable: 'code',
    schema: [
    {
      type: 'object',
      properties: {
        groups: {
          type: 'array' },

        pathGroupsExcludedImportTypes: {
          type: 'array' },

        pathGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: {
                type: 'string' },

              patternOptions: {
                type: 'object' },

              group: {
                type: 'string',
                enum: types },

              position: {
                type: 'string',
                enum: ['after', 'before'] } },


            required: ['pattern', 'group'] } },


        'newlines-between': {
          enum: [
          'ignore',
          'always',
          'always-and-inside-groups',
          'never'] },


        alphabetize: {
          type: 'object',
          properties: {
            caseInsensitive: {
              type: 'boolean',
              default: false },

            order: {
              enum: ['ignore', 'asc', 'desc'],
              default: 'ignore' } },


          additionalProperties: false },

        warnOnUnassignedImports: {
          type: 'boolean',
          default: false } },


      additionalProperties: false }] },




  create: function importOrderRule(context) {
    const options = context.options[0] || {};
    const newlinesBetweenImports = options['newlines-between'] || 'ignore';
    const pathGroupsExcludedImportTypes = new Set(options['pathGroupsExcludedImportTypes'] || ['builtin', 'external', 'object']);
    const alphabetize = getAlphabetizeConfig(options);
    let ranks;

    try {var _convertPathGroupsFor =
      convertPathGroupsForRanks(options.pathGroups || []);const pathGroups = _convertPathGroupsFor.pathGroups,maxPosition = _convertPathGroupsFor.maxPosition;var _convertGroupsToRanks =
      convertGroupsToRanks(options.groups || defaultGroups);const groups = _convertGroupsToRanks.groups,omittedTypes = _convertGroupsToRanks.omittedTypes;
      ranks = {
        groups,
        omittedTypes,
        pathGroups,
        maxPosition };

    } catch (error) {
      // Malformed configuration
      return {
        Program: function (node) {
          context.report(node, error.message);
        } };

    }
    let imported = [];

    return {
      ImportDeclaration: function handleImports(node) {
        // Ignoring unassigned imports unless warnOnUnassignedImports is set
        if (node.specifiers.length || options.warnOnUnassignedImports) {
          const name = node.source.value;
          registerNode(
          context,
          {
            node,
            value: name,
            displayName: name,
            type: 'import' },

          ranks,
          imported,
          pathGroupsExcludedImportTypes);

        }
      },
      TSImportEqualsDeclaration: function handleImports(node) {
        let displayName;
        let value;
        let type;
        // skip "export import"s
        if (node.isExport) {
          return;
        }
        if (node.moduleReference.type === 'TSExternalModuleReference') {
          value = node.moduleReference.expression.value;
          displayName = value;
          type = 'import';
        } else {
          value = '';
          displayName = context.getSourceCode().getText(node.moduleReference);
          type = 'import:object';
        }
        registerNode(
        context,
        {
          node,
          value,
          displayName,
          type },

        ranks,
        imported,
        pathGroupsExcludedImportTypes);

      },
      CallExpression: function handleRequires(node) {
        if (!(0, _staticRequire2.default)(node) || !isModuleLevelRequire(node)) {
          return;
        }
        const name = node.arguments[0].value;
        registerNode(
        context,
        {
          node,
          value: name,
          displayName: name,
          type: 'require' },

        ranks,
        imported,
        pathGroupsExcludedImportTypes);

      },
      'Program:exit': function reportAndReset() {
        if (newlinesBetweenImports !== 'ignore') {
          makeNewlinesBetweenReport(context, imported, newlinesBetweenImports);
        }

        if (alphabetize.order !== 'ignore') {
          mutateRanksToAlphabetize(imported, alphabetize);
        }

        makeOutOfOrderReport(context, imported);

        imported = [];
      } };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9vcmRlci5qcyJdLCJuYW1lcyI6WyJkZWZhdWx0R3JvdXBzIiwicmV2ZXJzZSIsImFycmF5IiwibWFwIiwidiIsIk9iamVjdCIsImFzc2lnbiIsInJhbmsiLCJnZXRUb2tlbnNPckNvbW1lbnRzQWZ0ZXIiLCJzb3VyY2VDb2RlIiwibm9kZSIsImNvdW50IiwiY3VycmVudE5vZGVPclRva2VuIiwicmVzdWx0IiwiaSIsImdldFRva2VuT3JDb21tZW50QWZ0ZXIiLCJwdXNoIiwiZ2V0VG9rZW5zT3JDb21tZW50c0JlZm9yZSIsImdldFRva2VuT3JDb21tZW50QmVmb3JlIiwidGFrZVRva2Vuc0FmdGVyV2hpbGUiLCJjb25kaXRpb24iLCJ0b2tlbnMiLCJsZW5ndGgiLCJ0YWtlVG9rZW5zQmVmb3JlV2hpbGUiLCJmaW5kT3V0T2ZPcmRlciIsImltcG9ydGVkIiwibWF4U2VlblJhbmtOb2RlIiwiZmlsdGVyIiwiaW1wb3J0ZWRNb2R1bGUiLCJyZXMiLCJmaW5kUm9vdE5vZGUiLCJwYXJlbnQiLCJib2R5IiwiZmluZEVuZE9mTGluZVdpdGhDb21tZW50cyIsInRva2Vuc1RvRW5kT2ZMaW5lIiwiY29tbWVudE9uU2FtZUxpbmVBcyIsImVuZE9mVG9rZW5zIiwicmFuZ2UiLCJ0ZXh0IiwidG9rZW4iLCJ0eXBlIiwibG9jIiwic3RhcnQiLCJsaW5lIiwiZW5kIiwiZmluZFN0YXJ0T2ZMaW5lV2l0aENvbW1lbnRzIiwic3RhcnRPZlRva2VucyIsImlzUGxhaW5SZXF1aXJlTW9kdWxlIiwiZGVjbGFyYXRpb25zIiwiZGVjbCIsImlkIiwiaW5pdCIsImNhbGxlZSIsIm5hbWUiLCJhcmd1bWVudHMiLCJpc1BsYWluSW1wb3J0TW9kdWxlIiwic3BlY2lmaWVycyIsImlzUGxhaW5JbXBvcnRFcXVhbHMiLCJtb2R1bGVSZWZlcmVuY2UiLCJleHByZXNzaW9uIiwiY2FuQ3Jvc3NOb2RlV2hpbGVSZW9yZGVyIiwiY2FuUmVvcmRlckl0ZW1zIiwiZmlyc3ROb2RlIiwic2Vjb25kTm9kZSIsImluZGV4T2YiLCJzb3J0IiwiZmlyc3RJbmRleCIsInNlY29uZEluZGV4Iiwibm9kZXNCZXR3ZWVuIiwic2xpY2UiLCJub2RlQmV0d2VlbiIsImZpeE91dE9mT3JkZXIiLCJjb250ZXh0Iiwib3JkZXIiLCJnZXRTb3VyY2VDb2RlIiwiZmlyc3RSb290IiwiZmlyc3RSb290U3RhcnQiLCJmaXJzdFJvb3RFbmQiLCJzZWNvbmRSb290Iiwic2Vjb25kUm9vdFN0YXJ0Iiwic2Vjb25kUm9vdEVuZCIsImNhbkZpeCIsIm5ld0NvZGUiLCJzdWJzdHJpbmciLCJtZXNzYWdlIiwiZGlzcGxheU5hbWUiLCJyZXBvcnQiLCJmaXgiLCJmaXhlciIsInJlcGxhY2VUZXh0UmFuZ2UiLCJyZXBvcnRPdXRPZk9yZGVyIiwib3V0T2ZPcmRlciIsImZvckVhY2giLCJpbXAiLCJmb3VuZCIsImZpbmQiLCJoYXNIaWdoZXJSYW5rIiwiaW1wb3J0ZWRJdGVtIiwibWFrZU91dE9mT3JkZXJSZXBvcnQiLCJyZXZlcnNlZEltcG9ydGVkIiwicmV2ZXJzZWRPcmRlciIsImdldFNvcnRlciIsImFzY2VuZGluZyIsIm11bHRpcGxpZXIiLCJpbXBvcnRzU29ydGVyIiwiaW1wb3J0QSIsImltcG9ydEIiLCJtdXRhdGVSYW5rc1RvQWxwaGFiZXRpemUiLCJhbHBoYWJldGl6ZU9wdGlvbnMiLCJncm91cGVkQnlSYW5rcyIsInJlZHVjZSIsImFjYyIsIkFycmF5IiwiaXNBcnJheSIsImdyb3VwUmFua3MiLCJrZXlzIiwic29ydGVyRm4iLCJjb21wYXJhdG9yIiwiY2FzZUluc2Vuc2l0aXZlIiwiYSIsImIiLCJTdHJpbmciLCJ2YWx1ZSIsInRvTG93ZXJDYXNlIiwiZ3JvdXBSYW5rIiwibmV3UmFuayIsImFscGhhYmV0aXplZFJhbmtzIiwiaW1wb3J0S2luZCIsInBhcnNlSW50IiwiY29tcHV0ZVBhdGhSYW5rIiwicmFua3MiLCJwYXRoR3JvdXBzIiwicGF0aCIsIm1heFBvc2l0aW9uIiwibCIsInBhdHRlcm4iLCJwYXR0ZXJuT3B0aW9ucyIsImdyb3VwIiwicG9zaXRpb24iLCJub2NvbW1lbnQiLCJjb21wdXRlUmFuayIsImltcG9ydEVudHJ5IiwiZXhjbHVkZWRJbXBvcnRUeXBlcyIsImltcFR5cGUiLCJvbWl0dGVkVHlwZXMiLCJoYXMiLCJncm91cHMiLCJzdGFydHNXaXRoIiwicmVnaXN0ZXJOb2RlIiwiaXNNb2R1bGVMZXZlbFJlcXVpcmUiLCJuIiwib2JqZWN0IiwidHlwZXMiLCJjb252ZXJ0R3JvdXBzVG9SYW5rcyIsInJhbmtPYmplY3QiLCJpbmRleCIsImdyb3VwSXRlbSIsIkVycm9yIiwiSlNPTiIsInN0cmluZ2lmeSIsInVuZGVmaW5lZCIsImNvbnZlcnRQYXRoR3JvdXBzRm9yUmFua3MiLCJhZnRlciIsImJlZm9yZSIsInRyYW5zZm9ybWVkIiwicGF0aEdyb3VwIiwicG9zaXRpb25TdHJpbmciLCJncm91cExlbmd0aCIsImdyb3VwSW5kZXgiLCJNYXRoIiwibWF4Iiwia2V5IiwiZ3JvdXBOZXh0UG9zaXRpb24iLCJwb3ciLCJjZWlsIiwibG9nMTAiLCJmaXhOZXdMaW5lQWZ0ZXJJbXBvcnQiLCJwcmV2aW91c0ltcG9ydCIsInByZXZSb290IiwiZW5kT2ZMaW5lIiwiaW5zZXJ0VGV4dEFmdGVyUmFuZ2UiLCJyZW1vdmVOZXdMaW5lQWZ0ZXJJbXBvcnQiLCJjdXJyZW50SW1wb3J0IiwiY3VyclJvb3QiLCJyYW5nZVRvUmVtb3ZlIiwidGVzdCIsInJlbW92ZVJhbmdlIiwibWFrZU5ld2xpbmVzQmV0d2VlblJlcG9ydCIsIm5ld2xpbmVzQmV0d2VlbkltcG9ydHMiLCJnZXROdW1iZXJPZkVtcHR5TGluZXNCZXR3ZWVuIiwibGluZXNCZXR3ZWVuSW1wb3J0cyIsImxpbmVzIiwidHJpbSIsImVtcHR5TGluZXNCZXR3ZWVuIiwiZ2V0QWxwaGFiZXRpemVDb25maWciLCJvcHRpb25zIiwiYWxwaGFiZXRpemUiLCJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsImRvY3MiLCJ1cmwiLCJmaXhhYmxlIiwic2NoZW1hIiwicHJvcGVydGllcyIsInBhdGhHcm91cHNFeGNsdWRlZEltcG9ydFR5cGVzIiwiaXRlbXMiLCJlbnVtIiwicmVxdWlyZWQiLCJkZWZhdWx0IiwiYWRkaXRpb25hbFByb3BlcnRpZXMiLCJ3YXJuT25VbmFzc2lnbmVkSW1wb3J0cyIsImNyZWF0ZSIsImltcG9ydE9yZGVyUnVsZSIsIlNldCIsImVycm9yIiwiUHJvZ3JhbSIsIkltcG9ydERlY2xhcmF0aW9uIiwiaGFuZGxlSW1wb3J0cyIsInNvdXJjZSIsIlRTSW1wb3J0RXF1YWxzRGVjbGFyYXRpb24iLCJpc0V4cG9ydCIsImdldFRleHQiLCJDYWxsRXhwcmVzc2lvbiIsImhhbmRsZVJlcXVpcmVzIiwicmVwb3J0QW5kUmVzZXQiXSwibWFwcGluZ3MiOiJBQUFBLGE7O0FBRUEsc0M7QUFDQSxnRDtBQUNBLHNEO0FBQ0EscUM7O0FBRUEsTUFBTUEsZ0JBQWdCLENBQUMsU0FBRCxFQUFZLFVBQVosRUFBd0IsUUFBeEIsRUFBa0MsU0FBbEMsRUFBNkMsT0FBN0MsQ0FBdEI7O0FBRUE7O0FBRUEsU0FBU0MsT0FBVCxDQUFpQkMsS0FBakIsRUFBd0I7QUFDdEIsU0FBT0EsTUFBTUMsR0FBTixDQUFVLFVBQVVDLENBQVYsRUFBYTtBQUM1QixXQUFPQyxPQUFPQyxNQUFQLENBQWMsRUFBZCxFQUFrQkYsQ0FBbEIsRUFBcUIsRUFBRUcsTUFBTSxDQUFDSCxFQUFFRyxJQUFYLEVBQXJCLENBQVA7QUFDRCxHQUZNLEVBRUpOLE9BRkksRUFBUDtBQUdEOztBQUVELFNBQVNPLHdCQUFULENBQWtDQyxVQUFsQyxFQUE4Q0MsSUFBOUMsRUFBb0RDLEtBQXBELEVBQTJEO0FBQ3pELE1BQUlDLHFCQUFxQkYsSUFBekI7QUFDQSxRQUFNRyxTQUFTLEVBQWY7QUFDQSxPQUFLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSUgsS0FBcEIsRUFBMkJHLEdBQTNCLEVBQWdDO0FBQzlCRix5QkFBcUJILFdBQVdNLHNCQUFYLENBQWtDSCxrQkFBbEMsQ0FBckI7QUFD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QVFFMEYsYUFSRjtBQVNFekcsZ0JBVEY7QUFVRW9MLHFDQVZGOztBQVlELE9BbEVJO0FBbUVMLHNCQUFnQixTQUFTb0IsY0FBVCxHQUEwQjtBQUN4QyxZQUFJckMsMkJBQTJCLFFBQS9CLEVBQXlDO0FBQ3ZDRCxvQ0FBMEJuSCxPQUExQixFQUFtQy9DLFFBQW5DLEVBQTZDbUssc0JBQTdDO0FBQ0Q7O0FBRUQsWUFBSVEsWUFBWTNILEtBQVosS0FBc0IsUUFBMUIsRUFBb0M7QUFDbENrQyxtQ0FBeUJsRixRQUF6QixFQUFtQzJLLFdBQW5DO0FBQ0Q7O0FBRURsRyw2QkFBcUIxQixPQUFyQixFQUE4Qi9DLFFBQTlCOztBQUVBQSxtQkFBVyxFQUFYO0FBQ0QsT0EvRUksRUFBUDs7QUFpRkQsR0FwTGMsRUFBakIiLCJmaWxlIjoib3JkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBtaW5pbWF0Y2ggZnJvbSAnbWluaW1hdGNoJztcbmltcG9ydCBpbXBvcnRUeXBlIGZyb20gJy4uL2NvcmUvaW1wb3J0VHlwZSc7XG5pbXBvcnQgaXNTdGF0aWNSZXF1aXJlIGZyb20gJy4uL2NvcmUvc3RhdGljUmVxdWlyZSc7XG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJztcblxuY29uc3QgZGVmYXVsdEdyb3VwcyA9IFsnYnVpbHRpbicsICdleHRlcm5hbCcsICdwYXJlbnQnLCAnc2libGluZycsICdpbmRleCddO1xuXG4vLyBSRVBPUlRJTkcgQU5EIEZJWElOR1xuXG5mdW5jdGlvbiByZXZlcnNlKGFycmF5KSB7XG4gIHJldHVybiBhcnJheS5tYXAoZnVuY3Rpb24gKHYpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdiwgeyByYW5rOiAtdi5yYW5rIH0pO1xuICB9KS5yZXZlcnNlKCk7XG59XG5cbmZ1bmN0aW9uIGdldFRva2Vuc09yQ29tbWVudHNBZnRlcihzb3VyY2VDb2RlLCBub2RlLCBjb3VudCkge1xuICBsZXQgY3VycmVudE5vZGVPclRva2VuID0gbm9kZTtcbiAgY29uc3QgcmVzdWx0ID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgIGN1cnJlbnROb2RlT3JUb2tlbiA9IHNvdXJjZUNvZGUuZ2V0VG9rZW5PckNvbW1lbnRBZnRlcihjdXJyZW50Tm9kZU9yVG9rZW4pO1xuICAgIGlmIChjdXJyZW50Tm9kZU9yVG9rZW4gPT0gbnVsbCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJlc3VsdC5wdXNoKGN1cnJlbnROb2RlT3JUb2tlbik7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gZ2V0VG9rZW5zT3JDb21tZW50c0JlZm9yZShzb3VyY2VDb2RlLCBub2RlLCBjb3VudCkge1xuICBsZXQgY3VycmVudE5vZGVPclRva2VuID0gbm9kZTtcbiAgY29uc3QgcmVzdWx0ID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgIGN1cnJlbnROb2RlT3JUb2tlbiA9IHNvdXJjZUNvZGUuZ2V0VG9rZW5PckNvbW1lbnRCZWZvcmUoY3VycmVudE5vZGVPclRva2VuKTtcbiAgICBpZiAoY3VycmVudE5vZGVPclRva2VuID09IG51bGwpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXN1bHQucHVzaChjdXJyZW50Tm9kZU9yVG9rZW4pO1xuICB9XG4gIHJldHVybiByZXN1bHQucmV2ZXJzZSgpO1xufVxuXG5mdW5jdGlvbiB0YWtlVG9rZW5zQWZ0ZXJXaGlsZShzb3VyY2VDb2RlLCBub2RlLCBjb25kaXRpb24pIHtcbiAgY29uc3QgdG9rZW5zID0gZ2V0VG9rZW5zT3JDb21tZW50c0FmdGVyKHNvdXJjZUNvZGUsIG5vZGUsIDEwMCk7XG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChjb25kaXRpb24odG9rZW5zW2ldKSkge1xuICAgICAgcmVzdWx0LnB1c2godG9rZW5zW2ldKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gdGFrZVRva2Vuc0JlZm9yZVdoaWxlKHNvdXJjZUNvZGUsIG5vZGUsIGNvbmRpdGlvbikge1xuICBjb25zdCB0b2tlbnMgPSBnZXRUb2tlbnNPckNvbW1lbnRzQmVmb3JlKHNvdXJjZUNvZGUsIG5vZGUsIDEwMCk7XG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xuICBmb3IgKGxldCBpID0gdG9rZW5zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGNvbmRpdGlvbih0b2tlbnNbaV0pKSB7XG4gICAgICByZXN1bHQucHVzaCh0b2tlbnNbaV0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0LnJldmVyc2UoKTtcbn1cblxuZnVuY3Rpb24gZmluZE91dE9mT3JkZXIoaW1wb3J0ZWQpIHtcbiAgaWYgKGltcG9ydGVkLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBsZXQgbWF4U2VlblJhbmtOb2RlID0gaW1wb3J0ZWRbMF07XG4gIHJldHVybiBpbXBvcnRlZC5maWx0ZXIoZnVuY3Rpb24gKGltcG9ydGVkTW9kdWxlKSB7XG4gICAgY29uc3QgcmVzID0gaW1wb3J0ZWRNb2R1bGUucmFuayA8IG1heFNlZW5SYW5rTm9kZS5yYW5rO1xuICAgIGlmIChtYXhTZWVuUmFua05vZGUucmFuayA8IGltcG9ydGVkTW9kdWxlLnJhbmspIHtcbiAgICAgIG1heFNlZW5SYW5rTm9kZSA9IGltcG9ydGVkTW9kdWxlO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZmluZFJvb3ROb2RlKG5vZGUpIHtcbiAgbGV0IHBhcmVudCA9IG5vZGU7XG4gIHdoaWxlIChwYXJlbnQucGFyZW50ICE9IG51bGwgJiYgcGFyZW50LnBhcmVudC5ib2R5ID09IG51bGwpIHtcbiAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xuICB9XG4gIHJldHVybiBwYXJlbnQ7XG59XG5cbmZ1bmN0aW9uIGZpbmRFbmRPZkxpbmVXaXRoQ29tbWVudHMoc291cmNlQ29kZSwgbm9kZSkge1xuICBjb25zdCB0b2tlbnNUb0VuZE9mTGluZSA9IHRha2VUb2tlbnNBZnRlcldoaWxlKHNvdXJjZUNvZGUsIG5vZGUsIGNvbW1lbnRPblNhbWVMaW5lQXMobm9kZSkpO1xuICBjb25zdCBlbmRPZlRva2VucyA9IHRva2Vuc1RvRW5kT2ZMaW5lLmxlbmd0aCA+IDBcbiAgICA/IHRva2Vuc1RvRW5kT2ZMaW5lW3Rva2Vuc1RvRW5kT2ZMaW5lLmxlbmd0aCAtIDFdLnJhbmdlWzFdXG4gICAgOiBub2RlLnJhbmdlWzFdO1xuICBsZXQgcmVzdWx0ID0gZW5kT2ZUb2tlbnM7XG4gIGZvciAobGV0IGkgPSBlbmRPZlRva2VuczsgaSA8IHNvdXJjZUNvZGUudGV4dC5sZW5ndGg7IGkrKykge1xuICAgIGlmIChzb3VyY2VDb2RlLnRleHRbaV0gPT09ICdcXG4nKSB7XG4gICAgICByZXN1bHQgPSBpICsgMTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoc291cmNlQ29kZS50ZXh0W2ldICE9PSAnICcgJiYgc291cmNlQ29kZS50ZXh0W2ldICE9PSAnXFx0JyAmJiBzb3VyY2VDb2RlLnRleHRbaV0gIT09ICdcXHInKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgcmVzdWx0ID0gaSArIDE7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gY29tbWVudE9uU2FtZUxpbmVBcyhub2RlKSB7XG4gIHJldHVybiB0b2tlbiA9PiAodG9rZW4udHlwZSA9PT0gJ0Jsb2NrJyB8fCAgdG9rZW4udHlwZSA9PT0gJ0xpbmUnKSAmJlxuICAgICAgdG9rZW4ubG9jLnN0YXJ0LmxpbmUgPT09IHRva2VuLmxvYy5lbmQubGluZSAmJlxuICAgICAgdG9rZW4ubG9jLmVuZC5saW5lID09PSBub2RlLmxvYy5lbmQubGluZTtcbn1cblxuZnVuY3Rpb24gZmluZFN0YXJ0T2ZMaW5lV2l0aENvbW1lbnRzKHNvdXJjZUNvZGUsIG5vZGUpIHtcbiAgY29uc3QgdG9rZW5zVG9FbmRPZkxpbmUgPSB0YWtlVG9rZW5zQmVmb3JlV2hpbGUoc291cmNlQ29kZSwgbm9kZSwgY29tbWVudE9uU2FtZUxpbmVBcyhub2RlKSk7XG4gIGNvbnN0IHN0YXJ0T2ZUb2tlbnMgPSB0b2tlbnNUb0VuZE9mTGluZS5sZW5ndGggPiAwID8gdG9rZW5zVG9FbmRPZkxpbmVbMF0ucmFuZ2VbMF0gOiBub2RlLnJhbmdlWzBdO1xuICBsZXQgcmVzdWx0ID0gc3RhcnRPZlRva2VucztcbiAgZm9yIChsZXQgaSA9IHN0YXJ0T2ZUb2tlbnMgLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgaWYgKHNvdXJjZUNvZGUudGV4dFtpXSAhPT0gJyAnICYmIHNvdXJjZUNvZGUudGV4dFtpXSAhPT0gJ1xcdCcpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXN1bHQgPSBpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGlzUGxhaW5SZXF1aXJlTW9kdWxlKG5vZGUpIHtcbiAgaWYgKG5vZGUudHlwZSAhPT0gJ1ZhcmlhYmxlRGVjbGFyYXRpb24nKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChub2RlLmRlY2xhcmF0aW9ucy5sZW5ndGggIT09IDEpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgZGVjbCA9IG5vZGUuZGVjbGFyYXRpb25zWzBdO1xuICBjb25zdCByZXN1bHQgPSBkZWNsLmlkICYmXG4gICAgKGRlY2wuaWQudHlwZSA9PT0gJ0lkZW50aWZpZXInIHx8IGRlY2wuaWQudHlwZSA9PT0gJ09iamVjdFBhdHRlcm4nKSAmJlxuICAgIGRlY2wuaW5pdCAhPSBudWxsICYmXG4gICAgZGVjbC5pbml0LnR5cGUgPT09ICdDYWxsRXhwcmVzc2lvbicgJiZcbiAgICBkZWNsLmluaXQuY2FsbGVlICE9IG51bGwgJiZcbiAgICBkZWNsLmluaXQuY2FsbGVlLm5hbWUgPT09ICdyZXF1aXJlJyAmJlxuICAgIGRlY2wuaW5pdC5hcmd1bWVudHMgIT0gbnVsbCAmJlxuICAgIGRlY2wuaW5pdC5hcmd1bWVudHMubGVuZ3RoID09PSAxICYmXG4gICAgZGVjbC5pbml0LmFyZ3VtZW50c1swXS50eXBlID09PSAnTGl0ZXJhbCc7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGlzUGxhaW5JbXBvcnRNb2R1bGUobm9kZSkge1xuICByZXR1cm4gbm9kZS50eXBlID09PSAnSW1wb3J0RGVjbGFyYXRpb24nICYmIG5vZGUuc3BlY2lmaWVycyAhPSBudWxsICYmIG5vZGUuc3BlY2lmaWVycy5sZW5ndGggPiAwO1xufVxuXG5mdW5jdGlvbiBpc1BsYWluSW1wb3J0RXF1YWxzKG5vZGUpIHtcbiAgcmV0dXJuIG5vZGUudHlwZSA9PT0gJ1RTSW1wb3J0RXF1YWxzRGVjbGFyYXRpb24nICYmIG5vZGUubW9kdWxlUmVmZXJlbmNlLmV4cHJlc3Npb247XG59XG5cbmZ1bmN0aW9uIGNhbkNyb3NzTm9kZVdoaWxlUmVvcmRlcihub2RlKSB7XG4gIHJldHVybiBpc1BsYWluUmVxdWlyZU1vZHVsZShub2RlKSB8fCBpc1BsYWluSW1wb3J0TW9kdWxlKG5vZGUpIHx8IGlzUGxhaW5JbXBvcnRFcXVhbHMobm9kZSk7XG59XG5cbmZ1bmN0aW9uIGNhblJlb3JkZXJJdGVtcyhmaXJzdE5vZGUsIHNlY29uZE5vZGUpIHtcbiAgY29uc3QgcGFyZW50ID0gZmlyc3ROb2RlLnBhcmVudDtcbiAgY29uc3QgW2ZpcnN0SW5kZXgsIHNlY29uZEluZGV4XSA9IFtcbiAgICBwYXJlbnQuYm9keS5pbmRleE9mKGZpcnN0Tm9kZSksXG4gICAgcGFyZW50LmJvZHkuaW5kZXhPZihzZWNvbmROb2RlKSxcbiAgXS5zb3J0KCk7XG4gIGNvbnN0IG5vZGVzQmV0d2VlbiA9IHBhcmVudC5ib2R5LnNsaWNlKGZpcnN0SW5kZXgsIHNlY29uZEluZGV4ICsgMSk7XG4gIGZvciAoY29uc3Qgbm9kZUJldHdlZW4gb2Ygbm9kZXNCZXR3ZWVuKSB7XG4gICAgaWYgKCFjYW5Dcm9zc05vZGVXaGlsZVJlb3JkZXIobm9kZUJldHdlZW4pKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBmaXhPdXRPZk9yZGVyKGNvbnRleHQsIGZpcnN0Tm9kZSwgc2Vjb25kTm9kZSwgb3JkZXIpIHtcbiAgY29uc3Qgc291cmNlQ29kZSA9IGNvbnRleHQuZ2V0U291cmNlQ29kZSgpO1xuXG4gIGNvbnN0IGZpcnN0Um9vdCA9IGZpbmRSb290Tm9kZShmaXJzdE5vZGUubm9kZSk7XG4gIGNvbnN0IGZpcnN0Um9vdFN0YXJ0ID0gZmluZFN0YXJ0T2ZMaW5lV2l0aENvbW1lbnRzKHNvdXJjZUNvZGUsIGZpcnN0Um9vdCk7XG4gIGNvbnN0IGZpcnN0Um9vdEVuZCA9IGZpbmRFbmRPZkxpbmVXaXRoQ29tbWVudHMoc291cmNlQ29kZSwgZmlyc3RSb290KTtcblxuICBjb25zdCBzZWNvbmRSb290ID0gZmluZFJvb3ROb2RlKHNlY29uZE5vZGUubm9kZSk7XG4gIGNvbnN0IHNlY29uZFJvb3RTdGFydCA9IGZpbmRTdGFydE9mTGluZVdpdGhDb21tZW50cyhzb3VyY2VDb2RlLCBzZWNvbmRSb290KTtcbiAgY29uc3Qgc2Vjb25kUm9vdEVuZCA9IGZpbmRFbmRPZkxpbmVXaXRoQ29tbWVudHMoc291cmNlQ29kZSwgc2Vjb25kUm9vdCk7XG4gIGNvbnN0IGNhbkZpeCA9IGNhblJlb3JkZXJJdGVtcyhmaXJzdFJvb3QsIHNlY29uZFJvb3QpO1xuXG4gIGxldCBuZXdDb2RlID0gc291cmNlQ29kZS50ZXh0LnN1YnN0cmluZyhzZWNvbmRSb290U3RhcnQsIHNlY29uZFJvb3RFbmQpO1xuICBpZiAobmV3Q29kZVtuZXdDb2RlLmxlbmd0aCAtIDFdICE9PSAnXFxuJykge1xuICAgIG5ld0NvZGUgPSBuZXdDb2RlICsgJ1xcbic7XG4gIH1cblxuICBjb25zdCBtZXNzYWdlID0gYFxcYCR7c2Vjb25kTm9kZS5kaXNwbGF5TmFtZX1cXGAgaW1wb3J0IHNob3VsZCBvY2N1ciAke29yZGVyfSBpbXBvcnQgb2YgXFxgJHtmaXJzdE5vZGUuZGlzcGxheU5hbWV9XFxgYDtcblxuICBpZiAob3JkZXIgPT09ICdiZWZvcmUnKSB7XG4gICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgbm9kZTogc2Vjb25kTm9kZS5ub2RlLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgIGZpeDogY2FuRml4ICYmIChmaXhlciA9PlxuICAgICAgICBmaXhlci5yZXBsYWNlVGV4dFJhbmdlKFxuICAgICAgICAgIFtmaXJzdFJvb3RTdGFydCwgc2Vjb25kUm9vdEVuZF0sXG4gICAgICAgICAgbmV3Q29kZSArIHNvdXJjZUNvZGUudGV4dC5zdWJzdHJpbmcoZmlyc3RSb290U3RhcnQsIHNlY29uZFJvb3RTdGFydClcbiAgICAgICAgKSksXG4gICAgfSk7XG4gIH0gZWxzZSBpZiAob3JkZXIgPT09ICdhZnRlcicpIHtcbiAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICBub2RlOiBzZWNvbmROb2RlLm5vZGUsXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgZml4OiBjYW5GaXggJiYgKGZpeGVyID0+XG4gICAgICAgIGZpeGVyLnJlcGxhY2VUZXh0UmFuZ2UoXG4gICAgICAgICAgW3NlY29uZFJvb3RTdGFydCwgZmlyc3RSb290RW5kXSxcbiAgICAgICAgICBzb3VyY2VDb2RlLnRleHQuc3Vic3RyaW5nKHNlY29uZFJvb3RFbmQsIGZpcnN0Um9vdEVuZCkgKyBuZXdDb2RlXG4gICAgICAgICkpLFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlcG9ydE91dE9mT3JkZXIoY29udGV4dCwgaW1wb3J0ZWQsIG91dE9mT3JkZXIsIG9yZGVyKSB7XG4gIG91dE9mT3JkZXIuZm9yRWFjaChmdW5jdGlvbiAoaW1wKSB7XG4gICAgY29uc3QgZm91bmQgPSBpbXBvcnRlZC5maW5kKGZ1bmN0aW9uIGhhc0hpZ2hlclJhbmsoaW1wb3J0ZWRJdGVtKSB7XG4gICAgICByZXR1cm4gaW1wb3J0ZWRJdGVtLnJhbmsgPiBpbXAucmFuaztcbiAgICB9KTtcbiAgICBmaXhPdXRPZk9yZGVyKGNvbnRleHQsIGZvdW5kLCBpbXAsIG9yZGVyKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG1ha2VPdXRPZk9yZGVyUmVwb3J0KGNvbnRleHQsIGltcG9ydGVkKSB7XG4gIGNvbnN0IG91dE9mT3JkZXIgPSBmaW5kT3V0T2ZPcmRlcihpbXBvcnRlZCk7XG4gIGlmICghb3V0T2ZPcmRlci5sZW5ndGgpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gVGhlcmUgYXJlIHRoaW5ncyB0byByZXBvcnQuIFRyeSB0byBtaW5pbWl6ZSB0aGUgbnVtYmVyIG9mIHJlcG9ydGVkIGVycm9ycy5cbiAgY29uc3QgcmV2ZXJzZWRJbXBvcnRlZCA9IHJldmVyc2UoaW1wb3J0ZWQpO1xuICBjb25zdCByZXZlcnNlZE9yZGVyID0gZmluZE91dE9mT3JkZXIocmV2ZXJzZWRJbXBvcnRlZCk7XG4gIGlmIChyZXZlcnNlZE9yZGVyLmxlbmd0aCA8IG91dE9mT3JkZXIubGVuZ3RoKSB7XG4gICAgcmVwb3J0T3V0T2ZPcmRlcihjb250ZXh0LCByZXZlcnNlZEltcG9ydGVkLCByZXZlcnNlZE9yZGVyLCAnYWZ0ZXInKTtcbiAgICByZXR1cm47XG4gIH1cbiAgcmVwb3J0T3V0T2ZPcmRlcihjb250ZXh0LCBpbXBvcnRlZCwgb3V0T2ZPcmRlciwgJ2JlZm9yZScpO1xufVxuXG5mdW5jdGlvbiBnZXRTb3J0ZXIoYXNjZW5kaW5nKSB7XG4gIGNvbnN0IG11bHRpcGxpZXIgPSBhc2NlbmRpbmcgPyAxIDogLTE7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGltcG9ydHNTb3J0ZXIoaW1wb3J0QSwgaW1wb3J0Qikge1xuICAgIGxldCByZXN1bHQ7XG5cbiAgICBpZiAoaW1wb3J0QSA8IGltcG9ydEIpIHtcbiAgICAgIHJlc3VsdCA9IC0xO1xuICAgIH0gZWxzZSBpZiAoaW1wb3J0QSA+IGltcG9ydEIpIHtcbiAgICAgIHJlc3VsdCA9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9IDA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdCAqIG11bHRpcGxpZXI7XG4gIH07XG59XG5cbmZ1bmN0aW9uIG11dGF0ZVJhbmtzVG9BbHBoYWJldGl6ZShpbXBvcnRlZCwgYWxwaGFiZXRpemVPcHRpb25zKSB7XG4gIGNvbnN0IGdyb3VwZWRCeVJhbmtzID0gaW1wb3J0ZWQucmVkdWNlKGZ1bmN0aW9uKGFjYywgaW1wb3J0ZWRJdGVtKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGFjY1tpbXBvcnRlZEl0ZW0ucmFua10pKSB7XG4gICAgICBhY2NbaW1wb3J0ZWRJdGVtLnJhbmtdID0gW107XG4gICAgfVxuICAgIGFjY1tpbXBvcnRlZEl0ZW0ucmFua10ucHVzaChpbXBvcnRlZEl0ZW0pO1xuICAgIHJldHVybiBhY2M7XG4gIH0sIHt9KTtcblxuICBjb25zdCBncm91cFJhbmtzID0gT2JqZWN0LmtleXMoZ3JvdXBlZEJ5UmFua3MpO1xuXG4gIGNvbnN0IHNvcnRlckZuID0gZ2V0U29ydGVyKGFscGhhYmV0aXplT3B0aW9ucy5vcmRlciA9PT0gJ2FzYycpO1xuICBjb25zdCBjb21wYXJhdG9yID0gYWxwaGFiZXRpemVPcHRpb25zLmNhc2VJbnNlbnNpdGl2ZVxuICAgID8gKGEsIGIpID0+IHNvcnRlckZuKFN0cmluZyhhLnZhbHVlKS50b0xvd2VyQ2FzZSgpLCBTdHJpbmcoYi52YWx1ZSkudG9Mb3dlckNhc2UoKSlcbiAgICA6IChhLCBiKSA9PiBzb3J0ZXJGbihhLnZhbHVlLCBiLnZhbHVlKTtcblxuICAvLyBzb3J0IGltcG9ydHMgbG9jYWxseSB3aXRoaW4gdGhlaXIgZ3JvdXBcbiAgZ3JvdXBSYW5rcy5mb3JFYWNoKGZ1bmN0aW9uKGdyb3VwUmFuaykge1xuICAgIGdyb3VwZWRCeVJhbmtzW2dyb3VwUmFua10uc29ydChjb21wYXJhdG9yKTtcbiAgfSk7XG5cbiAgLy8gYXNzaWduIGdsb2JhbGx5IHVuaXF1ZSByYW5rIHRvIGVhY2ggaW1wb3J0XG4gIGxldCBuZXdSYW5rID0gMDtcbiAgY29uc3QgYWxwaGFiZXRpemVkUmFua3MgPSBncm91cFJhbmtzLnNvcnQoKS5yZWR1Y2UoZnVuY3Rpb24oYWNjLCBncm91cFJhbmspIHtcbiAgICBncm91cGVkQnlSYW5rc1tncm91cFJhbmtdLmZvckVhY2goZnVuY3Rpb24oaW1wb3J0ZWRJdGVtKSB7XG4gICAgICBhY2NbYCR7aW1wb3J0ZWRJdGVtLnZhbHVlfXwke2ltcG9ydGVkSXRlbS5ub2RlLmltcG9ydEtpbmR9YF0gPSBwYXJzZUludChncm91cFJhbmssIDEwKSArIG5ld1Jhbms7XG4gICAgICBuZXdSYW5rICs9IDE7XG4gICAgfSk7XG4gICAgcmV0dXJuIGFjYztcbiAgfSwge30pO1xuXG4gIC8vIG11dGF0ZSB0aGUgb3JpZ2luYWwgZ3JvdXAtcmFuayB3aXRoIGFscGhhYmV0aXplZC1yYW5rXG4gIGltcG9ydGVkLmZvckVhY2goZnVuY3Rpb24oaW1wb3J0ZWRJdGVtKSB7XG4gICAgaW1wb3J0ZWRJdGVtLnJhbmsgPSBhbHBoYWJldGl6ZWRSYW5rc1tgJHtpbXBvcnRlZEl0ZW0udmFsdWV9fCR7aW1wb3J0ZWRJdGVtLm5vZGUuaW1wb3J0S2luZH1gXTtcbiAgfSk7XG59XG5cbi8vIERFVEVDVElOR1xuXG5mdW5jdGlvbiBjb21wdXRlUGF0aFJhbmsocmFua3MsIHBhdGhHcm91cHMsIHBhdGgsIG1heFBvc2l0aW9uKSB7XG4gIGZvciAobGV0IGkgPSAwLCBsID0gcGF0aEdyb3Vwcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjb25zdCB7IHBhdHRlcm4sIHBhdHRlcm5PcHRpb25zLCBncm91cCwgcG9zaXRpb24gPSAxIH0gPSBwYXRoR3JvdXBzW2ldO1xuICAgIGlmIChtaW5pbWF0Y2gocGF0aCwgcGF0dGVybiwgcGF0dGVybk9wdGlvbnMgfHwgeyBub2NvbW1lbnQ6IHRydWUgfSkpIHtcbiAgICAgIHJldHVybiByYW5rc1tncm91cF0gKyAocG9zaXRpb24gLyBtYXhQb3NpdGlvbik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVSYW5rKGNvbnRleHQsIHJhbmtzLCBpbXBvcnRFbnRyeSwgZXhjbHVkZWRJbXBvcnRUeXBlcykge1xuICBsZXQgaW1wVHlwZTtcbiAgbGV0IHJhbms7XG4gIGlmIChpbXBvcnRFbnRyeS50eXBlID09PSAnaW1wb3J0Om9iamVjdCcpIHtcbiAgICBpbXBUeXBlID0gJ29iamVjdCc7XG4gIH0gZWxzZSBpZiAoaW1wb3J0RW50cnkubm9kZS5pbXBvcnRLaW5kID09PSAndHlwZScgJiYgcmFua3Mub21pdHRlZFR5cGVzLmluZGV4T2YoJ3R5cGUnKSA9PT0gLTEpIHtcbiAgICBpbXBUeXBlID0gJ3R5cGUnO1xuICB9IGVsc2Uge1xuICAgIGltcFR5cGUgPSBpbXBvcnRUeXBlKGltcG9ydEVudHJ5LnZhbHVlLCBjb250ZXh0KTtcbiAgfVxuICBpZiAoIWV4Y2x1ZGVkSW1wb3J0VHlwZXMuaGFzKGltcFR5cGUpKSB7XG4gICAgcmFuayA9IGNvbXB1dGVQYXRoUmFuayhyYW5rcy5ncm91cHMsIHJhbmtzLnBhdGhHcm91cHMsIGltcG9ydEVudHJ5LnZhbHVlLCByYW5rcy5tYXhQb3NpdGlvbik7XG4gIH1cbiAgaWYgKHR5cGVvZiByYW5rID09PSAndW5kZWZpbmVkJykge1xuICAgIHJhbmsgPSByYW5rcy5ncm91cHNbaW1wVHlwZV07XG4gIH1cbiAgaWYgKGltcG9ydEVudHJ5LnR5cGUgIT09ICdpbXBvcnQnICYmICFpbXBvcnRFbnRyeS50eXBlLnN0YXJ0c1dpdGgoJ2ltcG9ydDonKSkge1xuICAgIHJhbmsgKz0gMTAwO1xuICB9XG5cbiAgcmV0dXJuIHJhbms7XG59XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyTm9kZShjb250ZXh0LCBpbXBvcnRFbnRyeSwgcmFua3MsIGltcG9ydGVkLCBleGNsdWRlZEltcG9ydFR5cGVzKSB7XG4gIGNvbnN0IHJhbmsgPSBjb21wdXRlUmFuayhjb250ZXh0LCByYW5rcywgaW1wb3J0RW50cnksIGV4Y2x1ZGVkSW1wb3J0VHlwZXMpO1xuICBpZiAocmFuayAhPT0gLTEpIHtcbiAgICBpbXBvcnRlZC5wdXNoKE9iamVjdC5hc3NpZ24oe30sIGltcG9ydEVudHJ5LCB7IHJhbmsgfSkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzTW9kdWxlTGV2ZWxSZXF1aXJlKG5vZGUpIHtcbiAgbGV0IG4gPSBub2RlO1xuICAvLyBIYW5kbGUgY2FzZXMgbGlrZSBgY29uc3QgYmF6ID0gcmVxdWlyZSgnZm9vJykuYmFyLmJhemBcbiAgLy8gYW5kIGBjb25zdCBmb28gPSByZXF1aXJlKCdmb28nKSgpYFxuICB3aGlsZSAoXG4gICAgKG4ucGFyZW50LnR5cGUgPT09ICdNZW1iZXJFeHByZXNzaW9uJyAmJiBuLnBhcmVudC5vYmplY3QgPT09IG4pIHx8XG4gICAgKG4ucGFyZW50LnR5cGUgPT09ICdDYWxsRXhwcmVzc2lvbicgJiYgbi5wYXJlbnQuY2FsbGVlID09PSBuKVxuICApIHtcbiAgICBuID0gbi5wYXJlbnQ7XG4gIH1cbiAgcmV0dXJuIChcbiAgICBuLnBhcmVudC50eXBlID09PSAnVmFyaWFibGVEZWNsYXJhdG9yJyAmJlxuICAgIG4ucGFyZW50LnBhcmVudC50eXBlID09PSAnVmFyaWFibGVEZWNsYXJhdGlvbicgJiZcbiAgICBuLnBhcmVudC5wYXJlbnQucGFyZW50LnR5cGUgPT09ICdQcm9ncmFtJ1xuICApO1xufVxuXG5jb25zdCB0eXBlcyA9IFsnYnVpbHRpbicsICdleHRlcm5hbCcsICdpbnRlcm5hbCcsICd1bmtub3duJywgJ3BhcmVudCcsICdzaWJsaW5nJywgJ2luZGV4JywgJ29iamVjdCcsICd0eXBlJ107XG5cbi8vIENyZWF0ZXMgYW4gb2JqZWN0IHdpdGggdHlwZS1yYW5rIHBhaXJzLlxuLy8gRXhhbXBsZTogeyBpbmRleDogMCwgc2libGluZzogMSwgcGFyZW50OiAxLCBleHRlcm5hbDogMSwgYnVpbHRpbjogMiwgaW50ZXJuYWw6IDIgfVxuLy8gV2lsbCB0aHJvdyBhbiBlcnJvciBpZiBpdCBjb250YWlucyBhIHR5cGUgdGhhdCBkb2VzIG5vdCBleGlzdCwgb3IgaGFzIGEgZHVwbGljYXRlXG5mdW5jdGlvbiBjb252ZXJ0R3JvdXBzVG9SYW5rcyhncm91cHMpIHtcbiAgY29uc3QgcmFua09iamVjdCA9IGdyb3Vwcy5yZWR1Y2UoZnVuY3Rpb24ocmVzLCBncm91cCwgaW5kZXgpIHtcbiAgICBpZiAodHlwZW9mIGdyb3VwID09PSAnc3RyaW5nJykge1xuICAgICAgZ3JvdXAgPSBbZ3JvdXBdO1xuICAgIH1cbiAgICBncm91cC5mb3JFYWNoKGZ1bmN0aW9uKGdyb3VwSXRlbSkge1xuICAgICAgaWYgKHR5cGVzLmluZGV4T2YoZ3JvdXBJdGVtKSA9PT0gLTEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmNvcnJlY3QgY29uZmlndXJhdGlvbiBvZiB0aGUgcnVsZTogVW5rbm93biB0eXBlIGAnICtcbiAgICAgICAgICBKU09OLnN0cmluZ2lmeShncm91cEl0ZW0pICsgJ2AnKTtcbiAgICAgIH1cbiAgICAgIGlmIChyZXNbZ3JvdXBJdGVtXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW5jb3JyZWN0IGNvbmZpZ3VyYXRpb24gb2YgdGhlIHJ1bGU6IGAnICsgZ3JvdXBJdGVtICsgJ2AgaXMgZHVwbGljYXRlZCcpO1xuICAgICAgfVxuICAgICAgcmVzW2dyb3VwSXRlbV0gPSBpbmRleDtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzO1xuICB9LCB7fSk7XG5cbiAgY29uc3Qgb21pdHRlZFR5cGVzID0gdHlwZXMuZmlsdGVyKGZ1bmN0aW9uKHR5cGUpIHtcbiAgICByZXR1cm4gcmFua09iamVjdFt0eXBlXSA9PT0gdW5kZWZpbmVkO1xuICB9KTtcblxuICBjb25zdCByYW5rcyA9IG9taXR0ZWRUeXBlcy5yZWR1Y2UoZnVuY3Rpb24ocmVzLCB0eXBlKSB7XG4gICAgcmVzW3R5cGVdID0gZ3JvdXBzLmxlbmd0aDtcbiAgICByZXR1cm4gcmVzO1xuICB9LCByYW5rT2JqZWN0KTtcblxuICByZXR1cm4geyBncm91cHM6IHJhbmtzLCBvbWl0dGVkVHlwZXMgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFBhdGhHcm91cHNGb3JSYW5rcyhwYXRoR3JvdXBzKSB7XG4gIGNvbnN0IGFmdGVyID0ge307XG4gIGNvbnN0IGJlZm9yZSA9IHt9O1xuXG4gIGNvbnN0IHRyYW5zZm9ybWVkID0gcGF0aEdyb3Vwcy5tYXAoKHBhdGhHcm91cCwgaW5kZXgpID0+IHtcbiAgICBjb25zdCB7IGdyb3VwLCBwb3NpdGlvbjogcG9zaXRpb25TdHJpbmcgfSA9IHBhdGhHcm91cDtcbiAgICBsZXQgcG9zaXRpb24gPSAwO1xuICAgIGlmIChwb3NpdGlvblN0cmluZyA9PT0gJ2FmdGVyJykge1xuICAgICAgaWYgKCFhZnRlcltncm91cF0pIHtcbiAgICAgICAgYWZ0ZXJbZ3JvdXBdID0gMTtcbiAgICAgIH1cbiAgICAgIHBvc2l0aW9uID0gYWZ0ZXJbZ3JvdXBdKys7XG4gICAgfSBlbHNlIGlmIChwb3NpdGlvblN0cmluZyA9PT0gJ2JlZm9yZScpIHtcbiAgICAgIGlmICghYmVmb3JlW2dyb3VwXSkge1xuICAgICAgICBiZWZvcmVbZ3JvdXBdID0gW107XG4gICAgICB9XG4gICAgICBiZWZvcmVbZ3JvdXBdLnB1c2goaW5kZXgpO1xuICAgIH1cblxuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBwYXRoR3JvdXAsIHsgcG9zaXRpb24gfSk7XG4gIH0pO1xuXG4gIGxldCBtYXhQb3NpdGlvbiA9IDE7XG5cbiAgT2JqZWN0LmtleXMoYmVmb3JlKS5mb3JFYWNoKChncm91cCkgPT4ge1xuICAgIGNvbnN0IGdyb3VwTGVuZ3RoID0gYmVmb3JlW2dyb3VwXS5sZW5ndGg7XG4gICAgYmVmb3JlW2dyb3VwXS5mb3JFYWNoKChncm91cEluZGV4LCBpbmRleCkgPT4ge1xuICAgICAgdHJhbnNmb3JtZWRbZ3JvdXBJbmRleF0ucG9zaXRpb24gPSAtMSAqIChncm91cExlbmd0aCAtIGluZGV4KTtcbiAgICB9KTtcbiAgICBtYXhQb3NpdGlvbiA9IE1hdGgubWF4KG1heFBvc2l0aW9uLCBncm91cExlbmd0aCk7XG4gIH0pO1xuXG4gIE9iamVjdC5rZXlzKGFmdGVyKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICBjb25zdCBncm91cE5leHRQb3NpdGlvbiA9IGFmdGVyW2tleV07XG4gICAgbWF4UG9zaXRpb24gPSBNYXRoLm1heChtYXhQb3NpdGlvbiwgZ3JvdXBOZXh0UG9zaXRpb24gLSAxKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBwYXRoR3JvdXBzOiB0cmFuc2Zvcm1lZCxcbiAgICBtYXhQb3NpdGlvbjogbWF4UG9zaXRpb24gPiAxMCA/IE1hdGgucG93KDEwLCBNYXRoLmNlaWwoTWF0aC5sb2cxMChtYXhQb3NpdGlvbikpKSA6IDEwLFxuICB9O1xufVxuXG5mdW5jdGlvbiBmaXhOZXdMaW5lQWZ0ZXJJbXBvcnQoY29udGV4dCwgcHJldmlvdXNJbXBvcnQpIHtcbiAgY29uc3QgcHJldlJvb3QgPSBmaW5kUm9vdE5vZGUocHJldmlvdXNJbXBvcnQubm9kZSk7XG4gIGNvbnN0IHRva2Vuc1RvRW5kT2ZMaW5lID0gdGFrZVRva2Vuc0FmdGVyV2hpbGUoXG4gICAgY29udGV4dC5nZXRTb3VyY2VDb2RlKCksIHByZXZSb290LCBjb21tZW50T25TYW1lTGluZUFzKHByZXZSb290KSk7XG5cbiAgbGV0IGVuZE9mTGluZSA9IHByZXZSb290LnJhbmdlWzFdO1xuICBpZiAodG9rZW5zVG9FbmRPZkxpbmUubGVuZ3RoID4gMCkge1xuICAgIGVuZE9mTGluZSA9IHRva2Vuc1RvRW5kT2ZMaW5lW3Rva2Vuc1RvRW5kT2ZMaW5lLmxlbmd0aCAtIDFdLnJhbmdlWzFdO1xuICB9XG4gIHJldHVybiAoZml4ZXIpID0+IGZpeGVyLmluc2VydFRleHRBZnRlclJhbmdlKFtwcmV2Um9vdC5yYW5nZVswXSwgZW5kT2ZMaW5lXSwgJ1xcbicpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVOZXdMaW5lQWZ0ZXJJbXBvcnQoY29udGV4dCwgY3VycmVudEltcG9ydCwgcHJldmlvdXNJbXBvcnQpIHtcbiAgY29uc3Qgc291cmNlQ29kZSA9IGNvbnRleHQuZ2V0U291cmNlQ29kZSgpO1xuICBjb25zdCBwcmV2Um9vdCA9IGZpbmRSb290Tm9kZShwcmV2aW91c0ltcG9ydC5ub2RlKTtcbiAgY29uc3QgY3VyclJvb3QgPSBmaW5kUm9vdE5vZGUoY3VycmVudEltcG9ydC5ub2RlKTtcbiAgY29uc3QgcmFuZ2VUb1JlbW92ZSA9IFtcbiAgICBmaW5kRW5kT2ZMaW5lV2l0aENvbW1lbnRzKHNvdXJjZUNvZGUsIHByZXZSb290KSxcbiAgICBmaW5kU3RhcnRPZkxpbmVXaXRoQ29tbWVudHMoc291cmNlQ29kZSwgY3VyclJvb3QpLFxuICBdO1xuICBpZiAoL15cXHMqJC8udGVzdChzb3VyY2VDb2RlLnRleHQuc3Vic3RyaW5nKHJhbmdlVG9SZW1vdmVbMF0sIHJhbmdlVG9SZW1vdmVbMV0pKSkge1xuICAgIHJldHVybiAoZml4ZXIpID0+IGZpeGVyLnJlbW92ZVJhbmdlKHJhbmdlVG9SZW1vdmUpO1xuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIG1ha2VOZXdsaW5lc0JldHdlZW5SZXBvcnQgKGNvbnRleHQsIGltcG9ydGVkLCBuZXdsaW5lc0JldHdlZW5JbXBvcnRzKSB7XG4gIGNvbnN0IGdldE51bWJlck9mRW1wdHlMaW5lc0JldHdlZW4gPSAoY3VycmVudEltcG9ydCwgcHJldmlvdXNJbXBvcnQpID0+IHtcbiAgICBjb25zdCBsaW5lc0JldHdlZW5JbXBvcnRzID0gY29udGV4dC5nZXRTb3VyY2VDb2RlKCkubGluZXMuc2xpY2UoXG4gICAgICBwcmV2aW91c0ltcG9ydC5ub2RlLmxvYy5lbmQubGluZSxcbiAgICAgIGN1cnJlbnRJbXBvcnQubm9kZS5sb2Muc3RhcnQubGluZSAtIDFcbiAgICApO1xuXG4gICAgcmV0dXJuIGxpbmVzQmV0d2VlbkltcG9ydHMuZmlsdGVyKChsaW5lKSA9PiAhbGluZS50cmltKCkubGVuZ3RoKS5sZW5ndGg7XG4gIH07XG4gIGxldCBwcmV2aW91c0ltcG9ydCA9IGltcG9ydGVkWzBdO1xuXG4gIGltcG9ydGVkLnNsaWNlKDEpLmZvckVhY2goZnVuY3Rpb24oY3VycmVudEltcG9ydCkge1xuICAgIGNvbnN0IGVtcHR5TGluZXNCZXR3ZWVuID0gZ2V0TnVtYmVyT2ZFbXB0eUxpbmVzQmV0d2VlbihjdXJyZW50SW1wb3J0LCBwcmV2aW91c0ltcG9ydCk7XG5cbiAgICBpZiAobmV3bGluZXNCZXR3ZWVuSW1wb3J0cyA9PT0gJ2Fsd2F5cydcbiAgICAgICAgfHwgbmV3bGluZXNCZXR3ZWVuSW1wb3J0cyA9PT0gJ2Fsd2F5cy1hbmQtaW5zaWRlLWdyb3VwcycpIHtcbiAgICAgIGlmIChjdXJyZW50SW1wb3J0LnJhbmsgIT09IHByZXZpb3VzSW1wb3J0LnJhbmsgJiYgZW1wdHlMaW5lc0JldHdlZW4gPT09IDApIHtcbiAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgIG5vZGU6IHByZXZpb3VzSW1wb3J0Lm5vZGUsXG4gICAgICAgICAgbWVzc2FnZTogJ1RoZXJlIHNob3VsZCBiZSBhdCBsZWFzdCBvbmUgZW1wdHkgbGluZSBiZXR3ZWVuIGltcG9ydCBncm91cHMnLFxuICAgICAgICAgIGZpeDogZml4TmV3TGluZUFmdGVySW1wb3J0KGNvbnRleHQsIHByZXZpb3VzSW1wb3J0KSxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKGN1cnJlbnRJbXBvcnQucmFuayA9PT0gcHJldmlvdXNJbXBvcnQucmFua1xuICAgICAgICAmJiBlbXB0eUxpbmVzQmV0d2VlbiA+IDBcbiAgICAgICAgJiYgbmV3bGluZXNCZXR3ZWVuSW1wb3J0cyAhPT0gJ2Fsd2F5cy1hbmQtaW5zaWRlLWdyb3VwcycpIHtcbiAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgIG5vZGU6IHByZXZpb3VzSW1wb3J0Lm5vZGUsXG4gICAgICAgICAgbWVzc2FnZTogJ1RoZXJlIHNob3VsZCBiZSBubyBlbXB0eSBsaW5lIHdpdGhpbiBpbXBvcnQgZ3JvdXAnLFxuICAgICAgICAgIGZpeDogcmVtb3ZlTmV3TGluZUFmdGVySW1wb3J0KGNvbnRleHQsIGN1cnJlbnRJbXBvcnQsIHByZXZpb3VzSW1wb3J0KSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChlbXB0eUxpbmVzQmV0d2VlbiA+IDApIHtcbiAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgbm9kZTogcHJldmlvdXNJbXBvcnQubm9kZSxcbiAgICAgICAgbWVzc2FnZTogJ1RoZXJlIHNob3VsZCBiZSBubyBlbXB0eSBsaW5lIGJldHdlZW4gaW1wb3J0IGdyb3VwcycsXG4gICAgICAgIGZpeDogcmVtb3ZlTmV3TGluZUFmdGVySW1wb3J0KGNvbnRleHQsIGN1cnJlbnRJbXBvcnQsIHByZXZpb3VzSW1wb3J0KSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByZXZpb3VzSW1wb3J0ID0gY3VycmVudEltcG9ydDtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldEFscGhhYmV0aXplQ29uZmlnKG9wdGlvbnMpIHtcbiAgY29uc3QgYWxwaGFiZXRpemUgPSBvcHRpb25zLmFscGhhYmV0aXplIHx8IHt9O1xuICBjb25zdCBvcmRlciA9IGFscGhhYmV0aXplLm9yZGVyIHx8ICdpZ25vcmUnO1xuICBjb25zdCBjYXNlSW5zZW5zaXRpdmUgPSBhbHBoYWJldGl6ZS5jYXNlSW5zZW5zaXRpdmUgfHwgZmFsc2U7XG5cbiAgcmV0dXJuIHsgb3JkZXIsIGNhc2VJbnNlbnNpdGl2ZSB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdzdWdnZXN0aW9uJyxcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ29yZGVyJyksXG4gICAgfSxcblxuICAgIGZpeGFibGU6ICdjb2RlJyxcbiAgICBzY2hlbWE6IFtcbiAgICAgIHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBncm91cHM6IHtcbiAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBwYXRoR3JvdXBzRXhjbHVkZWRJbXBvcnRUeXBlczoge1xuICAgICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHBhdGhHcm91cHM6IHtcbiAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICBpdGVtczoge1xuICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgIHBhdHRlcm46IHtcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcGF0dGVybk9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZ3JvdXA6IHtcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgZW51bTogdHlwZXMsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICBlbnVtOiBbJ2FmdGVyJywgJ2JlZm9yZSddLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3BhdHRlcm4nLCAnZ3JvdXAnXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICAnbmV3bGluZXMtYmV0d2Vlbic6IHtcbiAgICAgICAgICAgIGVudW06IFtcbiAgICAgICAgICAgICAgJ2lnbm9yZScsXG4gICAgICAgICAgICAgICdhbHdheXMnLFxuICAgICAgICAgICAgICAnYWx3YXlzLWFuZC1pbnNpZGUtZ3JvdXBzJyxcbiAgICAgICAgICAgICAgJ25ldmVyJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBhbHBoYWJldGl6ZToge1xuICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgIGNhc2VJbnNlbnNpdGl2ZToge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgb3JkZXI6IHtcbiAgICAgICAgICAgICAgICBlbnVtOiBbJ2lnbm9yZScsICdhc2MnLCAnZGVzYyddLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICdpZ25vcmUnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHdhcm5PblVuYXNzaWduZWRJbXBvcnRzOiB7XG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBhZGRpdGlvbmFsUHJvcGVydGllczogZmFsc2UsXG4gICAgICB9LFxuICAgIF0sXG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbiBpbXBvcnRPcmRlclJ1bGUgKGNvbnRleHQpIHtcbiAgICBjb25zdCBvcHRpb25zID0gY29udGV4dC5vcHRpb25zWzBdIHx8IHt9O1xuICAgIGNvbnN0IG5ld2xpbmVzQmV0d2VlbkltcG9ydHMgPSBvcHRpb25zWyduZXdsaW5lcy1iZXR3ZWVuJ10gfHwgJ2lnbm9yZSc7XG4gICAgY29uc3QgcGF0aEdyb3Vwc0V4Y2x1ZGVkSW1wb3J0VHlwZXMgPSBuZXcgU2V0KG9wdGlvbnNbJ3BhdGhHcm91cHNFeGNsdWRlZEltcG9ydFR5cGVzJ10gfHwgWydidWlsdGluJywgJ2V4dGVybmFsJywgJ29iamVjdCddKTtcbiAgICBjb25zdCBhbHBoYWJldGl6ZSA9IGdldEFscGhhYmV0aXplQ29uZmlnKG9wdGlvbnMpO1xuICAgIGxldCByYW5rcztcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCB7IHBhdGhHcm91cHMsIG1heFBvc2l0aW9uIH0gPSBjb252ZXJ0UGF0aEdyb3Vwc0ZvclJhbmtzKG9wdGlvbnMucGF0aEdyb3VwcyB8fCBbXSk7XG4gICAgICBjb25zdCB7IGdyb3Vwcywgb21pdHRlZFR5cGVzIH0gPSBjb252ZXJ0R3JvdXBzVG9SYW5rcyhvcHRpb25zLmdyb3VwcyB8fCBkZWZhdWx0R3JvdXBzKTtcbiAgICAgIHJhbmtzID0ge1xuICAgICAgICBncm91cHMsXG4gICAgICAgIG9taXR0ZWRUeXBlcyxcbiAgICAgICAgcGF0aEdyb3VwcyxcbiAgICAgICAgbWF4UG9zaXRpb24sXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBNYWxmb3JtZWQgY29uZmlndXJhdGlvblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgUHJvZ3JhbTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgIGNvbnRleHQucmVwb3J0KG5vZGUsIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9XG4gICAgbGV0IGltcG9ydGVkID0gW107XG5cbiAgICByZXR1cm4ge1xuICAgICAgSW1wb3J0RGVjbGFyYXRpb246IGZ1bmN0aW9uIGhhbmRsZUltcG9ydHMobm9kZSkge1xuICAgICAgICAvLyBJZ25vcmluZyB1bmFzc2lnbmVkIGltcG9ydHMgdW5sZXNzIHdhcm5PblVuYXNzaWduZWRJbXBvcnRzIGlzIHNldFxuICAgICAgICBpZiAobm9kZS5zcGVjaWZpZXJzLmxlbmd0aCB8fCBvcHRpb25zLndhcm5PblVuYXNzaWduZWRJbXBvcnRzKSB7XG4gICAgICAgICAgY29uc3QgbmFtZSA9IG5vZGUuc291cmNlLnZhbHVlO1xuICAgICAgICAgIHJlZ2lzdGVyTm9kZShcbiAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgIHZhbHVlOiBuYW1lLFxuICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgdHlwZTogJ2ltcG9ydCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmFua3MsXG4gICAgICAgICAgICBpbXBvcnRlZCxcbiAgICAgICAgICAgIHBhdGhHcm91cHNFeGNsdWRlZEltcG9ydFR5cGVzXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFRTSW1wb3J0RXF1YWxzRGVjbGFyYXRpb246IGZ1bmN0aW9uIGhhbmRsZUltcG9ydHMobm9kZSkge1xuICAgICAgICBsZXQgZGlzcGxheU5hbWU7XG4gICAgICAgIGxldCB2YWx1ZTtcbiAgICAgICAgbGV0IHR5cGU7XG4gICAgICAgIC8vIHNraXAgXCJleHBvcnQgaW1wb3J0XCJzXG4gICAgICAgIGlmIChub2RlLmlzRXhwb3J0KSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLm1vZHVsZVJlZmVyZW5jZS50eXBlID09PSAnVFNFeHRlcm5hbE1vZHVsZVJlZmVyZW5jZScpIHtcbiAgICAgICAgICB2YWx1ZSA9IG5vZGUubW9kdWxlUmVmZXJlbmNlLmV4cHJlc3Npb24udmFsdWU7XG4gICAgICAgICAgZGlzcGxheU5hbWUgPSB2YWx1ZTtcbiAgICAgICAgICB0eXBlID0gJ2ltcG9ydCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWUgPSAnJztcbiAgICAgICAgICBkaXNwbGF5TmFtZSA9IGNvbnRleHQuZ2V0U291cmNlQ29kZSgpLmdldFRleHQobm9kZS5tb2R1bGVSZWZlcmVuY2UpO1xuICAgICAgICAgIHR5cGUgPSAnaW1wb3J0Om9iamVjdCc7XG4gICAgICAgIH1cbiAgICAgICAgcmVnaXN0ZXJOb2RlKFxuICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAge1xuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgZGlzcGxheU5hbWUsXG4gICAgICAgICAgICB0eXBlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcmFua3MsXG4gICAgICAgICAgaW1wb3J0ZWQsXG4gICAgICAgICAgcGF0aEdyb3Vwc0V4Y2x1ZGVkSW1wb3J0VHlwZXNcbiAgICAgICAgKTtcbiAgICAgIH0sXG4gICAgICBDYWxsRXhwcmVzc2lvbjogZnVuY3Rpb24gaGFuZGxlUmVxdWlyZXMobm9kZSkge1xuICAgICAgICBpZiAoIWlzU3RhdGljUmVxdWlyZShub2RlKSB8fCAhaXNNb2R1bGVMZXZlbFJlcXVpcmUobm9kZSkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmFtZSA9IG5vZGUuYXJndW1lbnRzWzBdLnZhbHVlO1xuICAgICAgICByZWdpc3Rlck5vZGUoXG4gICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgdmFsdWU6IG5hbWUsXG4gICAgICAgICAgICBkaXNwbGF5TmFtZTogbmFtZSxcbiAgICAgICAgICAgIHR5cGU6ICdyZXF1aXJlJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJhbmtzLFxuICAgICAgICAgIGltcG9ydGVkLFxuICAgICAgICAgIHBhdGhHcm91cHNFeGNsdWRlZEltcG9ydFR5cGVzXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgICAgJ1Byb2dyYW06ZXhpdCc6IGZ1bmN0aW9uIHJlcG9ydEFuZFJlc2V0KCkge1xuICAgICAgICBpZiAobmV3bGluZXNCZXR3ZWVuSW1wb3J0cyAhPT0gJ2lnbm9yZScpIHtcbiAgICAgICAgICBtYWtlTmV3bGluZXNCZXR3ZWVuUmVwb3J0KGNvbnRleHQsIGltcG9ydGVkLCBuZXdsaW5lc0JldHdlZW5JbXBvcnRzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhbHBoYWJldGl6ZS5vcmRlciAhPT0gJ2lnbm9yZScpIHtcbiAgICAgICAgICBtdXRhdGVSYW5rc1RvQWxwaGFiZXRpemUoaW1wb3J0ZWQsIGFscGhhYmV0aXplKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG1ha2VPdXRPZk9yZGVyUmVwb3J0KGNvbnRleHQsIGltcG9ydGVkKTtcblxuICAgICAgICBpbXBvcnRlZCA9IFtdO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxufTtcbiJdfQ==