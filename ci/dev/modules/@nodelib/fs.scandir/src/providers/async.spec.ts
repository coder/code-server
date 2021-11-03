import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import * as sinon from 'sinon';

import { Dirent, Stats } from '../../../fs.macchiato';
import { IS_SUPPORT_READDIR_WITH_FILE_TYPES } from '../constants';
import Settings from '../settings';
import { Entry } from '../types';
import * as provider from './async';

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

			const settings = new Settings({
				fs: { readdir: readdir as unknown as typeof fs.readdir }
			});

			provider.read(ROOT_PATH, settings, (error, entries) => {
				assert.strictEqual(error, null);

				assert.deepStrictEqual(entries, []);

				if (IS_SUPPORT_READDIR_WITH_FILE_TYPES) {
					sinon.assert.match(readdir.args, [[ROOT_PATH, { withFileTypes: true }, sinon.match.func]]);
				} else {
					sinon.assert.match(readdir.args, [[ROOT_PATH, sinon.match.func]]);
				}

				done();
			});
		});

		it('should always use `readdir` method when the `stats` option is enabled', (done) => {
			const readdir = sinon.stub();

			readdir.yields(null, []);

			const settings = new Settings({
				fs: { readdir: readdir as unknown as typeof fs.readdir },
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
			const dirent = new Dirent({ name: FIRST_FILE_PATH });
			const readdir = sinon.stub();

			readdir.yields(null, [dirent]);

			const settings = new Settings({
				fs: { readdir: readdir as unknown as typeof fs.readdir }
			});

			const expected: Entry[] = [
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
			const firstDirent = new Dirent({ name: FIRST_FILE_PATH });
			const secondDirent = new Dirent({ name: SECOND_FILE_PATH, isSymbolicLink: true });
			const stats = new Stats();

			const readdir = sinon.stub();
			const stat = sinon.stub();

			readdir.yields(null, [firstDirent, secondDirent]);
			stat.yields(null, stats);

			const settings = new Settings({
				followSymbolicLinks: true,
				fs: {
					readdir: readdir as unknown as typeof fs.readdir,
					stat: stat as unknown as typeof fs.stat
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
			const firstDirent = new Dirent({ name: FIRST_FILE_PATH, isSymbolicLink: true });

			const readdir = sinon.stub();
			const stat = sinon.stub();

			readdir.yields(null, [firstDirent]);
			stat.yields(new Error('error'));

			const settings = new Settings({
				followSymbolicLinks: true,
				throwErrorOnBrokenSymbolicLink: false,
				fs: {
					readdir: readdir as unknown as typeof fs.readdir,
					stat: stat as unknown as typeof fs.stat
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
			const firstDirent = new Dirent({ name: FIRST_FILE_PATH, isSymbolicLink: true });

			const readdir = sinon.stub();
			const stat = sinon.stub();

			readdir.yields(null, [firstDirent]);
			stat.yields(new Error('error'));

			const settings = new Settings({
				followSymbolicLinks: true,
				throwErrorOnBrokenSymbolicLink: true,
				fs: {
					readdir: readdir as unknown as typeof fs.readdir,
					stat: stat as unknown as typeof fs.stat
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
			const stats = new Stats();

			const readdir = sinon.stub();
			const lstat = sinon.stub();

			readdir.yields(null, [FIRST_FILE_PATH]);
			lstat.yields(null, stats);

			const settings = new Settings({
				fs: {
					readdir: readdir as unknown as typeof fs.readdir,
					lstat: lstat as unknown as typeof fs.lstat
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
			const stats = new Stats();

			const readdir = sinon.stub();
			const lstat = sinon.stub();

			readdir.yields(null, [FIRST_FILE_PATH]);
			lstat.yields(null, stats);

			const settings = new Settings({
				fs: {
					readdir: readdir as unknown as typeof fs.readdir,
					lstat: lstat as unknown as typeof fs.lstat
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
