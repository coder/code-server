import { EventEmitter } from "events";
import * as fs from "fs";
import * as stream from "stream";
import { Client, IEncodingOptions, IEncodingOptionsCallback } from "@coder/protocol";
import { client } from "./client";
import { promisify } from "util";

declare var __non_webpack_require__: typeof require;
declare var _Buffer: typeof Buffer;

/**
 * Implements the native fs module
 * Doesn't use `implements typeof import("fs")` to remove need for __promisify__ impls
 *
 * TODO: For now we can't use async in the evaluate calls because they get
 * transpiled to TypeScript's helpers. tslib is included but we also need to set
 * _this somehow which the __awaiter helper uses.
 */
class FS {
	public constructor(
		private readonly client: Client,
	) { }

	public access = (path: fs.PathLike, mode: number | undefined | ((err: NodeJS.ErrnoException) => void), callback?: (err: NodeJS.ErrnoException) => void): void => {
		if (typeof mode === "function") {
			callback = mode;
			mode = undefined;
		}
		this.client.evaluate((_helper, path, mode) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

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
		this.client.evaluate((_helper, path, data, options) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.appendFile)(path, data, options);
		}, file, data, options).then(() => {
			callback!(undefined!);
		}).catch((ex) => {
			callback!(ex);
		});
	}

	public chmod = (path: fs.PathLike, mode: string | number, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((_helper, path, mode) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.chmod)(path, mode);
		}, path, mode).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public chown = (path: fs.PathLike, uid: number, gid: number, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((_helper, path, uid, gid) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.chown)(path, uid, gid);
		}, path, uid, gid).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public close = (fd: number, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((_helper, fd) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

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
		this.client.evaluate((_helper, src, dest, flags) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.copyFile)(src, dest, flags);
		}, src, dest, typeof flags !== "function" ? flags : undefined).then(() => {
			callback!(undefined!);
		}).catch((ex) => {
			callback!(ex);
		});
	}

	// tslint:disable-next-line no-any
	public createWriteStream = (path: fs.PathLike, options?: any): fs.WriteStream => {
		const ae = this.client.run((ae, path, options) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const str = fs.createWriteStream(path, options);
			ae.on("write", (d: string) => str.write(_Buffer.from(d, "utf8")));
			ae.on("close", () => str.close());
			ae.on("destroy", () => str.destroy());
			str.on("close", () => ae.emit("close"));
			str.on("open", (fd) => ae.emit("open", fd));
			str.on("error", (err) => ae.emit(err));

			return {
				onDidDispose: (cb): fs.WriteStream => str.on("close", cb),
				dispose: (): void => str.close(),
			};
		}, path, options);

		return new (class WriteStream extends stream.Writable implements fs.WriteStream {

			private _bytesWritten: number = 0;

			public constructor() {
				super({
					write: (data, encoding, cb): void => {
						this._bytesWritten += data.length;
						ae.emit("write", Buffer.from(data, encoding), encoding);
						cb();
					},
				});

				ae.on("open", (fd: number) => this.emit("open", fd));
				ae.on("close", () => this.emit("close"));
			}

			public get bytesWritten(): number {
				return this._bytesWritten;
			}

			public get path(): string | Buffer {
				return "";
			}

			public close(): void {
				ae.emit("close");
			}

			public destroy(): void {
				ae.emit("destroy");
			}

		}) as fs.WriteStream;
	}

	public exists = (path: fs.PathLike, callback: (exists: boolean) => void): void => {
		this.client.evaluate((_helper, path) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.exists)(path);
		}, path).then((r) => {
			callback(r);
		}).catch(() => {
			callback(false);
		});
	}

	public fchmod = (fd: number, mode: string | number, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((_helper, fd, mode) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.fchmod)(fd, mode);
		}, fd, mode).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public fchown = (fd: number, uid: number, gid: number, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((_helper, fd, uid, gid) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.fchown)(fd, uid, gid);
		}, fd, uid, gid).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public fdatasync = (fd: number, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((_helper, fd) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.fdatasync)(fd);
		}, fd).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public fstat = (fd: number, callback: (err: NodeJS.ErrnoException, stats: fs.Stats) => void): void => {
		this.client.evaluate((_helper, fd) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");
			const tslib = __non_webpack_require__("tslib") as typeof import("tslib");

			return util.promisify(fs.fstat)(fd).then((stats) => {
				return tslib.__assign(stats, {
					_isBlockDevice: stats.isBlockDevice ? stats.isBlockDevice() : false,
					_isCharacterDevice: stats.isCharacterDevice ? stats.isCharacterDevice() : false,
					_isDirectory: stats.isDirectory(),
					_isFIFO: stats.isFIFO ? stats.isFIFO() : false,
					_isFile: stats.isFile(),
					_isSocket: stats.isSocket ? stats.isSocket() : false,
					_isSymbolicLink: stats.isSymbolicLink ? stats.isSymbolicLink() : false,
				});
			});
		}, fd).then((stats) => {
			callback(undefined!, new Stats(stats));
		}).catch((ex) => {
			callback(ex, undefined!);
		});
	}

	public fsync = (fd: number, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((_helper, fd) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

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
		this.client.evaluate((_helper, fd, len) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.ftruncate)(fd, len);
		}, fd, len).then(() => {
			callback!(undefined!);
		}).catch((ex) => {
			callback!(ex);
		});
	}

	public futimes = (fd: number, atime: string | number | Date, mtime: string | number | Date, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((_helper, fd, atime, mtime) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.futimes)(fd, atime, mtime);
		}, fd, atime, mtime).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public lchmod = (path: fs.PathLike, mode: string | number, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((_helper, path, mode) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.lchmod)(path, mode);
		}, path, mode).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public lchown = (path: fs.PathLike, uid: number, gid: number, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((_helper, path, uid, gid) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.lchown)(path, uid, gid);
		}, path, uid, gid).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public link = (existingPath: fs.PathLike, newPath: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((_helper, existingPath, newPath) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.link)(existingPath, newPath);
		}, existingPath, newPath).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public lstat = (path: fs.PathLike, callback: (err: NodeJS.ErrnoException, stats: fs.Stats) => void): void => {
		this.client.evaluate((_helper, path) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");
			const tslib = __non_webpack_require__("tslib") as typeof import("tslib");

			return util.promisify(fs.lstat)(path).then((stats) => {
				return tslib.__assign(stats, {
					_isBlockDevice: stats.isBlockDevice ? stats.isBlockDevice() : false,
					_isCharacterDevice: stats.isCharacterDevice ? stats.isCharacterDevice() : false,
					_isDirectory: stats.isDirectory(),
					_isFIFO: stats.isFIFO ? stats.isFIFO() : false,
					_isFile: stats.isFile(),
					_isSocket: stats.isSocket ? stats.isSocket() : false,
					_isSymbolicLink: stats.isSymbolicLink ? stats.isSymbolicLink() : false,
				});
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
		this.client.evaluate((_helper, path, mode) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

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
		this.client.evaluate((_helper, prefix, options) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

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
		this.client.evaluate((_helper, path, flags, mode) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.open)(path, flags, mode);
		}, path, flags, mode).then((fd) => {
			callback!(undefined!, fd);
		}).catch((ex) => {
			callback!(ex, undefined!);
		});
	}

	public read = <TBuffer extends Buffer | Uint8Array>(fd: number, buffer: TBuffer, offset: number, length: number, position: number | null, callback: (err: NodeJS.ErrnoException, bytesRead: number, buffer: TBuffer) => void): void => {
		this.client.evaluate((_helper, fd, length, position) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");
			const buffer = new _Buffer(length);

			return util.promisify(fs.read)(fd, buffer, 0, length, position).then((resp) => {
				return {
					bytesRead: resp.bytesRead,
					content: resp.bytesRead < buffer.length ? buffer.slice(0, resp.bytesRead) : buffer,
				};
			});
		}, fd, length, position).then((resp) => {
			buffer.set(resp.content, offset);
			callback(undefined!, resp.bytesRead, resp.content as TBuffer);
		}).catch((ex) => {
			callback(ex, undefined!, undefined!);
		});
	}

	public readFile = (path: fs.PathLike | number, options: IEncodingOptionsCallback, callback?: (err: NodeJS.ErrnoException, data: string | Buffer) => void): void => {
		if (typeof options === "function") {
			callback = options;
			options = undefined;
		}
		this.client.evaluate((_helper, path, options) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

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
		this.client.evaluate((_helper, path, options) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

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
		this.client.evaluate((_helper, path, options) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

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
		this.client.evaluate((_helper, path, options) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.realpath)(path, options);
		}, path, options).then((resolvedPath) => {
			callback!(undefined!, resolvedPath);
		}).catch((ex) => {
			callback!(ex, undefined!);
		});
	}

	public rename = (oldPath: fs.PathLike, newPath: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((_helper, oldPath, newPath) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.rename)(oldPath, newPath);
		}, oldPath, newPath).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public rmdir = (path: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((_helper, path) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.rmdir)(path);
		}, path).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public stat = (path: fs.PathLike, callback: (err: NodeJS.ErrnoException, stats: fs.Stats) => void): void => {
		this.client.evaluate((_helper, path) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");
			const tslib = __non_webpack_require__("tslib") as typeof import("tslib");

			return util.promisify(fs.stat)(path).then((stats) => {
				return tslib.__assign(stats, {
					/**
					 * We need to check if functions exist because nexe's implemented FS
					 * lib doesnt implement fs.stats properly
					 */
					_isBlockDevice: stats.isBlockDevice ? stats.isBlockDevice() : false,
					_isCharacterDevice: stats.isCharacterDevice ? stats.isCharacterDevice() : false,
					_isDirectory: stats.isDirectory(),
					_isFIFO: stats.isFIFO ? stats.isFIFO() : false,
					_isFile: stats.isFile(),
					_isSocket: stats.isSocket ? stats.isSocket() : false,
					_isSymbolicLink: stats.isSymbolicLink ? stats.isSymbolicLink() : false,
				});
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
		this.client.evaluate((_helper, target, path, type) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

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
		this.client.evaluate((_helper, path, len) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.truncate)(path, len);
		}, path, len).then(() => {
			callback!(undefined!);
		}).catch((ex) => {
			callback!(ex);
		});
	}

	public unlink = (path: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((_helper, path) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.unlink)(path);
		}, path).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
	}

	public utimes = (path: fs.PathLike, atime: string | number | Date, mtime: string | number | Date, callback: (err: NodeJS.ErrnoException) => void): void => {
		this.client.evaluate((_helper, path, atime, mtime) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.utimes)(path, atime, mtime);
		}, path, atime, mtime).then(() => {
			callback(undefined!);
		}).catch((ex) => {
			callback(ex);
		});
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
		this.client.evaluate((_helper, fd, buffer, offset, length, position) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.write)(fd, _Buffer.from(buffer, "utf8"), offset, length, position).then((resp) => {
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
		this.client.evaluate((_helper, path, data, options) => {
			const fs = __non_webpack_require__("fs") as typeof import("fs");
			const util = __non_webpack_require__("util") as typeof import("util");

			return util.promisify(fs.writeFile)(path, data, options);
		}, path, data, options).then(() => {
			callback!(undefined!);
		}).catch((ex) => {
			callback!(ex);
		});
	}

	public watch = (filename: fs.PathLike, options?: IEncodingOptions | ((event: string, filename: string | Buffer) => void), listener?: ((event: string, filename: string | Buffer) => void)): fs.FSWatcher => {
		if (typeof options === "function") {
			listener = options;
			options = undefined;
		}

		const ae = this.client.run((ae, filename, hasListener, options) => {
			const fs = __non_webpack_require__("fs") as typeof import ("fs");
			// tslint:disable-next-line no-any
			const watcher = fs.watch(filename, options as any, hasListener ? (event, filename): void => {
				ae.emit("listener", event, filename);
			} : undefined);
			watcher.on("change", (event, filename) => ae.emit("change", event, filename));
			watcher.on("error", (error) => ae.emit("error", error));
			ae.on("close", () => watcher.close());

			return {
				onDidDispose: (cb): void => ae.on("close", cb),
				dispose: (): void => watcher.close(),
			};
		}, filename.toString(), !!listener, options);

		return new class Watcher extends EventEmitter implements fs.FSWatcher {
			public constructor() {
				super();
				ae.on("change", (event: string, filename: string) => this.emit("change", event, filename));
				ae.on("error", (error: Error) => this.emit("error", error));
				ae.on("listener", (event: string, filename: string) => listener && listener(event, filename));
			}

			public close(): void {
				ae.emit("close");
			}
		};
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

const fillFs = new FS(client);
// Methods that don't follow the standard callback pattern (an error followed
// by a single result) need to provide a custom promisify function.
Object.defineProperty(fillFs.exists, promisify.custom, {
	value: (path: fs.PathLike): Promise<boolean> => new Promise((resolve): void => fillFs.exists(path, resolve)),
});
export = fillFs;
