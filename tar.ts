/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from "vs/nls";
import * as vszip from "vszip";
import * as fs from "fs";
import * as path from "path";
import * as tarStream from "tar-stream";
import { promisify } from "util";
import { CancellationToken } from "vs/base/common/cancellation";
import { mkdirp } from "vs/base/node/pfs";

export interface IExtractOptions {
	overwrite?: boolean;

	/**
	 * Source path within the TAR/ZIP archive. Only the files
	 * contained in this path will be extracted.
	 */
	sourcePath?: string;
}

export interface IFile {
	path: string;
	contents?: Buffer | string;
	localPath?: string;
}

/**
 * Override the standard VS Code behavior for zipping
 * extensions to use the TAR format instead of ZIP.
 */
export const zip = (tarPath: string, files: IFile[]): Promise<string> => {
	return new Promise<string>((c, e): void => {
		const pack = tarStream.pack();
		const chunks: Buffer[] = [];
		const ended = new Promise<Buffer>((res): void => {
			pack.on("end", () => {
				res(Buffer.concat(chunks));
			});
		});
		pack.on("data", (chunk) => {
			chunks.push(chunk as Buffer);
		});
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			pack.entry({
				name: file.path,
			}, file.contents);
		}
		pack.finalize();

		ended.then((buffer) => {
			return promisify(fs.writeFile)(tarPath, buffer);
		}).then(() => {
			c(tarPath);
		}).catch((ex) => {
			e(ex);
		});
	});
};

/**
 * Override the standard VS Code behavior for extracting
 * archives, to first attempt to process the archive as a TAR
 * and then fallback on the original implementation, for processing
 * ZIPs.
 */
export const extract = (archivePath: string, extractPath: string, options: IExtractOptions = {}, token: CancellationToken): Promise<void> => {
	return new Promise<void>((c, e): void => {
		extractTar(archivePath, extractPath, options, token).then(c).catch((ex) => {
			if (!ex.toString().includes("Invalid tar header")) {
				e(ex);

				return;
			}
			vszip.extract(archivePath, extractPath, options, token).then(c).catch(e);
		});
	});
};

/**
 * Override the standard VS Code behavior for buffering
 * archives, to first process the Buffer as a TAR and then
 * fallback on the original implementation, for processing ZIPs.
 */
export const buffer = (targetPath: string, filePath: string): Promise<Buffer> => {
	return new Promise<Buffer>((c, e): void => {
		let done: boolean = false;
		extractAssets(targetPath, new RegExp(filePath), (assetPath: string, data: Buffer) => {
			if (path.normalize(assetPath) === path.normalize(filePath)) {
				done = true;
				c(data);
			}
		}).then(() => {
			if (!done) {
				e("couldn't find asset " + filePath);
			}
		}).catch((ex) => {
			if (!ex.toString().includes("Invalid tar header")) {
				e(ex);

				return;
			}
			vszip.buffer(targetPath, filePath).then(c).catch(e);
		});
	});
};

/**
 * Override the standard VS Code behavior for extracting assets
 * from archive Buffers to use the TAR format instead of ZIP.
 */
export const extractAssets = (tarPath: string, match: RegExp, callback: (path: string, data: Buffer) => void): Promise<void> => {
	return new Promise<void>(async (c, e): Promise<void> => {
		try {
			const buffer = await promisify(fs.readFile)(tarPath);
			const extractor = tarStream.extract();
			extractor.once("error", e);
			extractor.on("entry", (header, stream, next) => {
				const name = header.name;
				if (match.test(name)) {
					extractData(stream).then((data) => {
						callback(name, data);
						next();
					}).catch(e);
					stream.resume();
				} else {
					stream.on("end", () => {
						next();
					});
					stream.resume();
				}
			});
			extractor.on("finish", () => {
				c();
			});
			extractor.write(buffer);
			extractor.end();
		} catch (ex) {
			e(ex);
		}
	});
};

const extractData = (stream: NodeJS.ReadableStream): Promise<Buffer> => {
	return new Promise<Buffer>((c, e): void => {
		const fileData: Buffer[] = [];
		stream.on("data", (data) => fileData.push(data));
		stream.on("end", () => {
			const fd = Buffer.concat(fileData);
			c(fd);
		});
		stream.on("error", e);
	});
};

const extractTar = (tarPath: string, targetPath: string, options: IExtractOptions = {}, token: CancellationToken): Promise<void> => {
	return new Promise<void>(async (c, e): Promise<void> => {
		try {
			const sourcePathRegex = new RegExp(options.sourcePath ? `^${options.sourcePath}` : "");
			const buffer = await promisify(fs.readFile)(tarPath);
			const extractor = tarStream.extract();
			extractor.once("error", e);
			extractor.on("entry", (header, stream, next) => {
				const rawName = path.normalize(header.name);

				const nextEntry = (): void => {
					stream.resume();
					next();
				};

				if (token.isCancellationRequested) {
					return nextEntry();
				}

				if (!sourcePathRegex.test(rawName)) {
					return nextEntry();
				}

				const fileName = rawName.replace(sourcePathRegex, "");
				const targetFileName = path.join(targetPath, fileName);
				if (/\/$/.test(fileName)) {
					stream.resume();
					mkdirp(targetFileName).then(() => {
						next();
					}, e);

					return;
				}

				const dirName = path.dirname(fileName);
				const targetDirName = path.join(targetPath, dirName);
				if (targetDirName.indexOf(targetPath) !== 0) {
					e(nls.localize("invalid file", "Error extracting {0}. Invalid file.", fileName));

					return nextEntry();
				}

				return mkdirp(targetDirName, undefined, token).then(() => {
					const fstream = fs.createWriteStream(targetFileName, { mode: header.mode });
					fstream.once("close", () => {
						next();
					});
					fstream.once("error", e);
					stream.pipe(fstream);
					stream.resume();
				});
			});
			extractor.once("finish", c);
			extractor.write(buffer);
			extractor.end();
		} catch (ex) {
			e(ex);
		}
	});
};
