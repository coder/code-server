import * as trash from "trash";
import { ClientServerProxy } from "../../common/proxy";
import { TrashModuleProxy } from "../../node/modules/trash";

// tslint:disable completed-docs

interface ClientTrashModuleProxy extends TrashModuleProxy, ClientServerProxy {}

export class TrashModule {
	public constructor(private readonly proxy: ClientTrashModuleProxy) {}

	public trash = (path: string, options?: trash.Options): Promise<void> => {
		return this.proxy.trash(path, options);
	}
}
