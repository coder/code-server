import * as assert from 'assert';
import * as fs from 'fs';

import * as rimraf from 'rimraf';

import { scandir, scandirSync, Settings } from '.';

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
			scandir('fixtures', (error, entries) => {
				assert.strictEqual(error, null);
				assert.ok(entries[0].name);
				assert.ok(entries[0].path);
				assert.ok(entries[0].dirent);
				done();
			});
		});

		it('should work with options', (done) => {
			scandir('fixtures', { stats: true }, (error, entries) => {
				assert.strictEqual(error, null);
				assert.ok(entries[0].name);
				assert.ok(entries[0].path);
				assert.ok(entries[0].dirent);
				assert.ok(entries[0].stats);
				done();
			});
		});

		it('should work with settings', (done) => {
			const settings = new Settings({ stats: true });

			scandir('fixtures', settings, (error, entries) => {
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
			const actual = scandirSync('fixtures');

			assert.ok(actual[0].name);
			assert.ok(actual[0].path);
			assert.ok(actual[0].dirent);
		});

		it('should work with options', () => {
			const actual = scandirSync('fixtures', { stats: true });

			assert.ok(actual[0].name);
			assert.ok(actual[0].path);
			assert.ok(actual[0].dirent);
			assert.ok(actual[0].stats);
		});

		it('should work with settings', () => {
			const settings = new Settings({ stats: true });

			const actual = scandirSync('fixtures', settings);

			assert.ok(actual[0].name);
			assert.ok(actual[0].path);
			assert.ok(actual[0].dirent);
			assert.ok(actual[0].stats);
		});
	});
});
