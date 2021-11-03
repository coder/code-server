"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const common = require("./common");
describe('Readers → Common', () => {
    describe('.joinPathSegments', () => {
        it('should return concatenated string', () => {
            assert.strictEqual(common.joinPathSegments('.', 'a', '/'), './a');
        });
        it('should return correct string when the first segment ens with the separator symbol', () => {
            // Unix
            assert.strictEqual(common.joinPathSegments('/', 'a', '/'), '/a');
            assert.strictEqual(common.joinPathSegments('//', 'a', '/'), '//a');
            assert.strictEqual(common.joinPathSegments('/a/', 'b', '/'), '/a/b');
            // Windows
            assert.strictEqual(common.joinPathSegments('C:/', 'Users', '/'), 'C:/Users');
            assert.strictEqual(common.joinPathSegments('C:\\', 'Users', '\\'), 'C:\\Users');
            assert.strictEqual(common.joinPathSegments('//?/C:/', 'Users', '/'), '//?/C:/Users');
            assert.strictEqual(common.joinPathSegments('\\\\?\\C:\\', 'Users', '\\'), '\\\\?\\C:\\Users');
        });
    });
});
