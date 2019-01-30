import * as nativeFs from "fs";
import * as os from "os";
import * as path from "path";
import { createClient } from "../helpers";
import { FS } from "../../src/browser/modules/fs";

describe("fs", () => {
	const client = createClient();
	const fs = new FS(client);
	const testFile = path.join(__dirname, "fs.test.ts");
	const tmpFile = () => path.join(os.tmpdir(), `tmpfile-${Math.random()}`);
	const createTmpFile = (): string => {
		const tf = tmpFile();
		nativeFs.writeFileSync(tf, "");
		return tf;
	};

	describe("access", () => {
		it("should access file", (done) => {
			fs.access(testFile, undefined, (err) => {
				expect(err).toBeUndefined();
				done();
			});
		});

		it("should fail to access file", (done) => {
			fs.access(tmpFile(), undefined, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("append", () => {
		it("should append to file", (done) => {
			const file = createTmpFile();
			fs.appendFile(file, "howdy", undefined, (err) => {
				expect(err).toBeUndefined();
				const content = nativeFs.readFileSync(file).toString();
				expect(content).toEqual("howdy");
				done();
			});
		});

		it("should fail to append to file", (done) => {
			fs.appendFile(tmpFile(), "howdy", undefined, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("chmod", () => {
		it("should chmod file", (done) => {
			fs.chmod(createTmpFile(), "755", (err) => {
				expect(err).toBeUndefined();
				done();
			});
		});

		it("should fail to chmod file", (done) => {
			fs.chmod(tmpFile(), "755", (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("chown", () => {
		it("should chown file", (done) => {
			fs.chown(createTmpFile(), 1, 1, (err) => {
				expect(err).toBeUndefined();
				done();
			});
		});

		it("should fail to chown file", (done) => {
			fs.chown(tmpFile(), 1, 1, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("close", () => {
		it("should close file", (done) => {
			const file = createTmpFile();
			const id = nativeFs.openSync(file, "r");
			fs.close(id, (err) => {
				expect(err).toBeUndefined();
				done();
			});
		});

		it("should fail to close file", (done) => {
			fs.close(99999999, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("copyFile", () => {
		it("should copy file", (done) => {
			const file = createTmpFile();
			fs.copyFile(file, tmpFile(), (err) => {
				expect(err).toBeUndefined();
				done();
			});
		});

		it("should fail to copy file", (done) => {
			fs.copyFile(tmpFile(), tmpFile(), (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("createWriteStream", () => {
		it("should write to file", (done) => {
			const file = tmpFile();
			const content = "howdy\nhow\nr\nu";
			const stream = fs.createWriteStream(file);
			stream.on("open", (fd) => {
				expect(fd).toBeDefined();
				stream.write(content);
				stream.close();
			});
			stream.on("close", () => {
				expect(nativeFs.readFileSync(file).toString()).toEqual(content);
				done();
			});
		});
	});

	describe("exists", () => {
		it("should output file exists", (done) => {
			fs.exists(testFile, (exists) => {
				expect(exists).toBeTruthy();
				done();
			});
		});

		it("should output file does not exist", (done) => {
			fs.exists(tmpFile(), (exists) => {
				expect(exists).toBeFalsy();
				done();
			});
		});
	});

	describe("fchmod", () => {
		it("should fchmod", (done) => {
			const file = createTmpFile();
			const id = nativeFs.openSync(file, "r");
			fs.fchmod(id, "755", (err) => {
				expect(err).toBeUndefined();
				done();
			});
		});

		it("should fail to fchmod", (done) => {
			fs.fchmod(2242342, "755", (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("fchown", () => {
		it("should fchown", (done) => {
			const file = createTmpFile();
			const id = nativeFs.openSync(file, "r");
			fs.fchown(id, 1, 1, (err) => {
				expect(err).toBeUndefined();
				done();
			});
		});

		it("should fail to fchown", (done) => {
			fs.fchown(99999, 1, 1, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("fdatasync", () => {
		it("should fdatasync", (done) => {
			const file = createTmpFile();
			const id = nativeFs.openSync(file, "r");
			fs.fdatasync(id, (err) => {
				expect(err).toBeUndefined();
				done();
			});
		});

		it("should fail to fdatasync", (done) => {
			fs.fdatasync(99999, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("fstat", () => {
		it("should fstat", (done) => {
			const id = nativeFs.openSync(testFile, "r");
			fs.fstat(id, (err, stats) => {
				expect(err).toBeUndefined();
				expect(stats.size).toBeGreaterThan(0);
				done();
			});
		});

		it("should fail to fstat", (done) => {
			fs.fstat(9999, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("fsync", () => {
		it("should fsync", (done) => {
			const file = createTmpFile();
			const id = nativeFs.openSync(file, "r");
			fs.fsync(id, (err) => {
				expect(err).toBeUndefined();
				done();
			});
		});

		it("should fail to fsync", (done) => {
			fs.fsync(99999, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("ftruncate", () => {
		it("should ftruncate", (done) => {
			const file = createTmpFile();
			const id = nativeFs.openSync(file, "w");
			fs.ftruncate(id, 1, (err) => {
				expect(err).toBeUndefined();
				done();
			});
		});

		it("should fail to ftruncate", (done) => {
			fs.ftruncate(99999, 9999, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("futimes", () => {
		it("should futimes", (done) => {
			const file = createTmpFile();
			const id = nativeFs.openSync(file, "w");
			fs.futimes(id, 1, 1, (err) => {
				expect(err).toBeUndefined();
				done();
			});
		});

		it("should fail to futimes", (done) => {
			fs.futimes(99999, 9999, 9999, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("lchmod", () => {
		it("should lchmod file", (done) => {
			fs.lchmod(createTmpFile(), "755", (err) => {
				expect(err).toBeUndefined();
				done();
			});
		});

		it("should fail to lchmod file", (done) => {
			fs.lchmod(tmpFile(), "755", (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("lchown", () => {
		it("should lchown file", (done) => {
			fs.lchown(createTmpFile(), 1, 1, (err) => {
				expect(err).toBeUndefined();
				done();
			});
		});

		it("should fail to lchown file", (done) => {
			fs.lchown(tmpFile(), 1, 1, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("link", () => {
		it("should link file", (done) => {
			const newFile = createTmpFile();
			const targetFile = tmpFile();
			fs.link(newFile, targetFile, (err) => {
				expect(err).toBeUndefined();
				expect(nativeFs.existsSync(targetFile)).toBeTruthy();
				done();
			});
		});

		it("should fail to link file", (done) => {
			fs.link(tmpFile(), tmpFile(), (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("lstat", () => {
		it("should lstat", (done) => {
			fs.lstat(testFile, (err, stats) => {
				expect(err).toBeUndefined();
				expect(stats.size).toBeGreaterThan(0);
				done();
			});
		});

		it("should fail to lstat", (done) => {
			fs.lstat(path.join(__dirname, "no-exist"), (err, stats) => {
				expect(err).toBeDefined();
				expect(stats).toBeUndefined();
				done();
			});
		});
	});

	describe("mkdir", () => {
		const target = tmpFile();
		it("should create directory", (done) => {
			fs.mkdir(target, undefined, (err) => {
				expect(err).toBeUndefined();
				done();
			});
		});

		it("should fail to create directory", (done) => {
			fs.mkdir(target, undefined, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("mkdtemp", () => {
		it("should create temp dir", (done) => {
			fs.mkdtemp(path.join(os.tmpdir(), "example"), undefined, (err, folder) => {
				expect(err).toBeUndefined();
				done();
			});
		});
	});

	describe("open", () => {
		it("should open file", (done) => {
			fs.open(testFile, "r", undefined, (err, fd) => {
				expect(err).toBeUndefined();
				expect(fd).toBeDefined();
				done();
			});
		});

		it("should fail to open file", (done) => {
			fs.open("asdfoksfg", "r", undefined, (err, fd) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("read", () => {
		it("should read file", async () => {
			const fd = nativeFs.openSync(testFile, "r");
			const stat = nativeFs.fstatSync(fd);
			const buffer = new Buffer(stat.size);
			let bytesRead = 0;
			let chunkSize = 2048;
			while (bytesRead < stat.size) {
				if ((bytesRead + chunkSize) > stat.size) {
					chunkSize = stat.size - bytesRead;
				}

				await new Promise((res, rej) => {
					fs.read(fd, buffer, bytesRead, chunkSize, bytesRead, (err) => {
						if (err) {
							rej(err);
						} else {
							res();
						}
					});
				});
				bytesRead += chunkSize;
			}

			expect(buffer.toString()).toEqual(nativeFs.readFileSync(testFile).toString());
		});

		it("should fail to read file", (done) => {
			fs.read(99999, new Buffer(10), 9999, 999, 999, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("readFile", () => {
		it("should read file", (done) => {
			fs.readFile(testFile, undefined, (err, data) => {
				expect(err).toBeUndefined();
				expect(data.toString()).toEqual(nativeFs.readFileSync(testFile).toString());
				done();
			});
		});

		it("should fail to read file", (done) => {
			fs.readFile("donkey", undefined, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("readdir", () => {
		it("should read directory", (done) => {
			fs.readdir(__dirname, undefined, (err, paths) => {
				expect(err).toBeUndefined();
				expect(paths.length).toBeGreaterThan(0);
				done();
			});
		});

		it("should fail to read directory", (done) => {
			fs.readdir("moocow", undefined, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("readlink", () => {
		it("should read link", (done) => {
			const srcFile = createTmpFile();
			const linkedFile = tmpFile();
			nativeFs.symlinkSync(srcFile, linkedFile);
			fs.readlink(linkedFile, undefined, (err, link) => {
				expect(err).toBeUndefined();
				expect(link).toEqual(srcFile);
				done();
			});
		});

		it("should fail to read link", (done) => {
			fs.readlink(tmpFile(), undefined, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("realpath", () => {
		it("should read real path", (done) => {
			const srcFile = createTmpFile();
			const linkedFile = tmpFile();
			nativeFs.symlinkSync(srcFile, linkedFile);
			fs.realpath(linkedFile, undefined, (err, link) => {
				expect(err).toBeUndefined();
				expect(link).toEqual(srcFile);
				done();
			});
		});

		it("should fail to read real path", (done) => {
			fs.realpath(tmpFile(), undefined, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("rename", () => {
		it("should rename file", (done) => {
			const srcFile = createTmpFile();
			const targetFile = tmpFile();
			fs.rename(srcFile, targetFile, (err) => {
				expect(err).toBeUndefined();
				expect(nativeFs.existsSync(targetFile)).toBeTruthy();
				done();
			});
		});

		it("should fail to rename file", (done) => {
			fs.rename(tmpFile(), tmpFile(), (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("rmdir", () => {
		it("should rmdir", (done) => {
			const srcFile = tmpFile();
			nativeFs.mkdirSync(srcFile);
			fs.rmdir(srcFile, (err) => {
				expect(err).toBeUndefined();
				expect(nativeFs.existsSync(srcFile)).toBeFalsy();
				done();
			});
		});

		it("should fail to rmdir", (done) => {
			fs.rmdir(tmpFile(), (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("stat", () => {
		it("should stat", (done) => {
			fs.stat(testFile, (err, stats) => {
				expect(err).toBeUndefined();
				expect(stats.size).toBeGreaterThan(0);
				expect(stats.isFile()).toBeTruthy();
				expect(stats.isFIFO()).toBeFalsy();
				done();
			});
		});

		it("should fail to stat", (done) => {
			fs.stat(path.join(__dirname, "no-exist"), (err, stats) => {
				expect(err).toBeDefined();
				expect(stats).toBeUndefined();
				done();
			});
		});
	});

	describe("symlink", () => {
		it("should symlink file", (done) => {
			const newFile = createTmpFile();
			const targetFile = tmpFile();
			fs.symlink(newFile, targetFile, "file", (err) => {
				expect(err).toBeUndefined();
				expect(nativeFs.existsSync(targetFile)).toBeTruthy();
				done();
			});
		});

		it("should fail to symlink file", (done) => {
			fs.symlink(tmpFile(), tmpFile(), "file", (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("truncate", () => {
		it("should truncate file", (done) => {
			const newFile = tmpFile();
			nativeFs.writeFileSync(newFile, "hiiiiii");
			fs.truncate(newFile, 2, (err) => {
				expect(err).toBeUndefined();
				expect(nativeFs.statSync(newFile).size).toEqual(2);
				done();
			});
		});

		it("should fail to truncate file", (done) => {
			fs.truncate(tmpFile(), 0, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("unlink", () => {
		it("should unlink file", (done) => {
			const newFile = createTmpFile();
			const targetFile = tmpFile();
			nativeFs.symlinkSync(newFile, targetFile, "file");
			fs.unlink(targetFile, (err) => {
				expect(err).toBeUndefined();
				done();
			});
		});

		it("should fail to unlink file", (done) => {
			fs.unlink(tmpFile(), (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("utimes", () => {
		it("should update times on file", (done) => {
			fs.utimes(createTmpFile(), 100, 100, (err) => {
				expect(err).toBeUndefined();
				done();
			});
		});

		it("should fail to update times", (done) => {
			fs.utimes(tmpFile(), 100, 100, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("write", () => {
		it("should write to file", (done) => {
			const file = createTmpFile();
			const fd = nativeFs.openSync(file, "w");
			fs.write(fd, Buffer.from("hi"), undefined, undefined, undefined, (err, written) => {
				expect(err).toBeUndefined();
				expect(written).toEqual(2);
				nativeFs.closeSync(fd);
				expect(nativeFs.readFileSync(file).toString()).toEqual("hi");
				done();
			});
		});

		it("should fail to write to file", (done) => {
			fs.write(100000, Buffer.from("wowow"), undefined, undefined, undefined, (err) => {
				expect(err).toBeDefined();
				done();
			});
		});
	});

	describe("writeFile", () => {
		it("should write file", (done) => {
			fs.writeFile(createTmpFile(), "howdy", undefined, (err) => {
				expect(err).toBeUndefined();
				done();
			});
		});
	});
});