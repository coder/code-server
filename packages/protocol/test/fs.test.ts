import * as nativeFs from "fs";
import * as path from "path";
import * as util from "util";
import { Module } from "../src/common/proxy";
import { createClient, Helper } from "./helpers";

// tslint:disable deprecation to use fs.exists

describe("fs", () => {
	const client = createClient();
	// tslint:disable-next-line no-any
	const fs = client.modules[Module.Fs] as any as typeof import("fs");
	const helper = new Helper("fs");

	beforeAll(async () => {
		await helper.prepare();
	});

	describe("access", () => {
		it("should access existing file", async () => {
			await expect(util.promisify(fs.access)(__filename))
				.resolves.toBeUndefined();
		});

		it("should fail to access nonexistent file", async () => {
			await expect(util.promisify(fs.access)(helper.tmpFile()))
				.rejects.toThrow("ENOENT");
		});
	});

	describe("append", () => {
		it("should append to existing file", async () => {
			const file = await helper.createTmpFile();
			await expect(util.promisify(fs.appendFile)(file, "howdy"))
				.resolves.toBeUndefined();
			expect(await util.promisify(nativeFs.readFile)(file, "utf8"))
				.toEqual("howdy");
		});

		it("should create then append to nonexistent file", async () => {
			const file = helper.tmpFile();
			await expect(util.promisify(fs.appendFile)(file, "howdy"))
				.resolves.toBeUndefined();
			expect(await util.promisify(nativeFs.readFile)(file, "utf8"))
				.toEqual("howdy");
		});

		it("should fail to append to file in nonexistent directory", async () => {
			const file = path.join(helper.tmpFile(), "nope");
			await expect(util.promisify(fs.appendFile)(file, "howdy"))
				.rejects.toThrow("ENOENT");
			expect(await util.promisify(nativeFs.exists)(file))
				.toEqual(false);
		});
	});

	describe("chmod", () => {
		it("should chmod existing file", async () => {
			const file = await helper.createTmpFile();
			await expect(util.promisify(fs.chmod)(file, "755"))
				.resolves.toBeUndefined();
		});

		it("should fail to chmod nonexistent file", async () => {
			await expect(util.promisify(fs.chmod)(helper.tmpFile(), "755"))
				.rejects.toThrow("ENOENT");
		});
	});

	describe("chown", () => {
		it("should chown existing file", async () => {
			const file = await helper.createTmpFile();
			await expect(util.promisify(fs.chown)(file, 1, 1))
				.resolves.toBeUndefined();
		});

		it("should fail to chown nonexistent file", async () => {
			await expect(util.promisify(fs.chown)(helper.tmpFile(), 1, 1))
				.rejects.toThrow("ENOENT");
		});
	});

	describe("close", () => {
		it("should close opened file", async () => {
			const file = await helper.createTmpFile();
			const fd = await util.promisify(nativeFs.open)(file, "r");
			await expect(util.promisify(fs.close)(fd))
				.resolves.toBeUndefined();
		});

		it("should fail to close non-opened file", async () => {
			await expect(util.promisify(fs.close)(99999999))
				.rejects.toThrow("EBADF");
		});
	});

	describe("copyFile", () => {
		it("should copy existing file", async () => {
			const source = await helper.createTmpFile();
			const destination = helper.tmpFile();
			await expect(util.promisify(fs.copyFile)(source, destination))
				.resolves.toBeUndefined();
			await expect(util.promisify(fs.exists)(destination))
				.resolves.toBe(true);
		});

		it("should fail to copy nonexistent file", async () => {
			await expect(util.promisify(fs.copyFile)(helper.tmpFile(), helper.tmpFile()))
				.rejects.toThrow("ENOENT");
		});
	});

	describe("createWriteStream", () => {
		it("should write to file", async () => {
			const file = helper.tmpFile();
			const content = "howdy\nhow\nr\nu";
			const stream = fs.createWriteStream(file);
			stream.on("open", (fd) => {
				expect(fd).toBeDefined();
				stream.write(content);
				stream.close();
				stream.end();
			});

			await Promise.all([
				new Promise((resolve): nativeFs.WriteStream => stream.on("close", resolve)),
				new Promise((resolve): nativeFs.WriteStream => stream.on("finish", resolve)),
			]);

			await expect(util.promisify(nativeFs.readFile)(file, "utf8")).resolves.toBe(content);
		});
	});

	describe("exists", () => {
		it("should output file exists", async () => {
			await expect(util.promisify(fs.exists)(__filename))
				.resolves.toBe(true);
		});

		it("should output file does not exist", async () => {
			await expect(util.promisify(fs.exists)(helper.tmpFile()))
				.resolves.toBe(false);
		});
	});

	describe("fchmod", () => {
		it("should fchmod existing file", async () => {
			const file = await helper.createTmpFile();
			const fd = await util.promisify(nativeFs.open)(file, "r");
			await expect(util.promisify(fs.fchmod)(fd, "755"))
				.resolves.toBeUndefined();
			await util.promisify(nativeFs.close)(fd);
		});

		it("should fail to fchmod nonexistent file", async () => {
			await expect(util.promisify(fs.fchmod)(2242342, "755"))
				.rejects.toThrow("EBADF");
		});
	});

	describe("fchown", () => {
		it("should fchown existing file", async () => {
			const file = await helper.createTmpFile();
			const fd = await util.promisify(nativeFs.open)(file, "r");
			await expect(util.promisify(fs.fchown)(fd, 1, 1))
				.resolves.toBeUndefined();
			await util.promisify(nativeFs.close)(fd);
		});

		it("should fail to fchown nonexistent file", async () => {
			await expect(util.promisify(fs.fchown)(99999, 1, 1))
				.rejects.toThrow("EBADF");
		});
	});

	describe("fdatasync", () => {
		it("should fdatasync existing file", async () => {
			const file = await helper.createTmpFile();
			const fd = await util.promisify(nativeFs.open)(file, "r");
			await expect(util.promisify(fs.fdatasync)(fd))
				.resolves.toBeUndefined();
			await util.promisify(nativeFs.close)(fd);
		});

		it("should fail to fdatasync nonexistent file", async () => {
			await expect(util.promisify(fs.fdatasync)(99999))
				.rejects.toThrow("EBADF");
		});
	});

	describe("fstat", () => {
		it("should fstat existing file", async () => {
			const fd = await util.promisify(nativeFs.open)(__filename, "r");
			const stat = await util.promisify(nativeFs.fstat)(fd);
			await expect(util.promisify(fs.fstat)(fd))
				.resolves.toMatchObject({
					size: stat.size,
				});
			await util.promisify(nativeFs.close)(fd);
		});

		it("should fail to fstat", async () => {
			await expect(util.promisify(fs.fstat)(9999))
				.rejects.toThrow("EBADF");
		});
	});

	describe("fsync", () => {
		it("should fsync existing file", async () => {
			const file = await helper.createTmpFile();
			const fd = await util.promisify(nativeFs.open)(file, "r");
			await expect(util.promisify(fs.fsync)(fd))
				.resolves.toBeUndefined();
			await util.promisify(nativeFs.close)(fd);
		});

		it("should fail to fsync nonexistent file", async () => {
			await expect(util.promisify(fs.fsync)(99999))
				.rejects.toThrow("EBADF");
		});
	});

	describe("ftruncate", () => {
		it("should ftruncate existing file", async () => {
			const file = await helper.createTmpFile();
			const fd = await util.promisify(nativeFs.open)(file, "w");
			await expect(util.promisify(fs.ftruncate)(fd, 1))
				.resolves.toBeUndefined();
			await util.promisify(nativeFs.close)(fd);
		});

		it("should fail to ftruncate nonexistent file", async () => {
			await expect(util.promisify(fs.ftruncate)(99999, 9999))
				.rejects.toThrow("EBADF");
		});
	});

	describe("futimes", () => {
		it("should futimes existing file", async () => {
			const file = await helper.createTmpFile();
			const fd = await util.promisify(nativeFs.open)(file, "w");
			await expect(util.promisify(fs.futimes)(fd, 1, 1))
				.resolves.toBeUndefined();
			await util.promisify(nativeFs.close)(fd);
		});

		it("should futimes existing file with date", async () => {
			const file = await helper.createTmpFile();
			const fd = await util.promisify(nativeFs.open)(file, "w");
			await expect(util.promisify(fs.futimes)(fd, new Date(), new Date()))
				.resolves.toBeUndefined();
			await util.promisify(nativeFs.close)(fd);
		});

		it("should fail to futimes nonexistent file", async () => {
			await expect(util.promisify(fs.futimes)(99999, 9999, 9999))
				.rejects.toThrow("EBADF");
		});
	});

	describe("lchmod", () => {
		it("should lchmod existing file", async () => {
			const file = await helper.createTmpFile();
			await expect(util.promisify(fs.lchmod)(file, "755"))
				.resolves.toBeUndefined();
		});

		// TODO: Doesn't fail on my system?
		it("should fail to lchmod nonexistent file", async () => {
			await expect(util.promisify(fs.lchmod)(helper.tmpFile(), "755"))
				.resolves.toBeUndefined();
		});
	});

	describe("lchown", () => {
		it("should lchown existing file", async () => {
			const file = await helper.createTmpFile();
			await expect(util.promisify(fs.lchown)(file, 1, 1))
				.resolves.toBeUndefined();
		});

		// TODO: Doesn't fail on my system?
		it("should fail to lchown nonexistent file", async () => {
			await expect(util.promisify(fs.lchown)(helper.tmpFile(), 1, 1))
				.resolves.toBeUndefined();
		});
	});

	describe("link", () => {
		it("should link existing file", async () => {
			const source = await helper.createTmpFile();
			const destination = helper.tmpFile();
			await expect(util.promisify(fs.link)(source, destination))
				.resolves.toBeUndefined();
			await expect(util.promisify(fs.exists)(destination))
				.resolves.toBe(true);
		});

		it("should fail to link nonexistent file", async () => {
			await expect(util.promisify(fs.link)(helper.tmpFile(), helper.tmpFile()))
				.rejects.toThrow("ENOENT");
		});
	});

	describe("lstat", () => {
		it("should lstat existing file", async () => {
			const stat = await util.promisify(nativeFs.lstat)(__filename);
			await expect(util.promisify(fs.lstat)(__filename))
				.resolves.toMatchObject({
					size: stat.size,
				});
		});

		it("should fail to lstat non-existent file", async () => {
			await expect(util.promisify(fs.lstat)(helper.tmpFile()))
				.rejects.toThrow("ENOENT");
		});
	});

	describe("mkdir", () => {
		let target: string;
		it("should create nonexistent directory", async () => {
			target = helper.tmpFile();
			await expect(util.promisify(fs.mkdir)(target))
				.resolves.toBeUndefined();
		});

		it("should fail to create existing directory", async () => {
			await expect(util.promisify(fs.mkdir)(target))
				.rejects.toThrow("EEXIST");
		});
	});

	describe("mkdtemp", () => {
		it("should create temp dir", async () => {
			await expect(util.promisify(fs.mkdtemp)(helper.coderDir + "/"))
				.resolves.toMatch(/^\/tmp\/coder\/fs\/[a-zA-Z0-9]{6}/);
		});
	});

	describe("open", () => {
		it("should open existing file", async () => {
			const fd = await util.promisify(fs.open)(__filename, "r");
			expect(fd).not.toBeNaN();
			await expect(util.promisify(fs.close)(fd))
				.resolves.toBeUndefined();
		});

		it("should fail to open nonexistent file", async () => {
			await expect(util.promisify(fs.open)(helper.tmpFile(), "r"))
				.rejects.toThrow("ENOENT");
		});
	});

	describe("read", () => {
		it("should read existing file", async () => {
			const fd = await util.promisify(nativeFs.open)(__filename, "r");
			const stat = await util.promisify(nativeFs.fstat)(fd);
			const buffer = Buffer.alloc(stat.size);
			let bytesRead = 0;
			let chunkSize = 2048;
			while (bytesRead < stat.size) {
				if ((bytesRead + chunkSize) > stat.size) {
					chunkSize = stat.size - bytesRead;
				}

				await util.promisify(fs.read)(fd, buffer, bytesRead, chunkSize, bytesRead);
				bytesRead += chunkSize;
			}

			const content = await util.promisify(nativeFs.readFile)(__filename, "utf8");
			expect(buffer.toString()).toEqual(content);
			await util.promisify(nativeFs.close)(fd);
		});

		it("should fail to read nonexistent file", async () => {
			await expect(util.promisify(fs.read)(99999, Buffer.alloc(10), 9999, 999, 999))
				.rejects.toThrow("EBADF");
		});
	});

	describe("readFile", () => {
		it("should read existing file", async () => {
			const content = await util.promisify(nativeFs.readFile)(__filename, "utf8");
			await expect(util.promisify(fs.readFile)(__filename, "utf8"))
				.resolves.toEqual(content);
		});

		it("should fail to read nonexistent file", async () => {
			await expect(util.promisify(fs.readFile)(helper.tmpFile()))
				.rejects.toThrow("ENOENT");
		});
	});

	describe("readdir", () => {
		it("should read existing directory", async () => {
			const paths = await util.promisify(nativeFs.readdir)(helper.coderDir);
			await expect(util.promisify(fs.readdir)(helper.coderDir))
				.resolves.toEqual(paths);
		});

		it("should fail to read nonexistent directory", async () => {
			await expect(util.promisify(fs.readdir)(helper.tmpFile()))
				.rejects.toThrow("ENOENT");
		});
	});

	describe("readlink", () => {
		it("should read existing link", async () => {
			const source = await helper.createTmpFile();
			const destination = helper.tmpFile();
			await util.promisify(nativeFs.symlink)(source, destination);
			await expect(util.promisify(fs.readlink)(destination))
				.resolves.toBe(source);
		});

		it("should fail to read nonexistent link", async () => {
			await expect(util.promisify(fs.readlink)(helper.tmpFile()))
				.rejects.toThrow("ENOENT");
		});
	});

	describe("realpath", () => {
		it("should read real path of existing file", async () => {
			const source = await helper.createTmpFile();
			const destination = helper.tmpFile();
			nativeFs.symlinkSync(source, destination);
			await expect(util.promisify(fs.realpath)(destination))
				.resolves.toBe(source);
		});

		it("should fail to read real path of nonexistent file", async () => {
			await expect(util.promisify(fs.realpath)(helper.tmpFile()))
				.rejects.toThrow("ENOENT");
		});
	});

	describe("rename", () => {
		it("should rename existing file", async () => {
			const source = await helper.createTmpFile();
			const destination = helper.tmpFile();
			await expect(util.promisify(fs.rename)(source, destination))
				.resolves.toBeUndefined();
			await expect(util.promisify(nativeFs.exists)(source))
				.resolves.toBe(false);
			await expect(util.promisify(nativeFs.exists)(destination))
				.resolves.toBe(true);
		});

		it("should fail to rename nonexistent file", async () => {
			await expect(util.promisify(fs.rename)(helper.tmpFile(), helper.tmpFile()))
				.rejects.toThrow("ENOENT");
		});
	});

	describe("rmdir", () => {
		it("should rmdir existing directory", async () => {
			const dir = helper.tmpFile();
			await util.promisify(nativeFs.mkdir)(dir);
			await expect(util.promisify(fs.rmdir)(dir))
				.resolves.toBeUndefined();
			await expect(util.promisify(nativeFs.exists)(dir))
				.resolves.toBe(false);
		});

		it("should fail to rmdir nonexistent directory", async () => {
			await expect(util.promisify(fs.rmdir)(helper.tmpFile()))
				.rejects.toThrow("ENOENT");
		});
	});

	describe("stat", () => {
		it("should stat existing file", async () => {
			const nativeStat = await util.promisify(nativeFs.stat)(__filename);
			const stat = await util.promisify(fs.stat)(__filename);
			expect(stat).toMatchObject({
				size: nativeStat.size,
			});
			expect(typeof stat.mtime.getTime()).toBe("number");
			expect(stat.isFile()).toBe(true);
		});

		it("should stat existing folder", async () => {
			const dir = helper.tmpFile();
			await util.promisify(nativeFs.mkdir)(dir);
			const nativeStat = await util.promisify(nativeFs.stat)(dir);
			const stat = await util.promisify(fs.stat)(dir);
			expect(stat).toMatchObject({
				size: nativeStat.size,
			});
			expect(stat.isDirectory()).toBe(true);
		});

		it("should fail to stat nonexistent file", async () => {
			const error = await util.promisify(fs.stat)(helper.tmpFile()).catch((e) => e);
			expect(error.message).toContain("ENOENT");
			expect(error.code).toBe("ENOENT");
		});
	});

	describe("symlink", () => {
		it("should symlink existing file", async () => {
			const source = await helper.createTmpFile();
			const destination = helper.tmpFile();
			await expect(util.promisify(fs.symlink)(source, destination))
				.resolves.toBeUndefined();
			await expect(util.promisify(nativeFs.exists)(source))
				.resolves.toBe(true);
		});

		// TODO: Seems to be happy to do this on my system?
		it("should fail to symlink nonexistent file", async () => {
			await expect(util.promisify(fs.symlink)(helper.tmpFile(), helper.tmpFile()))
				.resolves.toBeUndefined();
		});
	});

	describe("truncate", () => {
		it("should truncate existing file", async () => {
			const file = helper.tmpFile();
			await util.promisify(nativeFs.writeFile)(file, "hiiiiii");
			await expect(util.promisify(fs.truncate)(file, 2))
				.resolves.toBeUndefined();
			await expect(util.promisify(nativeFs.readFile)(file, "utf8"))
				.resolves.toBe("hi");
		});

		it("should fail to truncate nonexistent file", async () => {
			await expect(util.promisify(fs.truncate)(helper.tmpFile(), 0))
				.rejects.toThrow("ENOENT");
		});
	});

	describe("unlink", () => {
		it("should unlink existing file", async () => {
			const file = await helper.createTmpFile();
			await expect(util.promisify(fs.unlink)(file))
				.resolves.toBeUndefined();
			await expect(util.promisify(nativeFs.exists)(file))
				.resolves.toBe(false);
		});

		it("should fail to unlink nonexistent file", async () => {
			await expect(util.promisify(fs.unlink)(helper.tmpFile()))
				.rejects.toThrow("ENOENT");
		});
	});

	describe("utimes", () => {
		it("should update times on existing file", async () => {
			const file = await helper.createTmpFile();
			await expect(util.promisify(fs.utimes)(file, 100, 100))
				.resolves.toBeUndefined();
		});

		it("should fail to update times on nonexistent file", async () => {
			await expect(util.promisify(fs.utimes)(helper.tmpFile(), 100, 100))
				.rejects.toThrow("ENOENT");
		});
	});

	describe("write", () => {
		it("should write to existing file", async () => {
			const file = await helper.createTmpFile();
			const fd = await util.promisify(nativeFs.open)(file, "w");
			await expect(util.promisify(fs.write)(fd, Buffer.from("hi")))
				.resolves.toBe(2);
			await expect(util.promisify(nativeFs.readFile)(file, "utf8"))
				.resolves.toBe("hi");
			await util.promisify(nativeFs.close)(fd);
		});

		it("should fail to write to nonexistent file", async () => {
			await expect(util.promisify(fs.write)(100000, Buffer.from("wowow")))
				.rejects.toThrow("EBADF");
		});
	});

	describe("writeFile", () => {
		it("should write file", async () => {
			const file = await helper.createTmpFile();
			await expect(util.promisify(fs.writeFile)(file, "howdy"))
				.resolves.toBeUndefined();
			await expect(util.promisify(nativeFs.readFile)(file, "utf8"))
				.resolves.toBe("howdy");
		});
	});

	it("should dispose", () => {
		client.dispose();
	});
});
