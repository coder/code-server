import { Readable } from 'stream';

import { Dirent, FileSystemAdapter } from '@nodelib/fs.scandir';

import AsyncProvider, { AsyncCallback } from './providers/async';
import StreamProvider from './providers/stream';
import SyncProvider from './providers/sync';
import Settings, { DeepFilterFunction, EntryFilterFunction, ErrorFilterFunction, Options } from './settings';
import { Entry } from './types';

function walk(directory: string, callback: AsyncCallback): void;
function walk(directory: string, optionsOrSettings: Options | Settings, callback: AsyncCallback): void;
function walk(directory: string, optionsOrSettingsOrCallback: Options | Settings | AsyncCallback, callback?: AsyncCallback): void {
	if (typeof optionsOrSettingsOrCallback === 'function') {
		return new AsyncProvider(directory, getSettings()).read(optionsOrSettingsOrCallback);
	}

	new AsyncProvider(directory, getSettings(optionsOrSettingsOrCallback)).read(callback as AsyncCallback);
}

// https://github.com/typescript-eslint/typescript-eslint/issues/60
// eslint-disable-next-line no-redeclare
declare namespace walk {
	function __promisify__(directory: string, optionsOrSettings?: Options | Settings): Promise<Entry[]>;
}

function walkSync(directory: string, optionsOrSettings?: Options | Settings): Entry[] {
	const settings = getSettings(optionsOrSettings);
	const provider = new SyncProvider(directory, settings);

	return provider.read();
}

function walkStream(directory: string, optionsOrSettings?: Options | Settings): Readable {
	const settings = getSettings(optionsOrSettings);
	const provider = new StreamProvider(directory, settings);

	return provider.read();
}

function getSettings(settingsOrOptions: Settings | Options = {}): Settings {
	if (settingsOrOptions instanceof Settings) {
		return settingsOrOptions;
	}

	return new Settings(settingsOrOptions);
}

export {
	walk,
	walkSync,
	walkStream,
	Settings,

	AsyncCallback,
	Dirent,
	Entry,
	FileSystemAdapter,
	Options,
	DeepFilterFunction,
	EntryFilterFunction,
	ErrorFilterFunction
};
