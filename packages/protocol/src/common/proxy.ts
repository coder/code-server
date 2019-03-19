import * as fs from "fs";

// `any` is used to match the fs interface.
// tslint:disable no-any

/**
 * Proxies to the actual instance. The only method that should accept callbacks
 * is "on". Every other method must only accept serializable arguments. All
 * methods must return promises with serializable values.
 */
export interface DisposableProxy {
	// This is a separate method instead of just using "on" to ensure it is
	// implemented, otherwise you'd have to just know to emit the dispose event.
	onDidDispose(cb: () => void): void;
	dispose(): Promise<void>;
}

/**
 * An event emitter with an onEvent method to allow proxying all the events.
 */
export interface ServerProxy extends DisposableProxy {
	/**
	 * Events should be listened to manually in here to prevent trying to send
	 * events with arguments that cannot be serialized. All events listed in
	 * a proxy's interface should be present.
	 */
	onEvent(cb: (event: string, ...args: any[]) => void): void;
}

export interface WriteStreamProxy extends DisposableProxy {
	close(): Promise<void>;
	destroy(): Promise<void>;
	end(data?: any, encoding?: string): Promise<void>;
	setDefaultEncoding(encoding: string): Promise<void>;
	write(data: any, encoding?: string): Promise<void>;

	on(event: "close", cb: () => void): void;
	on(event: "drain", cb: () => void): void;
	on(event: "error", cb: (error: Error) => void): void;
	on(event: "finish", cb: () => void): void;
	on(event: "open", cb: (fd: number) => void): void;
}

export interface WatcherProxy extends DisposableProxy {
	close(): Promise<void>;

	on(event: "change", cb: (event: string, filename: string) => void): void;
	on(event: "close", cb: () => void): void;
	on(event: "error", cb: (error: Error) => void): void;
	on(event: "listener", cb: (event: string, filename: string) => void): void;
}

/**
 * Proxies to the actual module implementation. Each method must only accept
 * serializable arguments and must return a promise with either serializable
 * values or a proxy to an instance.
 */
export interface FsProxy {
	access(path: fs.PathLike, mode?: number): Promise<void>;
	appendFile(file: fs.PathLike | number, data: any, options?: fs.WriteFileOptions): Promise<void>;
	chmod(path: fs.PathLike, mode: string | number): Promise<void>;
	chown(path: fs.PathLike, uid: number, gid: number): Promise<void>;
	close(fd: number): Promise<void>;
	copyFile(src: fs.PathLike, dest: fs.PathLike, flags?: number): Promise<void>;
	createWriteStream(path: fs.PathLike, options?: any): WriteStreamProxy;
	exists(path: fs.PathLike): Promise<boolean>;
	fchmod(fd: number, mode: string | number): Promise<void>;
	fchown(fd: number, uid: number, gid: number): Promise<void>;
	fdatasync(fd: number): Promise<void>;
	fstat(fd: number): Promise<Stats>;
	fsync(fd: number): Promise<void>;
	ftruncate(fd: number, len?: number | null): Promise<void>;
	futimes(fd: number, atime: string | number | Date, mtime: string | number | Date): Promise<void>;
	lchmod(path: fs.PathLike, mode: string | number): Promise<void>;
	lchown(path: fs.PathLike, uid: number, gid: number): Promise<void>;
	link(existingPath: fs.PathLike, newPath: fs.PathLike): Promise<void>;
	lstat(path: fs.PathLike): Promise<Stats>;
	mkdir(path: fs.PathLike, mode: number | string | fs.MakeDirectoryOptions | undefined | null): Promise<void>;
	mkdtemp(prefix: string, options: IEncodingOptions): Promise<string | Buffer>;
	open(path: fs.PathLike, flags: string | number, mode: string | number | undefined | null): Promise<number>;
	read(fd: number, length: number, position: number | null): Promise<{ bytesRead: number, buffer: Buffer }>;
	readFile(path: fs.PathLike | number, options: IEncodingOptions): Promise<string | Buffer>;
	readdir(path: fs.PathLike, options: IEncodingOptions): Promise<Buffer[] | fs.Dirent[] | string[]>;
	readlink(path: fs.PathLike, options: IEncodingOptions): Promise<string | Buffer>;
	realpath(path: fs.PathLike, options: IEncodingOptions): Promise<string | Buffer>;
	rename(oldPath: fs.PathLike, newPath: fs.PathLike): Promise<void>;
	rmdir(path: fs.PathLike): Promise<void>;
	stat(path: fs.PathLike): Promise<Stats>;
	symlink(target: fs.PathLike, path: fs.PathLike, type?: fs.symlink.Type | null): Promise<void>;
	truncate(path: fs.PathLike, len?: number | null): Promise<void>;
	unlink(path: fs.PathLike): Promise<void>;
	utimes(path: fs.PathLike, atime: string | number | Date, mtime: string | number | Date): Promise<void>;
	write(fd: number, buffer: Buffer, offset?: number, length?: number, position?: number): Promise<{ bytesWritten: number, buffer: Buffer }>;
	writeFile (path: fs.PathLike | number, data: any, options: IEncodingOptions): Promise<void> ;
	watch(filename: fs.PathLike, options?: IEncodingOptions): WatcherProxy;
}

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
	atime: Date | string;
	mtime: Date | string;
	ctime: Date | string;
	birthtime: Date | string;
	_isFile: boolean;
	_isDirectory: boolean;
	_isBlockDevice: boolean;
	_isCharacterDevice: boolean;
	_isSymbolicLink: boolean;
	_isFIFO: boolean;
	_isSocket: boolean;
}
