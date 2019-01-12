import { ChildProcess } from "child_process";
import * as fs from "fs";
import { EventEmitter } from "events";
import { promisify } from "util";
import { Writable } from "stream";
import { exec } from "./child_process";
import {
	bashCommand, throwUnimplementedError, throwSyncError, escapePath,
	useBuffer, NewlineInputBuffer, Queue,
} from "./util";

/**
 * An open file.
 */
interface IOpenFile {
	readonly path: fs.PathLike;
	position: number | undefined;
}

type ReaddirCallback = (error?: NodeJS.ErrnoException, files?: string[]) => void;

/**
 * Queue for readdir.
 */
class ReaddirQueue extends Queue<ReaddirCallback> {

	public async run(items: Map<string, ReaddirCallback[]>): Promise<void> {
		const keys = Array.from(items.keys());
		try {
			const stdio = await promisify(exec)(`bash -c '${keys.map((key) => `cd ${escapePath(key)} && ls -1a; echo;`).join(" ")}'`);
			stdio.stdout.trim().split("\n\n").forEach((split, index) => {
				const path = keys[index];
				const cbs = items.get(path)!;
				if (split.indexOf("does not exist") !== -1) {
					cbs.forEach((cb) => {
						cb({
							code: "ENOENT",
							message: "No such file or directory " + path,
							name: "Not found",
						});
					});
				} else {
					const files = split.trim().split("\n");
					cbs.forEach((cb) => {
						cb(undefined, files.filter((f) => f !== "." && f !== ".."));
					});
				}
			});
		} catch (error) {
			items.forEach((cbs) => cbs.forEach((cb) => cb(new Error("failed to ls"))));
		}
	}

}

type StatCallback = (error?: NodeJS.ErrnoException, stats?: fs.Stats) => void;

/**
 * Queue for stat.
 */
class StatQueue extends Queue<StatCallback> {

	public constructor() {
		super(100);
	}

	public async run(items: Map<string, StatCallback[]>): Promise<void> {
		try {
			const stats = await this.stat(Array.from(items.keys()));
			items.forEach((callbacks, path) => {
				if (stats.has(path)) {
					callbacks.forEach((cb) => {
						cb(undefined, stats.get(path));
					});
				} else {
					callbacks.forEach((cb) => {
						cb({
							code: "ENOENT",
							message: "No such file or directory " + path,
							name: "Not found",
						});
					});
				}
			});
		} catch (error) {
			items.forEach((callbacks) => {
				callbacks.forEach((cb) => {
					cb({
						code: "ECMDFAIL",
						message: "failed to stat",
						name: "failed to stat",
					});
				});
			});
		}
	}

