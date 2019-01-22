import * as electron from "electron";
import { Emitter } from "@coder/events";
import * as windowsIpc from "vs/platform/windows/node/windowsIpc";
import { IWindowsService, INativeOpenDialogOptions, MessageBoxOptions, SaveDialogOptions, OpenDialogOptions, IMessageBoxResult, IDevToolsOptions, IEnterWorkspaceResult, CrashReporterStartOptions, INewWindowOptions } from "vs/platform/windows/common/windows";
import { ParsedArgs } from "vs/platform/environment/common/environment";
import { IWorkspaceIdentifier, IWorkspaceFolderCreationData, ISingleFolderWorkspaceIdentifier } from "vs/platform/workspaces/common/workspaces";
import { URI } from "vs/base/common/uri";
import { IRecentlyOpened } from "vs/platform/history/common/history";
import { ISerializableCommandAction } from "vs/platform/actions/common/actions";
import { client } from "../client";

/**
 * Instead of going to the shared process, we'll directly run these methods on
 * the client. This setup means we can only control the current window.
 */
class WindowsService implements IWindowsService {

	// tslint:disable-next-line no-any
	public _serviceBrand: any;

	private openEmitter = new Emitter<number>();
	private focusEmitter = new Emitter<number>();
	private blurEmitter = new Emitter<number>();
	private maximizeEmitter = new Emitter<number>();
	private unmaximizeEmitter = new Emitter<number>();
	private recentlyOpenedChangeEmitter = new Emitter<void>();

	public onWindowOpen = this.openEmitter.event;
	public onWindowFocus = this.focusEmitter.event;
	public onWindowBlur = this.blurEmitter.event;
	public onWindowMaximize = this.maximizeEmitter.event;
	public onWindowUnmaximize = this.unmaximizeEmitter.event;
	public onRecentlyOpenedChange = this.recentlyOpenedChangeEmitter.event;

	private window = new electron.BrowserWindow();

	// Dialogs
	public pickFileFolderAndOpen(_options: INativeOpenDialogOptions): Promise<void> {
		throw new Error("not implemented");
	}

	public pickFileAndOpen(_options: INativeOpenDialogOptions): Promise<void> {
		throw new Error("not implemented");
	}

	public pickFolderAndOpen(_options: INativeOpenDialogOptions): Promise<void> {
		throw new Error("not implemented");
	}

	public pickWorkspaceAndOpen(_options: INativeOpenDialogOptions): Promise<void> {
		throw new Error("not implemented");
	}

	public showMessageBox(_windowId: number, _options: MessageBoxOptions): Promise<IMessageBoxResult> {
		throw new Error("not implemented");
	}

	public showSaveDialog(_windowId: number, _options: SaveDialogOptions): Promise<string> {
		throw new Error("not implemented");
	}

	public showOpenDialog(_windowId: number, _options: OpenDialogOptions): Promise<string[]> {
		throw new Error("not implemented");
	}

	public reloadWindow(windowId: number, _args?: ParsedArgs): Promise<void> {
		return Promise.resolve(this.getWindowById(windowId).reload());
	}

	public openDevTools(_windowId: number, _options?: IDevToolsOptions): Promise<void> {
		throw new Error("not implemented");
	}

	public toggleDevTools(_windowId: number): Promise<void> {
		throw new Error("not implemented");
	}

	public closeWorkspace(_windowId: number): Promise<void> {
		throw new Error("not implemented");
	}

	public enterWorkspace(_windowId: number, _path: string): Promise<IEnterWorkspaceResult> {
		throw new Error("not implemented");
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

	public showItemInFolder(_path: string): Promise<void> {
		throw new Error("not implemented");
	}

	public getActiveWindowId(): Promise<number | undefined> {
		return Promise.resolve(1);
	}

	public openExternal(_url: string): Promise<boolean> {
		throw new Error("not implemented");
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

// @ts-ignore
windowsIpc.WindowsChannelClient = WindowsService;
