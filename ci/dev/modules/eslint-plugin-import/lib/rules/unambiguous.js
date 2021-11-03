'use strict';




var _unambiguous = require('eslint-module-utils/unambiguous');
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /**
                                                                                                                                                                                     * @fileOverview Report modules that could parse incorrectly as scripts.
                                                                                                                                                                                     * @author Ben Mosher
                                                                                                                                                                                     */module.exports = { meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('unambiguous') },

    schema: [] },


  create: function (context) {
    // ignore non-modules
    if (context.parserOptions.sourceType !== 'module') {
      return {};
    }

    return {
      Program: function (ast) {
        if (!(0, _unambiguous.isModule)(ast)) {
          context.report({
            node: ast,
            message: 'This module could be parsed as a valid script.' });

        }
      } };


  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy91bmFtYmlndW91cy5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsInR5cGUiLCJkb2NzIiwidXJsIiwic2NoZW1hIiwiY3JlYXRlIiwiY29udGV4dCIsInBhcnNlck9wdGlvbnMiLCJzb3VyY2VUeXBlIiwiUHJvZ3JhbSIsImFzdCIsInJlcG9ydCIsIm5vZGUiLCJtZXNzYWdlIl0sIm1hcHBpbmdzIjoiOzs7OztBQUtBO0FBQ0EscUMsK0lBTkE7Ozt1TEFRQUEsT0FBT0MsT0FBUCxHQUFpQixFQUNmQyxNQUFNO0FBQ0pDLFVBQU0sWUFERjtBQUVKQyxVQUFNO0FBQ0pDLFdBQUssdUJBQVEsYUFBUixDQURELEVBRkY7O0FBS0pDLFlBQVEsRUFMSixFQURTOzs7QUFTZkMsVUFBUSxVQUFVQyxPQUFWLEVBQW1CO0FBQ3pCO0FBQ0EsUUFBSUEsUUFBUUMsYUFBUixDQUFzQkMsVUFBdEIsS0FBcUMsUUFBekMsRUFBbUQ7QUFDakQsYUFBTyxFQUFQO0FBQ0Q7O0FBRUQsV0FBTztBQUNMQyxlQUFTLFVBQVVDLEdBQVYsRUFBZTtBQUN0QixZQUFJLENBQUMsMkJBQVNBLEdBQVQsQ0FBTCxFQUFvQjtBQUNsQkosa0JBQVFLLE1BQVIsQ0FBZTtBQUNiQyxrQkFBTUYsR0FETztBQUViRyxxQkFBUyxnREFGSSxFQUFmOztBQUlEO0FBQ0YsT0FSSSxFQUFQOzs7QUFXRCxHQTFCYyxFQUFqQiIsImZpbGUiOiJ1bmFtYmlndW91cy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGVPdmVydmlldyBSZXBvcnQgbW9kdWxlcyB0aGF0IGNvdWxkIHBhcnNlIGluY29ycmVjdGx5IGFzIHNjcmlwdHMuXG4gKiBAYXV0aG9yIEJlbiBNb3NoZXJcbiAqL1xuXG5pbXBvcnQgeyBpc01vZHVsZSB9IGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvdW5hbWJpZ3VvdXMnO1xuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3N1Z2dlc3Rpb24nLFxuICAgIGRvY3M6IHtcbiAgICAgIHVybDogZG9jc1VybCgndW5hbWJpZ3VvdXMnKSxcbiAgICB9LFxuICAgIHNjaGVtYTogW10sXG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbiAoY29udGV4dCkge1xuICAgIC8vIGlnbm9yZSBub24tbW9kdWxlc1xuICAgIGlmIChjb250ZXh0LnBhcnNlck9wdGlvbnMuc291cmNlVHlwZSAhPT0gJ21vZHVsZScpIHtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgUHJvZ3JhbTogZnVuY3Rpb24gKGFzdCkge1xuICAgICAgICBpZiAoIWlzTW9kdWxlKGFzdCkpIHtcbiAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICBub2RlOiBhc3QsXG4gICAgICAgICAgICBtZXNzYWdlOiAnVGhpcyBtb2R1bGUgY291bGQgYmUgcGFyc2VkIGFzIGEgdmFsaWQgc2NyaXB0LicsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfTtcblxuICB9LFxufTtcbiJdfQ==