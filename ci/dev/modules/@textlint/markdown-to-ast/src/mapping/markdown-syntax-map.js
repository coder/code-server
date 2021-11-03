// LICENSE : MIT
"use strict";
const { ASTNodeTypes } = require("@textlint/ast-node-types");
const exports = {
    root: ASTNodeTypes.Document,
    paragraph: ASTNodeTypes.Paragraph,
    blockquote: ASTNodeTypes.BlockQuote,
    listItem: ASTNodeTypes.ListItem,
    list: ASTNodeTypes.List,
    Bullet: "Bullet", // no need?
    heading: ASTNodeTypes.Header,
    code: ASTNodeTypes.CodeBlock,
    HtmlBlock: ASTNodeTypes.HtmlBlock,
    ReferenceDef: ASTNodeTypes.ReferenceDef,
    thematicBreak: ASTNodeTypes.HorizontalRule,
    // inline block
    text: ASTNodeTypes.Str,
    break: ASTNodeTypes.Break,
    emphasis: ASTNodeTypes.Emphasis,
    strong: ASTNodeTypes.Strong,
    html: ASTNodeTypes.Html,
    link: ASTNodeTypes.Link,
    image: ASTNodeTypes.Image,
    inlineCode: ASTNodeTypes.Code,
    delete: ASTNodeTypes.Delete,
    // remark(markdown) extension
    // Following type is not in @textlint/ast-node-types
    yaml: "Yaml",
    table: "Table",
    tableRow: "TableRow",
    tableCell: "TableCell",
    linkReference: "LinkReference",
    imageReference: "imageReference",
    definition: "Definition"
};
module.exports = exports;
