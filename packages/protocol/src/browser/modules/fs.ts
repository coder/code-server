import * as fs from "fs";
import { Client } from "../client";

/**
 * Implements the native fs module
 * Doesn't use `implements typeof import("fs")` to remove need for __promisify__ impls
 */
export class FS {

	public constructor(
		private readonly client: Client,
	) { }

	public access(path: fs.PathLike, mode: number | undefined, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((path, mode) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.access)(path, mode);
		}, path, mode).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public appendFile(file: fs.PathLike | number, data: any, options: { encoding?: string | null, mode?: string | number, flag?: string } | string | undefined | null, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((path, data, options) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.appendFile)(path, data, options);
		}, file, data, options).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public chmod(path: fs.PathLike, mode: string | number, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((path, mode) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.chmod)(path, mode);
		}, path, mode).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public chown(path: fs.PathLike, uid: number, gid: number, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((path, uid, gid) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.chown)(path, uid, gid);
		}, path, uid, gid).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public close(fd: number, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((fd) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.close)(fd);
		}, fd).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public copyFile(src: fs.PathLike, dest: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((src, dest) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.copyFile)(src, dest);
		}, src, dest).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public createWriteStream(): void {
		throw new Error("not implemented");
	}

	public exists(path: fs.PathLike, callback: (exists: boolean) => void): void {
		this.client.evaluate((path) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.exists)(path);
		}, path).then((r) => {
			callback(r);
		}).catch(() => {
			callback(false);
		});
	}

	public fchmod(fd: number, mode: string | number, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((fd, mode) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.fchmod)(fd, mode);
		}, fd, mode).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public fchown(fd: number, uid: number, gid: number, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((fd, uid, gid) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.fchown)(fd, uid, gid);
		}, fd, uid, gid).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public fdatasync(fd: number, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((fd) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.fdatasync)(fd);
		}, fd).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public fstat(fd: number, callback: (err: NodeJS.ErrnoException, stats: fs.Stats) => void): void {
		this.client.evaluate(async (fd) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			const stats = await util.promisify(fs.fstat)(fd);
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
		}, fd).then((stats) => {
			callback(undefined!, Stats.fromObject(stats));
		}).catch((ex) => {
			callback(ex, undefined!);
		});
	}

	public fsync(fd: number, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((fd) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.fsync)(fd);
		}, fd).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public ftruncate(fd: number, len: number | undefined | null, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((fd, len) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.ftruncate)(fd, len);
		}, fd, len).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public futimes(fd: number, atime: string | number | Date, mtime: string | number | Date, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((fd, atime, mtime) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.futimes)(fd, atime, mtime);
		}, fd, atime, mtime).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public lchmod(path: fs.PathLike, mode: string | number, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((path, mode) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.lchmod)(path, mode);
		}, path, mode).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public lchown(path: fs.PathLike, uid: number, gid: number, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((path, uid, gid) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.lchown)(path, uid, gid);
		}, path, uid, gid).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public link(existingPath: fs.PathLike, newPath: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((existingPath, newPath) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.link)(existingPath, newPath);
		}, existingPath, newPath).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public lstat(path: fs.PathLike, callback: (err: NodeJS.ErrnoException, stats: fs.Stats) => void): void {
		this.client.evaluate(async (path) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			const stats = await util.promisify(fs.lstat)(path);
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
		}, path).then((stats) => {
			callback(undefined!, Stats.fromObject(stats));
		}).catch((ex) => {
			callback(ex, undefined!);
		});
	}

	public mkdir(path: fs.PathLike, mode: number | string | undefined | null, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((path, mode) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.mkdir)(path, mode);
		}, path, mode).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public mkdtemp(prefix: string, options: { encoding?: BufferEncoding | null } | BufferEncoding | undefined | null, callback: (err: NodeJS.ErrnoException, folder: string) => void): void {
		this.client.evaluate((prefix, options) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.mkdtemp)(prefix, options);
		}, prefix, options).then((folder) => {
			callback(undefined!, folder);
		}).catch((ex) => {
			callback(ex, undefined!);
		});
	}

	public open(path: fs.PathLike, flags: string | number, mode: string | number | undefined | null, callback: (err: NodeJS.ErrnoException, fd: number) => void): void {
		this.client.evaluate((path, flags, mode) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.open)(path, flags, mode);
		}, path, flags, mode).then((fd) => {
			callback(undefined!, fd);
		}).catch((ex) => {
			callback(ex, undefined!);
		});
	}

	public read<TBuffer extends Buffer | Uint8Array>(fd: number, buffer: TBuffer, offset: number, length: number, position: number | null, callback: (err: NodeJS.ErrnoException, bytesRead: number, buffer: TBuffer) => void): void {
		this.client.evaluate(async (fd, bufferLength, length, position) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			const buffer = new Buffer(length);
			const resp = await util.promisify(fs.read)(fd, buffer, 0, length, position);

			return {
				bytesRead: resp.bytesRead,
				content: buffer.toString("utf8"),
			};
		}, fd, buffer.byteLength, length, position).then((resp) => {
			const newBuf = Buffer.from(resp.content, "utf8");
			buffer.set(newBuf, offset);
			callback(undefined!, resp.bytesRead, newBuf as TBuffer);
		}).catch((ex) => {
			callback(ex, undefined!, undefined!);
		});
	}

	public readFile(path: fs.PathLike | number, options: string | { encoding?: string | null | undefined; flag?: string | undefined; } | null | undefined, callback: (err: NodeJS.ErrnoException, data: string | Buffer) => void): void {
		this.client.evaluate(async (path, options) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			const value = await util.promisify(fs.readFile)(path, options);

			return value.toString();
		}, path, options).then((buffer) => {
			callback(undefined!, buffer);
		}).catch((ex) => {
			callback(ex, undefined!);
		});
	}

	public readdir(path: fs.PathLike, options: { encoding: BufferEncoding | null } | BufferEncoding | undefined | null, callback: (err: NodeJS.ErrnoException, files: string[]) => void): void {
		this.client.evaluate((path, options) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.readdir)(path, options);
		}, path, options).then((files) => {
			callback(undefined!, files);
		}).catch((ex) => {
			callback(ex, undefined!);
		});
	}

	public readlink(path: fs.PathLike, options: { encoding?: BufferEncoding | null } | BufferEncoding | undefined | null, callback: (err: NodeJS.ErrnoException, linkString: string) => void): void {
		this.client.evaluate((path, options) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.readlink)(path, options);
		}, path, options).then((linkString) => {
			callback(undefined!, linkString);
		}).catch((ex) => {
			callback(ex, undefined!);
		});
	}

	public realpath(path: fs.PathLike, options: { encoding?: BufferEncoding | null } | BufferEncoding | undefined | null, callback: (err: NodeJS.ErrnoException, resolvedPath: string) => void): void {
		this.client.evaluate((path, options) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.realpath)(path, options);
		}, path, options).then((resolvedPath) => {
			callback(undefined!, resolvedPath);
		}).catch((ex) => {
			callback(ex, undefined!);
		});
	}

	public rename(oldPath: fs.PathLike, newPath: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((oldPath, newPath) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.rename)(oldPath, newPath);
		}, oldPath, newPath).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public rmdir(path: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((path) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.rmdir)(path);
		}, path).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public stat(path: fs.PathLike, callback: (err: NodeJS.ErrnoException, stats: fs.Stats) => void): void {
		this.client.evaluate(async (path) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			const stats = await util.promisify(fs.stat)(path);
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
		}, path).then((stats) => {
			callback(undefined!, Stats.fromObject(stats));
		}).catch((ex) => {
			callback(ex, undefined!);
		});
	}

	public symlink(target: fs.PathLike, path: fs.PathLike, type: fs.symlink.Type | undefined | null, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((target, path, type) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.symlink)(target, path, type);
		}, target, path, type).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public truncate(path: fs.PathLike, len: number | undefined | null, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((path, len) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.truncate)(path, len);
		}, path, len).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public unlink(path: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((path) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.unlink)(path);
		}, path).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public utimes(path: fs.PathLike, atime: string | number | Date, mtime: string | number | Date, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((path, atime, mtime) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.utimes)(path, atime, mtime);
		}, path, atime, mtime).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public write<TBuffer extends Buffer | Uint8Array>(fd: number, buffer: TBuffer, offset: number | undefined, length: number | undefined, position: number | undefined, callback: (err: NodeJS.ErrnoException, written: number, buffer: TBuffer) => void): void {
		this.client.evaluate(async (fd, buffer, offset, length, position) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			const resp = await util.promisify(fs.write)(fd, Buffer.from(buffer, "utf8"), offset, length, position);

			return {
				bytesWritten: resp.bytesWritten,
				content: resp.buffer.toString("utf8"),
			}
		}, fd, buffer.toString(), offset, length, position).then((r) => {
			callback(undefined!, r.bytesWritten, Buffer.from(r.content, "utf8") as TBuffer);
		}).catch((ex) => {
			callback(ex, undefined!, undefined!);
		});
	}

	public writeFile(path: fs.PathLike | number, data: any, options: { encoding?: string | null; mode?: number | string; flag?: string; } | string | undefined | null, callback: (err: NodeJS.ErrnoException) => void): void {
		this.client.evaluate((path, data, options) => {
			const fs = require("fs") as typeof import("fs");
			const util = require("util") as typeof import("util");
			return util.promisify(fs.writeFile)(path, data, options);
		}, path, data, options).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}
}

