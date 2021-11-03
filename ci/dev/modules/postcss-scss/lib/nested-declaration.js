"use strict";

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var Container = require('postcss/lib/container');

var NestedDeclaration =
/*#__PURE__*/
function (_Container) {
  _inheritsLoose(NestedDeclaration, _Container);

  function NestedDeclaration(defaults) {
    var _this;

    _this = _Container.call(this, defaults) || this;
    _this.type = 'decl';
    _this.isNested = true;
    if (!_this.nodes) _this.nodes = [];
    return _this;
  }

  return NestedDeclaration;
}(Container);

module.exports = NestedDeclaration;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5lc3RlZC1kZWNsYXJhdGlvbi5lczYiXSwibmFtZXMiOlsiQ29udGFpbmVyIiwicmVxdWlyZSIsIk5lc3RlZERlY2xhcmF0aW9uIiwiZGVmYXVsdHMiLCJ0eXBlIiwiaXNOZXN0ZWQiLCJub2RlcyIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSxJQUFNQSxTQUFTLEdBQUdDLE9BQU8sQ0FBQyx1QkFBRCxDQUF6Qjs7SUFFTUMsaUI7Ozs7O0FBQ0osNkJBQWFDLFFBQWIsRUFBdUI7QUFBQTs7QUFDckIsa0NBQU1BLFFBQU47QUFDQSxVQUFLQyxJQUFMLEdBQVksTUFBWjtBQUNBLFVBQUtDLFFBQUwsR0FBZ0IsSUFBaEI7QUFDQSxRQUFJLENBQUMsTUFBS0MsS0FBVixFQUFpQixNQUFLQSxLQUFMLEdBQWEsRUFBYjtBQUpJO0FBS3RCOzs7RUFONkJOLFM7O0FBU2hDTyxNQUFNLENBQUNDLE9BQVAsR0FBaUJOLGlCQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IENvbnRhaW5lciA9IHJlcXVpcmUoJ3Bvc3Rjc3MvbGliL2NvbnRhaW5lcicpXG5cbmNsYXNzIE5lc3RlZERlY2xhcmF0aW9uIGV4dGVuZHMgQ29udGFpbmVyIHtcbiAgY29uc3RydWN0b3IgKGRlZmF1bHRzKSB7XG4gICAgc3VwZXIoZGVmYXVsdHMpXG4gICAgdGhpcy50eXBlID0gJ2RlY2wnXG4gICAgdGhpcy5pc05lc3RlZCA9IHRydWVcbiAgICBpZiAoIXRoaXMubm9kZXMpIHRoaXMubm9kZXMgPSBbXVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTmVzdGVkRGVjbGFyYXRpb25cbiJdLCJmaWxlIjoibmVzdGVkLWRlY2xhcmF0aW9uLmpzIn0=
