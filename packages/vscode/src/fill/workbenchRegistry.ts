import { logger } from "@coder/logger";
import { IDisposable } from "vs/base/common/lifecycle";
import { Registry } from "vs/platform/registry/common/platform";
import { IWorkbenchActionRegistry, Extensions } from "vs/workbench/common/actions";
import { SyncActionDescriptor } from "vs/platform/actions/common/actions";
import { ContextKeyExpr } from "vs/platform/contextkey/common/contextkey";
import { ToggleDevToolsAction } from "vs/workbench/electron-browser/actions";

// Intercept adding workbench actions so we can skip actions that won't work.
const registry = Registry.as<IWorkbenchActionRegistry>(Extensions.WorkbenchActions);
const originalRegister = registry.registerWorkbenchAction.bind(registry);
registry.registerWorkbenchAction = (descriptor: SyncActionDescriptor, alias: string, category?: string, when?: ContextKeyExpr): IDisposable => {
	switch (descriptor.id) {
		case ToggleDevToolsAction.ID: // There appears to be no way to toggle this programmatically.
			logger.debug(`Skipping unsupported workbench action ${descriptor.id}`);

			return {
				dispose: (): void => undefined,
			};
	}

	return originalRegister(descriptor, alias, category, when);
};
