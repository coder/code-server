declare namespace coder {
	export interface IDisposable {
		dispose(): void;
	}
	export interface Disposer extends IDisposable {
		onDidDispose: (cb: () => void) => void;
	}
	export interface Event<T> {
		(listener: (e: T) => any, thisArgs?: any, disposables?: IDisposable[]): IDisposable;
	}

	export interface IStatusbarEntry {
		readonly text: string;
		readonly tooltip?: string;
		readonly color?: string;
		readonly command?: string;
		readonly arguments?: any[];
		readonly showBeak?: boolean;
	}
	export interface IStatusbarService {
		addEntry(entry: IStatusbarEntry, alignment: StatusbarAlignment, priority?: number): IDisposable;
		setStatusMessage(message: string, autoDisposeAfter?: number, delayBy?: number): IDisposable;
	}

	export interface IAction extends IDisposable {
		id: string;
		label: string;
		tooltip: string;
		class: string | undefined;
		enabled: boolean;
		checked: boolean;
		radio: boolean;
		run(event?: any): Promise<any>;
	}
	export type NotificationMessage = string | Error;
	export interface INotificationProperties {
		sticky?: boolean;
		silent?: boolean;
	}

	export interface INotificationActions {
		primary?: IAction[];
		secondary?: IAction[];
	}

	export interface INotificationProgress {
		infinite(): void;
		total(value: number): void;
		worked(value: number): void;
		done(): void;
	}

	export interface IPromptChoice {
		label: string;
		isSecondary?: boolean;
		keepOpen?: boolean;
		run: () => void;
	}

	export interface IPromptOptions extends INotificationProperties {
		onCancel?: () => void;
	}

	export interface ISerializableCommandAction extends IBaseCommandAction {
		// iconLocation?: { dark: UriComponents; light?: UriComponents; };
	}

	export interface IMenuItem {
		command: ICommandAction;
		alt?: ICommandAction;
		// when?: ContextKeyExpr;
		group?: "navigation" | string;
		order?: number;
	}
	export interface IMenuRegistry {
		appendMenuItem(menu: MenuId, item: IMenuItem): IDisposable;
	}

	export interface IBaseCommandAction {
		id: string;
		title: string;
		category?: string;
	}
	export interface ICommandAction extends IBaseCommandAction {
		// iconLocation?: { dark: URI; light?: URI; };
		// precondition?: ContextKeyExpr;
		// toggled?: ContextKeyExpr;
	}
	export interface ICommandHandler {
		(accessor: any, ...args: any[]): void;
	}
	export interface ICommand {
		id: string;
		handler: ICommandHandler;
		description?: ICommandHandlerDescription | null;
	}
	export interface ICommandHandlerDescription {
		description: string;
		args: { name: string; description?: string; }[];
		returns?: string;
	}
	export interface ICommandRegistry {
		registerCommand(command: ICommand): IDisposable;
	}

	export interface INotification extends INotificationProperties {
		severity: Severity;
		message: NotificationMessage;
		source?: string;
		actions?: INotificationActions;
	}
	export interface INotificationHandle {
		readonly onDidClose: Event<void>;
		readonly progress: INotificationProgress;
		updateSeverity(severity: Severity): void;
		updateMessage(message: NotificationMessage): void;
		updateActions(actions?: INotificationActions): void;
		close(): void;
	}
	export interface INotificationService {
		notify(notification: INotification): INotificationHandle;
		info(message: NotificationMessage | NotificationMessage[]): void;
		warn(message: NotificationMessage | NotificationMessage[]): void;
		error(message: NotificationMessage | NotificationMessage[]): void;
		prompt(severity: Severity, message: string, choices: IPromptChoice[], options?: IPromptOptions): INotificationHandle;
	}

	export namespace client {}

	export namespace workbench {
		// TODO: these types won't actually be included in the package if we try to
		//       import them. We'll need to recreate them.
		export const action: any; // import { Action } from "vs/base/common/actions";
		export const syncActionDescriptor: any; // import { SyncActionDescriptor } from "vs/platform/actions/common/actions";
		export const statusbarService: IStatusbarService;
		export const actionsRegistry: any; // import { IWorkbenchActionRegistry } from "vs/workbench/common/actions";
		export const notificationService: INotificationService;
		export const menuRegistry: IMenuRegistry;
		export const commandRegistry: ICommandRegistry;
		export const terminalService: any; // import { ITerminalService } from "vs/workbench/contrib/terminal/common/terminal";

		export const registerView: (viewId: string, viewName: string, containerId: string, containerName: string, icon: string) => void;

		export const onFileCreate: (cb: (path: string) => void) => void;
		export const onFileMove: (cb: (path: string, target: string) => void) => void;
		export const onFileDelete: (cb: (path: string) => void) => void;
		export const onFileSaved: (cb: (path: string) => void) => void;
		export const onFileCopy: (cb: (path: string, target: string) => void) => void;

		export const onModelAdded: (cb: (path: string, languageId: string) => void) => void;
		export const onModelRemoved: (cb: (path: string, languageId: string) => void) => void;
		export const onModelLanguageChange: (cb: (path: string, languageId: string, oldLanguageId: string) => void) => void;

		export const onTerminalAdded: (cb: () => void) => void;
		export const onTerminalRemoved: (cb: () => void) => void;
	}

	export enum Severity {
		Ignore = 0,
		Info = 1,
		Warning = 2,
		Error = 3,
	}

	export enum StatusbarAlignment {
		LEFT, RIGHT,
	}

	export enum MenuId {
		CommandPalette,
		DebugBreakpointsContext,
		DebugCallStackContext,
		DebugConsoleContext,
		DebugVariablesContext,
		DebugWatchContext,
		DebugToolBar,
		EditorContext,
		EditorTitle,
		EditorTitleContext,
		EmptyEditorGroupContext,
		ExplorerContext,
		MenubarAppearanceMenu,
		MenubarDebugMenu,
		MenubarEditMenu,
		MenubarFileMenu,
		MenubarGoMenu,
		MenubarHelpMenu,
		MenubarLayoutMenu,
		MenubarNewBreakpointMenu,
		MenubarPreferencesMenu,
		MenubarRecentMenu,
		MenubarSelectionMenu,
		MenubarSwitchEditorMenu,
		MenubarSwitchGroupMenu,
		MenubarTerminalMenu,
		MenubarViewMenu,
		OpenEditorsContext,
		ProblemsPanelContext,
		SCMChangeContext,
		SCMResourceContext,
		SCMResourceGroupContext,
		SCMSourceControl,
		SCMTitle,
		SearchContext,
		StatusBarWindowIndicatorMenu,
		TouchBarContext,
		ViewItemContext,
		ViewTitle,
	}
}
