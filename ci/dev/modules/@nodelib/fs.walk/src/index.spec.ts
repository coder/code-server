import * as assert from 'assert';
import * as fs from 'fs';
import { Readable } from 'stream';

import * as rimraf from 'rimraf';

import { Errno } from './types';
import { walk, walkSync, walkStream, Settings, Entry } from '.';

const entryFilter = (entry: Entry): boolean => !entry.dirent.isDirectory();

function streamToPromise(stream: Readable): Promise<Entry[]> {
	const entries: Entry[] = [];

	return new Promise((resolve, reject) => {
		stream.on('data', (entry: Entry) => entries.push(entry));
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
			walk('non-exist-directory', (error, entries) => {
				assert.strictEqual(error.code, 'ENOENT');
				assert.strictEqual(entries, undefined);
				done();
			});
		});

		it('should work without options or settings', (done) => {
			walk('fixtures', (error, entries) => {
				assert.strictEqual(error, null);
				assert.strictEqual(entries.length, 3);
				done();
			});
		});

		it('should work with options', (done) => {
			walk('fixtures', { entryFilter }, (error, entries) => {
				assert.strictEqual(error, null);
				assert.strictEqual(entries.length, 2);
				done();
			});
		});

		it('should work with settings', (done) => {
			const settings = new Settings({ entryFilter });

			walk('fixtures', settings, (error, entries) => {
				assert.strictEqual(error, null);
				assert.strictEqual(entries.length, 2);
				done();
			});
		});
	});

	describe('.walkStream', () => {
		it('should throw an error for non-exist directory', async () => {
			const stream = walkStream('non-exist-directory');

			await assert.rejects(() => streamToPromise(stream), (error: Errno) => error.code === 'ENOENT');
		});

		it('should work without options or settings', async () => {
			const stream = walkStream('fixtures');
			const actual = await streamToPromise(stream);

			assert.strictEqual(actual.length, 3);
		});

		it('should work with options', async () => {
			const stream = walkStream('fixtures', { entryFilter });
			const actual = await streamToPromise(stream);

			assert.strictEqual(actual.length, 2);
		});

		it('should work with settings', async () => {
			const settings = new Settings({ entryFilter });
			const stream = walkStream('fixtures', settings);
			const actual = await streamToPromise(stream);

			assert.strictEqual(actual.length, 2);
		});
	});

	describe('.walkSync', () => {
		it('should throw an error for non-exist directory', () => {
			const matcher = (error: Errno): boolean => error.code === 'ENOENT';

			assert.throws(() => walkSync('non-exist-directory'), matcher);
		});

		it('should work without options or settings', () => {
			const actual = walkSync('fixtures');

			assert.strictEqual(actual.length, 3);
		});

		it('should work with options', () => {
			const actual = walkSync('fixtures', { entryFilter });

			assert.strictEqual(actual.length, 2);
		});

		it('should work with settings', () => {
			const settings = new Settings({ entryFilter });

			const actual = walkSync('fixtures', settings);

			assert.strictEqual(actual.length, 2);
		});
	});
});
