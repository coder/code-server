import * as assert from 'assert';

import * as sinon from 'sinon';

import { Stats } from '../../../fs.macchiato';
import Settings from '../settings';
import * as provider from './sync';

describe('Providers → Sync', () => {
	describe('.read', () => {
		it('should return lstat for non-symlink entry', () => {
			const lstatSync = sinon.stub().returns(new Stats());

			const settings = new Settings({
				fs: { lstatSync }
			});

			const actual = provider.read('filepath', settings);

			assert.strictEqual(actual.ino, 0);
		});

		it('should return lstat for symlink entry when the "followSymbolicLink" option is disabled', () => {
			const lstatSync = sinon.stub().returns(new Stats({ isSymbolicLink: true }));

			const settings = new Settings({
				followSymbolicLink: false,
				fs: { lstatSync }
			});

			const actual = provider.read('filepath', settings);

			assert.strictEqual(actual.ino, 0);
		});

		it('should return stat for symlink entry', () => {
			const lstatSync = sinon.stub().returns(new Stats({ isSymbolicLink: true }));
			const statSync = sinon.stub().returns(new Stats({ ino: 1 }));

			const settings = new Settings({
				fs: { lstatSync, statSync }
			});

			const actual = provider.read('filepath', settings);

			assert.strictEqual(actual.ino, 1);
		});

		it('should return marked stat for symlink entry when the "markSymbolicLink" option is enabled', () => {
			const lstatSync = sinon.stub().returns(new Stats({ isSymbolicLink: true }));
			const statSync = sinon.stub().returns(new Stats({ ino: 1 }));

			const settings = new Settings({
				markSymbolicLink: true,
				fs: { lstatSync, statSync }
			});

			const actual = provider.read('filepath', settings);

			assert.strictEqual(actual.isSymbolicLink(), true);
		});

		it('should return lstat for broken symlink entry when the "throwErrorOnBrokenSymbolicLink" option is disabled', () => {
			const lstatSync = sinon.stub().returns(new Stats({ isSymbolicLink: true }));
			const statSync = sinon.stub().throws(new Error('error'));

			const settings = new Settings({
				fs: { lstatSync, statSync },
				throwErrorOnBrokenSymbolicLink: false
			});

			const actual = provider.read('filepath', settings);

			assert.strictEqual(actual.ino, 0);
		});

		it('should throw an error when symlink entry is broken', () => {
			const lstatSync = sinon.stub().returns(new Stats({ isSymbolicLink: true }));
			const statSync = sinon.stub().throws(new Error('broken'));

			const settings = new Settings({
				fs: { lstatSync, statSync }
			});

			const expectedErrorMessageRe = /broken/;

			assert.throws(() => provider.read('filepath', settings), expectedErrorMessageRe);
		});
	});
});
