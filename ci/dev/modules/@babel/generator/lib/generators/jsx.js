"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.JSXAttribute = JSXAttribute;
exports.JSXIdentifier = JSXIdentifier;
exports.JSXNamespacedName = JSXNamespacedName;
exports.JSXMemberExpression = JSXMemberExpression;
exports.JSXSpreadAttribute = JSXSpreadAttribute;
exports.JSXExpressionContainer = JSXExpressionContainer;
exports.JSXSpreadChild = JSXSpreadChild;
exports.JSXText = JSXText;
exports.JSXElement = JSXElement;
exports.JSXOpeningElement = JSXOpeningElement;
exports.JSXClosingElement = JSXClosingElement;
exports.JSXEmptyExpression = JSXEmptyExpression;
exports.JSXFragment = JSXFragment;
exports.JSXOpeningFragment = JSXOpeningFragment;
exports.JSXClosingFragment = JSXClosingFragment;

var t = _interopRequireWildcard(require("@babel/types"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function JSXAttribute(node) {
  this.print(node.name, node);

  if (node.value) {
    this.token("=");
    this.print(node.value, node);
  }
}

function JSXIdentifier(node) {
  this.word(node.name);
}

function JSXNamespacedName(node) {
  this.print(node.namespace, node);
  this.token(":");
  this.print(node.name, node);
}

function JSXMemberExpression(node) {
  this.print(node.object, node);
  this.token(".");
  this.print(node.property, node);
}

function JSXSpreadAttribute(node) {
  this.token("{");
  this.token("...");
  this.print(node.argument, node);
  this.token("}");
}

function JSXExpressionContainer(node) {
  this.token("{");
  this.print(node.expression, node);
  this.token("}");
}

function JSXSpreadChild(node) {
  this.token("{");
  this.token("...");
  this.print(node.expression, node);
  this.token("}");
}

function JSXText(node) {
  const raw = this.getPossibleRaw(node);

  if (raw != null) {
    this.token(raw);
  } else {
    this.token(node.value);
  }
}

function JSXElement(node) {
  const open = node.openingElement;
  this.print(open, node);
  if (open.selfClosing) return;
  this.indent();

  for (const child of node.children) {
    this.print(child, node);
  }

  this.dedent();
  this.print(node.closingElement, node);
}

function spaceSeparator() {
  this.space();
}

function JSXOpeningElement(node) {
  this.token("<");
  this.print(node.name, node);
  this.print(node.typeParameters, node);

  if (node.attributes.length > 0) {
    this.space();
    this.printJoin(node.attributes, node, {
      separator: spaceSeparator
    });
  }

  if (node.selfClosing) {
    this.space();
    this.token("/>");
  } else {
    this.token(">");
  }
}

function JSXClosingElement(node) {
  this.token("</");
  this.print(node.name, node);
  this.token(">");
}

function JSXEmptyExpression(node) {
  this.printInnerComments(node);
}

function JSXFragment(node) {
  this.print(node.openingFragment, node);
  this.indent();

  for (const child of node.children) {
    this.print(child, node);
  }

  this.dedent();
  this.print(node.closingFragment, node);
}

function JSXOpeningFragment() {
  this.token("<");
  this.token(">");
}

function JSXClosingFragment() {
  this.token("</");
  this.token(">");
}