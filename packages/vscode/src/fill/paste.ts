import * as nls from "vs/nls";
import { Action } from "vs/base/common/actions";
import { TERMINAL_COMMAND_ID } from "vs/workbench/contrib/terminal/common/terminalCommands";
import { ITerminalService } from "vs/workbench/contrib/terminal/common/terminal";
import * as actions from "vs/workbench/contrib/terminal/browser/terminalActions";
import * as instance from "vs/workbench/contrib/terminal/browser/terminalInstance";
import { client } from "../client";

const getLabel = (key: string, enabled: boolean): string => {
	return enabled
		? nls.localize(key, "Paste")
		: nls.localize(`${key}WithKeybind`, "Paste (must use keybind)");
};

export class PasteAction extends Action {
	private static readonly KEY = "paste";

	public constructor() {
		super(
			"editor.action.clipboardPasteAction",
			getLabel(PasteAction.KEY, client.clipboard.isEnabled),
			undefined,
			client.clipboard.isEnabled,
			async (): Promise<boolean> => client.clipboard.paste(),
		);

		client.clipboard.onPermissionChange((enabled) => {
			this.label = getLabel(PasteAction.KEY, enabled);
			this.enabled = enabled;
		});
	}
}

class TerminalPasteAction extends Action {
	private static readonly KEY = "workbench.action.terminal.paste";

	public static readonly ID = TERMINAL_COMMAND_ID.PASTE;
	public static readonly LABEL = nls.localize("workbench.action.terminal.paste", "Paste into Active Terminal");
	public static readonly SHORT_LABEL = getLabel(TerminalPasteAction.KEY, client.clipboard.isEnabled);

	public constructor(
		id: string, label: string,
		@ITerminalService private terminalService: ITerminalService,
	) {
		super(id, label);
		client.clipboard.onPermissionChange((enabled) => {
			this._setLabel(getLabel(TerminalPasteAction.KEY, enabled));
		});
		this._setLabel(getLabel(TerminalPasteAction.KEY, client.clipboard.isEnabled));
	}

	public run(): Promise<void> {
		const instance = this.terminalService.getActiveOrCreateInstance();
		if (instance) {
			// tslint:disable-next-line no-any it will return a promise (see below)
			return (instance as any).paste();
		}

		return Promise.resolve();
	}
}

class TerminalInstance extends instance.TerminalInstance {
	public async paste(): Promise<void> {
		this.focus();
		if (client.clipboard.isEnabled) {
			const text = await client.clipboard.readText();
			this.sendText(text, false);
		} else {
			document.execCommand("paste");
		}
	}
}

const actionsTarget = actions as typeof actions;
// @ts-ignore TODO: don't ignore it.
actionsTarget.TerminalPasteAction = TerminalPasteAction;

const instanceTarget = instance as typeof instance;
instanceTarget.TerminalInstance = TerminalInstance;
