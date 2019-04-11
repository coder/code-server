import { logger } from "@coder/logger";
import { IDisposable } from "vs/base/common/lifecycle";
import { Registry } from "vs/platform/registry/common/platform";
import { IWorkbenchActionRegistry, Extensions } from "vs/workbench/common/actions";
import { SyncActionDescriptor } from "vs/platform/actions/common/actions";
import { ContextKeyExpr } from "vs/platform/contextkey/common/contextkey";
import { ToggleDevToolsAction } from "vs/workbench/electron-browser/actions/developerActions";
import { TerminalPasteAction } from "vs/workbench/contrib/terminal/browser/terminalActions";
import { KEYBINDING_CONTEXT_TERMINAL_FOCUS } from "vs/workbench/contrib/terminal/common/terminal";
import { KeyCode, KeyMod } from "vs/base/common/keyCodes";
import { workbench } from "../workbench";

// Intercept adding workbench actions so we can skip actions that won't work or
// modify actions that need different conditions, keybindings, etc.
const registry = Registry.as<IWorkbenchActionRegistry>(Extensions.WorkbenchActions);
const originalRegister = registry.registerWorkbenchAction.bind(registry);
registry.registerWorkbenchAction = (descriptor: SyncActionDescriptor, alias: string, category?: string, when?: ContextKeyExpr): IDisposable => {
	switch (descriptor.id) {
		case ToggleDevToolsAction.ID: // There appears to be no way to toggle this programmatically.
			logger.debug(`Skipping unsupported workbench action ${descriptor.id}`);

			return {
				dispose: (): void => undefined,
			};

		case TerminalPasteAction.ID: // Modify the Windows keybinding and add our context key.
			// tslint:disable-next-line no-any override private
			(descriptor as any)._keybindings = {
				primary: KeyMod.CtrlCmd | KeyCode.KEY_V,
				linux: { primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KEY_V },
				win: { primary: KeyMod.CtrlCmd | KeyCode.KEY_V },
				mac: { primary: 0 },
			};
			// tslint:disable-next-line no-any override private
			(descriptor as any)._keybindingContext = ContextKeyExpr.and(KEYBINDING_CONTEXT_TERMINAL_FOCUS, workbench.clipboardContextKey);
	}

	return originalRegister(descriptor, alias, category, when);
};
