// TODO: ?
// tslint:disable-next-line no-any
(global as any).requireToUrl = (path: string): string => `${location.protocol}//{location.host}/${path}`;