	/**
	 * Perform stat on multiple paths. Invalid files are ignored.
	 */
	private async stat(paths: string[]): Promise<Map<string, fs.Stats>> {
		const map = new Map<string, fs.Stats>();
		const pathsStr = paths.map(escapePath).join(" ");
		const resp = await promisify(exec)(
			`bash -c "stat ${pathsStr} -c \\\\'%n\\\\',%s,%F,%Y,%a,%g,%u,%X,%W,%d,%i,%b,%B,%Z,%h,%t"`,
		);
		resp.stdout.split("\n").forEach((stat) => {
			const matches = stat.trim().match(/(^'.*'|[^',\s]+)(?=\s*,|\s*$)/g);
			if (!matches || matches.length < 16) {
				return;
			}

			const name = matches[0].substring(1, matches[0].length -1);
			const size = parseInt(matches[1], 10);
			const fileType = matches[2];
			const mtime = new Date(parseInt(matches[3], 10) * 1000);
			const mode = parseInt(matches[4], 10);
			const gid = parseInt(matches[5], 10);
			const uid = parseInt(matches[6], 10);
			const atime = new Date(parseInt(matches[7], 10) * 1000);
			const birthtime = new Date(parseInt(matches[8], 10) * 1000);
			const dev = parseInt(matches[9], 10);
			const ino = parseInt(matches[10], 10);
			const blocks = parseInt(matches[11], 10);
			const blksize = parseInt(matches[12], 10);
			const ctime = new Date(parseInt(matches[13], 10) * 1000);
			const nlink = parseInt(matches[14], 10);
			const rdev = parseInt(matches[15], 10);

			map.set(name, {
				atime: atime,
				atimeMs: atime.getTime(),
				birthtime,
				birthtimeMs: birthtime.getTime(),
				blksize,
				blocks,
				ctime,
				ctimeMs: ctime.getTime(),
				dev,
				gid,
				ino,
				isBlockDevice: (): boolean => fileType === "block special file",
				isCharacterDevice: (): boolean => fileType === "character special file",
				isDirectory: (): boolean => fileType === "directory",
				isFIFO: (): boolean => fileType === "fifo",
				isFile: (): boolean => fileType === "regular file",
				isSocket: (): boolean => fileType === "socket",
				isSymbolicLink: (): boolean => fileType === "symbolic link",
				mode,
				mtime,
				mtimeMs: mtime.getTime(),
				nlink,
				rdev,
				size,
				uid,
			});
		});

		return map;
	}

}

type ReadFileCallback = (err: NodeJS.ErrnoException, content: string) => void;

/**
 * Queue for readFile.
 */
class ReadFileQueue extends Queue<ReadFileCallback> {

	public constructor() {
		super(100);
	}

	public async run(items: Map<string, ReadFileCallback[]>): Promise<void> {
		try {
			throwUnimplementedError();
		} catch (error) {
			items.forEach((cbs) => cbs.forEach((cb) => cb(error, "")));
		}
	}

}

class Watcher extends EventEmitter implements fs.FSWatcher {

	public constructor(private readonly process: ChildProcess) {
		super();
	}

	public close(): void {
		this.process.kill();
	}

}

class WriteStream extends Writable implements fs.WriteStream {

	public path: string;

	private process: ChildProcess;

	public constructor(path: fs.PathLike) {
		super();

		this.path = path.toString();
		this.process = exec(`cat > ${escapePath(this.path)}`);
		setTimeout(() => {
			// Set timeout so listeners have time to register.
			this.emit("open");
		}, 0);
		this.process.on("exit", () => {
			this.emit("close");
		});
	}

	public get bytesWritten(): number {
		throw throwUnimplementedError();
	}

	// tslint:disable-next-line no-any
	public _write(chunk: any, _encoding: string, callback: () => void): void {
		this.process.stdin.write(chunk);
		callback();
	}

	public close(): void {
		this.process.kill();
	}

}

// Used to identify files by descriptor.
let lastFileDescriptor = 0;
const readdirQueue = new ReaddirQueue();
const readFileQueue = new ReadFileQueue();
const statQueue = new StatQueue();
const openFiles = new Map<number, IOpenFile>();

// tslint:disable only-arrow-functions
// A common pattern is to exec and call the callback with an error or null.
function execAndCallback(command: string, callback: (err: NodeJS.ErrnoException) => void): void {
	promisify(exec)(command).then(() => {
		callback(null as any); // tslint:disable-line no-any
	}).catch((error) => {
		callback(error);
	});
}

function appendFile(
	path: fs.PathLike | number,
	data: any, // tslint:disable-line no-any
	options?: { encoding?: string | null; mode?: string | number; flag?: string; } | string | undefined | null | ((err: NodeJS.ErrnoException) => void),
	callback?: (err: NodeJS.ErrnoException) => void,
): void {
	if (typeof options === "function") {
		callback = options;
	}

	if (typeof path === "number") {
		if (!openFiles.has(path)) {
			// @ts-ignore not sure how to make this work.
			return callback(new Error("not open"), undefined as any); // tslint:disable-line no-any
		}
		path = openFiles.get(path)!.path;
	}

	const process = exec(`${data ? "cat >>" : "touch"} ${escapePath(path.toString())}`, (error) => {
		callback!(error as any); // tslint:disable-line no-any
	});
	if (data) {
		process.stdin.write(data);
	}
}

function close(fd: number, callback: (err: NodeJS.ErrnoException) => void): void {
	if (!openFiles.has(fd)) {
		return callback(new Error("file wasnt open"));
	}

	openFiles.delete(fd);
	callback(null as any); // tslint:disable-line no-any
}

function createWriteStream(path: fs.PathLike, _options?: string | {
	flags?: string;
	encoding?: string;
	fd?: number;
	mode?: number;
}): fs.WriteStream {
	return new WriteStream(path);
}

function exists(path: fs.PathLike, callback: (exists: boolean) => void): void {
	const pathStr = escapePath(path.toString());
	const command = bashCommand(
		`if [ -d ${pathStr} ]; then echo true;`
			+ ` elif [ -f ${pathStr} ]; then echo true;`
			+ ` elif [ -s ${pathStr} ]; then echo true;`
			+ "fi",
	);
	promisify(exec)(command).then((stdio) => {
		callback(stdio.stdout.trim() === "true");
	}).catch(() => {
		callback(false);
	});
}

function fstat(fd: number, callback: (err: NodeJS.ErrnoException, stats: fs.Stats) => void): void {
	if (!openFiles.has(fd)) {
		return callback(new Error("not open"), null as any); // tslint:disable-line no-any
	}
	stat(openFiles.get(fd)!.path, callback);
}

function futimes(
	fd: number,
	atime: string | number | Date,
	mtime: string | number | Date,
	callback: (err: NodeJS.ErrnoException) => void,
): void {
	if (!openFiles.has(fd)) {
		return callback(new Error("not opened"));
	}

	const openFile = openFiles.get(fd)!;
	const command = [
		{ flag: "a", time: atime },
		{ flag: "m", time: mtime },
	]
		.filter((item) => !!item.time)
		.map((item) => `touch -${item.flag} --date="${item.time}" ${escapePath(openFile.path.toString())}`)
		.join(";");

	if (command.length === 0) {
		return callback(new Error("atime or mtime required"));
	}

	execAndCallback(command, callback);
}

function lstat(path: fs.PathLike, callback: (err: NodeJS.ErrnoException, stats: fs.Stats) => void): void {
	stat(path, callback);
}

function mkdir(
	path: fs.PathLike, mode: number | string | fs.MakeDirectoryOptions | undefined | null | ((err: NodeJS.ErrnoException) => void),
	callback?: (err: NodeJS.ErrnoException) => void,
): void {
	execAndCallback(
		`mkdir -p ${escapePath(path.toString())}`,
		typeof mode === "function" ? mode : callback!,
	);
}

function open(
	path: fs.PathLike,
	flags: string | number, mode: number | string | undefined | null | ((err: NodeJS.ErrnoException, fd: number) => void),
	callback?: (err: NodeJS.ErrnoException, fd: number) => void,
): void {
	if (typeof mode === "function") {
		callback = mode;
	}

	// Don't touch if read-only.
	const promise = flags !== "r"
		? promisify(exec)(`touch ${escapePath(path.toString())}`)
			.then(() => Promise.resolve())
			.catch((error) => {
				if (error.message.indexOf("No such file or directory") !== -1) {
					return Promise.reject({
						code: "ENOENT",
						message: "No such file or directory " + path,
						name: "Not found",
					});
				}

				return Promise.reject(error);
			})
		: Promise.resolve();

	promise.then(() => {
		const id = lastFileDescriptor++;
		openFiles.set(id, {
			path,
			position: undefined,
		});
		callback!(null as any, id); // tslint:disable-line no-any
	}).catch((error) => {
		callback!(error, undefined as any); // tslint:disable-line no-any
	});
}

function read<TBuffer extends fs.BinaryData>(
	fd: number,
	buffer: TBuffer,
	offset: number,
	length: number,
	position: number | null,
	callback?: (err: NodeJS.ErrnoException, bytesRead: number, buffer: TBuffer) => void,
): void {
	if (!openFiles.has(fd)) {
		if (callback) {
			// tslint:disable-next-line no-any
			callback(new Error("not opened"), undefined as any, undefined as any);
		}

		return;
	}

	const hasPosition = typeof position === "number";
	const openFile = openFiles.get(fd)!;

	if (!hasPosition) {
		position = openFile.position || 0;
	}

	readFile(openFile.path, (error, data) => {
		if (error) {
			if (callback) {
				// tslint:disable-next-line no-any
				callback(error, undefined as any, undefined as any);
			}

			return;
		}

		const output = data.slice(position!, position! + length);
		if (output.length !== 0) {
			// TODO: seems to be no more set with v10, but need to decide if we'll be running v10.
			buffer.set(output, offset);
		}

		if (!hasPosition) {
			if (typeof openFile.position !== "undefined") {
				openFile.position += output.length;
			} else {
				openFile.position = output.length;
			}
			openFiles.set(fd, openFile);
		}

		if (callback) {
			callback(null as any, output.length, buffer); // tslint:disable-line no-any
		}
	});
}

function readFile(
	path: fs.PathLike | number,
	options: { encoding?: string | null; flag?: string; } | string | undefined | null | ((err: NodeJS.ErrnoException, data: Buffer) => void),
	callback?: ((err: NodeJS.ErrnoException, data: Buffer | string) => void) | ((err: NodeJS.ErrnoException, data: Buffer) => void) | ((err: NodeJS.ErrnoException, data: string) => void),
): void {
	if (typeof options === "function") {
		callback = options;
	}

	if (typeof path === "number") {
		if (!openFiles.has(path)) {
			// @ts-ignore not sure how to make this work.
			return callback(new Error("not open"), undefined as any); // tslint:disable-line no-any
		}
		path = openFiles.get(path)!.path;
	}

	readFileQueue.add(path.toString(), (error, result) => {
		// @ts-ignore not sure how to make this work.
		callback(
			error,
			result && useBuffer(options) ? Buffer.from(result) : result,
		);
	});
}

function readdir(
	path: fs.PathLike,
	options: { encoding?: string | null, withFileTypes?: boolean } | string | undefined | null | ((err: NodeJS.ErrnoException, files: string[]) => void),
	callback?: ((err: NodeJS.ErrnoException, files: string[]) => void) | ((err: NodeJS.ErrnoException, files: Buffer[]) => void) | ((err: NodeJS.ErrnoException, files: fs.Dirent[]) => void)
): void {
	if (typeof options === "function") {
		callback = options;
	}
	readdirQueue.add(path.toString(), (error, files) => {
		if (typeof options === "function") {
			callback = options;
		}
		// @ts-ignore not sure how to make this work.
		callback(
			error,
			files && useBuffer(options)
				? files.map((f) => Buffer.from(f))
				: files,
		);
	});
}

function realpath(
	path: fs.PathLike,
	options: { encoding?: string | null } | string | undefined | null | ((err: NodeJS.ErrnoException, resolvedPath: string) => void),
	callback?: ((err: NodeJS.ErrnoException, resolvedPath: string) => void) | ((err: NodeJS.ErrnoException, resolvedPath: Buffer) => void) | ((err: NodeJS.ErrnoException, resolvedPath: string | Buffer) => void),
): void {
	if (typeof options === "function") {
		callback = options;
	}
	// @ts-ignore not sure how to make this work.
	callback(
		null,
		useBuffer(options) ? Buffer.from(path.toString()) : path.toString(),
	);
}

function rename(oldPath: fs.PathLike, newPath: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void {
	promisify(exec)(`mv ${escapePath(oldPath.toString())} ${escapePath(newPath.toString())}`).then(() => {
		callback(null as any); // tslint:disable-line no-any
	}).catch((error) => {
		callback(error.message.indexOf("No such file or directory") !== -1 ? {
			code: "ENOENT",
			message: "No such file or directory " + oldPath,
			name: "Not found",
		} : error);
	});
}

function rmdir(path: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void {
	execAndCallback(`rmdir ${escapePath(path.toString())}`, callback);
}

function stat(path: fs.PathLike, callback: (err: NodeJS.ErrnoException, stats: fs.Stats) => void): void {
	statQueue.add(path.toString(), (error, stats) => {
		callback(error as any, stats as any); // tslint:disable-line no-any
	});
}

function unlink(path: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void {
	execAndCallback(`unlink ${escapePath(path.toString())}`, callback);
}

function watch(
	filename: fs.PathLike,
	options: { encoding?: string | null, persistent?: boolean, recursive?: boolean } | string | undefined | null | ((event: string, filename: string) => void),
	listener?: ((event: string, filename: string) => void) | ((event: string, filename: Buffer) => void),
): fs.FSWatcher {
	const buffer = new NewlineInputBuffer((msg): void => {
		msg = msg.trim();
		const index = msg.lastIndexOf(":");
		const events = msg.substring(index + 1).split(",");
		const baseFilename = msg.substring(0, index).split("/").pop();
		events.forEach((event) => {
			switch (event) {
				// Rename is emitted when a file appears or disappears in the directory.
				case "CREATE":
				case "DELETE":
				case "MOVED_FROM":
				case "MOVED_TO":
					watcher.emit("rename", baseFilename);
					break;
				case "CLOSE_WRITE":
					watcher.emit("change", baseFilename);
					break;
			}
		});
	});

	const process = exec(`inotifywait ${escapePath(filename.toString())} -m --format "%w%f:%e"`);
	process.on("exit", (exitCode) => {
		watcher.emit("error", new Error(`process terminated unexpectedly with code ${exitCode}`));
	});
	process.stdout.on("data", (data) => {
		buffer.push(data);
	});

	const watcher = new Watcher(process);
	watcher.on("change", (filename) => {
		// @ts-ignore not sure how to make this work.
		listener("change", useBuffer(options) ? Buffer.from(filename) : filename);
	});
	watcher.on("rename", (filename) => {
		// @ts-ignore not sure how to make this work.
		listener("rename", useBuffer(options) ? Buffer.from(filename) : filename);
	});

	return watcher;
}

function writeFile(
	path: fs.PathLike | number,
	data: any, // tslint:disable-line no-any
	options: { encoding?: string | null; mode?: number | string; flag?: string; } | string | undefined | null | ((err: NodeJS.ErrnoException) => void),
	callback?: (err: NodeJS.ErrnoException) => void,
): void {
	if (typeof options === "function") {
		callback = options;
	}

	if (typeof path === "number") {
		if (!openFiles.has(path)) {
			// @ts-ignore not sure how to make this work.
			return callback(new Error("not open"), undefined as any); // tslint:disable-line no-any
		}
		path = openFiles.get(path)!.path;
	}

	const process = exec(`${data ? "cat >" : "touch"} ${escapePath(path.toString())}`, (error) => {
		callback!(error as any); // tslint:disable-line no-any
	});
	if (data) {
		process.stdin.write(data);
	}
}
// tslint:enable only-arrow-functions

// Just to satisfy the types.
// tslint:disable no-any
appendFile.__promisify__ = undefined as any;
close.__promisify__ = undefined as any;
exists.__promisify__ = undefined as any;
fstat.__promisify__ = undefined as any;
futimes.__promisify__ = undefined as any;
lstat.__promisify__ = undefined as any;
mkdir.__promisify__ = undefined as any;
open.__promisify__ = undefined as any;
read.__promisify__ = undefined as any;
readFile.__promisify__ = undefined as any;
readdir.__promisify__ = undefined as any;
realpath.__promisify__ = undefined as any;
rename.__promisify__ = undefined as any;
rmdir.__promisify__ = undefined as any;
stat.__promisify__ = undefined as any;
unlink.__promisify__ = undefined as any;
writeFile.__promisify__ = undefined as any;
realpath.native = undefined as any;
// tslint:enable no-any

const exp: typeof fs = {
	constants: fs.constants,
	Stats: fs.Stats,
	ReadStream: fs.ReadStream,
	WriteStream: fs.WriteStream,
	Dirent: fs.Dirent,
	promises: fs.promises,

	access: throwUnimplementedError,
	accessSync: throwSyncError,
	appendFile,
	appendFileSync: throwSyncError,
	chmod: throwUnimplementedError,
	chmodSync: throwSyncError,
	chown: throwUnimplementedError,
	chownSync: throwSyncError,
	close,
	copyFile: throwUnimplementedError,
	copyFileSync: throwSyncError,
	closeSync: throwSyncError,
	createReadStream: throwUnimplementedError,
	createWriteStream,
	exists,
	existsSync: throwSyncError,
	fchmod: throwUnimplementedError,
	fchmodSync: throwSyncError,
	fchown: throwUnimplementedError,
	fchownSync: throwSyncError,
	fdatasync: throwUnimplementedError,
	fdatasyncSync: throwSyncError,
	fstat,
	fstatSync: throwSyncError,
	fsync: throwUnimplementedError,
	fsyncSync: throwSyncError,
	ftruncate: throwUnimplementedError,
	ftruncateSync: throwSyncError,
	futimes,
	futimesSync: throwSyncError,
	lchmod: throwUnimplementedError,
	lchmodSync: throwSyncError,
	lchown: throwUnimplementedError,
	lchownSync: throwSyncError,
	link: throwUnimplementedError,
	linkSync: throwSyncError,
	lstat,
	lstatSync: throwSyncError,
	mkdir,
	mkdirSync: throwSyncError,
	mkdtemp: throwUnimplementedError,
	mkdtempSync: throwSyncError,
	open,
	openSync: throwSyncError,
	read,
	readFile,
	readFileSync: throwSyncError,
	readSync: throwSyncError,
	readdir,
	readdirSync: throwSyncError,
	readlink: throwUnimplementedError,
	readlinkSync: throwSyncError,
	realpath,
	realpathSync: throwSyncError,
	rename,
	renameSync: throwSyncError,
	rmdir,
	rmdirSync: throwSyncError,
	stat,
	statSync: throwSyncError,
	symlink: throwUnimplementedError,
	symlinkSync: throwSyncError,
	truncate: throwUnimplementedError,
	truncateSync: throwSyncError,
	unlink,
	unlinkSync: throwSyncError,
	unwatchFile: throwUnimplementedError,
	utimes: throwUnimplementedError,
	utimesSync: throwSyncError,
	watch,
	watchFile: throwUnimplementedError,
	write: throwUnimplementedError,
	writeFile,
	writeFileSync: throwSyncError,
	writeSync: throwSyncError,
};

export = exp;
