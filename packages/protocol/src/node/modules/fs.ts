import { EventEmitter } from "events";
import * as fs from "fs";
import * as util from "util";
import { FsProxy, WriteStreamProxy, Stats, WatcherProxy } from "../../common/proxy";
import { IEncodingOptions } from "../../common/util";

// `any` is used to match Node interfaces.
// tslint:disable no-any

class WriteStream implements WriteStreamProxy {
	public constructor(private readonly stream: fs.WriteStream) {}

	public async close(): Promise<void> {
		this.stream.close();
	}

	public async destroy(): Promise<void> {
		this.stream.destroy();
	}

	public async write(data: any, encoding?: string): Promise<void> {
		this.stream.write(data, encoding);
	}

	public async end(data?: any, encoding?: string): Promise<void> {
		this.stream.end(data, encoding);
	}

	public async setDefaultEncoding(encoding: string): Promise<void> {
		this.stream.setDefaultEncoding(encoding);
	}

	public async on(event: string, cb: (...args: any[]) => void): Promise<void> {
		this.stream.on(event, cb);
	}

	public async dispose(): Promise<void> {
		this.stream.close();
	}

	public async onDidDispose(cb: () => void): Promise<void> {
		this.stream.on("close", cb);
	}
}

class Watcher implements WatcherProxy {
	private readonly watcher: fs.FSWatcher;
	private readonly emitter = new EventEmitter();

	public constructor(filename: fs.PathLike, options?: IEncodingOptions) {
		this.watcher = fs.watch(filename, options, (event, filename) => {
			this.emitter.emit("listener", event, filename);
		});
		this.watcher.on("close", () => this.emitter.emit("close"));
		this.watcher.on("error", (error) => this.emitter.emit("error", error));
	}

	public async close(): Promise<void> {
		this.watcher.close();
	}

	public async on(event: string, cb: (...args: any[]) => void): Promise<void> {
		switch (event) {
			case "listening":
				this.emitter.on(event, cb);
				break;
			default:
				this.watcher.on(event, cb);
				break;
		}
	}

	public async dispose(): Promise<void> {
		this.watcher.close();
	}

	public async onDidDispose(cb: () => void): Promise<void> {
		this.watcher.on("close", cb);
		this.watcher.on("error", cb);
	}
}

/**
 * Server-side proxy for native fs. This is similar to the native fs API, except
 * everything returns a promise with either a serializable value or a proxy and
 * arguments are in static positions.
 */
export class Fs implements FsProxy {
	public access(path: fs.PathLike, mode?: number): Promise<void> {
		return util.promisify(fs.access)(path, mode);
	}

	public appendFile(file: fs.PathLike | number, data: any, options?: fs.WriteFileOptions): Promise<void> {
		return util.promisify(fs.appendFile)(file, data, options);
	}

	public chmod(path: fs.PathLike, mode: string | number): Promise<void> {
		return util.promisify(fs.chmod)(path, mode);
	}

	public chown(path: fs.PathLike, uid: number, gid: number): Promise<void> {
		return util.promisify(fs.chown)(path, uid, gid);
	}

	public close(fd: number): Promise<void> {
		return util.promisify(fs.close)(fd);
	}

	public copyFile(src: fs.PathLike, dest: fs.PathLike, flags?: number): Promise<void> {
		return util.promisify(fs.copyFile)(src, dest, flags);
	}

	public createWriteStream(path: fs.PathLike, options?: any): WriteStream {
		return new WriteStream(fs.createWriteStream(path, options));
	}

	public exists(path: fs.PathLike): Promise<boolean> {
		return util.promisify(fs.exists)(path);
	}

	public fchmod(fd: number, mode: string | number): Promise<void> {
		return util.promisify(fs.fchmod)(fd, mode);
	}

	public fchown(fd: number, uid: number, gid: number): Promise<void> {
		return util.promisify(fs.fchown)(fd, uid, gid);
	}

	public fdatasync(fd: number): Promise<void> {
		return util.promisify(fs.fdatasync)(fd);
	}

	public async fstat(fd: number): Promise<Stats> {
		return this.makeStatsSerializable(await util.promisify(fs.fstat)(fd));
	}

