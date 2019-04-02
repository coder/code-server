import * as trash from "trash";

// tslint:disable completed-docs

export class TrashModuleProxy {
	public async trash(path: string, options?: trash.Options): Promise<void> {
		return trash(path, options);
	}
}
