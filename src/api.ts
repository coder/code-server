import * as vscode from "vscode";

import { localize } from "vs/nls";
import { SyncActionDescriptor } from "vs/platform/actions/common/actions";
import { Registry } from "vs/platform/registry/common/platform";
import { IWorkbenchActionRegistry, Extensions as ActionExtensions} from "vs/workbench/common/actions";
import { CommandsRegistry, ICommandService } from "vs/platform/commands/common/commands";
import { IStat, IWatchOptions, FileOverwriteOptions, FileDeleteOptions, FileOpenOptions, IFileChange, FileWriteOptions, FileSystemProviderCapabilities, IFileService, FileType, IFileSystemProvider } from "vs/platform/files/common/files";
import { IStorageService } from "vs/platform/storage/common/storage";
import { ServiceCollection } from "vs/platform/instantiation/common/serviceCollection";
import { INotificationService } from "vs/platform/notification/common/notification";
import { Emitter, Event } from "vs/base/common/event";
import * as extHostTypes from "vs/workbench/api/common/extHostTypes";
import { ServiceIdentifier, IInstantiationService } from "vs/platform/instantiation/common/instantiation";
import { URI } from "vs/base/common/uri";
import { ITreeItem, ITreeViewDataProvider, IViewsRegistry, ITreeViewDescriptor, Extensions as ViewsExtensions, IViewContainersRegistry, TreeItemCollapsibleState } from "vs/workbench/common/views";
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
import { generateUuid } from "vs/base/common/uuid";

/**
 * Client-side implementation of VS Code's API.
 * TODO: Views aren't quite working.
 * TODO: Implement menu items for views (for item actions).
 * TODO: File system provider doesn't work.
 */
export const vscodeApi = (serviceCollection: ServiceCollection): Partial<typeof vscode> => {
	const getService = <T>(id: ServiceIdentifier<T>): T => serviceCollection.get<T>(id) as T;
	const commandService = getService(ICommandService);
	const notificationService = getService(INotificationService);
	const fileService = getService(IFileService);
	const viewsRegistry = Registry.as<IViewsRegistry>(ViewsExtensions.ViewsRegistry);

	// It would be nice to just export what VS Code creates but it looks to me
	// that it assumes it's running in the extension host and wouldn't work here.
	// It is probably possible to create an extension host that runs in the
	// browser's main thread, but I'm not sure how much jank that would require.
	// We could have a web worker host but we want DOM access.
	return {
		EventEmitter: Emitter,
		TreeItemCollapsibleState: extHostTypes.TreeItemCollapsibleState,
		FileSystemError: extHostTypes.FileSystemError,
		FileType: FileType,
		Uri: URI,
		commands: {
			executeCommand: <T = any>(commandId: string, ...args: any[]): Promise<T | undefined> => {
				return commandService.executeCommand(commandId, ...args);
			},
			registerCommand: (id: string, command: (...args: any[]) => any): IDisposable => {
				return CommandsRegistry.registerCommand(id, command);
			},
		} as Partial<typeof vscode.commands>,
		window: {
			registerTreeDataProvider: <T>(id: string, dataProvider: vscode.TreeDataProvider<T>): IDisposable => {
				const tree = new TreeViewDataProvider(dataProvider);
				const view = viewsRegistry.getView(id);
				(view as ITreeViewDescriptor).treeView.dataProvider = tree;
				return {
					dispose: () => tree.dispose(),
				};
			},
			showErrorMessage: async (message: string): Promise<string | undefined> => {
				notificationService.error(message);
				return undefined;
			},
		} as Partial<typeof vscode.window>,
		workspace: {
			registerFileSystemProvider: (scheme: string, provider: vscode.FileSystemProvider): IDisposable => {
				return fileService.registerProvider(scheme, new FileSystemProvider(provider));
			},
		} as Partial<typeof vscode.workspace>,
	} as Partial<typeof vscode>; // Without this it complains that the type isn't `| undefined`.
};

/**
 * Coder API. This should only provide functionality that can't be made
 * available through the VS Code API.
 */
