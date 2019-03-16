/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from "vs/nls";
import * as fs from "fs";
import * as path from "path";
import * as tarStream from "tar-stream";
import { promisify } from "util";
import { ILogService } from "vs/platform/log/common/log";
import { CancellationToken } from "vs/base/common/cancellation";
import { mkdirp } from "vs/base/node/pfs";

export interface IExtractOptions {
	overwrite?: boolean;

	/**
	 * Source path within the ZIP archive. Only the files contained in this
	 * path will be extracted.
	 */
	sourcePath?: string;
}

export interface IFile {
	path: string;
	contents?: Buffer | string;
	localPath?: string;
}

export function zip(tarPath: string, files: IFile[]): Promise<string> {
	return new Promise<string>((c, e) => {
		const pack = tarStream.pack();
		const chunks: Buffer[] = [];
		const ended = new Promise<Buffer>((res, rej) => {
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
}

export async function extract(tarPath: string, targetPath: string, options: IExtractOptions = {}, token: CancellationToken): Promise<void> {
	const sourcePathRegex = new RegExp(options.sourcePath ? `^${options.sourcePath}` : '');

	return new Promise<void>(async (c, e) => {
		const buffer = await promisify(fs.readFile)(tarPath);
		const extractor = tarStream.extract();
		extractor.once('error', e);
		extractor.on('entry', (header, stream, next) => {
			const rawName = header.name;

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

			const fileName = rawName.replace(sourcePathRegex, '');

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
				e(nls.localize('invalid file', "Error extracting {0}. Invalid file.", fileName));
				return nextEntry();
			}

			mkdirp(targetDirName, void 0, token).then(() => {
				const fstream = fs.createWriteStream(targetFileName, { mode: header.mode });
				fstream.once('close', () => {
					next();
				});
				fstream.once('error', (err) => {
					e(err);
				});
				stream.pipe(fstream);
				stream.resume();
			});
		});
		extractor.once('finish', () => {
			c();
		});
		extractor.write(buffer);
		extractor.end();
	});
}

export function buffer(tarPath: string, filePath: string): Promise<Buffer> {
	return new Promise<Buffer>(async (c, e) => {
		let done: boolean = false;
		extractAssets(tarPath, new RegExp(filePath), (path: string, data: Buffer) => {
			if (path === filePath) {
				done = true;
				c(data);
			}
		}).then(() => {
			if (!done) {
				e("couldnt find asset " + filePath);
			}
		}).catch((ex) => {
			e(ex);
		});
	});
}

async function extractAssets(tarPath: string, match: RegExp, callback: (path: string, data: Buffer) => void): Promise<void> {
	const buffer = await promisify(fs.readFile)(tarPath);
	const extractor = tarStream.extract();
	let callbackResolve: () => void;
	let callbackReject: (ex?) => void;
	const complete = new Promise<void>((r, rej) => {
		callbackResolve = r;
		callbackReject = rej;
	});
	extractor.once("error", (err) => {
		callbackReject(err);
	});
	extractor.on("entry", (header, stream, next) => {
		const name = header.name;
		if (match.test(name)) {
			extractData(stream).then((data) => {
				callback(name, data);
				next();
			});
			stream.resume();
		} else {
			stream.on("end", () => {
				next();
			});
			stream.resume();
		}
	});
	extractor.on("finish", () => {
		callbackResolve();
	});
	extractor.write(buffer);
	extractor.end();
	return complete;
}

async function extractData(stream: NodeJS.ReadableStream): Promise<Buffer> {
	return new Promise<Buffer>((res, rej) => {
		const fileData: Buffer[] = [];
		stream.on('data', (data) => fileData.push(data));
		stream.on('end', () => {
			const fd = Buffer.concat(fileData);
			res(fd);
		});
		stream.on('error', (err) => {
			rej(err);
		});
	});
}
