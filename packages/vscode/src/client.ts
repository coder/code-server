import { IdeClient } from "@coder/ide";
import * as paths from "./fill/paths";
import "./vscode.scss";
// NOTE: shouldn't import anything from VS Code here or anything that will
// depend on a synchronous fill like `os`.

class VSClient extends IdeClient {
	protected initialize(): Promise<void> {
		return this.task("Start workbench", 1000, async (data, sharedData) => {
			paths._paths.initialize(data, sharedData);
			process.env.SHELL = data.shell;
			// At this point everything should be filled, including `os`. `os` also
			// relies on `initData` but it listens first so it initialize before this
			// callback, meaning we are safe to include everything from VS Code now.
			const { workbench } = require("./workbench") as typeof import("./workbench");
			await workbench.initialize();
		}, this.initData, this.sharedProcessData);
	}
}

export const client = new VSClient();
