'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var defaultRaw = {
  colon: ': ',
  indent: '  ',
  commentLeft: ' ',
  commentRight: ' '
};

var Stringifier = function () {
  function Stringifier(builder) {
    _classCallCheck(this, Stringifier);

    this.builder = builder;
  }

  Stringifier.prototype.stringify = function stringify(node, semicolon) {
    this[node.type](node, semicolon);
  };

  Stringifier.prototype.root = function root(node) {
    this.body(node);
    if (node.raws.after) this.builder(node.raws.after);
  };

  Stringifier.prototype.comment = function comment(node) {
    var left = defaultRaw.commentLeft;
    var right = defaultRaw.commentRight;
    if (this.has(node.raws.left)) left = node.raws.left;

    if (node.raws.inline) {
      if (this.has(node.raws.inlineRight)) {
        right = node.raws.inlineRight;
      } else {
        right = '';
      }
      if (node.raws.extraIndent) {
        this.builder(node.raws.extraIndent);
      }
      this.builder('//' + left + node.text + right, node);
    } else {
      if (this.has(node.raws.right)) right = node.raws.right;
      this.builder('/*' + left + node.text + right + '*/', node);
    }
  };

  Stringifier.prototype.decl = function decl(node) {
    var between = node.raws.between || defaultRaw.colon;
    var string = node.prop + between + this.rawValue(node, 'value');

    if (node.important) {
      string += node.raws.important || ' !important';
    }

    this.builder(string, node);
  };

  Stringifier.prototype.rule = function rule(node) {
    this.block(node, this.rawValue(node, 'selector'));
  };

  Stringifier.prototype.atrule = function atrule(node) {
    var name = '@' + node.name;
    var params = node.params ? this.rawValue(node, 'params') : '';

    if (this.has(node.raws.afterName)) {
      name += node.raws.afterName;
    } else if (params) {
      name += ' ';
    }

    this.block(node, name + params);
  };

  Stringifier.prototype.body = function body(node) {
    var indent = node.root().raws.indent || defaultRaw.indent;

    for (var i = 0; i < node.nodes.length; i++) {
      var child = node.nodes[i];
      var before = child.raws.before.replace(/[^\n]*$/, '') + this.indent(node, indent);
      if (child.type === 'comment' && child.raws.before.indexOf('\n') === -1) {
        before = child.raws.before;
      }
      if (before) this.builder(before);
      this.stringify(child);
    }
  };

  Stringifier.prototype.block = function block(node, start) {
    var between = node.raws.sssBetween || '';
    this.builder(start + between, node, 'start');
    if (this.has(node.nodes)) this.body(node);
  };

  Stringifier.prototype.indent = function indent(node, step) {
    var result = '';
    while (node.parent) {
      result += step;
      node = node.parent;
    }
    return result;
  };

  Stringifier.prototype.has = function has(value) {
    return typeof value !== 'undefined';
  };

  Stringifier.prototype.rawValue = function rawValue(node, prop) {
    var value = node[prop];
    var raw = node.raws[prop];
    if (raw && raw.value === value) {
      return raw.sss || raw.raw;
    } else {
      return value;
    }
  };

  return Stringifier;
}();

