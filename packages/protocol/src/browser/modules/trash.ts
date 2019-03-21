import * as trash from "trash";
import { TrashModuleProxy } from "../../node/modules/trash";

export class TrashModule {
	public constructor(private readonly proxy: TrashModuleProxy) {}

	public async trash(path: string, options?: trash.Options): Promise<void> {
		await this.proxy.trash(path, options);
	}
}
