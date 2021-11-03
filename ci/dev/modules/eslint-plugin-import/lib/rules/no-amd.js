'use strict';




var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('no-amd') },

    schema: [] },


  create: function (context) {
    return {
      'CallExpression': function (node) {
        if (context.getScope().type !== 'module') return;

        if (node.callee.type !== 'Identifier') return;
        if (node.callee.name !== 'require' &&
        node.callee.name !== 'define') return;

        // todo: capture define((require, module, exports) => {}) form?
        if (node.arguments.length !== 2) return;

        const modules = node.arguments[0];
        if (modules.type !== 'ArrayExpression') return;

        // todo: check second arg type? (identifier or callback)

        context.report(node, `Expected imports instead of AMD ${node.callee.name}().`);
      } };


  } }; /**
        * @fileoverview Rule to prefer imports to AMD
        * @author Jamund Ferguson
        */
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1hbWQuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJ0eXBlIiwiZG9jcyIsInVybCIsInNjaGVtYSIsImNyZWF0ZSIsImNvbnRleHQiLCJub2RlIiwiZ2V0U2NvcGUiLCJjYWxsZWUiLCJuYW1lIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwibW9kdWxlcyIsInJlcG9ydCJdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFLQSxxQzs7QUFFQTtBQUNBO0FBQ0E7O0FBRUFBLE9BQU9DLE9BQVAsR0FBaUI7QUFDZkMsUUFBTTtBQUNKQyxVQUFNLFlBREY7QUFFSkMsVUFBTTtBQUNKQyxXQUFLLHVCQUFRLFFBQVIsQ0FERCxFQUZGOztBQUtKQyxZQUFRLEVBTEosRUFEUzs7O0FBU2ZDLFVBQVEsVUFBVUMsT0FBVixFQUFtQjtBQUN6QixXQUFPO0FBQ0wsd0JBQWtCLFVBQVVDLElBQVYsRUFBZ0I7QUFDaEMsWUFBSUQsUUFBUUUsUUFBUixHQUFtQlAsSUFBbkIsS0FBNEIsUUFBaEMsRUFBMEM7O0FBRTFDLFlBQUlNLEtBQUtFLE1BQUwsQ0FBWVIsSUFBWixLQUFxQixZQUF6QixFQUF1QztBQUN2QyxZQUFJTSxLQUFLRSxNQUFMLENBQVlDLElBQVosS0FBcUIsU0FBckI7QUFDQUgsYUFBS0UsTUFBTCxDQUFZQyxJQUFaLEtBQXFCLFFBRHpCLEVBQ21DOztBQUVuQztBQUNBLFlBQUlILEtBQUtJLFNBQUwsQ0FBZUMsTUFBZixLQUEwQixDQUE5QixFQUFpQzs7QUFFakMsY0FBTUMsVUFBVU4sS0FBS0ksU0FBTCxDQUFlLENBQWYsQ0FBaEI7QUFDQSxZQUFJRSxRQUFRWixJQUFSLEtBQWlCLGlCQUFyQixFQUF3Qzs7QUFFeEM7O0FBRUFLLGdCQUFRUSxNQUFSLENBQWVQLElBQWYsRUFBc0IsbUNBQWtDQSxLQUFLRSxNQUFMLENBQVlDLElBQUssS0FBekU7QUFDRCxPQWpCSSxFQUFQOzs7QUFvQkQsR0E5QmMsRUFBakIsQyxDQVhBIiwiZmlsZSI6Im5vLWFtZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGVvdmVydmlldyBSdWxlIHRvIHByZWZlciBpbXBvcnRzIHRvIEFNRFxuICogQGF1dGhvciBKYW11bmQgRmVyZ3Vzb25cbiAqL1xuXG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJztcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFJ1bGUgRGVmaW5pdGlvblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGE6IHtcbiAgICB0eXBlOiAnc3VnZ2VzdGlvbicsXG4gICAgZG9jczoge1xuICAgICAgdXJsOiBkb2NzVXJsKCduby1hbWQnKSxcbiAgICB9LFxuICAgIHNjaGVtYTogW10sXG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbiAoY29udGV4dCkge1xuICAgIHJldHVybiB7XG4gICAgICAnQ2FsbEV4cHJlc3Npb24nOiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICBpZiAoY29udGV4dC5nZXRTY29wZSgpLnR5cGUgIT09ICdtb2R1bGUnKSByZXR1cm47XG5cbiAgICAgICAgaWYgKG5vZGUuY2FsbGVlLnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuO1xuICAgICAgICBpZiAobm9kZS5jYWxsZWUubmFtZSAhPT0gJ3JlcXVpcmUnICYmXG4gICAgICAgICAgICBub2RlLmNhbGxlZS5uYW1lICE9PSAnZGVmaW5lJykgcmV0dXJuO1xuXG4gICAgICAgIC8vIHRvZG86IGNhcHR1cmUgZGVmaW5lKChyZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMpID0+IHt9KSBmb3JtP1xuICAgICAgICBpZiAobm9kZS5hcmd1bWVudHMubGVuZ3RoICE9PSAyKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgbW9kdWxlcyA9IG5vZGUuYXJndW1lbnRzWzBdO1xuICAgICAgICBpZiAobW9kdWxlcy50eXBlICE9PSAnQXJyYXlFeHByZXNzaW9uJykgcmV0dXJuO1xuXG4gICAgICAgIC8vIHRvZG86IGNoZWNrIHNlY29uZCBhcmcgdHlwZT8gKGlkZW50aWZpZXIgb3IgY2FsbGJhY2spXG5cbiAgICAgICAgY29udGV4dC5yZXBvcnQobm9kZSwgYEV4cGVjdGVkIGltcG9ydHMgaW5zdGVhZCBvZiBBTUQgJHtub2RlLmNhbGxlZS5uYW1lfSgpLmApO1xuICAgICAgfSxcbiAgICB9O1xuXG4gIH0sXG59O1xuIl19