import * as vscode from "vscode";

export { vscode };

export interface IdeReadyEvent extends CustomEvent<void> {
	readonly vscode: typeof vscode;
	readonly ide: typeof coder;
}

declare global {
	interface Window {
		/**
		 * Full VS Code extension API.
		 */
		vscode?: typeof vscode;

		/**
		 * Coder API.
		 */
		ide?: typeof coder;

		/**
		 * Listen for when the IDE API has been set and is ready to use.
		 */
		addEventListener(event: "ide-ready", callback: (event: IdeReadyEvent) => void): void;
	}
}
