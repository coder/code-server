"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const path = require("path");
const sinon = require("sinon");
const fs_macchiato_1 = require("../../../fs.macchiato");
const constants_1 = require("../constants");
const settings_1 = require("../settings");
const provider = require("./async");
const ROOT_PATH = 'root';
const FIRST_FILE_PATH = 'first.txt';
const SECOND_FILE_PATH = 'second.txt';
const FIRST_ENTRY_PATH = path.join(ROOT_PATH, FIRST_FILE_PATH);
const SECOND_ENTRY_PATH = path.join(ROOT_PATH, SECOND_FILE_PATH);
describe('Providers → Async', () => {
    describe('.read', () => {
        it('should call correct method based on Node.js version', (done) => {
            const readdir = sinon.stub();
            readdir.yields(null, []);
            const settings = new settings_1.default({
                fs: { readdir: readdir }
            });
            provider.read(ROOT_PATH, settings, (error, entries) => {
                assert.strictEqual(error, null);
                assert.deepStrictEqual(entries, []);
                if (constants_1.IS_SUPPORT_READDIR_WITH_FILE_TYPES) {
                    sinon.assert.match(readdir.args, [[ROOT_PATH, { withFileTypes: true }, sinon.match.func]]);
                }
                else {
                    sinon.assert.match(readdir.args, [[ROOT_PATH, sinon.match.func]]);
                }
                done();
            });
        });
        it('should always use `readdir` method when the `stats` option is enabled', (done) => {
            const readdir = sinon.stub();
            readdir.yields(null, []);
            const settings = new settings_1.default({
                fs: { readdir: readdir },
                stats: true
            });
            provider.read(ROOT_PATH, settings, (error, entries) => {
                assert.strictEqual(error, null);
                assert.deepStrictEqual(entries, []);
                sinon.assert.match(readdir.args, [[ROOT_PATH, sinon.match.func]]);
                done();
            });
        });
    });
    describe('.readdirWithFileTypes', () => {
        it('should return entries', (done) => {
            const dirent = new fs_macchiato_1.Dirent({ name: FIRST_FILE_PATH });
            const readdir = sinon.stub();
            readdir.yields(null, [dirent]);
            const settings = new settings_1.default({
                fs: { readdir: readdir }
            });
            const expected = [
                {
                    dirent,
                    name: FIRST_FILE_PATH,
                    path: FIRST_ENTRY_PATH
                }
            ];
            provider.readdirWithFileTypes(ROOT_PATH, settings, (error, entries) => {
                assert.strictEqual(error, null);
                sinon.assert.match(readdir.args, [[ROOT_PATH, { withFileTypes: true }, sinon.match.func]]);
                assert.deepStrictEqual(entries, expected);
                done();
            });
        });
        it('should call fs.stat for symbolic link when the "followSymbolicLink" option is enabled', (done) => {
            const firstDirent = new fs_macchiato_1.Dirent({ name: FIRST_FILE_PATH });
            const secondDirent = new fs_macchiato_1.Dirent({ name: SECOND_FILE_PATH, isSymbolicLink: true });
            const stats = new fs_macchiato_1.Stats();
            const readdir = sinon.stub();
            const stat = sinon.stub();
            readdir.yields(null, [firstDirent, secondDirent]);
            stat.yields(null, stats);
            const settings = new settings_1.default({
                followSymbolicLinks: true,
                fs: {
                    readdir: readdir,
                    stat: stat
                }
            });
            provider.readdirWithFileTypes(ROOT_PATH, settings, (error, entries) => {
                assert.strictEqual(error, null);
                assert.strictEqual(entries.length, 2);
                assert.ok(!entries[1].dirent.isSymbolicLink());
                sinon.assert.match(stat.args, [[SECOND_ENTRY_PATH, sinon.match.func]]);
                done();
            });
        });
        it('should return lstat for broken symbolic link when the "throwErrorOnBrokenSymbolicLink" option is disabled', (done) => {
            const firstDirent = new fs_macchiato_1.Dirent({ name: FIRST_FILE_PATH, isSymbolicLink: true });
            const readdir = sinon.stub();
            const stat = sinon.stub();
            readdir.yields(null, [firstDirent]);
            stat.yields(new Error('error'));
            const settings = new settings_1.default({
                followSymbolicLinks: true,
                throwErrorOnBrokenSymbolicLink: false,
                fs: {
                    readdir: readdir,
                    stat: stat
                }
            });
            provider.readdirWithFileTypes(ROOT_PATH, settings, (error, entries) => {
                assert.strictEqual(error, null);
                assert.strictEqual(entries.length, 1);
                assert.ok(entries[0].dirent.isSymbolicLink());
                done();
            });
        });
        it('should throw an error fro broken symbolic link when the "throwErrorOnBrokenSymbolicLink" option is enabled', (done) => {
            const firstDirent = new fs_macchiato_1.Dirent({ name: FIRST_FILE_PATH, isSymbolicLink: true });
            const readdir = sinon.stub();
            const stat = sinon.stub();
            readdir.yields(null, [firstDirent]);
            stat.yields(new Error('error'));
            const settings = new settings_1.default({
                followSymbolicLinks: true,
                throwErrorOnBrokenSymbolicLink: true,
                fs: {
                    readdir: readdir,
                    stat: stat
                }
            });
            provider.readdirWithFileTypes(ROOT_PATH, settings, (error, entries) => {
                assert.strictEqual(error.message, 'error');
                assert.strictEqual(entries, undefined);
                done();
            });
        });
    });
    describe('.readdir', () => {
        it('should return entries', (done) => {
            const stats = new fs_macchiato_1.Stats();
            const readdir = sinon.stub();
            const lstat = sinon.stub();
            readdir.yields(null, [FIRST_FILE_PATH]);
            lstat.yields(null, stats);
            const settings = new settings_1.default({
                fs: {
                    readdir: readdir,
                    lstat: lstat
                }
            });
            provider.readdir(ROOT_PATH, settings, (error, entries) => {
                assert.strictEqual(error, null);
                sinon.assert.match(readdir.args, [[ROOT_PATH, sinon.match.func]]);
                sinon.assert.match(lstat.args, [[FIRST_ENTRY_PATH, sinon.match.func]]);
                assert.strictEqual(entries[0].name, FIRST_FILE_PATH);
                assert.strictEqual(entries[0].path, FIRST_ENTRY_PATH);
                assert.strictEqual(entries[0].dirent.name, FIRST_FILE_PATH);
                done();
            });
        });
        it('should return entries with `stats` property', (done) => {
            const stats = new fs_macchiato_1.Stats();
            const readdir = sinon.stub();
            const lstat = sinon.stub();
            readdir.yields(null, [FIRST_FILE_PATH]);
            lstat.yields(null, stats);
            const settings = new settings_1.default({
                fs: {
                    readdir: readdir,
                    lstat: lstat
                },
                stats: true
            });
            provider.readdir(ROOT_PATH, settings, (error, entries) => {
                assert.strictEqual(error, null);
                assert.deepStrictEqual(entries[0].stats, stats);
                done();
            });
        });
    });
});