exports.default = Stringifier;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0cmluZ2lmaWVyLmVzNiJdLCJuYW1lcyI6WyJkZWZhdWx0UmF3IiwiY29sb24iLCJpbmRlbnQiLCJjb21tZW50TGVmdCIsImNvbW1lbnRSaWdodCIsIlN0cmluZ2lmaWVyIiwiYnVpbGRlciIsInN0cmluZ2lmeSIsIm5vZGUiLCJzZW1pY29sb24iLCJ0eXBlIiwicm9vdCIsImJvZHkiLCJyYXdzIiwiYWZ0ZXIiLCJjb21tZW50IiwibGVmdCIsInJpZ2h0IiwiaGFzIiwiaW5saW5lIiwiaW5saW5lUmlnaHQiLCJleHRyYUluZGVudCIsInRleHQiLCJkZWNsIiwiYmV0d2VlbiIsInN0cmluZyIsInByb3AiLCJyYXdWYWx1ZSIsImltcG9ydGFudCIsInJ1bGUiLCJibG9jayIsImF0cnVsZSIsIm5hbWUiLCJwYXJhbXMiLCJhZnRlck5hbWUiLCJpIiwibm9kZXMiLCJsZW5ndGgiLCJjaGlsZCIsImJlZm9yZSIsInJlcGxhY2UiLCJpbmRleE9mIiwic3RhcnQiLCJzc3NCZXR3ZWVuIiwic3RlcCIsInJlc3VsdCIsInBhcmVudCIsInZhbHVlIiwicmF3Iiwic3NzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFNQSxhQUFhO0FBQ2pCQyxTQUFPLElBRFU7QUFFakJDLFVBQVEsSUFGUztBQUdqQkMsZUFBYSxHQUhJO0FBSWpCQyxnQkFBYztBQUpHLENBQW5COztJQU9xQkMsVztBQUNuQix1QkFBYUMsT0FBYixFQUFzQjtBQUFBOztBQUNwQixTQUFLQSxPQUFMLEdBQWVBLE9BQWY7QUFDRDs7d0JBRURDLFMsc0JBQVdDLEksRUFBTUMsUyxFQUFXO0FBQzFCLFNBQUtELEtBQUtFLElBQVYsRUFBZ0JGLElBQWhCLEVBQXNCQyxTQUF0QjtBQUNELEc7O3dCQUVERSxJLGlCQUFNSCxJLEVBQU07QUFDVixTQUFLSSxJQUFMLENBQVVKLElBQVY7QUFDQSxRQUFJQSxLQUFLSyxJQUFMLENBQVVDLEtBQWQsRUFBcUIsS0FBS1IsT0FBTCxDQUFhRSxLQUFLSyxJQUFMLENB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SXNCLE9BQU9BLElBQUlELEtBQUosS0FBY0EsS0FBekIsRUFBZ0M7QUFDOUIsYUFBT0MsSUFBSUMsR0FBSixJQUFXRCxJQUFJQSxHQUF0QjtBQUNELEtBRkQsTUFFTztBQUNMLGFBQU9ELEtBQVA7QUFDRDtBQUNGLEc7Ozs7O2tCQTFHa0IxQyxXIiwiZmlsZSI6InN0cmluZ2lmaWVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZGVmYXVsdFJhdyA9IHtcbiAgY29sb246ICc6ICcsXG4gIGluZGVudDogJyAgJyxcbiAgY29tbWVudExlZnQ6ICcgJyxcbiAgY29tbWVudFJpZ2h0OiAnICdcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3RyaW5naWZpZXIge1xuICBjb25zdHJ1Y3RvciAoYnVpbGRlcikge1xuICAgIHRoaXMuYnVpbGRlciA9IGJ1aWxkZXJcbiAgfVxuXG4gIHN0cmluZ2lmeSAobm9kZSwgc2VtaWNvbG9uKSB7XG4gICAgdGhpc1tub2RlLnR5cGVdKG5vZGUsIHNlbWljb2xvbilcbiAgfVxuXG4gIHJvb3QgKG5vZGUpIHtcbiAgICB0aGlzLmJvZHkobm9kZSlcbiAgICBpZiAobm9kZS5yYXdzLmFmdGVyKSB0aGlzLmJ1aWxkZXIobm9kZS5yYXdzLmFmdGVyKVxuICB9XG5cbiAgY29tbWVudCAobm9kZSkge1xuICAgIGxldCBsZWZ0ID0gZGVmYXVsdFJhdy5jb21tZW50TGVmdFxuICAgIGxldCByaWdodCA9IGRlZmF1bHRSYXcuY29tbWVudFJpZ2h0XG4gICAgaWYgKHRoaXMuaGFzKG5vZGUucmF3cy5sZWZ0KSkgbGVmdCA9IG5vZGUucmF3cy5sZWZ0XG5cbiAgICBpZiAobm9kZS5yYXdzLmlubGluZSkge1xuICAgICAgaWYgKHRoaXMuaGFzKG5vZGUucmF3cy5pbmxpbmVSaWdodCkpIHtcbiAgICAgICAgcmlnaHQgPSBub2RlLnJhd3MuaW5saW5lUmlnaHRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJpZ2h0ID0gJydcbiAgICAgIH1cbiAgICAgIGlmIChub2RlLnJhd3MuZXh0cmFJbmRlbnQpIHtcbiAgICAgICAgdGhpcy5idWlsZGVyKG5vZGUucmF3cy5leHRyYUluZGVudClcbiAgICAgIH1cbiAgICAgIHRoaXMuYnVpbGRlcignLy8nICsgbGVmdCArIG5vZGUudGV4dCArIHJpZ2h0LCBub2RlKVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5oYXMobm9kZS5yYXdzLnJpZ2h0KSkgcmlnaHQgPSBub2RlLnJhd3MucmlnaHRcbiAgICAgIHRoaXMuYnVpbGRlcignLyonICsgbGVmdCArIG5vZGUudGV4dCArIHJpZ2h0ICsgJyovJywgbm9kZSlcbiAgICB9XG4gIH1cblxuICBkZWNsIChub2RlKSB7XG4gICAgbGV0IGJldHdlZW4gPSBub2RlLnJhd3MuYmV0d2VlbiB8fCBkZWZhdWx0UmF3LmNvbG9uXG4gICAgbGV0IHN0cmluZyA9IG5vZGUucHJvcCArIGJldHdlZW4gKyB0aGlzLnJhd1ZhbHVlKG5vZGUsICd2YWx1ZScpXG5cbiAgICBpZiAobm9kZS5pbXBvcnRhbnQpIHtcbiAgICAgIHN0cmluZyArPSBub2RlLnJhd3MuaW1wb3J0YW50IHx8ICcgIWltcG9ydGFudCdcbiAgICB9XG5cbiAgICB0aGlzLmJ1aWxkZXIoc3RyaW5nLCBub2RlKVxuICB9XG5cbiAgcnVsZSAobm9kZSkge1xuICAgIHRoaXMuYmxvY2sobm9kZSwgdGhpcy5yYXdWYWx1ZShub2RlLCAnc2VsZWN0b3InKSlcbiAgfVxuXG4gIGF0cnVsZSAobm9kZSkge1xuICAgIGxldCBuYW1lID0gJ0AnICsgbm9kZS5uYW1lXG4gICAgbGV0IHBhcmFtcyA9IG5vZGUucGFyYW1zID8gdGhpcy5yYXdWYWx1ZShub2RlLCAncGFyYW1zJykgOiAnJ1xuXG4gICAgaWYgKHRoaXMuaGFzKG5vZGUucmF3cy5hZnRlck5hbWUpKSB7XG4gICAgICBuYW1lICs9IG5vZGUucmF3cy5hZnRlck5hbWVcbiAgICB9IGVsc2UgaWYgKHBhcmFtcykge1xuICAgICAgbmFtZSArPSAnICdcbiAgICB9XG5cbiAgICB0aGlzLmJsb2NrKG5vZGUsIG5hbWUgKyBwYXJhbXMpXG4gIH1cblxuICBib2R5IChub2RlKSB7XG4gICAgbGV0IGluZGVudCA9IG5vZGUucm9vdCgpLnJhd3MuaW5kZW50IHx8IGRlZmF1bHRSYXcuaW5kZW50XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGUubm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBjaGlsZCA9IG5vZGUubm9kZXNbaV1cbiAgICAgIGxldCBiZWZvcmUgPSBjaGlsZC5yYXdzLmJlZm9yZS5yZXBsYWNlKC9bXlxcbl0qJC8sICcnKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmRlbnQobm9kZSwgaW5kZW50KVxuICAgICAgaWYgKGNoaWxkLnR5cGUgPT09ICdjb21tZW50JyAmJlxuICAgICAgICAgICAgICAgICBjaGlsZC5yYXdzLmJlZm9yZS5pbmRleE9mKCdcXG4nKSA9PT0gLTEpIHtcbiAgICAgICAgYmVmb3JlID0gY2hpbGQucmF3cy5iZWZvcmVcbiAgICAgIH1cbiAgICAgIGlmIChiZWZvcmUpIHRoaXMuYnVpbGRlcihiZWZvcmUpXG4gICAgICB0aGlzLnN0cmluZ2lmeShjaGlsZClcbiAgICB9XG4gIH1cblxuICBibG9jayAobm9kZSwgc3RhcnQpIHtcbiAgICBsZXQgYmV0d2VlbiA9IG5vZGUucmF3cy5zc3NCZXR3ZWVuIHx8ICcnXG4gICAgdGhpcy5idWlsZGVyKHN0YXJ0ICsgYmV0d2Vlbiwgbm9kZSwgJ3N0YXJ0JylcbiAgICBpZiAodGhpcy5oYXMobm9kZS5ub2RlcykpIHRoaXMuYm9keShub2RlKVxuICB9XG5cbiAgaW5kZW50IChub2RlLCBzdGVwKSB7XG4gICAgbGV0IHJlc3VsdCA9ICcnXG4gICAgd2hpbGUgKG5vZGUucGFyZW50KSB7XG4gICAgICByZXN1bHQgKz0gc3RlcFxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIGhhcyAodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlICE9PSAndW5kZWZpbmVkJ1xuICB9XG5cbiAgcmF3VmFsdWUgKG5vZGUsIHByb3ApIHtcbiAgICBsZXQgdmFsdWUgPSBub2RlW3Byb3BdXG4gICAgbGV0IHJhdyA9IG5vZGUucmF3c1twcm9wXVxuICAgIGlmIChyYXcgJiYgcmF3LnZhbHVlID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuIHJhdy5zc3MgfHwgcmF3LnJhd1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdmFsdWVcbiAgICB9XG4gIH1cbn1cbiJdfQ==