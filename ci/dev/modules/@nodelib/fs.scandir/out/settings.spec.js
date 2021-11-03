"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const path = require("path");
const fs_macchiato_1 = require("../../fs.macchiato");
const fs = require("./adapters/fs");
const settings_1 = require("./settings");
describe('Settings', () => {
    it('should return instance with default values', () => {
        const settings = new settings_1.default();
        assert.deepStrictEqual(settings.fs, fs.createFileSystemAdapter());
        assert.ok(!settings.followSymbolicLinks);
        assert.ok(!settings.stats);
        assert.strictEqual(settings.pathSegmentSeparator, path.sep);
        assert.ok(settings.fsStatSettings);
        assert.ok(settings.throwErrorOnBrokenSymbolicLink);
    });
    it('should return instance with custom values', () => {
        const lstatSync = () => new fs_macchiato_1.Stats();
        const settings = new settings_1.default({
            fs: fs.createFileSystemAdapter({ lstatSync }),
            stats: true
        });
        assert.deepStrictEqual(settings.fs, fs.createFileSystemAdapter({ lstatSync }));
        assert.ok(settings.stats);
    });
});
