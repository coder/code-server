import * as electron from "electron";
import { EventEmitter } from "events";
import * as fs from "fs";
import { getFetchUrl } from "../src/coder/api";
import { escapePath } from "../src/coder/common";
import { wush } from "../src/coder/server";
import { IKey, Dialog } from "./dialog";

(global as any).getOpenUrls = () => {
	return [];
};

const oldCreateElement = document.createElement;

document.createElement = (tagName: string) => {
	const createElement = (tagName: string) => {
		return oldCreateElement.call(document, tagName);
	};

	if (tagName === "webview") {
		const view = createElement("iframe") as HTMLIFrameElement;
		view.style.border = "0px";
		const frameID = Math.random().toString();
		view.addEventListener("error", (event) => {
			console.log("Got iframe error", event.error, event.message);
		});
		window.addEventListener("message", (event) => {
			if (!event.data || !event.data.id) {
				return;
			}
			if (event.data.id !== frameID) {
				return;
			}
			const e = new CustomEvent("ipc-message");
			(e as any).channel = event.data.channel;
			(e as any).args = event.data.data;
			view.dispatchEvent(e);
		});
		view.sandbox.add("allow-same-origin", "allow-scripts", "allow-popups", "allow-forms");
		Object.defineProperty(view, "preload", {
			set: (url: string) => {
				view.onload = () => {
					view.contentDocument.body.id = frameID;
					view.contentDocument.body.parentElement.style.overflow = "hidden";
					const script = document.createElement("script");
					script.src = url;
					view.contentDocument.head.appendChild(script);
				};
			},
		});
		(view as any).getWebContents = () => undefined;
		(view as any).send = (channel: string, ...args) => {
			if (args[0] && typeof args[0] === "object" && args[0].contents) {
				args[0].contents = (args[0].contents as string).replace(/"(file:\/\/[^"]*)"/g, (m) => `"${getFetchUrl(m)}"`);
				args[0].contents = (args[0].contents as string).replace(/"vscode-resource:([^"]*)"/g, (m) => `"${getFetchUrl(m)}"`);
			}
			view.contentWindow.postMessage({
				channel,
				data: args,
				id: frameID,
			}, "*");
		};
		return view;
	}

	return createElement(tagName);
};

const rendererToMainEmitter = new EventEmitter();
const mainToRendererEmitter = new EventEmitter();

