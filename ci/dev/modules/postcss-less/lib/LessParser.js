/* eslint no-param-reassign: off */

const Comment = require('postcss/lib/comment');
const Parser = require('postcss/lib/parser');

const { isInlineComment } = require('./nodes/inline-comment');
const { interpolation } = require('./nodes/interpolation');
const { isMixinToken } = require('./nodes/mixin');
const importNode = require('./nodes/import');
const variableNode = require('./nodes/variable');

const importantPattern = /(!\s*important)$/i;

module.exports = class LessParser extends Parser {
  constructor(...args) {
    super(...args);

    this.lastNode = null;
  }

  atrule(token) {
    if (interpolation.bind(this)(token)) {
      return;
    }

    super.atrule(token);
    importNode(this.lastNode);
    variableNode(this.lastNode);
  }

  decl(...args) {
    super.decl(...args);

    // #123: add `extend` decorator to nodes
    const extendPattern = /extend\(.+\)/i;

    if (extendPattern.test(this.lastNode.value)) {
      this.lastNode.extend = true;
    }
  }

  each(tokens) {
    // prepend a space so the `name` will be parsed correctly
    tokens[0][1] = ` ${tokens[0][1]}`;

    const firstParenIndex = tokens.findIndex((t) => t[0] === '(');
    const lastParen = tokens.reverse().find((t) => t[0] === ')');
    const lastParenIndex = tokens.reverse().indexOf(lastParen);
    const paramTokens = tokens.splice(firstParenIndex, lastParenIndex);
    const params = paramTokens.map((t) => t[1]).join('');

    for (const token of tokens.reverse()) {
      this.tokenizer.back(token);
    }

    this.atrule(this.tokenizer.nextToken());
    this.lastNode.function = true;
    this.lastNode.params = params;
  }

  init(node, line, column) {
    super.init(node, line, column);
    this.lastNode = node;
  }

  inlineComment(token) {
    const node = new Comment();
    const text = token[1].slice(2);

    this.init(node, token[2], token[3]);

    node.source.end = { line: token[4], column: token[5] };
    node.inline = true;
    node.raws.begin = '//';

    if (/^\s*$/.test(text)) {
      node.text = '';
      node.raws.left = text;
      node.raws.right = '';
    } else {
      const match = text.match(/^(\s*)([^]*[^\s])(\s*)$/);
      [, node.raws.left, node.text, node.raws.right] = match;
    }
  }

  mixin(tokens) {
    const [first] = tokens;
    const identifier = first[1].slice(0, 1);
    const bracketsIndex = tokens.findIndex((t) => t[0] === 'brackets');
    const firstParenIndex = tokens.findIndex((t) => t[0] === '(');
    let important = '';

    // fix for #86. if rulesets are mixin params, they need to be converted to a brackets token
    if ((bracketsIndex < 0 || bracketsIndex > 3) && firstParenIndex > 0) {
      const lastParenIndex = tokens.reduce((last, t, i) => (t[0] === ')' ? i : last));

      const contents = tokens.slice(firstParenIndex, lastParenIndex + firstParenIndex);
      const brackets = contents.map((t) => t[1]).join('');
      const [paren] = tokens.slice(firstParenIndex);
      const start = [paren[2], paren[3]];
      const [last] = tokens.slice(lastParenIndex, lastParenIndex + 1);
      const end = [last[2], last[3]];
      const newToken = ['brackets', brackets].concat(start, end);

      const tokensBefore = tokens.slice(0, firstParenIndex);
      const tokensAfter = tokens.slice(lastParenIndex + 1);
      tokens = tokensBefore;
      tokens.push(newToken);
      tokens = tokens.concat(tokensAfter);
    }

    const importantTokens = [];

    for (const token of tokens) {
      if (token[1] === '!' || importantTokens.length) {
        importantTokens.push(token);
      }

      if (token[1] === 'important') {
        break;
      }
    }

    if (importantTokens.length) {
      const [bangToken] = importantTokens;
      const bangIndex = tokens.indexOf(bangToken);
      const last = importantTokens[importantTokens.length - 1];
      const start = [bangToken[2], bangToken[3]];
      const end = [last[4], last[5]];
      const combined = importantTokens.map((t) => t[1]).join('');
      const newToken = ['word', combined].concat(start, end);
      tokens.splice(bangIndex, importantTokens.length, newToken);
    }

    const importantIndex = tokens.findIndex((t) => importantPattern.test(t[1]));

    if (importantIndex > 0) {
      [, important] = tokens[importantIndex];
      tokens.splice(importantIndex, 1);
    }

    for (const token of tokens.reverse()) {
      this.tokenizer.back(token);
    }

    this.atrule(this.tokenizer.nextToken());
    this.lastNode.mixin = true;
    this.lastNode.raws.identifier = identifier;

    if (important) {
      this.lastNode.important = true;
      this.lastNode.raws.important = important;
    }
  }

  other(token) {
    if (!isInlineComment.bind(this)(token)) {
      super.other(token);
    }
  }

  rule(tokens) {
    const last = tokens[tokens.length - 1];
    const prev = tokens[tokens.length - 2];

    if (prev[0] === 'at-word' && last[0] === '{') {
      this.tokenizer.back(last);
      if (interpolation.bind(this)(prev)) {
        const newToken = this.tokenizer.nextToken();

        tokens = tokens.slice(0, tokens.length - 2).concat([newToken]);

        for (const tokn of tokens.reverse()) {
          this.tokenizer.back(tokn);
        }

        return;
      }
    }

    super.rule(tokens);

    // #123: add `extend` decorator to nodes
    const extendPattern = /:extend\(.+\)/i;

    if (extendPattern.test(this.lastNode.selector)) {
      this.lastNode.extend = true;
    }
  }

  unknownWord(tokens) {
    // NOTE: keep commented for examining unknown structures
    // console.log('unknown', tokens);

    const [first] = tokens;

    // #121 support `each` - http://lesscss.org/functions/#list-functions-each
    if (tokens[0][1] === 'each' && tokens[1][0] === '(') {
      this.each(tokens);
      return;
    }

    // TODO: move this into a util function/file
    if (isMixinToken(first)) {
      this.mixin(tokens);
      return;
    }

    super.unknownWord(tokens);
  }
};
