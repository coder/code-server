'use strict';

exports.__esModule = true;

var _declaration = require('postcss/lib/declaration');

var _declaration2 = _interopRequireDefault(_declaration);

var _comment = require('postcss/lib/comment');

var _comment2 = _interopRequireDefault(_comment);

var _atRule = require('postcss/lib/at-rule');

var _atRule2 = _interopRequireDefault(_atRule);

var _rule = require('postcss/lib/rule');

var _rule2 = _interopRequireDefault(_rule);

var _root = require('postcss/lib/root');

var _root2 = _interopRequireDefault(_root);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Parser = function () {
  function Parser(input) {
    _classCallCheck(this, Parser);

    this.input = input;

    this.pos = 0;
    this.root = new _root2.default();
    this.current = this.root;
    this.spaces = '';

    this.extraIndent = false;
    this.prevIndent = undefined;
    this.step = undefined;

    this.root.source = { input: input, start: { line: 1, column: 1 } };
  }

  Parser.prototype.loop = function loop() {
    var part = void 0;
    while (this.pos < this.parts.length) {
      part = this.parts[this.pos];

      if (part.comment) {
        this.comment(part);
      } else if (part.atrule) {
        this.atrule(part);
      } else if (part.colon) {
        var next = this.nextNonComment(this.pos);

        if (next.end || next.atrule) {
          this.decl(part);
        } else {
          var moreIndent = next.indent.length > part.indent.length;
          if (!moreIndent) {
            this.decl(part);
          } else if (moreIndent && next.colon) {
            this.rule(part);
          } else if (moreIndent && !next.colon) {
            this.decl(part);
          }
        }
      } else if (part.end) {
        this.root.raws.after = part.before;
      } else {
        this.rule(part);
      }

      this.pos += 1;
    }

    for (var i = this.tokens.length - 1; i >= 0; i--) {
      if (this.tokens[i].length > 3) {
        var last = this.tokens[i];
        this.root.source.end = {
          line: last[4] || last[2],
          column: last[5] || last[3]
        };
        break;
      }
    }
  };

  Parser.prototype.comment = function comment(part) {
    var token = part.tokens[0];
    var node = new _comment2.default();
    this.init(node, part);
    node.source.end = { line: token[4], column: token[5] };
    this.commentText(node, token);
  };

  Parser.prototype.atrule = function atrule(part) {
    var atword = part.tokens[0];
    var params = part.tokens.slice(1);

    var node = new _atRule2.default();
    node.name = atword[1].slice(1);
    this.init(node, part);

    if (node.name === '') this.unnamedAtrule(atword);

    while (!part.end && part.lastComma) {
      this.pos += 1;
      part = this.parts[this.pos];
      params.push(['space', part.before + part.indent]);
      params = params.concat(part.tokens);
    }

    node.raws.afterName = this.firstSpaces(params);
    this.keepTrailingSpace(node, params);
    this.checkSemicolon(params);
    this.checkCurly(params);
    this.raw(node, 'params', params, atword);
  };

  Parser.prototype.decl = function decl(part) {
    var node = new _declaration2.default();
    this.init(node, part);

    var between = '';
    var colon = 0;
    var value = [];
    var prop = '';
    for (var i = 0; i < part.tokens.length; i++) {
      var token = part.tokens[i];
      if (token[0] === ':') {
        between += token[1];
        colon = token;
        value = part.tokens.slice(i + 1);
        break;
      } else if (token[0] === 'comment' || token[0] === 'space') {
        between += token[1];
      } else if (between !== '') {
        this.badProp(token);
      } else {
        prop += token[1];
      }
    }

    if (prop === '') this.unnamedDecl(part.tokens[0]);
    node.prop = prop;

    var next = this.parts[this.pos + 1];

    while (!next.end && !next.atrule && !next.colon && next.indent.length > part.indent.length) {
      value.push(['space', next.before + next.indent]);
      value = value.concat(next.tokens);
      this.pos += 1;
      next = this.parts[this.pos + 1];
    }

    var last = value[value.length - 1];
    if (last && last[0] === 'comment') {
      value.pop();
      var comment = new _comment2.default();
      this.current.push(comment);
      comment.source = {
        input: this.input,
        start: { line: last[2], column: last[3] },
        end: { line: last[4], column: last[5] }
      };
      var prev = value[value.length - 1];
      if (prev && prev[0] === 'space') {
        value.pop();
        comment.raws.before = prev[1];
      }
      this.commentText(comment, last);
    }

    for (var _i = value.length - 1; _i > 0; _i--) {
      var t = value[_i][0];
      if (t === 'word' && value[_i][1] === '!important') {
        node.important = true;
        if (_i > 0 && value[_i - 1][0] === 'space') {
          node.raws.important = value[_i - 1][1] + '!important';
          value.splice(_i - 1, 2);
        } else {
          node.raws.important = '!important';
          value.splice(_i, 1);
        }
        break;
      } else if (t !== 'space' && t !== 'newline' && t !== 'comment') {
        break;
      }
    }

    node.raws.between = between + this.firstSpaces(value);
    this.checkSemicolon(value);
    this.raw(node, 'value', value, colon);
  };

  Parser.prototype.rule = function rule(part) {
    var node = new _rule2.default();
    this.init(node, part);

    var selector = part.tokens;
    var next = this.parts[this.pos + 1];

    while (!next.end && next.indent.length === part.indent.length) {
      selector.push(['space', next.before + next.indent]);
      selector = selector.concat(next.tokens);
      this.pos += 1;
      next = this.parts[this.pos + 1];
    }

    this.keepTrailingSpace(node, selector);
    this.checkCurly(selector);
    this.raw(node, 'selector', selector);
  };

  /* Helpers */

  Parser.prototype.indent = function indent(part) {
    var indent = part.indent.length;
    var isPrev = typeof this.prevIndent !== 'undefined';

    if (!isPrev && indent) this.indentedFirstLine(part);

    if (!this.step && indent) {
      this.step = indent;
      this.root.raws.indent = part.indent;
    }

    if (isPrev && this.prevIndent !== indent) {
      var diff = indent - this.prevIndent;
      if (diff > 0) {
        if (diff !== this.step) {
          this.wrongIndent(this.prevIndent + this.step, indent, part);
        } else if (this.current.last.push) {
          this.current = this.current.last;
        } else {
          this.extraIndent = '';
          for (var i = 0; i < diff; i++) {
            this.extraIndent += ' ';
          }
        }
      } else if (diff % this.step !== 0) {
        var m = indent + diff % this.step;
        this.wrongIndent(m + ' or ' + (m + this.step), indent, part);
      } else {
        for (var _i2 = 0; _i2 < -diff / this.step; _i2++) {
          this.current = this.current.parent;
        }
      }
    }

    this.prevIndent = indent;
  };

  Parser.prototype.init = function init(node, part) {
    this.indent(part);

    if (!this.current.nodes) this.current.nodes = [];
    this.current.push(node);

    node.raws.before = part.before + part.indent;
    if (this.extraIndent) {
      node.raws.extraIndent = this.extraIndent;
      this.extraIndent = false;
    }
    node.source = {
      start: { line: part.tokens[0][2], column: part.tokens[0][3] },
      input: this.input
    };
  };

  Parser.prototype.checkCurly = function checkCurly(tokens) {
    for (var _iterator = tokens, _isArray = Array.isArray(_iterator), _i3 = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i3 >= _iterator.length) break;
        _ref = _iterator[_i3++];
      } else {
        _i3 = _iterator.next();
        if (_i3.done) break;
        _ref = _i3.value;
      }

      var token = _ref;

      if (token[0] === '{') {
        this.error('Unnecessary curly bracket', token[2], token[3]);
      }
    }
  };

  Parser.prototype.checkSemicolon = function checkSemicolon(tokens) {
    for (var _iterator2 = tokens, _isArray2 = Array.isArray(_iterator2), _i4 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray2) {
        if (_i4 >= _iterator2.length) break;
        _ref2 = _iterator2[_i4++];
      } else {
        _i4 = _iterator2.next();
        if (_i4.done) break;
        _ref2 = _i4.value;
      }

      var token = _ref2;

      if (token[0] === ';') {
        this.error('Unnecessary semicolon', token[2], token[3]);
      }
    }
  };

  Parser.prototype.keepTrailingSpace = function keepTrailingSpace(node, tokens) {
    var lastSpace = tokens[tokens.length - 1];
    if (lastSpace && lastSpace[0] === 'space') {
      tokens.pop();
      node.raws.sssBetween = lastSpace[1];
    }
  };

  Parser.prototype.firstSpaces = function firstSpaces(tokens) {
    var result = '';
    for (var i = 0; i < tokens.length; i++) {
      if (tokens[i][0] === 'space' || tokens[i][0] === 'newline') {
        result += tokens.shift()[1];
        i -= 1;
      } else {
        break;
      }
    }
    return result;
  };

  Parser.prototype.raw = function raw(node, prop, tokens, altLast) {
    var token = void 0,
        type = void 0;
    var length = tokens.length;
    var value = '';
    var clean = true;
    for (var i = 0; i < length; i += 1) {
      token = tokens[i];
      type = token[0];
      if (type === 'comment' || type === 'space' && i === length - 1) {
        clean = false;
      } else {
        value += token[1];
      }
    }
    if (!clean) {
      var sss = tokens.reduce(function (all, i) {
        return all + i[1];
      }, '');
      var raw = tokens.reduce(function (all, i) {
        if (i[0] === 'comment' && i[6] === 'inline') {
          return all + '/* ' + i[1].slice(2).trim() + ' */';
        } else {
          return all + i[1];
        }
      }, '');
      node.raws[prop] = { value: value, raw: raw };
      if (sss !== raw) node.raws[prop].sss = sss;
    }
    node[prop] = value;

    var last = void 0;
    for (var _i5 = tokens.length - 1; _i5 >= 0; _i5--) {
      if (tokens[_i5].length > 2) {
        last = tokens[_i5];
        break;
      }
    }
    if (!last) last = altLast;

    node.source.end = {
      line: last[4] || last[2],
      column: last[5] || last[3]
    };
  };

  Parser.prototype.nextNonComment = function nextNonComment(pos) {
    var next = pos;
    var part = void 0;
    while (next < this.parts.length) {
      next += 1;
      part = this.parts[next];
      if (part.end || !part.comment) break;
    }
    return part;
  };

  Parser.prototype.commentText = function commentText(node, token) {
    var text = token[1];
    if (token[6] === 'inline') {
      node.raws.inline = true;
      text = text.slice(2);
    } else {
      text = text.slice(2, -2);
    }

    var match = text.match(/^(\s*)([^]*[^\s])(\s*)\n?$/);
    if (match) {
      node.text = match[2];
      node.raws.left = match[1];
      node.raws.inlineRight = match[3];
    } else {
      node.text = '';
      node.raws.left = '';
      node.raws.inlineRight = '';
    }
  };

  // Errors

  Parser.prototype.error = function error(msg, line, column) {
    throw this.input.error(msg, line, column);
  };

  Parser.prototype.unnamedAtrule = function unnamedAtrule(token) {
    this.error('At-rule without name', token[2], token[3]);
  };

  Parser.prototype.unnamedDecl = function unnamedDecl(token) {
    this.error('Declaration without name', token[2], token[3]);
  };

  Parser.prototype.indentedFirstLine = function indentedFirstLine(part) {
    this.error('First line should not have indent', part.number, 1);
  };

  Parser.prototype.wrongIndent = function wrongIndent(expected, real, part) {
    var msg = 'Expected ' + expected + ' indent, but get ' + real;
    this.error(msg, part.number, 1);
  };

  Parser.prototype.badProp = function badProp(token) {
    this.error('Unexpected separator in property', token[2], token[3]);
  };

  return Parser;
}();

