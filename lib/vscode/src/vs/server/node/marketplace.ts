import * as fs from 'fs';
import * as path from 'path';
import * as tarStream from 'tar-stream';
import * as util from 'util';
import { CancellationToken } from 'vs/base/common/cancellation';
import { mkdirp } from 'vs/base/node/pfs';
import * as vszip from 'vs/base/node/zip';
import * as nls from 'vs/nls';
import product from 'vs/platform/product/common/product';

// We will be overriding these, so keep a reference to the original.
const vszipExtract = vszip.extract;
const vszipBuffer = vszip.buffer;

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

export const tar = async (tarPath: string, files: IFile[]): Promise<string> => {
	const pack = tarStream.pack();
	const chunks: Buffer[] = [];
	const ended = new Promise<Buffer>((resolve) => {
		pack.on('end', () => resolve(Buffer.concat(chunks)));
	});
	pack.on('data', (chunk: Buffer) => chunks.push(chunk));
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		pack.entry({ name: file.path }, file.contents);
	}
	pack.finalize();
	await util.promisify(fs.writeFile)(tarPath, await ended);
	return tarPath;
};

export const extract = async (archivePath: string, extractPath: string, options: IExtractOptions = {}, token: CancellationToken): Promise<void> => {
	try {
		await extractTar(archivePath, extractPath, options, token);
	} catch (error) {
		if (error.toString().includes('Invalid tar header')) {
			await vszipExtract(archivePath, extractPath, options, token);
		}
	}
};

export const buffer = (targetPath: string, filePath: string): Promise<Buffer> => {
	return new Promise<Buffer>(async (resolve, reject) => {
		try {
			let done: boolean = false;
			await extractAssets(targetPath, new RegExp(filePath), (assetPath: string, data: Buffer) => {
				if (path.normalize(assetPath) === path.normalize(filePath)) {
					done = true;
					resolve(data);
				}
			});
			if (!done) {
				throw new Error('couldn\'t find asset ' + filePath);
			}
		} catch (error) {
			if (error.toString().includes('Invalid tar header')) {
				vszipBuffer(targetPath, filePath).then(resolve).catch(reject);
			} else {
				reject(error);
			}
		}
	});
};

const extractAssets = async (tarPath: string, match: RegExp, callback: (path: string, data: Buffer) => void): Promise<void> => {
	return new Promise<void>((resolve, reject): void => {
		const extractor = tarStream.extract();
		const fail = (error: Error) => {
			extractor.destroy();
			reject(error);
		};
		extractor.once('error', fail);
		extractor.on('entry', async (header, stream, next) => {
			const name = header.name;
			if (match.test(name)) {
				extractData(stream).then((data) => {
					callback(name, data);
					next();
				}).catch(fail);
			} else {
				stream.on('end', () => next());
				stream.resume(); // Just drain it.
			}
		});
		extractor.on('finish', resolve);
		fs.createReadStream(tarPath).pipe(extractor);
	});
};

const extractData = (stream: NodeJS.ReadableStream): Promise<Buffer> => {
	return new Promise((resolve, reject): void => {
		const fileData: Buffer[] = [];
		stream.on('error', reject);
		stream.on('end', () => resolve(Buffer.concat(fileData)));
		stream.on('data', (data) => fileData.push(data));
	});
};

const extractTar = async (tarPath: string, targetPath: string, options: IExtractOptions = {}, token: CancellationToken): Promise<void> => {
	return new Promise<void>((resolve, reject): void => {
		const sourcePathRegex = new RegExp(options.sourcePath ? `^${options.sourcePath}` : '');
		const extractor = tarStream.extract();
		const fail = (error: Error) => {
			extractor.destroy();
			reject(error);
		};
		extractor.once('error', fail);
		extractor.on('entry', async (header, stream, next) => {
			const nextEntry = (): void => {
				stream.on('end', () => next());
				stream.resume();
			};

			const rawName = path.normalize(header.name);
			if (token.isCancellationRequested || !sourcePathRegex.test(rawName)) {
				return nextEntry();
			}

			const fileName = rawName.replace(sourcePathRegex, '');
			const targetFileName = path.join(targetPath, fileName);
			if (/\/$/.test(fileName)) {
				return mkdirp(targetFileName).then(nextEntry);
			}

			const dirName = path.dirname(fileName);
			const targetDirName = path.join(targetPath, dirName);
			if (targetDirName.indexOf(targetPath) !== 0) {
				return fail(new Error(nls.localize('invalid file', 'Error extracting {0}. Invalid file.', fileName)));
			}

			await mkdirp(targetDirName, undefined);

			const fstream = fs.createWriteStream(targetFileName, { mode: header.mode });
			fstream.once('close', () => next());
			fstream.once('error', fail);
			stream.pipe(fstream);
		});
		extractor.once('finish', resolve);
		fs.createReadStream(tarPath).pipe(extractor);
	});
};

/**
 * Override original functionality so we can use a custom marketplace with
 * either tars or zips.
 */
export const enableCustomMarketplace = (): void => {
	(<any>product).extensionsGallery = { // Use `any` to override readonly.
		serviceUrl: process.env.SERVICE_URL || 'https://extensions.coder.com/api',
		itemUrl: process.env.ITEM_URL || '',
		controlUrl: '',
		recommendationsUrl: '',
		...(product.extensionsGallery || {}),
	};

	const target = vszip as typeof vszip;
	target.zip = tar;
	target.extract = extract;
	target.buffer = buffer;
};
