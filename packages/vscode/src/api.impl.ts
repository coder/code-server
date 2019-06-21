import { vscode, ide } from "@coder/ide-api";

import { localize } from "vs/nls";
import { Action } from "vs/base/common/actions";
import { SyncActionDescriptor, MenuRegistry, MenuId } from "vs/platform/actions/common/actions";
import { Registry } from "vs/platform/registry/common/platform";
import { IWorkbenchActionRegistry, Extensions as ActionExtensions} from "vs/workbench/common/actions";
import { CommandsRegistry, ICommandService } from "vs/platform/commands/common/commands";
import { IStat, IWatchOptions, FileOverwriteOptions, FileDeleteOptions, FileOpenOptions, IFileChange, FileWriteOptions, FileSystemProviderCapabilities, IFileService, FileType, FileOperation, IFileSystemProvider } from "vs/platform/files/common/files";
import { ITextFileService } from "vs/workbench/services/textfile/common/textfiles";
import { IModelService } from "vs/editor/common/services/modelService";
import { ITerminalService } from "vs/workbench/contrib/terminal/common/terminal";
import { IStorageService } from "vs/platform/storage/common/storage";
import { ServiceCollection } from "vs/platform/instantiation/common/serviceCollection";
import { INotificationService } from "vs/platform/notification/common/notification";
import { IStatusbarService, StatusbarAlignment } from "vs/platform/statusbar/common/statusbar";
import Severity from "vs/base/common/severity";
import { Emitter, Event } from "vs/base/common/event";
import * as extHostTypes from "vs/workbench/api/node/extHostTypes";
import { ServiceIdentifier, IInstantiationService } from "vs/platform/instantiation/common/instantiation";
import { URI } from "vs/base/common/uri";
import { ITreeViewDataProvider, IViewsRegistry, ITreeViewDescriptor, Extensions as ViewsExtensions, IViewContainersRegistry } from "vs/workbench/common/views";
import { CustomTreeViewPanel, CustomTreeView } from "vs/workbench/browser/parts/views/customView";
import { ViewletRegistry, Extensions as ViewletExtensions, ViewletDescriptor, ShowViewletAction } from "vs/workbench/browser/viewlet";
import { IExtensionService } from "vs/workbench/services/extensions/common/extensions";
import { ViewContainerViewlet } from "vs/workbench/browser/parts/views/viewsViewlet";
import { IConfigurationService } from "vs/platform/configuration/common/configuration";
import { IWorkbenchLayoutService } from "vs/workbench/services/layout/browser/layoutService";
import { ITelemetryService } from "vs/platform/telemetry/common/telemetry";
import { IWorkspaceContextService } from "vs/platform/workspace/common/workspace";
import { IEditorService } from "vs/workbench/services/editor/common/editorService";
import { IThemeService } from "vs/platform/theme/common/themeService";
import { IContextMenuService } from "vs/platform/contextview/browser/contextView";
import { IViewletService } from "vs/workbench/services/viewlet/browser/viewlet";
import { IEditorGroupsService } from "vs/workbench/services/editor/common/editorGroupsService";
import { createCSSRule } from "vs/base/browser/dom";
import { IDisposable } from "vs/base/common/lifecycle";

// tslint:disable no-any
// tslint:disable completed-docs

/**
 * Client-side implementation of VS Code's API.
 */
export const vscodeApi = (serviceCollection: ServiceCollection): typeof vscode => {
	const getService = <T>(id: ServiceIdentifier<T>): T => serviceCollection.get<T>(id) as T;
	const commandService = getService(ICommandService);
	const notificationService = getService(INotificationService);
	const fileService = getService(IFileService);
	const viewsRegistry = Registry.as<IViewsRegistry>(ViewsExtensions.ViewsRegistry);

	// It would be nice to just export what VS Code creates but it looks to me
	// that it assumes it's running in the extension host and wouldn't work here.
	// It is probably possible to create an extension host that runs in the
	// browser's main thread, but I'm not sure how much jank that would require.
	return {
		EventEmitter: Emitter,
		TreeItemCollapsibleState: extHostTypes.TreeItemCollapsibleState,
		FileSystemError: extHostTypes.FileSystemError,
		FileType: FileType,
		Uri: URI,

		commands: {
			executeCommand: (commandId: string, ...args: any[]): any => {
				return commandService.executeCommand(commandId, ...args);
			},
			registerCommand: (id: string, command: () => void): any => {
				return CommandsRegistry.registerCommand(id, command);
			},
		},

		window: {
			registerTreeDataProvider: (id: string, dataProvider: ITreeViewDataProvider): void => {
				const view = viewsRegistry.getView(id);
				if (view) {
					(view as ITreeViewDescriptor).treeView.dataProvider = dataProvider;
				}
			},
			showErrorMessage: (message: string): void => {
				notificationService.error(message);
			},
		},

		workspace: {
			registerFileSystemProvider: (scheme: string, provider: vscode.FileSystemProvider): IDisposable => {
				return fileService.registerProvider(scheme, new FileSystemProvider(provider));
			},
		},
	} as any;
};

/**
 * Coder API.
 */
