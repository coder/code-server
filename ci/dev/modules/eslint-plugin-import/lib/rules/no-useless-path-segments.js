'use strict';




var _ignore = require('eslint-module-utils/ignore');
var _moduleVisitor = require('eslint-module-utils/moduleVisitor');var _moduleVisitor2 = _interopRequireDefault(_moduleVisitor);
var _resolve = require('eslint-module-utils/resolve');var _resolve2 = _interopRequireDefault(_resolve);
var _path = require('path');var _path2 = _interopRequireDefault(_path);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

/**
                                                                                                                                                                                     * convert a potentially relative path from node utils into a true
                                                                                                                                                                                     * relative path.
                                                                                                                                                                                     *
                                                                                                                                                                                     * ../ -> ..
                                                                                                                                                                                     * ./ -> .
                                                                                                                                                                                     * .foo/bar -> ./.foo/bar
                                                                                                                                                                                     * ..foo/bar -> ./..foo/bar
                                                                                                                                                                                     * foo/bar -> ./foo/bar
                                                                                                                                                                                     *
                                                                                                                                                                                     * @param relativePath {string} relative posix path potentially missing leading './'
                                                                                                                                                                                     * @returns {string} relative posix path that always starts with a ./
                                                                                                                                                                                     **/
function toRelativePath(relativePath) {
  const stripped = relativePath.replace(/\/$/g, ''); // Remove trailing /

  return (/^((\.\.)|(\.))($|\/)/.test(stripped) ? stripped : `./${stripped}`);
} /**
   * @fileOverview Ensures that there are no useless path segments
   * @author Thomas Grainger
   */function normalize(fn) {return toRelativePath(_path2.default.posix.normalize(fn));
}

