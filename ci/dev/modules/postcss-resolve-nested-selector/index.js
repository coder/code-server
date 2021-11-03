module.exports = function resolveNestedSelector(selector, node) {
  var parent = node.parent;
  var parentIsNestAtRule = parent.type === 'atrule' && parent.name === 'nest';

  if (parent.type === 'root') return [selector];
  if (parent.type !== 'rule' && !parentIsNestAtRule) return resolveNestedSelector(selector, parent);

  var parentSelectors = (parentIsNestAtRule)
    ? parent.params.split(',').map(function(s) { return s.trim(); })
    : parent.selectors;

  var resolvedSelectors = parentSelectors.reduce(function(result, parentSelector) {
    if (selector.indexOf('&') !== -1) {
      var newlyResolvedSelectors = resolveNestedSelector(parentSelector, parent).map(function(resolvedParentSelector) {
        return selector.replace(/&/g, resolvedParentSelector);
      });
      return result.concat(newlyResolvedSelectors);
    }

    var combinedSelector = [ parentSelector, selector ].join(' ');
    return result.concat(resolveNestedSelector(combinedSelector, parent));
  }, []);

  return resolvedSelectors;
}
