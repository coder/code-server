import { StdioIpcHandler } from "@coder/server/src/ipc";
import { IpcRenderer } from "electron";

export * from "@coder/ide/src/fill/electron";

class StdioIpcRenderer extends StdioIpcHandler implements IpcRenderer {

	public sendTo(windowId: number, channel: string, ...args: any[]): void {
		throw new Error("Method not implemented.");
	}

	public sendToHost(channel: string, ...args: any[]): void {
		throw new Error("Method not implemented.");
	}

	public eventNames(): string[] {
		return super.eventNames() as string[];
	}

}

export const ipcRenderer = new StdioIpcRenderer();
