import { IpcHandler } from "../ipc";

class StdioIpcRenderer extends IpcHandler {
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
