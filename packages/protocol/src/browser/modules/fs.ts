import * as fs from "fs";
import { callbackify } from "util";
import { ClientProxy, Batch } from "../../common/proxy";
import { IEncodingOptions, IEncodingOptionsCallback } from "../../common/util";
import { FsModuleProxy, Stats as IStats, WatcherProxy, WriteStreamProxy } from "../../node/modules/fs";
import { Writable  } from "./stream";

// tslint:disable no-any
// tslint:disable completed-docs

class StatBatch extends Batch<IStats, { path: fs.PathLike }> {
	public constructor(private readonly proxy: FsModuleProxy) {
		super();
	}

	protected remoteCall(batch: { path: fs.PathLike }[]): Promise<(IStats | Error)[]> {
		return this.proxy.statBatch(batch);
	}
}

class LstatBatch extends Batch<IStats, { path: fs.PathLike }> {
	public constructor(private readonly proxy: FsModuleProxy) {
		super();
	}

	protected remoteCall(batch: { path: fs.PathLike }[]): Promise<(IStats | Error)[]> {
		return this.proxy.lstatBatch(batch);
	}
}

class ReaddirBatch extends Batch<Buffer[] | fs.Dirent[] | string[], { path: fs.PathLike, options: IEncodingOptions }> {
	public constructor(private readonly proxy: FsModuleProxy) {
		super();
	}

	protected remoteCall(queue: { path: fs.PathLike, options: IEncodingOptions }[]): Promise<(Buffer[] | fs.Dirent[] | string[] | Error)[]> {
		return this.proxy.readdirBatch(queue);
	}
}

class Watcher extends ClientProxy<WatcherProxy> implements fs.FSWatcher {
	public close(): void {
		this.catch(this.proxy.close());
	}

	protected handleDisconnect(): void {
		this.emit("close");
	}
}

class WriteStream extends Writable<WriteStreamProxy> implements fs.WriteStream {
	public get bytesWritten(): number {
		throw new Error("not implemented");
	}

	public get path(): string | Buffer {
		throw new Error("not implemented");
	}

	public close(): void {
		this.catch(this.proxy.close());
	}
}

export class FsModule {
	private readonly statBatch: StatBatch;
	private readonly lstatBatch: LstatBatch;
	private readonly readdirBatch: ReaddirBatch;

	public constructor(private readonly proxy: FsModuleProxy) {
		this.statBatch = new StatBatch(this.proxy);
		this.lstatBatch = new LstatBatch(this.proxy);
		this.readdirBatch = new ReaddirBatch(this.proxy);
	}

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
		this.proxy.exists(path).then((exists) => callback(exists)).catch(() => callback(false));
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
		callbackify(this.lstatBatch.add)({ path }, (error, stats) => {
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

	public read = (fd: number, buffer: Buffer, offset: number, length: number, position: number | null, callback: (err: NodeJS.ErrnoException, bytesRead: number, buffer: Buffer) => void): void => {
		this.proxy.read(fd, length, position).then((response) => {
			buffer.set(response.buffer, offset);
			callback(undefined!, response.bytesRead, response.buffer);
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
		callbackify(this.readdirBatch.add)({ path, options }, callback!);
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
		callbackify(this.statBatch.add)({ path }, (error, stats) => {
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

	public write = (fd: number, buffer: Buffer, offset: number | undefined | ((err: NodeJS.ErrnoException, written: number, buffer: Buffer) => void), length: number | undefined | ((err: NodeJS.ErrnoException, written: number, buffer: Buffer) => void), position: number | undefined | ((err: NodeJS.ErrnoException, written: number, buffer: Buffer) => void), callback?: (err: NodeJS.ErrnoException, written: number, buffer: Buffer) => void): void => {
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

		const watcher = new Watcher(this.proxy.watch(filename, options));
		if (listener) {
			watcher.on("change", listener);
		}

		return watcher;
	}
}

class Stats implements fs.Stats {
	public constructor(private readonly stats: IStats) {}

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
	public get atime(): Date { return this.stats.atime; }
	public get mtime(): Date { return this.stats.mtime; }
	public get ctime(): Date { return this.stats.ctime; }
	public get birthtime(): Date { return this.stats.birthtime; }
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
