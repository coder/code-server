"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const fsScandir = require("@nodelib/fs.scandir");
const settings_1 = require("./settings");
describe('Settings', () => {
    it('should return instance with default values', () => {
        const fsWalkSettings = new settings_1.default();
        const fsScandirSettings = new fsScandir.Settings({
            followSymbolicLinks: undefined,
            fs: undefined,
            pathSegmentSeparator: undefined,
            stats: undefined,
            throwErrorOnBrokenSymbolicLink: undefined
        });
        assert.strictEqual(fsWalkSettings.basePath, undefined);
        assert.strictEqual(fsWalkSettings.concurrency, Infinity);
        assert.strictEqual(fsWalkSettings.deepFilter, null);
        assert.strictEqual(fsWalkSettings.entryFilter, null);
        assert.strictEqual(fsWalkSettings.errorFilter, null);
        assert.deepStrictEqual(fsWalkSettings.fsScandirSettings, fsScandirSettings);
    });
    it('should return instance with custom values', () => {
        const filter = () => true;
        const fsWalkSettings = new settings_1.default({ entryFilter: filter });
        assert.strictEqual(fsWalkSettings.entryFilter, filter);
    });
});
