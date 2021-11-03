'use strict';var _vm = require('vm');var _vm2 = _interopRequireDefault(_vm);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('dynamic-import-chunkname') },

    schema: [{
      type: 'object',
      properties: {
        importFunctions: {
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'string' } },


        webpackChunknameFormat: {
          type: 'string' } } }] },





  create: function (context) {
    const config = context.options[0];var _ref =
    config || {},_ref$importFunctions = _ref.importFunctions;const importFunctions = _ref$importFunctions === undefined ? [] : _ref$importFunctions;var _ref2 =
    config || {},_ref2$webpackChunknam = _ref2.webpackChunknameFormat;const webpackChunknameFormat = _ref2$webpackChunknam === undefined ? '[0-9a-zA-Z-_/.]+' : _ref2$webpackChunknam;

    const paddedCommentRegex = /^ (\S[\s\S]+\S) $/;
    const commentStyleRegex = /^( \w+: (["'][^"']*["']|\d+|false|true),?)+ $/;
    const chunkSubstrFormat = ` webpackChunkName: ["']${webpackChunknameFormat}["'],? `;
    const chunkSubstrRegex = new RegExp(chunkSubstrFormat);

    function run(node, arg) {
      const sourceCode = context.getSourceCode();
      const leadingComments = sourceCode.getCommentsBefore ?
      sourceCode.getCommentsBefore(arg) // This method is available in ESLint >= 4.
      : sourceCode.getComments(arg).leading; // This method is deprecated in ESLint 7.

      if (!leadingComments || leadingComments.length === 0) {
        context.report({
          node,
          message: 'dynamic imports require a leading comment with the webpack chunkname' });

        return;
      }

      let isChunknamePresent = false;

      for (const comment of leadingComments) {
        if (comment.type !== 'Block') {
          context.report({
            node,
            message: 'dynamic imports require a /* foo */ style comment, not a // foo comment' });

          return;
        }

        if (!paddedCommentRegex.test(comment.value)) {
          context.report({
            node,
            message: `dynamic imports require a block comment padded with spaces - /* foo */` });

          return;
        }

        try {
          // just like webpack itself does
          _vm2.default.runInNewContext(`(function(){return {${comment.value}}})()`);
        }
        catch (error) {
          context.report({
            node,
            message: `dynamic imports require a "webpack" comment with valid syntax` });

          return;
        }

        if (!commentStyleRegex.test(comment.value)) {
          context.report({
            node,
            message:
            `dynamic imports require a leading comment in the form /*${chunkSubstrFormat}*/` });

          return;
        }

        if (chunkSubstrRegex.test(comment.value)) {
          isChunknamePresent = true;
        }
      }

      if (!isChunknamePresent) {
        context.report({
          node,
          message:
          `dynamic imports require a leading comment in the form /*${chunkSubstrFormat}*/` });

      }
    }

    return {
      ImportExpression(node) {
        run(node, node.source);
      },

      CallExpression(node) {
        if (node.callee.type !== 'Import' && importFunctions.indexOf(node.callee.name) < 0) {
          return;
        }

        run(node, node.arguments[0]);
      } };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9keW5hbWljLWltcG9ydC1jaHVua25hbWUuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJ0eXBlIiwiZG9jcyIsInVybCIsInNjaGVtYSIsInByb3BlcnRpZXMiLCJpbXBvcnRGdW5jdGlvbnMiLCJ1bmlxdWVJdGVtcyIsIml0ZW1zIiwid2VicGFja0NodW5rbmFtZUZvcm1hdCIsImNyZWF0ZSIsImNvbnRleHQiLCJjb25maWciLCJvcHRpb25zIiwicGFkZGVkQ29tbWVudFJlZ2V4IiwiY29tbWVudFN0eWxlUmVnZXgiLCJjaHVua1N1YnN0ckZvcm1hdCIsImNodW5rU3Vic3RyUmVnZXgiLCJSZWdFeHAiLCJydW4iLCJub2RlIiwiYXJnIiwic291cmNlQ29kZSIsImdldFNvdXJjZUNvZGUiLCJsZWFkaW5nQ29tbWVudHMiLCJnZXRDb21tZW50c0JlZm9yZSIsImdldENvbW1lbnRzIiwibGVhZGluZyIsImxlbmd0aCIsInJlcG9ydCIsIm1lc3NhZ2UiLCJpc0NodW5rbmFtZVByZXNlbnQiLCJjb21tZW50IiwidGVzdCIsInZhbHVlIiwidm0iLCJydW5Jbk5ld0NvbnRleHQiLCJlcnJvciIsIkltcG9ydEV4cHJlc3Npb24iLCJzb3VyY2UiLCJDYWxsRXhwcmVzc2lvbiIsImNhbGxlZSIsImluZGV4T2YiLCJuYW1lIiwiYXJndW1lbnRzIl0sIm1hcHBpbmdzIjoiYUFBQSx3QjtBQUNBLHFDOztBQUVBQSxPQUFPQyxPQUFQLEdBQWlCO0FBQ2ZDLFFBQU07QUFDSkMsVUFBTSxZQURGO0FBRUpDLFVBQU07QUFDSkMsV0FBSyx1QkFBUSwwQkFBUixDQURELEVBRkY7O0FBS0pDLFlBQVEsQ0FBQztBQUNQSCxZQUFNLFFBREM7QUFFUEksa0JBQVk7QUFDVkMseUJBQWlCO0FBQ2ZMLGdCQUFNLE9BRFM7QUFFZk0sdUJBQWEsSUFGRTtBQUdmQyxpQkFBTztBQUNMUCxrQkFBTSxRQURELEVBSFEsRUFEUDs7O0FBUVZR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bEY7QUFDRDs7QUFFRHhCLFlBQUlDLElBQUosRUFBVUEsS0FBS3dCLFNBQUwsQ0FBZSxDQUFmLENBQVY7QUFDRCxPQVhJLEVBQVA7O0FBYUQsR0FsSGMsRUFBakIiLCJmaWxlIjoiZHluYW1pYy1pbXBvcnQtY2h1bmtuYW1lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHZtIGZyb20gJ3ZtJztcbmltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdzdWdnZXN0aW9uJyxcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ2R5bmFtaWMtaW1wb3J0LWNodW5rbmFtZScpLFxuICAgIH0sXG4gICAgc2NoZW1hOiBbe1xuICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIGltcG9ydEZ1bmN0aW9uczoge1xuICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgdW5pcXVlSXRlbXM6IHRydWUsXG4gICAgICAgICAgaXRlbXM6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHdlYnBhY2tDaHVua25hbWVGb3JtYXQ6IHtcbiAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfV0sXG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbiAoY29udGV4dCkge1xuICAgIGNvbnN0IGNvbmZpZyA9IGNvbnRleHQub3B0aW9uc1swXTtcbiAgICBjb25zdCB7IGltcG9ydEZ1bmN0aW9ucyA9IFtdIH0gPSBjb25maWcgfHwge307XG4gICAgY29uc3QgeyB3ZWJwYWNrQ2h1bmtuYW1lRm9ybWF0ID0gJ1swLTlhLXpBLVotXy8uXSsnIH0gPSBjb25maWcgfHwge307XG5cbiAgICBjb25zdCBwYWRkZWRDb21tZW50UmVnZXggPSAvXiAoXFxTW1xcc1xcU10rXFxTKSAkLztcbiAgICBjb25zdCBjb21tZW50U3R5bGVSZWdleCA9IC9eKCBcXHcrOiAoW1wiJ11bXlwiJ10qW1wiJ118XFxkK3xmYWxzZXx0cnVlKSw/KSsgJC87XG4gICAgY29uc3QgY2h1bmtTdWJzdHJGb3JtYXQgPSBgIHdlYnBhY2tDaHVua05hbWU6IFtcIiddJHt3ZWJwYWNrQ2h1bmtuYW1lRm9ybWF0fVtcIiddLD8gYDtcbiAgICBjb25zdCBjaHVua1N1YnN0clJlZ2V4ID0gbmV3IFJlZ0V4cChjaHVua1N1YnN0ckZvcm1hdCk7XG5cbiAgICBmdW5jdGlvbiBydW4obm9kZSwgYXJnKSB7XG4gICAgICBjb25zdCBzb3VyY2VDb2RlID0gY29udGV4dC5nZXRTb3VyY2VDb2RlKCk7XG4gICAgICBjb25zdCBsZWFkaW5nQ29tbWVudHMgPSBzb3VyY2VDb2RlLmdldENvbW1lbnRzQmVmb3JlXG4gICAgICAgID8gc291cmNlQ29kZS5nZXRDb21tZW50c0JlZm9yZShhcmcpIC8vIFRoaXMgbWV0aG9kIGlzIGF2YWlsYWJsZSBpbiBFU0xpbnQgPj0gNC5cbiAgICAgICAgOiBzb3VyY2VDb2RlLmdldENvbW1lbnRzKGFyZykubGVhZGluZzsgLy8gVGhpcyBtZXRob2QgaXMgZGVwcmVjYXRlZCBpbiBFU0xpbnQgNy5cblxuICAgICAgaWYgKCFsZWFkaW5nQ29tbWVudHMgfHwgbGVhZGluZ0NvbW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgbm9kZSxcbiAgICAgICAgICBtZXNzYWdlOiAnZHluYW1pYyBpbXBvcnRzIHJlcXVpcmUgYSBsZWFkaW5nIGNvbW1lbnQgd2l0aCB0aGUgd2VicGFjayBjaHVua25hbWUnLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBsZXQgaXNDaHVua25hbWVQcmVzZW50ID0gZmFsc2U7XG5cbiAgICAgIGZvciAoY29uc3QgY29tbWVudCBvZiBsZWFkaW5nQ29tbWVudHMpIHtcbiAgICAgICAgaWYgKGNvbW1lbnQudHlwZSAhPT0gJ0Jsb2NrJykge1xuICAgICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICBtZXNzYWdlOiAnZHluYW1pYyBpbXBvcnRzIHJlcXVpcmUgYSAvKiBmb28gKi8gc3R5bGUgY29tbWVudCwgbm90IGEgLy8gZm9vIGNvbW1lbnQnLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghcGFkZGVkQ29tbWVudFJlZ2V4LnRlc3QoY29tbWVudC52YWx1ZSkpIHtcbiAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgbWVzc2FnZTogYGR5bmFtaWMgaW1wb3J0cyByZXF1aXJlIGEgYmxvY2sgY29tbWVudCBwYWRkZWQgd2l0aCBzcGFjZXMgLSAvKiBmb28gKi9gLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8ganVzdCBsaWtlIHdlYnBhY2sgaXRzZWxmIGRvZXNcbiAgICAgICAgICB2bS5ydW5Jbk5ld0NvbnRleHQoYChmdW5jdGlvbigpe3JldHVybiB7JHtjb21tZW50LnZhbHVlfX19KSgpYCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBkeW5hbWljIGltcG9ydHMgcmVxdWlyZSBhIFwid2VicGFja1wiIGNvbW1lbnQgd2l0aCB2YWxpZCBzeW50YXhgLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY29tbWVudFN0eWxlUmVnZXgudGVzdChjb21tZW50LnZhbHVlKSkge1xuICAgICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICBtZXNzYWdlOlxuICAgICAgICAgICAgICBgZHluYW1pYyBpbXBvcnRzIHJlcXVpcmUgYSBsZWFkaW5nIGNvbW1lbnQgaW4gdGhlIGZvcm0gLyoke2NodW5rU3Vic3RyRm9ybWF0fSovYCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2h1bmtTdWJzdHJSZWdleC50ZXN0KGNvbW1lbnQudmFsdWUpKSB7XG4gICAgICAgICAgaXNDaHVua25hbWVQcmVzZW50ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIWlzQ2h1bmtuYW1lUHJlc2VudCkge1xuICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgbm9kZSxcbiAgICAgICAgICBtZXNzYWdlOlxuICAgICAgICAgICAgYGR5bmFtaWMgaW1wb3J0cyByZXF1aXJlIGEgbGVhZGluZyBjb21tZW50IGluIHRoZSBmb3JtIC8qJHtjaHVua1N1YnN0ckZvcm1hdH0qL2AsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBJbXBvcnRFeHByZXNzaW9uKG5vZGUpIHtcbiAgICAgICAgcnVuKG5vZGUsIG5vZGUuc291cmNlKTtcbiAgICAgIH0sXG5cbiAgICAgIENhbGxFeHByZXNzaW9uKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUuY2FsbGVlLnR5cGUgIT09ICdJbXBvcnQnICYmIGltcG9ydEZ1bmN0aW9ucy5pbmRleE9mKG5vZGUuY2FsbGVlLm5hbWUpIDwgMCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJ1bihub2RlLCBub2RlLmFyZ3VtZW50c1swXSk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG59O1xuIl19