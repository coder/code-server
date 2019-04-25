import * as electron from "electron";
import { Emitter } from "@coder/events";
import { logger } from "@coder/logger";
import { IWindowsService, INativeOpenDialogOptions, MessageBoxOptions, SaveDialogOptions, OpenDialogOptions, IMessageBoxResult, IDevToolsOptions, IEnterWorkspaceResult, CrashReporterStartOptions, INewWindowOptions, IOpenFileRequest, IAddFoldersRequest, IURIToOpen, IOpenSettings } from "vs/platform/windows/common/windows";
import { ParsedArgs } from "vs/platform/environment/common/environment";
import { IWorkspaceIdentifier, IWorkspaceFolderCreationData, ISingleFolderWorkspaceIdentifier } from "vs/platform/workspaces/common/workspaces";
import { URI } from "vs/base/common/uri";
import { IRecentlyOpened, IRecent } from "vs/platform/history/common/history";
import { ISerializableCommandAction } from "vs/platform/actions/common/actions";
import { client } from "../client";
import { showOpenDialog } from "../dialog";
import { workbench } from "../workbench";

// tslint:disable completed-docs

// VS Code overrides window.open to call openExternal, but we then call
// window.open which results in an infinite loop. Store the function but also
// make it unable to be set (doesn't work otherwise).
const windowOpen = window.open;
Object.defineProperty(window, "open", {
	set: (): void => { /* Not allowed. */ },
	get: (): Function => windowOpen,
});

/**
 * Instead of going to the shared process, we'll directly run these methods on
 * the client. This setup means we can only control the current window.
 */
export class WindowsService implements IWindowsService {
	// tslint:disable-next-line no-any
	public _serviceBrand: any;

	private readonly openEmitter = new Emitter<number>();
	private readonly focusEmitter = new Emitter<number>();
	private readonly blurEmitter = new Emitter<number>();
	private readonly maximizeEmitter = new Emitter<number>();
	private readonly unmaximizeEmitter = new Emitter<number>();
	private readonly recentlyOpenedChangeEmitter = new Emitter<void>();

	public readonly onWindowOpen = this.openEmitter.event;
	public readonly onWindowFocus = this.focusEmitter.event;
	public readonly onWindowBlur = this.blurEmitter.event;
	public readonly onWindowMaximize = this.maximizeEmitter.event;
	public readonly onWindowUnmaximize = this.unmaximizeEmitter.event;
	public readonly onRecentlyOpenedChange = this.recentlyOpenedChangeEmitter.event;

	private readonly window = new electron.BrowserWindow();

	// Dialogs
	public async pickFileFolderAndOpen(options: INativeOpenDialogOptions): Promise<void> {
		showOpenDialog({
			...(options.dialogOptions || {}),
			properties: {
				openFile: true,
				openDirectory: true,
			},
		}).then((path) => {
			// tslint:disable-next-line:no-any
			(<any>electron.ipcMain).send("vscode:openFiles", {
				filesToOpen: [{
					fileUri: URI.file(path),
				}],
			} as IOpenFileRequest);
		}).catch((ex) => {
			logger.error(ex.message);
		});
	}

	public async pickFileAndOpen(options: INativeOpenDialogOptions): Promise<void> {
		showOpenDialog({
			...(options.dialogOptions || {}),
			properties: {
				openFile: true,
			},
		}).then((path) => {
			// tslint:disable-next-line:no-any
			(<any>electron.ipcMain).send("vscode:openFiles", {
				filesToOpen: [{
					fileUri: URI.file(path),
				}],
			} as IOpenFileRequest);
		}).catch((ex) => {
			logger.error(ex.message);
		});
	}

	public async pickFolderAndOpen(options: INativeOpenDialogOptions): Promise<void> {
		if (!options.dialogOptions) {
			options.dialogOptions = {};
		}
		if (!options.dialogOptions.title) {
			options.dialogOptions.title = "Open Folder";
		}
		showOpenDialog({
			...(options.dialogOptions || {}),
			properties: {
				openDirectory: true,
			},
		}).then((path) => {
			workbench.workspace = URI.file(path);
		}).catch((ex) => {
			logger.error(ex.message);
		});
	}

