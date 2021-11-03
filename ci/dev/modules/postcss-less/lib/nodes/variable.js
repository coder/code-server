/* eslint no-param-reassign: off */

const afterPattern = /:$/;
const beforePattern = /^:(\s+)?/;
// const bracketsPattern = /\{/;

module.exports = (node) => {
  const { name, params = '' } = node;

  // situations like @page :last { color: red } should default to the built-in AtRule
  // LESS variables are @name : value; < note that for them to be valid LESS vars, they must end in
  // a semicolon.

  if (node.name.slice(-1) !== ':') {
    return;
  }

  if (afterPattern.test(name)) {
    const [match] = name.match(afterPattern);

    node.name = name.replace(match, '');
    node.raws.afterName = match + (node.raws.afterName || '');
    node.variable = true;
    node.value = node.params;
  }

  if (beforePattern.test(params)) {
    const [match] = params.match(beforePattern);

    node.value = params.replace(match, '');
    node.raws.afterName = (node.raws.afterName || '') + match;
    node.variable = true;
  }
};
