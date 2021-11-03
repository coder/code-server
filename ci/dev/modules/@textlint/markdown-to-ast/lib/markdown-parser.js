// LICENSE : MIT
"use strict";

var traverse = require("traverse");

var _require = require("@textlint/ast-node-types"),
    ASTNodeTypes = _require.ASTNodeTypes;

var StructuredSource = require("structured-source");
var debug = require("debug")("@textlint/markdown-to-ast");
var SyntaxMap = require("./mapping/markdown-syntax-map");
var unified = require("unified");
var remarkParse = require("remark-parse");
var frontmatter = require("remark-frontmatter");
var remark = unified().use(remarkParse).use(frontmatter, ["yaml"]);
/**
 * parse markdown text and return ast mapped location info.
 * @param {string} text
 * @returns {TxtNode}
 */
function parse(text) {
    var ast = remark.parse(text);
    var src = new StructuredSource(text);
    traverse(ast).forEach(function (node) {
        // eslint-disable-next-line no-invalid-this
        if (this.notLeaf) {
            if (node.type) {
                var replacedType = SyntaxMap[node.type];
                if (!replacedType) {
                    debug("replacedType : " + replacedType + " , node.type: " + node.type);
                } else {
                    node.type = replacedType;
                }
            }
            // map `range`, `loc` and `raw` to node
            if (node.position) {
                var position = node.position;
                var positionCompensated = {
                    start: { line: position.start.line, column: Math.max(position.start.column - 1, 0) },
                    end: { line: position.end.line, column: Math.max(position.end.column - 1, 0) }
                };
                var range = src.locationToRange(positionCompensated);
                node.loc = positionCompensated;
                node.range = range;
                node.raw = text.slice(range[0], range[1]);
                // Compatible for https://github.com/wooorm/unist, but hidden
                Object.defineProperty(node, "position", {
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value: position
                });
            }
        }
    });
    return ast;
}

module.exports = {
    parse: parse,
    Syntax: ASTNodeTypes
};
//# sourceMappingURL=markdown-parser.js.map