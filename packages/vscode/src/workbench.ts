import * as fs from "fs";
import {
	Client, Emitter, getFactory, IPosition, IFileConflict, ConflictResolution,
	Event,
	IDisposable,
	IDocumentContentChangedEvent, IURI, IRange, escapePath,
	IOrphanedChangedEvent,
} from 'coder/common';
import { Protocol } from 'vs/base/parts/ipc/node/ipc.net';
import { IModelService } from 'vs/editor/common/services/modelService';
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService';
import { ShutdownReason } from 'vs/platform/lifecycle/common/lifecycle';
import { TPromise } from 'vs/base/common/winjs.base';
import { ITextModel, TrackedRangeStickiness, IModelDeltaDecoration } from 'vs/editor/common/model';
import { Position } from 'vs/editor/common/core/position';
import { Selection } from 'vs/editor/common/core/selection';
import { ICodeEditor } from 'vs/editor/browser/editorBrowser';
import { registerContextMenuListener } from 'vs/base/parts/contextmenu/electron-main/contextmenu';
import { Workbench } from 'vs/workbench/electron-browser/workbench';
import { StorageService } from 'coder/storageService';
import { IContentData, IFileService, FileOperationError, FileOperationResult, FileSystemProviderCapabilities, IStat, FileType } from 'vs/platform/files/common/files';
import { onInstantiation as onFileServiceInstantiation } from 'vs/workbench/services/files/electron-browser/fileService';
import { URI } from 'vs/base/common/uri';
import { EventEmitter } from 'events';
import { Range } from 'vs/editor/common/core/range';
import product from 'vs/platform/node/product';
import { CONFLICT_RESOLUTION_SCHEME } from 'vs/workbench/parts/files/electron-browser/saveErrorHandler';
import { ITextFileService, ModelState } from 'vs/workbench/services/textfile/common/textfiles';
import { field, logger } from 'coder/logger';
import { events } from 'coder/analytics';
import { IDecorationsService } from 'vs/workbench/services/decorations/browser/decorations';
import { registerCollaboratorDecorations } from 'coder/collaborators';
import { IInitData as ISharedProcessInitData } from 'vs/code/electron-browser/sharedProcess/sharedProcessClient';
import { LogLevel } from 'vs/platform/log/common/log';
import { INotificationService, Severity } from 'vs/platform/notification/common/notification';
import { toLocalISOString } from 'vs/base/common/date';
import { RawContextKey, IContextKeyService } from 'vs/platform/contextkey/common/contextkey';

let protoResolve: (protocol: Protocol) => void;
export const protocolPromise = new Promise<Protocol>((res) => {
	protoResolve = res;
});
let storageResolve: (storageService: StorageService) => void;
export const getStorageService = new Promise<StorageService>((res) => {
	storageResolve = res;
});
export let systemExtensionsLocation: string;
export let forkedBinLocation: string;

const hasNativeClipboard = typeof navigator !== "undefined" && typeof (navigator as any).clipboard !== "undefined" && typeof (navigator as any).clipboard.readText !== "undefined";
let isEnabled: boolean = false;
const clipboardEnabledEmitter = new Emitter<boolean>();
export const nativeClipboard: {
	readonly contextKey: RawContextKey<boolean>;
	readonly instance: {
		readText(): Promise<string>;
		writeText(value: string): Promise<void>;
	};
	readonly onChange: Event<boolean>;
	readonly isEnabled: boolean;
} = {
	contextKey: new RawContextKey('nativeClipboard', hasNativeClipboard),
	instance: hasNativeClipboard ? (navigator as any).clipboard : undefined,
	get onChange(): Event<boolean> {
		return clipboardEnabledEmitter.event;
	},
	get isEnabled(): boolean {
		return isEnabled;
	}
};

let workbench: Workbench;

function getModelService(): IModelService {
	return workbench.workbenchParams.serviceCollection.get<IModelService>(IModelService) as IModelService;
}

function getCodeEditorService(): ICodeEditorService {
	return workbench.workbenchParams.serviceCollection.get(ICodeEditorService) as ICodeEditorService;
}

function getFileService(): IFileService {
	return workbench.workbenchParams.serviceCollection.get(IFileService) as IFileService;
}

function getTextFileService(): ITextFileService {
	return workbench.workbenchParams.serviceCollection.get(ITextFileService) as ITextFileService;
}

function getNotificationService(): INotificationService {
	return workbench.workbenchParams.serviceCollection.get(INotificationService) as INotificationService;
}

