import * as vscode from "vscode";
import { CoderApi, VSCodeApi } from "../../typings/api";
import { createCSSRule } from "vs/base/browser/dom";
import { Emitter, Event } from "vs/base/common/event";
import { IDisposable } from "vs/base/common/lifecycle";
import { URI } from "vs/base/common/uri";
import { generateUuid } from "vs/base/common/uuid";
import { localize } from "vs/nls";
import { SyncActionDescriptor } from "vs/platform/actions/common/actions";
import { CommandsRegistry, ICommandService } from "vs/platform/commands/common/commands";
import { IConfigurationService } from "vs/platform/configuration/common/configuration";
import { IContextMenuService } from "vs/platform/contextview/browser/contextView";
import { FileDeleteOptions, FileOpenOptions, FileOverwriteOptions, FileSystemProviderCapabilities, FileType, FileWriteOptions, IFileChange, IFileService, IFileSystemProvider, IStat, IWatchOptions } from "vs/platform/files/common/files";
import { IInstantiationService, ServiceIdentifier } from "vs/platform/instantiation/common/instantiation";
import { ServiceCollection } from "vs/platform/instantiation/common/serviceCollection";
import { INotificationService } from "vs/platform/notification/common/notification";
import { Registry } from "vs/platform/registry/common/platform";
import { IStatusbarEntry, IStatusbarEntryAccessor, IStatusbarService, StatusbarAlignment } from "vs/workbench/services/statusbar/common/statusbar";
import { IStorageService } from "vs/platform/storage/common/storage";
import { ITelemetryService } from "vs/platform/telemetry/common/telemetry";
import { IThemeService } from "vs/platform/theme/common/themeService";
import { IWorkspaceContextService } from "vs/platform/workspace/common/workspace";
import * as extHostTypes from "vs/workbench/api/common/extHostTypes";
import { CustomTreeView, CustomTreeViewPanel } from "vs/workbench/browser/parts/views/customView";
import { ViewContainerViewlet } from "vs/workbench/browser/parts/views/viewsViewlet";
import { Extensions as ViewletExtensions, ShowViewletAction, ViewletDescriptor, ViewletRegistry } from "vs/workbench/browser/viewlet";
import { Extensions as ActionExtensions, IWorkbenchActionRegistry } from "vs/workbench/common/actions";
import { Extensions as ViewsExtensions, ITreeItem, ITreeViewDataProvider, ITreeViewDescriptor, IViewContainersRegistry, IViewsRegistry, TreeItemCollapsibleState } from "vs/workbench/common/views";
import { IEditorGroupsService } from "vs/workbench/services/editor/common/editorGroupsService";
import { IEditorService } from "vs/workbench/services/editor/common/editorService";
import { IExtensionService } from "vs/workbench/services/extensions/common/extensions";
import { IWorkbenchLayoutService } from "vs/workbench/services/layout/browser/layoutService";
import { IViewletService } from "vs/workbench/services/viewlet/browser/viewlet";

/**
 * Client-side implementation of VS Code's API.
 * TODO: Views aren't quite working.
 * TODO: Implement menu items for views (for item actions).
 * TODO: File system provider doesn't work.
 */
export const vscodeApi = (serviceCollection: ServiceCollection): VSCodeApi => {
	const getService = <T>(id: ServiceIdentifier<T>): T => serviceCollection.get<T>(id) as T;
	const commandService = getService(ICommandService);
	const notificationService = getService(INotificationService);
	const fileService = getService(IFileService);
	const viewsRegistry = Registry.as<IViewsRegistry>(ViewsExtensions.ViewsRegistry);
	const statusbarService = getService(IStatusbarService);

	// It would be nice to just export what VS Code creates but it looks to me
	// that it assumes it's running in the extension host and wouldn't work here.
	// It is probably possible to create an extension host that runs in the
	// browser's main thread, but I'm not sure how much jank that would require.
	// We could have a web worker host but we want DOM access.
	return {
		EventEmitter: <any>Emitter, // It can take T so T | undefined should work.
		FileSystemError: extHostTypes.FileSystemError,
		FileType,
		StatusBarAlignment: extHostTypes.StatusBarAlignment,
		ThemeColor: extHostTypes.ThemeColor,
		TreeItemCollapsibleState: extHostTypes.TreeItemCollapsibleState,
		Uri: URI,
		commands: {
			executeCommand: <T = any>(commandId: string, ...args: any[]): Promise<T | undefined> => {
				return commandService.executeCommand(commandId, ...args);
			},
			registerCommand: (id: string, command: (...args: any[]) => any): IDisposable => {
				return CommandsRegistry.registerCommand(id, command);
			},
		},
		window: {
			createStatusBarItem(alignmentOrOptions?: extHostTypes.StatusBarAlignment | vscode.window.StatusBarItemOptions, priority?: number): StatusBarEntry {
				return new StatusBarEntry(statusbarService, alignmentOrOptions, priority);
			},
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
		},
		workspace: {
			registerFileSystemProvider: (scheme: string, provider: vscode.FileSystemProvider): IDisposable => {
				return fileService.registerProvider(scheme, new FileSystemProvider(provider));
			},
		},
	};
};

