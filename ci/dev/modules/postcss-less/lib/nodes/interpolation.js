/* eslint no-param-reassign: off */

module.exports = {
  interpolation(token) {
    let first = token;
    const tokens = [token];
    const validTypes = ['word', '{', '}'];

    token = this.tokenizer.nextToken();

    // look for @{ but not @[word]{
    if (first[1].length > 1 || token[0] !== '{') {
      this.tokenizer.back(token);
      return false;
    }

    while (token && validTypes.includes(token[0])) {
      tokens.push(token);
      token = this.tokenizer.nextToken();
    }

    const words = tokens.map((tokn) => tokn[1]);
    [first] = tokens;
    const last = tokens.pop();
    const start = [first[2], first[3]];
    const end = [last[4] || last[2], last[5] || last[3]];
    const newToken = ['word', words.join('')].concat(start, end);

    this.tokenizer.back(token);
    this.tokenizer.back(newToken);

    return true;
  }
};
