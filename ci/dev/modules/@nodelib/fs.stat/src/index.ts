import { FileSystemAdapter } from './adapters/fs';
import * as async from './providers/async';
import * as sync from './providers/sync';
import Settings, { Options } from './settings';
import { Stats } from './types';

type AsyncCallback = async.AsyncCallback;

function stat(path: string, callback: AsyncCallback): void;
function stat(path: string, optionsOrSettings: Options | Settings, callback: AsyncCallback): void;
function stat(path: string, optionsOrSettingsOrCallback: Options | Settings | AsyncCallback, callback?: AsyncCallback): void {
	if (typeof optionsOrSettingsOrCallback === 'function') {
		return async.read(path, getSettings(), optionsOrSettingsOrCallback);
	}

	async.read(path, getSettings(optionsOrSettingsOrCallback), callback as AsyncCallback);
}

// https://github.com/typescript-eslint/typescript-eslint/issues/60
// eslint-disable-next-line no-redeclare
declare namespace stat {
	function __promisify__(path: string, optionsOrSettings?: Options | Settings): Promise<Stats>;
}

function statSync(path: string, optionsOrSettings?: Options | Settings): Stats {
	const settings = getSettings(optionsOrSettings);

	return sync.read(path, settings);
}

function getSettings(settingsOrOptions: Settings | Options = {}): Settings {
	if (settingsOrOptions instanceof Settings) {
		return settingsOrOptions;
	}

	return new Settings(settingsOrOptions);
}

export {
	Settings,
	stat,
	statSync,

	// https://github.com/typescript-eslint/typescript-eslint/issues/131
	// eslint-disable-next-line no-undef
	AsyncCallback,
	FileSystemAdapter,
	Options,
	Stats
};