	public async pickWorkspaceAndOpen(options: INativeOpenDialogOptions): Promise<void> {
		showOpenDialog({
			...(options.dialogOptions || {}),
			properties: {
				openDirectory: true,
			},
		}).then((path) => {
			// tslint:disable-next-line:no-any
			(<any>electron.ipcMain).send("vscode:addFolders", {
				foldersToAdd: [URI.file(path)],
			} as IAddFoldersRequest);
		}).catch((ex) => {
			logger.error(ex.message);
		});
	}

	public showMessageBox(windowId: number, options: MessageBoxOptions): Promise<IMessageBoxResult> {
		return new Promise((resolve): void => {
			electron.dialog.showMessageBox(this.getWindowById(windowId), options, (response, checkboxChecked) => {
				resolve({
					button: response,
					checkboxChecked,
				});
			});
		});
	}

	public showSaveDialog(windowId: number, options: SaveDialogOptions): Promise<string> {
		return new Promise((resolve): void => {
			electron.dialog.showSaveDialog(this.getWindowById(windowId), options, (filename, _bookmark) => {
				resolve(filename);
			});
		});
	}

	public async showOpenDialog(_windowId: number, options: OpenDialogOptions): Promise<string[]> {
		return [await showOpenDialog({
			...(options || {}),
			properties: {
				openDirectory: options && options.properties && options.properties.includes("openDirectory") || false,
				openFile: options && options.properties && options.properties.includes("openFile") || false,
			},
		})];
	}

	public reloadWindow(windowId: number, _args?: ParsedArgs): Promise<void> {
		return Promise.resolve(this.getWindowById(windowId).reload());
	}

	public openDevTools(_windowId: number, _options?: IDevToolsOptions): Promise<void> {
		throw new Error("not implemented");
	}

	public toggleDevTools(_windowId: number): Promise<void> {
		throw new Error("Toggling developer tools from JavaScript is not supported.");
	}

	public closeWorkspace(_windowId: number): Promise<void> {
		throw new Error("not implemented");
	}

	public enterWorkspace(_windowId: number, uri: URI): Promise<IEnterWorkspaceResult> {
		if (uri.path.endsWith(".json")) {
			workbench.workspace = {
				id: "Untitled",
				configPath: uri,
			};
		} else {
			workbench.workspace = uri;
		}

		return undefined!;
	}

	public createAndEnterWorkspace(_windowId: number, _folders?: IWorkspaceFolderCreationData[], _path?: string): Promise<IEnterWorkspaceResult> {
		throw new Error("not implemented");
	}

	public saveAndEnterWorkspace(_windowId: number, _path: string): Promise<IEnterWorkspaceResult> {
		throw new Error("not implemented");
	}

	public toggleFullScreen(windowId: number): Promise<void> {
		const win = this.getWindowById(windowId);

		return Promise.resolve(win.setFullScreen(!win.isFullScreen()));
	}

	public setRepresentedFilename(windowId: number, fileName: string): Promise<void> {
		return Promise.resolve(this.getWindowById(windowId).setRepresentedFilename(fileName));
	}

	public addRecentlyOpened(_files: IRecent[]): Promise<void> {
		throw new Error("not implemented");
	}

	public removeFromRecentlyOpened(_paths: (IWorkspaceIdentifier | ISingleFolderWorkspaceIdentifier | URI | string)[]): Promise<void> {
		throw new Error("not implemented");
	}

	public clearRecentlyOpened(): Promise<void> {
		throw new Error("not implemented");
	}

	public getRecentlyOpened(_windowId: number): Promise<IRecentlyOpened> {
		// TODO: properly implement.
		return Promise.resolve({
			workspaces: [],
			files: [],
		});
	}

	public focusWindow(windowId: number): Promise<void> {
		return Promise.resolve(this.getWindowById(windowId).focus());
	}

