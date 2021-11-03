import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import * as sinon from 'sinon';

import { Dirent, Stats } from '../../../fs.macchiato';
import { IS_SUPPORT_READDIR_WITH_FILE_TYPES } from '../constants';
import Settings from '../settings';
import { Entry } from '../types';
import * as provider from './sync';

const ROOT_PATH = 'root';
const FIRST_FILE_PATH = 'first.txt';
const SECOND_FILE_PATH = 'second.txt';
const FIRST_ENTRY_PATH = path.join(ROOT_PATH, FIRST_FILE_PATH);
const SECOND_ENTRY_PATH = path.join(ROOT_PATH, SECOND_FILE_PATH);

describe('Providers → Sync', () => {
	describe('.read', () => {
		it('should call correct method based on Node.js version', () => {
			const readdirSync = sinon.stub().returns([]);

			const settings = new Settings({
				fs: { readdirSync: readdirSync as unknown as typeof fs.readdirSync }
			});

			const actual = provider.read(ROOT_PATH, settings);

			assert.deepStrictEqual(actual, []);

			if (IS_SUPPORT_READDIR_WITH_FILE_TYPES) {
				assert.deepStrictEqual(readdirSync.args, [[ROOT_PATH, { withFileTypes: true }]]);
			} else {
				assert.deepStrictEqual(readdirSync.args, [[ROOT_PATH]]);
			}
		});

		it('should always use `readdir` method when the `stats` option is enabled', () => {
			const readdirSync = sinon.stub().returns([]);

			const settings = new Settings({
				fs: { readdirSync: readdirSync as unknown as typeof fs.readdirSync },
				stats: true
			});

			provider.read(ROOT_PATH, settings);

			assert.deepStrictEqual(readdirSync.args, [[ROOT_PATH]]);
		});
	});

	describe('.readdirWithFileTypes', () => {
		it('should return entries', () => {
			const dirent = new Dirent({ name: FIRST_FILE_PATH });
			const readdirSync = sinon.stub().returns([dirent]);

			const settings = new Settings({
				fs: { readdirSync: readdirSync as unknown as typeof fs.readdirSync }
			});

			const expected: Entry[] = [
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
			const firstDirent = new Dirent({ name: FIRST_FILE_PATH });
			const secondDirent = new Dirent({ name: SECOND_FILE_PATH, isSymbolicLink: true });
			const stats = new Stats();

			const readdirSync = sinon.stub().returns([firstDirent, secondDirent]);
			const statSync = sinon.stub().returns(stats);

			const settings = new Settings({
				followSymbolicLinks: true,
				fs: {
					readdirSync: readdirSync as unknown as typeof fs.readdirSync,
					statSync: statSync as unknown as typeof fs.statSync
				}
			});

			const actual = provider.readdirWithFileTypes(ROOT_PATH, settings);

			assert.strictEqual(actual.length, 2);
			assert.deepStrictEqual(statSync.args, [[SECOND_ENTRY_PATH]]);
			assert.ok(!actual[1].dirent.isSymbolicLink());
		});

		it('should return lstat for broken symbolic link when the "throwErrorOnBrokenSymbolicLink" option is disabled', () => {
			const dirent = new Dirent({ name: FIRST_FILE_PATH, isSymbolicLink: true });

			const readdirSync = sinon.stub().returns([dirent]);
			const statSync = (): never => {
				throw new Error('error');
			};

			const settings = new Settings({
				followSymbolicLinks: true,
				throwErrorOnBrokenSymbolicLink: false,
				fs: {
					readdirSync: readdirSync as unknown as typeof fs.readdirSync,
					statSync: statSync as unknown as typeof fs.statSync
				}
			});

			const actual = provider.readdirWithFileTypes(ROOT_PATH, settings);

			assert.strictEqual(actual.length, 1);
		});

		it('should throw an error fro broken symbolic link when the "throwErrorOnBrokenSymbolicLink" option is enabled', () => {
			const dirent = new Dirent({ name: FIRST_FILE_PATH, isSymbolicLink: true });

			const readdirSync = sinon.stub().returns([dirent]);
			const statSync = (): never => {
				throw new Error('error');
			};

			const settings = new Settings({
				followSymbolicLinks: true,
				throwErrorOnBrokenSymbolicLink: true,
				fs: {
					readdirSync: readdirSync as unknown as typeof fs.readdirSync,
					statSync: statSync as unknown as typeof fs.statSync
				}
			});

			const expectedErrorMessageRe = /Error: error/;

			assert.throws(() => provider.readdirWithFileTypes(ROOT_PATH, settings), expectedErrorMessageRe);
		});
	});

	describe('.readdir', () => {
		it('should return entries', () => {
			const stats = new Stats();

			const readdirSync = sinon.stub().returns([FIRST_FILE_PATH]);
			const lstatSync = sinon.stub().returns(stats);

			const settings = new Settings({
				fs: {
					readdirSync: readdirSync as unknown as typeof fs.readdirSync,
					lstatSync: lstatSync as unknown as typeof fs.lstatSync
				}
			});

			const actual = provider.readdir(ROOT_PATH, settings);

			assert.deepStrictEqual(readdirSync.args, [[ROOT_PATH]]);

			assert.strictEqual(actual[0].name, FIRST_FILE_PATH);
			assert.strictEqual(actual[0].path, FIRST_ENTRY_PATH);
			assert.strictEqual(actual[0].dirent.name, FIRST_FILE_PATH);
		});

		it('should return entries with `stats` property', () => {
			const stats = new Stats();

			const readdirSync = sinon.stub().returns([FIRST_FILE_PATH]);
			const lstatSync = sinon.stub().returns(stats);

			const settings = new Settings({
				fs: {
					readdirSync: readdirSync as unknown as typeof fs.readdirSync,
					lstatSync: lstatSync as unknown as typeof fs.lstatSync
				},
				stats: true
			});

			const actual = provider.readdir(ROOT_PATH, settings);

			assert.deepStrictEqual(actual[0].stats, stats);
		});
	});
});
