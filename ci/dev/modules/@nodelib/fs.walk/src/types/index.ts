import * as scandir from '@nodelib/fs.scandir';

export type Entry = scandir.Entry;
export type Errno = NodeJS.ErrnoException;

export type QueueItem = {
	directory: string;
	base?: string;
};