	public closeWindow(_windowId: number): Promise<void> {
		throw new Error("not implemented");
	}

	public isFocused(windowId: number): Promise<boolean> {
		return Promise.resolve(this.getWindowById(windowId).isFocused());
	}

	public isMaximized(_windowId: number): Promise<boolean> {
		throw new Error("not implemented");
	}

	public maximizeWindow(_windowId: number): Promise<void> {
		throw new Error("not implemented");
	}

	public unmaximizeWindow(_windowId: number): Promise<void> {
		throw new Error("not implemented");
	}

	public minimizeWindow(_windowId: number): Promise<void> {
		throw new Error("not implemented");
	}

	public onWindowTitleDoubleClick(_windowId: number): Promise<void> {
		throw new Error("not implemented");
	}

	public setDocumentEdited(_windowId: number, _flag: boolean): Promise<void> {
		throw new Error("not implemented");
	}

	public quit(): Promise<void> {
		throw new Error("not implemented");
	}

	public relaunch(_options: { addArgs?: string[], removeArgs?: string[] }): Promise<void> {
		throw new Error("not implemented");
	}

	// macOS Native Tabs
	public newWindowTab(): Promise<void> {
		throw new Error("not implemented");
	}

	public showPreviousWindowTab(): Promise<void> {
		throw new Error("not implemented");
	}

	public showNextWindowTab(): Promise<void> {
		throw new Error("not implemented");
	}

	public moveWindowTabToNewWindow(): Promise<void> {
		throw new Error("not implemented");
	}

	public mergeAllWindowTabs(): Promise<void> {
		throw new Error("not implemented");
	}

	public toggleWindowTabsBar(): Promise<void> {
		throw new Error("not implemented");
	}

	// macOS TouchBar
	public updateTouchBar(_windowId: number, _items: ISerializableCommandAction[][]): Promise<void> {
		throw new Error("not implemented");
	}

	// Shared process
	public async whenSharedProcessReady(): Promise<void> {
		await client.sharedProcessData;
	}

	public toggleSharedProcess(): Promise<void> {
		throw new Error("not implemented");
	}

	// Global methods
	public openWindow(_windowId: number, _uris: IURIToOpen[], _options?: IOpenSettings): Promise<void> {
		throw new Error("not implemented");
	}

	public openNewWindow(_options?: INewWindowOptions): Promise<void> {
		throw new Error("not implemented");
	}

	public showWindow(windowId: number): Promise<void> {
		return Promise.resolve(this.getWindowById(windowId).show());
	}

	public getWindows(): Promise<{ id: number; workspace?: IWorkspaceIdentifier; folderUri?: ISingleFolderWorkspaceIdentifier; title: string; filename?: string; }[]> {
		throw new Error("not implemented");
	}

	public getWindowCount(): Promise<number> {
		return Promise.resolve(1);
	}

	public log(_severity: string, ..._messages: string[]): Promise<void> {
		throw new Error("not implemented");
	}

	public async showItemInFolder(uri: URI): Promise<void> {
		workbench.workspace = uri;
	}

	public getActiveWindowId(): Promise<number | undefined> {
		return Promise.resolve(1);
	}

	public async openExternal(_url: string): Promise<boolean> {
		return typeof window.open(_url, "_blank") !== "undefined";
	}

	public startCrashReporter(_config: CrashReporterStartOptions): Promise<void> {
		throw new Error("not implemented");
	}

	public openAboutDialog(): Promise<void> {
		throw new Error("not implemented");
	}

	public resolveProxy(windowId: number, url: string): Promise<string | undefined> {
		return new Promise((resolve): void => {
			this.getWindowById(windowId).webContents.session.resolveProxy(url, (proxy) => {
				resolve(proxy);
			});
		});
	}

	/**
	 * Get window by ID. For now this is always the current window.
	 */
	private getWindowById(_windowId: number): electron.BrowserWindow {
		return this.window;
	}
}
