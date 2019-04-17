/// <reference path="../../../../lib/vscode/src/typings/electron.d.ts" />
import { EventEmitter } from "events";
import * as fs from "fs";
import * as trash from "trash";
import { logger, field } from "@coder/logger";
import { IKey, Dialog as DialogBox } from "./dialog";
import { clipboard } from "./clipboard";

// tslint:disable-next-line no-any
(global as any).getOpenUrls = (): string[] => {
	return [];
};

// This is required to make the fill load in Node without erroring.
if (typeof document === "undefined") {
	// tslint:disable-next-line no-any
	(global as any).document = {} as any;
}

const oldCreateElement = document.createElement;
const newCreateElement = <K extends keyof HTMLElementTagNameMap>(tagName: K): HTMLElementTagNameMap[K] => {
	const createElement = <K extends keyof HTMLElementTagNameMap>(tagName: K): HTMLElementTagNameMap[K] => {
		// tslint:disable-next-line:no-any
		return oldCreateElement.call(document, tagName as any);
	};
	// tslint:disable-next-line:no-any
	const getPropertyDescriptor = (object: any, id: string): PropertyDescriptor | undefined => {
		let op = Object.getPrototypeOf(object);
		while (!Object.getOwnPropertyDescriptor(op, id)) {
			op = Object.getPrototypeOf(op);
		}

		return Object.getOwnPropertyDescriptor(op, id);
	};

	if (tagName === "img") {
		const img = createElement("img");
		const oldSrc = getPropertyDescriptor(img, "src");
		if (!oldSrc) {
			throw new Error("Failed to find src property");
		}
		Object.defineProperty(img, "src", {
			get: (): string => {
				return oldSrc!.get!.call(img);
			},
			set: (value: string): void => {
				if (value) {
					const resourceBaseUrl = location.pathname.replace(/\/$/, "") + "/resource";
					value = value.replace(/file:\/\//g, resourceBaseUrl);
				}
				oldSrc!.set!.call(img, value);
			},
		});

		return img;
	}

	if (tagName === "style") {
		const style = createElement("style");
		const oldInnerHtml = getPropertyDescriptor(style, "innerHTML");
		if (!oldInnerHtml) {
			throw new Error("Failed to find innerHTML property");
		}
		Object.defineProperty(style, "innerHTML", {
			get: (): string => {
				return oldInnerHtml!.get!.call(style);
			},
			set: (value: string): void => {
				if (value) {
					const resourceBaseUrl = location.pathname.replace(/\/$/, "") + "/resource";
					value = value.replace(/file:\/\//g, resourceBaseUrl);
				}
				oldInnerHtml!.set!.call(style, value);
			},
		});
		let overridden = false;
		const oldSheet = getPropertyDescriptor(style, "sheet");
		Object.defineProperty(style, "sheet", {
			// tslint:disable-next-line:no-any
			get: (): any => {
				const sheet = oldSheet!.get!.call(style);
				if (sheet && !overridden) {
					const oldInsertRule = sheet.insertRule;
					sheet.insertRule = (rule: string, index?: number): void => {
						const resourceBaseUrl = location.pathname.replace(/\/$/, "") + "/resource";
						rule = rule.replace(/file:\/\//g, resourceBaseUrl);
						oldInsertRule.call(sheet, rule, index);
					};
					overridden = true;
				}

				return sheet;
			},
		});

		return style;
	}

	if (tagName === "webview") {
		const view = createElement("iframe") as HTMLIFrameElement;
		view.style.border = "0px";
		const frameID = Math.random().toString();
		view.addEventListener("error", (event) => {
			logger.error("iframe error", field("event", event));
		});
		window.addEventListener("message", (event) => {
			if (!event.data || !event.data.id) {
				return;
			}
			if (event.data.id !== frameID) {
				return;
			}
			const e = new CustomEvent("ipc-message");
			(e as any).channel = event.data.channel; // tslint:disable-line no-any
			(e as any).args = event.data.data; // tslint:disable-line no-any
			view.dispatchEvent(e);
		});
		view.sandbox.add("allow-same-origin", "allow-scripts", "allow-popups", "allow-forms");
		Object.defineProperty(view, "preload", {
			set: (url: string): void => {
				view.onload = (): void => {
					if (view.contentDocument) {
						view.contentDocument.body.id = frameID;
						view.contentDocument.body.parentElement!.style.overflow = "hidden";
						const script = createElement("script");
						script.src = url;
						script.addEventListener("load", () => {
							view.contentDocument!.dispatchEvent(new Event("DOMContentLoaded", {
								bubbles: true,
								cancelable: true,
							}));
							// const e = new CustomEvent("ipc-message");
							// (e as any).channel = "webview-ready"; // tslint:disable-line no-any
							// (e as any).args = [frameID]; // tslint:disable-line no-any
							// view.dispatchEvent(e);
						});
						view.contentDocument.head.appendChild(script);
					}

				};
			},
		});
		view.src = require("!!file-loader?name=[path][name].[ext]!./webview.html");
		Object.defineProperty(view, "src", {
			set: (): void => { /* Nope. */ },
		});
		(view as any).getWebContents = (): void => undefined; // tslint:disable-line no-any
		(view as any).send = (channel: string, ...args: any[]): void => { // tslint:disable-line no-any
			if (args[0] && typeof args[0] === "object" && args[0].contents) {
				// TODO
				const resourceBaseUrl = location.pathname.replace(/\/$/, "") + "/resource";
				args[0].contents = (args[0].contents as string).replace(/"(file:\/\/[^"]*)"/g, (m1) => `"${resourceBaseUrl}${m1}"`);
				args[0].contents = (args[0].contents as string).replace(/"vscode-resource:([^"]*)"/g, (m, m1) => `"${resourceBaseUrl}${m1}"`);
				args[0].contents = (args[0].contents as string).replace(/style-src vscode-core-resource:/g, "style-src 'self'");
			}
			if (view.contentWindow) {
				view.contentWindow.postMessage({
					channel,
					data: args,
					id: frameID,
				}, "*");
			}
		};

		return view;
	}

	return createElement(tagName);
};

document.createElement = newCreateElement;

class Clipboard {
	public has(): boolean {
		return false;
	}

	public readFindText(): string {
		return "";
	}

	public writeFindText(_text: string): void {
		// Nothing.
	}

	public writeText(value: string): Promise<void> {
		return clipboard.writeText(value);
	}

	public readText(): Promise<string> {
		return clipboard.readText();
	}
}

class Shell {
	public async moveItemToTrash(path: string): Promise<void> {
		await trash(path);
	}
}

class App extends EventEmitter {
	public isAccessibilitySupportEnabled(): boolean {
		return false;
	}

	public setAsDefaultProtocolClient(): void {
		throw new Error("not implemented");
	}
}

class Dialog {
	public showSaveDialog(_: void, options: Electron.SaveDialogOptions, callback: (filename: string | undefined) => void): void {
		const defaultPath = options.defaultPath || "/untitled";
		const fileIndex = defaultPath.lastIndexOf("/");
		const extensionIndex = defaultPath.lastIndexOf(".");
		const saveDialogOptions = {
			buttons: ["Cancel", "Save"],
			detail: "Enter a path for this file",
			input: {
				value: defaultPath,
				selection: {
					start: fileIndex === -1 ? 0 : fileIndex + 1,
					end: extensionIndex === -1 ? defaultPath.length : extensionIndex,
				},
			},
			message: "Save file",
		};

		const dialog = new DialogBox(saveDialogOptions);
		dialog.onAction((action) => {
			if (action.key !== IKey.Enter && action.buttonIndex !== 1) {
				dialog.hide();

				return callback(undefined);
			}

			const inputValue = dialog.inputValue || "";
			const filePath = inputValue.replace(/\/+$/, "");
			const split = filePath.split("/");
			const fileName = split.pop();
			const parentName = split.pop() || "/";
			if (fileName === "") {
				dialog.error = "You must enter a file name.";

				return;
			}

			fs.stat(filePath, (error, stats) => {
				if (error && error.code === "ENOENT") {
					dialog.hide();
					callback(filePath);
				} else if (error) {
					dialog.error = error.message;
				} else if (stats.isDirectory()) {
					dialog.error = `A directory named "${fileName}" already exists.`;
				} else {
					dialog.error = undefined;

					const confirmDialog = new DialogBox({
						message: `A file named "${fileName}" already exists. Do you want to replace it?`,
						detail: `The file already exists in "${parentName}". Replacing it will overwrite its contents.`,
						buttons: ["Cancel", "Replace"],
					});

					confirmDialog.onAction((action) => {
						if (action.buttonIndex === 1) {
							confirmDialog.hide();

							return callback(filePath);
						}

						confirmDialog.hide();
						dialog.show();
					});

					dialog.hide();
					confirmDialog.show();
				}
			});
		});
		dialog.show();
	}

	public showOpenDialog(): void {
		throw new Error("not implemented");
	}

	public showMessageBox(_: void, options: Electron.MessageBoxOptions, callback: (button: number | undefined, checked: boolean) => void): void {
		const dialog = new DialogBox(options);
		dialog.onAction((action) => {
			dialog.hide();
			callback(action.buttonIndex, false);
		});
		dialog.show();
	}
}

class WebFrame {
	public getZoomFactor(): number {
		return 1;
	}

	public getZoomLevel(): number {
		return 1;
	}

	public setZoomLevel(): void {
		// Nothing.
	}
}

class Screen {
	public getAllDisplays(): [] {
		return [];
	}
}

class WebRequest extends EventEmitter {
	public onBeforeRequest(): void {
		throw new Error("not implemented");
	}

	public onBeforeSendHeaders(): void {
		throw new Error("not implemented");
	}

	public onHeadersReceived(): void {
		throw new Error("not implemented");
	}
}

class Session extends EventEmitter {
	public webRequest = new WebRequest();

	public resolveProxy(url: string, callback: (proxy: string) => void): void {
		// TODO: not sure what this actually does.
		callback(url);
	}
}

class WebContents extends EventEmitter {
	public session = new Session();
}

class BrowserWindow extends EventEmitter {
	public webContents = new WebContents();
	private representedFilename: string = "";

	public static getFocusedWindow(): undefined {
		return undefined;
	}

	public focus(): void {
		window.focus();
	}

	public show(): void {
		window.focus();
	}

	public reload(): void {
		location.reload();
	}

	public isMaximized(): boolean {
		return false;
	}

	public setFullScreen(fullscreen: boolean): void {
		if (fullscreen) {
			document.documentElement.requestFullscreen();
		} else {
			document.exitFullscreen();
		}
	}

	public isFullScreen(): boolean {
		return document.fullscreenEnabled;
	}

	public isFocused(): boolean {
		return document.hasFocus();
	}

	public setMenuBarVisibility(): void {
		throw new Error("not implemented");
	}

	public setAutoHideMenuBar(): void {
		throw new Error("not implemented");
	}

	public setRepresentedFilename(filename: string): void {
		this.representedFilename = filename;
	}

	public getRepresentedFilename(): string {
		return this.representedFilename;
	}

	public setTitle(value: string): void {
		document.title = value;
	}
}

/**
 * We won't be able to do a 1 to 1 fill because things like moveItemToTrash for
 * example returns a boolean while we need a promise.
 */
class ElectronFill {
	public readonly shell = new Shell();
	public readonly clipboard = new Clipboard();
	public readonly app = new App();
	public readonly dialog = new Dialog();
	public readonly webFrame = new WebFrame();
	public readonly screen = new Screen();

	private readonly rendererToMainEmitter = new EventEmitter();
	private readonly mainToRendererEmitter = new EventEmitter();

	public get BrowserWindow(): typeof BrowserWindow {
		return BrowserWindow;
	}

	// tslint:disable no-any
	public get ipcRenderer(): object {
		return {
			send: (str: string, ...args: any[]): void => {
				this.rendererToMainEmitter.emit(str, {
					sender: module.exports.ipcMain,
				}, ...args);
			},
			on: (str: string, listener: (...args: any[]) => void): void => {
				this.mainToRendererEmitter.on(str, listener);
			},
			once: (str: string, listener: (...args: any[]) => void): void => {
				this.mainToRendererEmitter.once(str, listener);
			},
			removeListener: (str: string, listener: (...args: any[]) => void): void => {
				this.mainToRendererEmitter.removeListener(str, listener);
			},
		};
	}

	public get ipcMain(): object {
		return {
			send: (str: string, ...args: any[]): void => {
				this.mainToRendererEmitter.emit(str, {
					sender: module.exports.ipcRenderer,
				}, ...args);
			},
			on: (str: string, listener: (...args: any[]) => void): void => {
				this.rendererToMainEmitter.on(str, listener);
			},
			once: (str: string, listener: (...args: any[]) => void): void => {
				this.rendererToMainEmitter.once(str, listener);
			},
		};
	}
	// tslint:enable no-any
}

module.exports = new ElectronFill();
