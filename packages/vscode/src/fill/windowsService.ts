import * as electron from "electron";
import { Emitter } from "@coder/events";
import * as windowsIpc from "vs/platform/windows/node/windowsIpc";
import { IWindowsService, INativeOpenDialogOptions, MessageBoxOptions, SaveDialogOptions, OpenDialogOptions, IMessageBoxResult, IDevToolsOptions, IEnterWorkspaceResult, CrashReporterStartOptions, INewWindowOptions, IOpenFileRequest, IAddFoldersRequest } from "vs/platform/windows/common/windows";
import { ParsedArgs } from "vs/platform/environment/common/environment";
import { IWorkspaceIdentifier, IWorkspaceFolderCreationData, ISingleFolderWorkspaceIdentifier } from "vs/platform/workspaces/common/workspaces";
import { URI } from "vs/base/common/uri";
import { IRecentlyOpened } from "vs/platform/history/common/history";
import { ISerializableCommandAction } from "vs/platform/actions/common/actions";
import { client } from "../client";
import { showOpenDialog } from "../dialog";
import { workbench } from "../workbench";

/**
 * Instead of going to the shared process, we'll directly run these methods on
 * the client. This setup means we can only control the current window.
 */
class WindowsService implements IWindowsService {
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
	public async pickFileFolderAndOpen(_options: INativeOpenDialogOptions): Promise<void> {
		showOpenDialog({
			...(_options.dialogOptions || {}),
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
			//
		});
	}

	public async pickFileAndOpen(_options: INativeOpenDialogOptions): Promise<void> {
		showOpenDialog({
			...(_options.dialogOptions || {}),
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
			//
		});
	}

	public async pickFolderAndOpen(_options: INativeOpenDialogOptions): Promise<void> {
		showOpenDialog({
			...(_options.dialogOptions || {}),
			properties: {
				openDirectory: true,
			},
		}).then((path) => {
			workbench.workspace = URI.file(path);
		}).catch((ex) => {
			//
		});
	}

	public async pickWorkspaceAndOpen(_options: INativeOpenDialogOptions): Promise<void> {
		showOpenDialog({
			...(_options.dialogOptions || {}),
			properties: {
				openDirectory: true,
			},
		}).then((path) => {
			// tslint:disable-next-line:no-any
			(<any>electron.ipcMain).send("vscode:addFolders", {
				foldersToAdd: [URI.file(path)],
			} as IAddFoldersRequest);
		}).catch((ex) => {
			//
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

	public showOpenDialog(windowId: number, options: OpenDialogOptions): Promise<string[]> {
		return showOpenDialog({
			...(options || {}),
			properties: {
				openDirectory: true,
				openFile: true,
			},
		}).then((path) => {
			return [path];
		});
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

	public enterWorkspace(_windowId: number, _path: URI): Promise<IEnterWorkspaceResult> {
		if (_path.path.endsWith(".json")) {
			workbench.workspace = {
				id: "Untitled",
				configPath: _path.path,
			};
		} else {
			workbench.workspace = _path;
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

	public addRecentlyOpened(_files: URI[]): Promise<void> {
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
	public openWindow(_windowId: number, _paths: URI[], _options?: { forceNewWindow?: boolean, forceReuseWindow?: boolean, forceOpenWorkspaceAsFile?: boolean, args?: ParsedArgs }): Promise<void> {
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

	public async showItemInFolder(_path: string): Promise<void> {
		workbench.workspace = URI.file(_path);
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

const target = windowsIpc as typeof windowsIpc;
// @ts-ignore TODO: don't ignore it.
target.WindowsChannelClient = WindowsService;
