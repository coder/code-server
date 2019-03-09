import { EventEmitter } from "events";
import * as fs from "fs";
import { callbackify } from "util";
import { FsProxy, WriteStreamProxy, WatcherProxy, Stats as IStats } from "../../common/proxy";
import { IEncodingOptions, IEncodingOptionsCallback } from "../../common/util";
import { WritableStream } from "./stream";

// `any` is used to match the fs interface.
// tslint:disable no-any

class Watcher extends EventEmitter implements fs.FSWatcher {
	public constructor(private readonly watcherProxyPromise: Promise<WatcherProxy>) {
		super();
		this.watcherProxyPromise.then((p) => {
			p.on("change", (event, filename) => this.emit("change", event, filename));
			p.on("close", () => this.emit("close"));
			p.on("error", (error) => this.emit("error", error));
		}).catch((e) => this.emit("error", e));
	}

	public close(): void {
		this.watcherProxyPromise.then((p) => p.close());
	}
}

class WriteStream extends WritableStream implements fs.WriteStream {
	private _bytesWritten: number = 0;

	public constructor(writeStreamProxyPromise: Promise<WriteStreamProxy>) {
		super(writeStreamProxyPromise);
		this.writeStreamProxyPromise.then((p) => {
			p.on("open", (fd) => this.emit("open", fd));
			p.on("close", () => this.emit("close"));
		});
	}

	public get bytesWritten(): number {
		return this._bytesWritten;
	}

	public get path(): string | Buffer {
		return "";
	}

	public close(): void {
		this.writeStreamProxyPromise.then((p) => p.close());
	}

	public destroy(): void {
		this.writeStreamProxyPromise.then((p) => p.destroy());
	}
}

/**
 * Implements the native fs module. Doesn't use `implements typeof import("fs")`
 * to remove need for __promisify__ implementations.
 */
export class Fs {
	public constructor(private readonly proxy: FsProxy) {}

	public access = (path: fs.PathLike, mode: number | undefined | ((err: NodeJS.ErrnoException) => void), callback?: (err: NodeJS.ErrnoException) => void): void => {
		if (typeof mode === "function") {
			callback = mode;
			mode = undefined;
		}
		callbackify(this.proxy.access)(path, mode, callback!);
	}

	public appendFile = (path: fs.PathLike | number, data: any, options?: fs.WriteFileOptions | ((err: NodeJS.ErrnoException) => void), callback?: (err: NodeJS.ErrnoException) => void): void => {
		if (typeof options === "function") {
			callback = options;
			options = undefined;
		}
		callbackify(this.proxy.appendFile)(path, data, options, callback!);
	}

	public chmod = (path: fs.PathLike, mode: string | number, callback: (err: NodeJS.ErrnoException) => void): void => {
		callbackify(this.proxy.chmod)(path, mode, callback!);
	}

	public chown = (path: fs.PathLike, uid: number, gid: number, callback: (err: NodeJS.ErrnoException) => void): void => {
		callbackify(this.proxy.chown)(path, uid, gid, callback!);
	}

	public close = (fd: number, callback: (err: NodeJS.ErrnoException) => void): void => {
		callbackify(this.proxy.close)(fd, callback!);
	}

	public copyFile = (src: fs.PathLike, dest: fs.PathLike, flags: number | ((err: NodeJS.ErrnoException) => void), callback?: (err: NodeJS.ErrnoException) => void): void => {
		if (typeof flags === "function") {
			callback = flags;
		}
		callbackify(this.proxy.copyFile)(
			src, dest, typeof flags !== "function" ? flags : undefined, callback!,
		);
	}

	public createWriteStream = (path: fs.PathLike, options?: any): fs.WriteStream => {
		return new WriteStream(this.proxy.createWriteStream(path, options));
	}

	public exists = (path: fs.PathLike, callback: (exists: boolean) => void): void => {
		callbackify(this.proxy.exists)(path, (_error, exists) => {
			callback!(exists);
		});
	}

	public fchmod = (fd: number, mode: string | number, callback: (err: NodeJS.ErrnoException) => void): void => {
		callbackify(this.proxy.fchmod)(fd, mode, callback!);
	}

	public fchown = (fd: number, uid: number, gid: number, callback: (err: NodeJS.ErrnoException) => void): void => {
		callbackify(this.proxy.fchown)(fd, uid, gid, callback!);
	}

	public fdatasync = (fd: number, callback: (err: NodeJS.ErrnoException) => void): void => {
		callbackify(this.proxy.fdatasync)(fd, callback!);
	}

	public fstat = (fd: number, callback: (err: NodeJS.ErrnoException, stats: fs.Stats) => void): void => {
		callbackify(this.proxy.fstat)(fd, (error, stats) => {
			callback(error, stats && new Stats(stats));
		});
	}

