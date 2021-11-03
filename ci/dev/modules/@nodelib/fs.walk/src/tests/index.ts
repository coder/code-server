import * as sinon from 'sinon';

import { Dirent } from '../../../fs.macchiato';
import { Entry, Errno } from '../types';

export function buildFakeFileEntry(entry?: Partial<Entry>): Entry {
	return {
		name: 'fake.txt',
		path: 'directory/fake.txt',
		dirent: new Dirent({ name: 'fake.txt' }),
		...entry
	};
}

export function buildFakeDirectoryEntry(entry?: Partial<Entry>): Entry {
	return {
		name: 'fake',
		path: 'directory/fake',
		dirent: new Dirent({ name: 'fake', isFile: false, isDirectory: true }),
		...entry
	};
}

export const EPERM_ERRNO: Errno = {
	name: 'EPERM',
	code: 'EPERM',
	message: 'EPERM'
};

export class TestAsyncReader {
	public read: sinon.SinonStub = sinon.stub();
	public destroy: sinon.SinonStub = sinon.stub();
	public onError: sinon.SinonStub = sinon.stub();
	public onEntry: sinon.SinonStub = sinon.stub();
	public onEnd: sinon.SinonStub = sinon.stub();
}

export class TestSyncReader {
	public read: sinon.SinonStub = sinon.stub();
}
