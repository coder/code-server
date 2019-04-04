import * as fs from "fs";
import { promisify } from "util";
import { ServerProxy } from "../../common/proxy";
import { IEncodingOptions } from "../../common/util";
import { WritableProxy } from "./stream";

// tslint:disable completed-docs

/**
 * A serializable version of fs.Stats.
 */
export interface Stats {
	dev: number;
	ino: number;
	mode: number;
	nlink: number;
	uid: number;
	gid: number;
	rdev: number;
	size: number;
	blksize: number;
	blocks: number;
	atimeMs: number;
	mtimeMs: number;
	ctimeMs: number;
	birthtimeMs: number;
	atime: Date;
	mtime: Date;
	ctime: Date;
	birthtime: Date;
	_isFile: boolean;
	_isDirectory: boolean;
	_isBlockDevice: boolean;
	_isCharacterDevice: boolean;
	_isSymbolicLink: boolean;
	_isFIFO: boolean;
	_isSocket: boolean;
}

export class WriteStreamProxy extends WritableProxy<fs.WriteStream> {
	public async close(): Promise<void> {
		this.stream.close();
	}

	public async dispose(): Promise<void> {
		await super.dispose();
		this.stream.close();
	}

	// tslint:disable-next-line no-any
	public async onEvent(cb: (event: string, ...args: any[]) => void): Promise<void> {
		await super.onEvent(cb);
		this.stream.on("open", (fd) => cb("open", fd));
	}
}

export class WatcherProxy implements ServerProxy {
	public constructor(private readonly watcher: fs.FSWatcher) {}

	public async close(): Promise<void> {
		this.watcher.close();
	}

	public async dispose(): Promise<void> {
		this.watcher.close();
		this.watcher.removeAllListeners();
	}

	public async onDone(cb: () => void): Promise<void> {
		this.watcher.on("close", cb);
		this.watcher.on("error", cb);
	}

	// tslint:disable-next-line no-any
	public async onEvent(cb: (event: string, ...args: any[]) => void): Promise<void> {
		this.watcher.on("change", (event, filename) => cb("change", event, filename));
		this.watcher.on("close", () => cb("close"));
		this.watcher.on("error", (error) => cb("error", error));
	}
}

export class FsModuleProxy {
	public access(path: fs.PathLike, mode?: number): Promise<void> {
		return promisify(fs.access)(path, mode);
	}

	// tslint:disable-next-line no-any
	public appendFile(file: fs.PathLike | number, data: any, options?: fs.WriteFileOptions): Promise<void> {
		return promisify(fs.appendFile)(file, data, options);
	}

	public chmod(path: fs.PathLike, mode: string | number): Promise<void> {
		return promisify(fs.chmod)(path, mode);
	}

	public chown(path: fs.PathLike, uid: number, gid: number): Promise<void> {
		return promisify(fs.chown)(path, uid, gid);
	}

	public close(fd: number): Promise<void> {
		return promisify(fs.close)(fd);
	}

	public copyFile(src: fs.PathLike, dest: fs.PathLike, flags?: number): Promise<void> {
		return promisify(fs.copyFile)(src, dest, flags);
	}

	// tslint:disable-next-line no-any
	public async createWriteStream(path: fs.PathLike, options?: any): Promise<WriteStreamProxy> {
		return new WriteStreamProxy(fs.createWriteStream(path, options));
	}

	public exists(path: fs.PathLike): Promise<boolean> {
		return promisify(fs.exists)(path); // tslint:disable-line deprecation
	}

	public fchmod(fd: number, mode: string | number): Promise<void> {
		return promisify(fs.fchmod)(fd, mode);
	}

	public fchown(fd: number, uid: number, gid: number): Promise<void> {
		return promisify(fs.fchown)(fd, uid, gid);
	}

	public fdatasync(fd: number): Promise<void> {
		return promisify(fs.fdatasync)(fd);
	}

	public async fstat(fd: number): Promise<Stats> {
		return this.makeStatsSerializable(await promisify(fs.fstat)(fd));
	}

	public fsync(fd: number): Promise<void> {
		return promisify(fs.fsync)(fd);
	}

	public ftruncate(fd: number, len?: number | null): Promise<void> {
		return promisify(fs.ftruncate)(fd, len);
	}

	public futimes(fd: number, atime: string | number | Date, mtime: string | number | Date): Promise<void> {
		return promisify(fs.futimes)(fd, atime, mtime);
	}

	public lchmod(path: fs.PathLike, mode: string | number): Promise<void> {
		return promisify(fs.lchmod)(path, mode);
	}

	public lchown(path: fs.PathLike, uid: number, gid: number): Promise<void> {
		return promisify(fs.lchown)(path, uid, gid);
	}

