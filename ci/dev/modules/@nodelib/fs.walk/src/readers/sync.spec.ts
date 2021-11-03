import * as assert from 'assert';
import * as path from 'path';

import * as sinon from 'sinon';

import Settings from '../settings';
import * as tests from '../tests';
import SyncReader from './sync';

class TestReader extends SyncReader {
	protected readonly _scandir: sinon.SinonStub = sinon.stub();

	constructor(_root: string, _settings: Settings = new Settings()) {
		super(_root, _settings);
	}

	public get scandir(): sinon.SinonStub {
		return this._scandir;
	}
}

describe('Readers → Sync', () => {
	describe('.read', () => {
		it('should throw an error when the first call of scandir is broken', () => {
			const reader = new TestReader('non-exist-directory');

			reader.scandir.throws(tests.EPERM_ERRNO);

			assert.throws(() => reader.read(), { code: 'EPERM' });
		});

		it('should return empty array when the first call of scandir is broken but this error can be suppressed', () => {
			const settings = new Settings({
				errorFilter: (error) => error.code === 'EPERM'
			});
			const reader = new TestReader('non-exist-directory', settings);

			reader.scandir.throws(tests.EPERM_ERRNO);

			const actual = reader.read();

			assert.deepStrictEqual(actual, []);
		});

		it('should return entries', () => {
			const reader = new TestReader('directory');
			const fakeDirectoryEntry = tests.buildFakeDirectoryEntry();
			const fakeFileEntry = tests.buildFakeFileEntry();

			reader.scandir.onFirstCall().returns([fakeDirectoryEntry]);
			reader.scandir.onSecondCall().returns([fakeFileEntry]);

			const expected = [fakeDirectoryEntry, fakeFileEntry];

			const actual = reader.read();

			assert.deepStrictEqual(actual, expected);
		});

		it('should push to results only directories', () => {
			const settings = new Settings({ entryFilter: (entry) => !entry.dirent.isFile() });
			const reader = new TestReader('directory', settings);

			const fakeDirectoryEntry = tests.buildFakeDirectoryEntry();
			const fakeFileEntry = tests.buildFakeFileEntry();

			reader.scandir.onFirstCall().returns([fakeDirectoryEntry]);
			reader.scandir.onSecondCall().returns([fakeFileEntry]);

			const expected = [fakeDirectoryEntry];

			const actual = reader.read();

			assert.deepStrictEqual(actual, expected);
		});

		it('should do not read root directory', () => {
			const settings = new Settings({ deepFilter: () => false });
			const reader = new TestReader('directory', settings);

			const fakeDirectoryEntry = tests.buildFakeDirectoryEntry();
			const fakeFileEntry = tests.buildFakeFileEntry();

			reader.scandir.onFirstCall().returns([fakeDirectoryEntry]);
			reader.scandir.onSecondCall().returns([fakeFileEntry]);

			const expected = [fakeDirectoryEntry];

			const actual = reader.read();

			assert.deepStrictEqual(actual, expected);
		});

		it('should set base path to entry when the `basePath` option is exist', () => {
			const settings = new Settings({ basePath: 'base' });
			const reader = new TestReader('directory', settings);

			const fakeDirectoryEntry = tests.buildFakeDirectoryEntry();
			const fakeFileEntry = tests.buildFakeFileEntry();

			reader.scandir.onFirstCall().returns([fakeDirectoryEntry]);
			reader.scandir.onSecondCall().returns([fakeFileEntry]);

			const actual = reader.read();

			assert.strictEqual(actual[0].path, path.join('base', fakeDirectoryEntry.name));
			assert.strictEqual(actual[1].path, path.join('base', 'fake', fakeFileEntry.name));
		});

		it('should set base path to entry when the `basePath` option is exist and value is an empty string', () => {
			const settings = new Settings({ basePath: '' });
			const reader = new TestReader('directory', settings);

			const fakeDirectoryEntry = tests.buildFakeDirectoryEntry();
			const fakeFileEntry = tests.buildFakeFileEntry();

			reader.scandir.onFirstCall().returns([fakeDirectoryEntry]);
			reader.scandir.onSecondCall().returns([fakeFileEntry]);

			const actual = reader.read();

			assert.strictEqual(actual[0].path, fakeDirectoryEntry.name);
			assert.strictEqual(actual[1].path, path.join('fake', fakeFileEntry.name));
		});
	});
});
