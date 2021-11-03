import * as fs from './adapters/fs';

export type Options = {
	followSymbolicLink?: boolean;
	fs?: Partial<fs.FileSystemAdapter>;
	markSymbolicLink?: boolean;
	throwErrorOnBrokenSymbolicLink?: boolean;
};

export default class Settings {
	public readonly followSymbolicLink: boolean = this._getValue(this._options.followSymbolicLink, true);
	public readonly fs: fs.FileSystemAdapter = fs.createFileSystemAdapter(this._options.fs);
	public readonly markSymbolicLink: boolean = this._getValue(this._options.markSymbolicLink, false);
	public readonly throwErrorOnBrokenSymbolicLink: boolean = this._getValue(this._options.throwErrorOnBrokenSymbolicLink, true);

	constructor(private readonly _options: Options = {}) { }

	private _getValue<T>(option: T | undefined, value: T): T {
		return option ?? value;
	}
}
