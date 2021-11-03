import * as assert from 'assert';

import * as fsScandir from '@nodelib/fs.scandir';

import Settings from './settings';

describe('Settings', () => {
	it('should return instance with default values', () => {
		const fsWalkSettings = new Settings();
		const fsScandirSettings = new fsScandir.Settings({
			followSymbolicLinks: undefined,
			fs: undefined,
			pathSegmentSeparator: undefined,
			stats: undefined,
			throwErrorOnBrokenSymbolicLink: undefined
		});

		assert.strictEqual(fsWalkSettings.basePath, undefined);
		assert.strictEqual(fsWalkSettings.concurrency, Infinity);
		assert.strictEqual(fsWalkSettings.deepFilter, null);
		assert.strictEqual(fsWalkSettings.entryFilter, null);
		assert.strictEqual(fsWalkSettings.errorFilter, null);
		assert.deepStrictEqual(fsWalkSettings.fsScandirSettings, fsScandirSettings);
	});

	it('should return instance with custom values', () => {
		const filter = (): boolean => true;

		const fsWalkSettings = new Settings({ entryFilter: filter });

		assert.strictEqual(fsWalkSettings.entryFilter, filter);
	});
});
