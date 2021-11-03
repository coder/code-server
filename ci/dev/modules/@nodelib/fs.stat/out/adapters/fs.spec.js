"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const fs_macchiato_1 = require("../../../fs.macchiato");
const adapter = require("./fs");
describe('Adapters → FileSystem', () => {
    it('should return original FS methods', () => {
        const expected = adapter.FILE_SYSTEM_ADAPTER;
        const actual = adapter.createFileSystemAdapter();
        assert.deepStrictEqual(actual, expected);
    });
    it('should return custom FS methods', () => {
        const customLstatSyncMethod = () => new fs_macchiato_1.Stats();
        const expected = Object.assign(Object.assign({}, adapter.FILE_SYSTEM_ADAPTER), { lstatSync: customLstatSyncMethod });
        const actual = adapter.createFileSystemAdapter({
            lstatSync: customLstatSyncMethod
        });
        assert.deepStrictEqual(actual, expected);
    });
});
