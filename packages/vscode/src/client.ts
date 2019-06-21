import { IdeClient } from "@coder/ide";
import * as api from "@coder/ide-api";
import { vscodeApi, coderApi } from "./api.impl";

import * as paths from "./fill/paths";
import product from "./fill/product";
import "./vscode.scss";

// NOTE: shouldn't import anything from VS Code here or anything that will
// depend on a synchronous fill like `os`.

/**
 * IDE client implementation that uses VS Code.
 */
class VSClient extends IdeClient {
	/**
	 * Load VS Code into the browser.
	 */
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

			window.ide = coderApi(workbench.serviceCollection);
			window.vscode = vscodeApi(workbench.serviceCollection);

			const event = new CustomEvent("ide-ready");
			(<any>event).ide = window.ide;       // tslint:disable-line:no-any
			(<any>event).vscode = window.vscode; // tslint:disable-line:no-any
			window.dispatchEvent(event);
		}, this.initData, this.sharedProcessData);
	}
}

export const client = new VSClient();
