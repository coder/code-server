'use strict';var _moduleVisitor = require('eslint-module-utils/moduleVisitor');var _moduleVisitor2 = _interopRequireDefault(_moduleVisitor);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);
var _path = require('path');
var _resolve = require('eslint-module-utils/resolve');var _resolve2 = _interopRequireDefault(_resolve);

var _importType = require('../core/importType');var _importType2 = _interopRequireDefault(_importType);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('no-relative-parent-imports') },

    schema: [(0, _moduleVisitor.makeOptionsSchema)()] },


  create: function noRelativePackages(context) {
    const myPath = context.getFilename();
    if (myPath === '<text>') return {}; // can't check a non-file

    function checkSourceValue(sourceNode) {
      const depPath = sourceNode.value;

      if ((0, _importType2.default)(depPath, context) === 'external') {// ignore packages
        return;
      }

      const absDepPath = (0, _resolve2.default)(depPath, context);

      if (!absDepPath) {// unable to resolve path
        return;
      }

      const relDepPath = (0, _path.relative)((0, _path.dirname)(myPath), absDepPath);

      if ((0, _importType2.default)(relDepPath, context) === 'parent') {
        context.report({
          node: sourceNode,
          message: 'Relative imports from parent directories are not allowed. ' +
          `Please either pass what you're importing through at runtime ` +
          `(dependency injection), move \`${(0, _path.basename)(myPath)}\` to same ` +
          `directory as \`${depPath}\` or consider making \`${depPath}\` a package.` });

      }
    }

    return (0, _moduleVisitor2.default)(checkSourceValue, context.options[0]);
  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1yZWxhdGl2ZS1wYXJlbnQtaW1wb3J0cy5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsInR5cGUiLCJkb2NzIiwidXJsIiwic2NoZW1hIiwiY3JlYXRlIiwibm9SZWxhdGl2ZVBhY2thZ2VzIiwiY29udGV4dCIsIm15UGF0aCIsImdldEZpbGVuYW1lIiwiY2hlY2tTb3VyY2VWYWx1ZSIsInNvdXJjZU5vZGUiLCJkZXBQYXRoIiwidmFsdWUiLCJhYnNEZXBQYXRoIiwicmVsRGVwUGF0aCIsInJlcG9ydCIsIm5vZGUiLCJtZXNzYWdlIiwib3B0aW9ucyJdLCJtYXBwaW5ncyI6ImFBQUEsa0U7QUFDQSxxQztBQUNBO0FBQ0Esc0Q7O0FBRUEsZ0Q7O0FBRUFBLE9BQU9DLE9BQVAsR0FBaUI7QUFDZkMsUUFBTTtBQUNKQyxVQUFNLFlBREY7QUFFSkMsVUFBTTtBQUNKQyxXQUFLLHVCQUFRLDRCQUFSLENBREQsRUFGRjs7QUFLSkMsWUFBUSxDQUFDLHVDQUFELENBTEosRUFEUzs7O0FBU2ZDLFVBQVEsU0FBU0Msa0JBQVQsQ0FBNEJDLE9BQTVCLEVBQXFDO0FBQzNDLFVBQU1DLFNBQVNELFFBQVFFLFdBQVIsRUFBZjtBQUNBLFFBQUlELFdBQVcsUUFBZixFQUF5QixPQUFPLEVBQVAsQ0FGa0IsQ0FFUDs7QUFFcEMsYUFBU0UsZ0JBQVQsQ0FBMEJDLFVBQTFCLEVBQXNDO0FBQ3BDLFlBQU1DLFVBQVVELFdBQVdFLEtBQTNCOztBQUVBLFVBQUksMEJBQVdELE9BQVgsRUFBb0JMLE9BQXBCLE1BQWlDLFVBQXJDLEVBQWlELENBQUU7QUFDakQ7QUFDRDs7QUFFRCxZQUFNTyxhQUFhLHVCQUFRRixPQUFSLEVBQWlCTCxPQUFqQixDQUFuQjs7QUFFQSxVQUFJLENBQUNPLFVBQUwsRUFBaUIsQ0FBRTtBQUNqQjtBQUNEOztBQUVELFlBQU1DLGFBQWEsb0JBQVMsbUJBQVFQLE1BQVIsQ0FBVCxFQUEwQk0sVUFBMUIsQ0FBbkI7O0FBRUEsVUFBSSwwQkFBV0MsVUFBWCxFQUF1QlIsT0FBdkIsTUFBb0MsUUFBeEMsRUFBa0Q7QUFDaERBLGdCQUFRUyxNQUFSLENBQWU7QUFDYkMsZ0JBQU1OLFVBRE87QUFFYk8sbUJBQVM7QUFDTix3RUFETTtBQUVOLDRDQUFpQyxvQkFBU1YsTUFBVCxDQUFpQixhQUY1QztBQUdOLDRCQUFpQkksT0FBUSwyQkFBMEJBLE9BQVEsZUFMakQsRUFBZjs7QUFPRDtBQUNGOztBQUVELFdBQU8sNkJBQWNGLGdCQUFkLEVBQWdDSCxRQUFRWSxPQUFSLENBQWdCLENBQWhCLENBQWhDLENBQVA7QUFDRCxHQXhDYyxFQUFqQiIsImZpbGUiOiJuby1yZWxhdGl2ZS1wYXJlbnQtaW1wb3J0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtb2R1bGVWaXNpdG9yLCB7IG1ha2VPcHRpb25zU2NoZW1hIH0gZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy9tb2R1bGVWaXNpdG9yJztcbmltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnO1xuaW1wb3J0IHsgYmFzZW5hbWUsIGRpcm5hbWUsIHJlbGF0aXZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgcmVzb2x2ZSBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL3Jlc29sdmUnO1xuXG5pbXBvcnQgaW1wb3J0VHlwZSBmcm9tICcuLi9jb3JlL2ltcG9ydFR5cGUnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdzdWdnZXN0aW9uJyxcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ25vLXJlbGF0aXZlLXBhcmVudC1pbXBvcnRzJyksXG4gICAgfSxcbiAgICBzY2hlbWE6IFttYWtlT3B0aW9uc1NjaGVtYSgpXSxcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIG5vUmVsYXRpdmVQYWNrYWdlcyhjb250ZXh0KSB7XG4gICAgY29uc3QgbXlQYXRoID0gY29udGV4dC5nZXRGaWxlbmFtZSgpO1xuICAgIGlmIChteVBhdGggPT09ICc8dGV4dD4nKSByZXR1cm4ge307IC8vIGNhbid0IGNoZWNrIGEgbm9uLWZpbGVcblxuICAgIGZ1bmN0aW9uIGNoZWNrU291cmNlVmFsdWUoc291cmNlTm9kZSkge1xuICAgICAgY29uc3QgZGVwUGF0aCA9IHNvdXJjZU5vZGUudmFsdWU7XG5cbiAgICAgIGlmIChpbXBvcnRUeXBlKGRlcFBhdGgsIGNvbnRleHQpID09PSAnZXh0ZXJuYWwnKSB7IC8vIGlnbm9yZSBwYWNrYWdlc1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGFic0RlcFBhdGggPSByZXNvbHZlKGRlcFBhdGgsIGNvbnRleHQpO1xuXG4gICAgICBpZiAoIWFic0RlcFBhdGgpIHsgLy8gdW5hYmxlIHRvIHJlc29sdmUgcGF0aFxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlbERlcFBhdGggPSByZWxhdGl2ZShkaXJuYW1lKG15UGF0aCksIGFic0RlcFBhdGgpO1xuXG4gICAgICBpZiAoaW1wb3J0VHlwZShyZWxEZXBQYXRoLCBjb250ZXh0KSA9PT0gJ3BhcmVudCcpIHtcbiAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgIG5vZGU6IHNvdXJjZU5vZGUsXG4gICAgICAgICAgbWVzc2FnZTogJ1JlbGF0aXZlIGltcG9ydHMgZnJvbSBwYXJlbnQgZGlyZWN0b3JpZXMgYXJlIG5vdCBhbGxvd2VkLiAnICtcbiAgICAgICAgICAgIGBQbGVhc2UgZWl0aGVyIHBhc3Mgd2hhdCB5b3UncmUgaW1wb3J0aW5nIHRocm91Z2ggYXQgcnVudGltZSBgICtcbiAgICAgICAgICAgIGAoZGVwZW5kZW5jeSBpbmplY3Rpb24pLCBtb3ZlIFxcYCR7YmFzZW5hbWUobXlQYXRoKX1cXGAgdG8gc2FtZSBgICtcbiAgICAgICAgICAgIGBkaXJlY3RvcnkgYXMgXFxgJHtkZXBQYXRofVxcYCBvciBjb25zaWRlciBtYWtpbmcgXFxgJHtkZXBQYXRofVxcYCBhIHBhY2thZ2UuYCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1vZHVsZVZpc2l0b3IoY2hlY2tTb3VyY2VWYWx1ZSwgY29udGV4dC5vcHRpb25zWzBdKTtcbiAgfSxcbn07XG4iXX0=