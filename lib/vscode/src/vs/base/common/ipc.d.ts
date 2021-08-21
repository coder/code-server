// TODO@teffen partial fix for cross-project interface issues.
// This shouldn't be necessary after code-server stops handling requests directly.

// import { IServerWorkbenchConstructionOptions } from '../../workbench/workbench.web.api';
export type IServerWorkbenchConstructionOptions = any;

export interface CodeServerConfiguration {
	authed: boolean;
	base: string;
	csStaticBase: string;
	disableUpdateCheck: boolean;
	logLevel: number;
}

export interface InitMessage {
	type: 'init';
	id: string;
	options: VscodeOptions;
}

export type Query = { [key: string]: string | string[] | undefined | Query | Query[] };

export interface SocketMessage {
	type: 'socket';
	query: Query;
	permessageDeflate: boolean;
}

export interface CliMessage {
	type: 'cli';
	args: Args;
}

export interface OpenCommandPipeArgs {
	type: 'open';
	fileURIs?: string[];
	folderURIs: string[];
	forceNewWindow?: boolean;
	diffMode?: boolean;
	addMode?: boolean;
	gotoLineMode?: boolean;
	forceReuseWindow?: boolean;
	waitMarkerFilePath?: string;
}

export type CodeServerMessage = InitMessage | SocketMessage | CliMessage;

export interface ReadyMessage {
	type: 'ready';
}

export interface OptionsMessage {
	id: string;
	type: 'options';
	options: IServerWorkbenchConstructionOptions;
}

export type VscodeMessage = ReadyMessage | OptionsMessage;

export interface StartPath {
	url: string;
	workspace: boolean;
}

export interface Args {
	'user-data-dir'?: string;

	'enable-proposed-api'?: string[];
	'extensions-dir'?: string;
	'builtin-extensions-dir'?: string;
	'extra-extensions-dir'?: string[];
	'extra-builtin-extensions-dir'?: string[];
	'ignore-last-opened'?: boolean;

	locale?: string;

	log?: string;
	verbose?: boolean;

	_: string[];
}

export interface VscodeOptions {
	readonly args: Args;
	readonly remoteAuthority: string;
	readonly startPath?: StartPath;
	readonly csStaticBase: string;
}

export interface VscodeOptionsMessage extends VscodeOptions {
	readonly id: string;
}

export interface UriComponents {
	readonly scheme: string;
	readonly authority: string;
	readonly path: string;
	readonly query: string;
	readonly fragment: string;
}

export interface WorkbenchOptionsMessage {
	id: string;
}
