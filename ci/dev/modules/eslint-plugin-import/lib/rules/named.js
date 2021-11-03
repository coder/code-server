'use strict';var _path = require('path');var path = _interopRequireWildcard(_path);
var _ExportMap = require('../ExportMap');var _ExportMap2 = _interopRequireDefault(_ExportMap);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];}}newObj.default = obj;return newObj;}}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: (0, _docsUrl2.default)('named') },

    schema: [] },


  create: function (context) {
    function checkSpecifiers(key, type, node) {
      // ignore local exports and type imports/exports
      if (node.source == null || node.importKind === 'type' ||
      node.importKind === 'typeof' || node.exportKind === 'type') {
        return;
      }

      if (!node.specifiers.
      some(function (im) {return im.type === type;})) {
        return; // no named imports/exports
      }

      const imports = _ExportMap2.default.get(node.source.value, context);
      if (imports == null) return;

      if (imports.errors.length) {
        imports.reportErrors(context, node);
        return;
      }

      node.specifiers.forEach(function (im) {
        if (im.type !== type) return;

        // ignore type imports
        if (im.importKind === 'type' || im.importKind === 'typeof') return;

        const deepLookup = imports.hasDeep(im[key].name);

        if (!deepLookup.found) {
          if (deepLookup.path.length > 1) {
            const deepPath = deepLookup.path.
            map(i => path.relative(path.dirname(context.getFilename()), i.path)).
            join(' -> ');

            context.report(im[key],
            `${im[key].name} not found via ${deepPath}`);
          } else {
            context.report(im[key],
            im[key].name + ' not found in \'' + node.source.value + '\'');
          }
        }
      });
    }

    return {
      'ImportDeclaration': checkSpecifiers.bind(null,
      'imported',
      'ImportSpecifier'),


      'ExportNamedDeclaration': checkSpecifiers.bind(null,
      'local',
      'ExportSpecifier') };



  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uYW1lZC5qcyJdLCJuYW1lcyI6WyJwYXRoIiwibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJ0eXBlIiwiZG9jcyIsInVybCIsInNjaGVtYSIsImNyZWF0ZSIsImNvbnRleHQiLCJjaGVja1NwZWNpZmllcnMiLCJrZXkiLCJub2RlIiwic291cmNlIiwiaW1wb3J0S2luZCIsImV4cG9ydEtpbmQiLCJzcGVjaWZpZXJzIiwic29tZSIsImltIiwiaW1wb3J0cyIsIkV4cG9ydHMiLCJnZXQiLCJ2YWx1ZSIsImVycm9ycyIsImxlbmd0aCIsInJlcG9ydEVycm9ycyIsImZvckVhY2giLCJkZWVwTG9va3VwIiwiaGFzRGVlcCIsIm5hbWUiLCJmb3VuZCIsImRlZXBQYXRoIiwibWFwIiwiaSIsInJlbGF0aXZlIiwiZGlybmFtZSIsImdldEZpbGVuYW1lIiwiam9pbiIsInJlcG9ydCIsImJpbmQiXSwibWFwcGluZ3MiOiJhQUFBLDRCLElBQVlBLEk7QUFDWix5QztBQUNBLHFDOztBQUVBQyxPQUFPQyxPQUFQLEdBQWlCO0FBQ2ZDLFFBQU07QUFDSkMsVUFBTSxTQURGO0FBRUpDLFVBQU07QUFDSkMsV0FBSyx1QkFBUSxPQUFSLENBREQsRUFGRjs7QUFLSkMsWUFBUSxFQUxKLEVBRFM7OztBQVNmQyxVQUFRLFVBQVVDLE9BQVYsRUFBbUI7QUFDekIsYUFBU0MsZUFBVCxDQUF5QkMsR0FBekIsRUFBOEJQLElBQTlCLEVBQW9DUSxJQUFwQyxFQUEwQztBQUN4QztBQUNBLFVBQUlBLEtBQUtDLE1BQUwsSUFBZSxJQUFmLElBQXVCRCxLQUFLRSxVQUFMLEtBQW9CLE1BQTNDO0FBQ0FGLFdBQUtFLFVBQUwsS0FBb0IsUUFEcEIsSUFDaUNGLEtBQUtHLFVBQUwsS0FBb0IsTUFEekQsRUFDaUU7QUFDL0Q7QUFDRDs7QUFFRCxVQUFJLENBQUNILEtBQUtJLFVBQUw7QUFDRkMsVUFERSxDQUNHLFVBQVVDLEVBQVYsRUFBYyxDQUFFLE9BQU9BLEdBQUdkLElBQUgsS0FBWUEsSUFBbkIsQ0FBMEIsQ0FEN0MsQ0FBTCxFQUNxRDtBQUNuRCxlQURtRCxDQUMzQztBQUNUOztBQUVELFlBQU1lLFVBQVVDLG9CQUFRQyxHQUFSLENBQVlULEtBQUtDLE1BQUwsQ0FBWVMsS0FBeEIsRUFBK0JiLE9BQS9CLENBQWhCO0FBQ0EsVUFBSVUsV0FBVyxJQUFmLEVBQXFCOztBQUVyQixVQUFJQSxRQUFRSSxNQUFSLENBQWVDLE1BQW5CLEVBQTJCO0FBQ3pCTCxnQkFBUU0sWUFBUixDQUFxQmhCLE9BQXJCLEVBQThCRyxJQUE5QjtBQUNBO0FBQ0Q7O0FBRURBLFdBQUtJLFVBQUwsQ0FBZ0JVLE9BQWhCLENBQXdCLFVBQVVSLEVBQVYsRUFBYztBQUNwQyxZQUFJQSxHQUFHZCxJQUFILEtBQVlBLElBQWhCLEVBQXNCOztBQUV0QjtBQUNBLFlBQUljLEdBQUdKLFVBQUgsS0FBa0IsTUFBbEIsSUFBNEJJLEdBQUdKLFVBQUgsS0FBa0IsUUFBbEQsRUFBNEQ7O0FBRTVELGNBQU1hLGFBQWFSLFFBQVFTLE9BQVIsQ0FBZ0JWLEdBQUdQLEdBQUgsRUFBUWtCLElBQXhCLENBQW5COztBQUVBLFlBQUksQ0FBQ0YsV0FBV0csS0FBaEIsRUFBdUI7QUFDckIsY0FBSUgsV0FBVzNCLElBQVgsQ0FBZ0J3QixNQUFoQixHQUF5QixDQUE3QixFQUFnQztBQUM5QixrQkFBTU8sV0FBV0osV0FBVzNCLElBQVg7QUFDZGdDLGVBRGMsQ0FDVkMsS0FBS2pDLEtBQUtrQyxRQUFMLENBQWNsQyxLQUFLbUMsT0FBTCxDQUFhMUIsUUFBUTJCLFdBQVIsRUFBYixDQUFkLEVBQW1ESCxFQUFFakMsSUFBckQsQ0FESztBQUVkcUMsZ0JBRmMsQ0FFVCxNQUZTLENBQWpCOztBQUlBNUIsb0JBQVE2QixNQUFSLENBQWVwQixHQUFHUCxHQUFILENBQWY7QUFDRyxlQUFFTyxHQUFHUCxHQUFILEVBQVFrQixJQUFLLGtCQUFpQkUsUUFBUyxFQUQ1QztBQUVELFdBUEQsTUFPTztBQUNMdEIsb0JBQVE2QixNQUFSLENBQWVwQixHQUFHUCxHQUFILENBQWY7QUFDRU8sZUFBR1AsR0FBSCxFQUFRa0IsSUFBUixHQUFlLGtCQUFmLEdBQW9DakIsS0FBS0MsTUFBTCxDQUFZUyxLQUFoRCxHQUF3RCxJQUQxRDtBQUVEO0FBQ0Y7QUFDRixPQXJCRDtBQXNCRDs7QUFFRCxXQUFPO0FBQ0wsMkJBQXFCWixnQkFBZ0I2QixJQUFoQixDQUFzQixJQUF0QjtBQUNqQixnQkFEaUI7QUFFakIsdUJBRmlCLENBRGhCOzs7QUFNTCxnQ0FBMEI3QixnQkFBZ0I2QixJQUFoQixDQUFzQixJQUF0QjtBQUN0QixhQURzQjtBQUV0Qix1QkFGc0IsQ0FOckIsRUFBUDs7OztBQVlELEdBbEVjLEVBQWpCIiwiZmlsZSI6Im5hbWVkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBFeHBvcnRzIGZyb20gJy4uL0V4cG9ydE1hcCc7XG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGE6IHtcbiAgICB0eXBlOiAncHJvYmxlbScsXG4gICAgZG9jczoge1xuICAgICAgdXJsOiBkb2NzVXJsKCduYW1lZCcpLFxuICAgIH0sXG4gICAgc2NoZW1hOiBbXSxcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgZnVuY3Rpb24gY2hlY2tTcGVjaWZpZXJzKGtleSwgdHlwZSwgbm9kZSkge1xuICAgICAgLy8gaWdub3JlIGxvY2FsIGV4cG9ydHMgYW5kIHR5cGUgaW1wb3J0cy9leHBvcnRzXG4gICAgICBpZiAobm9kZS5zb3VyY2UgPT0gbnVsbCB8fCBub2RlLmltcG9ydEtpbmQgPT09ICd0eXBlJyB8fFxuICAgICAgICAgIG5vZGUuaW1wb3J0S2luZCA9PT0gJ3R5cGVvZicgIHx8IG5vZGUuZXhwb3J0S2luZCA9PT0gJ3R5cGUnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKCFub2RlLnNwZWNpZmllcnNcbiAgICAgICAgLnNvbWUoZnVuY3Rpb24gKGltKSB7IHJldHVybiBpbS50eXBlID09PSB0eXBlOyB9KSkge1xuICAgICAgICByZXR1cm47IC8vIG5vIG5hbWVkIGltcG9ydHMvZXhwb3J0c1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpbXBvcnRzID0gRXhwb3J0cy5nZXQobm9kZS5zb3VyY2UudmFsdWUsIGNvbnRleHQpO1xuICAgICAgaWYgKGltcG9ydHMgPT0gbnVsbCkgcmV0dXJuO1xuXG4gICAgICBpZiAoaW1wb3J0cy5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgIGltcG9ydHMucmVwb3J0RXJyb3JzKGNvbnRleHQsIG5vZGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIG5vZGUuc3BlY2lmaWVycy5mb3JFYWNoKGZ1bmN0aW9uIChpbSkge1xuICAgICAgICBpZiAoaW0udHlwZSAhPT0gdHlwZSkgcmV0dXJuO1xuXG4gICAgICAgIC8vIGlnbm9yZSB0eXBlIGltcG9ydHNcbiAgICAgICAgaWYgKGltLmltcG9ydEtpbmQgPT09ICd0eXBlJyB8fCBpbS5pbXBvcnRLaW5kID09PSAndHlwZW9mJykgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IGRlZXBMb29rdXAgPSBpbXBvcnRzLmhhc0RlZXAoaW1ba2V5XS5uYW1lKTtcblxuICAgICAgICBpZiAoIWRlZXBMb29rdXAuZm91bmQpIHtcbiAgICAgICAgICBpZiAoZGVlcExvb2t1cC5wYXRoLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGRlZXBQYXRoID0gZGVlcExvb2t1cC5wYXRoXG4gICAgICAgICAgICAgIC5tYXAoaSA9PiBwYXRoLnJlbGF0aXZlKHBhdGguZGlybmFtZShjb250ZXh0LmdldEZpbGVuYW1lKCkpLCBpLnBhdGgpKVxuICAgICAgICAgICAgICAuam9pbignIC0+ICcpO1xuXG4gICAgICAgICAgICBjb250ZXh0LnJlcG9ydChpbVtrZXldLFxuICAgICAgICAgICAgICBgJHtpbVtrZXldLm5hbWV9IG5vdCBmb3VuZCB2aWEgJHtkZWVwUGF0aH1gKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29udGV4dC5yZXBvcnQoaW1ba2V5XSxcbiAgICAgICAgICAgICAgaW1ba2V5XS5uYW1lICsgJyBub3QgZm91bmQgaW4gXFwnJyArIG5vZGUuc291cmNlLnZhbHVlICsgJ1xcJycpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICdJbXBvcnREZWNsYXJhdGlvbic6IGNoZWNrU3BlY2lmaWVycy5iaW5kKCBudWxsXG4gICAgICAgICwgJ2ltcG9ydGVkJ1xuICAgICAgICAsICdJbXBvcnRTcGVjaWZpZXInXG4gICAgICApLFxuXG4gICAgICAnRXhwb3J0TmFtZWREZWNsYXJhdGlvbic6IGNoZWNrU3BlY2lmaWVycy5iaW5kKCBudWxsXG4gICAgICAgICwgJ2xvY2FsJ1xuICAgICAgICAsICdFeHBvcnRTcGVjaWZpZXInXG4gICAgICApLFxuICAgIH07XG5cbiAgfSxcbn07XG4iXX0=