	public fsync = (fd: number, callback: (err: NodeJS.ErrnoException) => void): void => {
		callbackify(this.proxy.fsync)(fd, callback!);
	}

	public ftruncate = (fd: number, len: number | undefined | null | ((err: NodeJS.ErrnoException) => void), callback?: (err: NodeJS.ErrnoException) => void): void => {
		if (typeof len === "function") {
			callback = len;
			len = undefined;
		}
		callbackify(this.proxy.ftruncate)(fd, len, callback!);
	}

	public futimes = (fd: number, atime: string | number | Date, mtime: string | number | Date, callback: (err: NodeJS.ErrnoException) => void): void => {
		callbackify(this.proxy.futimes)(fd, atime, mtime, callback!);
	}

	public lchmod = (path: fs.PathLike, mode: string | number, callback: (err: NodeJS.ErrnoException) => void): void => {
		callbackify(this.proxy.lchmod)(path, mode, callback!);
	}

	public lchown = (path: fs.PathLike, uid: number, gid: number, callback: (err: NodeJS.ErrnoException) => void): void => {
		callbackify(this.proxy.lchown)(path, uid, gid, callback!);
	}

	public link = (existingPath: fs.PathLike, newPath: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void => {
		callbackify(this.proxy.link)(existingPath, newPath, callback!);
	}

	public lstat = (path: fs.PathLike, callback: (err: NodeJS.ErrnoException, stats: fs.Stats) => void): void => {
		callbackify(this.proxy.lstat)(path, (error, stats) => {
			callback(error, stats && new Stats(stats));
		});
	}

	public mkdir = (path: fs.PathLike, mode: number | string | fs.MakeDirectoryOptions | undefined | null | ((err: NodeJS.ErrnoException) => void), callback?: (err: NodeJS.ErrnoException) => void): void => {
		if (typeof mode === "function") {
			callback = mode;
			mode = undefined;
		}
		callbackify(this.proxy.mkdir)(path, mode, callback!);
	}

	public mkdtemp = (prefix: string, options: IEncodingOptionsCallback, callback?: (err: NodeJS.ErrnoException, folder: string | Buffer) => void): void => {
		if (typeof options === "function") {
			callback = options;
			options = undefined;
		}
		callbackify(this.proxy.mkdtemp)(prefix, options, callback!);
	}

	public open = (path: fs.PathLike, flags: string | number, mode: string | number | undefined | null | ((err: NodeJS.ErrnoException, fd: number) => void), callback?: (err: NodeJS.ErrnoException, fd: number) => void): void => {
		if (typeof mode === "function") {
			callback = mode;
			mode = undefined;
		}
		callbackify(this.proxy.open)(path, flags, mode, callback!);
	}

	public read = <TBuffer extends Buffer | Uint8Array>(fd: number, buffer: TBuffer, offset: number, length: number, position: number | null, callback: (err: NodeJS.ErrnoException, bytesRead: number, buffer: TBuffer) => void): void => {
		this.proxy.read(fd, Buffer.from([]), offset, length, position).then((response) => {
			buffer.set(response.buffer, offset);
			callback(undefined!, response.bytesRead, buffer);
		}).catch((error) => {
			callback(error, undefined!, undefined!);
		});
	}

	public readFile = (path: fs.PathLike | number, options: IEncodingOptionsCallback, callback?: (err: NodeJS.ErrnoException, data: string | Buffer) => void): void => {
		if (typeof options === "function") {
			callback = options;
			options = undefined;
		}
		callbackify(this.proxy.readFile)(path, options, callback!);
	}

	public readdir = (path: fs.PathLike, options: IEncodingOptionsCallback, callback?: (err: NodeJS.ErrnoException, files: Buffer[] | fs.Dirent[] | string[]) => void): void => {
		if (typeof options === "function") {
			callback = options;
			options = undefined;
		}
		callbackify(this.proxy.readdir)(path, options, callback!);
	}

	public readlink = (path: fs.PathLike, options: IEncodingOptionsCallback, callback?: (err: NodeJS.ErrnoException, linkString: string | Buffer) => void): void => {
		if (typeof options === "function") {
			callback = options;
			options = undefined;
		}
		callbackify(this.proxy.readlink)(path, options, callback!);
	}

	public realpath = (path: fs.PathLike, options: IEncodingOptionsCallback, callback?: (err: NodeJS.ErrnoException, resolvedPath: string | Buffer) => void): void => {
		if (typeof options === "function") {
			callback = options;
			options = undefined;
		}
		callbackify(this.proxy.realpath)(path, options, callback!);
	}

	public rename = (oldPath: fs.PathLike, newPath: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void => {
		callbackify(this.proxy.rename)(oldPath, newPath, callback!);
	}

	public rmdir = (path: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void => {
		callbackify(this.proxy.rmdir)(path, callback!);
	}

	public stat = (path: fs.PathLike, callback: (err: NodeJS.ErrnoException, stats: fs.Stats) => void): void => {
		callbackify(this.proxy.stat)(path, (error, stats) => {
			callback(error, stats && new Stats(stats));
		});
	}

	public symlink = (target: fs.PathLike, path: fs.PathLike, type: fs.symlink.Type | undefined | null | ((err: NodeJS.ErrnoException) => void), callback?: (err: NodeJS.ErrnoException) => void): void => {
		if (typeof type === "function") {
			callback = type;
			type = undefined;
		}
		callbackify(this.proxy.symlink)(target, path, type, callback!);
	}

	public truncate = (path: fs.PathLike, len: number | undefined | null | ((err: NodeJS.ErrnoException) => void), callback?: (err: NodeJS.ErrnoException) => void): void => {
		if (typeof len === "function") {
			callback = len;
			len = undefined;
		}
		callbackify(this.proxy.truncate)(path, len, callback!);
	}

	public unlink = (path: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void => {
		callbackify(this.proxy.unlink)(path, callback!);
	}

	public utimes = (path: fs.PathLike, atime: string | number | Date, mtime: string | number | Date, callback: (err: NodeJS.ErrnoException) => void): void => {
		callbackify(this.proxy.utimes)(path, atime, mtime, callback!);
	}

	public write = <TBuffer extends Buffer | Uint8Array>(fd: number, buffer: TBuffer, offset: number | undefined | ((err: NodeJS.ErrnoException, written: number, buffer: TBuffer) => void), length: number | undefined | ((err: NodeJS.ErrnoException, written: number, buffer: TBuffer) => void), position: number | undefined | ((err: NodeJS.ErrnoException, written: number, buffer: TBuffer) => void), callback?: (err: NodeJS.ErrnoException, written: number, buffer: TBuffer) => void): void => {
		if (typeof offset === "function") {
			callback = offset;
			offset = undefined;
		}
		if (typeof length === "function") {
			callback = length;
			length = undefined;
		}
		if (typeof position === "function") {
			callback = position;
			position = undefined;
		}
		this.proxy.write(fd, buffer, offset, length, position).then((r) => {
			callback!(undefined!, r.bytesWritten, r.buffer);
		}).catch((error) => {
			callback!(error, undefined!, undefined!);
		});
	}

	public writeFile = (path: fs.PathLike | number, data: any, options: IEncodingOptionsCallback, callback?: (err: NodeJS.ErrnoException) => void): void => {
		if (typeof options === "function") {
			callback = options;
			options = undefined;
		}
		callbackify(this.proxy.writeFile)(path, data, options, callback!);
	}

	public watch = (filename: fs.PathLike, options?: IEncodingOptions | ((event: string, filename: string | Buffer) => void), listener?: ((event: string, filename: string | Buffer) => void)): fs.FSWatcher => {
		if (typeof options === "function") {
			listener = options;
			options = undefined;
		}

		const watcherProxyPromise = this.proxy.watch(filename, options);
		if (listener) {
			watcherProxyPromise.then((p) => p.on("listener", listener!));
		}

		return new Watcher(watcherProxyPromise);
	}
}

class Stats implements fs.Stats {
	public readonly atime: Date;
	public readonly mtime: Date;
	public readonly ctime: Date;
	public readonly birthtime: Date;

	public constructor(private readonly stats: IStats) {
		this.atime = new Date(stats.atime);
		this.mtime = new Date(stats.mtime);
		this.ctime = new Date(stats.ctime);
		this.birthtime = new Date(stats.birthtime);
	}

	public get dev(): number { return this.stats.dev; }
	public get ino(): number { return this.stats.ino; }
	public get mode(): number { return this.stats.mode; }
	public get nlink(): number { return this.stats.nlink; }
	public get uid(): number { return this.stats.uid; }
	public get gid(): number { return this.stats.gid; }
	public get rdev(): number { return this.stats.rdev; }
	public get size(): number { return this.stats.size; }
	public get blksize(): number { return this.stats.blksize; }
	public get blocks(): number { return this.stats.blocks; }
	public get atimeMs(): number { return this.stats.atimeMs; }
	public get mtimeMs(): number { return this.stats.mtimeMs; }
	public get ctimeMs(): number { return this.stats.ctimeMs; }
	public get birthtimeMs(): number { return this.stats.birthtimeMs; }
	public isFile(): boolean { return this.stats._isFile; }
	public isDirectory(): boolean { return this.stats._isDirectory; }
	public isBlockDevice(): boolean { return this.stats._isBlockDevice; }
	public isCharacterDevice(): boolean { return this.stats._isCharacterDevice; }
	public isSymbolicLink(): boolean { return this.stats._isSymbolicLink; }
	public isFIFO(): boolean { return this.stats._isFIFO; }
	public isSocket(): boolean { return this.stats._isSocket; }

	public toObject(): object {
		return JSON.parse(JSON.stringify(this));
	}
}
