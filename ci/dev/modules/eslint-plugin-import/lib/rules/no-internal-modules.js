'use strict';var _minimatch = require('minimatch');var _minimatch2 = _interopRequireDefault(_minimatch);

var _resolve = require('eslint-module-utils/resolve');var _resolve2 = _interopRequireDefault(_resolve);
var _importType = require('../core/importType');var _importType2 = _interopRequireDefault(_importType);
var _moduleVisitor = require('eslint-module-utils/moduleVisitor');var _moduleVisitor2 = _interopRequireDefault(_moduleVisitor);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('no-internal-modules') },


    schema: [
    {
      oneOf: [
      {
        type: 'object',
        properties: {
          allow: {
            type: 'array',
            items: {
              type: 'string' } } },



        additionalProperties: false },

      {
        type: 'object',
        properties: {
          forbid: {
            type: 'array',
            items: {
              type: 'string' } } },



        additionalProperties: false }] }] },






  create: function noReachingInside(context) {
    const options = context.options[0] || {};
    const allowRegexps = (options.allow || []).map(p => _minimatch2.default.makeRe(p));
    const forbidRegexps = (options.forbid || []).map(p => _minimatch2.default.makeRe(p));

    // minimatch patterns are expected to use / path separators, like import
    // statements, so normalize paths to use the same
    function normalizeSep(somePath) {
      return somePath.split('\\').join('/');
    }

    function toSteps(somePath) {
      return normalizeSep(somePath).
      split('/').
      reduce((acc, step) => {
        if (!step || step === '.') {
          return acc;
        } else if (step === '..') {
          return acc.slice(0, -1);
        } else {
          return acc.concat(step);
        }
      }, []);
    }

    // test if reaching to this destination is allowed
    function reachingAllowed(importPath) {
      return allowRegexps.some(re => re.test(importPath));
    }

    // test if reaching to this destination is forbidden
    function reachingForbidden(importPath) {
      return forbidRegexps.some(re => re.test(importPath));
    }

    function isAllowViolation(importPath) {
      const steps = toSteps(importPath);

      const nonScopeSteps = steps.filter(step => step.indexOf('@') !== 0);
      if (nonScopeSteps.length <= 1) return false;

      // before trying to resolve, see if the raw import (with relative
      // segments resolved) matches an allowed pattern
      const justSteps = steps.join('/');
      if (reachingAllowed(justSteps) || reachingAllowed(`/${justSteps}`)) return false;

      // if the import statement doesn't match directly, try to match the
      // resolved path if the import is resolvable
      const resolved = (0, _resolve2.default)(importPath, context);
      if (!resolved || reachingAllowed(normalizeSep(resolved))) return false;

      // this import was not allowed by the allowed paths, and reaches
      // so it is a violation
      return true;
    }

    function isForbidViolation(importPath) {
      const steps = toSteps(importPath);

      // before trying to resolve, see if the raw import (with relative
      // segments resolved) matches a forbidden pattern
      const justSteps = steps.join('/');

      if (reachingForbidden(justSteps) || reachingForbidden(`/${justSteps}`)) return true;

      // if the import statement doesn't match directly, try to match the
      // resolved path if the import is resolvable
      const resolved = (0, _resolve2.default)(importPath, context);
      if (resolved && reachingForbidden(normalizeSep(resolved))) return true;

      // this import was not forbidden by the forbidden paths so it is not a violation
      return false;
    }

    // find a directory that is being reached into, but which shouldn't be
    const isReachViolation = options.forbid ? isForbidViolation : isAllowViolation;

    function checkImportForReaching(importPath, node) {
      const potentialViolationTypes = ['parent', 'index', 'sibling', 'external', 'internal'];
      if (potentialViolationTypes.indexOf((0, _importType2.default)(importPath, context)) !== -1 &&
      isReachViolation(importPath))
      {
        context.report({
          node,
          message: `Reaching to "${importPath}" is not allowed.` });

      }
    }

    return (0, _moduleVisitor2.default)(source => {
      checkImportForReaching(source.value, source);
    }, { commonjs: true });
  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1pbnRlcm5hbC1tb2R1bGVzLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydHMiLCJtZXRhIiwidHlwZSIsImRvY3MiLCJ1cmwiLCJzY2hlbWEiLCJvbmVPZiIsInByb3BlcnRpZXMiLCJhbGxvdyIsIml0ZW1zIiwiYWRkaXRpb25hbFByb3BlcnRpZXMiLCJmb3JiaWQiLCJjcmVhdGUiLCJub1JlYWNoaW5nSW5zaWRlIiwiY29udGV4dCIsIm9wdGlvbnMiLCJhbGxvd1JlZ2V4cHMiLCJtYXAiLCJwIiwibWluaW1hdGNoIiwibWFrZVJlIiwiZm9yYmlkUmVnZXhwcyIsIm5vcm1hbGl6ZVNlcCIsInNvbWVQYXRoIiwic3BsaXQiLCJqb2luIiwidG9TdGVwcyIsInJlZHVjZSIsImFjYyIsInN0ZXAiLCJzbGljZSIsImNvbmNhdCIsInJlYWNoaW5nQWxsb3dlZCIsImltcG9ydFBhdGgiLCJzb21lIiwicmUiLCJ0ZXN0IiwicmVhY2hpbmdGb3JiaWRkZW4iLCJpc0FsbG93VmlvbGF0aW9uIiwic3RlcHMiLCJub25TY29wZVN0ZXBzIiwiZmlsdGVyIiwiaW5kZXhPZiIsImxlbmd0aCIsImp1c3RTdGVwcyIsInJlc29sdmVkIiwiaXNGb3JiaWRWaW9sYXRpb24iLCJpc1JlYWNoVmlvbGF0aW9uIiwiY2hlY2tJbXBvcnRGb3JSZWFjaGluZyIsIm5vZGUiLCJwb3RlbnRpYWxWaW9sYXRpb25UeXBlcyIsInJlcG9ydCIsIm1lc3NhZ2UiLCJzb3VyY2UiLCJ2YWx1ZSIsImNvbW1vbmpzIl0sIm1hcHBpbmdzIjoiYUFBQSxzQzs7QUFFQSxzRDtBQUNBLGdEO0FBQ0Esa0U7QUFDQSxxQzs7QUFFQUEsT0FBT0MsT0FBUCxHQUFpQjtBQUNmQyxRQUFNO0FBQ0pDLFVBQU0sWUFERjtBQUVKQyxVQUFNO0FBQ0pDLFdBQUssdUJBQVEscUJBQVIsQ0FERCxFQUZGOzs7QUFNSkMsWUFBUTtBQUNOO0FBQ0VDLGFBQU87QUFDTDtBQUNFSixjQUFN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aW50ZXJuYWwtbW9kdWxlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtaW5pbWF0Y2ggZnJvbSAnbWluaW1hdGNoJztcblxuaW1wb3J0IHJlc29sdmUgZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy9yZXNvbHZlJztcbmltcG9ydCBpbXBvcnRUeXBlIGZyb20gJy4uL2NvcmUvaW1wb3J0VHlwZSc7XG5pbXBvcnQgbW9kdWxlVmlzaXRvciBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL21vZHVsZVZpc2l0b3InO1xuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3N1Z2dlc3Rpb24nLFxuICAgIGRvY3M6IHtcbiAgICAgIHVybDogZG9jc1VybCgnbm8taW50ZXJuYWwtbW9kdWxlcycpLFxuICAgIH0sXG5cbiAgICBzY2hlbWE6IFtcbiAgICAgIHtcbiAgICAgICAgb25lT2Y6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgYWxsb3c6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgICAgICAgIGl0ZW1zOiB7XG4gICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICBmb3JiaWQ6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgICAgICAgIGl0ZW1zOiB7XG4gICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICBdLFxuICB9LFxuXG4gIGNyZWF0ZTogZnVuY3Rpb24gbm9SZWFjaGluZ0luc2lkZShjb250ZXh0KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IGNvbnRleHQub3B0aW9uc1swXSB8fCB7fTtcbiAgICBjb25zdCBhbGxvd1JlZ2V4cHMgPSAob3B0aW9ucy5hbGxvdyB8fCBbXSkubWFwKHAgPT4gbWluaW1hdGNoLm1ha2VSZShwKSk7XG4gICAgY29uc3QgZm9yYmlkUmVnZXhwcyA9IChvcHRpb25zLmZvcmJpZCB8fCBbXSkubWFwKHAgPT4gbWluaW1hdGNoLm1ha2VSZShwKSk7XG5cbiAgICAvLyBtaW5pbWF0Y2ggcGF0dGVybnMgYXJlIGV4cGVjdGVkIHRvIHVzZSAvIHBhdGggc2VwYXJhdG9ycywgbGlrZSBpbXBvcnRcbiAgICAvLyBzdGF0ZW1lbnRzLCBzbyBub3JtYWxpemUgcGF0aHMgdG8gdXNlIHRoZSBzYW1lXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplU2VwKHNvbWVQYXRoKSB7XG4gICAgICByZXR1cm4gc29tZVBhdGguc3BsaXQoJ1xcXFwnKS5qb2luKCcvJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdG9TdGVwcyhzb21lUGF0aCkge1xuICAgICAgcmV0dXJuICBub3JtYWxpemVTZXAoc29tZVBhdGgpXG4gICAgICAgIC5zcGxpdCgnLycpXG4gICAgICAgIC5yZWR1Y2UoKGFjYywgc3RlcCkgPT4ge1xuICAgICAgICAgIGlmICghc3RlcCB8fCBzdGVwID09PSAnLicpIHtcbiAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgfSBlbHNlIGlmIChzdGVwID09PSAnLi4nKSB7XG4gICAgICAgICAgICByZXR1cm4gYWNjLnNsaWNlKDAsIC0xKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGFjYy5jb25jYXQoc3RlcCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBbXSk7XG4gICAgfVxuXG4gICAgLy8gdGVzdCBpZiByZWFjaGluZyB0byB0aGlzIGRlc3RpbmF0aW9uIGlzIGFsbG93ZWRcbiAgICBmdW5jdGlvbiByZWFjaGluZ0FsbG93ZWQoaW1wb3J0UGF0aCkge1xuICAgICAgcmV0dXJuIGFsbG93UmVnZXhwcy5zb21lKHJlID0+IHJlLnRlc3QoaW1wb3J0UGF0aCkpO1xuICAgIH1cblxuICAgIC8vIHRlc3QgaWYgcmVhY2hpbmcgdG8gdGhpcyBkZXN0aW5hdGlvbiBpcyBmb3JiaWRkZW5cbiAgICBmdW5jdGlvbiByZWFjaGluZ0ZvcmJpZGRlbihpbXBvcnRQYXRoKSB7XG4gICAgICByZXR1cm4gZm9yYmlkUmVnZXhwcy5zb21lKHJlID0+IHJlLnRlc3QoaW1wb3J0UGF0aCkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzQWxsb3dWaW9sYXRpb24oaW1wb3J0UGF0aCkge1xuICAgICAgY29uc3Qgc3RlcHMgPSB0b1N0ZXBzKGltcG9ydFBhdGgpO1xuXG4gICAgICBjb25zdCBub25TY29wZVN0ZXBzID0gc3RlcHMuZmlsdGVyKHN0ZXAgPT4gc3RlcC5pbmRleE9mKCdAJykgIT09IDApO1xuICAgICAgaWYgKG5vblNjb3BlU3RlcHMubGVuZ3RoIDw9IDEpIHJldHVybiBmYWxzZTtcblxuICAgICAgLy8gYmVmb3JlIHRyeWluZyB0byByZXNvbHZlLCBzZWUgaWYgdGhlIHJhdyBpbXBvcnQgKHdpdGggcmVsYXRpdmVcbiAgICAgIC8vIHNlZ21lbnRzIHJlc29sdmVkKSBtYXRjaGVzIGFuIGFsbG93ZWQgcGF0dGVyblxuICAgICAgY29uc3QganVzdFN0ZXBzID0gc3RlcHMuam9pbignLycpO1xuICAgICAgaWYgKHJlYWNoaW5nQWxsb3dlZChqdXN0U3RlcHMpIHx8IHJlYWNoaW5nQWxsb3dlZChgLyR7anVzdFN0ZXBzfWApKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgIC8vIGlmIHRoZSBpbXBvcnQgc3RhdGVtZW50IGRvZXNuJ3QgbWF0Y2ggZGlyZWN0bHksIHRyeSB0byBtYXRjaCB0aGVcbiAgICAgIC8vIHJlc29sdmVkIHBhdGggaWYgdGhlIGltcG9ydCBpcyByZXNvbHZhYmxlXG4gICAgICBjb25zdCByZXNvbHZlZCA9IHJlc29sdmUoaW1wb3J0UGF0aCwgY29udGV4dCk7XG4gICAgICBpZiAoIXJlc29sdmVkIHx8IHJlYWNoaW5nQWxsb3dlZChub3JtYWxpemVTZXAocmVzb2x2ZWQpKSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAvLyB0aGlzIGltcG9ydCB3YXMgbm90IGFsbG93ZWQgYnkgdGhlIGFsbG93ZWQgcGF0aHMsIGFuZCByZWFjaGVzXG4gICAgICAvLyBzbyBpdCBpcyBhIHZpb2xhdGlvblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNGb3JiaWRWaW9sYXRpb24oaW1wb3J0UGF0aCkge1xuICAgICAgY29uc3Qgc3RlcHMgPSB0b1N0ZXBzKGltcG9ydFBhdGgpO1xuXG4gICAgICAvLyBiZWZvcmUgdHJ5aW5nIHRvIHJlc29sdmUsIHNlZSBpZiB0aGUgcmF3IGltcG9ydCAod2l0aCByZWxhdGl2ZVxuICAgICAgLy8gc2VnbWVudHMgcmVzb2x2ZWQpIG1hdGNoZXMgYSBmb3JiaWRkZW4gcGF0dGVyblxuICAgICAgY29uc3QganVzdFN0ZXBzID0gc3RlcHMuam9pbignLycpO1xuXG4gICAgICBpZiAocmVhY2hpbmdGb3JiaWRkZW4oanVzdFN0ZXBzKSB8fCByZWFjaGluZ0ZvcmJpZGRlbihgLyR7anVzdFN0ZXBzfWApKSByZXR1cm4gdHJ1ZTtcblxuICAgICAgLy8gaWYgdGhlIGltcG9ydCBzdGF0ZW1lbnQgZG9lc24ndCBtYXRjaCBkaXJlY3RseSwgdHJ5IHRvIG1hdGNoIHRoZVxuICAgICAgLy8gcmVzb2x2ZWQgcGF0aCBpZiB0aGUgaW1wb3J0IGlzIHJlc29sdmFibGVcbiAgICAgIGNvbnN0IHJlc29sdmVkID0gcmVzb2x2ZShpbXBvcnRQYXRoLCBjb250ZXh0KTtcbiAgICAgIGlmIChyZXNvbHZlZCAmJiByZWFjaGluZ0ZvcmJpZGRlbihub3JtYWxpemVTZXAocmVzb2x2ZWQpKSkgcmV0dXJuIHRydWU7XG5cbiAgICAgIC8vIHRoaXMgaW1wb3J0IHdhcyBub3QgZm9yYmlkZGVuIGJ5IHRoZSBmb3JiaWRkZW4gcGF0aHMgc28gaXQgaXMgbm90IGEgdmlvbGF0aW9uXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gZmluZCBhIGRpcmVjdG9yeSB0aGF0IGlzIGJlaW5nIHJlYWNoZWQgaW50bywgYnV0IHdoaWNoIHNob3VsZG4ndCBiZVxuICAgIGNvbnN0IGlzUmVhY2hWaW9sYXRpb24gPSBvcHRpb25zLmZvcmJpZCA/IGlzRm9yYmlkVmlvbGF0aW9uIDogaXNBbGxvd1Zpb2xhdGlvbjtcblxuICAgIGZ1bmN0aW9uIGNoZWNrSW1wb3J0Rm9yUmVhY2hpbmcoaW1wb3J0UGF0aCwgbm9kZSkge1xuICAgICAgY29uc3QgcG90ZW50aWFsVmlvbGF0aW9uVHlwZXMgPSBbJ3BhcmVudCcsICdpbmRleCcsICdzaWJsaW5nJywgJ2V4dGVybmFsJywgJ2ludGVybmFsJ107XG4gICAgICBpZiAocG90ZW50aWFsVmlvbGF0aW9uVHlwZXMuaW5kZXhPZihpbXBvcnRUeXBlKGltcG9ydFBhdGgsIGNvbnRleHQpKSAhPT0gLTEgJiZcbiAgICAgICAgaXNSZWFjaFZpb2xhdGlvbihpbXBvcnRQYXRoKVxuICAgICAgKSB7XG4gICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICBub2RlLFxuICAgICAgICAgIG1lc3NhZ2U6IGBSZWFjaGluZyB0byBcIiR7aW1wb3J0UGF0aH1cIiBpcyBub3QgYWxsb3dlZC5gLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbW9kdWxlVmlzaXRvcigoc291cmNlKSA9PiB7XG4gICAgICBjaGVja0ltcG9ydEZvclJlYWNoaW5nKHNvdXJjZS52YWx1ZSwgc291cmNlKTtcbiAgICB9LCB7IGNvbW1vbmpzOiB0cnVlIH0pO1xuICB9LFxufTtcbiJdfQ==