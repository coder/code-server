/* eslint no-param-reassign: off */

const tokenize = require('postcss/lib/tokenize');

const urlPattern = /^url\((.+)\)/;

module.exports = (node) => {
  const { name, params = '' } = node;

  if (name === 'import' && params.length) {
    node.import = true;

    const tokenizer = tokenize({ css: params });

    node.filename = params.replace(urlPattern, '$1');

    while (!tokenizer.endOfFile()) {
      const [type, content] = tokenizer.nextToken();

      if (type === 'word' && content === 'url') {
        return;
      } else if (type === 'brackets') {
        node.options = content;
        node.filename = params.replace(content, '').trim();
        break;
      }
    }
  }
};
