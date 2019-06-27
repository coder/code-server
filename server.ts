import * as fs from "fs";
import * as http from "http";
import * as net from "net";
import * as path from "path";
import * as util from "util";
import * as url from "url";

import { Connection } from "vs/server/connection";
import { ConnectionType } from "vs/platform/remote/common/remoteAgentConnection";
import { Emitter } from "vs/base/common/event";
import { ClientConnectionEvent } from "vs/base/parts/ipc/common/ipc";
import { Socket, Server as IServer } from "vs/server/socket";

enum HttpCode {
	Ok = 200,
	NotFound = 404,
	BadRequest = 400,
}

class HttpError extends Error {
	public constructor(message: string, public readonly code: number) {
		super(message);
		// @ts-ignore
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

class Server implements IServer {
	private readonly _onDidClientConnect = new Emitter<ClientConnectionEvent>();
	public readonly onDidClientConnect = this._onDidClientConnect.event;

	private readonly rootPath = path.resolve(__dirname, "../../..");

	private readonly server: http.Server;

	public readonly connections = new Map<ConnectionType, Map<string, Connection>>();

	public constructor() {
		this.server = http.createServer(async (request, response): Promise<void> => {
			try {
				const content = await this.handleRequest(request);
				response.writeHead(HttpCode.Ok, {
					"Cache-Control": "max-age=86400",
					// TODO: ETag?
				});
				response.end(content);
			} catch (error) {
				response.writeHead(typeof error.code === "number" ? error.code : 500);
				response.end(error.message);
			}
		});

		this.server.on("upgrade", (request, socket) => {
			this.handleUpgrade(request, socket);
		});

		this.server.on("error", (error) => {
			console.error(error);
			process.exit(1);
		});
	}

	public dispose(): void {
		this.connections.clear();
	}

	private async handleRequest(request: http.IncomingMessage): Promise<string | Buffer> {
		if (request.method !== "GET") {
			throw new HttpError(
				`Unsupported method ${request.method}`,
				HttpCode.BadRequest,
			);
		}

		const requestPath = url.parse(request.url || "").pathname || "/";
		if (requestPath === "/") {
			const htmlPath = path.join(
				this.rootPath,
				'out/vs/code/browser/workbench/workbench.html',
			);

			let html = await util.promisify(fs.readFile)(htmlPath, "utf8");

			const options = {
				WEBVIEW_ENDPOINT: {},
				WORKBENCH_WEB_CONGIGURATION: {
					remoteAuthority: request.headers.host,
				},
				REMOTE_USER_DATA_URI: {
					scheme: "http",
					authority: request.headers.host,
					path: "/",
				},
				PRODUCT_CONFIGURATION: {},
				CONNECTION_AUTH_TOKEN: {}
			};

			Object.keys(options).forEach((key) => {
				html = html.replace(`"{{${key}}}"`, `'${JSON.stringify(options[key])}'`);
			});

			html = html.replace('{{WEBVIEW_ENDPOINT}}', JSON.stringify(options.WEBVIEW_ENDPOINT));

			return html;
		}

		try {
			const content = await util.promisify(fs.readFile)(
				path.join(this.rootPath, requestPath),
			);
			return content;
		} catch (error) {
			if (error.code === "ENOENT" || error.code === "EISDIR") {
				throw new HttpError("Not found", HttpCode.NotFound);
			}
			throw error;
		}
	}

	private handleUpgrade(request: http.IncomingMessage, socket: net.Socket): void {
		if (request.headers.upgrade !== "websocket") {
			return socket.end("HTTP/1.1 400 Bad Request");
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

		const nodeSocket = new Socket(socket, options);
		nodeSocket.upgrade(request.headers["sec-websocket-key"] as string);
		nodeSocket.handshake(this);
	}

	public listen(): void {
		const port = 8443;
		this.server.listen(port, () => {
			const address = this.server.address();
			const location = typeof address === "string"
				? address
				: `port ${address.port}`;
			console.log(`Listening on ${location}`);
			console.log(`Serving ${this.rootPath}`);
		});
	}
}

const server = new Server();
server.listen();
