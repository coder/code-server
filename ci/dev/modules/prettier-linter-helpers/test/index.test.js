const {showInvisibles, generateDifferences} = require('..');
const assert = require('assert');

describe('showInvisibles', () => {
  it('shows invisibles', () => {
    assert.strictEqual(showInvisibles('1 2\n3\t4\r5'), '1·2⏎3↹4␍5');
  });
});

describe('generateDifferences', () => {
  it('operation: insert', () => {
    const differences = generateDifferences('abc', 'abcdef');
    assert.deepStrictEqual(differences, [
      {operation: 'insert', offset: 3, insertText: 'def'},
    ]);
  });
  it('operation: delete', () => {
    const differences = generateDifferences('abcdef', 'abc');
    assert.deepStrictEqual(differences, [
      {operation: 'delete', offset: 3, deleteText: 'def'},
    ]);
  });
  it('operation: replace', () => {
    const differences = generateDifferences('abc', 'def');
    assert.deepStrictEqual(differences, [
      {operation: 'replace', offset: 0, deleteText: 'abc', insertText: 'def'},
    ]);
  });
});
