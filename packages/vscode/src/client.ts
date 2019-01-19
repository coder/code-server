import "./fill/require";
import "./fill/storageDatabase";
import "./fill/windowsService";
import * as paths from "./fill/paths";
import "./fill/dom";
import "./vscode.scss";

import { createConnection } from "net";
import { Client as IDEClient, IURI, IURIFactory } from "@coder/ide";

import { registerContextMenuListener } from "vs/base/parts/contextmenu/electron-main/contextmenu";
import { LogLevel } from "vs/platform/log/common/log";
import { toLocalISOString } from "vs/base/common/date";
// import { RawContextKey, IContextKeyService } from "vs/platform/contextkey/common/contextkey";
import { URI } from "vs/base/common/uri";

import { Protocol } from "vs/base/parts/ipc/node/ipc.net";

export class Client extends IDEClient {

	private readonly windowId = parseInt(toLocalISOString(new Date()).replace(/[-:.TZ]/g, ""), 10);

	public readonly protocolPromise: Promise<Protocol>;
	public protoResolve: ((protocol: Protocol) => void) | undefined;

	public constructor() {
		super();
		this.protocolPromise = new Promise((resolve): void => {
			this.protoResolve = resolve;
		});
	}

	protected initialize(): Promise<void> {
		this.task("Connect to shared process", 5, async () => {
			await new Promise((resolve, reject): void => {
				const listener = this.onSharedProcessActive((data) => {
					listener.dispose();
					const socket = createConnection(data.socketPath, resolve);
					socket.once("error", () => {
						reject();
					});
					this.protoResolve!(new Protocol(socket));
				});
			});
		}).catch(() => undefined);

		registerContextMenuListener();

		return this.task("Start workbench", 1000, async (initData) => {
			paths.paths.appData = initData.dataDirectory;
			paths.paths.defaultUserData = initData.dataDirectory;

			const { startup } = require("./startup");
			await startup({
				machineId: "1",
				windowId: this.windowId,
				logLevel: LogLevel.Info,
				mainPid: 1,
				appRoot: initData.dataDirectory,
				execPath: initData.tmpDirectory,
				userEnv: {},
				nodeCachedDataDir: initData.tmpDirectory,
				perfEntries: [],
				_: [],
				folderUri: URI.file(initData.dataDirectory),
			});

			// TODO: Set notification service for retrying.
			// this.retry.setNotificationService({
			// 	prompt: (severity, message, buttons, onCancel) => {
			// 		const handle = getNotificationService().prompt(severity, message, buttons, onCancel);
			// 		return {
			// 			close: () => handle.close(),
			// 			updateMessage: (message) => handle.updateMessage(message),
			// 			updateButtons: (buttons) => handle.updateActions({
			// 				primary: buttons.map((button) => ({
			// 					id: undefined,
			// 					label: button.label,
			// 					tooltip: undefined,
			// 					class: undefined,
			// 					enabled: true,
			// 					checked: false,
			// 					radio: false,
			// 					dispose: () => undefined,
			// 					run: () => {
			// 						button.run();
			// 						return Promise.resolve();
			// 					},
			// 				})),
			// 			}),
			// 		};
			// 	}
			// });

			// TODO: Set up clipboard context.
			// const workbench = workbenchShell.workbench;
			// const contextKeys = workbench.workbenchParams.serviceCollection.get(IContextKeyService) as IContextKeyService;
			// const clipboardContextKey = new RawContextKey("nativeClipboard", this.clipboard.isSupported);
			// const bounded = clipboardContextKey.bindTo(contextKeys);
			// this.clipboard.onPermissionChange((enabled) => {
			// 	bounded.set(enabled);
			// });
			this.clipboard.initialize();
		}, this.initData);
	}

	protected createUriFactory(): IURIFactory {
		return {
			// TODO: not sure why this is an error.
			// tslint:disable-next-line no-any
			create: <URI>(uri: IURI): URI => URI.from(uri) as any,
			file: (path: string): IURI => URI.file(path),
			parse: (raw: string): IURI => URI.parse(raw),
		};
	}

}

export const client = new Client();
