exports = module.exports = trim;

function trim(str){
  if (str.trim) return str.trim();
  return exports.right(exports.left(str));
}

exports.left = function(str){
  if (str.trimLeft) return str.trimLeft();

  return str.replace(/^\s\s*/, '');
};

exports.right = function(str){
  if (str.trimRight) return str.trimRight();

  var whitespace_pattern = /\s/,
      i = str.length;
  while (whitespace_pattern.test(str.charAt(--i)));

  return str.slice(0, i + 1);
};
