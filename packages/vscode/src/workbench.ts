import * as os from "os";
import { IProgress, INotificationHandle } from "@coder/ide";
import { logger } from "@coder/logger";
import { client } from "./client";

import "./fill/platform";
import "./fill/dom";
import "./fill/codeEditor";
import "./fill/environmentService";
import "./fill/labels";
import "./fill/menuRegistry";
import "./fill/mouseEvent";
import "./fill/storageDatabase";
import "./fill/vscodeTextmate";
import "./fill/windowsService";
import "./fill/workbenchRegistry";
import "./fill/workspacesService";
import * as paths from "./fill/paths";
import { PasteAction } from "./fill/paste";

import { ExplorerItem, ExplorerModel } from "vs/workbench/contrib/files/common/explorerModel";
import { IEditorGroup } from "vs/workbench/services/editor/common/editorGroupsService";
import { IEditorService, IResourceEditor } from "vs/workbench/services/editor/common/editorService";
import { INotificationService } from "vs/platform/notification/common/notification";
import { IProgressService2, ProgressLocation } from "vs/platform/progress/common/progress";
import { ISingleFolderWorkspaceIdentifier, IWorkspaceIdentifier } from "vs/platform/workspaces/common/workspaces";
import { IWindowsService, IWindowConfiguration } from "vs/platform/windows/common/windows";
import { LogLevel } from "vs/platform/log/common/log";
import { RawContextKey, IContextKeyService } from "vs/platform/contextkey/common/contextkey";
import { ServiceCollection } from "vs/platform/instantiation/common/serviceCollection";
import { URI } from "vs/base/common/uri";

/**
 * Initializes VS Code and provides a way to call into general client
 * functionality.
 */
export class Workbench {
	public readonly retry = client.retry;

	private readonly windowId = parseInt(new Date().toISOString().replace(/[-:.TZ]/g, ""), 10);
	private _serviceCollection: ServiceCollection | undefined;
	private _clipboardContextKey: RawContextKey<boolean> | undefined;

	/**
	 * Handle a drop event on the file explorer.
	 */
	public async handleExternalDrop(target: ExplorerItem | ExplorerModel, originalEvent: DragEvent): Promise<void> {
		await client.upload.uploadDropped(
			originalEvent,
			(target instanceof ExplorerItem ? target : target.roots[0]).resource,
		);
	}

	/**
	 * Handle a drop event on the editor.
	 */
	public handleDrop(event: DragEvent, resolveTargetGroup: () => IEditorGroup, afterDrop: (targetGroup: IEditorGroup) => void, targetIndex?: number): void {
		client.upload.uploadDropped(event, URI.file(paths.getWorkingDirectory())).then(async (paths) => {
			const uris = paths.map((p) => URI.file(p));
			if (uris.length) {
				await (this.serviceCollection.get(IWindowsService) as IWindowsService).addRecentlyOpened(uris);
			}

			const editors: IResourceEditor[] = uris.map(uri => ({
				resource: uri,
				options: {
					pinned: true,
					index: targetIndex,
				},
			}));

			const targetGroup = resolveTargetGroup();
			await (this.serviceCollection.get(IEditorService) as IEditorService).openEditors(editors, targetGroup);
			afterDrop(targetGroup);
		}).catch((error) => {
			logger.error(error.message);
		});
	}

	/**
	 * Use to toggle the paste option inside editors based on the native clipboard.
	 */
	public get clipboardContextKey(): RawContextKey<boolean> {
		if (!this._clipboardContextKey) {
			throw new Error("Trying to access clipboard context key before it has been set");
		}

		return this._clipboardContextKey;
	}

	public get clipboardText(): Promise<string> {
		return client.clipboard.readText();
	}

	/**
	 * Create a paste action for use in text inputs.
	 */
	public get pasteAction(): PasteAction {
		return new PasteAction();
	}

	public set workspace(ws: IWorkspaceIdentifier | ISingleFolderWorkspaceIdentifier | undefined) {
		if (typeof ws === "undefined") {
			window.localStorage.removeItem("workspace");
		} else {
			window.localStorage.setItem("workspace", JSON.stringify(ws));
		}

		location.reload();
	}

