import "./fill/require";
import "./fill/storageDatabase";
import "./fill/windowsService";

import { fork } from "child_process";
import { Client as IDEClient, IURI, IURIFactory } from "@coder/ide";
import { logger } from "@coder/logger";

import { registerContextMenuListener } from "vs/base/parts/contextmenu/electron-main/contextmenu";
import { LogLevel } from "vs/platform/log/common/log";
import { toLocalISOString } from "vs/base/common/date";
// import { RawContextKey, IContextKeyService } from "vs/platform/contextkey/common/contextkey";
import { URI } from "vs/base/common/uri";

import { Protocol, ISharedProcessInitData } from "./protocol";
import * as paths from "./fill/paths";
import "./firefox";

export class Client extends IDEClient {

	private readonly sharedProcessLogger = logger.named("shr proc");
	private readonly windowId = parseInt(toLocalISOString(new Date()).replace(/[-:.TZ]/g, ""), 10);
	private readonly version = "hello"; // TODO: pull from package.json probably
	private readonly bootstrapForkLocation = "/bootstrap"; // TODO: location.
	public readonly protocolPromise: Promise<Protocol>;
	private protoResolve: ((protocol: Protocol) => void) | undefined;

	public constructor() {
		super();
		process.env.VSCODE_LOGS = "/tmp/vscode-online/logs"; // TODO: use tmpdir or get log directory from init data.
		this.protocolPromise = new Promise((resolve): void => {
			this.protoResolve = resolve;
		});
	}

	protected initialize(): Promise<void> {
		this.task("Start shared process", 5, async () => {
			const protocol = await this.forkSharedProcess();
			this.protoResolve!(protocol);
		}).catch(() => undefined);

		registerContextMenuListener();

		return this.task("Start workbench", 1000, async (initData) => {
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

	public async forkSharedProcess(): Promise<Protocol> {
		const childProcess = fork(this.bootstrapForkLocation, ["--shared"], {
			env: {
				"VSCODE_ALLOW_IO": "true",
				"AMD_ENTRYPOINT": "vs/code/electron-browser/sharedProcess/sharedProcessClient",
			},
		});

		childProcess.stderr.on("data", (data) => {
			this.sharedProcessLogger.error("stderr: " + data);
		});

		const protocol = Protocol.fromProcess(childProcess);
		await new Promise((resolve, reject): void => {
			protocol.onClose(() => {
				reject(new Error("unable to establish connection to shared process"));
			});

			const listener = protocol.onMessage((message) => {
				const messageStr = message.toString();
				this.sharedProcessLogger.debug(messageStr);
				switch (messageStr) {
					case "handshake:hello":
						protocol.send(Buffer.from(JSON.stringify({
							// Using the version so if we get a new mount, it spins up a new
							// shared process.
							socketPath: `/tmp/vscode-online/shared-${this.version}.sock`,
							serviceUrl: "", // TODO
							logsDir: process.env.VSCODE_LOGS,
							windowId: this.windowId,
							logLevel: LogLevel.Info,
						} as ISharedProcessInitData)));
						break;
					case "handshake:ready":
						listener.dispose();
						resolve();
						break;
				}
			});
		});

		return protocol;
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

client.initData.then((initData) => {
	paths.appData = initData.dataDirectory;
	paths.defaultUserData = initData.dataDirectory;
});