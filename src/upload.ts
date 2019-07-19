import { generateUuid } from "vs/base/common/uuid";
import { DesktopDragAndDropData } from "vs/base/browser/ui/list/listView";
import { VSBuffer, VSBufferReadable } from "vs/base/common/buffer";
import { Emitter, Event } from "vs/base/common/event";
import { Disposable } from "vs/base/common/lifecycle";
import * as path from "vs/base/common/path";
import { URI } from "vs/base/common/uri";
import { IFileService } from "vs/platform/files/common/files";
import { createDecorator, ServiceIdentifier, IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { INotificationService, Severity } from "vs/platform/notification/common/notification";
import { IProgress, IProgressStep, IProgressService, ProgressLocation } from "vs/platform/progress/common/progress";
import { ExplorerItem } from "vs/workbench/contrib/files/common/explorerModel";
import { IEditorGroup } from "vs/workbench/services/editor/common/editorGroupsService";
import { IWorkspaceContextService } from "vs/platform/workspace/common/workspace";
import { IWindowsService } from "vs/platform/windows/common/windows";
import { IEditorService } from "vs/workbench/services/editor/common/editorService";

export const IUploadService = createDecorator<IUploadService>("uploadService");

export interface IUploadService {
	_serviceBrand: ServiceIdentifier<any>;
	handleDrop(event: DragEvent, resolveTargetGroup: () => IEditorGroup | undefined, afterDrop: (targetGroup: IEditorGroup | undefined) => void, targetIndex?: number): Promise<void>;
	handleExternalDrop(data: DesktopDragAndDropData, target: ExplorerItem, originalEvent: DragEvent): Promise<void>;
}

export class UploadService extends Disposable implements IUploadService {
	public _serviceBrand: any;
	public upload: Upload;

	public constructor(
		@IInstantiationService instantiationService: IInstantiationService,
		@IWorkspaceContextService private readonly contextService: IWorkspaceContextService,
		@IWindowsService private readonly windowsService: IWindowsService,
		@IEditorService private readonly editorService: IEditorService,
	) {
		super();
		this.upload = instantiationService.createInstance(Upload);
	}

	public async handleDrop(event: DragEvent, resolveTargetGroup: () => IEditorGroup | undefined, afterDrop: (targetGroup: IEditorGroup | undefined) => void, targetIndex?: number): Promise<void> {
		// TODO: should use the workspace for the editor it was dropped on?
		const target =this.contextService.getWorkspace().folders[0].uri;
		const uris = (await this.upload.uploadDropped(event, target)).map((u) => URI.file(u));
		if (uris.length > 0) {
			await this.windowsService.addRecentlyOpened(uris.map((u) => ({ fileUri: u })));
		}
		const editors = uris.map((uri) => ({
			resource: uri,
			options: {
				pinned: true,
				index: targetIndex,
			},
		}));
		const targetGroup = resolveTargetGroup();
		this.editorService.openEditors(editors, targetGroup);
		afterDrop(targetGroup);
	}

	public async handleExternalDrop(_data: DesktopDragAndDropData, target: ExplorerItem, originalEvent: DragEvent): Promise<void> {
		await this.upload.uploadDropped(originalEvent, target.resource);
	}
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
class Upload {
	private readonly maxParallelUploads = 100;
	private readonly uploadingFiles = new Map<string, Reader | undefined>();
	private readonly fileQueue = new Map<string, File>();
	private progress: IProgress<IProgressStep> | undefined;
	private uploadPromise: Promise<string[]> | undefined;
	private resolveUploadPromise: (() => void) | undefined;
	private uploadedFilePaths = <string[]>[];
	private _total = 0;
	private _uploaded = 0;
	private lastPercent = 0;

	public constructor(
		@INotificationService private notificationService: INotificationService,
		@IProgressService private progressService: IProgressService,
		@IFileService private fileService: IFileService,
	) {}

	/**
	 * Upload dropped files. This will try to upload everything it can. Errors
	 * will show via notifications. If an upload operation is ongoing, the files
	 * will be added to that operation.
	 */
	public async uploadDropped(event: DragEvent, uploadDir: URI): Promise<string[]> {
		await this.queueFiles(event, uploadDir);
		if (!this.uploadPromise) {
			this.uploadPromise = this.progressService.withProgress({
				cancellable: true,
				location: ProgressLocation.Notification,
				title: "Uploading files...",
			}, (progress) => {
				return new Promise((resolve): void => {
					this.progress = progress;
					this.resolveUploadPromise = (): void => {
						const uploaded = this.uploadedFilePaths;
						this.uploadPromise = undefined;
						this.resolveUploadPromise = undefined;
						this.uploadedFilePaths = [];
						this.lastPercent = 0;
						this._uploaded = 0;
						this._total = 0;
						resolve(uploaded);
					};
				});
			}, () => this.cancel());
		}
		this.uploadFiles();
		return this.uploadPromise;
	}

	/**
	 * Cancel all file uploads.
	 */
	public async cancel(): Promise<void> {
		this.fileQueue.clear();
		this.uploadingFiles.forEach((r) => r && r.abort());
	}

	private get total(): number { return this._total; }
	private set total(total: number) {
		this._total = total;
		this.updateProgress();
	}

	private get uploaded(): number { return this._uploaded; }
	private set uploaded(uploaded: number) {
		this._uploaded = uploaded;
		this.updateProgress();
	}

	private updateProgress(): void {
		if (this.progress && this.total > 0) {
			const percent = Math.floor((this.uploaded / this.total) * 100);
			this.progress.report({ increment: percent - this.lastPercent });
			this.lastPercent = percent;
		}
	}

	/**
	 * Upload as many files as possible. When finished, resolve the upload
	 * promise.
	 */
	private uploadFiles(): void {
		while (this.fileQueue.size > 0 && this.uploadingFiles.size < this.maxParallelUploads) {
			const [path, file] = this.fileQueue.entries().next().value;
			this.fileQueue.delete(path);
			if (this.uploadingFiles.has(path)) {
				this.notificationService.error(new Error(`Already uploading ${path}`));
			} else {
				this.uploadingFiles.set(path, undefined);
				this.uploadFile(path, file).catch((error) => {
					this.notificationService.error(error);
				}).finally(() => {
					this.uploadingFiles.delete(path);
					this.uploadFiles();
				});
			}
		}
		if (this.fileQueue.size === 0 && this.uploadingFiles.size === 0) {
			this.resolveUploadPromise!();
		}
	}

	/**
	 * Upload a file, asking to override if necessary.
	 */
	private async uploadFile(filePath: string, file: File): Promise<void> {
		const uri = URI.file(filePath);
		if (await this.fileService.exists(uri)) {
			const overwrite = await new Promise<boolean>((resolve): void => {
				this.notificationService.prompt(
					Severity.Error,
					`${filePath} already exists. Overwrite?`,
					[
						{ label: "Yes", run: (): void => resolve(true)  },
						{ label: "No",  run: (): void => resolve(false) },
					],
					{ onCancel: () => resolve(false) },
				);
			});
			if (!overwrite) {
				return;
			}
		}
		const tempUri = uri.with({
			path: path.join(
				path.dirname(uri.path),
				`.code-server-partial-upload-${path.basename(uri.path)}-${generateUuid()}`,
			),
		});
		const reader = new Reader(file);
		reader.onData((data) => {
			if (data && data.length > 0) {
				this.uploaded += data.byteLength;
			}
		});
		reader.onAbort(() => {
			const remaining = file.size - reader.offset;
			if (remaining > 0) {
				this.uploaded += remaining;
			}
		});
		this.uploadingFiles.set(filePath, reader);
		await this.fileService.writeFile(tempUri, reader);
		if (reader.aborted) {
			await this.fileService.del(tempUri);
		} else {
			await this.fileService.move(tempUri, uri, true);
			this.uploadedFilePaths.push(filePath);
		}
	}

	/**
	 * Queue files from a drop event. We have to get the files first; we can't do
	 * it in tandem with uploading or the entries will disappear.
	 */
	private async queueFiles(event: DragEvent, uploadDir: URI): Promise<void> {
		const promises: Array<Promise<void>> = [];
		for (let i = 0; event.dataTransfer && event.dataTransfer.items && i < event.dataTransfer.items.length; ++i) {
			const item = event.dataTransfer.items[i];
			if (typeof item.webkitGetAsEntry === "function") {
				promises.push(this.traverseItem(item.webkitGetAsEntry(), uploadDir.fsPath));
			} else {
				const file = item.getAsFile();
				if (file) {
					this.addFile(uploadDir.fsPath + "/" + file.name, file);
				}
			}
		}
		await Promise.all(promises);
	}

	/**
	 * Traverses an entry and add files to the queue.
	 */
	private async traverseItem(entry: IEntry, path: string): Promise<void> {
		if (entry.isFile) {
			return new Promise<void>((resolve): void => {
				entry.file((file) => {
					resolve(this.addFile(path + "/" + file.name, file));
				});
			});
		}
		path += "/" + entry.name;
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
						promises.push(...entries.map((c) => this.traverseItem(c, path)));
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
	private addFile(path: string, file: File): void {
		this.total += file.size;
		this.fileQueue.set(path, file);
	}
}

class Reader implements VSBufferReadable {
	private _offset = 0;
	private readonly size = 32000; // ~32kb max while reading in the file.
	private readonly _onData = new Emitter<Uint8Array | null>();
	public readonly onData: Event<Uint8Array | null> = this._onData.event;

	private _aborted = false;
	private readonly _onAbort = new Emitter<void>();
	public readonly onAbort: Event<void> = this._onAbort.event;

	private readonly reader = new FileReader();

	public constructor(private readonly file: File) {
		this.reader.addEventListener("load", this.onLoad);
	}

	public get offset(): number { return this._offset; }
	public get aborted(): boolean { return this._aborted; }

	public abort = (): void => {
		this._aborted = true;
		this.reader.abort();
		this.reader.removeEventListener("load", this.onLoad);
		this._onAbort.fire();
	}

	public read = async (): Promise<VSBuffer | null> => {
		return new Promise<VSBuffer | null>((resolve) => {
			const disposables = [
				this.onAbort(() => {
					disposables.forEach((d) => d.dispose());
					resolve(null);
				}),
				this.onData((data) => {
					disposables.forEach((d) => d.dispose());
					resolve(data && VSBuffer.wrap(data));
				}),
			];
			if (this.aborted || this.offset >= this.file.size) {
				return this._onData.fire(null);
			}
			const slice = this.file.slice(this.offset, this.offset + this.size);
			this._offset += this.size;
			this.reader.readAsArrayBuffer(slice);
		});
	}

	private onLoad = () => {
		this._onData.fire(new Uint8Array(this.reader.result as ArrayBuffer));
	}
}
