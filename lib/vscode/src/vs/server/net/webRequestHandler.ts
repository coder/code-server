/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Coder Technologies. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IncomingMessage, ServerResponse } from 'http';
import { readFileSync, createReadStream, promises as fs } from 'fs';
import { extname, join, normalize } from 'path';
import { UriComponents } from 'vs/base/common/uri';
import { AbstractNetRequestHandler, escapeJSON, ParsedRequest } from './abstractNetRequestHandler';
import { ProtocolConstants } from '../../base/parts/ipc/common/ipc.net';

const APP_ROOT = join(__dirname, '..', '..', '..', '..');

const paths = {
	WEBVIEW: join(APP_ROOT, 'out/vs/workbench/contrib/webview/browser/pre'),
	FAVICON: join(APP_ROOT, 'resources', 'win32', 'code.ico'),
};

/** Matching the given keys in `PollingURLCallbackProvider.QUERY_KEYS` */
type PollingURLQueryKeys = 'vscode-requestId' | 'vscode-scheme' | 'vscode-authority' | 'vscode-path' | 'vscode-query' | 'vscode-fragment';
const wellKnownKeys: PollingURLQueryKeys[] = [
	// TODO: Can this type be inferred without importing a browser specific file?
	'vscode-requestId',
	'vscode-scheme',
	'vscode-authority',
	'vscode-path',
	'vscode-query',
	'vscode-fragment',
];

export interface WebManifest {
	name: string;
	short_name: string;
	start_url: string;
	display: string;
	'background-color': string;
	description: string;
	icons: Array<{ src: string; type: string; sizes: string }>;
}

/**
 * A callback response matching the expected value in `PollingURLCallbackProvider`
 */
interface Callback {
	uri: Partial<UriComponents>;
	/** This should be no longer than `PollingURLCallbackProvider.FETCH_TIMEOUT` */
	timeout: NodeJS.Timeout;
}

export type WebRequestListener = (req: ParsedRequest, res: ServerResponse) => void | Promise<void>;

export class WebRequestHandler extends AbstractNetRequestHandler<WebRequestListener> {
	/** Stored callback URI's sent over from client-side `PollingURLCallbackProvider`. */
	private callbackUriToRequestId = new Map<string, Callback>();

	private templates = {
		workbenchDev: readFileSync(join(APP_ROOT, 'src', 'vs', 'code', 'browser', 'workbench', 'workbench-dev.html')).toString(),
		workbenchProd: readFileSync(join(APP_ROOT, 'src', 'vs', 'code', 'browser', 'workbench', 'workbench.html')).toString(),
		callback: readFileSync(join(APP_ROOT, 'resources', 'web', 'callback.html')).toString(),
	};

	protected eventName = 'request';
	/**
	 * Event listener which handles all incoming requests.
	 */
	protected eventListener: WebRequestListener = async (req, res) => {
		const { pathname } = req.parsedUrl;

		res.setHeader('Access-Control-Allow-Origin', '*');

		try {
			if (/(\/static)?\/favicon\.ico/.test(pathname)) {
				return serveFile(req, res, paths.FAVICON);
			}
			if (/(\/static)?\/manifest\.json/.test(pathname)) {
				return this.$manifest(req, res);
			}

			if (/^\/static\//.test(pathname)) {
				return this.$static(req, res);
			}

			// if (/^\/webview\//.test(pathname)) {
			// 	return this.$webview(req, res);
			// }

			switch (pathname) {
				case '/':
					return this.$root(req, res);
				case '/callback':
					return this.$callback(req, res);
				case '/fetch-callback':
					return this.$fetchCallback(req, res);
				case '/vscode-remote-resource':
					return this.$remoteResource(req, res);
				default:
					return serveError(res, 404, 'Not found.');
			}
		} catch (error: any) {
			this.logService.error(error);

			return serveError(res, 500, 'Internal Server Error.');
		}
	};

	/**
	 * PWA manifest file. This informs the browser that the app may be installed.
	 */
	private $manifest: WebRequestListener = async (req, res) => {
		const { productConfiguration } = await this.environmentService.createWorkbenchWebConfiguration(req);

		const webManifest: WebManifest = {
			name: productConfiguration.nameLong!,
			short_name: productConfiguration.nameShort!,
			start_url: req.pathPrefix,
			display: 'fullscreen',
			'background-color': '#fff',
			description: 'Run editors on a remote server.',
			// icons: productConfiguration.icons || [],
			icons: [],
		};

		res.writeHead(200, { 'Content-Type': 'application/manifest+json' });

		return res.end(JSON.stringify(webManifest));
	};

	/**
	 * Static files endpoint.
	 */
	private $static: WebRequestListener = async (req, res) => {
		const { parsedUrl } = req;

		// Strip `/static/` from the path
		const relativeFilePath = normalize(decodeURIComponent(parsedUrl.pathname.substr('/static/'.length)));

		return serveFile(req, res, join(APP_ROOT, relativeFilePath));
	};

	/**
	 * Root application endpoint.
	 * @remark This is generally where the server and client interact for the first time.
	 */
	private $root: WebRequestListener = async (req, res) => {
		const webConfigJSON = await this.environmentService.createWorkbenchWebConfiguration(req);
		// TODO: investigate auth session for authentication.
		const authSessionInfo = null;

		const content = this.templates[this.environmentService.isBuilt ? 'workbenchProd' : 'workbenchDev']
			// Inject server-side workbench configuration for client-side workbench.
			.replace('{{WORKBENCH_WEB_CONFIGURATION}}', () => escapeJSON(webConfigJSON))
			.replace('{{PATH_PREFIX}}', () => req.pathPrefix)
			.replace('{{WORKBENCH_BUILTIN_EXTENSIONS}}', () => escapeJSON([]))
			.replace('{{WORKBENCH_AUTH_SESSION}}', () => (authSessionInfo ? escapeJSON(authSessionInfo) : ''));

		const headers = {
			'Content-Type': 'text/html',
			'Content-Security-Policy': "require-trusted-types-for 'script';",
		};

		res.writeHead(200, headers);
		return res.end(content);
	};