function countRelativeParents(pathSegments) {
  return pathSegments.reduce((sum, pathSegment) => pathSegment === '..' ? sum + 1 : sum, 0);
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('no-useless-path-segments') },


    fixable: 'code',

    schema: [
    {
      type: 'object',
      properties: {
        commonjs: { type: 'boolean' },
        noUselessIndex: { type: 'boolean' } },

      additionalProperties: false }] },




  create(context) {
    const currentDir = _path2.default.dirname(context.getFilename());
    const options = context.options[0];

    function checkSourceValue(source) {const
      importPath = source.value;

      function reportWithProposedPath(proposedPath) {
        context.report({
          node: source,
          // Note: Using messageIds is not possible due to the support for ESLint 2 and 3
          message: `Useless path segments for "${importPath}", should be "${proposedPath}"`,
          fix: fixer => proposedPath && fixer.replaceText(source, JSON.stringify(proposedPath)) });

      }

      // Only relative imports are relevant for this rule --> Skip checking
      if (!importPath.startsWith('.')) {
        return;
      }

      // Report rule violation if path is not the shortest possible
      const resolvedPath = (0, _resolve2.default)(importPath, context);
      const normedPath = normalize(importPath);
      const resolvedNormedPath = (0, _resolve2.default)(normedPath, context);
      if (normedPath !== importPath && resolvedPath === resolvedNormedPath) {
        return reportWithProposedPath(normedPath);
      }

      const fileExtensions = (0, _ignore.getFileExtensions)(context.settings);
      const regexUnnecessaryIndex = new RegExp(
      `.*\\/index(\\${Array.from(fileExtensions).join('|\\')})?$`);


      // Check if path contains unnecessary index (including a configured extension)
      if (options && options.noUselessIndex && regexUnnecessaryIndex.test(importPath)) {
        const parentDirectory = _path2.default.dirname(importPath);

        // Try to find ambiguous imports
        if (parentDirectory !== '.' && parentDirectory !== '..') {
          for (const fileExtension of fileExtensions) {
            if ((0, _resolve2.default)(`${parentDirectory}${fileExtension}`, context)) {
              return reportWithProposedPath(`${parentDirectory}/`);
            }
          }
        }

        return reportWithProposedPath(parentDirectory);
      }

      // Path is shortest possible + starts from the current directory --> Return directly
      if (importPath.startsWith('./')) {
        return;
      }

      // Path is not existing --> Return directly (following code requires path to be defined)
      if (resolvedPath === undefined) {
        return;
      }

      const expected = _path2.default.relative(currentDir, resolvedPath); // Expected import path
      const expectedSplit = expected.split(_path2.default.sep); // Split by / or \ (depending on OS)
      const importPathSplit = importPath.replace(/^\.\//, '').split('/');
      const countImportPathRelativeParents = countRelativeParents(importPathSplit);
      const countExpectedRelativeParents = countRelativeParents(expectedSplit);
      const diff = countImportPathRelativeParents - countExpectedRelativeParents;

      // Same number of relative parents --> Paths are the same --> Return directly
      if (diff <= 0) {
        return;
      }

      // Report and propose minimal number of required relative parents
      return reportWithProposedPath(
      toRelativePath(
      importPathSplit.
      slice(0, countExpectedRelativeParents).
      concat(importPathSplit.slice(countImportPathRelativeParents + diff)).
      join('/')));


    }

    return (0, _moduleVisitor2.default)(checkSourceValue, options);
  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby11c2VsZXNzLXBhdGgtc2VnbWVudHMuanMiXSwibmFtZXMiOlsidG9SZWxhdGl2ZVBhdGgiLCJyZWxhdGl2ZVBhdGgiLCJzdHJpcHBlZCIsInJlcGxhY2UiLCJ0ZXN0Iiwibm9ybWFsaXplIiwiZm4iLCJwYXRoIiwicG9zaXgiLCJjb3VudFJlbGF0aXZlUGFyZW50cyIsInBhdGhTZWdtZW50cyIsInJlZHVjZSIsInN1bSIsInBhdGhTZWdtZW50IiwibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJ0eXBlIiwiZG9jcyIsInVybCIsImZpeGFibGUiLCJzY2hlbWEiLCJwcm9wZXJ0aWVzIiwiY29tbW9uanMiLCJub1VzZWxlc3NJbmRleCIsImFkZGl0aW9uYWxQcm9wZXJ0aWVzIiwiY3JlYXRlIiwiY29udGV4dCIsImN1cnJlbnREaXIiLCJkaXJuYW1lIiwiZ2V0RmlsZW5hbWUiLCJvcHRpb25zIiwiY2hlY2tTb3VyY2VWYWx1ZSIsInNvdXJjZSIsImltcG9ydFBhdGgiLCJ2YWx1ZSIsInJlcG9ydFdpdGhQcm9wb3NlZFBhdGgiLCJwcm9wb3NlZFBhdGgiLCJyZXBvcnQiLCJub2RlIiwibWVzc2FnZSIsImZpeCIsImZpeGVyIiwicmVwbGFjZVRleHQiLCJKU09OIiwic3RyaW5naWZ5Iiwic3RhcnRzV2l0aCIsInJlc29sdmVkUGF0aCIsIm5vcm1lZFBhdGgiLCJyZXNvbHZlZE5vcm1lZFBhdGgiLCJmaWxlRXh0ZW5zaW9ucyIsInNldHRpbmdzIiwicmVnZXhVbm5lY2Vzc2FyeUluZGV4IiwiUmVnRXhwIiwiQXJyYXkiLCJmcm9tIiwiam9pbiIsInBhcmVudERpcmVjdG9yeSIsImZpbGVFeHRlbnNpb24iLCJ1bmRlZmluZWQiLCJleHBlY3RlZCIsInJlbGF0aXZlIiwiZXhwZWN0ZWRTcGxpdCIsInNwbGl0Iiwic2VwIiwiaW1wb3J0UGF0aFNwbGl0IiwiY291bnRJbXBvcnRQYXRoUmVsYXRpdmVQYXJlbnRzIiwiY291bnRFeHBl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WjtBQUVHRyxZQUZILENBRVVMLGdCQUFnQkksS0FBaEIsQ0FBc0JILGlDQUFpQ0UsSUFBdkQsQ0FGVjtBQUdHWixVQUhILENBR1EsR0FIUixDQURGLENBREssQ0FBUDs7O0FBUUQ7O0FBRUQsV0FBTyw2QkFBY3hCLGdCQUFkLEVBQWdDRCxPQUFoQyxDQUFQO0FBQ0QsR0F6R2MsRUFBakIiLCJmaWxlIjoibm8tdXNlbGVzcy1wYXRoLXNlZ21lbnRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZU92ZXJ2aWV3IEVuc3VyZXMgdGhhdCB0aGVyZSBhcmUgbm8gdXNlbGVzcyBwYXRoIHNlZ21lbnRzXG4gKiBAYXV0aG9yIFRob21hcyBHcmFpbmdlclxuICovXG5cbmltcG9ydCB7IGdldEZpbGVFeHRlbnNpb25zIH0gZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy9pZ25vcmUnO1xuaW1wb3J0IG1vZHVsZVZpc2l0b3IgZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy9tb2R1bGVWaXNpdG9yJztcbmltcG9ydCByZXNvbHZlIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvcmVzb2x2ZSc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnO1xuXG4vKipcbiAqIGNvbnZlcnQgYSBwb3RlbnRpYWxseSByZWxhdGl2ZSBwYXRoIGZyb20gbm9kZSB1dGlscyBpbnRvIGEgdHJ1ZVxuICogcmVsYXRpdmUgcGF0aC5cbiAqXG4gKiAuLi8gLT4gLi5cbiAqIC4vIC0+IC5cbiAqIC5mb28vYmFyIC0+IC4vLmZvby9iYXJcbiAqIC4uZm9vL2JhciAtPiAuLy4uZm9vL2JhclxuICogZm9vL2JhciAtPiAuL2Zvby9iYXJcbiAqXG4gKiBAcGFyYW0gcmVsYXRpdmVQYXRoIHtzdHJpbmd9IHJlbGF0aXZlIHBvc2l4IHBhdGggcG90ZW50aWFsbHkgbWlzc2luZyBsZWFkaW5nICcuLydcbiAqIEByZXR1cm5zIHtzdHJpbmd9IHJlbGF0aXZlIHBvc2l4IHBhdGggdGhhdCBhbHdheXMgc3RhcnRzIHdpdGggYSAuL1xuICoqL1xuZnVuY3Rpb24gdG9SZWxhdGl2ZVBhdGgocmVsYXRpdmVQYXRoKSB7XG4gIGNvbnN0IHN0cmlwcGVkID0gcmVsYXRpdmVQYXRoLnJlcGxhY2UoL1xcLyQvZywgJycpOyAvLyBSZW1vdmUgdHJhaWxpbmcgL1xuXG4gIHJldHVybiAvXigoXFwuXFwuKXwoXFwuKSkoJHxcXC8pLy50ZXN0KHN0cmlwcGVkKSA/IHN0cmlwcGVkIDogYC4vJHtzdHJpcHBlZH1gO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemUoZm4pIHtcbiAgcmV0dXJuIHRvUmVsYXRpdmVQYXRoKHBhdGgucG9zaXgubm9ybWFsaXplKGZuKSk7XG59XG5cbmZ1bmN0aW9uIGNvdW50UmVsYXRpdmVQYXJlbnRzKHBhdGhTZWdtZW50cykge1xuICByZXR1cm4gcGF0aFNlZ21lbnRzLnJlZHVjZSgoc3VtLCBwYXRoU2VnbWVudCkgPT4gcGF0aFNlZ21lbnQgPT09ICcuLicgPyBzdW0gKyAxIDogc3VtLCAwKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGE6IHtcbiAgICB0eXBlOiAnc3VnZ2VzdGlvbicsXG4gICAgZG9jczoge1xuICAgICAgdXJsOiBkb2NzVXJsKCduby11c2VsZXNzLXBhdGgtc2VnbWVudHMnKSxcbiAgICB9LFxuXG4gICAgZml4YWJsZTogJ2NvZGUnLFxuXG4gICAgc2NoZW1hOiBbXG4gICAgICB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgY29tbW9uanM6IHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgICAgICAgbm9Vc2VsZXNzSW5kZXg6IHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSxcblxuICBjcmVhdGUoY29udGV4dCkge1xuICAgIGNvbnN0IGN1cnJlbnREaXIgPSBwYXRoLmRpcm5hbWUoY29udGV4dC5nZXRGaWxlbmFtZSgpKTtcbiAgICBjb25zdCBvcHRpb25zID0gY29udGV4dC5vcHRpb25zWzBdO1xuXG4gICAgZnVuY3Rpb24gY2hlY2tTb3VyY2VWYWx1ZShzb3VyY2UpIHtcbiAgICAgIGNvbnN0IHsgdmFsdWU6IGltcG9ydFBhdGggfSA9IHNvdXJjZTtcblxuICAgICAgZnVuY3Rpb24gcmVwb3J0V2l0aFByb3Bvc2VkUGF0aChwcm9wb3NlZFBhdGgpIHtcbiAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgIG5vZGU6IHNvdXJjZSxcbiAgICAgICAgICAvLyBOb3RlOiBVc2luZyBtZXNzYWdlSWRzIGlzIG5vdCBwb3NzaWJsZSBkdWUgdG8gdGhlIHN1cHBvcnQgZm9yIEVTTGludCAyIGFuZCAzXG4gICAgICAgICAgbWVzc2FnZTogYFVzZWxlc3MgcGF0aCBzZWdtZW50cyBmb3IgXCIke2ltcG9ydFBhdGh9XCIsIHNob3VsZCBiZSBcIiR7cHJvcG9zZWRQYXRofVwiYCxcbiAgICAgICAgICBmaXg6IGZpeGVyID0+IHByb3Bvc2VkUGF0aCAmJiBmaXhlci5yZXBsYWNlVGV4dChzb3VyY2UsIEpTT04uc3RyaW5naWZ5KHByb3Bvc2VkUGF0aCkpLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gT25seSByZWxhdGl2ZSBpbXBvcnRzIGFyZSByZWxldmFudCBmb3IgdGhpcyBydWxlIC0tPiBTa2lwIGNoZWNraW5nXG4gICAgICBpZiAoIWltcG9ydFBhdGguc3RhcnRzV2l0aCgnLicpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gUmVwb3J0IHJ1bGUgdmlvbGF0aW9uIGlmIHBhdGggaXMgbm90IHRoZSBzaG9ydGVzdCBwb3NzaWJsZVxuICAgICAgY29uc3QgcmVzb2x2ZWRQYXRoID0gcmVzb2x2ZShpbXBvcnRQYXRoLCBjb250ZXh0KTtcbiAgICAgIGNvbnN0IG5vcm1lZFBhdGggPSBub3JtYWxpemUoaW1wb3J0UGF0aCk7XG4gICAgICBjb25zdCByZXNvbHZlZE5vcm1lZFBhdGggPSByZXNvbHZlKG5vcm1lZFBhdGgsIGNvbnRleHQpO1xuICAgICAgaWYgKG5vcm1lZFBhdGggIT09IGltcG9ydFBhdGggJiYgcmVzb2x2ZWRQYXRoID09PSByZXNvbHZlZE5vcm1lZFBhdGgpIHtcbiAgICAgICAgcmV0dXJuIHJlcG9ydFdpdGhQcm9wb3NlZFBhdGgobm9ybWVkUGF0aCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpbGVFeHRlbnNpb25zID0gZ2V0RmlsZUV4dGVuc2lvbnMoY29udGV4dC5zZXR0aW5ncyk7XG4gICAgICBjb25zdCByZWdleFVubmVjZXNzYXJ5SW5kZXggPSBuZXcgUmVnRXhwKFxuICAgICAgICBgLipcXFxcL2luZGV4KFxcXFwke0FycmF5LmZyb20oZmlsZUV4dGVuc2lvbnMpLmpvaW4oJ3xcXFxcJyl9KT8kYFxuICAgICAgKTtcblxuICAgICAgLy8gQ2hlY2sgaWYgcGF0aCBjb250YWlucyB1bm5lY2Vzc2FyeSBpbmRleCAoaW5jbHVkaW5nIGEgY29uZmlndXJlZCBleHRlbnNpb24pXG4gICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLm5vVXNlbGVzc0luZGV4ICYmIHJlZ2V4VW5uZWNlc3NhcnlJbmRleC50ZXN0KGltcG9ydFBhdGgpKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudERpcmVjdG9yeSA9IHBhdGguZGlybmFtZShpbXBvcnRQYXRoKTtcblxuICAgICAgICAvLyBUcnkgdG8gZmluZCBhbWJpZ3VvdXMgaW1wb3J0c1xuICAgICAgICBpZiAocGFyZW50RGlyZWN0b3J5ICE9PSAnLicgJiYgcGFyZW50RGlyZWN0b3J5ICE9PSAnLi4nKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBmaWxlRXh0ZW5zaW9uIG9mIGZpbGVFeHRlbnNpb25zKSB7XG4gICAgICAgICAgICBpZiAocmVzb2x2ZShgJHtwYXJlbnREaXJlY3Rvcnl9JHtmaWxlRXh0ZW5zaW9ufWAsIGNvbnRleHQpKSB7XG4gICAgICAgICAgICAgIHJldHVybiByZXBvcnRXaXRoUHJvcG9zZWRQYXRoKGAke3BhcmVudERpcmVjdG9yeX0vYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlcG9ydFdpdGhQcm9wb3NlZFBhdGgocGFyZW50RGlyZWN0b3J5KTtcbiAgICAgIH1cblxuICAgICAgLy8gUGF0aCBpcyBzaG9ydGVzdCBwb3NzaWJsZSArIHN0YXJ0cyBmcm9tIHRoZSBjdXJyZW50IGRpcmVjdG9yeSAtLT4gUmV0dXJuIGRpcmVjdGx5XG4gICAgICBpZiAoaW1wb3J0UGF0aC5zdGFydHNXaXRoKCcuLycpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gUGF0aCBpcyBub3QgZXhpc3RpbmcgLS0+IFJldHVybiBkaXJlY3RseSAoZm9sbG93aW5nIGNvZGUgcmVxdWlyZXMgcGF0aCB0byBiZSBkZWZpbmVkKVxuICAgICAgaWYgKHJlc29sdmVkUGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZXhwZWN0ZWQgPSBwYXRoLnJlbGF0aXZlKGN1cnJlbnREaXIsIHJlc29sdmVkUGF0aCk7IC8vIEV4cGVjdGVkIGltcG9ydCBwYXRoXG4gICAgICBjb25zdCBleHBlY3RlZFNwbGl0ID0gZXhwZWN0ZWQuc3BsaXQocGF0aC5zZXApOyAvLyBTcGxpdCBieSAvIG9yIFxcIChkZXBlbmRpbmcgb24gT1MpXG4gICAgICBjb25zdCBpbXBvcnRQYXRoU3BsaXQgPSBpbXBvcnRQYXRoLnJlcGxhY2UoL15cXC5cXC8vLCAnJykuc3BsaXQoJy8nKTtcbiAgICAgIGNvbnN0IGNvdW50SW1wb3J0UGF0aFJlbGF0aXZlUGFyZW50cyA9IGNvdW50UmVsYXRpdmVQYXJlbnRzKGltcG9ydFBhdGhTcGxpdCk7XG4gICAgICBjb25zdCBjb3VudEV4cGVjdGVkUmVsYXRpdmVQYXJlbnRzID0gY291bnRSZWxhdGl2ZVBhcmVudHMoZXhwZWN0ZWRTcGxpdCk7XG4gICAgICBjb25zdCBkaWZmID0gY291bnRJbXBvcnRQYXRoUmVsYXRpdmVQYXJlbnRzIC0gY291bnRFeHBlY3RlZFJlbGF0aXZlUGFyZW50cztcblxuICAgICAgLy8gU2FtZSBudW1iZXIgb2YgcmVsYXRpdmUgcGFyZW50cyAtLT4gUGF0aHMgYXJlIHRoZSBzYW1lIC0tPiBSZXR1cm4gZGlyZWN0bHlcbiAgICAgIGlmIChkaWZmIDw9IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXBvcnQgYW5kIHByb3Bvc2UgbWluaW1hbCBudW1iZXIgb2YgcmVxdWlyZWQgcmVsYXRpdmUgcGFyZW50c1xuICAgICAgcmV0dXJuIHJlcG9ydFdpdGhQcm9wb3NlZFBhdGgoXG4gICAgICAgIHRvUmVsYXRpdmVQYXRoKFxuICAgICAgICAgIGltcG9ydFBhdGhTcGxpdFxuICAgICAgICAgICAgLnNsaWNlKDAsIGNvdW50RXhwZWN0ZWRSZWxhdGl2ZVBhcmVudHMpXG4gICAgICAgICAgICAuY29uY2F0KGltcG9ydFBhdGhTcGxpdC5zbGljZShjb3VudEltcG9ydFBhdGhSZWxhdGl2ZVBhcmVudHMgKyBkaWZmKSlcbiAgICAgICAgICAgIC5qb2luKCcvJylcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbW9kdWxlVmlzaXRvcihjaGVja1NvdXJjZVZhbHVlLCBvcHRpb25zKTtcbiAgfSxcbn07XG4iXX0=