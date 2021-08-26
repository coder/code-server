/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Coder Technologies. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as net from 'net';
import * as http from 'http';
import * as path from 'path';
import { Disposable } from 'vs/base/common/lifecycle';
import { ILogService } from 'vs/platform/log/common/log';
import { IEnvironmentServerService } from 'vs/server/environmentService';
import { Serializable } from 'child_process';

export interface ParsedRequest extends http.IncomingMessage {
	parsedUrl: URL;
	pathPrefix: string;
}

export type NetEventListener = (req: ParsedRequest, ...args: any[]) => void;
export abstract class AbstractNetRequestHandler<E extends NetEventListener> extends Disposable {
	protected abstract eventName: string;
	protected abstract eventListener: E;

	constructor(protected readonly netServer: net.Server, protected readonly environmentService: IEnvironmentServerService, protected readonly logService: ILogService) {
		super();
	}

	private _handleEvent = (req: http.IncomingMessage, ...args: any[]) => {
		const parsedUrl = new URL(req.url || '/', `${this.environmentService.protocol}//${req.headers.host}`);

		Object.assign(req, {
			parsedUrl,
			pathPrefix: relativeRoot(parsedUrl),
		});

		this.eventListener(req as ParsedRequest, ...args);
	};

	public listen() {
		this.netServer.on(this.eventName, this._handleEvent);
	}

	override dispose(): void {
		super.dispose();

		if (this.netServer) {
			this.netServer.off(this.eventName, this._handleEvent);
		}
	}
}

/**
 * Generates a prefix used to normalize a request's base path.
 * @remark This is especially useful when serving the editor from directory.
 * e.g. `"localhost:8080/some/user/path/"
 *
 * @example:
 * / => .
 * /foo => .
 * /foo/ => ./..
 * /foo/bar => ./..
 * /foo/bar/ => ./../..
 */
export const relativeRoot = (url: URL): string => {
	const depth = (url.pathname.match(/\//g) || []).length;
	return path.normalize('./' + (depth > 1 ? '../'.repeat(depth - 1) : ''));
};

export const escapeJSON = (value: Serializable) => JSON.stringify(value).replace(/"/g, '&quot;');
