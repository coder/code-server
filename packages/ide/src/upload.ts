import { exec } from "child_process";
import { appendFile } from "fs";
import { promisify } from "util";
import { logger } from "@coder/logger";
import { escapePath } from "@coder/protocol";
import { NotificationService, INotificationService, ProgressService, IProgressService, IProgress, Severity } from "./fill/notification";

export interface IURI {
	readonly path: string;
	readonly fsPath: string;
	readonly scheme: string;
}

/**
 * Represents an uploadable directory, so we can query for existing files once.
 */
interface IUploadableDirectory {
	existingFiles: string[];
	filesToUpload: Map<string, File>;
	preparePromise?: Promise<void>;
}

/**
 * There doesn't seem to be a provided type for entries, so here is an
 * incomplete version.
 */
interface IEntry {
	name: string;
	isFile: boolean;
	file: (cb: (file: File) => void) => void;
	createReader: () => ({
		readEntries: (cb: (entries: Array<IEntry>) => void) => void;
	});
}

/**
 * Handles file uploads.
 */
export class Upload {
	private readonly maxParallelUploads = 100;
	private readonly readSize = 32000; // ~32kb max while reading in the file.
	private readonly packetSize = 32000; // ~32kb max when writing.
	private readonly logger = logger.named("Upload");
	private readonly currentlyUploadingFiles = new Map<string, File>();
	private readonly queueByDirectory = new Map<string, IUploadableDirectory>();
	private progress: IProgress | undefined;
	private uploadPromise: Promise<string[]> | undefined;
	private resolveUploadPromise: (() => void) | undefined;
	private finished = 0;
	private uploadedFilePaths = <string[]>[];
	private total = 0;

	public constructor(
		private _notificationService: INotificationService,
		private _progressService: IProgressService,
	) {}

	public set notificationService(service: INotificationService) {
		this._notificationService = service;
	}

	public get notificationService(): INotificationService {
		return this._notificationService;
	}

	public set progressService(service: IProgressService) {
		this._progressService = service;
	}

	public get progressService(): IProgressService {
		return this._progressService;
	}

	/**
	 * Upload dropped files. This will try to upload everything it can. Errors
	 * will show via notifications. If an upload operation is ongoing, the files
	 * will be added to that operation.
	 */
	public async uploadDropped(event: DragEvent, uploadDir: IURI): Promise<string[]> {
		this.addDirectory(uploadDir.path);
		await this.queueFiles(event, uploadDir);
		this.logger.debug( // -1 so we don't include the uploadDir itself.
			`Uploading ${this.queueByDirectory.size - 1} directories and ${this.total} files`,
		);
		await this.prepareDirectories();
		if (!this.uploadPromise) {
			this.uploadPromise = this.progressService.start("Uploading files...", (progress) => {
				return new Promise((resolve): void => {
					this.progress = progress;
					this.resolveUploadPromise = (): void => {
						const uploaded = this.uploadedFilePaths;
						this.uploadPromise = undefined;
						this.resolveUploadPromise = undefined;
						this.uploadedFilePaths = [];
						this.finished = 0;
						this.total = 0;
						resolve(uploaded);
					};
				});
			}, () => {
				this.cancel();
			});
		}
		this.uploadFiles();

		return this.uploadPromise;
	}

	/**
	 * Cancel all file uploads.
	 */
	public async cancel(): Promise<void> {
		this.currentlyUploadingFiles.clear();
		this.queueByDirectory.clear();
	}

	/**
	 * Create directories and get existing files.
	 * On failure, show the error and remove the failed directory from the queue.
	 */
	private async prepareDirectories(): Promise<void> {
		await Promise.all(Array.from(this.queueByDirectory).map(([path, dir]) => {
			if (!dir.preparePromise) {
				dir.preparePromise = this.prepareDirectory(path, dir);
			}

			return dir.preparePromise;
		}));
	}

	/**
	 * Create a directory and get existing files.
	 * On failure, show the error and remove the directory from the queue.
	 */
	private async prepareDirectory(path: string, dir: IUploadableDirectory): Promise<void> {
		await Promise.all([
			promisify(exec)(`mkdir -p ${escapePath(path)}`).catch((error) => {
				const message = error.message.toLowerCase();
				if (message.includes("file exists")) {
					throw new Error(`Unable to create directory at ${path} because a file exists there`);
				}
				throw new Error(error.message || `Unable to upload ${path}`);
			}),
			// Only get files, so we don't show an override option that will just
			// fail anyway.
			promisify(exec)(`find ${escapePath(path)} -maxdepth 1 -not -type d`).then((stdio) => {
				dir.existingFiles = stdio.stdout.split("\n");
			}),
		]).catch((error) => {
			this.queueByDirectory.delete(path);
			this.notificationService.error(error);
		});
	}

