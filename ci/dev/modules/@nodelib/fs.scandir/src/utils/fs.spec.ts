import * as assert from 'assert';

import { Stats } from '../../../fs.macchiato';
import * as util from './fs';

describe('Utils → FS', () => {
	describe('.createDirentFromStats', () => {
		it('should convert fs.Stats to fs.Dirent', () => {
			const actual = util.createDirentFromStats('name', new Stats());

			assert.strictEqual(actual.name, 'name');
			assert.ok(!actual.isBlockDevice());
			assert.ok(!actual.isCharacterDevice());
			assert.ok(!actual.isDirectory());
			assert.ok(!actual.isFIFO());
			assert.ok(actual.isFile());
			assert.ok(!actual.isSocket());
			assert.ok(!actual.isSymbolicLink());
		});
	});
});
