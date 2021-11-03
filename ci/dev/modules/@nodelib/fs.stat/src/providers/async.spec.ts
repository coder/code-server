import * as assert from 'assert';
import * as fs from 'fs';

import * as sinon from 'sinon';

import { Stats } from '../../../fs.macchiato';
import Settings from '../settings';
import * as provider from './async';

describe('Providers → Async', () => {
	describe('.read', () => {
		it('should return lstat for non-symlink entry', (done) => {
			const lstat = sinon.stub().yields(null, new Stats()) as unknown as typeof fs.lstat;

			const settings = new Settings({
				fs: { lstat }
			});

			provider.read('filepath', settings, (error, stats) => {
				assert.strictEqual(error, null);
				assert.strictEqual(stats.ino, 0);
				done();
			});
		});

		it('should return lstat for symlink entry when the "followSymbolicLink" option is disabled', (done) => {
			const lstat = sinon.stub().yields(null, new Stats({ isSymbolicLink: true })) as unknown as typeof fs.lstat;

			const settings = new Settings({
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
			const lstat = sinon.stub().yields(null, new Stats({ isSymbolicLink: true })) as unknown as typeof fs.lstat;
			const stat = sinon.stub().yields(null, new Stats({ ino: 1 })) as unknown as typeof fs.stat;

			const settings = new Settings({
				fs: { lstat, stat }
			});

			provider.read('filepath', settings, (error, stats) => {
				assert.strictEqual(error, null);
				assert.strictEqual(stats.ino, 1);
				done();
			});
		});

		it('should return marked stat for symlink entry when the "markSymbolicLink" option is enabled', (done) => {
			const lstat = sinon.stub().yields(null, new Stats({ isSymbolicLink: true })) as unknown as typeof fs.lstat;
			const stat = sinon.stub().yields(null, new Stats({ ino: 1 })) as unknown as typeof fs.stat;

			const settings = new Settings({
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
			const lstat = sinon.stub().yields(null, new Stats({ isSymbolicLink: true })) as unknown as typeof fs.lstat;
			const stat = sinon.stub().yields(new Error()) as unknown as typeof fs.stat;

			const settings = new Settings({
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
			const lstat = sinon.stub().yields(null, new Stats({ isSymbolicLink: true })) as unknown as typeof fs.lstat;
			const stat = sinon.stub().yields(new Error('broken')) as unknown as typeof fs.stat;

			const settings = new Settings({
				fs: { lstat, stat }
			});

			provider.read('filepath', settings, (error) => {
				assert.strictEqual(error.message, 'broken');
				done();
			});
		});
	});
});
