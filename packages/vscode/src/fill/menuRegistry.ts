import { IDisposable } from "vs/base/common/lifecycle";
import * as actions from "vs/platform/actions/common/actions";
import { CloseWorkspaceAction } from "vs/workbench/browser/actions/workspaceActions";
import { OpenProcessExplorer } from "vs/workbench/contrib/issue/electron-browser/issueActions";
import { ToggleDevToolsAction } from "vs/workbench/electron-browser/actions/developerActions";
import { OpenPrivacyStatementUrlAction, OpenRequestFeatureUrlAction, OpenTwitterUrlAction } from "vs/workbench/electron-browser/actions/helpActions";
import { CloseCurrentWindowAction, NewWindowAction, ShowAboutDialogAction } from "vs/workbench/electron-browser/actions/windowActions";

const toSkip = [
	ToggleDevToolsAction.ID,
	OpenTwitterUrlAction.ID,
	OpenPrivacyStatementUrlAction.ID,
	ShowAboutDialogAction.ID,
	OpenProcessExplorer.ID,
	OpenRequestFeatureUrlAction.ID,
	NewWindowAction.ID,
	CloseCurrentWindowAction.ID,
	CloseWorkspaceAction.ID,

	// Unfortunately referenced as a string
	"update.showCurrentReleaseNotes",
	"workbench.action.openIssueReporter",
];

// Intercept appending menu items so we can skip items that won't work.
const originalAppend = actions.MenuRegistry.appendMenuItem.bind(actions.MenuRegistry);
actions.MenuRegistry.appendMenuItem = (id: actions.MenuId, item: actions.IMenuItem | actions.ISubmenuItem): IDisposable => {
	if (actions.isIMenuItem(item)) {
		if (toSkip.indexOf(item.command.id) !== -1) {
			// Skip instantiation
			return {
				dispose: (): void => undefined,
			};
		}
	}

	return originalAppend(id, item);
};