class Stats implements fs.Stats {

	public static fromObject(object: any): Stats {
		return new Stats(object);
	}

	// @ts-ignore
	public readonly dev: number;
	// @ts-ignore
	public readonly ino: number;
	// @ts-ignore
	public readonly mode: number;
	// @ts-ignore
	public readonly nlink: number;
	// @ts-ignore
	public readonly uid: number;
	// @ts-ignore
	public readonly gid: number;
	// @ts-ignore
	public readonly rdev: number;
	// @ts-ignore
	public readonly size: number;
	// @ts-ignore
	public readonly blksize: number;
	// @ts-ignore
	public readonly blocks: number;
	// @ts-ignore
	public readonly atimeMs: number;
	// @ts-ignore
	public readonly mtimeMs: number;
	// @ts-ignore
	public readonly ctimeMs: number;
	// @ts-ignore
	public readonly birthtimeMs: number;
	// @ts-ignore
	public readonly atime: Date;
	// @ts-ignore
	public readonly mtime: Date;
	// @ts-ignore
	public readonly ctime: Date;
	// @ts-ignore
	public readonly birthtime: Date;
	// @ts-ignore
	private readonly _isFile: boolean;
	// @ts-ignore
	private readonly _isDirectory: boolean;
	// @ts-ignore
	private readonly _isBlockDevice: boolean;
	// @ts-ignore
	private readonly _isCharacterDevice: boolean;
	// @ts-ignore
	private readonly _isSymbolicLink: boolean;
	// @ts-ignore
	private readonly _isFIFO: boolean;
	// @ts-ignore
	private readonly _isSocket: boolean;

	private constructor(stats: object) {
		Object.assign(this, stats);
	}

	public isFile(): boolean {
		return this._isFile;
	}

	public isDirectory(): boolean {
		return this._isDirectory;
	}

	public isBlockDevice(): boolean {
		return this._isBlockDevice;
	}

	public isCharacterDevice(): boolean {
		return this._isCharacterDevice;
	}

	public isSymbolicLink(): boolean {
		return this._isSymbolicLink;
	}

	public isFIFO(): boolean {
		return this._isFIFO;
	}

	public isSocket(): boolean {
		return this._isSocket;
	}

	public toObject(): object {
		return JSON.parse(JSON.stringify(this));
	}

}