export const initialize = async (client: Client): Promise<void> {
	window.addEventListener("contextmenu", (event) => {
		event.preventDefault();
	});

	const storageServicePromise = client.wrapTask("Set configurations", 5, async (state) => {
		const storageService = new StorageService(state.global, state.workspace);
		storageResolve(storageService);

		return storageService;
	}, client.state);

	// Set up window ID for logging. We'll also use a static logging directory
	// otherwise we'd have to get the log directory back from the currently
	// running shared process. This allows us to not wait for that. Each window
	// will still have its own logging within that directory.
	const windowId = parseInt(toLocalISOString(new Date()).replace(/[-:.TZ]/g, ""), 10);
	process.env.VSCODE_LOGS = "/tmp/vscode-logs";

	client.wrapTask("Start shared process", 5, async (api, wush, mountPath) => {
		const session = wush.execute({
			command: "bash -c 'VSCODE_ALLOW_IO=true"
				+ " AMD_ENTRYPOINT=vs/code/electron-browser/sharedProcess/sharedProcessClient"
				+ ` nice -n -17 ${nodePath} ${bootstrapForkLocation} --client'`,
		});

		const sharedProcessLogger = logger.named("shr proc");
		session.onStderr((data) => {
			sharedProcessLogger.error("stderr: " + data);
		});

		session.onDone(() => {
			workbenchPromise.then(() => {
				getNotificationService().prompt(
					Severity.Error,
					"Shared process terminated unexpectedly.",
					[{
						label: "Reload IDE",
						run: (): void => {
							window.location.reload();
						},
					}],
				);
			});
		});

		const protocol = Protocol.fromStdio({
			onMessage: (cb) => {
				session.onStdout((data) => {
					cb(Buffer.from(data as any));
				}, true);
			},
			sendMessage: (data) => {
				session.sendStdin(data);
			},
		});

		await new Promise((resolve) => {
			const listener = protocol.onMessage((message) => {
				const messageStr = message.toString();
				sharedProcessLogger.debug(messageStr);
				switch (messageStr) {
					case "handshake:hello":
						protocol.send(Buffer.from(JSON.stringify({
							// Using the mount path so if we get a new mount, it spins up a new shared
							// process since it or the builtin extensions could contain changes.
							sharedIPCHandle: `/tmp/vscode-shared${mountPath.replace(/\//g, "-")}.sock`,
							serviceUrl: api.environment.appURL("extensions-api"),
							logsDir: process.env.VSCODE_LOGS,
							nodePath,
							bootstrapForkLocation,
							args: {},
							windowId,
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

		protoResolve(protocol);
	}, client.api, client.wush, mountPromise);

	const { startup, URI } = require('vs/workbench/workbench.main');

	require("os").homedir = () => {
		// TODO: update this as well as folderURL
		return "/root";
	};
	require("path").posix = require("path");

	registerContextMenuListener();

	const workbenchPromise = client.wrapTask("Start workbench", 1000, async (workspace, mountPath) => {
		const workbenchShellPromise = startup({
			machineId: "1",
			windowId,
			logLevel: LogLevel.Info,
			mainPid: 1,
			appRoot: mountPath,
			execPath: "/tmp",
			userEnv: {},
			nodeCachedDataDir: "/tmp",
			perfEntries: [],
			_: undefined,
			folderUri: URI.file(workspace.mountUri.path),
		});

		const workbenchShell = await workbenchShellPromise;
		workbench = workbenchShell.workbench;

		const contextKeys = workbench.workbenchParams.serviceCollection.get(IContextKeyService) as IContextKeyService;
		const bounded = nativeClipboard.contextKey.bindTo(contextKeys);

		const navigatorClip = (navigator as any).clipboard;
		const navigatorPerms = (navigator as any).permissions;
		if (navigatorClip && navigatorPerms) {
			navigatorPerms.query({
				name: "clipboard-read",
			}).then((permissionStatus) => {
				const updateStatus = () => {
					if (permissionStatus.state === "denied") {
						isEnabled = false;
						clipboardEnabledEmitter.emit(false);
						bounded.set(false);
					} else {
						isEnabled = true;
						clipboardEnabledEmitter.emit(true);
						bounded.set(true);
					}
				};

				updateStatus();

				permissionStatus.onchange = () => {
					updateStatus();
				};
			});
		}

		const decorations = workbench.workbenchParams.serviceCollection.get(IDecorationsService) as IDecorationsService;
		await registerCollaboratorDecorations(client, decorations);

		return workbenchShell;
	}, client.workspace.then((w) => w.connect()), mountPromise, client.mkDirs);

	await workbenchPromise;
};
