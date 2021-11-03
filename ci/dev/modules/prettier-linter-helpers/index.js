const diff = require('fast-diff');

const LINE_ENDING_RE = /\r\n|[\r\n\u2028\u2029]/;

/**
 * Converts invisible characters to a commonly recognizable visible form.
 * @param {string} str - The string with invisibles to convert.
 * @returns {string} The converted string.
 */
function showInvisibles(str) {
  let ret = '';
  for (let i = 0; i < str.length; i++) {
    switch (str[i]) {
      case ' ':
        ret += '·'; // Middle Dot, \u00B7
        break;
      case '\n':
        ret += '⏎'; // Return Symbol, \u23ce
        break;
      case '\t':
        ret += '↹'; // Left Arrow To Bar Over Right Arrow To Bar, \u21b9
        break;
      case '\r':
        ret += '␍'; // Carriage Return Symbol, \u240D
        break;
      default:
        ret += str[i];
        break;
    }
  }
  return ret;
}

/**
 * Generate results for differences between source code and formatted version.
 *
 * @param {string} source - The original source.
 * @param {string} prettierSource - The Prettier formatted source.
 * @returns {Array} - An array containing { operation, offset, insertText, deleteText }
 */
function generateDifferences(source, prettierSource) {
  // fast-diff returns the differences between two texts as a series of
  // INSERT, DELETE or EQUAL operations. The results occur only in these
  // sequences:
  //           /-> INSERT -> EQUAL
  //    EQUAL |           /-> EQUAL
  //           \-> DELETE |
  //                      \-> INSERT -> EQUAL
  // Instead of reporting issues at each INSERT or DELETE, certain sequences
  // are batched together and are reported as a friendlier "replace" operation:
  // - A DELETE immediately followed by an INSERT.
  // - Any number of INSERTs and DELETEs where the joining EQUAL of one's end
  // and another's beginning does not have line endings (i.e. issues that occur
  // on contiguous lines).

  const results = diff(source, prettierSource);
  const differences = [];

  const batch = [];
  let offset = 0; // NOTE: INSERT never advances the offset.
  while (results.length) {
    const result = results.shift();
    const op = result[0];
    const text = result[1];
    switch (op) {
      case diff.INSERT:
      case diff.DELETE:
        batch.push(result);
        break;
      case diff.EQUAL:
        if (results.length) {
          if (batch.length) {
            if (LINE_ENDING_RE.test(text)) {
              flush();
              offset += text.length;
            } else {
              batch.push(result);
            }
          } else {
            offset += text.length;
          }
        }
        break;
      default:
        throw new Error(`Unexpected fast-diff operation "${op}"`);
    }
    if (batch.length && !results.length) {
      flush();
    }
  }

  return differences;

  function flush() {
    let aheadDeleteText = '';
    let aheadInsertText = '';
    while (batch.length) {
      const next = batch.shift();
      const op = next[0];
      const text = next[1];
      switch (op) {
        case diff.INSERT:
          aheadInsertText += text;
          break;
        case diff.DELETE:
          aheadDeleteText += text;
          break;
        case diff.EQUAL:
          aheadDeleteText += text;
          aheadInsertText += text;
          break;
      }
    }
    if (aheadDeleteText && aheadInsertText) {
      differences.push({
        offset,
        operation: generateDifferences.REPLACE,
        insertText: aheadInsertText,
        deleteText: aheadDeleteText,
      });
    } else if (!aheadDeleteText && aheadInsertText) {
      differences.push({
        offset,
        operation: generateDifferences.INSERT,
        insertText: aheadInsertText,
      });
    } else if (aheadDeleteText && !aheadInsertText) {
      differences.push({
        offset,
        operation: generateDifferences.DELETE,
        deleteText: aheadDeleteText,
      });
    }
    offset += aheadDeleteText.length;
  }
}

generateDifferences.INSERT = 'insert';
generateDifferences.DELETE = 'delete';
generateDifferences.REPLACE = 'replace';

module.exports = {
  showInvisibles,
  generateDifferences,
};
