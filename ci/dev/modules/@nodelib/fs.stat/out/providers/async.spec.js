"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const sinon = require("sinon");
const fs_macchiato_1 = require("../../../fs.macchiato");
const settings_1 = require("../settings");
const provider = require("./async");
describe('Providers → Async', () => {
    describe('.read', () => {
        it('should return lstat for non-symlink entry', (done) => {
            const lstat = sinon.stub().yields(null, new fs_macchiato_1.Stats());
            const settings = new settings_1.default({
                fs: { lstat }
            });
            provider.read('filepath', settings, (error, stats) => {
                assert.strictEqual(error, null);
                assert.strictEqual(stats.ino, 0);
                done();
            });
        });
        it('should return lstat for symlink entry when the "followSymbolicLink" option is disabled', (done) => {
            const lstat = sinon.stub().yields(null, new fs_macchiato_1.Stats({ isSymbolicLink: true }));
            const settings = new settings_1.default({
                followSymbolicLink: false,
                fs: { lstat }
            });
            provider.read('filepath', settings, (error, stats) => {
                assert.strictEqual(error, null);
                assert.strictEqual(stats.ino, 0);
                done();
            });
        });
        it('should return stat for symlink entry', (done) => {
            const lstat = sinon.stub().yields(null, new fs_macchiato_1.Stats({ isSymbolicLink: true }));
            const stat = sinon.stub().yields(null, new fs_macchiato_1.Stats({ ino: 1 }));
            const settings = new settings_1.default({
                fs: { lstat, stat }
            });
            provider.read('filepath', settings, (error, stats) => {
                assert.strictEqual(error, null);
                assert.strictEqual(stats.ino, 1);
                done();
            });
        });
        it('should return marked stat for symlink entry when the "markSymbolicLink" option is enabled', (done) => {
            const lstat = sinon.stub().yields(null, new fs_macchiato_1.Stats({ isSymbolicLink: true }));
            const stat = sinon.stub().yields(null, new fs_macchiato_1.Stats({ ino: 1 }));
            const settings = new settings_1.default({
                fs: { lstat, stat },
                markSymbolicLink: true
            });
            provider.read('filepath', settings, (error, stats) => {
                assert.strictEqual(error, null);
                assert.strictEqual(stats.isSymbolicLink(), true);
                done();
            });
        });
        it('should return lstat for broken symlink entry when the "throwErrorOnBrokenSymbolicLink" option is disabled', (done) => {
            const lstat = sinon.stub().yields(null, new fs_macchiato_1.Stats({ isSymbolicLink: true }));
            const stat = sinon.stub().yields(new Error());
            const settings = new settings_1.default({
                fs: { lstat, stat },
                throwErrorOnBrokenSymbolicLink: false
            });
            provider.read('filepath', settings, (error, stats) => {
                assert.strictEqual(error, null);
                assert.strictEqual(stats.ino, 0);
                done();
            });
        });
        it('should throw an error when symlink entry is broken', (done) => {
            const lstat = sinon.stub().yields(null, new fs_macchiato_1.Stats({ isSymbolicLink: true }));
            const stat = sinon.stub().yields(new Error('broken'));
            const settings = new settings_1.default({
                fs: { lstat, stat }
            });
            provider.read('filepath', settings, (error) => {
                assert.strictEqual(error.message, 'broken');
                done();
            });
        });
    });
});
