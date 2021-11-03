import * as fsStat from '@nodelib/fs.stat';

import { IS_SUPPORT_READDIR_WITH_FILE_TYPES } from '../constants';
import Settings from '../settings';
import { Entry } from '../types';
import * as utils from '../utils';
import * as common from './common';

export function read(directory: string, settings: Settings): Entry[] {
	if (!settings.stats && IS_SUPPORT_READDIR_WITH_FILE_TYPES) {
		return readdirWithFileTypes(directory, settings);
	}

	return readdir(directory, settings);
}

export function readdirWithFileTypes(directory: string, settings: Settings): Entry[] {
	const dirents = settings.fs.readdirSync(directory, { withFileTypes: true });

	return dirents.map((dirent) => {
		const entry: Entry = {
			dirent,
			name: dirent.name,
			path: common.joinPathSegments(directory, dirent.name, settings.pathSegmentSeparator)
		};

		if (entry.dirent.isSymbolicLink() && settings.followSymbolicLinks) {
			try {
				const stats = settings.fs.statSync(entry.path);

				entry.dirent = utils.fs.createDirentFromStats(entry.name, stats);
			} catch (error) {
				if (settings.throwErrorOnBrokenSymbolicLink) {
					throw error;
				}
			}
		}

		return entry;
	});
}

export function readdir(directory: string, settings: Settings): Entry[] {
	const names = settings.fs.readdirSync(directory);

	return names.map((name) => {
		const entryPath = common.joinPathSegments(directory, name, settings.pathSegmentSeparator);
		const stats = fsStat.statSync(entryPath, settings.fsStatSettings);

		const entry: Entry = {
			name,
			path: entryPath,
			dirent: utils.fs.createDirentFromStats(name, stats)
		};

		if (settings.stats) {
			entry.stats = stats;
		}

		return entry;
	});
}
