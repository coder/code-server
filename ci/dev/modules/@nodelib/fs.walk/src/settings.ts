import * as path from 'path';

import * as fsScandir from '@nodelib/fs.scandir';

import { Entry, Errno } from './types';

export type FilterFunction<T> = (value: T) => boolean;
export type DeepFilterFunction = FilterFunction<Entry>;
export type EntryFilterFunction = FilterFunction<Entry>;
export type ErrorFilterFunction = FilterFunction<Errno>;

export type Options = {
	basePath?: string;
	concurrency?: number;
	deepFilter?: DeepFilterFunction;
	entryFilter?: EntryFilterFunction;
	errorFilter?: ErrorFilterFunction;
	followSymbolicLinks?: boolean;
	fs?: Partial<fsScandir.FileSystemAdapter>;
	pathSegmentSeparator?: string;
	stats?: boolean;
	throwErrorOnBrokenSymbolicLink?: boolean;
};

export default class Settings {
	public readonly basePath?: string = this._getValue(this._options.basePath, undefined);
	public readonly concurrency: number = this._getValue(this._options.concurrency, Infinity);
	public readonly deepFilter: DeepFilterFunction | null = this._getValue(this._options.deepFilter, null);
	public readonly entryFilter: EntryFilterFunction | null = this._getValue(this._options.entryFilter, null);
	public readonly errorFilter: ErrorFilterFunction | null = this._getValue(this._options.errorFilter, null);
	public readonly pathSegmentSeparator: string = this._getValue(this._options.pathSegmentSeparator, path.sep);

	public readonly fsScandirSettings: fsScandir.Settings = new fsScandir.Settings({
		followSymbolicLinks: this._options.followSymbolicLinks,
		fs: this._options.fs,
		pathSegmentSeparator: this._options.pathSegmentSeparator,
		stats: this._options.stats,
		throwErrorOnBrokenSymbolicLink: this._options.throwErrorOnBrokenSymbolicLink
	});

	constructor(private readonly _options: Options = {}) { }

	private _getValue<T>(option: T | undefined, value: T): T {
		return option ?? value;
	}
}