module.exports = {
	clipboard: {
		has: () => {
			return false;
		},
		writeText: (value: string) => {
			// Taken from https://hackernoon.com/copying-text-to-clipboard-with-javascript-df4d4988697f
			const active = document.activeElement as HTMLElement;
			const el = document.createElement('textarea');  // Create a <textarea> element
			el.value = value;                                 // Set its value to the string that you want copied
			el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
			el.style.position = 'absolute';
			el.style.left = '-9999px';                      // Move outside the screen to make it invisible
			document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
			const selected =
				document.getSelection().rangeCount > 0        // Check if there is any content selected previously
					? document.getSelection().getRangeAt(0)     // Store selection if found
					: false;                                    // Mark as false to know no selection existed before
			el.select();                                    // Select the <textarea> content
			document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
			document.body.removeChild(el);                  // Remove the <textarea> element
			if (selected) {                                 // If a selection existed before copying
				document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
				document.getSelection().addRange(selected);   // Restore the original selection
			}
			active.focus();
		},
	},
	dialog: {
		showSaveDialog: (_: void, options: Electron.SaveDialogOptions, callback: (filename: string) => void): void => {
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

			const dialog = new Dialog(saveDialogOptions);
			dialog.onAction((action) => {
				if (action.key !== IKey.Enter && action.buttonIndex !== 1) {
					dialog.hide();
					return callback(undefined);
				}

				const filePath = dialog.inputValue.replace(/\/+$/, "");
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

						const confirmDialog = new Dialog({
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
		},
		showOpenDialog: () => {
			console.log("Trying to show the open dialog");
		},
		showMessageBox: (_: void, options: Electron.MessageBoxOptions, callback: (button: number, checked: boolean) => void): void => {
			const dialog = new Dialog(options);
			dialog.onAction((action) => {
				dialog.hide();
				callback(action.buttonIndex, false);
			});
			dialog.show();
		},
	},
	remote: {
		dialog: {
			showOpenDialog: () => {
				console.log("Trying to remotely open");
			},
		},
	},
	webFrame: {
		getZoomFactor: () => {
			return 1;
		},
		getZoomLevel: () => {
			return 1;
		},
		setZoomLevel: () => {
			return;
		},
	},
	screen: {
		getAllDisplays: () => {
			return [{
				bounds: {
					x: 1000,
					y: 1000,
				},
			}];
		},
	},
	app: {
		isAccessibilitySupportEnabled: () => {
			return false;
		},
		setAsDefaultProtocolClient: () => {

		},
		send: (str) => {
			console.log("APP Trying to send", str);
			//
		},
		on: () => {
			//
		},
		once: () => {
			//
		},
	},
	// ipcRenderer communicates with ipcMain
	ipcRenderer: {
		send: (str, ...args) => {
			rendererToMainEmitter.emit(str, {
				sender: module.exports.ipcMain,
			}, ...args);
		},
		on: (str, listener) => {
			mainToRendererEmitter.on(str, listener);
		},
		once: (str, listener) => {
			mainToRendererEmitter.once(str, listener);
		},
		removeListener: (str, listener) => {
			mainToRendererEmitter.removeListener(str, listener);
		},
	},
	ipcMain: {
		send: (str, ...args) => {
			mainToRendererEmitter.emit(str, {
				sender: module.exports.ipcRenderer,
			}, ...args);
		},
		on: (str, listener) => {
			rendererToMainEmitter.on(str, listener);
		},
		once: (str, listener) => {
			rendererToMainEmitter.once(str, listener);
		},
	},
	shell: {
		moveItemToTrash: async (path) => {
			const response = await wush.execute({
				command: `trash-put --trash-dir ${escapePath("~/.Trash")} ${escapePath(path)}`,
			}).done();
			return response.wasSuccessful();
		},
	},
	BrowserWindow: class {

		public webContents = {
			on: () => {

			},
			session: {
				webRequest: {
					onBeforeRequest: () => {

					},

					onBeforeSendHeaders: () => {

					},

					onHeadersReceived: () => {

					},
				}
			},
			removeAllListeners: () => {

			},
		}

		public static getFocusedWindow() {
			return undefined;
		}

		public isMaximized() {
			return false;
		}

		public isFullScreen() {
			return false;
		}

		public setMenuBarVisibility(visibility) {
			console.log("We are setting the menu bar to ", visibility);
		}

		public setAutoHideMenuBar() {

		}

		public on() {

		}

		public setTitle(value: string): void {
			document.title = value;
		}
	},
	toggleFullScreen: () => {
		const doc = document as any;
		const isInFullScreen = doc.fullscreenElement
			|| doc.webkitFullscreenElement
			|| doc.mozFullScreenElement
			|| doc.msFullscreenElement;

		const body = doc.body;
		if (!isInFullScreen) {
			if (body.requestFullscreen) {
				body.requestFullscreen();
			} else if (body.mozRequestFullScreen) {
				body.mozRequestFullScreen();
			} else if (body.webkitRequestFullScreen) {
				body.webkitRequestFullScreen();
			} else if (body.msRequestFullscreen) {
				body.msRequestFullscreen();
			}
		} else {
			if (doc.exitFullscreen) {
				doc.exitFullscreen();
			} else if (doc.webkitExitFullscreen) {
				doc.webkitExitFullscreen();
			} else if (doc.mozCancelFullScreen) {
				doc.mozCancelFullScreen();
			} else if (doc.msExitFullscreen) {
				doc.msExitFullscreen();
			}
		}
	},
	focusWindow: () => {
		console.log("focusing window");
		window.focus();
	},
};
