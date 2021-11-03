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
        fs.mkdirSync('fixtures/a');
        fs.symlinkSync('a', 'fixtures/b', 'junction');
    });
    after(() => {
        rimraf.sync('fixtures');
    });
    describe('.stat', () => {
        it('should work without options or settings', (done) => {
            _1.stat('fixtures/b', (error, stats) => {
                assert.strictEqual(error, null);
                assert.ok(stats);
                done();
            });
        });
        it('should work with options', (done) => {
            _1.stat('fixtures/b', { markSymbolicLink: true }, (error, stats) => {
                assert.strictEqual(error, null);
                assert.strictEqual(stats.isSymbolicLink(), true);
                done();
            });
        });
        it('should work with settings', (done) => {
            const settings = new _1.Settings({ markSymbolicLink: true });
            _1.stat('fixtures/b', settings, (error, stats) => {
                assert.strictEqual(error, null);
                assert.strictEqual(stats.isSymbolicLink(), true);
                done();
            });
        });
    });
    describe('.statSync', () => {
        it('should work without options or settings', () => {
            const actual = _1.statSync('fixtures/b');
            assert.ok(actual);
        });
        it('should work with options', () => {
            const actual = _1.statSync('fixtures/b', { markSymbolicLink: true });
            assert.strictEqual(actual.isSymbolicLink(), true);
        });
        it('should work with settings', () => {
            const settings = new _1.Settings({ markSymbolicLink: true });
            const actual = _1.statSync('fixtures/b', settings);
            assert.strictEqual(actual.isSymbolicLink(), true);
        });
    });
});