	public link(existingPath: fs.PathLike, newPath: fs.PathLike): Promise<void> {
		return promisify(fs.link)(existingPath, newPath);
	}

	public async lstat(path: fs.PathLike): Promise<Stats> {
		return this.makeStatsSerializable(await promisify(fs.lstat)(path));
	}

	public async lstatBatch(args: { path: fs.PathLike }[]): Promise<(Stats | Error)[]> {
		return Promise.all(args.map((a) => this.lstat(a.path).catch((e) => e)));
	}

	public mkdir(path: fs.PathLike, mode: number | string | fs.MakeDirectoryOptions | undefined | null): Promise<void> {
		return promisify(fs.mkdir)(path, mode);
	}

	public mkdtemp(prefix: string, options: IEncodingOptions): Promise<string | Buffer> {
		return promisify(fs.mkdtemp)(prefix, options);
	}

	public open(path: fs.PathLike, flags: string | number, mode: string | number | undefined | null): Promise<number> {
		return promisify(fs.open)(path, flags, mode);
	}

	public read(fd: number, length: number, position: number | null): Promise<{ bytesRead: number, buffer: Buffer }> {
		const buffer = Buffer.alloc(length);

		return promisify(fs.read)(fd, buffer, 0, length, position);
	}

	public readFile(path: fs.PathLike | number, options: IEncodingOptions): Promise<string | Buffer> {
		return promisify(fs.readFile)(path, options);
	}

	public readdir(path: fs.PathLike, options: IEncodingOptions): Promise<Buffer[] | fs.Dirent[] | string[]> {
		return promisify(fs.readdir)(path, options);
	}

	public readdirBatch(args: { path: fs.PathLike, options: IEncodingOptions }[]): Promise<(Buffer[] | fs.Dirent[] | string[] | Error)[]> {
		return Promise.all(args.map((a) => this.readdir(a.path, a.options).catch((e) => e)));
	}

	public readlink(path: fs.PathLike, options: IEncodingOptions): Promise<string | Buffer> {
		return promisify(fs.readlink)(path, options);
	}

	public realpath(path: fs.PathLike, options: IEncodingOptions): Promise<string | Buffer> {
		return promisify(fs.realpath)(path, options);
	}

	public rename(oldPath: fs.PathLike, newPath: fs.PathLike): Promise<void> {
		return promisify(fs.rename)(oldPath, newPath);
	}

	public rmdir(path: fs.PathLike): Promise<void> {
		return promisify(fs.rmdir)(path);
	}

	public async stat(path: fs.PathLike): Promise<Stats> {
		return this.makeStatsSerializable(await promisify(fs.stat)(path));
	}

	public async statBatch(args: { path: fs.PathLike }[]): Promise<(Stats | Error)[]> {
		return Promise.all(args.map((a) => this.stat(a.path).catch((e) => e)));
	}

	public symlink(target: fs.PathLike, path: fs.PathLike, type?: fs.symlink.Type | null): Promise<void> {
		return promisify(fs.symlink)(target, path, type);
	}

	public truncate(path: fs.PathLike, len?: number | null): Promise<void> {
		return promisify(fs.truncate)(path, len);
	}

	public unlink(path: fs.PathLike): Promise<void> {
		return promisify(fs.unlink)(path);
	}

	public utimes(path: fs.PathLike, atime: string | number | Date, mtime: string | number | Date): Promise<void> {
		return promisify(fs.utimes)(path, atime, mtime);
	}

	public async write(fd: number, buffer: Buffer, offset?: number, length?: number, position?: number): Promise<{ bytesWritten: number, buffer: Buffer }> {
		return promisify(fs.write)(fd, buffer, offset, length, position);
	}

	// tslint:disable-next-line no-any
	public writeFile (path: fs.PathLike | number, data: any, options: IEncodingOptions): Promise<void>  {
		return promisify(fs.writeFile)(path, data, options);
	}

	public async watch(filename: fs.PathLike, options?: IEncodingOptions): Promise<WatcherProxy> {
		return new WatcherProxy(fs.watch(filename, options));
	}

	private makeStatsSerializable(stats: fs.Stats): Stats {
		return {
			...stats,
			/**
			 * We need to check if functions exist because nexe's implemented FS
			 * lib doesnt implement fs.stats properly.
			 */
			_isBlockDevice: stats.isBlockDevice ? stats.isBlockDevice() : false,
			_isCharacterDevice: stats.isCharacterDevice ? stats.isCharacterDevice() : false,
			_isDirectory: stats.isDirectory(),
			_isFIFO: stats.isFIFO ? stats.isFIFO() : false,
			_isFile: stats.isFile(),
			_isSocket: stats.isSocket ? stats.isSocket() : false,
			_isSymbolicLink: stats.isSymbolicLink ? stats.isSymbolicLink() : false,
		};
	}
}
