"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const fs = require("fs");
const rimraf = require("rimraf");
const _1 = require(".");
const entryFilter = (entry) => !entry.dirent.isDirectory();
function streamToPromise(stream) {
    const entries = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (entry) => entries.push(entry));
        stream.once('error', reject);
        stream.once('end', () => resolve(entries));
    });
}
describe('Package', () => {
    before(() => {
        rimraf.sync('fixtures');
        fs.mkdirSync('fixtures');
        fs.writeFileSync('fixtures/file.txt', '');
        fs.mkdirSync('fixtures/nested');
        fs.writeFileSync('fixtures/nested/file.txt', '');
    });
    after(() => {
        rimraf.sync('fixtures');
    });
    describe('.walk', () => {
        it('should throw an error for non-exist directory', (done) => {
            _1.walk('non-exist-directory', (error, entries) => {
                assert.strictEqual(error.code, 'ENOENT');
                assert.strictEqual(entries, undefined);
                done();
            });
        });
        it('should work without options or settings', (done) => {
            _1.walk('fixtures', (error, entries) => {
                assert.strictEqual(error, null);
                assert.strictEqual(entries.length, 3);
                done();
            });
        });
        it('should work with options', (done) => {
            _1.walk('fixtures', { entryFilter }, (error, entries) => {
                assert.strictEqual(error, null);
                assert.strictEqual(entries.length, 2);
                done();
            });
        });
        it('should work with settings', (done) => {
            const settings = new _1.Settings({ entryFilter });
            _1.walk('fixtures', settings, (error, entries) => {
                assert.strictEqual(error, null);
                assert.strictEqual(entries.length, 2);
                done();
            });
        });
    });
    describe('.walkStream', () => {
        it('should throw an error for non-exist directory', async () => {
            const stream = _1.walkStream('non-exist-directory');
            await assert.rejects(() => streamToPromise(stream), (error) => error.code === 'ENOENT');
        });
        it('should work without options or settings', async () => {
            const stream = _1.walkStream('fixtures');
            const actual = await streamToPromise(stream);
            assert.strictEqual(actual.length, 3);
        });
        it('should work with options', async () => {
            const stream = _1.walkStream('fixtures', { entryFilter });
            const actual = await streamToPromise(stream);
            assert.strictEqual(actual.length, 2);
        });
        it('should work with settings', async () => {
            const settings = new _1.Settings({ entryFilter });
            const stream = _1.walkStream('fixtures', settings);
            const actual = await streamToPromise(stream);
            assert.strictEqual(actual.length, 2);
        });
    });
    describe('.walkSync', () => {
        it('should throw an error for non-exist directory', () => {
            const matcher = (error) => error.code === 'ENOENT';
            assert.throws(() => _1.walkSync('non-exist-directory'), matcher);
        });
        it('should work without options or settings', () => {
            const actual = _1.walkSync('fixtures');
            assert.strictEqual(actual.length, 3);
        });
        it('should work with options', () => {
            const actual = _1.walkSync('fixtures', { entryFilter });
            assert.strictEqual(actual.length, 2);
        });
        it('should work with settings', () => {
            const settings = new _1.Settings({ entryFilter });
            const actual = _1.walkSync('fixtures', settings);
            assert.strictEqual(actual.length, 2);
        });
    });
});
