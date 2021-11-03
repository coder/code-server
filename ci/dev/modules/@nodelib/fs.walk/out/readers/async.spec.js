"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const path = require("path");
const sinon = require("sinon");
const settings_1 = require("../settings");
const tests = require("../tests");
const async_1 = require("./async");
class TestReader extends async_1.default {
    constructor(_root, _settings = new settings_1.default()) {
        super(_root, _settings);
        this._scandir = sinon.stub();
    }
    get scandir() {
        return this._scandir;
    }
}
describe('Readers → Async', () => {
    describe('.read', () => {
        it('should emit "error" event when the first call of scandir is broken', (done) => {
            const reader = new TestReader('non-exist-directory');
            reader.scandir.yields(tests.EPERM_ERRNO);
            reader.onError((error) => {
                assert.ok(error);
                done();
            });
            reader.read();
        });
        it('should emit "end" event when the first call of scandir is broken but this error can be suppressed', (done) => {
            const settings = new settings_1.default({
                errorFilter: (error) => error.code === 'EPERM'
            });
            const reader = new TestReader('non-exist-directory', settings);
            reader.scandir.yields(tests.EPERM_ERRNO);
            reader.onEnd(() => {
                done();
            });
            reader.read();
        });
        it('should do not emit events after first broken scandir call', (done) => {
            const reader = new TestReader('directory');
            const firstFakeDirectoryEntry = tests.buildFakeDirectoryEntry({ name: 'a', path: 'directory/a' });
            const secondFakeDirectoryEntry = tests.buildFakeDirectoryEntry({ name: 'b', path: 'directory/b' });
            reader.scandir.onFirstCall().yields(null, [firstFakeDirectoryEntry, secondFakeDirectoryEntry]);
            reader.scandir.onSecondCall().yieldsAsync(tests.EPERM_ERRNO);
            reader.scandir.onThirdCall().yieldsAsync(tests.EPERM_ERRNO);
            /**
             * If the behavior is broken, then a third scandir call will trigger an unhandled error.
             */
            reader.onError((error) => {
                assert.ok(error);
                done();
            });
            reader.read();
        });
        it('should return entries', (done) => {
            const reader = new TestReader('directory');
            const fakeDirectoryEntry = tests.buildFakeDirectoryEntry();
            const fakeFileEntry = tests.buildFakeFileEntry();
            reader.scandir.onFirstCall().yields(null, [fakeDirectoryEntry]);
            reader.scandir.onSecondCall().yields(null, [fakeFileEntry]);
            const entries = [];
            reader.onEntry((entry) => entries.push(entry));
            reader.onEnd(() => {
                assert.deepStrictEqual(entries, [fakeDirectoryEntry, fakeFileEntry]);
                done();
            });
            reader.read();
        });
        it('should push to results only directories', (done) => {
            const settings = new settings_1.default({ entryFilter: (entry) => !entry.dirent.isFile() });
            const reader = new TestReader('directory', settings);
            const fakeDirectoryEntry = tests.buildFakeDirectoryEntry();
            const fakeFileEntry = tests.buildFakeFileEntry();
            reader.scandir.onFirstCall().yields(null, [fakeDirectoryEntry]);
            reader.scandir.onSecondCall().yields(null, [fakeFileEntry]);
            const entries = [];
            reader.onEntry((entry) => entries.push(entry));
            reader.onEnd(() => {
                assert.deepStrictEqual(entries, [fakeDirectoryEntry]);
                done();
            });
            reader.read();
        });
        it('should do not read root directory', (done) => {
            const settings = new settings_1.default({ deepFilter: () => false });
            const reader = new TestReader('directory', settings);
            const fakeDirectoryEntry = tests.buildFakeDirectoryEntry();
            const fakeFileEntry = tests.buildFakeFileEntry();
            reader.scandir.onFirstCall().yields(null, [fakeDirectoryEntry]);
            reader.scandir.onSecondCall().yields(null, [fakeFileEntry]);
            const entries = [];
            reader.onEntry((entry) => entries.push(entry));
            reader.onEnd(() => {
                assert.deepStrictEqual(entries, [fakeDirectoryEntry]);
                done();
            });
            reader.read();
        });
        it('should set base path to entry when the `basePath` option is exist', (done) => {
            const settings = new settings_1.default({ basePath: 'base' });
            const reader = new TestReader('directory', settings);
            const fakeDirectoryEntry = tests.buildFakeDirectoryEntry();
            const fakeFileEntry = tests.buildFakeFileEntry();
            reader.scandir.onFirstCall().yields(null, [fakeDirectoryEntry]);
            reader.scandir.onSecondCall().yields(null, [fakeFileEntry]);
            const entries = [];
            reader.onEntry((entry) => entries.push(entry));
            reader.onEnd(() => {
                assert.strictEqual(entries[0].path, path.join('base', fakeDirectoryEntry.name));
                assert.strictEqual(entries[1].path, path.join('base', 'fake', fakeFileEntry.name));
                done();
            });
            reader.read();
        });
        it('should set base path to entry when the `basePath` option is exist and value is an empty string', (done) => {
            const settings = new settings_1.default({ basePath: '' });
            const reader = new TestReader('directory', settings);
            const fakeDirectoryEntry = tests.buildFakeDirectoryEntry();
            const fakeFileEntry = tests.buildFakeFileEntry();
            reader.scandir.onFirstCall().yields(null, [fakeDirectoryEntry]);
            reader.scandir.onSecondCall().yields(null, [fakeFileEntry]);
            const entries = [];
            reader.onEntry((entry) => entries.push(entry));
            reader.onEnd(() => {
                assert.strictEqual(entries[0].path, path.join(fakeDirectoryEntry.name));
                assert.strictEqual(entries[1].path, path.join('fake', fakeFileEntry.name));
                done();
            });
            reader.read();
        });
    });
    describe('.destroy', () => {
        it('should do not emit entries after destroy', (done) => {
            const reader = new TestReader('directory');
            const firstFakeDirectoryEntry = tests.buildFakeDirectoryEntry({ name: 'a', path: 'directory/a' });
            const fakeFileEntry = tests.buildFakeFileEntry();
            reader.scandir.onFirstCall().yields(null, [firstFakeDirectoryEntry]);
            reader.scandir.onSecondCall().yields(null, [fakeFileEntry]);
            reader.onEntry((entry) => {
                if (entry.name === 'a') {
                    reader.destroy();
                }
                else {
                    assert.fail('should do not emit entries after destroy');
                }
            });
            reader.onEnd(() => {
                done();
            });
            reader.read();
        });
        it('should mark stream as "destroyed" after first destroy', () => {
            const reader = new TestReader('directory');
            reader.destroy();
            assert.ok(reader.isDestroyed);
        });
        it('should throw an error when trying to destroy reader twice', () => {
            const reader = new TestReader('directory');
            const expectedErrorMessageRe = /The reader is already destroyed/;
            reader.destroy();
            assert.throws(() => reader.destroy(), expectedErrorMessageRe);
        });
    });
});
