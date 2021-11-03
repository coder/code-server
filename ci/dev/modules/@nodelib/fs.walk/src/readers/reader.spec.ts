import * as assert from 'assert';
import * as path from 'path';

import Settings, { Options } from '../settings';
import Reader from './reader';

class TestReader extends Reader {
	public get root(): string {
		return this._root;
	}
}

function getReader(root: string, options: Options = {}): TestReader {
	return new TestReader(root, new Settings(options));
}

describe('Readers → Reader', () => {
	describe('Constructor', () => {
		it('should return root path with replaced path segment separators', () => {
			const root = path.join('directory', 'file.txt');
			const reader = getReader(root, { pathSegmentSeparator: '_' });

			const expected = 'directory_file.txt';

			const actual = reader.root;

			assert.strictEqual(actual, expected);
		});
	});
});
