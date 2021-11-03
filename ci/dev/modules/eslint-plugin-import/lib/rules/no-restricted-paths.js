'use strict';var _path = require('path');var _path2 = _interopRequireDefault(_path);

var _resolve = require('eslint-module-utils/resolve');var _resolve2 = _interopRequireDefault(_resolve);
var _moduleVisitor = require('eslint-module-utils/moduleVisitor');var _moduleVisitor2 = _interopRequireDefault(_moduleVisitor);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);
var _importType = require('../core/importType');var _importType2 = _interopRequireDefault(_importType);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const containsPath = (filepath, target) => {
  const relative = _path2.default.relative(target, filepath);
  return relative === '' || !relative.startsWith('..');
};

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: (0, _docsUrl2.default)('no-restricted-paths') },


    schema: [
    {
      type: 'object',
      properties: {
        zones: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              target: { type: 'string' },
              from: { type: 'string' },
              except: {
                type: 'array',
                items: {
                  type: 'string' },

                uniqueItems: true },

              message: { type: 'string' } },

            additionalProperties: false } },


        basePath: { type: 'string' } },

      additionalProperties: false }] },




  create: function noRestrictedPaths(context) {
    const options = context.options[0] || {};
    const restrictedPaths = options.zones || [];
    const basePath = options.basePath || process.cwd();
    const currentFilename = context.getFilename();
    const matchingZones = restrictedPaths.filter(zone => {
      const targetPath = _path2.default.resolve(basePath, zone.target);

      return containsPath(currentFilename, targetPath);
    });

    function isValidExceptionPath(absoluteFromPath, absoluteExceptionPath) {
      const relativeExceptionPath = _path2.default.relative(absoluteFromPath, absoluteExceptionPath);

      return (0, _importType2.default)(relativeExceptionPath, context) !== 'parent';
    }

    function reportInvalidExceptionPath(node) {
      context.report({
        node,
        message: 'Restricted path exceptions must be descendants of the configured `from` path for that zone.' });

    }

    const zoneExceptions = matchingZones.map(zone => {
      const exceptionPaths = zone.except || [];
      const absoluteFrom = _path2.default.resolve(basePath, zone.from);
      const absoluteExceptionPaths = exceptionPaths.map(exceptionPath => _path2.default.resolve(absoluteFrom, exceptionPath));
      const hasValidExceptionPaths = absoluteExceptionPaths.
      every(absoluteExceptionPath => isValidExceptionPath(absoluteFrom, absoluteExceptionPath));

      return {
        absoluteExceptionPaths,
        hasValidExceptionPaths };

    });

    function checkForRestrictedImportPath(importPath, node) {
      const absoluteImportPath = (0, _resolve2.default)(importPath, context);

      if (!absoluteImportPath) {
        return;
      }

      matchingZones.forEach((zone, index) => {
        const absoluteFrom = _path2.default.resolve(basePath, zone.from);

        if (!containsPath(absoluteImportPath, absoluteFrom)) {
          return;
        }var _zoneExceptions$index =

        zoneExceptions[index];const hasValidExceptionPaths = _zoneExceptions$index.hasValidExceptionPaths,absoluteExceptionPaths = _zoneExceptions$index.absoluteExceptionPaths;

        if (!hasValidExceptionPaths) {
          reportInvalidExceptionPath(node);
          return;
        }

        const pathIsExcepted = absoluteExceptionPaths.
        some(absoluteExceptionPath => containsPath(absoluteImportPath, absoluteExceptionPath));

        if (pathIsExcepted) {
          return;
        }

        context.report({
          node,
          message: `Unexpected path "{{importPath}}" imported in restricted zone.${zone.message ? ` ${zone.message}` : ''}`,
          data: { importPath } });

      });
    }

    return (0, _moduleVisitor2.default)(source => {
      checkForRestrictedImportPath(source.value, source);
    }, { commonjs: true });
  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1yZXN0cmljdGVkLXBhdGhzLmpzIl0sIm5hbWVzIjpbImNvbnRhaW5zUGF0aCIsImZpbGVwYXRoIiwidGFyZ2V0IiwicmVsYXRpdmUiLCJwYXRoIiwic3RhcnRzV2l0aCIsIm1vZHVsZSIsImV4cG9ydHMiLCJtZXRhIiwidHlwZSIsImRvY3MiLCJ1cmwiLCJzY2hlbWEiLCJwcm9wZXJ0aWVzIiwiem9uZXMiLCJtaW5JdGVtcyIsIml0ZW1zIiwiZnJvbSIsImV4Y2VwdCIsInVuaXF1ZUl0ZW1zIiwibWVzc2FnZSIsImFkZGl0aW9uYWxQcm9wZXJ0aWVzIiwiYmFzZVBhdGgiLCJjcmVhdGUiLCJub1Jlc3RyaWN0ZWRQYXRocyIsImNvbnRleHQiLCJvcHRpb25zIiwicmVzdHJpY3RlZFBhdGhzIiwicHJvY2VzcyIsImN3ZCIsImN1cnJlbnRGaWxlbmFtZSIsImdldEZpbGVuYW1lIiwibWF0Y2hpbmdab25lcyIsImZpbHRlciIsInpvbmUiLCJ0YXJnZXRQYXRoIiwicmVzb2x2ZSIsImlzVmFsaWRFeGNlcHRpb25QYXRoIiwiYWJzb2x1dGVGcm9tUGF0aCIsImFic29sdXRlRXhjZXB0aW9uUGF0aCIsInJlbGF0aXZlRXhjZXB0aW9uUGF0aCIsInJlcG9ydEludmFsaWRFeGNlcHRpb25QYXRoIiwibm9kZSIsInJlcG9ydCIsInpvbmVFeGNlcHRpb25zIiwibWFwIiwiZXhjZXB0aW9uUGF0aHMiLCJhYnNvbHV0ZUZyb20iLCJhYnNvbHV0ZUV4Y2VwdGlvblBhdGhzIiwiZXhjZXB0aW9uUGF0aCIsImhhc1ZhbGlkRXhjZXB0aW9uUGF0aHMiLCJldmVyeSIsImNoZWNrRm9yUmVzdHJpY3RlZEltcG9ydFBhdGgiLCJpbXBvcnRQYXRoIiwiYWJzb2x1dGVJbXBvcnRQYXRoIiwiZm9yRWFjaCIsImluZGV4IiwicGF0aElzRXhjZXB0ZWQiLCJzb21lIiwiZGF0YSIsInNvdXJjZSIsInZhbHVlIiwiY29tbW9uanMiXSwibWFwcGluZ3MiOiJh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LElBQVosRUFGSSxDQUFQO0FBR0QsR0FsSGMsRUFBakIiLCJmaWxlIjoibm8tcmVzdHJpY3RlZC1wYXRocy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5pbXBvcnQgcmVzb2x2ZSBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL3Jlc29sdmUnO1xuaW1wb3J0IG1vZHVsZVZpc2l0b3IgZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy9tb2R1bGVWaXNpdG9yJztcbmltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnO1xuaW1wb3J0IGltcG9ydFR5cGUgZnJvbSAnLi4vY29yZS9pbXBvcnRUeXBlJztcblxuY29uc3QgY29udGFpbnNQYXRoID0gKGZpbGVwYXRoLCB0YXJnZXQpID0+IHtcbiAgY29uc3QgcmVsYXRpdmUgPSBwYXRoLnJlbGF0aXZlKHRhcmdldCwgZmlsZXBhdGgpO1xuICByZXR1cm4gcmVsYXRpdmUgPT09ICcnIHx8ICFyZWxhdGl2ZS5zdGFydHNXaXRoKCcuLicpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGE6IHtcbiAgICB0eXBlOiAncHJvYmxlbScsXG4gICAgZG9jczoge1xuICAgICAgdXJsOiBkb2NzVXJsKCduby1yZXN0cmljdGVkLXBhdGhzJyksXG4gICAgfSxcblxuICAgIHNjaGVtYTogW1xuICAgICAge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHpvbmVzOiB7XG4gICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgICAgbWluSXRlbXM6IDEsXG4gICAgICAgICAgICBpdGVtczoge1xuICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgIHRhcmdldDogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICAgICAgICAgIGZyb206IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgICAgICBleGNlcHQ6IHtcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICAgICAgICBpdGVtczoge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB1bmlxdWVJdGVtczogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgYWRkaXRpb25hbFByb3BlcnRpZXM6IGZhbHNlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJhc2VQYXRoOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIG5vUmVzdHJpY3RlZFBhdGhzKGNvbnRleHQpIHtcbiAgICBjb25zdCBvcHRpb25zID0gY29udGV4dC5vcHRpb25zWzBdIHx8IHt9O1xuICAgIGNvbnN0IHJlc3RyaWN0ZWRQYXRocyA9IG9wdGlvbnMuem9uZXMgfHwgW107XG4gICAgY29uc3QgYmFzZVBhdGggPSBvcHRpb25zLmJhc2VQYXRoIHx8IHByb2Nlc3MuY3dkKCk7XG4gICAgY29uc3QgY3VycmVudEZpbGVuYW1lID0gY29udGV4dC5nZXRGaWxlbmFtZSgpO1xuICAgIGNvbnN0IG1hdGNoaW5nWm9uZXMgPSByZXN0cmljdGVkUGF0aHMuZmlsdGVyKCh6b25lKSA9PiB7XG4gICAgICBjb25zdCB0YXJnZXRQYXRoID0gcGF0aC5yZXNvbHZlKGJhc2VQYXRoLCB6b25lLnRhcmdldCk7XG5cbiAgICAgIHJldHVybiBjb250YWluc1BhdGgoY3VycmVudEZpbGVuYW1lLCB0YXJnZXRQYXRoKTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGlzVmFsaWRFeGNlcHRpb25QYXRoKGFic29sdXRlRnJvbVBhdGgsIGFic29sdXRlRXhjZXB0aW9uUGF0aCkge1xuICAgICAgY29uc3QgcmVsYXRpdmVFeGNlcHRpb25QYXRoID0gcGF0aC5yZWxhdGl2ZShhYnNvbHV0ZUZyb21QYXRoLCBhYnNvbHV0ZUV4Y2VwdGlvblBhdGgpO1xuXG4gICAgICByZXR1cm4gaW1wb3J0VHlwZShyZWxhdGl2ZUV4Y2VwdGlvblBhdGgsIGNvbnRleHQpICE9PSAncGFyZW50JztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXBvcnRJbnZhbGlkRXhjZXB0aW9uUGF0aChub2RlKSB7XG4gICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgIG5vZGUsXG4gICAgICAgIG1lc3NhZ2U6ICdSZXN0cmljdGVkIHBhdGggZXhjZXB0aW9ucyBtdXN0IGJlIGRlc2NlbmRhbnRzIG9mIHRoZSBjb25maWd1cmVkIGBmcm9tYCBwYXRoIGZvciB0aGF0IHpvbmUuJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHpvbmVFeGNlcHRpb25zID0gbWF0Y2hpbmdab25lcy5tYXAoKHpvbmUpID0+IHtcbiAgICAgIGNvbnN0IGV4Y2VwdGlvblBhdGhzID0gem9uZS5leGNlcHQgfHwgW107XG4gICAgICBjb25zdCBhYnNvbHV0ZUZyb20gPSBwYXRoLnJlc29sdmUoYmFzZVBhdGgsIHpvbmUuZnJvbSk7XG4gICAgICBjb25zdCBhYnNvbHV0ZUV4Y2VwdGlvblBhdGhzID0gZXhjZXB0aW9uUGF0aHMubWFwKChleGNlcHRpb25QYXRoKSA9PiBwYXRoLnJlc29sdmUoYWJzb2x1dGVGcm9tLCBleGNlcHRpb25QYXRoKSk7XG4gICAgICBjb25zdCBoYXNWYWxpZEV4Y2VwdGlvblBhdGhzID0gYWJzb2x1dGVFeGNlcHRpb25QYXRoc1xuICAgICAgICAuZXZlcnkoKGFic29sdXRlRXhjZXB0aW9uUGF0aCkgPT4gaXNWYWxpZEV4Y2VwdGlvblBhdGgoYWJzb2x1dGVGcm9tLCBhYnNvbHV0ZUV4Y2VwdGlvblBhdGgpKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYWJzb2x1dGVFeGNlcHRpb25QYXRocyxcbiAgICAgICAgaGFzVmFsaWRFeGNlcHRpb25QYXRocyxcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBjaGVja0ZvclJlc3RyaWN0ZWRJbXBvcnRQYXRoKGltcG9ydFBhdGgsIG5vZGUpIHtcbiAgICAgIGNvbnN0IGFic29sdXRlSW1wb3J0UGF0aCA9IHJlc29sdmUoaW1wb3J0UGF0aCwgY29udGV4dCk7XG5cbiAgICAgIGlmICghYWJzb2x1dGVJbXBvcnRQYXRoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbWF0Y2hpbmdab25lcy5mb3JFYWNoKCh6b25lLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCBhYnNvbHV0ZUZyb20gPSBwYXRoLnJlc29sdmUoYmFzZVBhdGgsIHpvbmUuZnJvbSk7XG5cbiAgICAgICAgaWYgKCFjb250YWluc1BhdGgoYWJzb2x1dGVJbXBvcnRQYXRoLCBhYnNvbHV0ZUZyb20pKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgeyBoYXNWYWxpZEV4Y2VwdGlvblBhdGhzLCBhYnNvbHV0ZUV4Y2VwdGlvblBhdGhzIH0gPSB6b25lRXhjZXB0aW9uc1tpbmRleF07XG5cbiAgICAgICAgaWYgKCFoYXNWYWxpZEV4Y2VwdGlvblBhdGhzKSB7XG4gICAgICAgICAgcmVwb3J0SW52YWxpZEV4Y2VwdGlvblBhdGgobm9kZSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGF0aElzRXhjZXB0ZWQgPSBhYnNvbHV0ZUV4Y2VwdGlvblBhdGhzXG4gICAgICAgICAgLnNvbWUoKGFic29sdXRlRXhjZXB0aW9uUGF0aCkgPT4gY29udGFpbnNQYXRoKGFic29sdXRlSW1wb3J0UGF0aCwgYWJzb2x1dGVFeGNlcHRpb25QYXRoKSk7XG5cbiAgICAgICAgaWYgKHBhdGhJc0V4Y2VwdGVkKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgbWVzc2FnZTogYFVuZXhwZWN0ZWQgcGF0aCBcInt7aW1wb3J0UGF0aH19XCIgaW1wb3J0ZWQgaW4gcmVzdHJpY3RlZCB6b25lLiR7em9uZS5tZXNzYWdlID8gYCAke3pvbmUubWVzc2FnZX1gIDogJyd9YCxcbiAgICAgICAgICBkYXRhOiB7IGltcG9ydFBhdGggfSxcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbW9kdWxlVmlzaXRvcigoc291cmNlKSA9PiB7XG4gICAgICBjaGVja0ZvclJlc3RyaWN0ZWRJbXBvcnRQYXRoKHNvdXJjZS52YWx1ZSwgc291cmNlKTtcbiAgICB9LCB7IGNvbW1vbmpzOiB0cnVlIH0pO1xuICB9LFxufTtcbiJdfQ==