	public get workspace(): undefined | IWorkspaceIdentifier | ISingleFolderWorkspaceIdentifier {
		const ws = window.localStorage.getItem("workspace");
		try {
			return JSON.parse(ws!);
		} catch (ex) {
			return undefined;
		}
	}

	public get serviceCollection(): ServiceCollection {
		if (!this._serviceCollection) {
			throw new Error("Trying to access service collection before it has been set");
		}

		return this._serviceCollection;
	}

	public set serviceCollection(collection: ServiceCollection) {
		this._serviceCollection = collection;

		const contextKeys = this.serviceCollection.get(IContextKeyService) as IContextKeyService;
		const bounded = this.clipboardContextKey.bindTo(contextKeys);
		client.clipboard.onPermissionChange((enabled) => {
			bounded.set(enabled);
		});
		client.clipboard.initialize();

		client.progressService = {
			start: <T>(title: string, task: (progress: IProgress) => Promise<T>, onCancel: () => void): Promise<T> => {
				let lastProgress = 0;

				return (this.serviceCollection.get(IProgressService2) as IProgressService2).withProgress({
					location: ProgressLocation.Notification,
					title,
					cancellable: true,
				}, (progress) => {
					return task({
						report: (p): void => {
							progress.report({ increment: p - lastProgress });
							lastProgress = p;
						},
					});
				}, () => {
					onCancel();
				});
			},
		};

		client.notificationService = {
			error: (error: Error): void => (this.serviceCollection.get(INotificationService) as INotificationService).error(error),
			prompt: (severity, message, buttons, onCancel): INotificationHandle => {
				const handle = (this.serviceCollection.get(INotificationService) as INotificationService).prompt(
					severity, message, buttons, { onCancel },
				);

				return {
					close: (): void => handle.close(),
					updateMessage: (message): void => handle.updateMessage(message),
					updateButtons: (buttons): void => handle.updateActions({
						primary: buttons.map((button) => ({
							id: "",
							label: button.label,
							tooltip: "",
							class: undefined,
							enabled: true,
							checked: false,
							radio: false,
							dispose: (): void => undefined,
							run: (): Promise<void> => Promise.resolve(button.run()),
						})),
					}),
				};
			},
		};
	}

	/**
	 * Start VS Code.
	 */
	public async initialize(): Promise<void> {
		this._clipboardContextKey = new RawContextKey("nativeClipboard", client.clipboard.isEnabled);

		const workspace = this.workspace || URI.file(paths.getWorkingDirectory());
		// If we try to import this above, workbench will be undefined due to
		// circular imports.
		require("vs/workbench/workbench.main");
		const { main } = require("vs/workbench/electron-browser/main");
		const config: IWindowConfiguration = {
			machineId: "1",
			windowId: this.windowId,
			logLevel: LogLevel.Info,
			mainPid: 1,
			appRoot: paths.getDefaultUserDataPath(),
			execPath: os.tmpdir(),
			userEnv: {},
			nodeCachedDataDir: os.tmpdir(),
			perfEntries: [],
			_: [],
		};
		if ((workspace as IWorkspaceIdentifier).configPath) {
			// tslint:disable-next-line:no-any
			let wid: IWorkspaceIdentifier = (<any>Object).assign({}, workspace);
			if (!URI.isUri(wid.configPath)) {
				// Ensure that the configPath is a valid URI.
				wid.configPath = URI.file(wid.configPath);
			}
			config.workspace = wid;
		} else {
			config.folderUri = workspace as URI;
		}
		try {
			await main(config);
		} catch (ex) {
			if (ex.toString().indexOf("UriError") !== -1 || ex.toString().indexOf("backupPath") !== -1) {
				/**
				 * Resolves the error of the workspace identifier being invalid.
				 */
				// tslint:disable-next-line:no-console
				console.error(ex);
				this.workspace = undefined;
				location.reload();

				return;
			}
		}
	}
}

export const workbench = new Workbench();