/**
 * Coder API. This should only provide functionality that can't be made
 * available through the VS Code API.
 */
export const coderApi = (serviceCollection: ServiceCollection): CoderApi => {
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

interface IStatusBarEntry extends IStatusbarEntry {
	alignment: StatusbarAlignment;
	priority?: number;
}

class StatusBarEntry implements vscode.StatusBarItem {
	private static ID = 0;

	private _id: number;
	private entry: IStatusBarEntry;
	private visible: boolean;
	private disposed: boolean;
	private statusId: string;
	private statusName: string;
	private accessor?: IStatusbarEntryAccessor;
	private timeout: any;

	constructor(private readonly statusbarService: IStatusbarService, alignmentOrOptions?: extHostTypes.StatusBarAlignment | vscode.window.StatusBarItemOptions, priority?: number) {
		this._id = StatusBarEntry.ID--;
		if (alignmentOrOptions && typeof alignmentOrOptions !== "number") {
			this.statusId = alignmentOrOptions.id;
			this.statusName = alignmentOrOptions.name;
			this.entry = {
				alignment: alignmentOrOptions.alignment === extHostTypes.StatusBarAlignment.Right
					? StatusbarAlignment.RIGHT : StatusbarAlignment.LEFT,
				priority,
				text: "",
			};
		} else {
			this.statusId = "web-api";
			this.statusName = "Web API";
			this.entry = {
				alignment: alignmentOrOptions === extHostTypes.StatusBarAlignment.Right
					? StatusbarAlignment.RIGHT : StatusbarAlignment.LEFT,
				priority,
				text: "",
			};
		}
	}

	public get alignment(): extHostTypes.StatusBarAlignment {
		return this.entry.alignment === StatusbarAlignment.RIGHT
			? extHostTypes.StatusBarAlignment.Right : extHostTypes.StatusBarAlignment.Left;
	}

	public get id(): number { return this._id; }
	public get priority(): number | undefined { return this.entry.priority; }
	public get text(): string { return this.entry.text; }
	public get tooltip(): string | undefined { return this.entry.tooltip; }
	public get color(): string | extHostTypes.ThemeColor | undefined { return this.entry.color; }
	public get command(): string | undefined { return this.entry.command; }

	public set text(text: string) { this.update({ text }); }
	public set tooltip(tooltip: string | undefined) { this.update({ tooltip }); }
	public set color(color: string | extHostTypes.ThemeColor | undefined) { this.update({ color }); }
	public set command(command: string | undefined) { this.update({ command }); }

	public show(): void {
		this.visible = true;
		this.update();
	}

	public hide(): void {
		clearTimeout(this.timeout);
		this.visible = false;
		if (this.accessor) {
			this.accessor.dispose();
			this.accessor = undefined;
		}
	}

	private update(values?: Partial<IStatusBarEntry>): void {
		this.entry = { ...this.entry, ...values };
		if (this.disposed || !this.visible) {
			return;
		}
		clearTimeout(this.timeout);
		this.timeout = setTimeout(() => {
			if (!this.accessor) {
				this.accessor = this.statusbarService.addEntry(this.entry, this.statusId, this.statusName, this.entry.alignment, this.priority);
			} else {
				this.accessor.update(this.entry);
			}
		}, 0);
	}

	public dispose(): void {
		this.hide();
		this.disposed = true;
	}
}