exports.default = Parser;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhcnNlci5lczYiXSwibmFtZXMiOlsiUGFyc2VyIiwiaW5wdXQiLCJwb3MiLCJyb290IiwiUm9vdCIsImN1cnJlbnQiLCJzcGFjZXMiLCJleHRyYUluZGVudCIsInByZXZJbmRlbnQiLCJ1bmRlZmluZWQiLCJzdGVwIiwic291cmNlIiwic3RhcnQiLCJsaW5lIiwiY29sdW1uIiwibG9vcCIsInBhcnQiLCJwYXJ0cyIsImxlbmd0aCIsImNvbW1lbnQiLCJhdHJ1bGUiLCJjb2xvbiIsIm5leHQiLCJuZXh0Tm9uQ29tbWVudCIsImVuZCIsImRlY2wiLCJtb3JlSW5kZW50IiwiaW5kZW50IiwicnVsZSIsInJhd3MiLCJhZnRlciIsImJlZm9yZSIsImkiLCJ0b2tlbnMiLCJsYXN0IiwidG9rZW4iLCJub2RlIiwiQ29tbWVudCIsImluaXQiLCJjb21tZW50VGV4dCIsImF0d29yZCIsInBhcmFtcyIsInNsaWNlIiwiQXRSdWxlIiwibmFtZSIsInVubmFtZWRBdHJ1bGUiLCJsYXN0Q29tbWEiLCJwdXNoIiwiY29uY2F0IiwiYWZ0ZXJOYW1lIiwiZmlyc3RTcGFjZXMiLCJrZWVwVHJhaWxpbmdTcGFjZSIsImNoZWNrU2VtaWNvbG9uIiwiY2hlY2tDdXJseSIsInJhdyIsIkRlY2xhcmF0aW9uIiwiYmV0d2VlbiIsInZhbHVlIiwicHJvcCIsImJhZFByb3AiLCJ1bm5hbWVkRGVjbCIsInBvcCIsInByZXYiLCJ0IiwiaW1wb3J0YW50Iiwic3BsaWNlIiwiUnVsZSIsInNlbGVjdG9yIiwiaXNQcmV2IiwiaW5kZW50ZWRGaXJzdExpbmUiLCJkaWZmIiwid3JvbmdJbmRlbnQiLCJtIiwicGFyZW50Iiwibm9kZXMiLCJlcnJvciIsImxhc3RTcGFjZSIsInNzc0JldHdlZW4iLCJyZXN1bHQiLCJzaGlmdCIsImFsdExhc3QiLCJ0eXBlIiwiY2xlYW4iLCJzc3MiLCJyZWR1Y2UiLCJhbGwiLCJ0cmltIiwidGV4dCIsImlubGluZSIsIm1hdGNoIiwibGVmdCIsImlubGluZVJpZ2h0IiwibXNnIiwibnVtYmVyIiwiZXhwZWN0ZWQiLCJyZWFsIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7SUFFcUJBLE07QUFDbkIsa0JBQWFDLEtBQWIsRUFBb0I7QUFBQTs7QUFDbEIsU0FBS0EsS0FBTCxHQUFhQSxLQUFiOztBQUVBLFNBQUtDLEdBQUwsR0FBVyxDQUFYO0FBQ0EsU0FBS0MsSUFBTCxHQUFZLElBQUlDLGNBQUosRUFBWjtBQUNBLFNBQUtDLE9BQUwsR0FBZSxLQUFLRixJQUFwQjtBQUNBLFNBQUtHLE1BQUwsR0FBYyxFQUFkOztBQUVBLFNBQUtDLFdBQUwsR0FBbUIsS0FBbkI7QUFDQSxTQUFLQyxVQUFMLEdBQWtCQyxTQUFsQjtBQUNBLFNBQUtDLElBQUwsR0FBWUQsU0FBWjs7QUFFQSxTQUFLTixJQUFMLENBQVVRLE1BQVYsR0FBbUIsRUFBRVYsWUFBRixFQUFTVyxPQUFPLEVBQUVDLE1BQU0sQ0FBUixFQUFXQyxRQUFRLENBQW5CLEVBQWhCLEVBQW5CO0FBQ0Q7O21CQUVEQyxJLG1CQUFRO0FBQ04sUUFBSUMsYUFBSjtBQUNBLFdBQU8sS0FBS2QsR0FBTCxHQUFXLEtBQUtlLEtBQUwsQ0FBV0MsTUFBN0IsRUFBcUM7QUFDbkNGLGFBQU8sS0FBS0MsS0FBTCxDQUFXLEtBQUtmLEdBQWhCLENBQVA7O0FBRUEsVUFBSWMsS0FBS0csT0FBVCxFQUFrQjtBQUNoQixhQUFLQSxPQUFMLENBQWFILElBQWI7QUFDRCxPQUZELE1BRU8sSUFBSUEsS0FBS0ksTUFBVCxFQUFpQjtBQUN0QixhQUFLQSxNQUFMLENBQVlKLElBQVo7QUFDRCxPQUZNLE1BRUEsSUFBSUEsS0FBS0ssS0FBVCxFQUFnQjtBQUNyQixZQUFJQyxPQUFPLEtBQUtDLGNBQUwsQ0FBb0IsS0FBS3JCLEdBQXpCLENBQVg7O0FBRUEsWUFBSW9CLEtBQUtFLEdBQUwsSUFBWUYsS0FBS0YsTUFBckIsRUFBNkI7QUFDM0IsZUFBS0ssSUFBTCxDQUFVVCxJQUFWO0FBQ0QsU0FGRCxNQUVPO0FBQ0wsY0FBSVUsYUFBYUosS0FBS0ssTUFBTCxDQUFZVCxNQUFaLEdBQXFCRixLQUFLVyxNQUFMLENBQVlULE1BQWxEO0FBQ0EsY0FBSSxDQUFDUSxVQUFMLEVBQWlCO0FBQ2YsaUJBQUtELElBQUwsQ0FBVVQsSUFBVjtBQUNELFdBRkQsTUFFTyxJQUFJVSxjQUFjSixLQUFLRCxLQUF2QixFQUE4QjtBQUNuQyxpQkFBS08sSUFBTCxDQUFVWixJQUFWO0FBQ0QsV0FGTSxNQUVBLElBQUlVLGNBQWMsQ0FBQ0osS0FBS0QsS0FBeEIsRUFBK0I7QUFDcEMsaUJBQUtJLElBQUwsQ0FBVVQsSUFBVjtBQUNEO0FBQ0Y7QUFDRixPQWZNLE1BZUEsSUFBSUEsS0FBS1EsR0FBVCxFQUFjO0FBQ25CLGFBQUtyQixJQUFMLENBQVUwQixJQUFWLENBQWVDLEtBQWYsR0FBdUJkLEtBQUtlLE1BQTVCO0FBQ0QsT0FGTSxNQUVBO0FBQ0wsYUFBS0gsSUFBTCxDQUFVWixJQUFWO0FBQ0Q7O0FBRUQsV0FBS2QsR0FBTCxJQUFZLENBQVo7QUFDRDs7QUFFRCxTQUFLLElBQUk4QixJQUFJLEtBQUtDLE1BQUwsQ0FBWWYsTUFBWixHQUFxQixDQUFsQyxFQUFxQ2MsS0FBSyxDQUExQyxFQUE2Q0EsR0FBN0MsRUFBa0Q7QUFDaEQsVUFBSSxLQUFLQyxNQUFMLENBQVlELENBQVosRUFBZWQsTUFBZixHQUF3QixDQUE1QixFQUErQjtBQUM3QixZQUFJZ0IsT0FBTyxLQUFLRCxNQUFMLENBQVlELENBQVosQ0FBWDtBQUNBLGFBQUs3QixJQUFMLENBQVVRLE1BQVYsQ0FBaUJhLEdBQWpCLEdBQXVCO0FBQ3JCWCxnQkFBTXFCLEtBQUssQ0FBTCxLQUFXQSxLQUFLLENBQUwsQ0FESTtBQUVyQnBCLGtCQUFRb0IsS0FBSyxDQUFMLEtBQVdBLEtBQUssQ0FBTDtBQUZFLFNBQXZCO0FBSUE7QUFDRDtBQUNGO0FBQ0YsRzs7bUJBRURmLE8sb0JBQVNILEksRUFBTTtBQUNiLFFBQUltQixRQUFRbkIsS0FBS2lCLE1BQUwsQ0FBWSxDQUFaLENBQVo7QUFDQSxRQUFJRyxPQUFPLElBQUlDLGlCQUFKLEVBQVg7QUFDQSxTQUFLQyxJQUFMLENBQVVGLElBQVYsRUFBZ0JwQixJQUFoQjtBQUNBb0IsU0FBS3pCLE1BQUwsQ0FBWWEsR0FBWixHQUFrQixFQUFFWCxNQUFNc0IsTUFBTSxDQUFOLENBQVIsRUFBa0JyQixRQUFRcUIsTUFBTSxDQUFOLENBQTFCLEVBQWxCO0FBQ0EsU0FBS0ksV0FBTCxDQUFpQkgsSUFBakIsRUFBdUJELEtBQXZCO0FBQ0QsRzs7bUJBRURmLE0sbUJBQVFKLEksRUFBTTtBQUNaLFFBQUl3QixTQUFTeEIsS0FBS2lCLE1BQUwsQ0FBWSxDQUFaLENBQWI7QUFDQSxRQUFJUSxTQUFTekIsS0FBS2lCLE1BQUwsQ0FBWVMsS0FBWixDQUFrQixDQUFsQixDQUFiOztBQUVBLFFBQUlOLE9BQU8sSUFBSU8sZ0JBQUosRUFBWDtBQUNBUCxTQUFLUSxJQUFMLEdBQVlKLE9BQU8sQ0FBUCxFQUFVRSxLQUFWLENBQWdCLENBQWhCLENBQVo7QUFDQSxTQUFLSixJQUFMLENBQVVGLElBQVYsRUFBZ0JwQixJQUFoQjs7QUFFQSxRQUFJb0IsS0FBS1EsSUFBTCxLQUFjLEVBQWxCLEVBQXNCLEtBQUtDLGFBQUwsQ0FBbUJMLE1BQW5COztBQUV0QixXQUFPLENBQUN4QixLQUFLUSxHQUFOLElBQWFSLEtBQUs4QixTQUF6QixFQUFvQztBQUNsQyxXQUFLNUMsR0FBTCxJQUFZLENBQVo7QUFDQWMsYUFBTyxLQUFLQyxLQUFMLENBQVcsS0FBS2YsR0FBaEIsQ0FBUDtBQUNBdUMsYUFBT00sSUFBUCxDQUFZLENBQUMsT0FBRCxFQUFVL0IsS0FBS2UsTUFBTCxHQUFjZixLQUFLVyxNQUE3QixDQUFaO0FBQ0FjLGVBQVNBLE9BQU9PLE1BQVAsQ0FBY2hDLEtBQUtpQixNQUFuQixDQUFUO0FBQ0Q7O0FBRURHLFNBQUtQLElBQUwsQ0FBVW9CLFNBQVYsR0FBc0IsS0FBS0MsV0FBTCxDQUFpQlQsTUFBakIsQ0FBdEI7QUFDQSxTQUFLVSxpQkFBTCxDQUF1QmYsSUFBdkIsRUFBNkJLLE1BQTdCO0FBQ0EsU0FBS1csY0FBTCxDQUFvQlgsTUFBcEI7QUFDQSxTQUFLWSxVQUFMLENBQWdCWixNQUFoQjtBQUNBLFNBQUthLEdBQUwsQ0FBU2xCLElBQVQsRUFBZSxRQUFmLEVBQXlCSyxNQUF6QixFQUFpQ0QsTUFBakM7QUFDRCxHOzttQkFFRGYsSSxpQkFBTVQsSSxFQUFNO0FBQ1YsUUFBSW9CLE9BQU8sSUFBSW1CLHFCQUFKLEVBQVg7QUFDQSxTQUFLakIsSUFBTCxDQUFVRixJQUFWLEVBQWdCcEIsSUFBaEI7O0FBRUEsUUFBSXdDLFVBQVUsRUFBZDtBQUNBLFFBQUluQyxRQUFRLENBQVo7QUFDQSxRQUFJb0MsUUFBUSxFQUFaO0FBQ0EsUUFBSUMsT0FBTyxFQUFYO0FBQ0EsU0FBSyxJQUFJMUIsSUFBSSxDQUFiLEVBQWdCQSxJQUFJaEIsS0FBS2lCLE1BQUwsQ0FBWWYsTUFBaEMsRUFBd0NjLEdBQXhDLEVBQTZDO0FBQzNDLFVBQUlHLFFBQVFuQixLQUFLaUIsTUFBTCxDQUFZRCxDQUFaLENBQVo7QUFDQSxVQUFJRyxNQUFNLENBQU4sTUFBYSxHQUFqQixFQUFzQjtBQUNwQnFCLG1CQUFXckIsTUFBTSxDQUFOLENBQVg7QUFDQWQsZ0JBQVFjLEtBQVI7QUFDQXNCLGdCQUFRekMsS0FBS2lCLE1BQUwsQ0FBWVMsS0FBWixDQUFrQlYsSUFBSSxDQUF0QixDQUFSO0FBQ0E7QUFDRCxPQUxELE1BS08sSUFBSUcsTUFBTSxDQUFOLE1BQWEsU0FBYixJQUEwQkEsTUFBTSxDQUFOLE1BQWEsT0FBM0MsRUFBb0Q7QUFDekRxQixtQkFBV3JCLE1BQU0sQ0FBTixDQUFYO0FBQ0QsT0FGTSxNQUVBLElBQUlxQixZQUFZLEVBQWhCLEVBQW9CO0FBQ3pCLGFBQUtHLE9BQUwsQ0FBYXhCLEtBQWI7QUFDRCxPQUZNLE1BRUE7QUFDTHVCLGdCQUFRdkIsTUFBTSxDQUFOLENBQVI7QUFDRDtBQUNGOztBQUVELFFBQUl1QixTQUFTLEVBQWIsRUFBaUIsS0FBS0UsV0FBTCxDQUFpQjVDLEtBQUtpQixNQUFMLENBQVksQ0FBWixDQUFqQjtBQUNqQkcsU0FBS3NCLElBQUwsR0FBWUEsSUFBWjs7QUFFQSxRQUFJcEMsT0FBTyxLQUFLTCxLQUFMLENBQVcsS0FBS2YsR0FBTCxHQUFXLENBQXRCLENBQVg7O0FBRUEsV0FBTyxDQUFDb0IsS0FBS0UsR0FBTixJQUFhLENBQUNGLEtBQUtGLE1BQW5CLElBQTZCLENBQUNFLEtBQUtELEtBQW5DLElBQ0tDLEtBQUtLLE1BQUwsQ0FBWVQsTUFBWixHQUFxQkYsS0FBS1csTUFBTCxDQUFZVCxNQUQ3QyxFQUNxRDtBQUNuRHVDLFlBQU1WLElBQU4sQ0FBVyxDQUFDLE9BQUQsRUFBVXpCLEtBQUtTLE1BQUwsR0FBY1QsS0FBS0ssTUFBN0IsQ0FBWDtBQUNBOEIsY0FBUUEsTUFBTVQsTUFBTixDQUFhMUIsS0FBS1csTUFBbEIsQ0FBUjtBQUNBLFdBQUsvQixHQUFMLElBQVksQ0FBWjtBQUNBb0IsYUFBTyxLQUFLTCxLQUFMLENBQVcsS0FBS2YsR0FBTCxHQUFXLENBQXRCLENBQVA7QUFDRDs7QUFFRCxRQUFJZ0MsT0FBT3VCLE1BQU1BLE1BQU12QyxNQUFOLEdBQWUsQ0FBckIsQ0FBWDtBQUNBLFFBQUlnQixRQUFRQSxLQUFLLENBQUwsTUFBWSxTQUF4QixFQUFtQztBQUNqQ3VCLFlBQU1JLEdBQU47QUFDQSxVQUFJMUMsVUFBVSxJQUFJa0IsaUJBQUosRUFBZDtBQUNBLFdBQUtoQyxPQUFMLENBQWEwQyxJQUFiLENBQWtCNUIsT0FBbEI7QUFDQUEsY0FBUVIsTUFBUixHQUFpQjtBQUNmVixlQUFPLEtBQUtBLEtBREc7QUFFZlcsZUFBTyxFQUFFQyxNQUFNcUIsS0FBSyxDQUFMLENBQVIsRUFBaUJwQixRQUFRb0IsS0FBSyxDQUFMLENBQXpCLEVBRlE7QUFHZlYsYUFBSyxFQUFFWCxNQUFNcUIsS0FBSyxDQUFMLENBQVIsRUFBaUJwQixRQUFRb0IsS0FBSyxDQUFMLENBQXpCO0FBSFUsT0FBakI7QUFLQSxVQUFJNEIsT0FBT0wsTUFBTUEsTUFBTXZDLE1BQU4sR0FBZSxDQUFyQixDQUFYO0FBQ0EsVUFBSTRDLFFBQVFBLEtBQUssQ0FBTCxNQUFZLE9BQXhCLEVBQWlDO0FBQy9CTCxjQUFNSSxHQUFOO0FBQ0ExQyxnQkFBUVUsSUFBUixDQUFhRSxNQUFiLEdBQXNCK0IsS0FBSyxDQUFMLENBQXRCO0FBQ0Q7QUFDRCxXQUFLdkIsV0FBTCxDQUFpQnBCLE9BQWpCLEVBQTBCZSxJQUExQjtBQUNEOztBQUVELFNBQUssSUFBSUYsS0FBSXlCLE1BQU12QyxNQUFOLEdBQWUsQ0FBNUIsRUFBK0JjLEtBQUksQ0FBbkMsRUFBc0NBLElBQXRDLEVBQTJDO0FBQ3pDLFVBQUkrQixJQUFJTixNQUFNekIsRUFBTixFQUFTLENBQVQsQ0FBUjtBQUNBLFVBQUkrQixNQUFNLE1BQU4sSUFBZ0JOLE1BQU16QixFQUFOLEVBQVMsQ0FBVCxNQUFnQixZQUFwQyxFQUFrRDtBQUNoREksYUFBSzRCLFNBQUwsR0FBaUIsSUFBakI7QUFDQSxZQUFJaEMsS0FBSSxDQUFKLElBQVN5QixNQUFNekIsS0FBSSxDQUFWLEVBQWEsQ0FBYixNQUFvQixPQUFqQyxFQUEwQztBQUN4Q0ksZUFBS1AsSUFBTCxDQUFVbUMsU0FBVixHQUFzQlAsTUFBTXpCLEtBQUksQ0FBVixFQUFhLENBQWIsSUFBa0IsWUFBeEM7QUFDQXlCLGdCQUFNUSxNQUFOLENBQWFqQyxLQUFJLENBQWpCLEVBQW9CLENBQXBCO0FBQ0QsU0FIRCxNQUdPO0FBQ0xJLGVBQUtQLElBQUwsQ0FBVW1DLFNBQVYsR0FBc0IsWUFBdEI7QUFDQVAsZ0JBQU1RLE1BQU4sQ0FBYWpDLEVBQWIsRUFBZ0IsQ0FBaEI7QUFDRDtBQUNEO0FBQ0QsT0FWRCxNQVVPLElBQUkrQixNQUFNLE9BQU4sSUFBaUJBLE1BQU0sU0FBdkIsSUFBb0NBLE1BQU0sU0FBOUMsRUFBeUQ7QUFDOUQ7QUFDRDtBQUNGOztBQUVEM0IsU0FBS1AsSUFBTCxDQUFVMkIsT0FBVixHQUFvQkEsVUFBVSxLQUFLTixXQUFMLENBQWlCTyxLQUFqQixDQUE5QjtBQUNBLFNBQUtMLGNBQUwsQ0FBb0JLLEtBQXBCO0FBQ0EsU0FBS0gsR0FBTCxDQUFTbEIsSUFBVCxFQUFlLE9BQWYsRUFBd0JxQixLQUF4QixFQUErQnBDLEtBQS9CO0FBQ0QsRzs7bUJBRURPLEksaUJBQU1aLEksRUFBTTtBQUNWLFFBQUlvQixPQUFPLElBQUk4QixjQUFKLEVBQVg7QUFDQSxTQUFLNUIsSUFBTCxDQUFVRixJQUFWLEVBQWdCcEIsSUFBaEI7O0FBRUEsUUFBSW1ELFdBQVduRCxLQUFLaUIsTUFBcEI7QUFDQSxRQUFJWCxPQUFPLEtBQUtMLEtBQUwsQ0FBVyxLQUFLZixHQUFMLEdBQVcsQ0FBdEIsQ0FBWDs7QUFFQSxXQUFPLENBQUNvQixLQUFLRSxHQUFOLElBQWFGLEtBQUtLLE1BQUwsQ0FBWVQsTUFBWixLQUF1QkYsS0FBS1csTUFBTCxDQUFZVCxNQUF2RCxFQUErRDtBQUM3RGlELGVBQVNwQixJQUFULENBQWMsQ0FBQyxPQUFELEVBQVV6QixLQUFLUyxNQUFMLEdBQWNULEtBQUtLLE1BQTdCLENBQWQ7QUFDQXdDLGlCQUFXQSxTQUFTbkIsTUFBVCxDQUFnQjFCLEtBQUtXLE1BQXJCLENBQVg7QUFDQSxXQUFLL0IsR0FBTCxJQUFZLENBQVo7QUFDQW9CLGFBQU8sS0FBS0wsS0FBTCxDQUFXLEtBQUtmLEdBQUwsR0FBVyxDQUF0QixDQUFQO0FBQ0Q7O0FBRUQsU0FBS2lELGlCQUFMLENBQXVCZixJQUF2QixFQUE2QitCLFFBQTdCO0FBQ0EsU0FBS2QsVUFBTCxDQUFnQmMsUUFBaEI7QUFDQSxTQUFLYixHQUFMLENBQVNsQixJQUFULEVBQWUsVUFBZixFQUEyQitCLFFBQTNCO0FBQ0QsRzs7QUFFRDs7bUJBRUF4QyxNLG1CQUFRWCxJLEVBQU07QUFDWixRQUFJVyxTQUFTWCxLQUFLVyxNQUFMLENBQVlULE1BQXpCO0FBQ0EsUUFBSWtELFNBQVMsT0FBTyxLQUFLNUQsVUFBWixLQUEyQixXQUF4Qzs7QUFFQSxRQUFJLENBQUM0RCxNQUFELElBQVd6QyxNQUFmLEVBQXVCLEtBQUswQyxpQkFBTCxDQUF1QnJELElBQXZCOztBQUV2QixRQUFJLENBQUMsS0FBS04sSUFBTixJQUFjaUIsTUFBbEIsRUFBMEI7QUFDeEIsV0FBS2pCLElBQUwsR0FBWWlCLE1BQVo7QUFDQSxXQUFLeEIsSUFBTCxDQUFVMEIsSUFBVixDQUFlRixNQUFmLEdBQXdCWCxLQUFLVyxNQUE3QjtBQUNEOztBQUVELFFBQUl5QyxVQUFVLEtBQUs1RCxVQUFMLEtBQW9CbUIsTUFBbEMsRUFBMEM7QUFDeEMsVUFBSTJDLE9BQU8zQyxTQUFTLEtBQUtuQixVQUF6QjtBQUNBLFVBQUk4RCxPQUFPLENBQVgsRUFBYztBQUNaLFlBQUlBLFNBQVMsS0FBSzVELElBQWxCLEVBQXdCO0FBQ3RCLGVBQUs2RCxXQUFMLENBQWlCLEtBQUsvRCxVQUFMLEdBQWtCLEtBQUtFLElBQXhDLEVBQThDaUIsTUFBOUMsRUFBc0RYLElBQXREO0FBQ0QsU0FGRCxNQUVPLElBQUksS0FBS1gsT0FBTCxDQUFhNkIsSUFBYixDQUFrQmEsSUFBdEIsRUFBNEI7QUFDakMsZUFBSzFDLE9BQUwsR0FBZSxLQUFLQSxPQUFMLENBQWE2QixJQUE1QjtBQUNELFNBRk0sTUFFQTtBQUNMLGVBQUszQixXQUFMLEdBQW1CLEVBQW5CO0FBQ0EsZUFBSyxJQUFJeUIsSUFBSSxDQUFiLEVBQWdCQSxJQUFJc0MsSUFBcEIsRUFBMEJ0QyxHQUExQixFQUErQjtBQUM3QixpQkFBS3pCLFdBQUwsSUFBb0IsR0FBcEI7QUFDRDtBQUNGO0FBQ0YsT0FYRCxNQVdPLElBQUkrRCxPQUFPLEtBQUs1RCxJQUFaLEtBQXFCLENBQXpCLEVBQTRCO0FBQ2pDLFlBQUk4RCxJQUFJN0MsU0FBUzJDLE9BQU8sS0FBSzVELElBQTdCO0FBQ0EsYUFBSzZELFdBQUwsQ0FBcUJDLENBQXJCLGFBQStCQSxJQUFJLEtBQUs5RCxJQUF4QyxHQUFpRGlCLE1BQWpELEVBQXlEWCxJQUF6RDtBQUNELE9BSE0sTUFHQTtBQUNMLGFBQUssSUFBSWdCLE1BQUksQ0FBYixFQUFnQkEsTUFBSSxDQUFDc0MsSUFBRCxHQUFRLEtBQUs1RCxJQUFqQyxFQUF1Q3NCLEtBQXZDLEVBQTRDO0FBQzFDLGVBQUszQixPQUFMLEdBQWUsS0FBS0EsT0FBTCxDQUFhb0UsTUFBNUI7QUFDRDtBQUNGO0FBQ0Y7O0FBRUQsU0FBS2pFLFVBQUwsR0FBa0JtQixNQUFsQjtBQUNELEc7O21CQUVEVyxJLGlCQUFNRixJLEVBQU1wQixJLEVBQU07QUFDaEIsU0FBS1csTUFBTCxDQUFZWCxJQUFaOztBQUVBLFFBQUksQ0FBQyxLQUFLWCxPQUFMLENBQWFxRSxLQUFsQixFQUF5QixLQUFLckUsT0FBTCxDQUFhcUUsS0FBYixHQUFxQixFQUFyQjtBQUN6QixTQUFLckUsT0FBTCxDQUFhMEMsSUFBYixDQUFrQlgsSUFBbEI7O0FBRUFBLFNBQUtQLElBQUwsQ0FBVUUsTUFBVixHQUFtQmYsS0FBS2UsTUFBTCxHQUFjZixLQUFLVyxNQUF0QztBQUNBLFFBQUksS0FBS3BCLFdBQVQsRUFBc0I7QUFDcEI2QixXQUFLUCxJQUFMLENBQVV0QixXQUFWLEdBQXdCLEtBQUtBLFdBQTdCO0FBQ0EsV0FBS0EsV0FBTCxHQUFtQixLQUFuQjtBQUNEO0FBQ0Q2QixTQUFLekIsTUFBTCxHQUFjO0FBQ1pDLGFBQU8sRUFBRUMsTUFBTUcsS0FBS2lCLE1BQUwsQ0FBWSxDQUFaLEVBQWUsQ0FBZixDQUFSLEVBQTJCbkIsUUFBUUUsS0FBS2lCLE1BQUwsQ0FBWSxDQUFaLEVBQWUsQ0FBZixDQUFuQyxFQURLO0FBRVpoQyxhQUFPLEtBQUtBO0FBRkEsS0FBZDtBQUlELEc7O21CQUVEb0QsVSx1QkFBWXBCLE0sRUFBUTtBQUNsQix5QkFBa0JBLE1BQWxCLG1IQUEwQjtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUEsVUFBakJFLEtBQWlCOztBQUN4QixVQUFJQSxNQUFNLENBQU4sTUFBYSxHQUFqQixFQUFzQjtBQUNwQixhQUFLd0MsS0FBTCxDQUFXLDJCQUFYLEVBQXdDeEMsTUFBTSxDQUFOLENBQXhDLEVBQWtEQSxNQUFNLENBQU4sQ0FBbEQ7QUFDRDtBQUNGO0FBQ0YsRzs7bUJBRURpQixjLDJCQUFnQm5CLE0sRUFBUTtBQUN0QiwwQkFBa0JBLE1BQWxCLHlIQUEwQjtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUEsVUFBakJFLEtBQWlCOztBQUN4QixVQUFJQSxNQUFNLENBQU4sTUFBYSxHQUFqQixFQUFzQjtBQUNwQixhQUFLd0MsS0FBTCxDQUFXLHVCQUFYLEVBQW9DeEMsTUFBTSxDQUFOLENBQXBDLEVBQThDQSxNQUFNLENBQU4sQ0FBOUM7QUFDRDtBQUNGO0FBQ0YsRzs7bUJBRURnQixpQiw4QkFBbUJmLEksRUFBTUgsTSxFQUFRO0FBQy9CLFFBQUkyQyxZQUFZM0MsT0FBT0EsT0FBT2YsTUFBUCxHQUFnQixDQUF2QixDQUFoQjtBQUNBLFFBQUkwRCxhQUFhQSxVQUFVLENBQVYsTUFBaUIsT0FBbEMsRUFBMkM7QUFDekMzQyxhQUFPNEIsR0FBUDtBQUNBekIsV0FBS1AsSUFBTCxDQUFVZ0QsVUFBVixHQUF1QkQsVUFBVSxDQUFWLENBQXZCO0FBQ0Q7QUFDRixHOzttQkFFRDFCLFcsd0JBQWFqQixNLEVBQVE7QUFDbkIsUUFBSTZDLFNBQVMsRUFBYjtBQUNBLFNBQUssSUFBSTlDLElBQUksQ0FBYixFQUFnQkEsSUFBSUMsT0FBT2YsTUFBM0IsRUFBbUNjLEdBQW5DLEVBQXdDO0FBQ3RDLFVBQUlDLE9BQU9ELENBQVAsRUFBVSxDQUFWLE1BQWlCLE9BQWpCLElBQTRCQyxPQUFPRCxDQUFQLEVBQVUsQ0FBVixNQUFpQixTQUFqRCxFQUE0RDtBQUMxRDhDLGtCQUFVN0MsT0FBTzhDLEtBQVAsR0FBZSxDQUFmLENBQVY7QUFDQS9DLGFBQUssQ0FBTDtBQUNELE9BSEQsTUFHTztBQUNMO0FBQ0Q7QUFDRjtBQUNELFdBQU84QyxNQUFQO0FBQ0QsRzs7bUJBRUR4QixHLGdCQUFLbEIsSSxFQUFNc0IsSSxFQUFNekIsTSxFQUFRK0MsTyxFQUFTO0FBQ2hDLFFBQUk3QyxjQUFKO0FBQUEsUUFBVzhDLGFBQVg7QUFDQSxRQUFJL0QsU0FBU2UsT0FBT2YsTUFBcEI7QUFDQSxRQUFJdUMsUUFBUSxFQUFaO0FBQ0EsUUFBSXlCLFFBQVEsSUFBWjtBQUNBLFNBQUssSUFBSWxELElBQUksQ0FBYixFQUFnQkEsSUFBSWQsTUFBcEIsRUFBNEJjLEtBQUssQ0FBakMsRUFBb0M7QUFDbENHLGNBQVFGLE9BQU9ELENBQVAsQ0FBUjtBQUNBaUQsYUFBTzlDLE1BQU0sQ0FBTixDQUFQO0FBQ0EsVUFBSThDLFNBQVMsU0FBVCxJQUF1QkEsU0FBUyxPQUFULElBQW9CakQsTUFBTWQsU0FBUyxDQUE5RCxFQUFrRTtBQUNoRWdFLGdCQUFRLEtBQVI7QUFDRCxPQUZELE1BRU87QUFDTHpCLGlCQUFTdEIsTUFBTSxDQUFOLENBQVQ7QUFDRDtBQUNGO0FBQ0QsUUFBSSxDQUFDK0MsS0FBTCxFQUFZO0FBQ1YsVUFBSUMsTUFBTWxELE9BQU9tRCxNQUFQLENBQWMsVUFBQ0MsR0FBRCxFQUFNckQsQ0FBTjtBQUFBLGVBQVlxRCxNQUFNckQsRUFBRSxDQUFGLENBQWxCO0FBQUEsT0FBZCxFQUFzQyxFQUF0QyxDQUFWO0FBQ0EsVUFBSXNCLE1BQU1yQixPQUFPbUQsTUFBUCxDQUFjLFVBQUNDLEdBQUQsRUFBTXJELENBQU4sRUFBWTtBQUNsQyxZQUFJQSxFQUFFLENBQUYsTUFBUyxTQUFULElBQXNCQSxFQUFFLENBQUYsTUFBUyxRQUFuQyxFQUE2QztBQUMzQyxpQkFBT3FELE1BQU0sS0FBTixHQUFjckQsRUFBRSxDQUFGLEVBQUtVLEtBQUwsQ0FBVyxDQUFYLEVBQWM0QyxJQUFkLEVBQWQsR0FBcUMsS0FBNUM7QUFDRCxTQUZELE1BRU87QUFDTCxpQkFBT0QsTUFBTXJELEVBQUUsQ0FBRixDQUFiO0FBQ0Q7QUFDRixPQU5TLEVBTVAsRUFOTyxDQUFWO0FBT0FJLFdBQUtQLElBQUwsQ0FBVTZCLElBQVYsSUFBa0IsRUFBRUQsWUFBRixFQUFTSCxRQUFULEVBQWxCO0FBQ0EsVUFBSTZCLFFBQVE3QixHQUFaLEVBQWlCbEIsS0FBS1AsSUFBTCxDQUFVNkIsSUFBVixFQUFnQnlCLEdBQWhCLEdBQXNCQSxHQUF0QjtBQUNsQjtBQUNEL0MsU0FBS3NCLElBQUwsSUFBYUQsS0FBYjs7QUFFQSxRQUFJdkIsYUFBSjtBQUNBLFNBQUssSUFBSUYsTUFBSUMsT0FBT2YsTUFBUCxHQUFnQixDQUE3QixFQUFnQ2MsT0FBSyxDQUFyQyxFQUF3Q0EsS0FBeEMsRUFBNkM7QUFDM0MsVUFBSUMsT0FBT0QsR0FBUCxFQUFVZCxNQUFWLEdBQW1CLENBQXZCLEVBQTBCO0FBQ3hCZ0IsZUFBT0QsT0FBT0QsR0FBUCxDQUFQO0FBQ0E7QUFDRDtBQUNGO0FBQ0QsUUFBSSxDQUFDRSxJQUFMLEVBQVdBLE9BQU84QyxPQUFQOztBQUVYNUMsU0FBS3pCLE1BQUwsQ0FBWWEsR0FBWixHQUFrQjtBQUNoQlgsWUFBTXFCLEtBQUssQ0FBTCxLQUFXQSxLQUFLLENBQUwsQ0FERDtBQUVoQnBCLGNBQVFvQixLQUFLLENBQUwsS0FBV0EsS0FBSyxDQUFMO0FBRkgsS0FBbEI7QUFJRCxHOzttQkFFRFgsYywyQkFBZ0JyQixHLEVBQUs7QUFDbkIsUUFBSW9CLE9BQU9wQixHQUFYO0FBQ0EsUUFBSWMsYUFBSjtBQUNBLFdBQU9NLE9BQU8sS0FBS0wsS0FBTCxDQUFXQyxNQUF6QixFQUFpQztBQUMvQkksY0FBUSxDQUFSO0FBQ0FOLGFBQU8sS0FBS0MsS0FBTCxDQUFXSyxJQUFYLENBQVA7QUFDQSxVQUFJTixLQUFLUSxHQUFMLElBQVksQ0FBQ1IsS0FBS0csT0FBdEIsRUFBK0I7QUFDaEM7QUFDRCxXQUFPSCxJQUFQO0FBQ0QsRzs7bUJBRUR1QixXLHdCQUFhSCxJLEVBQU1ELEssRUFBTztBQUN4QixRQUFJb0QsT0FBT3BELE1BQU0sQ0FBTixDQUFYO0FBQ0EsUUFBSUEsTUFBTSxDQUFOLE1BQWEsUUFBakIsRUFBMkI7QUFDekJDLFdBQUtQLElBQUwsQ0FBVTJELE1BQVYsR0FBbUIsSUFBbkI7QUFDQUQsYUFBT0EsS0FBSzdDLEtBQUwsQ0FBVyxDQUFYLENBQVA7QUFDRCxLQUhELE1BR087QUFDTDZDLGFBQU9BLEtBQUs3QyxLQUFMLENBQVcsQ0FBWCxFQUFjLENBQUMsQ0FBZixDQUFQO0FBQ0Q7O0FBRUQsUUFBSStDLFFBQVFGLEtBQUtFLEtBQUwsQ0FBVyw0QkFBWCxDQUFaO0FBQ0EsUUFBSUEsS0FBSixFQUFXO0FBQ1RyRCxXQUFLbUQsSUFBTCxHQUFZRSxNQUFNLENBQU4sQ0FBWjtBQUNBckQsV0FBS1AsSUFBTCxDQUFVNkQsSUFBVixHQUFpQkQsTUFBTSxDQUFOLENBQWpCO0FBQ0FyRCxXQUFLUCxJQUFMLENBQVU4RCxXQUFWLEdBQXdCRixNQUFNLENBQU4sQ0FBeEI7QUFDRCxLQUpELE1BSU87QUFDTHJELFdBQUttRCxJQUFMLEdBQVksRUFBWjtBQUNBbkQsV0FBS1AsSUFBTCxDQUFVNkQsSUFBVixHQUFpQixFQUFqQjtBQUNBdEQsV0FBS1AsSUFBTCxDQUFVOEQsV0FBVixHQUF3QixFQUF4QjtBQUNEO0FBQ0YsRzs7QUFFRDs7bUJBRUFoQixLLGtCQUFPaUIsRyxFQUFLL0UsSSxFQUFNQyxNLEVBQVE7QUFDeEIsVUFBTSxLQUFLYixLQUFMLENBQVcwRSxLQUFYLENBQWlCaUIsR0FBakIsRUFBc0IvRSxJQUF0QixFQUE0QkMsTUFBNUIsQ0FBTjtBQUNELEc7O21CQUVEK0IsYSwwQkFBZVYsSyxFQUFPO0FBQ3BCLFNBQUt3QyxLQUFMLENBQVcsc0JBQVgsRUFBbUN4QyxNQUFNLENBQU4sQ0FBbkMsRUFBNkNBLE1BQU0sQ0FBTixDQUE3QztBQUNELEc7O21CQUVEeUIsVyx3QkFBYXpCLEssRUFBTztBQUNsQixTQUFLd0MsS0FBTCxDQUFXLDBCQUFYLEVBQXVDeEMsTUFBTSxDQUFOLENBQXZDLEVBQWlEQSxNQUFNLENBQU4sQ0FBakQ7QUFDRCxHOzttQkFFRGtDLGlCLDhCQUFtQnJELEksRUFBTTtBQUN2QixTQUFLMkQsS0FBTCxDQUFXLG1DQUFYLEVBQWdEM0QsS0FBSzZFLE1BQXJELEVBQTZELENBQTdEO0FBQ0QsRzs7bUJBRUR0QixXLHdCQUFhdUIsUSxFQUFVQyxJLEVBQU0vRSxJLEVBQU07QUFDakMsUUFBSTRFLG9CQUFtQkUsUUFBbkIseUJBQWlEQyxJQUFyRDtBQUNBLFNBQUtwQixLQUFMLENBQVdpQixHQUFYLEVBQWdCNUUsS0FBSzZFLE1BQXJCLEVBQTZCLENBQTdCO0FBQ0QsRzs7bUJBRURsQyxPLG9CQUFTeEIsSyxFQUFPO0FBQ2QsU0FBS3dDLEtBQUwsQ0FBVyxrQ0FBWCxFQUErQ3hDLE1BQU0sQ0FBTixDQUEvQyxFQUF5REEsTUFBTSxDQUFOLENBQXpEO0FBQ0QsRzs7Ozs7a0JBOVhrQm5DLE0iLCJmaWxlIjoicGFyc2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IERlY2xhcmF0aW9uIGZyb20gJ3Bvc3Rjc3MvbGliL2RlY2xhcmF0aW9uJ1xuaW1wb3J0IENvbW1lbnQgZnJvbSAncG9zdGNzcy9saWIvY29tbWVudCdcbmltcG9ydCBBdFJ1bGUgZnJvbSAncG9zdGNzcy9saWIvYXQtcnVsZSdcbmltcG9ydCBSdWxlIGZyb20gJ3Bvc3Rjc3MvbGliL3J1bGUnXG5pbXBvcnQgUm9vdCBmcm9tICdwb3N0Y3NzL2xpYi9yb290J1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQYXJzZXIge1xuICBjb25zdHJ1Y3RvciAoaW5wdXQpIHtcbiAgICB0aGlzLmlucHV0ID0gaW5wdXRcblxuICAgIHRoaXMucG9zID0gMFxuICAgIHRoaXMucm9vdCA9IG5ldyBSb290KClcbiAgICB0aGlzLmN1cnJlbnQgPSB0aGlzLnJvb3RcbiAgICB0aGlzLnNwYWNlcyA9ICcnXG5cbiAgICB0aGlzLmV4dHJhSW5kZW50ID0gZmFsc2VcbiAgICB0aGlzLnByZXZJbmRlbnQgPSB1bmRlZmluZWRcbiAgICB0aGlzLnN0ZXAgPSB1bmRlZmluZWRcblxuICAgIHRoaXMucm9vdC5zb3VyY2UgPSB7IGlucHV0LCBzdGFydDogeyBsaW5lOiAxLCBjb2x1bW46IDEgfSB9XG4gIH1cblxuICBsb29wICgpIHtcbiAgICBsZXQgcGFydFxuICAgIHdoaWxlICh0aGlzLnBvcyA8IHRoaXMucGFydHMubGVuZ3RoKSB7XG4gICAgICBwYXJ0ID0gdGhpcy5wYXJ0c1t0aGlzLnBvc11cblxuICAgICAgaWYgKHBhcnQuY29tbWVudCkge1xuICAgICAgICB0aGlzLmNvbW1lbnQocGFydClcbiAgICAgIH0gZWxzZSBpZiAocGFydC5hdHJ1bGUpIHtcbiAgICAgICAgdGhpcy5hdHJ1bGUocGFydClcbiAgICAgIH0gZWxzZSBpZiAocGFydC5jb2xvbikge1xuICAgICAgICBsZXQgbmV4dCA9IHRoaXMubmV4dE5vbkNvbW1lbnQodGhpcy5wb3MpXG5cbiAgICAgICAgaWYgKG5leHQuZW5kIHx8IG5leHQuYXRydWxlKSB7XG4gICAgICAgICAgdGhpcy5kZWNsKHBhcnQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGV0IG1vcmVJbmRlbnQgPSBuZXh0LmluZGVudC5sZW5ndGggPiBwYXJ0LmluZGVudC5sZW5ndGhcbiAgICAgICAgICBpZiAoIW1vcmVJbmRlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZGVjbChwYXJ0KVxuICAgICAgICAgIH0gZWxzZSBpZiAobW9yZUluZGVudCAmJiBuZXh0LmNvbG9uKSB7XG4gICAgICAgICAgICB0aGlzLnJ1bGUocGFydClcbiAgICAgICAgICB9IGVsc2UgaWYgKG1vcmVJbmRlbnQgJiYgIW5leHQuY29sb24pIHtcbiAgICAgICAgICAgIHRoaXMuZGVjbChwYXJ0KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChwYXJ0LmVuZCkge1xuICAgICAgICB0aGlzLnJvb3QucmF3cy5hZnRlciA9IHBhcnQuYmVmb3JlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJ1bGUocGFydClcbiAgICAgIH1cblxuICAgICAgdGhpcy5wb3MgKz0gMVxuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSB0aGlzLnRva2Vucy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgaWYgKHRoaXMudG9rZW5zW2ldLmxlbmd0aCA+IDMpIHtcbiAgICAgICAgbGV0IGxhc3QgPSB0aGlzLnRva2Vuc1tpXVxuICAgICAgICB0aGlzLnJvb3Quc291cmNlLmVuZCA9IHtcbiAgICAgICAgICBsaW5lOiBsYXN0WzRdIHx8IGxhc3RbMl0sXG4gICAgICAgICAgY29sdW1uOiBsYXN0WzVdIHx8IGxhc3RbM11cbiAgICAgICAgfVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbW1lbnQgKHBhcnQpIHtcbiAgICBsZXQgdG9rZW4gPSBwYXJ0LnRva2Vuc1swXVxuICAgIGxldCBub2RlID0gbmV3IENvbW1lbnQoKVxuICAgIHRoaXMuaW5pdChub2RlLCBwYXJ0KVxuICAgIG5vZGUuc291cmNlLmVuZCA9IHsgbGluZTogdG9rZW5bNF0sIGNvbHVtbjogdG9rZW5bNV0gfVxuICAgIHRoaXMuY29tbWVudFRleHQobm9kZSwgdG9rZW4pXG4gIH1cblxuICBhdHJ1bGUgKHBhcnQpIHtcbiAgICBsZXQgYXR3b3JkID0gcGFydC50b2tlbnNbMF1cbiAgICBsZXQgcGFyYW1zID0gcGFydC50b2tlbnMuc2xpY2UoMSlcblxuICAgIGxldCBub2RlID0gbmV3IEF0UnVsZSgpXG4gICAgbm9kZS5uYW1lID0gYXR3b3JkWzFdLnNsaWNlKDEpXG4gICAgdGhpcy5pbml0KG5vZGUsIHBhcnQpXG5cbiAgICBpZiAobm9kZS5uYW1lID09PSAnJykgdGhpcy51bm5hbWVkQXRydWxlKGF0d29yZClcblxuICAgIHdoaWxlICghcGFydC5lbmQgJiYgcGFydC5sYXN0Q29tbWEpIHtcbiAgICAgIHRoaXMucG9zICs9IDFcbiAgICAgIHBhcnQgPSB0aGlzLnBhcnRzW3RoaXMucG9zXVxuICAgICAgcGFyYW1zLnB1c2goWydzcGFjZScsIHBhcnQuYmVmb3JlICsgcGFydC5pbmRlbnRdKVxuICAgICAgcGFyYW1zID0gcGFyYW1zLmNvbmNhdChwYXJ0LnRva2VucylcbiAgICB9XG5cbiAgICBub2RlLnJhd3MuYWZ0ZXJOYW1lID0gdGhpcy5maXJzdFNwYWNlcyhwYXJhbXMpXG4gICAgdGhpcy5rZWVwVHJhaWxpbmdTcGFjZShub2RlLCBwYXJhbXMpXG4gICAgdGhpcy5jaGVja1NlbWljb2xvbihwYXJhbXMpXG4gICAgdGhpcy5jaGVja0N1cmx5KHBhcmFtcylcbiAgICB0aGlzLnJhdyhub2RlLCAncGFyYW1zJywgcGFyYW1zLCBhdHdvcmQpXG4gIH1cblxuICBkZWNsIChwYXJ0KSB7XG4gICAgbGV0IG5vZGUgPSBuZXcgRGVjbGFyYXRpb24oKVxuICAgIHRoaXMuaW5pdChub2RlLCBwYXJ0KVxuXG4gICAgbGV0IGJldHdlZW4gPSAnJ1xuICAgIGxldCBjb2xvbiA9IDBcbiAgICBsZXQgdmFsdWUgPSBbXVxuICAgIGxldCBwcm9wID0gJydcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcnQudG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgdG9rZW4gPSBwYXJ0LnRva2Vuc1tpXVxuICAgICAgaWYgKHRva2VuWzBdID09PSAnOicpIHtcbiAgICAgICAgYmV0d2VlbiArPSB0b2tlblsxXVxuICAgICAgICBjb2xvbiA9IHRva2VuXG4gICAgICAgIHZhbHVlID0gcGFydC50b2tlbnMuc2xpY2UoaSArIDEpXG4gICAgICAgIGJyZWFrXG4gICAgICB9IGVsc2UgaWYgKHRva2VuWzBdID09PSAnY29tbWVudCcgfHwgdG9rZW5bMF0gPT09ICdzcGFjZScpIHtcbiAgICAgICAgYmV0d2VlbiArPSB0b2tlblsxXVxuICAgICAgfSBlbHNlIGlmIChiZXR3ZWVuICE9PSAnJykge1xuICAgICAgICB0aGlzLmJhZFByb3AodG9rZW4pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm9wICs9IHRva2VuWzFdXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHByb3AgPT09ICcnKSB0aGlzLnVubmFtZWREZWNsKHBhcnQudG9rZW5zWzBdKVxuICAgIG5vZGUucHJvcCA9IHByb3BcblxuICAgIGxldCBuZXh0ID0gdGhpcy5wYXJ0c1t0aGlzLnBvcyArIDFdXG5cbiAgICB3aGlsZSAoIW5leHQuZW5kICYmICFuZXh0LmF0cnVsZSAmJiAhbmV4dC5jb2xvbiAmJlxuICAgICAgICAgICAgICAgIG5leHQuaW5kZW50Lmxlbmd0aCA+IHBhcnQuaW5kZW50Lmxlbmd0aCkge1xuICAgICAgdmFsdWUucHVzaChbJ3NwYWNlJywgbmV4dC5iZWZvcmUgKyBuZXh0LmluZGVudF0pXG4gICAgICB2YWx1ZSA9IHZhbHVlLmNvbmNhdChuZXh0LnRva2VucylcbiAgICAgIHRoaXMucG9zICs9IDFcbiAgICAgIG5leHQgPSB0aGlzLnBhcnRzW3RoaXMucG9zICsgMV1cbiAgICB9XG5cbiAgICBsZXQgbGFzdCA9IHZhbHVlW3ZhbHVlLmxlbmd0aCAtIDFdXG4gICAgaWYgKGxhc3QgJiYgbGFzdFswXSA9PT0gJ2NvbW1lbnQnKSB7XG4gICAgICB2YWx1ZS5wb3AoKVxuICAgICAgbGV0IGNvbW1lbnQgPSBuZXcgQ29tbWVudCgpXG4gICAgICB0aGlzLmN1cnJlbnQucHVzaChjb21tZW50KVxuICAgICAgY29tbWVudC5zb3VyY2UgPSB7XG4gICAgICAgIGlucHV0OiB0aGlzLmlucHV0LFxuICAgICAgICBzdGFydDogeyBsaW5lOiBsYXN0WzJdLCBjb2x1bW46IGxhc3RbM10gfSxcbiAgICAgICAgZW5kOiB7IGxpbmU6IGxhc3RbNF0sIGNvbHVtbjogbGFzdFs1XSB9XG4gICAgICB9XG4gICAgICBsZXQgcHJldiA9IHZhbHVlW3ZhbHVlLmxlbmd0aCAtIDFdXG4gICAgICBpZiAocHJldiAmJiBwcmV2WzBdID09PSAnc3BhY2UnKSB7XG4gICAgICAgIHZhbHVlLnBvcCgpXG4gICAgICAgIGNvbW1lbnQucmF3cy5iZWZvcmUgPSBwcmV2WzFdXG4gICAgICB9XG4gICAgICB0aGlzLmNvbW1lbnRUZXh0KGNvbW1lbnQsIGxhc3QpXG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IHZhbHVlLmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICAgIGxldCB0ID0gdmFsdWVbaV1bMF1cbiAgICAgIGlmICh0ID09PSAnd29yZCcgJiYgdmFsdWVbaV1bMV0gPT09ICchaW1wb3J0YW50Jykge1xuICAgICAgICBub2RlLmltcG9ydGFudCA9IHRydWVcbiAgICAgICAgaWYgKGkgPiAwICYmIHZhbHVlW2kgLSAxXVswXSA9PT0gJ3NwYWNlJykge1xuICAgICAgICAgIG5vZGUucmF3cy5pbXBvcnRhbnQgPSB2YWx1ZVtpIC0gMV1bMV0gKyAnIWltcG9ydGFudCdcbiAgICAgICAgICB2YWx1ZS5zcGxpY2UoaSAtIDEsIDIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbm9kZS5yYXdzLmltcG9ydGFudCA9ICchaW1wb3J0YW50J1xuICAgICAgICAgIHZhbHVlLnNwbGljZShpLCAxKVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgICB9IGVsc2UgaWYgKHQgIT09ICdzcGFjZScgJiYgdCAhPT0gJ25ld2xpbmUnICYmIHQgIT09ICdjb21tZW50Jykge1xuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cblxuICAgIG5vZGUucmF3cy5iZXR3ZWVuID0gYmV0d2VlbiArIHRoaXMuZmlyc3RTcGFjZXModmFsdWUpXG4gICAgdGhpcy5jaGVja1NlbWljb2xvbih2YWx1ZSlcbiAgICB0aGlzLnJhdyhub2RlLCAndmFsdWUnLCB2YWx1ZSwgY29sb24pXG4gIH1cblxuICBydWxlIChwYXJ0KSB7XG4gICAgbGV0IG5vZGUgPSBuZXcgUnVsZSgpXG4gICAgdGhpcy5pbml0KG5vZGUsIHBhcnQpXG5cbiAgICBsZXQgc2VsZWN0b3IgPSBwYXJ0LnRva2Vuc1xuICAgIGxldCBuZXh0ID0gdGhpcy5wYXJ0c1t0aGlzLnBvcyArIDFdXG5cbiAgICB3aGlsZSAoIW5leHQuZW5kICYmIG5leHQuaW5kZW50Lmxlbmd0aCA9PT0gcGFydC5pbmRlbnQubGVuZ3RoKSB7XG4gICAgICBzZWxlY3Rvci5wdXNoKFsnc3BhY2UnLCBuZXh0LmJlZm9yZSArIG5leHQuaW5kZW50XSlcbiAgICAgIHNlbGVjdG9yID0gc2VsZWN0b3IuY29uY2F0KG5leHQudG9rZW5zKVxuICAgICAgdGhpcy5wb3MgKz0gMVxuICAgICAgbmV4dCA9IHRoaXMucGFydHNbdGhpcy5wb3MgKyAxXVxuICAgIH1cblxuICAgIHRoaXMua2VlcFRyYWlsaW5nU3BhY2Uobm9kZSwgc2VsZWN0b3IpXG4gICAgdGhpcy5jaGVja0N1cmx5KHNlbGVjdG9yKVxuICAgIHRoaXMucmF3KG5vZGUsICdzZWxlY3RvcicsIHNlbGVjdG9yKVxuICB9XG5cbiAgLyogSGVscGVycyAqL1xuXG4gIGluZGVudCAocGFydCkge1xuICAgIGxldCBpbmRlbnQgPSBwYXJ0LmluZGVudC5sZW5ndGhcbiAgICBsZXQgaXNQcmV2ID0gdHlwZW9mIHRoaXMucHJldkluZGVudCAhPT0gJ3VuZGVmaW5lZCdcblxuICAgIGlmICghaXNQcmV2ICYmIGluZGVudCkgdGhpcy5pbmRlbnRlZEZpcnN0TGluZShwYXJ0KVxuXG4gICAgaWYgKCF0aGlzLnN0ZXAgJiYgaW5kZW50KSB7XG4gICAgICB0aGlzLnN0ZXAgPSBpbmRlbnRcbiAgICAgIHRoaXMucm9vdC5yYXdzLmluZGVudCA9IHBhcnQuaW5kZW50XG4gICAgfVxuXG4gICAgaWYgKGlzUHJldiAmJiB0aGlzLnByZXZJbmRlbnQgIT09IGluZGVudCkge1xuICAgICAgbGV0IGRpZmYgPSBpbmRlbnQgLSB0aGlzLnByZXZJbmRlbnRcbiAgICAgIGlmIChkaWZmID4gMCkge1xuICAgICAgICBpZiAoZGlmZiAhPT0gdGhpcy5zdGVwKSB7XG4gICAgICAgICAgdGhpcy53cm9uZ0luZGVudCh0aGlzLnByZXZJbmRlbnQgKyB0aGlzLnN0ZXAsIGluZGVudCwgcGFydClcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmN1cnJlbnQubGFzdC5wdXNoKSB7XG4gICAgICAgICAgdGhpcy5jdXJyZW50ID0gdGhpcy5jdXJyZW50Lmxhc3RcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmV4dHJhSW5kZW50ID0gJydcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpZmY7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5leHRyYUluZGVudCArPSAnICdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZGlmZiAlIHRoaXMuc3RlcCAhPT0gMCkge1xuICAgICAgICBsZXQgbSA9IGluZGVudCArIGRpZmYgJSB0aGlzLnN0ZXBcbiAgICAgICAgdGhpcy53cm9uZ0luZGVudChgJHsgbSB9IG9yICR7IG0gKyB0aGlzLnN0ZXAgfWAsIGluZGVudCwgcGFydClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgLWRpZmYgLyB0aGlzLnN0ZXA7IGkrKykge1xuICAgICAgICAgIHRoaXMuY3VycmVudCA9IHRoaXMuY3VycmVudC5wYXJlbnRcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucHJldkluZGVudCA9IGluZGVudFxuICB9XG5cbiAgaW5pdCAobm9kZSwgcGFydCkge1xuICAgIHRoaXMuaW5kZW50KHBhcnQpXG5cbiAgICBpZiAoIXRoaXMuY3VycmVudC5ub2RlcykgdGhpcy5jdXJyZW50Lm5vZGVzID0gW11cbiAgICB0aGlzLmN1cnJlbnQucHVzaChub2RlKVxuXG4gICAgbm9kZS5yYXdzLmJlZm9yZSA9IHBhcnQuYmVmb3JlICsgcGFydC5pbmRlbnRcbiAgICBpZiAodGhpcy5leHRyYUluZGVudCkge1xuICAgICAgbm9kZS5yYXdzLmV4dHJhSW5kZW50ID0gdGhpcy5leHRyYUluZGVudFxuICAgICAgdGhpcy5leHRyYUluZGVudCA9IGZhbHNlXG4gICAgfVxuICAgIG5vZGUuc291cmNlID0ge1xuICAgICAgc3RhcnQ6IHsgbGluZTogcGFydC50b2tlbnNbMF1bMl0sIGNvbHVtbjogcGFydC50b2tlbnNbMF1bM10gfSxcbiAgICAgIGlucHV0OiB0aGlzLmlucHV0XG4gICAgfVxuICB9XG5cbiAgY2hlY2tDdXJseSAodG9rZW5zKSB7XG4gICAgZm9yIChsZXQgdG9rZW4gb2YgdG9rZW5zKSB7XG4gICAgICBpZiAodG9rZW5bMF0gPT09ICd7Jykge1xuICAgICAgICB0aGlzLmVycm9yKCdVbm5lY2Vzc2FyeSBjdXJseSBicmFja2V0JywgdG9rZW5bMl0sIHRva2VuWzNdKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNoZWNrU2VtaWNvbG9uICh0b2tlbnMpIHtcbiAgICBmb3IgKGxldCB0b2tlbiBvZiB0b2tlbnMpIHtcbiAgICAgIGlmICh0b2tlblswXSA9PT0gJzsnKSB7XG4gICAgICAgIHRoaXMuZXJyb3IoJ1VubmVjZXNzYXJ5IHNlbWljb2xvbicsIHRva2VuWzJdLCB0b2tlblszXSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBrZWVwVHJhaWxpbmdTcGFjZSAobm9kZSwgdG9rZW5zKSB7XG4gICAgbGV0IGxhc3RTcGFjZSA9IHRva2Vuc1t0b2tlbnMubGVuZ3RoIC0gMV1cbiAgICBpZiAobGFzdFNwYWNlICYmIGxhc3RTcGFjZVswXSA9PT0gJ3NwYWNlJykge1xuICAgICAgdG9rZW5zLnBvcCgpXG4gICAgICBub2RlLnJhd3Muc3NzQmV0d2VlbiA9IGxhc3RTcGFjZVsxXVxuICAgIH1cbiAgfVxuXG4gIGZpcnN0U3BhY2VzICh0b2tlbnMpIHtcbiAgICBsZXQgcmVzdWx0ID0gJydcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRva2Vuc1tpXVswXSA9PT0gJ3NwYWNlJyB8fCB0b2tlbnNbaV1bMF0gPT09ICduZXdsaW5lJykge1xuICAgICAgICByZXN1bHQgKz0gdG9rZW5zLnNoaWZ0KClbMV1cbiAgICAgICAgaSAtPSAxXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICByYXcgKG5vZGUsIHByb3AsIHRva2VucywgYWx0TGFzdCkge1xuICAgIGxldCB0b2tlbiwgdHlwZVxuICAgIGxldCBsZW5ndGggPSB0b2tlbnMubGVuZ3RoXG4gICAgbGV0IHZhbHVlID0gJydcbiAgICBsZXQgY2xlYW4gPSB0cnVlXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgICAgdG9rZW4gPSB0b2tlbnNbaV1cbiAgICAgIHR5cGUgPSB0b2tlblswXVxuICAgICAgaWYgKHR5cGUgPT09ICdjb21tZW50JyB8fCAodHlwZSA9PT0gJ3NwYWNlJyAmJiBpID09PSBsZW5ndGggLSAxKSkge1xuICAgICAgICBjbGVhbiA9IGZhbHNlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSArPSB0b2tlblsxXVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWNsZWFuKSB7XG4gICAgICBsZXQgc3NzID0gdG9rZW5zLnJlZHVjZSgoYWxsLCBpKSA9PiBhbGwgKyBpWzFdLCAnJylcbiAgICAgIGxldCByYXcgPSB0b2tlbnMucmVkdWNlKChhbGwsIGkpID0+IHtcbiAgICAgICAgaWYgKGlbMF0gPT09ICdjb21tZW50JyAmJiBpWzZdID09PSAnaW5saW5lJykge1xuICAgICAgICAgIHJldHVybiBhbGwgKyAnLyogJyArIGlbMV0uc2xpY2UoMikudHJpbSgpICsgJyAqLydcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gYWxsICsgaVsxXVxuICAgICAgICB9XG4gICAgICB9LCAnJylcbiAgICAgIG5vZGUucmF3c1twcm9wXSA9IHsgdmFsdWUsIHJhdyB9XG4gICAgICBpZiAoc3NzICE9PSByYXcpIG5vZGUucmF3c1twcm9wXS5zc3MgPSBzc3NcbiAgICB9XG4gICAgbm9kZVtwcm9wXSA9IHZhbHVlXG5cbiAgICBsZXQgbGFzdFxuICAgIGZvciAobGV0IGkgPSB0b2tlbnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGlmICh0b2tlbnNbaV0ubGVuZ3RoID4gMikge1xuICAgICAgICBsYXN0ID0gdG9rZW5zW2ldXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICAgIGlmICghbGFzdCkgbGFzdCA9IGFsdExhc3RcblxuICAgIG5vZGUuc291cmNlLmVuZCA9IHtcbiAgICAgIGxpbmU6IGxhc3RbNF0gfHwgbGFzdFsyXSxcbiAgICAgIGNvbHVtbjogbGFzdFs1XSB8fCBsYXN0WzNdXG4gICAgfVxuICB9XG5cbiAgbmV4dE5vbkNvbW1lbnQgKHBvcykge1xuICAgIGxldCBuZXh0ID0gcG9zXG4gICAgbGV0IHBhcnRcbiAgICB3aGlsZSAobmV4dCA8IHRoaXMucGFydHMubGVuZ3RoKSB7XG4gICAgICBuZXh0ICs9IDFcbiAgICAgIHBhcnQgPSB0aGlzLnBhcnRzW25leHRdXG4gICAgICBpZiAocGFydC5lbmQgfHwgIXBhcnQuY29tbWVudCkgYnJlYWtcbiAgICB9XG4gICAgcmV0dXJuIHBhcnRcbiAgfVxuXG4gIGNvbW1lbnRUZXh0IChub2RlLCB0b2tlbikge1xuICAgIGxldCB0ZXh0ID0gdG9rZW5bMV1cbiAgICBpZiAodG9rZW5bNl0gPT09ICdpbmxpbmUnKSB7XG4gICAgICBub2RlLnJhd3MuaW5saW5lID0gdHJ1ZVxuICAgICAgdGV4dCA9IHRleHQuc2xpY2UoMilcbiAgICB9IGVsc2Uge1xuICAgICAgdGV4dCA9IHRleHQuc2xpY2UoMiwgLTIpXG4gICAgfVxuXG4gICAgbGV0IG1hdGNoID0gdGV4dC5tYXRjaCgvXihcXHMqKShbXl0qW15cXHNdKShcXHMqKVxcbj8kLylcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIG5vZGUudGV4dCA9IG1hdGNoWzJdXG4gICAgICBub2RlLnJhd3MubGVmdCA9IG1hdGNoWzFdXG4gICAgICBub2RlLnJhd3MuaW5saW5lUmlnaHQgPSBtYXRjaFszXVxuICAgIH0gZWxzZSB7XG4gICAgICBub2RlLnRleHQgPSAnJ1xuICAgICAgbm9kZS5yYXdzLmxlZnQgPSAnJ1xuICAgICAgbm9kZS5yYXdzLmlubGluZVJpZ2h0ID0gJydcbiAgICB9XG4gIH1cblxuICAvLyBFcnJvcnNcblxuICBlcnJvciAobXNnLCBsaW5lLCBjb2x1bW4pIHtcbiAgICB0aHJvdyB0aGlzLmlucHV0LmVycm9yKG1zZywgbGluZSwgY29sdW1uKVxuICB9XG5cbiAgdW5uYW1lZEF0cnVsZSAodG9rZW4pIHtcbiAgICB0aGlzLmVycm9yKCdBdC1ydWxlIHdpdGhvdXQgbmFtZScsIHRva2VuWzJdLCB0b2tlblszXSlcbiAgfVxuXG4gIHVubmFtZWREZWNsICh0b2tlbikge1xuICAgIHRoaXMuZXJyb3IoJ0RlY2xhcmF0aW9uIHdpdGhvdXQgbmFtZScsIHRva2VuWzJdLCB0b2tlblszXSlcbiAgfVxuXG4gIGluZGVudGVkRmlyc3RMaW5lIChwYXJ0KSB7XG4gICAgdGhpcy5lcnJvcignRmlyc3QgbGluZSBzaG91bGQgbm90IGhhdmUgaW5kZW50JywgcGFydC5udW1iZXIsIDEpXG4gIH1cblxuICB3cm9uZ0luZGVudCAoZXhwZWN0ZWQsIHJlYWwsIHBhcnQpIHtcbiAgICBsZXQgbXNnID0gYEV4cGVjdGVkICR7IGV4cGVjdGVkIH0gaW5kZW50LCBidXQgZ2V0ICR7IHJlYWwgfWBcbiAgICB0aGlzLmVycm9yKG1zZywgcGFydC5udW1iZXIsIDEpXG4gIH1cblxuICBiYWRQcm9wICh0b2tlbikge1xuICAgIHRoaXMuZXJyb3IoJ1VuZXhwZWN0ZWQgc2VwYXJhdG9yIGluIHByb3BlcnR5JywgdG9rZW5bMl0sIHRva2VuWzNdKVxuICB9XG59XG4iXX0=