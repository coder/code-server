import { IdeClient } from "@coder/ide";
import { client as ideClientInstance } from "@coder/ide/src/fill/client";
import Severity from "vs/base/common/severity";
import { INotificationService } from "vs/platform/notification/common/notification";
import { IStatusbarService } from "vs/platform/statusbar/common/statusbar";
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

			// tslint:disable-next-line:no-any
			const getService = <T>(id: any): T => workbench.serviceCollection.get<T>(id) as T;
			enum StatusbarAlignment { LEFT, RIGHT }
			window.ide = {
				client: ideClientInstance,
				workbench: {
					statusbarService: getService<IStatusbarService>(IStatusbarService),
					notificationService: getService<INotificationService>(INotificationService),
				},
				Severity: Severity,
				StatusbarAlignment: StatusbarAlignment,
			};

			const event = new CustomEvent("ide-ready");
			// tslint:disable-next-line:no-any
			(<any>event).ide = window.ide;
			window.dispatchEvent(event);
		}, this.initData, this.sharedProcessData);
	}
}

export const client = new VSClient();
