import * as trash from "trash";
import { TrashModuleProxy } from "../../node/modules/trash";

// tslint:disable completed-docs

export class TrashModule {
	public constructor(private readonly proxy: TrashModuleProxy) {}

	public trash = (path: string, options?: trash.Options): Promise<void> => {
		return this.proxy.trash(path, options);
	}
}
