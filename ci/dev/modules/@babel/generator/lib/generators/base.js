"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.File = File;
exports.Program = Program;
exports.BlockStatement = BlockStatement;
exports.Directive = Directive;
exports.DirectiveLiteral = DirectiveLiteral;
exports.InterpreterDirective = InterpreterDirective;
exports.Placeholder = Placeholder;

var t = _interopRequireWildcard(require("@babel/types"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function File(node) {
  if (node.program) {
    this.print(node.program.interpreter, node);
  }

  this.print(node.program, node);
}

function Program(node) {
  this.printInnerComments(node, false);
  this.printSequence(node.directives, node);
  if (node.directives && node.directives.length) this.newline();
  this.printSequence(node.body, node);
}

function BlockStatement(node) {
  var _node$directives;

  this.token("{");
  this.printInnerComments(node);
  const hasDirectives = (_node$directives = node.directives) == null ? void 0 : _node$directives.length;

  if (node.body.length || hasDirectives) {
    this.newline();
    this.printSequence(node.directives, node, {
      indent: true
    });
    if (hasDirectives) this.newline();
    this.printSequence(node.body, node, {
      indent: true
    });
    this.removeTrailingNewline();
    this.source("end", node.loc);
    if (!this.endsWith("\n")) this.newline();
    this.rightBrace();
  } else {
    this.source("end", node.loc);
    this.token("}");
  }
}

function Directive(node) {
  this.print(node.value, node);
  this.semicolon();
}

const unescapedSingleQuoteRE = /(?:^|[^\\])(?:\\\\)*'/;
const unescapedDoubleQuoteRE = /(?:^|[^\\])(?:\\\\)*"/;

function DirectiveLiteral(node) {
  const raw = this.getPossibleRaw(node);

  if (raw != null) {
    this.token(raw);
    return;
  }

  const {
    value
  } = node;

  if (!unescapedDoubleQuoteRE.test(value)) {
    this.token(`"${value}"`);
  } else if (!unescapedSingleQuoteRE.test(value)) {
    this.token(`'${value}'`);
  } else {
    throw new Error("Malformed AST: it is not possible to print a directive containing" + " both unescaped single and double quotes.");
  }
}

function InterpreterDirective(node) {
  this.token(`#!${node.value}\n`);
}

function Placeholder(node) {
  this.token("%%");
  this.print(node.name);
  this.token("%%");

  if (node.expectedNode === "Statement") {
    this.semicolon();
  }
}