export const coderApi = (serviceCollection: ServiceCollection): typeof ide => {
	const getService = <T>(id: ServiceIdentifier<T>): T => serviceCollection.get<T>(id) as T;

	return {
		workbench: {
			action: Action,
			syncActionDescriptor: SyncActionDescriptor,
			commandRegistry: CommandsRegistry,
			actionsRegistry: Registry.as<IWorkbenchActionRegistry>(ActionExtensions.WorkbenchActions),
			registerView: (viewId, viewName, containerId, containerName, icon): void =>  {
				const viewContainersRegistry = Registry.as<IViewContainersRegistry>(ViewsExtensions.ViewContainersRegistry);
				const viewsRegistry = Registry.as<IViewsRegistry>(ViewsExtensions.ViewsRegistry);
				const container = viewContainersRegistry.registerViewContainer(containerId);

				const cssClass = `extensionViewlet-${containerId}`;
				const id = `workbench.view.extension.${containerId}`;

				class CustomViewlet extends ViewContainerViewlet {
					public constructor(
						@IConfigurationService configurationService: IConfigurationService,
						@IWorkbenchLayoutService layoutService: IWorkbenchLayoutService,
						@ITelemetryService telemetryService: ITelemetryService,
						@IWorkspaceContextService contextService: IWorkspaceContextService,
						@IStorageService storageService: IStorageService,
						@IEditorService editorService: IEditorService,
						@IInstantiationService instantiationService: IInstantiationService,
						@IThemeService themeService: IThemeService,
						@IContextMenuService contextMenuService: IContextMenuService,
						@IExtensionService extensionService: IExtensionService,
					) {
						super(id, `${id}.state`, true, configurationService, layoutService, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService);
					}
				}

				const viewletDescriptor = new ViewletDescriptor(
					CustomViewlet as any,
					id,
					containerName,
					cssClass,
					undefined,
					URI.parse(icon),
				);

				Registry.as<ViewletRegistry>(ViewletExtensions.Viewlets).registerViewlet(viewletDescriptor);

				const registry = Registry.as<IWorkbenchActionRegistry>(ActionExtensions.WorkbenchActions);
				registry.registerWorkbenchAction(
					new SyncActionDescriptor(OpenCustomViewletAction as any, id, localize("showViewlet", "Show {0}", containerName)),
					"View: Show {0}",
					localize("view", "View"),
				);

				// Generate CSS to show the icon in the activity bar
				const iconClass = `.monaco-workbench .activitybar .monaco-action-bar .action-label.${cssClass}`;
				createCSSRule(iconClass, `-webkit-mask: url('${icon}') no-repeat 50% 50%`);

				const views = [{
					id: viewId,
					name: viewName,
					ctorDescriptor: { ctor: CustomTreeViewPanel },
					treeView: getService(IInstantiationService).createInstance(CustomTreeView as any, viewId, container),
				}] as  ITreeViewDescriptor[];
				viewsRegistry.registerViews(views, container);
			},
			// Even though the enums are exactly the same, Typescript says they are
			// not assignable to each other, so use `any`. I don't know if there is a
			// way around this.
			menuRegistry: MenuRegistry as any,
			statusbarService: getService(IStatusbarService) as any,
			notificationService: getService(INotificationService),
			terminalService: getService(ITerminalService),
			storageService: {
				save: (): Promise<void> => {
					const storageService = getService(IStorageService) as any;

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
		MenuId: MenuId,
		Severity: Severity,
		// @ts-ignore
		StatusbarAlignment: StatusbarAlignment,
	};
};

class OpenCustomViewletAction extends ShowViewletAction {
	public constructor(
		id: string, label: string,
		@IViewletService viewletService: IViewletService,
		@IEditorGroupsService editorGroupService: IEditorGroupsService,
		@IWorkbenchLayoutService layoutService: IWorkbenchLayoutService,
	) {
		super(id, label, id, viewletService, editorGroupService, layoutService);
	}
}

class FileSystemProvider implements IFileSystemProvider {
	private readonly _onDidChange = new Emitter<IFileChange[]>();

	public readonly onDidChangeFile: Event<IFileChange[]> = this._onDidChange.event;

	public readonly capabilities: FileSystemProviderCapabilities;
	public readonly onDidChangeCapabilities: Event<void> = Event.None;

	public constructor(
		private readonly provider: vscode.FileSystemProvider,
	) {
		this.capabilities = FileSystemProviderCapabilities.Readonly;
	}

	public watch(resource: URI, opts: IWatchOptions): IDisposable {
		return this.provider.watch(resource, opts);
	}

	public async stat(resource: URI): Promise<IStat> {
		return this.provider.stat(resource);
	}

	public async readFile(resource: URI): Promise<Uint8Array> {
		return this.provider.readFile(resource);
	}

	public async writeFile(resource: URI, content: Uint8Array, opts: FileWriteOptions): Promise<void> {
		return this.provider.writeFile(resource, content, opts);
	}

	public async delete(resource: URI, opts: FileDeleteOptions): Promise<void> {
		return this.provider.delete(resource, opts);
	}

	public mkdir(_resource: URI): Promise<void> {
		throw new Error("not implemented");
	}

	public async readdir(resource: URI): Promise<[string, FileType][]> {
		return this.provider.readDirectory(resource);
	}

	public async rename(resource: URI, target: URI, opts: FileOverwriteOptions): Promise<void> {
		return this.provider.rename(resource, target, opts);
	}

	public async copy(resource: URI, target: URI, opts: FileOverwriteOptions): Promise<void> {
		return this.provider.copy!(resource, target, opts);
	}

	public open(_resource: URI, _opts: FileOpenOptions): Promise<number> {
		throw new Error("not implemented");
	}

	public close(_fd: number): Promise<void> {
		throw new Error("not implemented");
	}

	public read(_fd: number, _pos: number, _data: Uint8Array, _offset: number, _length: number): Promise<number> {
		throw new Error("not implemented");
	}

	public write(_fd: number, _pos: number, _data: Uint8Array, _offset: number, _length: number): Promise<number> {
		throw new Error("not implemented");
	}
}
