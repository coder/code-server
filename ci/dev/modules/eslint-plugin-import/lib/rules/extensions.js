'use strict';var _path = require('path');var _path2 = _interopRequireDefault(_path);

var _resolve = require('eslint-module-utils/resolve');var _resolve2 = _interopRequireDefault(_resolve);
var _importType = require('../core/importType');
var _moduleVisitor = require('eslint-module-utils/moduleVisitor');var _moduleVisitor2 = _interopRequireDefault(_moduleVisitor);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const enumValues = { enum: ['always', 'ignorePackages', 'never'] };
const patternProperties = {
  type: 'object',
  patternProperties: { '.*': enumValues } };

const properties = {
  type: 'object',
  properties: {
    'pattern': patternProperties,
    'ignorePackages': { type: 'boolean' } } };



function buildProperties(context) {

  const result = {
    defaultConfig: 'never',
    pattern: {},
    ignorePackages: false };


  context.options.forEach(obj => {

    // If this is a string, set defaultConfig to its value
    if (typeof obj === 'string') {
      result.defaultConfig = obj;
      return;
    }

    // If this is not the new structure, transfer all props to result.pattern
    if (obj.pattern === undefined && obj.ignorePackages === undefined) {
      Object.assign(result.pattern, obj);
      return;
    }

    // If pattern is provided, transfer all props
    if (obj.pattern !== undefined) {
      Object.assign(result.pattern, obj.pattern);
    }

    // If ignorePackages is provided, transfer it to result
    if (obj.ignorePackages !== undefined) {
      result.ignorePackages = obj.ignorePackages;
    }
  });

  if (result.defaultConfig === 'ignorePackages') {
    result.defaultConfig = 'always';
    result.ignorePackages = true;
  }

  return result;
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('extensions') },


    schema: {
      anyOf: [
      {
        type: 'array',
        items: [enumValues],
        additionalItems: false },

      {
        type: 'array',
        items: [
        enumValues,
        properties],

        additionalItems: false },

      {
        type: 'array',
        items: [properties],
        additionalItems: false },

      {
        type: 'array',
        items: [patternProperties],
        additionalItems: false },

      {
        type: 'array',
        items: [
        enumValues,
        patternProperties],

        additionalItems: false }] } },





  create: function (context) {

    const props = buildProperties(context);

    function getModifier(extension) {
      return props.pattern[extension] || props.defaultConfig;
    }

    function isUseOfExtensionRequired(extension, isPackage) {
      return getModifier(extension) === 'always' && (!props.ignorePackages || !isPackage);
    }

    function isUseOfExtensionForbidden(extension) {
      return getModifier(extension) === 'never';
    }

    function isResolvableWithoutExtension(file) {
      const extension = _path2.default.extname(file);
      const fileWithoutExtension = file.slice(0, -extension.length);
      const resolvedFileWithoutExtension = (0, _resolve2.default)(fileWithoutExtension, context);

      return resolvedFileWithoutExtension === (0, _resolve2.default)(file, context);
    }

    function isExternalRootModule(file) {
      const slashCount = file.split('/').length - 1;

      if (slashCount === 0) return true;
      if ((0, _importType.isScopedModule)(file) && slashCount <= 1) return true;
      return false;
    }

    function checkFileExtension(source) {
      // bail if the declaration doesn't have a source, e.g. "export { foo };"
      if (!source) return;

      const importPathWithQueryString = source.value;

      // don't enforce anything on builtins
      if ((0, _importType.isBuiltIn)(importPathWithQueryString, context.settings)) return;

      const importPath = importPathWithQueryString.replace(/\?(.*)$/, '');

      // don't enforce in root external packages as they may have names with `.js`.
      // Like `import Decimal from decimal.js`)
      if (isExternalRootModule(importPath)) return;

      const resolvedPath = (0, _resolve2.default)(importPath, context);

      // get extension from resolved path, if possible.
      // for unresolved, use source value.
      const extension = _path2.default.extname(resolvedPath || importPath).substring(1);

      // determine if this is a module
      const isPackage = (0, _importType.isExternalModule)(
      importPath,
      context.settings,
      (0, _resolve2.default)(importPath, context),
      context) ||
      (0, _importType.isScoped)(importPath);

      if (!extension || !importPath.endsWith(`.${extension}`)) {
        const extensionRequired = isUseOfExtensionRequired(extension, isPackage);
        const extensionForbidden = isUseOfExtensionForbidden(extension);
        if (extensionRequired && !extensionForbidden) {
          context.report({
            node: source,
            message:
            `Missing file extension ${extension ? `"${extension}" ` : ''}for "${importPathWithQueryString}"` });

        }
      } else if (extension) {
        if (isUseOfExtensionForbidden(extension) && isResolvableWithoutExtension(importPath)) {
          context.report({
            node: source,
            message: `Unexpected use of file extension "${extension}" for "${importPathWithQueryString}"` });

        }
      }
    }

    return (0, _moduleVisitor2.default)(checkFileExtension, { commonjs: true });
  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9leHRlbnNpb25zLmpzIl0sIm5hbWVzIjpbImVudW1WYWx1ZXMiLCJlbnVtIiwicGF0dGVyblByb3BlcnRpZXMiLCJ0eXBlIiwicHJvcGVydGllcyIsImJ1aWxkUHJvcGVydGllcyIsImNvbnRleHQiLCJyZXN1bHQiLCJkZWZhdWx0Q29uZmlnIiwicGF0dGVybiIsImlnbm9yZVBhY2thZ2VzIiwib3B0aW9ucyIsImZvckVhY2giLCJvYmoiLCJ1bmRlZmluZWQiLCJPYmplY3QiLCJhc3NpZ24iLCJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsImRvY3MiLCJ1cmwiLCJzY2hlbWEiLCJhbnlPZiIsIml0ZW1zIiwiYWRkaXRpb25hbEl0ZW1zIiwiY3JlYXRlIiwicHJvcHMiLCJnZXRNb2RpZmllciIsImV4dGVuc2lvbiIsImlzVXNlT2ZFeHRlbnNpb25SZXF1aXJlZCIsImlzUGFja2FnZSIsImlzVXNlT2ZFeHRlbnNpb25Gb3JiaWRkZW4iLCJpc1Jlc29sdmFibGVXaXRob3V0RXh0ZW5zaW9uIiwiZmlsZSIsInBhdGgiLCJleHRuYW1lIiwiZmlsZVdpdGhvdXRFeHRlbnNpb24iLCJzbGljZSIsImxlbmd0aCIsInJlc29sdmVkRmlsZVdpdGhvdXRFeHRlbnNpb24iLCJpc0V4dGVybmFsUm9vdE1vZHVsZSIsInNsYXNoQ291bnQiLCJzcGxpdCIsImNoZWNrRmlsZUV4dGVuc2lvbiIsInNvdXJjZSIsImltcG9ydFBhdGhXaXRoUXVlcnlTdHJpbmciLCJ2YWx1ZSIsInNldHRpbmdzIiwiaW1wb3J0UGF0aCIsInJlcGxhY2UiLCJyZXNvbHZlZFBhdGgiLCJzdWJzdHJpbmciLCJlbmRzV2l0aCIsImV4dGVuc2lvblJlcXVpcmVkIiwiZXh0ZW5zaW9uRm9yYmlkZGVuIiwicmVwb3J0Iiwibm9kZSIsIm1lc3NhZ2UiLCJjb21tb25qcyJdLCJtYXBwaW5ncyI6ImFBQUEsNEI7O0FBRUEsc0Q7QUFDQTtBQUNBLGtFO0FBQ0EscUM7O0FBRUEsTUFB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IGZyb20gJ3BhdGgnO1xuXG5pbXBvcnQgcmVzb2x2ZSBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL3Jlc29sdmUnO1xuaW1wb3J0IHsgaXNCdWlsdEluLCBpc0V4dGVybmFsTW9kdWxlLCBpc1Njb3BlZCwgaXNTY29wZWRNb2R1bGUgfSBmcm9tICcuLi9jb3JlL2ltcG9ydFR5cGUnO1xuaW1wb3J0IG1vZHVsZVZpc2l0b3IgZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy9tb2R1bGVWaXNpdG9yJztcbmltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnO1xuXG5jb25zdCBlbnVtVmFsdWVzID0geyBlbnVtOiBbICdhbHdheXMnLCAnaWdub3JlUGFja2FnZXMnLCAnbmV2ZXInIF0gfTtcbmNvbnN0IHBhdHRlcm5Qcm9wZXJ0aWVzID0ge1xuICB0eXBlOiAnb2JqZWN0JyxcbiAgcGF0dGVyblByb3BlcnRpZXM6IHsgJy4qJzogZW51bVZhbHVlcyB9LFxufTtcbmNvbnN0IHByb3BlcnRpZXMgPSB7XG4gIHR5cGU6ICdvYmplY3QnLFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgJ3BhdHRlcm4nOiBwYXR0ZXJuUHJvcGVydGllcyxcbiAgICAnaWdub3JlUGFja2FnZXMnOiB7IHR5cGU6ICdib29sZWFuJyB9LFxuICB9LFxufTtcblxuZnVuY3Rpb24gYnVpbGRQcm9wZXJ0aWVzKGNvbnRleHQpIHtcblxuICBjb25zdCByZXN1bHQgPSB7XG4gICAgZGVmYXVsdENvbmZpZzogJ25ldmVyJyxcbiAgICBwYXR0ZXJuOiB7fSxcbiAgICBpZ25vcmVQYWNrYWdlczogZmFsc2UsXG4gIH07XG5cbiAgY29udGV4dC5vcHRpb25zLmZvckVhY2gob2JqID0+IHtcblxuICAgIC8vIElmIHRoaXMgaXMgYSBzdHJpbmcsIHNldCBkZWZhdWx0Q29uZmlnIHRvIGl0cyB2YWx1ZVxuICAgIGlmICh0eXBlb2Ygb2JqID09PSAnc3RyaW5nJykge1xuICAgICAgcmVzdWx0LmRlZmF1bHRDb25maWcgPSBvYmo7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgdGhpcyBpcyBub3QgdGhlIG5ldyBzdHJ1Y3R1cmUsIHRyYW5zZmVyIGFsbCBwcm9wcyB0byByZXN1bHQucGF0dGVyblxuICAgIGlmIChvYmoucGF0dGVybiA9PT0gdW5kZWZpbmVkICYmIG9iai5pZ25vcmVQYWNrYWdlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBPYmplY3QuYXNzaWduKHJlc3VsdC5wYXR0ZXJuLCBvYmopO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIHBhdHRlcm4gaXMgcHJvdmlkZWQsIHRyYW5zZmVyIGFsbCBwcm9wc1xuICAgIGlmIChvYmoucGF0dGVybiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBPYmplY3QuYXNzaWduKHJlc3VsdC5wYXR0ZXJuLCBvYmoucGF0dGVybik7XG4gICAgfVxuXG4gICAgLy8gSWYgaWdub3JlUGFja2FnZXMgaXMgcHJvdmlkZWQsIHRyYW5zZmVyIGl0IHRvIHJlc3VsdFxuICAgIGlmIChvYmouaWdub3JlUGFja2FnZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmVzdWx0Lmlnbm9yZVBhY2thZ2VzID0gb2JqLmlnbm9yZVBhY2thZ2VzO1xuICAgIH1cbiAgfSk7XG5cbiAgaWYgKHJlc3VsdC5kZWZhdWx0Q29uZmlnID09PSAnaWdub3JlUGFja2FnZXMnKSB7XG4gICAgcmVzdWx0LmRlZmF1bHRDb25maWcgPSAnYWx3YXlzJztcbiAgICByZXN1bHQuaWdub3JlUGFja2FnZXMgPSB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGE6IHtcbiAgICB0eXBlOiAnc3VnZ2VzdGlvbicsXG4gICAgZG9jczoge1xuICAgICAgdXJsOiBkb2NzVXJsKCdleHRlbnNpb25zJyksXG4gICAgfSxcblxuICAgIHNjaGVtYToge1xuICAgICAgYW55T2Y6IFtcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgaXRlbXM6IFtlbnVtVmFsdWVzXSxcbiAgICAgICAgICBhZGRpdGlvbmFsSXRlbXM6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICBpdGVtczogW1xuICAgICAgICAgICAgZW51bVZhbHVlcyxcbiAgICAgICAgICAgIHByb3BlcnRpZXMsXG4gICAgICAgICAgXSxcbiAgICAgICAgICBhZGRpdGlvbmFsSXRlbXM6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICBpdGVtczogW3Byb3BlcnRpZXNdLFxuICAgICAgICAgIGFkZGl0aW9uYWxJdGVtczogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgIGl0ZW1zOiBbcGF0dGVyblByb3BlcnRpZXNdLFxuICAgICAgICAgIGFkZGl0aW9uYWxJdGVtczogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICBlbnVtVmFsdWVzLFxuICAgICAgICAgICAgcGF0dGVyblByb3BlcnRpZXMsXG4gICAgICAgICAgXSxcbiAgICAgICAgICBhZGRpdGlvbmFsSXRlbXM6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICB9LFxuXG4gIGNyZWF0ZTogZnVuY3Rpb24gKGNvbnRleHQpIHtcblxuICAgIGNvbnN0IHByb3BzID0gYnVpbGRQcm9wZXJ0aWVzKGNvbnRleHQpO1xuXG4gICAgZnVuY3Rpb24gZ2V0TW9kaWZpZXIoZXh0ZW5zaW9uKSB7XG4gICAgICByZXR1cm4gcHJvcHMucGF0dGVybltleHRlbnNpb25dIHx8IHByb3BzLmRlZmF1bHRDb25maWc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNVc2VPZkV4dGVuc2lvblJlcXVpcmVkKGV4dGVuc2lvbiwgaXNQYWNrYWdlKSB7XG4gICAgICByZXR1cm4gZ2V0TW9kaWZpZXIoZXh0ZW5zaW9uKSA9PT0gJ2Fsd2F5cycgJiYgKCFwcm9wcy5pZ25vcmVQYWNrYWdlcyB8fCAhaXNQYWNrYWdlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1VzZU9mRXh0ZW5zaW9uRm9yYmlkZGVuKGV4dGVuc2lvbikge1xuICAgICAgcmV0dXJuIGdldE1vZGlmaWVyKGV4dGVuc2lvbikgPT09ICduZXZlcic7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNSZXNvbHZhYmxlV2l0aG91dEV4dGVuc2lvbihmaWxlKSB7XG4gICAgICBjb25zdCBleHRlbnNpb24gPSBwYXRoLmV4dG5hbWUoZmlsZSk7XG4gICAgICBjb25zdCBmaWxlV2l0aG91dEV4dGVuc2lvbiA9IGZpbGUuc2xpY2UoMCwgLWV4dGVuc2lvbi5sZW5ndGgpO1xuICAgICAgY29uc3QgcmVzb2x2ZWRGaWxlV2l0aG91dEV4dGVuc2lvbiA9IHJlc29sdmUoZmlsZVdpdGhvdXRFeHRlbnNpb24sIGNvbnRleHQpO1xuXG4gICAgICByZXR1cm4gcmVzb2x2ZWRGaWxlV2l0aG91dEV4dGVuc2lvbiA9PT0gcmVzb2x2ZShmaWxlLCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0V4dGVybmFsUm9vdE1vZHVsZShmaWxlKSB7XG4gICAgICBjb25zdCBzbGFzaENvdW50ID0gZmlsZS5zcGxpdCgnLycpLmxlbmd0aCAtIDE7XG5cbiAgICAgIGlmIChzbGFzaENvdW50ID09PSAwKSAgcmV0dXJuIHRydWU7XG4gICAgICBpZiAoaXNTY29wZWRNb2R1bGUoZmlsZSkgJiYgc2xhc2hDb3VudCA8PSAxKSByZXR1cm4gdHJ1ZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja0ZpbGVFeHRlbnNpb24oc291cmNlKSB7XG4gICAgICAvLyBiYWlsIGlmIHRoZSBkZWNsYXJhdGlvbiBkb2Vzbid0IGhhdmUgYSBzb3VyY2UsIGUuZy4gXCJleHBvcnQgeyBmb28gfTtcIlxuICAgICAgaWYgKCFzb3VyY2UpIHJldHVybjtcbiAgICAgIFxuICAgICAgY29uc3QgaW1wb3J0UGF0aFdpdGhRdWVyeVN0cmluZyA9IHNvdXJjZS52YWx1ZTtcblxuICAgICAgLy8gZG9uJ3QgZW5mb3JjZSBhbnl0aGluZyBvbiBidWlsdGluc1xuICAgICAgaWYgKGlzQnVpbHRJbihpbXBvcnRQYXRoV2l0aFF1ZXJ5U3RyaW5nLCBjb250ZXh0LnNldHRpbmdzKSkgcmV0dXJuO1xuXG4gICAgICBjb25zdCBpbXBvcnRQYXRoID0gaW1wb3J0UGF0aFdpdGhRdWVyeVN0cmluZy5yZXBsYWNlKC9cXD8oLiopJC8sICcnKTtcblxuICAgICAgLy8gZG9uJ3QgZW5mb3JjZSBpbiByb290IGV4dGVybmFsIHBhY2thZ2VzIGFzIHRoZXkgbWF5IGhhdmUgbmFtZXMgd2l0aCBgLmpzYC5cbiAgICAgIC8vIExpa2UgYGltcG9ydCBEZWNpbWFsIGZyb20gZGVjaW1hbC5qc2ApXG4gICAgICBpZiAoaXNFeHRlcm5hbFJvb3RNb2R1bGUoaW1wb3J0UGF0aCkpIHJldHVybjtcblxuICAgICAgY29uc3QgcmVzb2x2ZWRQYXRoID0gcmVzb2x2ZShpbXBvcnRQYXRoLCBjb250ZXh0KTtcblxuICAgICAgLy8gZ2V0IGV4dGVuc2lvbiBmcm9tIHJlc29sdmVkIHBhdGgsIGlmIHBvc3NpYmxlLlxuICAgICAgLy8gZm9yIHVucmVzb2x2ZWQsIHVzZSBzb3VyY2UgdmFsdWUuXG4gICAgICBjb25zdCBleHRlbnNpb24gPSBwYXRoLmV4dG5hbWUocmVzb2x2ZWRQYXRoIHx8IGltcG9ydFBhdGgpLnN1YnN0cmluZygxKTtcblxuICAgICAgLy8gZGV0ZXJtaW5lIGlmIHRoaXMgaXMgYSBtb2R1bGVcbiAgICAgIGNvbnN0IGlzUGFja2FnZSA9IGlzRXh0ZXJuYWxNb2R1bGUoXG4gICAgICAgIGltcG9ydFBhdGgsXG4gICAgICAgIGNvbnRleHQuc2V0dGluZ3MsXG4gICAgICAgIHJlc29sdmUoaW1wb3J0UGF0aCwgY29udGV4dCksXG4gICAgICAgIGNvbnRleHRcbiAgICAgICkgfHwgaXNTY29wZWQoaW1wb3J0UGF0aCk7XG5cbiAgICAgIGlmICghZXh0ZW5zaW9uIHx8ICFpbXBvcnRQYXRoLmVuZHNXaXRoKGAuJHtleHRlbnNpb259YCkpIHtcbiAgICAgICAgY29uc3QgZXh0ZW5zaW9uUmVxdWlyZWQgPSBpc1VzZU9mRXh0ZW5zaW9uUmVxdWlyZWQoZXh0ZW5zaW9uLCBpc1BhY2thZ2UpO1xuICAgICAgICBjb25zdCBleHRlbnNpb25Gb3JiaWRkZW4gPSBpc1VzZU9mRXh0ZW5zaW9uRm9yYmlkZGVuKGV4dGVuc2lvbik7XG4gICAgICAgIGlmIChleHRlbnNpb25SZXF1aXJlZCAmJiAhZXh0ZW5zaW9uRm9yYmlkZGVuKSB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgICAgbm9kZTogc291cmNlLFxuICAgICAgICAgICAgbWVzc2FnZTpcbiAgICAgICAgICAgICAgYE1pc3NpbmcgZmlsZSBleHRlbnNpb24gJHtleHRlbnNpb24gPyBgXCIke2V4dGVuc2lvbn1cIiBgIDogJyd9Zm9yIFwiJHtpbXBvcnRQYXRoV2l0aFF1ZXJ5U3RyaW5nfVwiYCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChleHRlbnNpb24pIHtcbiAgICAgICAgaWYgKGlzVXNlT2ZFeHRlbnNpb25Gb3JiaWRkZW4oZXh0ZW5zaW9uKSAmJiBpc1Jlc29sdmFibGVXaXRob3V0RXh0ZW5zaW9uKGltcG9ydFBhdGgpKSB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgICAgbm9kZTogc291cmNlLFxuICAgICAgICAgICAgbWVzc2FnZTogYFVuZXhwZWN0ZWQgdXNlIG9mIGZpbGUgZXh0ZW5zaW9uIFwiJHtleHRlbnNpb259XCIgZm9yIFwiJHtpbXBvcnRQYXRoV2l0aFF1ZXJ5U3RyaW5nfVwiYCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBtb2R1bGVWaXNpdG9yKGNoZWNrRmlsZUV4dGVuc2lvbiwgeyBjb21tb25qczogdHJ1ZSB9KTtcbiAgfSxcbn07XG4iXX0=