	public fsync(fd: number): Promise<void> {
		return util.promisify(fs.fsync)(fd);
	}

	public ftruncate(fd: number, len?: number | null): Promise<void> {
		return util.promisify(fs.ftruncate)(fd, len);
	}

	public futimes(fd: number, atime: string | number | Date, mtime: string | number | Date): Promise<void> {
		return util.promisify(fs.futimes)(fd, atime, mtime);
	}

	public lchmod(path: fs.PathLike, mode: string | number): Promise<void> {
		return util.promisify(fs.lchmod)(path, mode);
	}

	public lchown(path: fs.PathLike, uid: number, gid: number): Promise<void> {
		return util.promisify(fs.lchown)(path, uid, gid);
	}

	public link(existingPath: fs.PathLike, newPath: fs.PathLike): Promise<void> {
		return util.promisify(fs.link)(existingPath, newPath);
	}

	public async lstat(path: fs.PathLike): Promise<Stats> {
		return this.makeStatsSerializable(await util.promisify(fs.lstat)(path));
	}

	public mkdir(path: fs.PathLike, mode: number | string | fs.MakeDirectoryOptions | undefined | null): Promise<void> {
		return util.promisify(fs.mkdir)(path, mode);
	}

	public mkdtemp(prefix: string, options: IEncodingOptions): Promise<string | Buffer> {
		return util.promisify(fs.mkdtemp)(prefix, options);
	}

	public open(path: fs.PathLike, flags: string | number, mode: string | number | undefined | null): Promise<number> {
		return util.promisify(fs.open)(path, flags, mode);
	}

	public read(fd: number, length: number, position: number | null): Promise<{ bytesRead: number, buffer: Buffer }> {
		const buffer = new Buffer(length);

		return util.promisify(fs.read)(fd, buffer, 0, length, position);
	}

	public readFile(path: fs.PathLike | number, options: IEncodingOptions): Promise<string | Buffer> {
		return util.promisify(fs.readFile)(path, options);
	}

	public readdir(path: fs.PathLike, options: IEncodingOptions): Promise<Buffer[] | fs.Dirent[] | string[]> {
		return util.promisify(fs.readdir)(path, options);
	}

	public readlink(path: fs.PathLike, options: IEncodingOptions): Promise<string | Buffer> {
		return util.promisify(fs.readlink)(path, options);
	}

	public realpath(path: fs.PathLike, options: IEncodingOptions): Promise<string | Buffer> {
		return util.promisify(fs.realpath)(path, options);
	}

	public rename(oldPath: fs.PathLike, newPath: fs.PathLike): Promise<void> {
		return util.promisify(fs.rename)(oldPath, newPath);
	}

	public rmdir(path: fs.PathLike): Promise<void> {
		return util.promisify(fs.rmdir)(path);
	}

	public async stat(path: fs.PathLike): Promise<Stats> {
		return this.makeStatsSerializable(await util.promisify(fs.stat)(path));
	}

	public symlink(target: fs.PathLike, path: fs.PathLike, type?: fs.symlink.Type | null): Promise<void> {
		return util.promisify(fs.symlink)(target, path, type);
	}

	public truncate(path: fs.PathLike, len?: number | null): Promise<void> {
		return util.promisify(fs.truncate)(path, len);
	}

	public unlink(path: fs.PathLike): Promise<void> {
		return util.promisify(fs.unlink)(path);
	}

	public utimes(path: fs.PathLike, atime: string | number | Date, mtime: string | number | Date): Promise<void> {
		return util.promisify(fs.utimes)(path, atime, mtime);
	}

	public async write(fd: number, buffer: Buffer, offset?: number, length?: number, position?: number): Promise<{ bytesWritten: number, buffer: Buffer }> {
		return util.promisify(fs.write)(fd, buffer, offset, length, position);
	}

	public writeFile (path: fs.PathLike | number, data: any, options: IEncodingOptions): Promise<void>  {
		return util.promisify(fs.writeFile)(path, data, options);
	}

	public watch(filename: fs.PathLike, options?: IEncodingOptions): Watcher {
		return new Watcher(filename, options);
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
