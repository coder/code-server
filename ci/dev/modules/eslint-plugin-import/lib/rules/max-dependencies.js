'use strict';var _moduleVisitor = require('eslint-module-utils/moduleVisitor');var _moduleVisitor2 = _interopRequireDefault(_moduleVisitor);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const DEFAULT_MAX = 10;

const countDependencies = (dependencies, lastNode, context) => {var _ref =
  context.options[0] || { max: DEFAULT_MAX };const max = _ref.max;

  if (dependencies.size > max) {
    context.report(
    lastNode,
    `Maximum number of dependencies (${max}) exceeded.`);

  }
};

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('max-dependencies') },


    schema: [
    {
      'type': 'object',
      'properties': {
        'max': { 'type': 'number' } },

      'additionalProperties': false }] },




  create: context => {
    const dependencies = new Set(); // keep track of dependencies
    let lastNode; // keep track of the last node to report on

    return Object.assign({
      'Program:exit': function () {
        countDependencies(dependencies, lastNode, context);
      } },
    (0, _moduleVisitor2.default)(source => {
      dependencies.add(source.value);
      lastNode = source;
    }, { commonjs: true }));
  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9tYXgtZGVwZW5kZW5jaWVzLmpzIl0sIm5hbWVzIjpbIkRFRkFVTFRfTUFYIiwiY291bnREZXBlbmRlbmNpZXMiLCJkZXBlbmRlbmNpZXMiLCJsYXN0Tm9kZSIsImNvbnRleHQiLCJvcHRpb25zIiwibWF4Iiwic2l6ZSIsInJlcG9ydCIsIm1vZHVsZSIsImV4cG9ydHMiLCJtZXRhIiwidHlwZSIsImRvY3MiLCJ1cmwiLCJzY2hlbWEiLCJjcmVhdGUiLCJTZXQiLCJPYmplY3QiLCJhc3NpZ24iLCJzb3VyY2UiLCJhZGQiLCJ2YWx1ZSIsImNvbW1vbmpzIl0sIm1hcHBpbmdzIjoiYUFBQSxrRTtBQUNBLHFDOztBQUVBLE1BQU1BLGNBQWMsRUFBcEI7O0FBRUEsTUFBTUMsb0JBQW9CLENBQUNDLFlBQUQsRUFBZUMsUUFBZixFQUF5QkMsT0FBekIsS0FBcUM7QUFDN0NBLFVBQVFDLE9BQVIsQ0FBZ0IsQ0FBaEIsS0FBc0IsRUFBRUMsS0FBS04sV0FBUCxFQUR1QixPQUNyRE0sR0FEcUQsUUFDckRBLEdBRHFEOztBQUc3RCxNQUFJSixhQUFhSyxJQUFiLEdBQW9CRCxHQUF4QixFQUE2QjtBQUMzQkYsWUFBUUksTUFBUjtBQUNFTCxZQURGO0FBRUcsdUNBQWtDRyxHQUFJLGFBRnpDOztBQUlEO0FBQ0YsQ0FURDs7QUFXQUcsT0FBT0MsT0FBUCxHQUFpQjtBQUNmQyxRQUFNO0FBQ0pDLFVBQU0sWUFERjtBQUVKQyxVQUFNO0FBQ0pDLFdBQUssdUJBQVEsa0JBQVIsQ0FERCxFQUZGOzs7QUFNSkMsWUFBUTtBQUNOO0FBQ0UsY0FBUSxRQURWO0FBRUUsb0JBQWM7QUFDWixlQUFPLEVBQUUsUUFBUSxRQUFWLEVBREssRUFGaEI7O0FBS0UsOEJBQXdCLEtBTDFCLEVBRE0sQ0FOSixFQURTOzs7OztBQWtCZkMsVUFBUVosV0FBVztBQUNqQixVQUFNRixlQUFlLElBQUllLEdBQUosRUFBckIsQ0FEaUIsQ0FDZTtBQUNoQyxRQUFJZCxRQUFKLENBRmlCLENBRUg7O0FBRWQsV0FBT2UsT0FBT0MsTUFBUCxDQUFjO0FBQ25CLHNCQUFnQixZQUFZO0FBQzFCbEIsMEJBQWtCQyxZQUFsQixFQUFnQ0MsUUFBaEMsRUFBMENDLE9BQTFDO0FBQ0QsT0FIa0IsRUFBZDtBQUlKLGlDQUFlZ0IsTUFBRCxJQUFZO0FBQzNCbEIsbUJBQWFtQixHQUFiLENBQWlCRCxPQUFPRSxLQUF4QjtBQUNBbkIsaUJBQVdpQixNQUFYO0FBQ0QsS0FIRSxFQUdBLEVBQUVHLFVBQVUsSUFBWixFQUhBLENBSkksQ0FBUDtBQVFELEdBOUJjLEVBQWpCIiwiZmlsZSI6Im1heC1kZXBlbmRlbmNpZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbW9kdWxlVmlzaXRvciBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL21vZHVsZVZpc2l0b3InO1xuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCc7XG5cbmNvbnN0IERFRkFVTFRfTUFYID0gMTA7XG5cbmNvbnN0IGNvdW50RGVwZW5kZW5jaWVzID0gKGRlcGVuZGVuY2llcywgbGFzdE5vZGUsIGNvbnRleHQpID0+IHtcbiAgY29uc3QgeyBtYXggfSA9IGNvbnRleHQub3B0aW9uc1swXSB8fCB7IG1heDogREVGQVVMVF9NQVggfTtcblxuICBpZiAoZGVwZW5kZW5jaWVzLnNpemUgPiBtYXgpIHtcbiAgICBjb250ZXh0LnJlcG9ydChcbiAgICAgIGxhc3ROb2RlLFxuICAgICAgYE1heGltdW0gbnVtYmVyIG9mIGRlcGVuZGVuY2llcyAoJHttYXh9KSBleGNlZWRlZC5gXG4gICAgKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGE6IHtcbiAgICB0eXBlOiAnc3VnZ2VzdGlvbicsXG4gICAgZG9jczoge1xuICAgICAgdXJsOiBkb2NzVXJsKCdtYXgtZGVwZW5kZW5jaWVzJyksXG4gICAgfSxcblxuICAgIHNjaGVtYTogW1xuICAgICAge1xuICAgICAgICAndHlwZSc6ICdvYmplY3QnLFxuICAgICAgICAncHJvcGVydGllcyc6IHtcbiAgICAgICAgICAnbWF4JzogeyAndHlwZSc6ICdudW1iZXInIH0sXG4gICAgICAgIH0sXG4gICAgICAgICdhZGRpdGlvbmFsUHJvcGVydGllcyc6IGZhbHNlLFxuICAgICAgfSxcbiAgICBdLFxuICB9LFxuXG4gIGNyZWF0ZTogY29udGV4dCA9PiB7XG4gICAgY29uc3QgZGVwZW5kZW5jaWVzID0gbmV3IFNldCgpOyAvLyBrZWVwIHRyYWNrIG9mIGRlcGVuZGVuY2llc1xuICAgIGxldCBsYXN0Tm9kZTsgLy8ga2VlcCB0cmFjayBvZiB0aGUgbGFzdCBub2RlIHRvIHJlcG9ydCBvblxuXG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe1xuICAgICAgJ1Byb2dyYW06ZXhpdCc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY291bnREZXBlbmRlbmNpZXMoZGVwZW5kZW5jaWVzLCBsYXN0Tm9kZSwgY29udGV4dCk7XG4gICAgICB9LFxuICAgIH0sIG1vZHVsZVZpc2l0b3IoKHNvdXJjZSkgPT4ge1xuICAgICAgZGVwZW5kZW5jaWVzLmFkZChzb3VyY2UudmFsdWUpO1xuICAgICAgbGFzdE5vZGUgPSBzb3VyY2U7XG4gICAgfSwgeyBjb21tb25qczogdHJ1ZSB9KSk7XG4gIH0sXG59O1xuIl19