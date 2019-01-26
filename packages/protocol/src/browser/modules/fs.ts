import { exec, ChildProcess } from "child_process";
import { EventEmitter } from "events";
import * as fs from "fs";
import { IEncodingOptions, IEncodingOptionsCallback, escapePath, useBuffer } from "../../common/util";
import { Client } from "../client";

// Use this to get around Webpack inserting our fills.
// TODO: is there a better way?
declare var _require: typeof require;

/**
 * Implements the native fs module
 * Doesn't use `implements typeof import("fs")` to remove need for __promisify__ impls
 *
 * TODO: For now we can't use async in the evaluate calls because they get
 * transpiled to TypeScript's helpers. tslib is included but we also need to set
 * _this somehow which the __awaiter helper uses.
 */
export class FS {

	public constructor(
		private readonly client: Client,
	) { }

	public access = (path: fs.PathLike, mode: number | undefined | ((err: NodeJS.ErrnoException) => void), callback?: (err: NodeJS.ErrnoException) => void): void => {
		if (typeof mode === "function") {
			callback = mode;
			mode = undefined;
		}
		this.client.evaluate((path, mode) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.access)(path, mode);
		}, path, mode).then(() => {
			callback!(undefined!);
		}).catch((ex) => {
			callback!(ex);
		});
	}

	// tslint:disable-next-line no-any
	public appendFile = (file: fs.PathLike | number, data: any, options: IEncodingOptionsCallback, callback?: (err: NodeJS.ErrnoException) => void): void => {
		if (typeof options === "function") {
			callback = options;
			options = undefined;
		}
		this.client.evaluate((path, data, options) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.appendFile)(path, data, options);
		}, file, data, options).then(() => {
			callback!(undefined!);
		}).catch((ex) => {
			callback!(ex);
		});
	}

	public chmod = (path: fs.PathLike, mode: string | number, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((path, mode) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.chmod)(path, mode);
		}, path, mode).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public chown = (path: fs.PathLike, uid: number, gid: number, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((path, uid, gid) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.chown)(path, uid, gid);
		}, path, uid, gid).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public close = (fd: number, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((fd) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.close)(fd);
		}, fd).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public copyFile = (src: fs.PathLike, dest: fs.PathLike, flags: number | ((err: NodeJS.ErrnoException) => void), callback?: (err: NodeJS.ErrnoException) => void): void => {
		if (typeof flags === "function") {
			callback = flags;
		}
		this.client.evaluate((src, dest, flags) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.copyFile)(src, dest, flags);
		}, src, dest, typeof flags !== "function" ? flags : undefined).then(() => {
			callback!(undefined!);
		}).catch((ex) => {
			callback!(ex);
		});
	}

	public createWriteStream = (): void => {
		throw new Error("not implemented");
	}

	public exists = (path: fs.PathLike, callback: (exists: boolean) => void): void => {
		this.client.evaluate((path) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.exists)(path);
		}, path).then((r) => {
			callback(r);
		}).catch(() => {
			callback(false);
		});
	}

	public fchmod = (fd: number, mode: string | number, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((fd, mode) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.fchmod)(fd, mode);
		}, fd, mode).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public fchown = (fd: number, uid: number, gid: number, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((fd, uid, gid) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.fchown)(fd, uid, gid);
		}, fd, uid, gid).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public fdatasync = (fd: number, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((fd) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.fdatasync)(fd);
		}, fd).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public fstat = (fd: number, callback: (err: NodeJS.ErrnoException, stats: fs.Stats) => void): void => {
		this.client.evaluate((fd) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.fstat)(fd).then((stats) => {
				return {
					...stats,
					_isBlockDevice: stats.isBlockDevice(),
					_isCharacterDevice: stats.isCharacterDevice(),
					_isDirectory: stats.isDirectory(),
					_isFIFO: stats.isFIFO(),
					_isFile: stats.isFile(),
					_isSocket: stats.isSocket(),
					_isSymbolicLink: stats.isSymbolicLink(),
				};
			});
		}, fd).then((stats) => {
			callback(undefined!, new Stats(stats));
		}).catch((ex) => {
			callback(ex, undefined!);
		});
	}

	public fsync = (fd: number, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((fd) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.fsync)(fd);
		}, fd).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public ftruncate = (fd: number, len: number | undefined | null | ((err: NodeJS.ErrnoException) => void), callback?: (err: NodeJS.ErrnoException) => void): void => {
		if (typeof len === "function") {
			callback = len;
			len = undefined;
		}
		this.client.evaluate((fd, len) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.ftruncate)(fd, len);
		}, fd, len).then(() => {
			callback!(undefined!);
		}).catch((ex) => {
			callback!(ex);
		});
	}

	public futimes = (fd: number, atime: string | number | Date, mtime: string | number | Date, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((fd, atime, mtime) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.futimes)(fd, atime, mtime);
		}, fd, atime, mtime).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public lchmod = (path: fs.PathLike, mode: string | number, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((path, mode) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.lchmod)(path, mode);
		}, path, mode).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public lchown = (path: fs.PathLike, uid: number, gid: number, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((path, uid, gid) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.lchown)(path, uid, gid);
		}, path, uid, gid).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public link = (existingPath: fs.PathLike, newPath: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((existingPath, newPath) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.link)(existingPath, newPath);
		}, existingPath, newPath).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public lstat = (path: fs.PathLike, callback: (err: NodeJS.ErrnoException, stats: fs.Stats) => void): void => {
		this.client.evaluate((path) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.lstat)(path).then((stats) => {
				return {
					...stats,
					_isBlockDevice: stats.isBlockDevice(),
					_isCharacterDevice: stats.isCharacterDevice(),
					_isDirectory: stats.isDirectory(),
					_isFIFO: stats.isFIFO(),
					_isFile: stats.isFile(),
					_isSocket: stats.isSocket(),
					_isSymbolicLink: stats.isSymbolicLink(),
				};
			});
		}, path).then((stats) => {
			callback(undefined!, new Stats(stats));
		}).catch((ex) => {
			callback(ex, undefined!);
		});
	}

	public mkdir = (path: fs.PathLike, mode: number | string | fs.MakeDirectoryOptions | undefined | null | ((err: NodeJS.ErrnoException) => void), callback?: (err: NodeJS.ErrnoException) => void): void => {
		if (typeof mode === "function") {
			callback = mode;
			mode = undefined;
		}
		this.client.evaluate((path, mode) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.mkdir)(path, mode);
		}, path, mode).then(() => {
			callback!(undefined!);
		}).catch((ex) => {
			callback!(ex);
		});
	}

	public mkdtemp = (prefix: string, options: IEncodingOptionsCallback, callback?: (err: NodeJS.ErrnoException, folder: string | Buffer) => void): void => {
		if (typeof options === "function") {
			callback = options;
			options = undefined;
		}
		this.client.evaluate((prefix, options) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.mkdtemp)(prefix, options);
		}, prefix, options).then((folder) => {
			callback!(undefined!, folder);
		}).catch((ex) => {
			callback!(ex, undefined!);
		});
	}

	public open = (path: fs.PathLike, flags: string | number, mode: string | number | undefined | null | ((err: NodeJS.ErrnoException, fd: number) => void), callback?: (err: NodeJS.ErrnoException, fd: number) => void): void => {
		if (typeof mode === "function") {
			callback = mode;
			mode = undefined;
		}
		this.client.evaluate((path, flags, mode) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.open)(path, flags, mode);
		}, path, flags, mode).then((fd) => {
			callback!(undefined!, fd);
		}).catch((ex) => {
			callback!(ex, undefined!);
		});
	}

	public read = <TBuffer extends Buffer | Uint8Array>(fd: number, buffer: TBuffer, offset: number, length: number, position: number | null, callback: (err: NodeJS.ErrnoException, bytesRead: number, buffer: TBuffer) => void): void => {
		this.client.evaluate((fd, length, position) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");
			const buffer = new Buffer(length);

			return util.promisify(fs.read)(fd, buffer, 0, length, position).then((resp) => {
				return {
					bytesRead: resp.bytesRead,
					content: (resp.bytesRead < buffer.length ? buffer.slice(0, resp.bytesRead) : buffer).toString("utf8"),
				};
			});
		}, fd, length, position).then((resp) => {
			const newBuf = Buffer.from(resp.content, "utf8");
			buffer.set(newBuf, offset);
			callback(undefined!, resp.bytesRead, newBuf as TBuffer);
		}).catch((ex) => {
			callback(ex, undefined!, undefined!);
		});
	}

	public readFile = (path: fs.PathLike | number, options: IEncodingOptionsCallback, callback?: (err: NodeJS.ErrnoException, data: string | Buffer) => void): void => {
		if (typeof options === "function") {
			callback = options;
			options = undefined;
		}
		this.client.evaluate((path, options) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.readFile)(path, options).then((value) => value.toString());
		}, path, options).then((buffer) => {
			callback!(undefined!, buffer);
		}).catch((ex) => {
			callback!(ex, undefined!);
		});
	}

	public readdir = (path: fs.PathLike, options: IEncodingOptionsCallback, callback?: (err: NodeJS.ErrnoException, files: Buffer[] | fs.Dirent[] | string[]) => void): void => {
		if (typeof options === "function") {
			callback = options;
			options = undefined;
		}
		// TODO: options can also take `withFileTypes` but the types aren't working.
		this.client.evaluate((path, options) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.readdir)(path, options);
		}, path, options).then((files) => {
			callback!(undefined!, files);
		}).catch((ex) => {
			callback!(ex, undefined!);
		});
	}

	public readlink = (path: fs.PathLike, options: IEncodingOptionsCallback, callback?: (err: NodeJS.ErrnoException, linkString: string | Buffer) => void): void => {
		if (typeof options === "function") {
			callback = options;
			options = undefined;
		}
		this.client.evaluate((path, options) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.readlink)(path, options);
		}, path, options).then((linkString) => {
			callback!(undefined!, linkString);
		}).catch((ex) => {
			callback!(ex, undefined!);
		});
	}

	public realpath = (path: fs.PathLike, options: IEncodingOptionsCallback, callback?: (err: NodeJS.ErrnoException, resolvedPath: string | Buffer) => void): void => {
		if (typeof options === "function") {
			callback = options;
			options = undefined;
		}
		this.client.evaluate((path, options) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.realpath)(path, options);
		}, path, options).then((resolvedPath) => {
			callback!(undefined!, resolvedPath);
		}).catch((ex) => {
			callback!(ex, undefined!);
		});
	}

	public rename = (oldPath: fs.PathLike, newPath: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((oldPath, newPath) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.rename)(oldPath, newPath);
		}, oldPath, newPath).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public rmdir = (path: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((path) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.rmdir)(path);
		}, path).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public stat = (path: fs.PathLike, callback: (err: NodeJS.ErrnoException, stats: fs.Stats) => void): void => {
		this.client.evaluate((path) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.stat)(path).then((stats) => {
				return {
					...stats,
					_isBlockDevice: stats.isBlockDevice(),
					_isCharacterDevice: stats.isCharacterDevice(),
					_isDirectory: stats.isDirectory(),
					_isFIFO: stats.isFIFO(),
					_isFile: stats.isFile(),
					_isSocket: stats.isSocket(),
					_isSymbolicLink: stats.isSymbolicLink(),
				};
			});
		}, path).then((stats) => {
			callback(undefined!, new Stats(stats));
		}).catch((ex) => {
			callback(ex, undefined!);
		});
	}

	public symlink = (target: fs.PathLike, path: fs.PathLike, type: fs.symlink.Type | undefined | null | ((err: NodeJS.ErrnoException) => void), callback?: (err: NodeJS.ErrnoException) => void): void => {
		if (typeof type === "function") {
			callback = type;
			type = undefined;
		}
		this.client.evaluate((target, path, type) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.symlink)(target, path, type);
		}, target, path, type).then(() => {
			callback!(undefined!);
		}).catch((ex) => {
			callback!(ex);
		});
	}

	public truncate = (path: fs.PathLike, len: number | undefined | null | ((err: NodeJS.ErrnoException) => void), callback?: (err: NodeJS.ErrnoException) => void): void => {
		if (typeof len === "function") {
			callback = len;
			len = undefined;
		}
		this.client.evaluate((path, len) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.truncate)(path, len);
		}, path, len).then(() => {
			callback!(undefined!);
		}).catch((ex) => {
			callback!(ex);
		});
	}

	public unlink = (path: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((path) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.unlink)(path);
		}, path).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public utimes = (path: fs.PathLike, atime: string | number | Date, mtime: string | number | Date, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((path, atime, mtime) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.utimes)(path, atime, mtime);
		}, path, atime, mtime).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public write = <TBuffer extends Buffer | Uint8Array>(fd: number, buffer: TBuffer, offset: number | undefined, length: number | undefined, position: number | undefined | ((err: NodeJS.ErrnoException, written: number, buffer: TBuffer) => void), callback?: (err: NodeJS.ErrnoException, written: number, buffer: TBuffer) => void): void => {
		if (typeof position === "function") {
			callback = position;
			position = undefined;
		}
		this.client.evaluate((fd, buffer, offset, length, position) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.write)(fd, Buffer.from(buffer, "utf8"), offset, length, position).then((resp) => {
				return {
					bytesWritten: resp.bytesWritten,
					content: resp.buffer.toString("utf8"),
				};
			});
		}, fd, buffer.toString(), offset, length, position).then((r) => {
			callback!(undefined!, r.bytesWritten, Buffer.from(r.content, "utf8") as TBuffer);
		}).catch((ex) => {
			callback!(ex, undefined!, undefined!);
		});
	}

	// tslint:disable-next-line no-any
	public writeFile = (path: fs.PathLike | number, data: any, options: IEncodingOptionsCallback, callback?: (err: NodeJS.ErrnoException) => void): void => {
		if (typeof options === "function") {
			callback = options;
			options = undefined;
		}
		this.client.evaluate((path, data, options) => {
			const fs = _require("fs") as typeof import("fs");
			const util = _require("util") as typeof import("util");

			return util.promisify(fs.writeFile)(path, data, options);
		}, path, data, options).then(() => {
			callback!(undefined!);
		}).catch((ex) => {
			callback!(ex);
		});
	}

	public watch = (filename: fs.PathLike, options: IEncodingOptions, listener?: ((event: string, filename: string) => void) | ((event: string, filename: Buffer) => void)): fs.FSWatcher => {
		// TODO: can we modify `evaluate` for long-running processes like watch?
		// Especially since inotifywait might not be available.
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

		// TODO: `exec` is undefined for some reason.
		const process = exec(`inotifywait ${escapePath(filename.toString())} -m --format "%w%f:%e"`);
		process.on("exit", (exitCode) => {
			watcher.emit("error", new Error(`process terminated unexpectedly with code ${exitCode}`));
		});
		process.stdout.on("data", (data) => {
			buffer.push(data);
		});

		const watcher = new Watcher(process);
		if (listener) {
			const l = listener;
			watcher.on("change", (filename) => {
				// @ts-ignore not sure how to make this work.
				l("change", useBuffer(options) ? Buffer.from(filename) : filename);
			});
			watcher.on("rename", (filename) => {
				// @ts-ignore not sure how to make this work.
				l("rename", useBuffer(options) ? Buffer.from(filename) : filename);
			});
		}

		return watcher;
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

interface IStats {
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
	atime: string;
	mtime: string;
	ctime: string;
	birthtime: string;
	_isFile: boolean;
	_isDirectory: boolean;
	_isBlockDevice: boolean;
	_isCharacterDevice: boolean;
	_isSymbolicLink: boolean;
	_isFIFO: boolean;
	_isSocket: boolean;
}

class Stats implements fs.Stats {

	public readonly atime: Date;
	public readonly mtime: Date;
	public readonly ctime: Date;
	public readonly birthtime: Date;

	private constructor(private readonly stats: IStats) {
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

/**
 * Class for safely taking input and turning it into separate messages.
 * Assumes that messages are split by newlines.
 */
export class NewlineInputBuffer {

	private callback: (msg: string) => void;
	private buffer: string | undefined;

	public constructor(callback: (msg: string) => void) {
		this.callback = callback;
	}

	/**
	 * Add data to be buffered.
	 */
	public push(data: string | Uint8Array): void {
		let input = typeof data === "string" ? data : data.toString();
		if (this.buffer) {
			input = this.buffer + input;
			this.buffer = undefined;
		}
		const lines = input.split("\n");
		const length = lines.length - 1;
		const lastLine = lines[length];
		if (lastLine.length > 0) {
			this.buffer = lastLine;
		}
		lines.pop(); // This is either the line we buffered or an empty string.
		for (let i = 0; i < length; ++i) {
			this.callback(lines[i]);
		}
	}

}
