import * as fs from "fs";
import * as http from "http";
import * as net from "net";
import * as path from "path";
import * as util from "util";
import * as url from "url";

import { getPathFromAmdModule } from "vs/base/common/amd";
import { Emitter } from "vs/base/common/event";
import { sanitizeFilePath } from "vs/base/common/extpath";
import { getMediaMime } from "vs/base/common/mime";
import { extname } from "vs/base/common/path";
import { UriComponents, URI } from "vs/base/common/uri";
import { IPCServer, ClientConnectionEvent } from "vs/base/parts/ipc/common/ipc";
import { validatePaths } from "vs/code/node/paths";
import { LogsDataCleaner } from "vs/code/electron-browser/sharedProcess/contrib/logsDataCleaner";
import { parseMainProcessArgv } from "vs/platform/environment/node/argvHelper";
import { IEnvironmentService, ParsedArgs } from "vs/platform/environment/common/environment";
import { EnvironmentService } from "vs/platform/environment/node/environmentService";
import { InstantiationService } from "vs/platform/instantiation/common/instantiationService";
import { ServiceCollection } from "vs/platform/instantiation/common/serviceCollection";
import { getLogLevel, ILogService } from "vs/platform/log/common/log";
import { LogLevelSetterChannel } from "vs/platform/log/common/logIpc";
import { SpdLogService } from "vs/platform/log/node/spdlogService";
import { IProductConfiguration } from "vs/platform/product/common/product";
import { ConnectionType, ConnectionTypeRequest } from "vs/platform/remote/common/remoteAgentConnection";
import { REMOTE_FILE_SYSTEM_CHANNEL_NAME } from "vs/platform/remote/common/remoteAgentFileSystemChannel";
import { RemoteExtensionLogFileName } from "vs/workbench/services/remote/common/remoteAgentService";
import { IWorkbenchConstructionOptions } from "vs/workbench/workbench.web.api";

import { Connection, ManagementConnection, ExtensionHostConnection } from "vs/server/connection";
import { ExtensionEnvironmentChannel, FileProviderChannel, getUriTransformer } from "vs/server/channel";
import { Protocol } from "vs/server/protocol";

export enum HttpCode {
	Ok = 200,
	NotFound = 404,
	BadRequest = 400,
}

export interface Options {
	WORKBENCH_WEB_CONGIGURATION: IWorkbenchConstructionOptions;
	REMOTE_USER_DATA_URI: UriComponents | URI;
	PRODUCT_CONFIGURATION: IProductConfiguration | null;
	CONNECTION_AUTH_TOKEN: string;
}

