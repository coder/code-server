import { StdioIpcHandler } from "@coder/server/src/ipc";
import { IpcRenderer } from "electron";

// TODO: Commenting out for now since the electron fill includes the client code
// and tries to connect to the web socket. The fill also likely wouldn't work
// since it assumes it is running on the client. Could we proxy all methods to
// the client? It might not matter since we intercept everything before sending
// to the shared process.
// export * from "@coder/ide/src/fill/electron";

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
