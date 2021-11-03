"use strict";

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var Stringifier = require('postcss/lib/stringifier');

module.exports =
/*#__PURE__*/
function (_Stringifier) {
  _inheritsLoose(SassStringifier, _Stringifier);

  function SassStringifier() {
    return _Stringifier.apply(this, arguments) || this;
  }

  var _proto = SassStringifier.prototype;

  _proto.block = function block(node, start) {
    this.builder(start, node, 'start');

    if (node.nodes && node.nodes.length) {
      this.body(node);
    }
  };

  _proto.decl = function decl(node) {
    _Stringifier.prototype.decl.call(this, node, false);
  };

  _proto.comment = function comment(node) {
    var left = this.raw(node, 'left', 'commentLeft');
    var right = this.raw(node, 'right', 'commentRight');

    if (node.raws.inline) {
      this.builder('//' + left + node.text + right, node);
    } else {
      this.builder('/*' + left + node.text + right + '*/', node);
    }
  };

  return SassStringifier;
}(Stringifier);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0cmluZ2lmaWVyLmVzNiJdLCJuYW1lcyI6WyJTdHJpbmdpZmllciIsInJlcXVpcmUiLCJtb2R1bGUiLCJleHBvcnRzIiwiYmxvY2siLCJub2RlIiwic3RhcnQiLCJidWlsZGVyIiwibm9kZXMiLCJsZW5ndGgiLCJib2R5IiwiZGVjbCIsImNvbW1lbnQiLCJsZWZ0IiwicmF3IiwicmlnaHQiLCJyYXdzIiwiaW5saW5lIiwidGV4dCJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLElBQU1BLFdBQVcsR0FBR0MsT0FBTyxDQUFDLHlCQUFELENBQTNCOztBQUVBQyxNQUFNLENBQUNDLE9BQVA7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBOztBQUFBOztBQUFBLFNBQ0VDLEtBREYsR0FDRSxlQUFPQyxJQUFQLEVBQWFDLEtBQWIsRUFBb0I7QUFDbEIsU0FBS0MsT0FBTCxDQUFhRCxLQUFiLEVBQW9CRCxJQUFwQixFQUEwQixPQUExQjs7QUFDQSxRQUFJQSxJQUFJLENBQUNHLEtBQUwsSUFBY0gsSUFBSSxDQUFDRyxLQUFMLENBQVdDLE1BQTdCLEVBQXFDO0FBQ25DLFdBQUtDLElBQUwsQ0FBVUwsSUFBVjtBQUNEO0FBQ0YsR0FOSDs7QUFBQSxTQVFFTSxJQVJGLEdBUUUsY0FBTU4sSUFBTixFQUFZO0FBQ1YsMkJBQU1NLElBQU4sWUFBV04sSUFBWCxFQUFpQixLQUFqQjtBQUNELEdBVkg7O0FBQUEsU0FZRU8sT0FaRixHQVlFLGlCQUFTUCxJQUFULEVBQWU7QUFDYixRQUFJUSxJQUFJLEdBQUcsS0FBS0MsR0FBTCxDQUFTVCxJQUFULEVBQWUsTUFBZixFQUF1QixhQUF2QixDQUFYO0FBQ0EsUUFBSVUsS0FBSyxHQUFHLEtBQUtELEdBQUwsQ0FBU1QsSUFBVCxFQUFlLE9BQWYsRUFBd0IsY0FBeEIsQ0FBWjs7QUFFQSxRQUFJQSxJQUFJLENBQUNXLElBQUwsQ0FBVUMsTUFBZCxFQUFzQjtBQUNwQixXQUFLVixPQUFMLENBQWEsT0FBT00sSUFBUCxHQUFjUixJQUFJLENBQUNhLElBQW5CLEdBQTBCSCxLQUF2QyxFQUE4Q1YsSUFBOUM7QUFDRCxLQUZELE1BRU87QUFDTCxXQUFLRSxPQUFMLENBQWEsT0FBT00sSUFBUCxHQUFjUixJQUFJLENBQUNhLElBQW5CLEdBQTBCSCxLQUExQixHQUFrQyxJQUEvQyxFQUFxRFYsSUFBckQ7QUFDRDtBQUNGLEdBckJIOztBQUFBO0FBQUEsRUFBK0NMLFdBQS9DIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgU3RyaW5naWZpZXIgPSByZXF1aXJlKCdwb3N0Y3NzL2xpYi9zdHJpbmdpZmllcicpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU2Fzc1N0cmluZ2lmaWVyIGV4dGVuZHMgU3RyaW5naWZpZXIge1xuICBibG9jayAobm9kZSwgc3RhcnQpIHtcbiAgICB0aGlzLmJ1aWxkZXIoc3RhcnQsIG5vZGUsICdzdGFydCcpXG4gICAgaWYgKG5vZGUubm9kZXMgJiYgbm9kZS5ub2Rlcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuYm9keShub2RlKVxuICAgIH1cbiAgfVxuXG4gIGRlY2wgKG5vZGUpIHtcbiAgICBzdXBlci5kZWNsKG5vZGUsIGZhbHNlKVxuICB9XG5cbiAgY29tbWVudCAobm9kZSkge1xuICAgIGxldCBsZWZ0ID0gdGhpcy5yYXcobm9kZSwgJ2xlZnQnLCAnY29tbWVudExlZnQnKVxuICAgIGxldCByaWdodCA9IHRoaXMucmF3KG5vZGUsICdyaWdodCcsICdjb21tZW50UmlnaHQnKVxuXG4gICAgaWYgKG5vZGUucmF3cy5pbmxpbmUpIHtcbiAgICAgIHRoaXMuYnVpbGRlcignLy8nICsgbGVmdCArIG5vZGUudGV4dCArIHJpZ2h0LCBub2RlKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmJ1aWxkZXIoJy8qJyArIGxlZnQgKyBub2RlLnRleHQgKyByaWdodCArICcqLycsIG5vZGUpXG4gICAgfVxuICB9XG59XG4iXX0=