export class HttpError extends Error {
	public constructor(message: string, public readonly code: number) {
		super(message);
		// @ts-ignore
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

export abstract class Server {
	// The underlying web server.
	protected readonly server: http.Server;

	public constructor() {
		this.server = http.createServer(async (request, response): Promise<void> => {
			try {
				if (request.method !== "GET") {
					throw new HttpError(
						`Unsupported method ${request.method}`,
						HttpCode.BadRequest,
					);
				}

				const parsedUrl = url.parse(request.url || "", true);
				const requestPath = parsedUrl.pathname || "/";

				const [content, headers] = await this.handleRequest(request, parsedUrl, requestPath);
				response.writeHead(HttpCode.Ok, {
					"Cache-Control": "max-age=86400",
					// TODO: ETag?
					...headers,
				});
				response.end(content);
			} catch (error) {
				response.writeHead(typeof error.code === "number" ? error.code : 500);
				response.end(error.message);
			}
		});
	}

	protected abstract handleRequest(
		request: http.IncomingMessage,
		parsedUrl: url.UrlWithParsedQuery,
		requestPath: string,
	): Promise<[string | Buffer, http.OutgoingHttpHeaders]>;

	public listen(port: number): Promise<void> {
		return new Promise((resolve, reject) => {
			this.server.on("error", reject);
			this.server.listen(port, resolve);
		});
	}

	public get address(): string {
		const address = this.server.address();
		const endpoint = typeof address !== "string"
			? ((address.address === "::" ? "localhost" : address.address) + ":" + address.port)
			: address;
		return `http://${endpoint}`;
	}
}

export class MainServer extends Server {
	// Used to notify the IPC server that there is a new client.
	public readonly _onDidClientConnect = new Emitter<ClientConnectionEvent>();
	public readonly onDidClientConnect = this._onDidClientConnect.event;

	private readonly rootPath = path.resolve(__dirname, "../../..");

	// This is separate instead of just extending this class since we can't
	// use properties in the super call. This manages channels.
	private readonly ipc = new IPCServer(this.onDidClientConnect);

	// Persistent connections. These can reconnect within a timeout.
	private readonly connections = new Map<ConnectionType, Map<string, Connection>>();

	private readonly services = new ServiceCollection();

	public constructor(private readonly webviewServer: WebviewServer) {
		super();

		this.server.on("upgrade", async (request, socket) => {
			const protocol = this.createProtocol(request, socket);
			try {
				await this.connect(await protocol.handshake(), protocol);
			} catch (error) {
				protocol.dispose(error);
			}
		});
	}

	public async listen(port: number): Promise<void> {
		const args = validatePaths(parseMainProcessArgv(process.argv));

		const environmentService = new EnvironmentService(args, process.execPath);
		this.services.set(IEnvironmentService, environmentService);

		const logService = new SpdLogService(
			RemoteExtensionLogFileName,
			environmentService.logsPath,
			getLogLevel(environmentService),
		);
		this.services.set(ILogService, logService);

		this.ipc.registerChannel("loglevel", new LogLevelSetterChannel(logService));

		const instantiationService = new InstantiationService(this.services);
		instantiationService.invokeFunction(() => {
			instantiationService.createInstance(LogsDataCleaner);
			this.ipc.registerChannel(
				REMOTE_FILE_SYSTEM_CHANNEL_NAME,
				new FileProviderChannel(logService),
			);
			this.ipc.registerChannel(
				"remoteextensionsenvironment",
				new ExtensionEnvironmentChannel(environmentService, logService),
			);
		});

		await super.listen(port);
	}

	protected async handleRequest(
		request: http.IncomingMessage,
		parsedUrl: url.UrlWithParsedQuery,
		requestPath: string,
	): Promise<[string | Buffer, http.OutgoingHttpHeaders]> {
		if (requestPath === "/") {
			const htmlPath = path.join(
				this.rootPath,
				'out/vs/code/browser/workbench/workbench.html',
			);

			let html = await util.promisify(fs.readFile)(htmlPath, "utf8");

			const remoteAuthority = request.headers.host as string;
			const transformer = getUriTransformer(remoteAuthority);

			const webviewEndpoint = this.webviewServer.address;

			const cwd = process.env.VSCODE_CWD || process.cwd();
			const workspacePath = parsedUrl.query.workspace as string | undefined;
			const folderPath = !workspacePath ? parsedUrl.query.folder as string | undefined || cwd: undefined;

			const options: Options = {
				WORKBENCH_WEB_CONGIGURATION: {
					workspaceUri: workspacePath
						? transformer.transformOutgoing(URI.file(sanitizeFilePath(workspacePath, cwd)))
						: undefined,
					folderUri: folderPath
						? transformer.transformOutgoing(URI.file(sanitizeFilePath(folderPath, cwd)))
						: undefined,
					remoteAuthority,
					webviewEndpoint,
				},
				REMOTE_USER_DATA_URI: transformer.transformOutgoing(
					(this.services.get(IEnvironmentService) as EnvironmentService).webUserDataHome,
				),
				PRODUCT_CONFIGURATION: require.__$__nodeRequire(
					path.resolve(getPathFromAmdModule(require, ""), "../product.json"),
				),
				CONNECTION_AUTH_TOKEN: "",
			};

			Object.keys(options).forEach((key) => {
				html = html.replace(`"{{${key}}}"`, `'${JSON.stringify(options[key])}'`);
			});

			html = html.replace('{{WEBVIEW_ENDPOINT}}', webviewEndpoint);

			return [html, {
				"Content-Type": "text/html",
			}];
		}

		try {
			const content = await util.promisify(fs.readFile)(
				path.join(this.rootPath, requestPath),
			);
			return [content, {
				"Content-Type": getMediaMime(requestPath) || {
					".css": "text/css",
					".html": "text/html",
					".js": "text/javascript",
					".json": "application/json",
				}[extname(requestPath)] || "text/plain",
			}];
		} catch (error) {
			if (error.code === "ENOENT" || error.code === "EISDIR") {
				throw new HttpError("Not found", HttpCode.NotFound);
			}
			throw error;
		}
	}

	private createProtocol(request: http.IncomingMessage, socket: net.Socket): Protocol {
		if (request.headers.upgrade !== "websocket") {
			throw new Error("HTTP/1.1 400 Bad Request");
		}

		const options = {
			reconnectionToken: "",
			reconnection: false,
			skipWebSocketFrames: false,
		};

		if (request.url) {
			const query = url.parse(request.url, true).query;
			if (query.reconnectionToken) {
				options.reconnectionToken = query.reconnectionToken as string;
			}
			if (query.reconnection === "true") {
				options.reconnection = true;
			}
			if (query.skipWebSocketFrames === "true") {
				options.skipWebSocketFrames = true;
			}
		}

		return new Protocol(
			request.headers["sec-websocket-key"] as string,
			socket,
			options,
		);
	}

	private async connect(message: ConnectionTypeRequest, protocol: Protocol): Promise<void> {
		switch (message.desiredConnectionType) {
			case ConnectionType.ExtensionHost:
			case ConnectionType.Management:
				const debugPort = await this.getDebugPort();
				const ok = message.desiredConnectionType === ConnectionType.ExtensionHost
					? (debugPort ? { debugPort } : {})
					: { type: "ok" };

				if (!this.connections.has(message.desiredConnectionType)) {
					this.connections.set(message.desiredConnectionType, new Map());
				}

				const connections = this.connections.get(message.desiredConnectionType)!;
				const token = protocol.options.reconnectionToken;

				if (protocol.options.reconnection && connections.has(token)) {
					protocol.sendMessage(ok);
					const buffer = protocol.readEntireBuffer();
					protocol.dispose();
					return connections.get(token)!.reconnect(protocol, buffer);
				}

				if (protocol.options.reconnection || connections.has(token)) {
					throw new Error(protocol.options.reconnection
						? "Unrecognized reconnection token"
						: "Duplicate reconnection token"
					);
				}

				protocol.sendMessage(ok);

				let connection: Connection;
				if (message.desiredConnectionType === ConnectionType.Management) {
					connection = new ManagementConnection(protocol);
					this._onDidClientConnect.fire({
						protocol,
						onDidClientDisconnect: connection.onClose,
					});
				} else {
					connection = new ExtensionHostConnection(
						protocol, this.services.get(ILogService) as ILogService,
					);
				}
				connections.set(protocol.options.reconnectionToken, connection);
				connection.onClose(() => {
					connections.delete(protocol.options.reconnectionToken);
				});
				break;
			case ConnectionType.Tunnel: return protocol.tunnel();
			default: throw new Error("Unrecognized connection type");
		}
	}

	/**
	 * TODO: implement.
	 */
	private async getDebugPort(): Promise<number | undefined> {
		return undefined;
	}
}

export class WebviewServer extends Server {
	protected async handleRequest(): Promise<[string | Buffer, http.OutgoingHttpHeaders]> {
		throw new Error("not implemented");
	}
}
