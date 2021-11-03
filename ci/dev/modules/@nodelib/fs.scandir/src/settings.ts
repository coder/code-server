import * as path from 'path';

import * as fsStat from '@nodelib/fs.stat';

import * as fs from './adapters/fs';

export type Options = {
	followSymbolicLinks?: boolean;
	fs?: Partial<fs.FileSystemAdapter>;
	pathSegmentSeparator?: string;
	stats?: boolean;
	throwErrorOnBrokenSymbolicLink?: boolean;
};

export default class Settings {
	public readonly followSymbolicLinks: boolean = this._getValue(this._options.followSymbolicLinks, false);
	public readonly fs: fs.FileSystemAdapter = fs.createFileSystemAdapter(this._options.fs);
	public readonly pathSegmentSeparator: string = this._getValue(this._options.pathSegmentSeparator, path.sep);
	public readonly stats: boolean = this._getValue(this._options.stats, false);
	public readonly throwErrorOnBrokenSymbolicLink: boolean = this._getValue(this._options.throwErrorOnBrokenSymbolicLink, true);

	public readonly fsStatSettings: fsStat.Settings = new fsStat.Settings({
		followSymbolicLink: this.followSymbolicLinks,
		fs: this.fs,
		throwErrorOnBrokenSymbolicLink: this.throwErrorOnBrokenSymbolicLink
	});

	constructor(private readonly _options: Options = {}) { }

	private _getValue<T>(option: T | undefined, value: T): T {
		return option ?? value;
	}
}
