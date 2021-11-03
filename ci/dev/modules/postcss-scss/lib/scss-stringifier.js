"use strict";

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var Stringifier = require('postcss/lib/stringifier');

var ScssStringifier =
/*#__PURE__*/
function (_Stringifier) {
  _inheritsLoose(ScssStringifier, _Stringifier);

  function ScssStringifier() {
    return _Stringifier.apply(this, arguments) || this;
  }

  var _proto = ScssStringifier.prototype;

  _proto.comment = function comment(node) {
    var left = this.raw(node, 'left', 'commentLeft');
    var right = this.raw(node, 'right', 'commentRight');

    if (node.raws.inline) {
      var text = node.raws.text || node.text;
      this.builder('//' + left + text + right, node);
    } else {
      this.builder('/*' + left + node.text + right + '*/', node);
    }
  };

  _proto.decl = function decl(node, semicolon) {
    if (!node.isNested) {
      _Stringifier.prototype.decl.call(this, node, semicolon);
    } else {
      var between = this.raw(node, 'between', 'colon');
      var string = node.prop + between + this.rawValue(node, 'value');

      if (node.important) {
        string += node.raws.important || ' !important';
      }

      this.builder(string + '{', node, 'start');
      var after;

      if (node.nodes && node.nodes.length) {
        this.body(node);
        after = this.raw(node, 'after');
      } else {
        after = this.raw(node, 'after', 'emptyBody');
      }

      if (after) this.builder(after);
      this.builder('}', node, 'end');
    }
  };

  _proto.rawValue = function rawValue(node, prop) {
    var value = node[prop];
    var raw = node.raws[prop];

    if (raw && raw.value === value) {
      return raw.scss ? raw.scss : raw.raw;
    } else {
      return value;
    }
  };

  return ScssStringifier;
}(Stringifier);