	/**
	 * Callback endpoint.
	 * @remark The callback cycle is further documented in `PollingURLCallbackProvider`.
	 */
	private $callback: WebRequestListener = async (req, res) => {
		const { parsedUrl } = req;
		const [requestId, vscodeScheme = 'code-oss', vscodeAuthority, vscodePath, vscodeQuery, vscodeFragment] = wellKnownKeys.map(key => {
			const value = parsedUrl.searchParams.get(key);

			return value && value !== null ? decodeURIComponent(value) : undefined;
		});

		if (!requestId) {
			res.writeHead(400, { 'Content-Type': 'text/plain' });
			return res.end('Bad request.');
		}

		// merge over additional query values that we got.
		let query = new URLSearchParams(vscodeQuery || '');

		for (const key in query.keys()) {
			// Omit duplicate keys within query.
			if (wellKnownKeys.includes(key as PollingURLQueryKeys)) {
				query.delete(key);
			}
		}

		const callback: Callback = {
			uri: {
				scheme: vscodeScheme || 'code-oss',
				authority: vscodeAuthority,
				path: vscodePath,
				query: query.toString(),
				fragment: vscodeFragment,
			},
			// Make sure the map doesn't leak if nothing fetches this URI.
			timeout: setTimeout(() => this.callbackUriToRequestId.delete(requestId), ProtocolConstants.ReconnectionShortGraceTime),
		};

		// Add to map of known callbacks.
		this.callbackUriToRequestId.set(requestId, callback);

		res.writeHead(200, { 'Content-Type': 'text/html' });
		return res.end(this.templates.callback);
	};

	/**
	 * Fetch callback endpoint.
	 * @remark This is the follow up to a client's initial `/callback` lifecycle.
	 */
	private $fetchCallback: WebRequestListener = (req, res) => {
		const requestId = req.parsedUrl.searchParams.get('vscode-requestId');
		if (!requestId) {
			res.writeHead(400, { 'Content-Type': 'text/plain' });
			return res.end(`Bad request.`);
		}

		const knownCallback = this.callbackUriToRequestId.get(requestId);

		if (knownCallback) {
			this.callbackUriToRequestId.delete(requestId);
			clearTimeout(knownCallback.timeout);
		}

		res.writeHead(200, { 'Content-Type': 'text/json' });
		return res.end(JSON.stringify(knownCallback?.uri));
	};

	/**
	 * Remote resource endpoint.
	 * @remark Used to load resources on the client-side.
	 */
	private $remoteResource: WebRequestListener = async (req, res) => {
		const path = req.parsedUrl.searchParams.get('path');

		if (path) {
			res.setHeader('Content-Type', getMediaMime(path));
			res.end(await fs.readFile(path));
		}
	};

	// /**
	//  * Webview endpoint
	//  */
	// private $webview: WebRequestListener = async (req, res) => {
	// 	const foo = req.parsedUrl.pathname.foo;

	// 	if (/^vscode-resource/.test(foo)) {
	// 		return serveFile(req, res, foo.replace(/^vscode-resource(\/file)?/, ''));
	// 	}

	// 	return serveFile(req, res, join(paths.WEBVIEW, foo));
	// };

	public override dispose() {
		super.dispose();
		this.callbackUriToRequestId.clear();
	}
}

async function serveError(res: ServerResponse, errorCode: number, errorMessage: string, responseHeaders = Object.create(null)) {
	responseHeaders['Content-Type'] = 'text/plain';
	res.writeHead(errorCode, responseHeaders);
	res.end(errorMessage);
}

async function serveFile(req: IncomingMessage, res: ServerResponse, filePath: string, responseHeaders = Object.create(null)) {
	try {
		// Sanity checks
		filePath = normalize(filePath); // ensure no "." and ".."

		const stat = await fs.stat(filePath);

		// Check if file modified since
		// Weak validator (https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)
		const etag = `W/"${[stat.ino, stat.size, stat.mtime.getTime()].join('-')}"`;
		if (req.headers['if-none-match'] === etag) {
			res.writeHead(304);
			return res.end();
		}

		// Headers
		responseHeaders['Content-Type'] = textMimeType[extname(filePath)] || getMediaMime(filePath);
		responseHeaders['Etag'] = etag;

		res.writeHead(200, responseHeaders);

		// Data
		createReadStream(filePath).pipe(res);
	} catch (error: any) {
		console.error(error.toString());
		responseHeaders['Content-Type'] = 'text/plain';
		res.writeHead(404, responseHeaders);
		return res.end('Not found');
	}
}

const textMimeType: { [fileExt: string]: string | undefined } = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.json': 'application/json',
	'.css': 'text/css',
	'.svg': 'image/svg+xml',
};

const mapExtToMediaMimes: { [fileExt: string]: string | undefined } = {
	'.bmp': 'image/bmp',
	'.gif': 'image/gif',
	'.ico': 'image/x-icon',
	'.jpe': 'image/jpg',
	'.jpeg': 'image/jpg',
	'.jpg': 'image/jpg',
	'.png': 'image/png',
	'.tga': 'image/x-tga',
	'.tif': 'image/tiff',
	'.tiff': 'image/tiff',
	'.woff': 'application/font-woff',
};

function getMediaMime(forPath: string) {
	const ext = extname(forPath);

	return mapExtToMediaMimes[ext.toLowerCase()] || 'text/plain';
}
