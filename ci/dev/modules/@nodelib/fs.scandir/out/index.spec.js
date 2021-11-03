"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const fs = require("fs");
const rimraf = require("rimraf");
const _1 = require(".");
describe('Package', () => {
    before(() => {
        rimraf.sync('fixtures');
        fs.mkdirSync('fixtures');
        fs.writeFileSync('fixtures/file.txt', '');
    });
    after(() => {
        rimraf.sync('fixtures');
    });
    describe('.scandir', () => {
        it('should work without options or settings', (done) => {
            _1.scandir('fixtures', (error, entries) => {
                assert.strictEqual(error, null);
                assert.ok(entries[0].name);
                assert.ok(entries[0].path);
                assert.ok(entries[0].dirent);
                done();
            });
        });
        it('should work with options', (done) => {
            _1.scandir('fixtures', { stats: true }, (error, entries) => {
                assert.strictEqual(error, null);
                assert.ok(entries[0].name);
                assert.ok(entries[0].path);
                assert.ok(entries[0].dirent);
                assert.ok(entries[0].stats);
                done();
            });
        });
        it('should work with settings', (done) => {
            const settings = new _1.Settings({ stats: true });
            _1.scandir('fixtures', settings, (error, entries) => {
                assert.strictEqual(error, null);
                assert.ok(entries[0].name);
                assert.ok(entries[0].path);
                assert.ok(entries[0].dirent);
                assert.ok(entries[0].stats);
                done();
            });
        });
    });
    describe('.scandirSync', () => {
        it('should work without options or settings', () => {
            const actual = _1.scandirSync('fixtures');
            assert.ok(actual[0].name);
            assert.ok(actual[0].path);
            assert.ok(actual[0].dirent);
        });
        it('should work with options', () => {
            const actual = _1.scandirSync('fixtures', { stats: true });
            assert.ok(actual[0].name);
            assert.ok(actual[0].path);
            assert.ok(actual[0].dirent);
            assert.ok(actual[0].stats);
        });
        it('should work with settings', () => {
            const settings = new _1.Settings({ stats: true });
            const actual = _1.scandirSync('fixtures', settings);
            assert.ok(actual[0].name);
            assert.ok(actual[0].path);
            assert.ok(actual[0].dirent);
            assert.ok(actual[0].stats);
        });
    });
});