	/**
	 * Upload as many files as possible. When finished, resolve the upload promise.
	 */
	private uploadFiles(): void {
		const finishFileUpload = (path: string): void => {
			++this.finished;
			this.currentlyUploadingFiles.delete(path);
			this.progress!.report(Math.floor((this.finished / this.total) * 100));
			this.uploadFiles();
		};
		while (this.queueByDirectory.size > 0 && this.currentlyUploadingFiles.size < this.maxParallelUploads) {
			const [dirPath, dir] = this.queueByDirectory.entries().next().value;
			if (dir.filesToUpload.size === 0) {
				this.queueByDirectory.delete(dirPath);
				continue;
			}
			const [filePath, item] = dir.filesToUpload.entries().next().value;
			this.currentlyUploadingFiles.set(filePath, item);
			dir.filesToUpload.delete(filePath);
			this.uploadFile(filePath, item, dir.existingFiles).then(() => {
				finishFileUpload(filePath);
			}).catch((error) => {
				this.notificationService.error(error);
				finishFileUpload(filePath);
			});
		}
		if (this.queueByDirectory.size === 0 && this.currentlyUploadingFiles.size === 0) {
			this.resolveUploadPromise!();
		}
	}

	/**
	 * Upload a file.
	 */
	private async uploadFile(path: string, file: File, existingFiles: string[]): Promise<void> {
		if (existingFiles.includes(path)) {
			const shouldOverwrite = await new Promise((resolve): void => {
				this.notificationService.prompt(
					Severity.Error,
					`${path} already exists. Overwrite?`,
					[{
						label: "Yes",
						run: (): void => resolve(true),
					}, {
						label: "No",
						run: (): void => resolve(false),
					}],
					() => resolve(false),
				);
			});
			if (!shouldOverwrite) {
				return;
			}
		}
		await new Promise(async (resolve, reject): Promise<void> => {
			let readOffset = 0;
			const reader = new FileReader();
			const seek = (): void => {
				const slice = file.slice(readOffset, readOffset + this.readSize);
				readOffset += this.readSize;
				reader.readAsArrayBuffer(slice);
			};

			const rm = async (): Promise<void> => {
				await promisify(exec)(`rm -f ${escapePath(path)}`);
			};

			await rm();

			const load = async (): Promise<void> => {
				const buffer = new Uint8Array(reader.result as ArrayBuffer);
				let bufferOffset = 0;

				while (bufferOffset <= buffer.length) {
					// Got canceled while sending data.
					if (!this.currentlyUploadingFiles.has(path)) {
						await rm();

						return resolve();
					}
					const data = buffer.slice(bufferOffset, bufferOffset + this.packetSize);

					try {
						await promisify(appendFile)(path, data);
					} catch (error) {
						await rm();

						const message = error.message.toLowerCase();
						if (message.includes("no space")) {
							return reject(new Error("You are out of disk space"));
						} else if (message.includes("is a directory")) {
							return reject(new Error(`Unable to upload ${path} because there is a directory there`));
						}

						return reject(new Error(error.message || `Unable to upload ${path}`));
					}

					bufferOffset += this.packetSize;
				}

				if (readOffset >= file.size) {
					this.uploadedFilePaths.push(path);

					return resolve();
				}

				seek();
			};

			reader.addEventListener("load", load);

			seek();
		});
	}

	/**
	 * Queue files from a drop event. We have to get the files first; we can't do
	 * it in tandem with uploading or the entries will disappear.
	 */
	private async queueFiles(event: DragEvent, uploadDir: IURI): Promise<void> {
		if (!event.dataTransfer || !event.dataTransfer.items) {
			return;
		}
		const promises: Array<Promise<void>> = [];
		for (let i = 0; i < event.dataTransfer.items.length; i++) {
			const item = event.dataTransfer.items[i];
			if (typeof item.webkitGetAsEntry === "function") {
				promises.push(this.traverseItem(item.webkitGetAsEntry(), uploadDir.fsPath).catch(this.notificationService.error));
			} else {
				const file = item.getAsFile();
				if (file) {
					this.addFile(uploadDir.fsPath, uploadDir.fsPath + "/" + file.name, file);
				}
			}
		}
		await Promise.all(promises);
	}

	/**
	 * Traverses an entry and add files to the queue.
	 */
	private async traverseItem(entry: IEntry, parentPath: string): Promise<void> {
		if (entry.isFile) {
			return new Promise<void>((resolve): void => {
				entry.file((file) => {
					this.addFile(
						parentPath,
						parentPath + "/" + file.name,
						file,
					);
					resolve();
				});
			});
		}

		parentPath += "/" + entry.name;
		this.addDirectory(parentPath);

		await new Promise((resolve): void => {
			const promises: Array<Promise<void>> = [];
			const dirReader = entry.createReader();
			// According to the spec, readEntries() must be called until it calls
			// the callback with an empty array.
			const readEntries = (): void => {
				dirReader.readEntries((entries) => {
					if (entries.length === 0) {
						Promise.all(promises).then(resolve).catch((error) => {
							this.notificationService.error(error);
							resolve();
						});
					} else {
						promises.push(...entries.map((child) => this.traverseItem(child, parentPath)));
						readEntries();
					}
				});
			};
			readEntries();
		});
	}

	/**
	 * Add a file to the queue.
	 */
	private addFile(parentPath: string, path: string, file: File): void {
		++this.total;
		this.addDirectory(parentPath);
		this.queueByDirectory.get(parentPath)!.filesToUpload.set(path, file);
	}

	/**
	 * Add a directory to the queue.
	 */
	private addDirectory(path: string): void {
		if (!this.queueByDirectory.has(path)) {
			this.queueByDirectory.set(path, {
				existingFiles: [],
				filesToUpload: new Map(),
			});
		}
	}
}

// Global instance.
export const upload = new Upload(new NotificationService(), new ProgressService());
