import * as fs from 'fs';

export type FileSystemAdapter = {
	lstat: typeof fs.lstat;
	stat: typeof fs.stat;
	lstatSync: typeof fs.lstatSync;
	statSync: typeof fs.statSync;
};

export const FILE_SYSTEM_ADAPTER: FileSystemAdapter = {
	lstat: fs.lstat,
	stat: fs.stat,
	lstatSync: fs.lstatSync,
	statSync: fs.statSync
};

export function createFileSystemAdapter(fsMethods?: Partial<FileSystemAdapter>): FileSystemAdapter {
	if (fsMethods === undefined) {
		return FILE_SYSTEM_ADAPTER;
	}

	return {
		...FILE_SYSTEM_ADAPTER,
		...fsMethods
	};
}
