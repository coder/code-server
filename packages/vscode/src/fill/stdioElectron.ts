import { StdioIpcHandler } from "@coder/server/src/ipc";
import { IpcRenderer } from "electron";

export * from "@coder/ide/src/fill/electron";

class StdioIpcRenderer extends StdioIpcHandler implements IpcRenderer {
	// tslint:disable-next-line no-any
	public sendTo(_windowId: number, _channel: string, ..._args: any[]): void {
		throw new Error("Method not implemented.");
	}

	// tslint:disable-next-line no-any
	public sendToHost(_channel: string, ..._args: any[]): void {
		throw new Error("Method not implemented.");
	}

	public eventNames(): string[] {
		return super.eventNames() as string[];
	}
}

export const ipcRenderer = new StdioIpcRenderer();
