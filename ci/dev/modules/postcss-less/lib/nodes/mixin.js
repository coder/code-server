const hashColorPattern = /^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/;
const unpaddedFractionalNumbersPattern = /\.[0-9]/;

const isMixinToken = (token) => {
  const [, symbol] = token;
  const [char] = symbol;

  return (
    (char === '.' || char === '#') &&
    // ignore hashes used for colors
    hashColorPattern.test(symbol) === false &&
    // ignore dots used for unpadded fractional numbers
    unpaddedFractionalNumbersPattern.test(symbol) === false
  );
};

module.exports = { isMixinToken };
