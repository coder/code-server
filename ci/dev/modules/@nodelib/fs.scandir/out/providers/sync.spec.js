"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const path = require("path");
const sinon = require("sinon");
const fs_macchiato_1 = require("../../../fs.macchiato");
const constants_1 = require("../constants");
const settings_1 = require("../settings");
const provider = require("./sync");
const ROOT_PATH = 'root';
const FIRST_FILE_PATH = 'first.txt';
const SECOND_FILE_PATH = 'second.txt';
const FIRST_ENTRY_PATH = path.join(ROOT_PATH, FIRST_FILE_PATH);
const SECOND_ENTRY_PATH = path.join(ROOT_PATH, SECOND_FILE_PATH);
describe('Providers → Sync', () => {
    describe('.read', () => {
        it('should call correct method based on Node.js version', () => {
            const readdirSync = sinon.stub().returns([]);
            const settings = new settings_1.default({
                fs: { readdirSync: readdirSync }
            });
            const actual = provider.read(ROOT_PATH, settings);
            assert.deepStrictEqual(actual, []);
            if (constants_1.IS_SUPPORT_READDIR_WITH_FILE_TYPES) {
                assert.deepStrictEqual(readdirSync.args, [[ROOT_PATH, { withFileTypes: true }]]);
            }
            else {
                assert.deepStrictEqual(readdirSync.args, [[ROOT_PATH]]);
            }
        });
        it('should always use `readdir` method when the `stats` option is enabled', () => {
            const readdirSync = sinon.stub().returns([]);
            const settings = new settings_1.default({
                fs: { readdirSync: readdirSync },
                stats: true
            });
            provider.read(ROOT_PATH, settings);
            assert.deepStrictEqual(readdirSync.args, [[ROOT_PATH]]);
        });
    });
    describe('.readdirWithFileTypes', () => {
        it('should return entries', () => {
            const dirent = new fs_macchiato_1.Dirent({ name: FIRST_FILE_PATH });
            const readdirSync = sinon.stub().returns([dirent]);
            const settings = new settings_1.default({
                fs: { readdirSync: readdirSync }
            });
            const expected = [
                {
                    dirent,
                    name: FIRST_FILE_PATH,
                    path: FIRST_ENTRY_PATH
                }
            ];
            const actual = provider.readdirWithFileTypes(ROOT_PATH, settings);
            assert.deepStrictEqual(readdirSync.args, [[ROOT_PATH, { withFileTypes: true }]]);
            assert.deepStrictEqual(actual, expected);
        });
        it('should call fs.stat for symbolic link when the "followSymbolicLink" option is enabled', () => {
            const firstDirent = new fs_macchiato_1.Dirent({ name: FIRST_FILE_PATH });
            const secondDirent = new fs_macchiato_1.Dirent({ name: SECOND_FILE_PATH, isSymbolicLink: true });
            const stats = new fs_macchiato_1.Stats();
            const readdirSync = sinon.stub().returns([firstDirent, secondDirent]);
            const statSync = sinon.stub().returns(stats);
            const settings = new settings_1.default({
                followSymbolicLinks: true,
                fs: {
                    readdirSync: readdirSync,
                    statSync: statSync
                }
            });
            const actual = provider.readdirWithFileTypes(ROOT_PATH, settings);
            assert.strictEqual(actual.length, 2);
            assert.deepStrictEqual(statSync.args, [[SECOND_ENTRY_PATH]]);
            assert.ok(!actual[1].dirent.isSymbolicLink());
        });
        it('should return lstat for broken symbolic link when the "throwErrorOnBrokenSymbolicLink" option is disabled', () => {
            const dirent = new fs_macchiato_1.Dirent({ name: FIRST_FILE_PATH, isSymbolicLink: true });
            const readdirSync = sinon.stub().returns([dirent]);
            const statSync = () => {
                throw new Error('error');
            };
            const settings = new settings_1.default({
                followSymbolicLinks: true,
                throwErrorOnBrokenSymbolicLink: false,
                fs: {
                    readdirSync: readdirSync,
                    statSync: statSync
                }
            });
            const actual = provider.readdirWithFileTypes(ROOT_PATH, settings);
            assert.strictEqual(actual.length, 1);
        });
        it('should throw an error fro broken symbolic link when the "throwErrorOnBrokenSymbolicLink" option is enabled', () => {
            const dirent = new fs_macchiato_1.Dirent({ name: FIRST_FILE_PATH, isSymbolicLink: true });
            const readdirSync = sinon.stub().returns([dirent]);
            const statSync = () => {
                throw new Error('error');
            };
            const settings = new settings_1.default({
                followSymbolicLinks: true,
                throwErrorOnBrokenSymbolicLink: true,
                fs: {
                    readdirSync: readdirSync,
                    statSync: statSync
                }
            });
            const expectedErrorMessageRe = /Error: error/;
            assert.throws(() => provider.readdirWithFileTypes(ROOT_PATH, settings), expectedErrorMessageRe);
        });
    });
    describe('.readdir', () => {
        it('should return entries', () => {
            const stats = new fs_macchiato_1.Stats();
            const readdirSync = sinon.stub().returns([FIRST_FILE_PATH]);
            const lstatSync = sinon.stub().returns(stats);
            const settings = new settings_1.default({
                fs: {
                    readdirSync: readdirSync,
                    lstatSync: lstatSync
                }
            });
            const actual = provider.readdir(ROOT_PATH, settings);
            assert.deepStrictEqual(readdirSync.args, [[ROOT_PATH]]);
            assert.strictEqual(actual[0].name, FIRST_FILE_PATH);
            assert.strictEqual(actual[0].path, FIRST_ENTRY_PATH);
            assert.strictEqual(actual[0].dirent.name, FIRST_FILE_PATH);
        });
        it('should return entries with `stats` property', () => {
            const stats = new fs_macchiato_1.Stats();
            const readdirSync = sinon.stub().returns([FIRST_FILE_PATH]);
            const lstatSync = sinon.stub().returns(stats);
            const settings = new settings_1.default({
                fs: {
                    readdirSync: readdirSync,
                    lstatSync: lstatSync
                },
                stats: true
            });
            const actual = provider.readdir(ROOT_PATH, settings);
            assert.deepStrictEqual(actual[0].stats, stats);
        });
    });
});
