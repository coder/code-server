import * as vscode from "vscode";

// Only export the subset of VS Code we have implemented.
export interface VSCodeApi {
	EventEmitter: typeof vscode.EventEmitter;
	FileSystemError: typeof vscode.FileSystemError;
	FileType: typeof vscode.FileType;
	StatusBarAlignment: typeof vscode.StatusBarAlignment;
	ThemeColor: typeof vscode.ThemeColor;
	TreeItemCollapsibleState: typeof vscode.TreeItemCollapsibleState;
	Uri: typeof vscode.Uri;
	commands: {
		executeCommand: typeof vscode.commands.executeCommand;
		registerCommand: typeof vscode.commands.registerCommand;
	};
	window: {
		createStatusBarItem: typeof vscode.window.createStatusBarItem;
		registerTreeDataProvider: typeof vscode.window.registerTreeDataProvider;
		showErrorMessage: typeof vscode.window.showErrorMessage;
	};
	workspace: {
		registerFileSystemProvider: typeof vscode.workspace.registerFileSystemProvider;
	};
}

export interface CoderApi {
	registerView: (viewId: string, viewName: string, containerId: string, containerName: string, icon: string) => void;
}

export interface IdeReadyEvent extends CustomEvent<void> {
	readonly vscode: VSCodeApi;
	readonly ide: CoderApi;
}

declare global {
	interface Window {
		/**
		 * Full VS Code extension API.
		 */
		vscode?: VSCodeApi;

		/**
		 * Coder API.
		 */
		ide?: CoderApi;

		/**
		 * Listen for when the IDE API has been set and is ready to use.
		 */
		addEventListener(event: "ide-ready", callback: (event: IdeReadyEvent) => void): void;
	}
}
