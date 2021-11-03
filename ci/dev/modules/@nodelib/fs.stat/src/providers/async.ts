import Settings from '../settings';
import { ErrnoException, Stats } from '../types';

type FailureCallback = (err: ErrnoException) => void;
type SuccessCallback = (err: null, stats: Stats) => void;

export type AsyncCallback = (err: ErrnoException, stats: Stats) => void;

export function read(path: string, settings: Settings, callback: AsyncCallback): void {
	settings.fs.lstat(path, (lstatError, lstat) => {
		if (lstatError !== null) {
			return callFailureCallback(callback, lstatError);
		}

		if (!lstat.isSymbolicLink() || !settings.followSymbolicLink) {
			return callSuccessCallback(callback, lstat);
		}

		settings.fs.stat(path, (statError, stat) => {
			if (statError !== null) {
				if (settings.throwErrorOnBrokenSymbolicLink) {
					return callFailureCallback(callback, statError);
				}

				return callSuccessCallback(callback, lstat);
			}

			if (settings.markSymbolicLink) {
				stat.isSymbolicLink = () => true;
			}

			callSuccessCallback(callback, stat);
		});
	});
}

function callFailureCallback(callback: AsyncCallback, error: ErrnoException): void {
	(callback as FailureCallback)(error);
}

function callSuccessCallback(callback: AsyncCallback, result: Stats): void {
	(callback as unknown as SuccessCallback)(null, result);
}
