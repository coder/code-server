"use strict";

var postcss = require('postcss');

var gonzales = require('gonzales-pe');

var DEFAULT_RAWS_ROOT = {
  before: ''
};
var DEFAULT_RAWS_RULE = {
  before: '',
  between: ''
};
var DEFAULT_RAWS_DECL = {
  before: '',
  between: '',
  semicolon: false
};
var DEFAULT_COMMENT_DECL = {
  before: ''
};
var SUPPORTED_AT_KEYWORDS = ['media'];

var SassParser =
/*#__PURE__*/
function () {
  function SassParser(input) {
    this.input = input;
  }

  var _proto = SassParser.prototype;

  _proto.parse = function parse() {
    try {
      this.node = gonzales.parse(this.input.css, {
        syntax: 'sass'
      });
    } catch (error) {
      throw this.input.error(error.message, error.line, 1);
    }

    this.lines = this.input.css.match(/^.*(\r?\n|$)/gm);
    this.root = this.stylesheet(this.node);
  };

  _proto.extractSource = function extractSource(start, end) {
    var nodeLines = this.lines.slice(start.line - 1, end.line);
    nodeLines[0] = nodeLines[0].substring(start.column - 1);
    var last = nodeLines.length - 1;
    nodeLines[last] = nodeLines[last].substring(0, end.column);
    return nodeLines.join('');
  };

  _proto.stylesheet = function stylesheet(node) {
    var _this = this;

    // Create and set parameters for Root node
    var root = postcss.root();
    root.source = {
      start: node.start,
      end: node.end,
      input: this.input // Raws for root node

    };
    root.raws = {
      semicolon: DEFAULT_RAWS_ROOT.semicolon,
      before: DEFAULT_RAWS_ROOT.before // Store spaces before root (if exist)

    };
    this.raws = {
      before: ''
    };
    node.content.forEach(function (contentNode) {
      return _this.process(contentNode, root);
    });
    return root;
  };

  _proto.process = function process(node, parent) {
    if (this[node.type]) return this[node.type](node, parent) || null;
    return null;
  };

  _proto.ruleset = function ruleset(node, parent) {
    var _this2 = this;

    // Loop to find the deepest ruleset node
    this.raws.multiRuleProp = '';
    node.content.forEach(function (contentNode) {
      switch (contentNode.type) {
        case 'block':
          {
            // Create Rule node
            var rule = postcss.rule();
            rule.selector = ''; // Object to store raws for Rule

            var ruleRaws = {
              before: _this2.raws.before || DEFAULT_RAWS_RULE.before,
              between: DEFAULT_RAWS_RULE.between // Variable to store spaces and symbols before declaration property

            };
            _this2.raws.before = '';
            _this2.raws.comment = false; // Look up throw all nodes in current ruleset node

            node.content.filter(function (content) {
              return content.type === 'block';
            }).forEach(function (innerContentNode) {
              return _this2.process(innerContentNode, rule);
            });

            if (rule.nodes.length) {
              // Write selector to Rule
              rule.selector = _this2.extractSource(node.start, contentNode.start).slice(0, -1).replace(/\s+$/, function (spaces) {
                ruleRaws.between = spaces;
                return '';
              }); // Set parameters for Rule node

              rule.parent = parent;
              rule.source = {
                start: node.start,
                end: node.end,
                input: _this2.input
              };
              rule.raws = ruleRaws;
              parent.nodes.push(rule);
            }

            break;
          }

        default:
      }
    });
  };

  _proto.block = function block(node, parent) {
    var _this3 = this;

    // If nested rules exist, wrap current rule in new rule node
    if (this.raws.multiRule) {
      if (this.raws.multiRulePropVariable) {
        this.raws.multiRuleProp = "$" + this.raws.multiRuleProp;
      }

      var multiRule = Object.assign(postcss.rule(), {
        source: {
          start: {
            line: node.start.line - 1,
            column: node.start.column
          },
          end: node.end,
          input: this.input
        },
        raws: {
          before: this.raws.before || DEFAULT_RAWS_RULE.before,
          between: DEFAULT_RAWS_RULE.between
        },
        parent: parent,
        selector: (this.raws.customProperty ? '--' : '') + this.raws.multiRuleProp
      });
      parent.push(multiRule);
      parent = multiRule;
    }

    this.raws.before = ''; // Looking for declaration node in block node

    node.content.forEach(function (contentNode) {
      return _this3.process(contentNode, parent);
    });

    if (this.raws.multiRule) {
      this.raws.beforeMulti = this.raws.before;
    }
  };

  _proto.declaration = function declaration(node, parent) {
    var _this4 = this;

    var isBlockInside = false; // Create Declaration node

    var declarationNode = postcss.decl();
    declarationNode.prop = ''; // Object to store raws for Declaration

    var declarationRaws = Object.assign(declarationNode.raws, {
      before: this.raws.before || DEFAULT_RAWS_DECL.before,
      between: DEFAULT_RAWS_DECL.between,
      semicolon: DEFAULT_RAWS_DECL.semicolon
    });
    this.raws.property = false;
    this.raws.betweenBefore = false;
    this.raws.comment = false; // Looking for property and value node in declaration node

    node.content.forEach(function (contentNode) {
      switch (contentNode.type) {
        case 'customProperty':
          _this4.raws.customProperty = true;
        // fall through

        case 'property':
          {
            /* this.raws.property to detect is property is already defined in current object */
            _this4.raws.property = true;
            _this4.raws.multiRuleProp = contentNode.content[0].content;
            _this4.raws.multiRulePropVariable = contentNode.content[0].type === 'variable';

            _this4.process(contentNode, declarationNode);

            break;
          }

        case 'propertyDelimiter':
          {
            if (_this4.raws.property && !_this4.raws.betweenBefore) {
              /* If property is already defined and there's no ':' before it */
              declarationRaws.between += contentNode.content;
              _this4.raws.multiRuleProp += contentNode.content;
            } else {
              /* If ':' goes before property declaration, like :width 100px */
              _this4.raws.betweenBefore = true;
              declarationRaws.before += contentNode.content;
              _this4.raws.multiRuleProp += contentNode.content;
            }

            break;
          }

        case 'space':
          {
            declarationRaws.between += contentNode.content;
            break;
          }

        case 'value':
          {
            // Look up for a value for current property
            switch (contentNode.content[0].type) {
              case 'block':
                {
                  isBlockInside = true; // If nested rules exist

                  if (Array.isArray(contentNode.content[0].content)) {
                    _this4.raws.multiRule = true;
                  }

                  _this4.process(contentNode.content[0], parent);

                  break;
                }

              case 'variable':
                {
                  declarationNode.value = '$';

                  _this4.process(contentNode, declarationNode);

                  break;
                }

              case 'color':
                {
                  declarationNode.value = '#';

                  _this4.process(contentNode, declarationNode);

                  break;
                }

              case 'number':
                {
                  if (contentNode.content.length > 1) {
                    declarationNode.value = contentNode.content.join('');
                  } else {
                    _this4.process(contentNode, declarationNode);
                  }

                  break;
                }

              case 'parentheses':
                {
                  declarationNode.value = '(';

                  _this4.process(contentNode, declarationNode);

                  break;
                }

              default:
                {
                  _this4.process(contentNode, declarationNode);
                }
            }

            break;
          }

        default:
      }
    });

    if (!isBlockInside) {
      // Set parameters for Declaration node
      declarationNode.source = {
        start: node.start,
        end: node.end,
        input: this.input
      };
      declarationNode.parent = parent;
      parent.nodes.push(declarationNode);
    }

    this.raws.before = '';
    this.raws.customProperty = false;
    this.raws.multiRuleProp = '';
    this.raws.property = false;
  };

  _proto.customProperty = function customProperty(node, parent) {
    this.property(node, parent);
    parent.prop = "--" + parent.prop;
  };

  _proto.property = function property(node, parent) {
    // Set property for Declaration node
    switch (node.content[0].type) {
      case 'variable':
        {
          parent.prop += '$';
          break;
        }

      case 'interpolation':
        {
          this.raws.interpolation = true;
          parent.prop += '#{';
          break;
        }

      default:
    }

    parent.prop += node.content[0].content;

    if (this.raws.interpolation) {
      parent.prop += '}';
      this.raws.interpolation = false;
    }
  };

  _proto.value = function value(node, parent) {
    if (!parent.value) {
      parent.value = '';
    } // Set value for Declaration node


    if (node.content.length) {
      node.content.forEach(function (contentNode) {
        switch (contentNode.type) {
          case 'important':
            {
              parent.raws.important = contentNode.content;
              parent.important = true;
              var match = parent.value.match(/^(.*?)(\s*)$/);

              if (match) {
                parent.raws.important = match[2] + parent.raws.important;
                parent.value = match[1];
              }

              break;
            }

          case 'parentheses':
            {
              parent.value += contentNode.content.join('') + ')';
              break;
            }

          case 'percentage':
            {
              parent.value += contentNode.content.join('') + '%';
              break;
            }

          default:
            {
              if (contentNode.content.constructor === Array) {
                parent.value += contentNode.content.join('');
              } else {
                parent.value += contentNode.content;
              }
            }
        }
      });
    }
  };

  _proto.singlelineComment = function singlelineComment(node, parent) {
    return this.comment(node, parent, true);
  };

  _proto.multilineComment = function multilineComment(node, parent) {
    return this.comment(node, parent, false);
  };

  _proto.comment = function comment(node, parent, inline) {
    // https://github.com/nodesecurity/eslint-plugin-security#detect-unsafe-regex
    // eslint-disable-next-line security/detect-unsafe-regex
    var text = node.content.match(/^(\s*)((?:\S[\S\s]*?)?)(\s*)$/);
    this.raws.comment = true;
    var comment = Object.assign(postcss.comment(), {
      text: text[2],
      raws: {
        before: this.raws.before || DEFAULT_COMMENT_DECL.before,
        left: text[1],
        right: text[3],
        inline: inline
      },
      source: {
        start: {
          line: node.start.line,
          column: node.start.column
        },
        end: node.end,
        input: this.input
      },
      parent: parent
    });

    if (this.raws.beforeMulti) {
      comment.raws.before += this.raws.beforeMulti;
      this.raws.beforeMulti = undefined;
    }

    parent.nodes.push(comment);
    this.raws.before = '';
  };

  _proto.space = function space(node, parent) {
    // Spaces before root and rule
    switch (parent.type) {
      case 'root':
        {
          this.raws.before += node.content;
          break;
        }

      case 'rule':
        {
          if (this.raws.comment) {
            this.raws.before += node.content;
          } else if (this.raws.loop) {
            parent.selector += node.content;
          } else {
            this.raws.before = (this.raws.before || '\n') + node.content;
          }

          break;
        }

      default:
    }
  };

  _proto.declarationDelimiter = function declarationDelimiter(node) {
    this.raws.before += node.content;
  };

  _proto.loop = function loop(node, parent) {
    var _this5 = this;

    var loop = postcss.rule();
    this.raws.comment = false;
    this.raws.multiRule = false;
    this.raws.loop = true;
    loop.selector = '';
    loop.raws = {
      before: this.raws.before || DEFAULT_RAWS_RULE.before,
      between: DEFAULT_RAWS_RULE.between
    };

    if (this.raws.beforeMulti) {
      loop.raws.before += this.raws.beforeMulti;
      this.raws.beforeMulti = undefined;
    }

    node.content.forEach(function (contentNode, i) {
      if (node.content[i + 1] && node.content[i + 1].type === 'block') {
        _this5.raws.loop = false;
      }

      _this5.process(contentNode, loop);
    });
    parent.nodes.push(loop);
    this.raws.loop = false;
  };

  _proto.atrule = function atrule(node, parent) {
    var _this6 = this;

    // Skip unsupported @xxx rules
    var supportedNode = node.content[0].content.some(function (contentNode) {
      return SUPPORTED_AT_KEYWORDS.includes(contentNode.content);
    });
    if (!supportedNode) return;
    var atrule = postcss.rule();
    atrule.selector = '';
    atrule.raws = {
      before: this.raws.before || DEFAULT_RAWS_RULE.before,
      between: DEFAULT_RAWS_RULE.between
    };
    node.content.forEach(function (contentNode, i) {
      if (contentNode.type === 'space') {
        var prevNodeType = node.content[i - 1].type;

        switch (prevNodeType) {
          case 'atkeyword':
          case 'ident':
            atrule.selector += contentNode.content;
            break;

          default:
        }

        return;
      }

      _this6.process(contentNode, atrule);
    });
    parent.nodes.push(atrule);
  };

  _proto.parentheses = function parentheses(node, parent) {
    parent.selector += '(';
    node.content.forEach(function (contentNode) {
      if (typeof contentNode.content === 'string') {
        parent.selector += contentNode.content;
      }

      if (typeof contentNode.content === 'object') {
        contentNode.content.forEach(function (childrenContentNode) {
          if (contentNode.type === 'variable') parent.selector += '$';
          parent.selector += childrenContentNode.content;
        });
      }
    });
    parent.selector += ')';
  };

  _proto.interpolation = function interpolation(node, parent) {
    var _this7 = this;

    parent.selector += '#{';
    node.content.forEach(function (contentNode) {
      _this7.process(contentNode, parent);
    });
    parent.selector += '}';
  };

  _proto.atkeyword = function atkeyword(node, parent) {
    parent.selector += "@" + node.content;
  };

  _proto.operator = function operator(node, parent) {
    parent.selector += node.content;
  };

  _proto.variable = function variable(node, parent) {
    if (this.raws.loop) {
      parent.selector += "$" + node.content[0].content;
      return;
    }

    parent.selector += "$" + node.content;
  };

  _proto.ident = function ident(node, parent) {
    parent.selector += node.content;
  };

  return SassParser;
}();

