const Stringifier = require('postcss/lib/stringifier');

module.exports = class LessStringifier extends Stringifier {
  atrule(node, semicolon) {
    if (!node.mixin && !node.variable && !node.function) {
      super.atrule(node, semicolon);
      return;
    }

    const identifier = node.function ? '' : node.raws.identifier || '@';
    let name = `${identifier}${node.name}`;
    let params = node.params ? this.rawValue(node, 'params') : '';
    const important = node.raws.important || '';

    if (node.variable) {
      params = node.value;
    }

    if (typeof node.raws.afterName !== 'undefined') {
      name += node.raws.afterName;
    } else if (params) {
      name += ' ';
    }

    if (node.nodes) {
      this.block(node, name + params + important);
    } else {
      const end = (node.raws.between || '') + important + (semicolon ? ';' : '');
      this.builder(name + params + end, node);
    }
  }

  comment(node) {
    if (node.inline) {
      const left = this.raw(node, 'left', 'commentLeft');
      const right = this.raw(node, 'right', 'commentRight');
      this.builder(`//${left}${node.text}${right}`, node);
    } else {
      super.comment(node);
    }
  }
};
