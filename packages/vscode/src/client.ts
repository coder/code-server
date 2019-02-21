import * as paths from "./fill/paths";
import "./fill/platform";
import "./fill/storageDatabase";
import "./fill/windowsService";
import "./fill/workspacesService";
import "./fill/environmentService";
import "./fill/vscodeTextmate";
import "./fill/codeEditor";
import "./fill/mouseEvent";
import "./fill/menuRegistry";
import "./fill/workbenchRegistry";
import { PasteAction } from "./fill/paste";
import "./fill/dom";
import "./vscode.scss";
import { IdeClient, IProgress, INotificationHandle } from "@coder/ide";
import { registerContextMenuListener } from "vs/base/parts/contextmenu/electron-main/contextmenu";
import { LogLevel } from "vs/platform/log/common/log";
import { URI } from "vs/base/common/uri";
import { INotificationService } from "vs/platform/notification/common/notification";
import { IProgressService2, ProgressLocation } from "vs/platform/progress/common/progress";
import { ExplorerItem, ExplorerModel } from "vs/workbench/parts/files/common/explorerModel";
import { DragMouseEvent } from "vs/base/browser/mouseEvent";
import { IEditorService, IResourceEditor } from "vs/workbench/services/editor/common/editorService";
import { IEditorGroup } from "vs/workbench/services/group/common/editorGroupsService";
import { IWindowsService, IWindowConfiguration } from "vs/platform/windows/common/windows";
import { ServiceCollection } from "vs/platform/instantiation/common/serviceCollection";
import { RawContextKey, IContextKeyService } from "vs/platform/contextkey/common/contextkey";
import { ISingleFolderWorkspaceIdentifier, IWorkspaceIdentifier } from "vs/platform/workspaces/common/workspaces";

export class Client extends IdeClient {
	private readonly windowId = parseInt(new Date().toISOString().replace(/[-:.TZ]/g, ""), 10);
	private _serviceCollection: ServiceCollection | undefined;
	private _clipboardContextKey: RawContextKey<boolean> | undefined;
	private _builtInExtensionsDirectory: string | undefined;

	public get builtInExtensionsDirectory(): string {
		if (!this._builtInExtensionsDirectory) {
			throw new Error("trying to access builtin extensions directory before it has been set");
		}

		return this._builtInExtensionsDirectory;
	}

	public async handleExternalDrop(target: ExplorerItem | ExplorerModel, originalEvent: DragMouseEvent): Promise<void> {
		await this.upload.uploadDropped(
			originalEvent.browserEvent as DragEvent,
			(target instanceof ExplorerItem ? target : target.roots[0]).resource,
		);
	}

	public handleDrop(event: DragEvent, resolveTargetGroup: () => IEditorGroup, afterDrop: (targetGroup: IEditorGroup) => void, targetIndex?: number): void {
		this.initData.then((d) => {
			this.upload.uploadDropped(event, URI.file(d.workingDirectory)).then((paths) => {
				const uris = paths.map((p) => URI.file(p));
				if (uris.length) {
					(this.serviceCollection.get(IWindowsService) as IWindowsService).addRecentlyOpened(uris);
				}

				const editors: IResourceEditor[] = uris.map(uri => ({
					resource: uri,
					options: {
						pinned: true,
						index: targetIndex,
					},
				}));

				const targetGroup = resolveTargetGroup();

				(this.serviceCollection.get(IEditorService) as IEditorService).openEditors(editors, targetGroup).then(() => {
					afterDrop(targetGroup);
				});
			});
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
		return this.clipboard.readText();
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
		this.progressService = {
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

		this.notificationService = {
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

	protected initialize(): Promise<void> {
		registerContextMenuListener();

		this._clipboardContextKey = new RawContextKey("nativeClipboard", this.clipboard.isEnabled);

		return this.task("Start workbench", 1000, async (data, sharedData) => {
			paths._paths.initialize(data, sharedData);
			this._builtInExtensionsDirectory = data.builtInExtensionsDirectory;
			process.env.SHELL = data.shell;

			const workspace = this.workspace || URI.file(data.workingDirectory);
			const { startup } = require("./startup") as typeof import("vs/workbench/electron-browser/main");
			const config: IWindowConfiguration = {
				machineId: "1",
				windowId: this.windowId,
				logLevel: LogLevel.Info,
				mainPid: 1,
				appRoot: data.dataDirectory,
				execPath: data.tmpDirectory,
				userEnv: {},
				nodeCachedDataDir: data.tmpDirectory,
				perfEntries: [],
				_: [],
			};
			if ((workspace as IWorkspaceIdentifier).configPath) {
				config.workspace = workspace as IWorkspaceIdentifier;
			} else {
				config.folderUri = workspace as URI;
			}
			await startup(config);
			const contextKeys = this.serviceCollection.get(IContextKeyService) as IContextKeyService;
			const bounded = this.clipboardContextKey.bindTo(contextKeys);
			this.clipboard.onPermissionChange((enabled) => {
				bounded.set(enabled);
			});
			this.clipboard.initialize();
		}, this.initData, this.sharedProcessData);
	}
}

export const client = new Client();
