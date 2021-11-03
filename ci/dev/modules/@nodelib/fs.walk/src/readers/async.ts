import { EventEmitter } from 'events';

import * as fsScandir from '@nodelib/fs.scandir';
import * as fastq from 'fastq';

import Settings from '../settings';
import { Entry, Errno, QueueItem } from '../types';
import * as common from './common';
import Reader from './reader';

type EntryEventCallback = (entry: Entry) => void;
type ErrorEventCallback = (error: Errno) => void;
type EndEventCallback = () => void;

export default class AsyncReader extends Reader {
	protected readonly _scandir: typeof fsScandir.scandir = fsScandir.scandir;
	protected readonly _emitter: EventEmitter = new EventEmitter();

	private readonly _queue: fastq.queue = fastq(this._worker.bind(this), this._settings.concurrency);
	private _isFatalError: boolean = false;
	private _isDestroyed: boolean = false;

	constructor(_root: string, protected readonly _settings: Settings) {
		super(_root, _settings);

		this._queue.drain = () => {
			if (!this._isFatalError) {
				this._emitter.emit('end');
			}
		};
	}

	public read(): EventEmitter {
		this._isFatalError = false;
		this._isDestroyed = false;

		setImmediate(() => {
			this._pushToQueue(this._root, this._settings.basePath);
		});

		return this._emitter;
	}

	public get isDestroyed(): boolean {
		return this._isDestroyed;
	}

	public destroy(): void {
		if (this._isDestroyed) {
			throw new Error('The reader is already destroyed');
		}

		this._isDestroyed = true;
		this._queue.killAndDrain();
	}

	public onEntry(callback: EntryEventCallback): void {
		this._emitter.on('entry', callback);
	}

	public onError(callback: ErrorEventCallback): void {
		this._emitter.once('error', callback);
	}

	public onEnd(callback: EndEventCallback): void {
		this._emitter.once('end', callback);
	}

	private _pushToQueue(directory: string, base?: string): void {
		const queueItem: QueueItem = { directory, base };

		this._queue.push(queueItem, (error: Error | null) => {
			if (error !== null) {
				this._handleError(error);
			}
		});
	}

	private _worker(item: QueueItem, done: fastq.done): void {
		this._scandir(item.directory, this._settings.fsScandirSettings, (error: NodeJS.ErrnoException | null, entries) => {
			if (error !== null) {
				return done(error, undefined);
			}

			for (const entry of entries) {
				this._handleEntry(entry, item.base);
			}

			done(null as unknown as Error, undefined);
		});
	}

	private _handleError(error: Error): void {
		if (this._isDestroyed || !common.isFatalError(this._settings, error)) {
			return;
		}

		this._isFatalError = true;
		this._isDestroyed = true;
		this._emitter.emit('error', error);
	}

	private _handleEntry(entry: Entry, base?: string): void {
		if (this._isDestroyed || this._isFatalError) {
			return;
		}

		const fullpath = entry.path;

		if (base !== undefined) {
			entry.path = common.joinPathSegments(base, entry.name, this._settings.pathSegmentSeparator);
		}

		if (common.isAppliedFilter(this._settings.entryFilter, entry)) {
			this._emitEntry(entry);
		}

		if (entry.dirent.isDirectory() && common.isAppliedFilter(this._settings.deepFilter, entry)) {
			this._pushToQueue(fullpath, entry.path);
		}
	}

	private _emitEntry(entry: Entry): void {
		this._emitter.emit('entry', entry);
	}
}
