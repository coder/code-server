import { URI } from "vs/base/common/uri";

export const getPathFromAmdModule = (_: typeof require, relativePath: string): string => {
	if (process.mainModule && process.mainModule.filename) {
		const index = process.mainModule.filename.lastIndexOf("/");

		return process.mainModule.filename.slice(0, index);
	}

	return relativePath ? URI.file(relativePath).fsPath : "";
};