module.exports = SassParser;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhcnNlci5lczYiXSwibmFtZXMiOlsicG9zdGNzcyIsInJlcXVpcmUiLCJnb256YWxlcyIsIkRFRkFVTFRfUkFXU19ST09UIiwiYmVmb3JlIiwiREVGQVVMVF9SQVdTX1JVTEUiLCJiZXR3ZWVuIiwiREVGQVVMVF9SQVdTX0RFQ0wiLCJzZW1pY29sb24iLCJERUZBVUxUX0NPTU1FTlRfREVDTCIsIlNVUFBPUlRFRF9BVF9LRVlXT1JEUyIsIlNhc3NQYXJzZXIiLCJpbnB1dCIsInBhcnNlIiwibm9kZSIsImNzcyIsInN5bnRheCIsImVycm9yIiwibWVzc2FnZSIsImxpbmUiLCJsaW5lcyIsIm1hdGNoIiwicm9vdCIsInN0eWxlc2hlZXQiLCJleHRyYWN0U291cmNlIiwic3RhcnQiLCJlbmQiLCJub2RlTGluZXMiLCJzbGljZSIsInN1YnN0cmluZyIsImNvbHVtbiIsImxhc3QiLCJsZW5ndGgiLCJqb2luIiwic291cmNlIiwicmF3cyIsImNvbnRlbnQiLCJmb3JFYWNoIiwiY29udGVudE5vZGUiLCJwcm9jZXNzIiwicGFyZW50IiwidHlwZSIsInJ1bGVzZXQiLCJtdWx0aVJ1bGVQcm9wIiwicnVsZSIsInNlbGVjdG9yIiwicnVsZVJhd3MiLCJjb21tZW50IiwiZmlsdGVyIiwiaW5uZXJDb250ZW50Tm9kZSIsIm5vZGVzIiwicmVwbGFjZSIsInNwYWNlcyIsInB1c2giLCJibG9jayIsIm11bHRpUnVsZSIsIm11bHRpUnVsZVByb3BWYXJpYWJsZSIsIk9iamVjdCIsImFzc2lnbiIsImN1c3RvbVByb3BlcnR5IiwiYmVmb3JlTXVsdGkiLCJkZWNsYXJhdGlvbiIsImlzQmxvY2tJbnNpZGUiLCJkZWNsYXJhdGlvbk5vZGUiLCJkZWNsIiwicHJvcCIsImRlY2xhcmF0aW9uUmF3cyIsInByb3BlcnR5IiwiYmV0d2VlbkJlZm9yZSIsIkFycmF5IiwiaXNBcnJheSIsInZhbHVlIiwiaW50ZXJwb2xhdGlvbiIsImltcG9ydGFudCIsImNvbnN0cnVjdG9yIiwic2luZ2xlbGluZUNvbW1lbnQiLCJtdWx0aWxpbmVDb21tZW50IiwiaW5saW5lIiwidGV4dCIsImxlZnQiLCJyaWdodCIsInVuZGVmaW5lZCIsInNwYWNlIiwibG9vcCIsImRlY2xhcmF0aW9uRGVsaW1pdGVyIiwiaSIsImF0cnVsZSIsInN1cHBvcnRlZE5vZGUiLCJzb21lIiwiaW5jbHVkZXMiLCJwcmV2Tm9kZVR5cGUiLCJwYXJlbnRoZXNlcyIsImNoaWxkcmVuQ29udGVudE5vZGUiLCJhdGtleXdvcmQiLCJvcGVyYXRvciIsInZhcmlhYmxlIiwiaWRlbnQiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztBQUFBLElBQU1BLE9BQU8sR0FBR0MsT0FBTyxDQUFDLFNBQUQsQ0FBdkI7O0FBQ0EsSUFBTUMsUUFBUSxHQUFHRCxPQUFPLENBQUMsYUFBRCxDQUF4Qjs7QUFFQSxJQUFNRSxpQkFBaUIsR0FBRztBQUN4QkMsRUFBQUEsTUFBTSxFQUFFO0FBRGdCLENBQTFCO0FBSUEsSUFBTUMsaUJBQWlCLEdBQUc7QUFDeEJELEVBQUFBLE1BQU0sRUFBRSxFQURnQjtBQUV4QkUsRUFBQUEsT0FBTyxFQUFFO0FBRmUsQ0FBMUI7QUFLQSxJQUFNQyxpQkFBaUIsR0FBRztBQUN4QkgsRUFBQUEsTUFBTSxFQUFFLEVBRGdCO0FBRXhCRSxFQUFBQSxPQUFPLEVBQUUsRUFGZTtBQUd4QkUsRUFBQUEsU0FBUyxFQUFFO0FBSGEsQ0FBMUI7QUFNQSxJQUFNQyxvQkFBb0IsR0FBRztBQUMzQkwsRUFBQUEsTUFBTSxFQUFFO0FBRG1CLENBQTdCO0FBSUEsSUFBTU0scUJBQXFCLEdBQUcsQ0FDNUIsT0FENEIsQ0FBOUI7O0lBSU1DLFU7OztBQUNKLHNCQUFhQyxLQUFiLEVBQW9CO0FBQ2xCLFNBQUtBLEtBQUwsR0FBYUEsS0FBYjtBQUNEOzs7O1NBRURDLEssR0FBQSxpQkFBUztBQUNQLFFBQUk7QUFDRixXQUFLQyxJQUFMLEdBQVlaLFFBQVEsQ0FBQ1csS0FBVCxDQUFlLEtBQUtELEtBQUwsQ0FBV0csR0FBMUIsRUFB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QjtBQUNELEc7O1NBRUQ0RCxLLEdBQUEsZUFBT2xGLElBQVAsRUFBYTBCLE1BQWIsRUFBcUI7QUFDbkJBLElBQUFBLE1BQU0sQ0FBQ0ssUUFBUCxJQUFtQi9CLElBQUksQ0FBQ3NCLE9BQXhCO0FBQ0QsRzs7Ozs7QUFHSDZELE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQnZGLFVBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgcG9zdGNzcyA9IHJlcXVpcmUoJ3Bvc3Rjc3MnKVxuY29uc3QgZ29uemFsZXMgPSByZXF1aXJlKCdnb256YWxlcy1wZScpXG5cbmNvbnN0IERFRkFVTFRfUkFXU19ST09UID0ge1xuICBiZWZvcmU6ICcnXG59XG5cbmNvbnN0IERFRkFVTFRfUkFXU19SVUxFID0ge1xuICBiZWZvcmU6ICcnLFxuICBiZXR3ZWVuOiAnJ1xufVxuXG5jb25zdCBERUZBVUxUX1JBV1NfREVDTCA9IHtcbiAgYmVmb3JlOiAnJyxcbiAgYmV0d2VlbjogJycsXG4gIHNlbWljb2xvbjogZmFsc2Vcbn1cblxuY29uc3QgREVGQVVMVF9DT01NRU5UX0RFQ0wgPSB7XG4gIGJlZm9yZTogJydcbn1cblxuY29uc3QgU1VQUE9SVEVEX0FUX0tFWVdPUkRTID0gW1xuICAnbWVkaWEnXG5dXG5cbmNsYXNzIFNhc3NQYXJzZXIge1xuICBjb25zdHJ1Y3RvciAoaW5wdXQpIHtcbiAgICB0aGlzLmlucHV0ID0gaW5wdXRcbiAgfVxuXG4gIHBhcnNlICgpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5ub2RlID0gZ29uemFsZXMucGFyc2UodGhpcy5pbnB1dC5jc3MsIHsgc3ludGF4OiAnc2FzcycgfSlcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhyb3cgdGhpcy5pbnB1dC5lcnJvcihlcnJvci5tZXNzYWdlLCBlcnJvci5saW5lLCAxKVxuICAgIH1cbiAgICB0aGlzLmxpbmVzID0gdGhpcy5pbnB1dC5jc3MubWF0Y2goL14uKihcXHI/XFxufCQpL2dtKVxuICAgIHRoaXMucm9vdCA9IHRoaXMuc3R5bGVzaGVldCh0aGlzLm5vZGUpXG4gIH1cblxuICBleHRyYWN0U291cmNlIChzdGFydCwgZW5kKSB7XG4gICAgbGV0IG5vZGVMaW5lcyA9IHRoaXMubGluZXMuc2xpY2UoXG4gICAgICBzdGFydC5saW5lIC0gMSxcbiAgICAgIGVuZC5saW5lXG4gICAgKVxuXG4gICAgbm9kZUxpbmVzWzBdID0gbm9kZUxpbmVzWzBdLnN1YnN0cmluZyhzdGFydC5jb2x1bW4gLSAxKVxuICAgIGxldCBsYXN0ID0gbm9kZUxpbmVzLmxlbmd0aCAtIDFcbiAgICBub2RlTGluZXNbbGFzdF0gPSBub2RlTGluZXNbbGFzdF0uc3Vic3RyaW5nKDAsIGVuZC5jb2x1bW4pXG5cbiAgICByZXR1cm4gbm9kZUxpbmVzLmpvaW4oJycpXG4gIH1cblxuICBzdHlsZXNoZWV0IChub2RlKSB7XG4gICAgLy8gQ3JlYXRlIGFuZCBzZXQgcGFyYW1ldGVycyBmb3IgUm9vdCBub2RlXG4gICAgbGV0IHJvb3QgPSBwb3N0Y3NzLnJvb3QoKVxuICAgIHJvb3Quc291cmNlID0ge1xuICAgICAgc3RhcnQ6IG5vZGUuc3RhcnQsXG4gICAgICBlbmQ6IG5vZGUuZW5kLFxuICAgICAgaW5wdXQ6IHRoaXMuaW5wdXRcbiAgICB9XG4gICAgLy8gUmF3cyBmb3Igcm9vdCBub2RlXG4gICAgcm9vdC5yYXdzID0ge1xuICAgICAgc2VtaWNvbG9uOiBERUZBVUxUX1JBV1NfUk9PVC5zZW1pY29sb24sXG4gICAgICBiZWZvcmU6IERFRkFVTFRfUkFXU19ST09ULmJlZm9yZVxuICAgIH1cbiAgICAvLyBTdG9yZSBzcGFjZXMgYmVmb3JlIHJvb3QgKGlmIGV4aXN0KVxuICAgIHRoaXMucmF3cyA9IHtcbiAgICAgIGJlZm9yZTogJydcbiAgICB9XG4gICAgbm9kZS5jb250ZW50LmZvckVhY2goY29udGVudE5vZGUgPT4gdGhpcy5wcm9jZXNzKGNvbnRlbnROb2RlLCByb290KSlcbiAgICByZXR1cm4gcm9vdFxuICB9XG5cbiAgcHJvY2VzcyAobm9kZSwgcGFyZW50KSB7XG4gICAgaWYgKHRoaXNbbm9kZS50eXBlXSkgcmV0dXJuIHRoaXNbbm9kZS50eXBlXShub2RlLCBwYXJlbnQpIHx8IG51bGxcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgcnVsZXNldCAobm9kZSwgcGFyZW50KSB7XG4gICAgLy8gTG9vcCB0byBmaW5kIHRoZSBkZWVwZXN0IHJ1bGVzZXQgbm9kZVxuICAgIHRoaXMucmF3cy5tdWx0aVJ1bGVQcm9wID0gJydcblxuICAgIG5vZGUuY29udGVudC5mb3JFYWNoKGNvbnRlbnROb2RlID0+IHtcbiAgICAgIHN3aXRjaCAoY29udGVudE5vZGUudHlwZSkge1xuICAgICAgICBjYXNlICdibG9jayc6IHtcbiAgICAgICAgICAvLyBDcmVhdGUgUnVsZSBub2RlXG4gICAgICAgICAgbGV0IHJ1bGUgPSBwb3N0Y3NzLnJ1bGUoKVxuICAgICAgICAgIHJ1bGUuc2VsZWN0b3IgPSAnJ1xuICAgICAgICAgIC8vIE9iamVjdCB0byBzdG9yZSByYXdzIGZvciBSdWxlXG4gICAgICAgICAgbGV0IHJ1bGVSYXdzID0ge1xuICAgICAgICAgICAgYmVmb3JlOiB0aGlzLnJhd3MuYmVmb3JlIHx8IERFRkFVTFRfUkFXU19SVUxFLmJlZm9yZSxcbiAgICAgICAgICAgIGJldHdlZW46IERFRkFVTFRfUkFXU19SVUxFLmJldHdlZW5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBWYXJpYWJsZSB0byBzdG9yZSBzcGFjZXMgYW5kIHN5bWJvbHMgYmVmb3JlIGRlY2xhcmF0aW9uIHByb3BlcnR5XG4gICAgICAgICAgdGhpcy5yYXdzLmJlZm9yZSA9ICcnXG4gICAgICAgICAgdGhpcy5yYXdzLmNvbW1lbnQgPSBmYWxzZVxuXG4gICAgICAgICAgLy8gTG9vayB1cCB0aHJvdyBhbGwgbm9kZXMgaW4gY3VycmVudCBydWxlc2V0IG5vZGVcbiAgICAgICAgICBub2RlLmNvbnRlbnRcbiAgICAgICAgICAgIC5maWx0ZXIoY29udGVudCA9PiBjb250ZW50LnR5cGUgPT09ICdibG9jaycpXG4gICAgICAgICAgICAuZm9yRWFjaChpbm5lckNvbnRlbnROb2RlID0+IHRoaXMucHJvY2Vzcyhpbm5lckNvbnRlbnROb2RlLCBydWxlKSlcblxuICAgICAgICAgIGlmIChydWxlLm5vZGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgLy8gV3JpdGUgc2VsZWN0b3IgdG8gUnVsZVxuICAgICAgICAgICAgcnVsZS5zZWxlY3RvciA9IHRoaXMuZXh0cmFjdFNvdXJjZShcbiAgICAgICAgICAgICAgbm9kZS5zdGFydCxcbiAgICAgICAgICAgICAgY29udGVudE5vZGUuc3RhcnRcbiAgICAgICAgICAgICkuc2xpY2UoMCwgLTEpLnJlcGxhY2UoL1xccyskLywgc3BhY2VzID0+IHtcbiAgICAgICAgICAgICAgcnVsZVJhd3MuYmV0d2VlbiA9IHNwYWNlc1xuICAgICAgICAgICAgICByZXR1cm4gJydcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAvLyBTZXQgcGFyYW1ldGVycyBmb3IgUnVsZSBub2RlXG4gICAgICAgICAgICBydWxlLnBhcmVudCA9IHBhcmVudFxuICAgICAgICAgICAgcnVsZS5zb3VyY2UgPSB7XG4gICAgICAgICAgICAgIHN0YXJ0OiBub2RlLnN0YXJ0LFxuICAgICAgICAgICAgICBlbmQ6IG5vZGUuZW5kLFxuICAgICAgICAgICAgICBpbnB1dDogdGhpcy5pbnB1dFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcnVsZS5yYXdzID0gcnVsZVJhd3NcbiAgICAgICAgICAgIHBhcmVudC5ub2Rlcy5wdXNoKHJ1bGUpXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgYmxvY2sgKG5vZGUsIHBhcmVudCkge1xuICAgIC8vIElmIG5lc3RlZCBydWxlcyBleGlzdCwgd3JhcCBjdXJyZW50IHJ1bGUgaW4gbmV3IHJ1bGUgbm9kZVxuICAgIGlmICh0aGlzLnJhd3MubXVsdGlSdWxlKSB7XG4gICAgICBpZiAodGhpcy5yYXdzLm11bHRpUnVsZVByb3BWYXJpYWJsZSkge1xuICAgICAgICB0aGlzLnJhd3MubXVsdGlSdWxlUHJvcCA9IGAkJHsgdGhpcy5yYXdzLm11bHRpUnVsZVByb3AgfWBcbiAgICAgIH1cbiAgICAgIGxldCBtdWx0aVJ1bGUgPSBPYmplY3QuYXNzaWduKHBvc3Rjc3MucnVsZSgpLCB7XG4gICAgICAgIHNvdXJjZToge1xuICAgICAgICAgIHN0YXJ0OiB7XG4gICAgICAgICAgICBsaW5lOiBub2RlLnN0YXJ0LmxpbmUgLSAxLFxuICAgICAgICAgICAgY29sdW1uOiBub2RlLnN0YXJ0LmNvbHVtblxuICAgICAgICAgIH0sXG4gICAgICAgICAgZW5kOiBub2RlLmVuZCxcbiAgICAgICAgICBpbnB1dDogdGhpcy5pbnB1dFxuICAgICAgICB9LFxuICAgICAgICByYXdzOiB7XG4gICAgICAgICAgYmVmb3JlOiB0aGlzLnJhd3MuYmVmb3JlIHx8IERFRkFVTFRfUkFXU19SVUxFLmJlZm9yZSxcbiAgICAgICAgICBiZXR3ZWVuOiBERUZBVUxUX1JBV1NfUlVMRS5iZXR3ZWVuXG4gICAgICAgIH0sXG4gICAgICAgIHBhcmVudCxcbiAgICAgICAgc2VsZWN0b3I6ICh0aGlzLnJhd3MuY3VzdG9tUHJvcGVydHkgPyAnLS0nIDogJycpICsgdGhpcy5yYXdzLm11bHRpUnVsZVByb3BcbiAgICAgIH0pXG4gICAgICBwYXJlbnQucHVzaChtdWx0aVJ1bGUpXG4gICAgICBwYXJlbnQgPSBtdWx0aVJ1bGVcbiAgICB9XG5cbiAgICB0aGlzLnJhd3MuYmVmb3JlID0gJydcblxuICAgIC8vIExvb2tpbmcgZm9yIGRlY2xhcmF0aW9uIG5vZGUgaW4gYmxvY2sgbm9kZVxuICAgIG5vZGUuY29udGVudC5mb3JFYWNoKGNvbnRlbnROb2RlID0+IHRoaXMucHJvY2Vzcyhjb250ZW50Tm9kZSwgcGFyZW50KSlcbiAgICBpZiAodGhpcy5yYXdzLm11bHRpUnVsZSkge1xuICAgICAgdGhpcy5yYXdzLmJlZm9yZU11bHRpID0gdGhpcy5yYXdzLmJlZm9yZVxuICAgIH1cbiAgfVxuXG4gIGRlY2xhcmF0aW9uIChub2RlLCBwYXJlbnQpIHtcbiAgICBsZXQgaXNCbG9ja0luc2lkZSA9IGZhbHNlXG4gICAgLy8gQ3JlYXRlIERlY2xhcmF0aW9uIG5vZGVcbiAgICBsZXQgZGVjbGFyYXRpb25Ob2RlID0gcG9zdGNzcy5kZWNsKClcbiAgICBkZWNsYXJhdGlvbk5vZGUucHJvcCA9ICcnXG5cbiAgICAvLyBPYmplY3QgdG8gc3RvcmUgcmF3cyBmb3IgRGVjbGFyYXRpb25cbiAgICBsZXQgZGVjbGFyYXRpb25SYXdzID0gT2JqZWN0LmFzc2lnbihkZWNsYXJhdGlvbk5vZGUucmF3cywge1xuICAgICAgYmVmb3JlOiB0aGlzLnJhd3MuYmVmb3JlIHx8IERFRkFVTFRfUkFXU19ERUNMLmJlZm9yZSxcbiAgICAgIGJldHdlZW46IERFRkFVTFRfUkFXU19ERUNMLmJldHdlZW4sXG4gICAgICBzZW1pY29sb246IERFRkFVTFRfUkFXU19ERUNMLnNlbWljb2xvblxuICAgIH0pXG5cbiAgICB0aGlzLnJhd3MucHJvcGVydHkgPSBmYWxzZVxuICAgIHRoaXMucmF3cy5iZXR3ZWVuQmVmb3JlID0gZmFsc2VcbiAgICB0aGlzLnJhd3MuY29tbWVudCA9IGZhbHNlXG4gICAgLy8gTG9va2luZyBmb3IgcHJvcGVydHkgYW5kIHZhbHVlIG5vZGUgaW4gZGVjbGFyYXRpb24gbm9kZVxuICAgIG5vZGUuY29udGVudC5mb3JFYWNoKGNvbnRlbnROb2RlID0+IHtcbiAgICAgIHN3aXRjaCAoY29udGVudE5vZGUudHlwZSkge1xuICAgICAgICBjYXNlICdjdXN0b21Qcm9wZXJ0eSc6XG4gICAgICAgICAgdGhpcy5yYXdzLmN1c3RvbVByb3BlcnR5ID0gdHJ1ZVxuICAgICAgICAgIC8vIGZhbGwgdGhyb3VnaFxuICAgICAgICBjYXNlICdwcm9wZXJ0eSc6IHtcbiAgICAgICAgICAvKiB0aGlzLnJhd3MucHJvcGVydHkgdG8gZGV0ZWN0IGlzIHByb3BlcnR5IGlzIGFscmVhZHkgZGVmaW5lZCBpbiBjdXJyZW50IG9iamVjdCAqL1xuICAgICAgICAgIHRoaXMucmF3cy5wcm9wZXJ0eSA9IHRydWVcbiAgICAgICAgICB0aGlzLnJhd3MubXVsdGlSdWxlUHJvcCA9IGNvbnRlbnROb2RlLmNvbnRlbnRbMF0uY29udGVudFxuICAgICAgICAgIHRoaXMucmF3cy5tdWx0aVJ1bGVQcm9wVmFyaWFibGUgPSBjb250ZW50Tm9kZS5jb250ZW50WzBdLnR5cGUgPT09ICd2YXJpYWJsZSdcbiAgICAgICAgICB0aGlzLnByb2Nlc3MoY29udGVudE5vZGUsIGRlY2xhcmF0aW9uTm9kZSlcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgJ3Byb3BlcnR5RGVsaW1pdGVyJzoge1xuICAgICAgICAgIGlmICh0aGlzLnJhd3MucHJvcGVydHkgJiYgIXRoaXMucmF3cy5iZXR3ZWVuQmVmb3JlKSB7XG4gICAgICAgICAgICAvKiBJZiBwcm9wZXJ0eSBpcyBhbHJlYWR5IGRlZmluZWQgYW5kIHRoZXJlJ3Mgbm8gJzonIGJlZm9yZSBpdCAqL1xuICAgICAgICAgICAgZGVjbGFyYXRpb25SYXdzLmJldHdlZW4gKz0gY29udGVudE5vZGUuY29udGVudFxuICAgICAgICAgICAgdGhpcy5yYXdzLm11bHRpUnVsZVByb3AgKz0gY29udGVudE5vZGUuY29udGVudFxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvKiBJZiAnOicgZ29lcyBiZWZvcmUgcHJvcGVydHkgZGVjbGFyYXRpb24sIGxpa2UgOndpZHRoIDEwMHB4ICovXG4gICAgICAgICAgICB0aGlzLnJhd3MuYmV0d2VlbkJlZm9yZSA9IHRydWVcbiAgICAgICAgICAgIGRlY2xhcmF0aW9uUmF3cy5iZWZvcmUgKz0gY29udGVudE5vZGUuY29udGVudFxuICAgICAgICAgICAgdGhpcy5yYXdzLm11bHRpUnVsZVByb3AgKz0gY29udGVudE5vZGUuY29udGVudFxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgJ3NwYWNlJzoge1xuICAgICAgICAgIGRlY2xhcmF0aW9uUmF3cy5iZXR3ZWVuICs9IGNvbnRlbnROb2RlLmNvbnRlbnRcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgJ3ZhbHVlJzoge1xuICAgICAgICAgIC8vIExvb2sgdXAgZm9yIGEgdmFsdWUgZm9yIGN1cnJlbnQgcHJvcGVydHlcbiAgICAgICAgICBzd2l0Y2ggKGNvbnRlbnROb2RlLmNvbnRlbnRbMF0udHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnYmxvY2snOiB7XG4gICAgICAgICAgICAgIGlzQmxvY2tJbnNpZGUgPSB0cnVlXG4gICAgICAgICAgICAgIC8vIElmIG5lc3RlZCBydWxlcyBleGlzdFxuICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjb250ZW50Tm9kZS5jb250ZW50WzBdLmNvbnRlbnQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yYXdzLm11bHRpUnVsZSA9IHRydWVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB0aGlzLnByb2Nlc3MoY29udGVudE5vZGUuY29udGVudFswXSwgcGFyZW50KVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAndmFyaWFibGUnOiB7XG4gICAgICAgICAgICAgIGRlY2xhcmF0aW9uTm9kZS52YWx1ZSA9ICckJ1xuICAgICAgICAgICAgICB0aGlzLnByb2Nlc3MoY29udGVudE5vZGUsIGRlY2xhcmF0aW9uTm9kZSlcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ2NvbG9yJzoge1xuICAgICAgICAgICAgICBkZWNsYXJhdGlvbk5vZGUudmFsdWUgPSAnIydcbiAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzKGNvbnRlbnROb2RlLCBkZWNsYXJhdGlvbk5vZGUpXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdudW1iZXInOiB7XG4gICAgICAgICAgICAgIGlmIChjb250ZW50Tm9kZS5jb250ZW50Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICBkZWNsYXJhdGlvbk5vZGUudmFsdWUgPSBjb250ZW50Tm9kZS5jb250ZW50LmpvaW4oJycpXG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzKGNvbnRlbnROb2RlLCBkZWNsYXJhdGlvbk5vZGUpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ3BhcmVudGhlc2VzJzoge1xuICAgICAgICAgICAgICBkZWNsYXJhdGlvbk5vZGUudmFsdWUgPSAnKCdcbiAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzKGNvbnRlbnROb2RlLCBkZWNsYXJhdGlvbk5vZGUpXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAgIHRoaXMucHJvY2Vzcyhjb250ZW50Tm9kZSwgZGVjbGFyYXRpb25Ob2RlKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICB9XG4gICAgfSlcblxuICAgIGlmICghaXNCbG9ja0luc2lkZSkge1xuICAgICAgLy8gU2V0IHBhcmFtZXRlcnMgZm9yIERlY2xhcmF0aW9uIG5vZGVcbiAgICAgIGRlY2xhcmF0aW9uTm9kZS5zb3VyY2UgPSB7XG4gICAgICAgIHN0YXJ0OiBub2RlLnN0YXJ0LFxuICAgICAgICBlbmQ6IG5vZGUuZW5kLFxuICAgICAgICBpbnB1dDogdGhpcy5pbnB1dFxuICAgICAgfVxuICAgICAgZGVjbGFyYXRpb25Ob2RlLnBhcmVudCA9IHBhcmVudFxuICAgICAgcGFyZW50Lm5vZGVzLnB1c2goZGVjbGFyYXRpb25Ob2RlKVxuICAgIH1cblxuICAgIHRoaXMucmF3cy5iZWZvcmUgPSAnJ1xuICAgIHRoaXMucmF3cy5jdXN0b21Qcm9wZXJ0eSA9IGZhbHNlXG4gICAgdGhpcy5yYXdzLm11bHRpUnVsZVByb3AgPSAnJ1xuICAgIHRoaXMucmF3cy5wcm9wZXJ0eSA9IGZhbHNlXG4gIH1cblxuICBjdXN0b21Qcm9wZXJ0eSAobm9kZSwgcGFyZW50KSB7XG4gICAgdGhpcy5wcm9wZXJ0eShub2RlLCBwYXJlbnQpXG4gICAgcGFyZW50LnByb3AgPSBgLS0keyBwYXJlbnQucHJvcCB9YFxuICB9XG5cbiAgcHJvcGVydHkgKG5vZGUsIHBhcmVudCkge1xuICAgIC8vIFNldCBwcm9wZXJ0eSBmb3IgRGVjbGFyYXRpb24gbm9kZVxuICAgIHN3aXRjaCAobm9kZS5jb250ZW50WzBdLnR5cGUpIHtcbiAgICAgIGNhc2UgJ3ZhcmlhYmxlJzoge1xuICAgICAgICBwYXJlbnQucHJvcCArPSAnJCdcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICAgIGNhc2UgJ2ludGVycG9sYXRpb24nOiB7XG4gICAgICAgIHRoaXMucmF3cy5pbnRlcnBvbGF0aW9uID0gdHJ1ZVxuICAgICAgICBwYXJlbnQucHJvcCArPSAnI3snXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgIH1cbiAgICBwYXJlbnQucHJvcCArPSBub2RlLmNvbnRlbnRbMF0uY29udGVudFxuICAgIGlmICh0aGlzLnJhd3MuaW50ZXJwb2xhdGlvbikge1xuICAgICAgcGFyZW50LnByb3AgKz0gJ30nXG4gICAgICB0aGlzLnJhd3MuaW50ZXJwb2xhdGlvbiA9IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgdmFsdWUgKG5vZGUsIHBhcmVudCkge1xuICAgIGlmICghcGFyZW50LnZhbHVlKSB7XG4gICAgICBwYXJlbnQudmFsdWUgPSAnJ1xuICAgIH1cbiAgICAvLyBTZXQgdmFsdWUgZm9yIERlY2xhcmF0aW9uIG5vZGVcbiAgICBpZiAobm9kZS5jb250ZW50Lmxlbmd0aCkge1xuICAgICAgbm9kZS5jb250ZW50LmZvckVhY2goY29udGVudE5vZGUgPT4ge1xuICAgICAgICBzd2l0Y2ggKGNvbnRlbnROb2RlLnR5cGUpIHtcbiAgICAgICAgICBjYXNlICdpbXBvcnRhbnQnOiB7XG4gICAgICAgICAgICBwYXJlbnQucmF3cy5pbXBvcnRhbnQgPSBjb250ZW50Tm9kZS5jb250ZW50XG4gICAgICAgICAgICBwYXJlbnQuaW1wb3J0YW50ID0gdHJ1ZVxuICAgICAgICAgICAgbGV0IG1hdGNoID0gcGFyZW50LnZhbHVlLm1hdGNoKC9eKC4qPykoXFxzKikkLylcbiAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICBwYXJlbnQucmF3cy5pbXBvcnRhbnQgPSBtYXRjaFsyXSArIHBhcmVudC5yYXdzLmltcG9ydGFudFxuICAgICAgICAgICAgICBwYXJlbnQudmFsdWUgPSBtYXRjaFsxXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FzZSAncGFyZW50aGVzZXMnOiB7XG4gICAgICAgICAgICBwYXJlbnQudmFsdWUgKz0gY29udGVudE5vZGUuY29udGVudC5qb2luKCcnKSArICcpJ1xuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FzZSAncGVyY2VudGFnZSc6IHtcbiAgICAgICAgICAgIHBhcmVudC52YWx1ZSArPSBjb250ZW50Tm9kZS5jb250ZW50LmpvaW4oJycpICsgJyUnXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICBpZiAoY29udGVudE5vZGUuY29udGVudC5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpIHtcbiAgICAgICAgICAgICAgcGFyZW50LnZhbHVlICs9IGNvbnRlbnROb2RlLmNvbnRlbnQuam9pbignJylcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBhcmVudC52YWx1ZSArPSBjb250ZW50Tm9kZS5jb250ZW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIHNpbmdsZWxpbmVDb21tZW50IChub2RlLCBwYXJlbnQpIHtcbiAgICByZXR1cm4gdGhpcy5jb21tZW50KG5vZGUsIHBhcmVudCwgdHJ1ZSlcbiAgfVxuXG4gIG11bHRpbGluZUNvbW1lbnQgKG5vZGUsIHBhcmVudCkge1xuICAgIHJldHVybiB0aGlzLmNvbW1lbnQobm9kZSwgcGFyZW50LCBmYWxzZSlcbiAgfVxuXG4gIGNvbW1lbnQgKG5vZGUsIHBhcmVudCwgaW5saW5lKSB7XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL25vZGVzZWN1cml0eS9lc2xpbnQtcGx1Z2luLXNlY3VyaXR5I2RldGVjdC11bnNhZmUtcmVnZXhcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgc2VjdXJpdHkvZGV0ZWN0LXVuc2FmZS1yZWdleFxuICAgIGxldCB0ZXh0ID0gbm9kZS5jb250ZW50Lm1hdGNoKC9eKFxccyopKCg/OlxcU1tcXFNcXHNdKj8pPykoXFxzKikkLylcblxuICAgIHRoaXMucmF3cy5jb21tZW50ID0gdHJ1ZVxuXG4gICAgbGV0IGNvbW1lbnQgPSBPYmplY3QuYXNzaWduKHBvc3Rjc3MuY29tbWVudCgpLCB7XG4gICAgICB0ZXh0OiB0ZXh0WzJdLFxuICAgICAgcmF3czoge1xuICAgICAgICBiZWZvcmU6IHRoaXMucmF3cy5iZWZvcmUgfHwgREVGQVVMVF9DT01NRU5UX0RFQ0wuYmVmb3JlLFxuICAgICAgICBsZWZ0OiB0ZXh0WzFdLFxuICAgICAgICByaWdodDogdGV4dFszXSxcbiAgICAgICAgaW5saW5lXG4gICAgICB9LFxuICAgICAgc291cmNlOiB7XG4gICAgICAgIHN0YXJ0OiB7XG4gICAgICAgICAgbGluZTogbm9kZS5zdGFydC5saW5lLFxuICAgICAgICAgIGNvbHVtbjogbm9kZS5zdGFydC5jb2x1bW5cbiAgICAgICAgfSxcbiAgICAgICAgZW5kOiBub2RlLmVuZCxcbiAgICAgICAgaW5wdXQ6IHRoaXMuaW5wdXRcbiAgICAgIH0sXG4gICAgICBwYXJlbnRcbiAgICB9KVxuXG4gICAgaWYgKHRoaXMucmF3cy5iZWZvcmVNdWx0aSkge1xuICAgICAgY29tbWVudC5yYXdzLmJlZm9yZSArPSB0aGlzLnJhd3MuYmVmb3JlTXVsdGlcbiAgICAgIHRoaXMucmF3cy5iZWZvcmVNdWx0aSA9IHVuZGVmaW5lZFxuICAgIH1cblxuICAgIHBhcmVudC5ub2Rlcy5wdXNoKGNvbW1lbnQpXG4gICAgdGhpcy5yYXdzLmJlZm9yZSA9ICcnXG4gIH1cblxuICBzcGFjZSAobm9kZSwgcGFyZW50KSB7XG4gICAgLy8gU3BhY2VzIGJlZm9yZSByb290IGFuZCBydWxlXG4gICAgc3dpdGNoIChwYXJlbnQudHlwZSkge1xuICAgICAgY2FzZSAncm9vdCc6IHtcbiAgICAgICAgdGhpcy5yYXdzLmJlZm9yZSArPSBub2RlLmNvbnRlbnRcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICAgIGNhc2UgJ3J1bGUnOiB7XG4gICAgICAgIGlmICh0aGlzLnJhd3MuY29tbWVudCkge1xuICAgICAgICAgIHRoaXMucmF3cy5iZWZvcmUgKz0gbm9kZS5jb250ZW50XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5yYXdzLmxvb3ApIHtcbiAgICAgICAgICBwYXJlbnQuc2VsZWN0b3IgKz0gbm9kZS5jb250ZW50XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5yYXdzLmJlZm9yZSA9ICh0aGlzLnJhd3MuYmVmb3JlIHx8ICdcXG4nKSArIG5vZGUuY29udGVudFxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgIH1cbiAgfVxuXG4gIGRlY2xhcmF0aW9uRGVsaW1pdGVyIChub2RlKSB7XG4gICAgdGhpcy5yYXdzLmJlZm9yZSArPSBub2RlLmNvbnRlbnRcbiAgfVxuXG4gIGxvb3AgKG5vZGUsIHBhcmVudCkge1xuICAgIGxldCBsb29wID0gcG9zdGNzcy5ydWxlKClcbiAgICB0aGlzLnJhd3MuY29tbWVudCA9IGZhbHNlXG4gICAgdGhpcy5yYXdzLm11bHRpUnVsZSA9IGZhbHNlXG4gICAgdGhpcy5yYXdzLmxvb3AgPSB0cnVlXG4gICAgbG9vcC5zZWxlY3RvciA9ICcnXG4gICAgbG9vcC5yYXdzID0ge1xuICAgICAgYmVmb3JlOiB0aGlzLnJhd3MuYmVmb3JlIHx8IERFRkFVTFRfUkFXU19SVUxFLmJlZm9yZSxcbiAgICAgIGJldHdlZW46IERFRkFVTFRfUkFXU19SVUxFLmJldHdlZW5cbiAgICB9XG4gICAgaWYgKHRoaXMucmF3cy5iZWZvcmVNdWx0aSkge1xuICAgICAgbG9vcC5yYXdzLmJlZm9yZSArPSB0aGlzLnJhd3MuYmVmb3JlTXVsdGlcbiAgICAgIHRoaXMucmF3cy5iZWZvcmVNdWx0aSA9IHVuZGVmaW5lZFxuICAgIH1cbiAgICBub2RlLmNvbnRlbnQuZm9yRWFjaCgoY29udGVudE5vZGUsIGkpID0+IHtcbiAgICAgIGlmIChub2RlLmNvbnRlbnRbaSArIDFdICYmIG5vZGUuY29udGVudFtpICsgMV0udHlwZSA9PT0gJ2Jsb2NrJykge1xuICAgICAgICB0aGlzLnJhd3MubG9vcCA9IGZhbHNlXG4gICAgICB9XG4gICAgICB0aGlzLnByb2Nlc3MoY29udGVudE5vZGUsIGxvb3ApXG4gICAgfSlcbiAgICBwYXJlbnQubm9kZXMucHVzaChsb29wKVxuICAgIHRoaXMucmF3cy5sb29wID0gZmFsc2VcbiAgfVxuXG4gIGF0cnVsZSAobm9kZSwgcGFyZW50KSB7XG4gICAgLy8gU2tpcCB1bnN1cHBvcnRlZCBAeHh4IHJ1bGVzXG4gICAgbGV0IHN1cHBvcnRlZE5vZGUgPSBub2RlLmNvbnRlbnRbMF0uY29udGVudC5zb21lKGNvbnRlbnROb2RlID0+IFNVUFBPUlRFRF9BVF9LRVlXT1JEUy5pbmNsdWRlcyhjb250ZW50Tm9kZS5jb250ZW50KSlcbiAgICBpZiAoIXN1cHBvcnRlZE5vZGUpIHJldHVyblxuXG4gICAgbGV0IGF0cnVsZSA9IHBvc3Rjc3MucnVsZSgpXG4gICAgYXRydWxlLnNlbGVjdG9yID0gJydcbiAgICBhdHJ1bGUucmF3cyA9IHtcbiAgICAgIGJlZm9yZTogdGhpcy5yYXdzLmJlZm9yZSB8fCBERUZBVUxUX1JBV1NfUlVMRS5iZWZvcmUsXG4gICAgICBiZXR3ZWVuOiBERUZBVUxUX1JBV1NfUlVMRS5iZXR3ZWVuXG4gICAgfVxuICAgIG5vZGUuY29udGVudC5mb3JFYWNoKChjb250ZW50Tm9kZSwgaSkgPT4ge1xuICAgICAgaWYgKGNvbnRlbnROb2RlLnR5cGUgPT09ICdzcGFjZScpIHtcbiAgICAgICAgbGV0IHByZXZOb2RlVHlwZSA9IG5vZGUuY29udGVudFtpIC0gMV0udHlwZVxuICAgICAgICBzd2l0Y2ggKHByZXZOb2RlVHlwZSkge1xuICAgICAgICAgIGNhc2UgJ2F0a2V5d29yZCc6XG4gICAgICAgICAgY2FzZSAnaWRlbnQnOlxuICAgICAgICAgICAgYXRydWxlLnNlbGVjdG9yICs9IGNvbnRlbnROb2RlLmNvbnRlbnRcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgfVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHRoaXMucHJvY2Vzcyhjb250ZW50Tm9kZSwgYXRydWxlKVxuICAgIH0pXG4gICAgcGFyZW50Lm5vZGVzLnB1c2goYXRydWxlKVxuICB9XG5cbiAgcGFyZW50aGVzZXMgKG5vZGUsIHBhcmVudCkge1xuICAgIHBhcmVudC5zZWxlY3RvciArPSAnKCdcbiAgICBub2RlLmNvbnRlbnQuZm9yRWFjaChjb250ZW50Tm9kZSA9PiB7XG4gICAgICBpZiAodHlwZW9mIGNvbnRlbnROb2RlLmNvbnRlbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHBhcmVudC5zZWxlY3RvciArPSBjb250ZW50Tm9kZS5jb250ZW50XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgY29udGVudE5vZGUuY29udGVudCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgY29udGVudE5vZGUuY29udGVudC5mb3JFYWNoKGNoaWxkcmVuQ29udGVudE5vZGUgPT4ge1xuICAgICAgICAgIGlmIChjb250ZW50Tm9kZS50eXBlID09PSAndmFyaWFibGUnKSBwYXJlbnQuc2VsZWN0b3IgKz0gJyQnXG4gICAgICAgICAgcGFyZW50LnNlbGVjdG9yICs9IGNoaWxkcmVuQ29udGVudE5vZGUuY29udGVudFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0pXG4gICAgcGFyZW50LnNlbGVjdG9yICs9ICcpJ1xuICB9XG5cbiAgaW50ZXJwb2xhdGlvbiAobm9kZSwgcGFyZW50KSB7XG4gICAgcGFyZW50LnNlbGVjdG9yICs9ICcjeydcbiAgICBub2RlLmNvbnRlbnQuZm9yRWFjaChjb250ZW50Tm9kZSA9PiB7XG4gICAgICB0aGlzLnByb2Nlc3MoY29udGVudE5vZGUsIHBhcmVudClcbiAgICB9KVxuICAgIHBhcmVudC5zZWxlY3RvciArPSAnfSdcbiAgfVxuXG4gIGF0a2V5d29yZCAobm9kZSwgcGFyZW50KSB7XG4gICAgcGFyZW50LnNlbGVjdG9yICs9IGBAJHsgbm9kZS5jb250ZW50IH1gXG4gIH1cblxuICBvcGVyYXRvciAobm9kZSwgcGFyZW50KSB7XG4gICAgcGFyZW50LnNlbGVjdG9yICs9IG5vZGUuY29udGVudFxuICB9XG5cbiAgdmFyaWFibGUgKG5vZGUsIHBhcmVudCkge1xuICAgIGlmICh0aGlzLnJhd3MubG9vcCkge1xuICAgICAgcGFyZW50LnNlbGVjdG9yICs9IGAkJHsgbm9kZS5jb250ZW50WzBdLmNvbnRlbnQgfWBcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBwYXJlbnQuc2VsZWN0b3IgKz0gYCQkeyBub2RlLmNvbnRlbnQgfWBcbiAgfVxuXG4gIGlkZW50IChub2RlLCBwYXJlbnQpIHtcbiAgICBwYXJlbnQuc2VsZWN0b3IgKz0gbm9kZS5jb250ZW50XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTYXNzUGFyc2VyXG4iXX0=