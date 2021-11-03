import { Readable } from 'stream';
import AsyncReader from '../readers/async';
import Settings from '../settings';

export default class StreamProvider {
	protected readonly _reader: AsyncReader = new AsyncReader(this._root, this._settings);
	protected readonly _stream: Readable = new Readable({
		objectMode: true,
		read: () => { /* noop */ },
		destroy: () => {
			if (!this._reader.isDestroyed) {
				this._reader.destroy();
			}
		}
	});

	constructor(private readonly _root: string, private readonly _settings: Settings) { }

	public read(): Readable {
		this._reader.onError((error) => {
			this._stream.emit('error', error);
		});

		this._reader.onEntry((entry) => {
			this._stream.push(entry);
		});

		this._reader.onEnd(() => {
			this._stream.push(null);
		});

		this._reader.read();

		return this._stream;
	}
}
