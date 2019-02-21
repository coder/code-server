import { logger } from "@coder/logger";
import { IDisposable } from "vs/base/common/lifecycle";
import * as actions from "vs/platform/actions/common/actions";
import { ToggleDevToolsAction } from "vs/workbench/electron-browser/actions/developerActions";

// Intercept appending menu items so we can skip items that won't work.
const originalAppend = actions.MenuRegistry.appendMenuItem.bind(actions.MenuRegistry);
actions.MenuRegistry.appendMenuItem = (id: actions.MenuId, item: actions.IMenuItem | actions.ISubmenuItem): IDisposable => {
	if (actions.isIMenuItem(item)) {
		switch (item.command.id) {
			case ToggleDevToolsAction.ID: // There appears to be no way to toggle this programmatically.
				logger.debug(`Skipping unsupported menu item ${item.command.id}`);

				return {
					dispose: (): void => undefined,
				};
		}
	}

	return originalAppend(id, item);
};
