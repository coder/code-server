import Settings from '../settings';
import { Stats } from '../types';

export function read(path: string, settings: Settings): Stats {
	const lstat = settings.fs.lstatSync(path);

	if (!lstat.isSymbolicLink() || !settings.followSymbolicLink) {
		return lstat;
	}

	try {
		const stat = settings.fs.statSync(path);

		if (settings.markSymbolicLink) {
			stat.isSymbolicLink = () => true;
		}

		return stat;
	} catch (error) {
		if (!settings.throwErrorOnBrokenSymbolicLink) {
			return lstat;
		}

		throw error;
	}
}
