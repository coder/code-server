/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI, UriComponents } from 'vs/base/common/uri';
import { MarshalledObject } from 'vs/base/common/marshalling';
import { Schemas } from './network';

export interface IURITransformer {
	transformIncoming(uri: UriComponents): UriComponents;
	transformOutgoing(uri: UriComponents): UriComponents;
	transformOutgoingURI(uri: URI): URI;
	transformOutgoingScheme(scheme: string): string;
}

export interface UriParts {
	scheme: string;
	authority?: string;
	path?: string;
}

export interface IRawURITransformer {
	transformIncoming(uri: UriParts): UriParts;
	transformOutgoing(uri: UriParts): UriParts;
	transformOutgoingScheme(scheme: string): string;
}

function toJSON(uri: URI): UriComponents {
	return <UriComponents><any>uri.toJSON();
}

export class URITransformer implements IURITransformer {

	constructor(private readonly remoteAuthority: string) {
	}

	// NOTE@coder: Coming in from the browser it'll be vscode-remote so it needs
	// to be transformed into file.
	public transformIncoming(uri: UriComponents): UriComponents {
		return uri.scheme === Schemas.vscodeRemote
			? toJSON(URI.file(uri.path))
			: uri;
	}

	// NOTE@coder: Going out to the browser it'll be file so it needs to be
	// transformed into vscode-remote.
	public transformOutgoing(uri: UriComponents): UriComponents {
		return uri.scheme === Schemas.file
			? toJSON(URI.from({ authority: this.remoteAuthority, scheme: Schemas.vscodeRemote, path: uri.path }))
			: uri;
	}

	public transformOutgoingURI(uri: URI): URI {
		return uri.scheme === Schemas.file
			? URI.from({ authority: this.remoteAuthority, scheme: Schemas.vscodeRemote, path:uri.path })
			: uri;
	}

	public transformOutgoingScheme(scheme: string): string {
		return scheme === Schemas.file
			? Schemas.vscodeRemote
			: scheme;
	}
}

export const DefaultURITransformer: IURITransformer = new class {
	transformIncoming(uri: UriComponents) {
		return uri;
	}

	transformOutgoing(uri: UriComponents): UriComponents {
		return uri;
	}

	transformOutgoingURI(uri: URI): URI {
		return uri;
	}

	transformOutgoingScheme(scheme: string): string {
		return scheme;
	}
};

function _transformOutgoingURIs(obj: any, transformer: IURITransformer, depth: number): any {

	if (!obj || depth > 200) {
		return null;
	}

	if (typeof obj === 'object') {
		if (obj instanceof URI) {
			return transformer.transformOutgoing(obj);
		}

		// walk object (or array)
		for (let key in obj) {
			if (Object.hasOwnProperty.call(obj, key)) {
				const r = _transformOutgoingURIs(obj[key], transformer, depth + 1);
				if (r !== null) {
					obj[key] = r;
				}
			}
		}
	}

	return null;
}

export function transformOutgoingURIs<T>(obj: T, transformer: IURITransformer): T {
	const result = _transformOutgoingURIs(obj, transformer, 0);
	if (result === null) {
		// no change
		return obj;
	}
	return result;
}


function _transformIncomingURIs(obj: any, transformer: IURITransformer, revive: boolean, depth: number): any {

	if (!obj || depth > 200) {
		return null;
	}

	if (typeof obj === 'object') {

		if ((<MarshalledObject>obj).$mid === 1) {
			return revive ? URI.revive(transformer.transformIncoming(obj)) : transformer.transformIncoming(obj);
		}

		// walk object (or array)
		for (let key in obj) {
			if (Object.hasOwnProperty.call(obj, key)) {
				const r = _transformIncomingURIs(obj[key], transformer, revive, depth + 1);
				if (r !== null) {
					obj[key] = r;
				}
			}
		}
	}

	return null;
}

export function transformIncomingURIs<T>(obj: T, transformer: IURITransformer): T {
	const result = _transformIncomingURIs(obj, transformer, false, 0);
	if (result === null) {
		// no change
		return obj;
	}
	return result;
}

export function transformAndReviveIncomingURIs<T>(obj: T, transformer: IURITransformer): T {
	const result = _transformIncomingURIs(obj, transformer, true, 0);
	if (result === null) {
		// no change
		return obj;
	}
	return result;
}
