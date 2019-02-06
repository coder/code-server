import * as path from "path";
const textDecoder = new (typeof TextDecoder === "undefined" ? require("text-encoding").TextDecoder : TextDecoder)();

/**
 * Tar represents a tar archive.
 */
export class Tar {
	/**
	 * Return a tar object from a Uint8Array.
	 */
	public static fromUint8Array(array: Uint8Array): Tar {
		const reader = new Reader(array);

		const tar = new Tar();

		while (true) {
			try {
				const file = TarFile.fromReader(reader);
				if (file) {
					tar._files.set(path.normalize(file.name), file);
				}
			} catch (e) {
				if (e.message === "EOF") {
					break;
				}
				throw e;
			}
		}

		reader.unclamp();

		return tar;
	}

	private readonly _files: Map<string, TarFile>;

	private constructor() {
		this._files = new Map();
	}

	public get files(): ReadonlyMap<string, TarFile> {
		return this._files;
	}
}

/**
 * Represents a tar files location within a reader
 */
export class TarFile {
	/**
	 * Locate a tar file from a reader.
	 */
	public static fromReader(reader: Reader): TarFile | undefined {
		const firstByte = reader.peek(1)[0];
		// If the first byte is nil, we know it isn't a filename
		if (firstByte === 0x00) {
			// The tar header is 512 bytes large. Its safe to skip here
			// because we know this block is not a header
			reader.skip(512);

			return undefined;
		}

		let name = reader.readString(100);

		reader.skip(8); // 100->108 mode
		reader.skip(8); // 108->116 uid
		reader.skip(8); // 116->124 gid

		const rawSize = reader.read(12); // 124->136 size

		reader.skip(12); // 136->148 mtime

		if (reader.jump(345).readByte()) {
			name = reader.jump(345).readString(155) + "/" + name;
		}

		const nums: number[] = [];
		rawSize.forEach((a) => nums.push(a));

		const parseSize = (): number => {
			let offset = 0;
			// While 48 (ASCII value of 0), the byte is nil and considered padding.
			while (offset < rawSize.length && nums[offset] === 48) {
				offset++;
			}
			const clamp = (index: number, len: number, defaultValue: number): number => {
				if (typeof index !== "number") {
					return defaultValue;
				}
				// Coerce index to an integer.
				index = ~~index;
				if (index >= len) {
					return len;
				}
				if (index >= 0) {
					return index;
				}
				index += len;
				if (index >= 0) {
					return index;
				}

				return 0;
			};

			// Checks for the index of the POSIX file-size terminating char.
			// Falls back to GNU's tar format. If neither characters are found
			// the index will default to the end of the file size buffer.
			let i = nums.indexOf(32, offset);
			if (i === -1) {
				i = nums.indexOf(0, offset);
				if (i === -1) {
					i = rawSize.length - 1;
				}
			}

			const end = clamp(i, rawSize.length, rawSize.length - 1);
			if (end === offset) {
				return 0;
			}

			return parseInt(textDecoder.decode(rawSize.slice(offset, end)), 8);
		};

		const size = parseSize();

		const overflow = ((): number => {
			let newSize = size;
			newSize &= 511;

			return newSize && 512 - newSize;
		})();

		reader.jump(512);
		const offset = reader.offset;
		reader.skip(overflow + size);
		reader.clamp();

		const tarFile = new TarFile(reader, {
			offset,
			name,
			size,
		});

		return tarFile;
	}

	public constructor(
		private readonly reader: Reader,
		private readonly data: {
			name: string;
			size: number;
			offset: number;
		},
	) { }

	public get name(): string {
		return this.data.name;
	}

	public get size(): number {
		return this.data.size;
	}

	/**
	 * Check if the file type is a file.
	 */
	public isFile(): boolean {
		throw new Error("not implemented");
	}

	/**
	 * Read the file as a string.
	 */
	public readAsString(): string {
		return textDecoder.decode(this.read());
	}

	/**
	 * Read the file as Uint8Array.
	 */
	public read(): Uint8Array {
		return this.reader.jump(this.data.offset).read(this.data.size);
	}
}

/**
 * Reads within a Uint8Array.
 */
export class Reader {
	private array: Uint8Array;
	private _offset: number;
	private lastClamp: number;

	public constructor(array: Uint8Array) {
		this.array = array;
		this._offset = 0;
		this.lastClamp = 0;
	}

	public get offset(): number {
		return this._offset;
	}

	/**
	 * Skip the specified amount of bytes.
	 */
	public skip(amount: number): boolean {
		if (this._offset + amount > this.array.length) {
			throw new Error("EOF");
		}
		this._offset += amount;

		return true;
	}

	/**
	 * Clamp the reader at a position.
	 */
	public clamp(): void {
		this.lastClamp = this._offset;
	}

	/**
	 * Unclamp the reader.
	 */
	public unclamp(): void {
		this.lastClamp = 0;
	}

	/**
	 * Jump to a specific offset.
	 */
	public jump(offset: number): Reader {
		this._offset = offset + this.lastClamp;

		return this;
	}

	/**
	 * Peek the amount of bytes.
	 */
	public peek(amount: number): Uint8Array {
		return this.array.slice(this.offset, this.offset + amount);
	}

	/**
	 * Read a string.
	 */
	public readString(amount: number): string {
		// Replacing the 0s removes all nil bytes from the str
		return textDecoder.decode(this.read(amount)).replace(/\0/g, "");
	}

	/**
	 * Read a byte in the array.
	 */
	public readByte(): number {
		const data = this.array[this._offset];
		this._offset++;

		return data;
	}

	/**
	 * Read the amount of bytes.
	 */
	public read(amount: number): Uint8Array {
		if (this._offset > this.array.length) {
			throw new Error("EOF");
		}

		const data = this.array.slice(this._offset, this._offset + amount);
		this._offset += amount;

		return data;
	}
}
