"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const fs_macchiato_1 = require("../../fs.macchiato");
const fs = require("./adapters/fs");
const settings_1 = require("./settings");
describe('Settings', () => {
    it('should return instance with default values', () => {
        const settings = new settings_1.default();
        assert.deepStrictEqual(settings.fs, fs.createFileSystemAdapter());
        assert.ok(settings.throwErrorOnBrokenSymbolicLink);
        assert.ok(!settings.markSymbolicLink);
        assert.ok(settings.followSymbolicLink);
    });
    it('should return instance with custom values', () => {
        const lstatSync = () => new fs_macchiato_1.Stats();
        const settings = new settings_1.default({
            followSymbolicLink: false,
            fs: fs.createFileSystemAdapter({ lstatSync }),
            throwErrorOnBrokenSymbolicLink: false
        });
        assert.deepStrictEqual(settings.fs, fs.createFileSystemAdapter({ lstatSync }));
        assert.ok(!settings.throwErrorOnBrokenSymbolicLink);
        assert.ok(!settings.followSymbolicLink);
    });
});
