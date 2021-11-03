import * as fs from 'fs';

export type Entry = {
	dirent: Dirent;
	name: string;
	path: string;
	stats?: Stats;
};

export type Stats = fs.Stats;

export type Dirent = {
	isBlockDevice(): boolean;
	isCharacterDevice(): boolean;
	isDirectory(): boolean;
	isFIFO(): boolean;
	isFile(): boolean;
	isSocket(): boolean;
	isSymbolicLink(): boolean;
	name: string;
};
