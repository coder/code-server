"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const path = require("path");
const settings_1 = require("../settings");
const reader_1 = require("./reader");
class TestReader extends reader_1.default {
    get root() {
        return this._root;
    }
}
function getReader(root, options = {}) {
    return new TestReader(root, new settings_1.default(options));
}
describe('Readers → Reader', () => {
    describe('Constructor', () => {
        it('should return root path with replaced path segment separators', () => {
            const root = path.join('directory', 'file.txt');
            const reader = getReader(root, { pathSegmentSeparator: '_' });
            const expected = 'directory_file.txt';
            const actual = reader.root;
            assert.strictEqual(actual, expected);
        });
    });
});
