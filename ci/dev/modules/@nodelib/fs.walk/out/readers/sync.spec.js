"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const path = require("path");
const sinon = require("sinon");
const settings_1 = require("../settings");
const tests = require("../tests");
const sync_1 = require("./sync");
class TestReader extends sync_1.default {
    constructor(_root, _settings = new settings_1.default()) {
        super(_root, _settings);
        this._scandir = sinon.stub();
    }
    get scandir() {
        return this._scandir;
    }
}
describe('Readers → Sync', () => {
    describe('.read', () => {
        it('should throw an error when the first call of scandir is broken', () => {
            const reader = new TestReader('non-exist-directory');
            reader.scandir.throws(tests.EPERM_ERRNO);
            assert.throws(() => reader.read(), { code: 'EPERM' });
        });
        it('should return empty array when the first call of scandir is broken but this error can be suppressed', () => {
            const settings = new settings_1.default({
                errorFilter: (error) => error.code === 'EPERM'
            });
            const reader = new TestReader('non-exist-directory', settings);
            reader.scandir.throws(tests.EPERM_ERRNO);
            const actual = reader.read();
            assert.deepStrictEqual(actual, []);
        });
        it('should return entries', () => {
            const reader = new TestReader('directory');
            const fakeDirectoryEntry = tests.buildFakeDirectoryEntry();
            const fakeFileEntry = tests.buildFakeFileEntry();
            reader.scandir.onFirstCall().returns([fakeDirectoryEntry]);
            reader.scandir.onSecondCall().returns([fakeFileEntry]);
            const expected = [fakeDirectoryEntry, fakeFileEntry];
            const actual = reader.read();
            assert.deepStrictEqual(actual, expected);
        });
        it('should push to results only directories', () => {
            const settings = new settings_1.default({ entryFilter: (entry) => !entry.dirent.isFile() });
            const reader = new TestReader('directory', settings);
            const fakeDirectoryEntry = tests.buildFakeDirectoryEntry();
            const fakeFileEntry = tests.buildFakeFileEntry();
            reader.scandir.onFirstCall().returns([fakeDirectoryEntry]);
            reader.scandir.onSecondCall().returns([fakeFileEntry]);
            const expected = [fakeDirectoryEntry];
            const actual = reader.read();
            assert.deepStrictEqual(actual, expected);
        });
        it('should do not read root directory', () => {
            const settings = new settings_1.default({ deepFilter: () => false });
            const reader = new TestReader('directory', settings);
            const fakeDirectoryEntry = tests.buildFakeDirectoryEntry();
            const fakeFileEntry = tests.buildFakeFileEntry();
            reader.scandir.onFirstCall().returns([fakeDirectoryEntry]);
            reader.scandir.onSecondCall().returns([fakeFileEntry]);
            const expected = [fakeDirectoryEntry];
            const actual = reader.read();
            assert.deepStrictEqual(actual, expected);
        });
        it('should set base path to entry when the `basePath` option is exist', () => {
            const settings = new settings_1.default({ basePath: 'base' });
            const reader = new TestReader('directory', settings);
            const fakeDirectoryEntry = tests.buildFakeDirectoryEntry();
            const fakeFileEntry = tests.buildFakeFileEntry();
            reader.scandir.onFirstCall().returns([fakeDirectoryEntry]);
            reader.scandir.onSecondCall().returns([fakeFileEntry]);
            const actual = reader.read();
            assert.strictEqual(actual[0].path, path.join('base', fakeDirectoryEntry.name));
            assert.strictEqual(actual[1].path, path.join('base', 'fake', fakeFileEntry.name));
        });
        it('should set base path to entry when the `basePath` option is exist and value is an empty string', () => {
            const settings = new settings_1.default({ basePath: '' });
            const reader = new TestReader('directory', settings);
            const fakeDirectoryEntry = tests.buildFakeDirectoryEntry();
            const fakeFileEntry = tests.buildFakeFileEntry();
            reader.scandir.onFirstCall().returns([fakeDirectoryEntry]);
            reader.scandir.onSecondCall().returns([fakeFileEntry]);
            const actual = reader.read();
            assert.strictEqual(actual[0].path, fakeDirectoryEntry.name);
            assert.strictEqual(actual[1].path, path.join('fake', fakeFileEntry.name));
        });
    });
});
