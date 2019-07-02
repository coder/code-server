import * as fs from "fs";
import * as http from "http";
import * as net from "net";
import * as path from "path";
import * as util from "util";
import * as url from "url";

import { Emitter } from "vs/base/common/event";
import { sanitizeFilePath } from "vs/base/common/extpath";
import { getMediaMime } from "vs/base/common/mime";
import { extname } from "vs/base/common/path";
import { UriComponents, URI } from "vs/base/common/uri";
import { IPCServer, ClientConnectionEvent } from "vs/base/parts/ipc/common/ipc";
import { validatePaths } from "vs/code/node/paths";
import { parseMainProcessArgv } from "vs/platform/environment/node/argvHelper";
import { ParsedArgs } from "vs/platform/environment/common/environment";
import { EnvironmentService } from "vs/platform/environment/node/environmentService";
import { InstantiationService } from "vs/platform/instantiation/common/instantiationService";
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

export class Server {
	// Used to notify the IPC server that there is a new client.
	public readonly _onDidClientConnect = new Emitter<ClientConnectionEvent>();
	public readonly onDidClientConnect = this._onDidClientConnect.event;

	private readonly rootPath = path.resolve(__dirname, "../../..");

	// This is separate instead of just extending this class since we can't
	// use properties in the super call. This manages channels.
	private readonly ipc = new IPCServer(this.onDidClientConnect);

	// The web server.
	private readonly server: http.Server;

	private readonly environmentService: EnvironmentService;
	private readonly logService: ILogService;

	// Persistent connections. These can reconnect within a timeout.
	private readonly connections = new Map<ConnectionType, Map<string, Connection>>();

	public constructor() {
		this.server = http.createServer(async (request, response): Promise<void> => {
			try {
				const [content, headers] = await this.handleRequest(request);
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

		this.server.on("upgrade", async (request, socket) => {
			const protocol = this.createProtocol(request, socket);
			try {
				await this.connect(await protocol.handshake(), protocol);
			} catch (error) {
				protocol.dispose(error);
			}
		});

		this.server.on("error", (error) => {
			console.error(error);
			process.exit(1);
		});

		let args: ParsedArgs;
		try {
			args = parseMainProcessArgv(process.argv);
			args = validatePaths(args);
		} catch (error) {
			console.error(error.message);
			return process.exit(1);
		}

		this.environmentService = new EnvironmentService(args, process.execPath);

		this.logService = new SpdLogService(
			RemoteExtensionLogFileName,
			this.environmentService.logsPath,
			getLogLevel(this.environmentService),
		);
		this.ipc.registerChannel("loglevel", new LogLevelSetterChannel(this.logService));

		const instantiationService = new InstantiationService();
		instantiationService.invokeFunction(() => {
			this.ipc.registerChannel(
				REMOTE_FILE_SYSTEM_CHANNEL_NAME,
				new FileProviderChannel(this.logService),
			);
			this.ipc.registerChannel(
				"remoteextensionsenvironment",
				new ExtensionEnvironmentChannel(this.environmentService),
			);
		});
	}

	private async handleRequest(request: http.IncomingMessage): Promise<[string | Buffer, http.OutgoingHttpHeaders]> {
		if (request.method !== "GET") {
			throw new HttpError(
				`Unsupported method ${request.method}`,
				HttpCode.BadRequest,
			);
		}

		const parsedUrl = url.parse(request.url || "", true);
		const requestPath = parsedUrl.pathname || "/";
		if (requestPath === "/") {
			const htmlPath = path.join(
				this.rootPath,
				'out/vs/code/browser/workbench/workbench.html',
			);

			let html = await util.promisify(fs.readFile)(htmlPath, "utf8");

			const remoteAuthority = request.headers.host as string;
			const transformer = getUriTransformer(remoteAuthority);

			const cwd = process.env.VSCODE_CWD || process.cwd();
			const workspacePath = parsedUrl.query.workspace as string | undefined;
			const folderPath = !workspacePath ? parsedUrl.query.folder as string | undefined || cwd: undefined;

			const options: Options = {
				WORKBENCH_WEB_CONGIGURATION: {
					workspaceUri: workspacePath ? transformer.transformOutgoing(URI.file(sanitizeFilePath(workspacePath, cwd))) : undefined,
					folderUri: folderPath ? transformer.transformOutgoing(URI.file(sanitizeFilePath(folderPath, cwd))) : undefined,
					remoteAuthority,
				},
				REMOTE_USER_DATA_URI: transformer.transformOutgoing(this.environmentService.webUserDataHome),
				PRODUCT_CONFIGURATION: null,
				CONNECTION_AUTH_TOKEN: "",
			};

			Object.keys(options).forEach((key) => {
				html = html.replace(`"{{${key}}}"`, `'${JSON.stringify(options[key])}'`);
			});

			html = html.replace('{{WEBVIEW_ENDPOINT}}', ""); // TODO

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

	public listen(port: number = 8443): void {
		this.server.listen(port, () => {
			const address = this.server.address();
			const location = typeof address === "string"
				? address
				: `port ${address.port}`;
			console.log(`Listening on ${location}`);
			console.log(`Serving ${this.rootPath}`);
		});
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
					connection = new ExtensionHostConnection(protocol, this.logService);
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
