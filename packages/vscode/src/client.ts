import { IdeClient } from "@coder/ide";
import { client as ideClientInstance } from "@coder/ide/src/fill/client";
import Severity from "vs/base/common/severity";
import { INotificationService } from "vs/platform/notification/common/notification";
import { IStatusbarService, StatusbarAlignment } from "vs/platform/statusbar/common/statusbar";
import * as paths from "./fill/paths";
import product from "./fill/product";
import "./vscode.scss";
import { MenuId, MenuRegistry } from "vs/platform/actions/common/actions";
import { CommandsRegistry } from "vs/platform/commands/common/commands";
import { IFileService, FileOperation } from "vs/platform/files/common/files";
import { ITextFileService } from "vs/workbench/services/textfile/common/textfiles";
import { IModelService } from "vs/editor/common/services/modelService";
import { ITerminalService } from "vs/workbench/contrib/terminal/common/terminal";
import { IStorageService } from "vs/platform/storage/common/storage";
// NOTE: shouldn't import anything from VS Code here or anything that will
// depend on a synchronous fill like `os`.

class VSClient extends IdeClient {
	protected initialize(): Promise<void> {
		return this.task("Start workbench", 1000, async (data, sharedData) => {
			paths._paths.initialize(data, sharedData);
			product.initialize(data);
			process.env.SHELL = data.shell;
			// At this point everything should be filled, including `os`. `os` also
			// relies on `initData` but it listens first so it initialize before this
			// callback, meaning we are safe to include everything from VS Code now.
			const { workbench } = require("./workbench") as typeof import("./workbench");
			await workbench.initialize();

			// tslint:disable-next-line:no-any
			const getService = <T>(id: any): T => workbench.serviceCollection.get<T>(id) as T;
			window.ide = {
				client: ideClientInstance,
				workbench: {
					commandRegistry: CommandsRegistry,
					// tslint:disable-next-line:no-any
					menuRegistry: MenuRegistry as any,
					// tslint:disable-next-line:no-any
					statusbarService: getService<IStatusbarService>(IStatusbarService) as any,
					notificationService: getService<INotificationService>(INotificationService),
					storageService: {
						save: (): Promise<void> => {
							// tslint:disable-next-line:no-any
							const storageService = getService<IStorageService>(IStorageService) as any;

							return storageService.close();
						},
					},

					onFileCreate: (cb): void => {
						getService<IFileService>(IFileService).onAfterOperation((e) => {
							if (e.operation === FileOperation.CREATE) {
								cb(e.resource.path);
							}
						});
					},
					onFileMove: (cb): void => {
						getService<IFileService>(IFileService).onAfterOperation((e) => {
							if (e.operation === FileOperation.MOVE) {
								cb(e.resource.path, e.target ? e.target.resource.path : undefined!);
							}
						});
					},
					onFileDelete: (cb): void => {
						getService<IFileService>(IFileService).onAfterOperation((e) => {
							if (e.operation === FileOperation.DELETE) {
								cb(e.resource.path);
							}
						});
					},
					onFileSaved: (cb): void => {
						getService<ITextFileService>(ITextFileService).models.onModelSaved((e) => {
							cb(e.resource.path);
						});
					},
					onFileCopy: (cb): void => {
						getService<IFileService>(IFileService).onAfterOperation((e) => {
							if (e.operation === FileOperation.COPY) {
								cb(e.resource.path, e.target ? e.target.resource.path : undefined!);
							}
						});
					},

					onModelAdded: (cb): void => {
						getService<IModelService>(IModelService).onModelAdded((e) => {
							cb(e.uri.path, e.getLanguageIdentifier().language);
						});
					},
					onModelRemoved: (cb): void => {
						getService<IModelService>(IModelService).onModelRemoved((e) => {
							cb(e.uri.path, e.getLanguageIdentifier().language);
						});
					},
					onModelLanguageChange: (cb): void => {
						getService<IModelService>(IModelService).onModelModeChanged((e) => {
							cb(e.model.uri.path, e.model.getLanguageIdentifier().language, e.oldModeId);
						});
					},

					onTerminalAdded: (cb): void => {
						getService<ITerminalService>(ITerminalService).onInstanceCreated(() => cb());
					},
					onTerminalRemoved: (cb): void => {
						getService<ITerminalService>(ITerminalService).onInstanceDisposed(() => cb());
					},
				},

				// @ts-ignore
				// tslint:disable-next-line:no-any
				MenuId: MenuId as any,
				// tslint:disable-next-line:no-any
				Severity: Severity as any,
				// @ts-ignore
				// tslint:disable-next-line:no-any
				StatusbarAlignment: StatusbarAlignment as any,
			};

			const event = new CustomEvent("ide-ready");
			// tslint:disable-next-line:no-any
			(<any>event).ide = window.ide;
			window.dispatchEvent(event);
		}, this.initData, this.sharedProcessData);
	}
}

export const client = new VSClient();