module.exports = ScssStringifier;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNjc3Mtc3RyaW5naWZpZXIuZXM2Il0sIm5hbWVzIjpbIlN0cmluZ2lmaWVyIiwicmVxdWlyZSIsIlNjc3NTdHJpbmdpZmllciIsImNvbW1lbnQiLCJub2RlIiwibGVmdCIsInJhdyIsInJpZ2h0IiwicmF3cyIsImlubGluZSIsInRleHQiLCJidWlsZGVyIiwiZGVjbCIsInNlbWljb2xvbiIsImlzTmVzdGVkIiwiYmV0d2VlbiIsInN0cmluZyIsInByb3AiLCJyYXdWYWx1ZSIsImltcG9ydGFudCIsImFmdGVyIiwibm9kZXMiLCJsZW5ndGgiLCJib2R5IiwidmFsdWUiLCJzY3NzIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLElBQUlBLFdBQVcsR0FBR0MsT0FBTyxDQUFDLHlCQUFELENBQXpCOztJQUVNQyxlOzs7Ozs7Ozs7OztTQUNKQyxPLG9CQUFTQyxJLEVBQU07QUFDYixRQUFJQyxJQUFJLEdBQUcsS0FBS0MsR0FBTCxDQUFTRixJQUFULEVBQWUsTUFBZixFQUF1QixhQUF2QixDQUFYO0FBQ0EsUUFBSUcsS0FBSyxHQUFHLEtBQUtELEdBQUwsQ0FBU0YsSUFBVCxFQUFlLE9BQWYsRUFBd0IsY0FBeEIsQ0FBWjs7QUFFQSxRQUFJQSxJQUFJLENBQUNJLElBQUwsQ0FBVUMsTUFBZCxFQUFzQjtBQUNwQixVQUFJQyxJQUFJLEdBQUdOLElBQUksQ0FBQ0ksSUFBTCxDQUFVRSxJQUFWLElBQWtCTixJQUFJLENBQUNNLElBQWxDO0FBQ0EsV0FBS0MsT0FBTCxDQUFhLE9BQU9OLElBQVAsR0FBY0ssSUFBZCxHQUFxQkgsS0FBbEMsRUFBeUNILElBQXpDO0FBQ0QsS0FIRCxNQUdPO0FBQ0wsV0FBS08sT0FBTCxDQUFhLE9BQU9OLElBQVAsR0FBY0QsSUFBSSxDQUFDTSxJQUFuQixHQUEwQkgsS0FBMUIsR0FBa0MsSUFBL0MsRUFBcURILElBQXJEO0FBQ0Q7QUFDRixHOztTQUVEUSxJLGlCQUFNUixJLEVBQU1TLFMsRUFBVztBQUNyQixRQUFJLENBQUNULElBQUksQ0FBQ1UsUUFBVixFQUFvQjtBQUNsQiw2QkFBTUYsSUFBTixZQUFXUixJQUFYLEVBQWlCUyxTQUFqQjtBQUNELEtBRkQsTUFFTztBQUNMLFVBQUlFLE9BQU8sR0FBRyxLQUFLVCxHQUFMLENBQVNGLElBQVQsRUFBZSxTQUFmLEVBQTBCLE9BQTFCLENBQWQ7QUFDQSxVQUFJWSxNQUFNLEdBQUdaLElBQUksQ0FBQ2EsSUFBTCxHQUFZRixPQUFaLEdBQXNCLEtBQUtHLFFBQUwsQ0FBY2QsSUFBZCxFQUFvQixPQUFwQixDQUFuQzs7QUFDQSxVQUFJQSxJQUFJLENBQUNlLFNBQVQsRUFBb0I7QUFDbEJILFFBQUFBLE1BQU0sSUFBSVosSUFBSSxDQUFDSSxJQUFMLENBQVVXLFNBQVYsSUFBdUIsYUFBakM7QUFDRDs7QUFFRCxXQUFLUixPQUFMLENBQWFLLE1BQU0sR0FBRyxHQUF0QixFQUEyQlosSUFBM0IsRUFBaUMsT0FBakM7QUFFQSxVQUFJZ0IsS0FBSjs7QUFDQSxVQUFJaEIsSUFBSSxDQUFDaUIsS0FBTCxJQUFjakIsSUFBSSxDQUFDaUIsS0FBTCxDQUFXQyxNQUE3QixFQUFxQztBQUNuQyxhQUFLQyxJQUFMLENBQVVuQixJQUFWO0FBQ0FnQixRQUFBQSxLQUFLLEdBQUcsS0FBS2QsR0FBTCxDQUFTRixJQUFULEVBQWUsT0FBZixDQUFSO0FBQ0QsT0FIRCxNQUdPO0FBQ0xnQixRQUFBQSxLQUFLLEdBQUcsS0FBS2QsR0FBTCxDQUFTRixJQUFULEVBQWUsT0FBZixFQUF3QixXQUF4QixDQUFSO0FBQ0Q7O0FBQ0QsVUFBSWdCLEtBQUosRUFBVyxLQUFLVCxPQUFMLENBQWFTLEtBQWI7QUFDWCxXQUFLVCxPQUFMLENBQWEsR0FBYixFQUFrQlAsSUFBbEIsRUFBd0IsS0FBeEI7QUFDRDtBQUNGLEc7O1NBRURjLFEscUJBQVVkLEksRUFBTWEsSSxFQUFNO0FBQ3BCLFFBQUlPLEtBQUssR0FBR3BCLElBQUksQ0FBQ2EsSUFBRCxDQUFoQjtBQUNBLFFBQUlYLEdBQUcsR0FBR0YsSUFBSSxDQUFDSSxJQUFMLENBQVVTLElBQVYsQ0FBVjs7QUFDQSxRQUFJWCxHQUFHLElBQUlBLEdBQUcsQ0FBQ2tCLEtBQUosS0FBY0EsS0FBekIsRUFBZ0M7QUFDOUIsYUFBT2xCLEdBQUcsQ0FBQ21CLElBQUosR0FBV25CLEdBQUcsQ0FBQ21CLElBQWYsR0FBc0JuQixHQUFHLENBQUNBLEdBQWpDO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsYUFBT2tCLEtBQVA7QUFDRDtBQUNGLEc7OztFQTdDMkJ4QixXOztBQWdEOUIwQixNQUFNLENBQUNDLE9BQVAsR0FBaUJ6QixlQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImxldCBTdHJpbmdpZmllciA9IHJlcXVpcmUoJ3Bvc3Rjc3MvbGliL3N0cmluZ2lmaWVyJylcblxuY2xhc3MgU2Nzc1N0cmluZ2lmaWVyIGV4dGVuZHMgU3RyaW5naWZpZXIge1xuICBjb21tZW50IChub2RlKSB7XG4gICAgbGV0IGxlZnQgPSB0aGlzLnJhdyhub2RlLCAnbGVmdCcsICdjb21tZW50TGVmdCcpXG4gICAgbGV0IHJpZ2h0ID0gdGhpcy5yYXcobm9kZSwgJ3JpZ2h0JywgJ2NvbW1lbnRSaWdodCcpXG5cbiAgICBpZiAobm9kZS5yYXdzLmlubGluZSkge1xuICAgICAgbGV0IHRleHQgPSBub2RlLnJhd3MudGV4dCB8fCBub2RlLnRleHRcbiAgICAgIHRoaXMuYnVpbGRlcignLy8nICsgbGVmdCArIHRleHQgKyByaWdodCwgbm9kZSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5idWlsZGVyKCcvKicgKyBsZWZ0ICsgbm9kZS50ZXh0ICsgcmlnaHQgKyAnKi8nLCBub2RlKVxuICAgIH1cbiAgfVxuXG4gIGRlY2wgKG5vZGUsIHNlbWljb2xvbikge1xuICAgIGlmICghbm9kZS5pc05lc3RlZCkge1xuICAgICAgc3VwZXIuZGVjbChub2RlLCBzZW1pY29sb24pXG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBiZXR3ZWVuID0gdGhpcy5yYXcobm9kZSwgJ2JldHdlZW4nLCAnY29sb24nKVxuICAgICAgbGV0IHN0cmluZyA9IG5vZGUucHJvcCArIGJldHdlZW4gKyB0aGlzLnJhd1ZhbHVlKG5vZGUsICd2YWx1ZScpXG4gICAgICBpZiAobm9kZS5pbXBvcnRhbnQpIHtcbiAgICAgICAgc3RyaW5nICs9IG5vZGUucmF3cy5pbXBvcnRhbnQgfHwgJyAhaW1wb3J0YW50J1xuICAgICAgfVxuXG4gICAgICB0aGlzLmJ1aWxkZXIoc3RyaW5nICsgJ3snLCBub2RlLCAnc3RhcnQnKVxuXG4gICAgICBsZXQgYWZ0ZXJcbiAgICAgIGlmIChub2RlLm5vZGVzICYmIG5vZGUubm9kZXMubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuYm9keShub2RlKVxuICAgICAgICBhZnRlciA9IHRoaXMucmF3KG5vZGUsICdhZnRlcicpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhZnRlciA9IHRoaXMucmF3KG5vZGUsICdhZnRlcicsICdlbXB0eUJvZHknKVxuICAgICAgfVxuICAgICAgaWYgKGFmdGVyKSB0aGlzLmJ1aWxkZXIoYWZ0ZXIpXG4gICAgICB0aGlzLmJ1aWxkZXIoJ30nLCBub2RlLCAnZW5kJylcbiAgICB9XG4gIH1cblxuICByYXdWYWx1ZSAobm9kZSwgcHJvcCkge1xuICAgIGxldCB2YWx1ZSA9IG5vZGVbcHJvcF1cbiAgICBsZXQgcmF3ID0gbm9kZS5yYXdzW3Byb3BdXG4gICAgaWYgKHJhdyAmJiByYXcudmFsdWUgPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm4gcmF3LnNjc3MgPyByYXcuc2NzcyA6IHJhdy5yYXdcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHZhbHVlXG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU2Nzc1N0cmluZ2lmaWVyXG4iXSwiZmlsZSI6InNjc3Mtc3RyaW5naWZpZXIuanMifQ==