export const coderApi = (serviceCollection: ServiceCollection): typeof coder => {
	const getService = <T>(id: ServiceIdentifier<T>): T => serviceCollection.get<T>(id) as T;
	return {
		registerView: (viewId, viewName, containerId, containerName, icon): void =>  {
			const cssClass = `extensionViewlet-${containerId}`;
			const id = `workbench.view.extension.${containerId}`;
			class CustomViewlet extends ViewContainerViewlet {
				public constructor(
					@IConfigurationService configurationService: IConfigurationService,
					@IWorkbenchLayoutService layoutService: IWorkbenchLayoutService,
					@ITelemetryService telemetryService: ITelemetryService,
					@IWorkspaceContextService contextService: IWorkspaceContextService,
					@IStorageService storageService: IStorageService,
					@IEditorService _editorService: IEditorService,
					@IInstantiationService instantiationService: IInstantiationService,
					@IThemeService themeService: IThemeService,
					@IContextMenuService contextMenuService: IContextMenuService,
					@IExtensionService extensionService: IExtensionService,
				) {
					super(id, `${id}.state`, true, configurationService, layoutService, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService);
				}
			}

			Registry.as<ViewletRegistry>(ViewletExtensions.Viewlets).registerViewlet(
				new ViewletDescriptor(CustomViewlet as any, id, containerName, cssClass, undefined, URI.parse(icon)),
			);

			Registry.as<IWorkbenchActionRegistry>(ActionExtensions.WorkbenchActions).registerWorkbenchAction(
				new SyncActionDescriptor(OpenCustomViewletAction as any, id, localize("showViewlet", "Show {0}", containerName)),
				"View: Show {0}",
				localize("view", "View"),
			);

			// Generate CSS to show the icon in the activity bar.
			const iconClass = `.monaco-workbench .activitybar .monaco-action-bar .action-label.${cssClass}`;
			createCSSRule(iconClass, `-webkit-mask: url('${icon}') no-repeat 50% 50%`);

			const container = Registry.as<IViewContainersRegistry>(ViewsExtensions.ViewContainersRegistry).registerViewContainer(containerId);
			Registry.as<IViewsRegistry>(ViewsExtensions.ViewsRegistry).registerViews([{
				id: viewId,
				name: viewName,
				ctorDescriptor: { ctor: CustomTreeViewPanel },
				treeView: getService(IInstantiationService).createInstance(CustomTreeView as any, viewId, container),
			}] as ITreeViewDescriptor[], container);
		},
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

	public constructor(private readonly provider: vscode.FileSystemProvider) {
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

class TreeViewDataProvider<T> implements ITreeViewDataProvider {
	private readonly root = Symbol("root");
	private readonly values = new Map<string, T>();
	private readonly children = new Map<T | Symbol, ITreeItem[]>();

	public constructor(private readonly provider: vscode.TreeDataProvider<T>) {}

	public async getChildren(item?: ITreeItem): Promise<ITreeItem[]> {
		const value = item && this.itemToValue(item);
		const children = await Promise.all(
			(await this.provider.getChildren(value) || [])
				.map(async (childValue) => {
					const treeItem = await this.provider.getTreeItem(childValue);
					const handle = this.createHandle(treeItem);
					this.values.set(handle, childValue);
					return {
						handle,
						collapsibleState: TreeItemCollapsibleState.Collapsed,
					};
				})
		);

		this.clear(value || this.root, item);
		this.children.set(value || this.root, children);

		return children;
	}

	public dispose(): void {
		throw new Error("not implemented");
	}

	private itemToValue(item: ITreeItem): T {
		if (!this.values.has(item.handle)) {
			throw new Error(`No element found with handle ${item.handle}`);
		}
		return this.values.get(item.handle)!;
	}

	private clear(value: T | Symbol, item?: ITreeItem): void {
		if (this.children.has(value)) {
			this.children.get(value)!.map((c) => this.clear(this.itemToValue(c), c));
			this.children.delete(value);
		}
		if (item) {
			this.values.delete(item.handle);
		}
	}

	private createHandle(item: vscode.TreeItem): string {
		return item.id
			? `coder-tree-item-id/${item.id}`
			: `coder-tree-item-uuid/${generateUuid()}`;
	}
}
