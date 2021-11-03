import * as fs from 'fs';

import { Dirent, Stats } from '../types';

class DirentFromStats implements fs.Dirent {
	public isBlockDevice: Stats['isBlockDevice'];
	public isCharacterDevice: Stats['isCharacterDevice'];
	public isDirectory: Stats['isDirectory'];
	public isFIFO: Stats['isFIFO'];
	public isFile: Stats['isFile'];
	public isSocket: Stats['isSocket'];
	public isSymbolicLink: Stats['isSymbolicLink'];

	constructor(public name: string, stats: Stats) {
		this.isBlockDevice = stats.isBlockDevice.bind(stats);
		this.isCharacterDevice = stats.isCharacterDevice.bind(stats);
		this.isDirectory = stats.isDirectory.bind(stats);
		this.isFIFO = stats.isFIFO.bind(stats);
		this.isFile = stats.isFile.bind(stats);
		this.isSocket = stats.isSocket.bind(stats);
		this.isSymbolicLink = stats.isSymbolicLink.bind(stats);
	}
}

export function createDirentFromStats(name: string, stats: Stats): Dirent {
	return new DirentFromStats(name, stats);
}
