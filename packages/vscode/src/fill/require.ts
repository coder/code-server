import { join } from "path";

// tslint:disable-next-line no-any
(global as any).requireToUrl = (path: string): string => {
	// TODO: can start with vs/...
	return join(`${location.protocol}//${location.host}/resource`, path);
};
