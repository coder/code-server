import * as crypto from "crypto";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as net from "net";
import * as path from "path";
import * as tls from "tls";
import * as util from "util";
import * as url from "url";
import * as querystring from "querystring";

import { Emitter } from "vs/base/common/event";
import { sanitizeFilePath } from "vs/base/common/extpath";
import { UriComponents, URI } from "vs/base/common/uri";
import { generateUuid } from "vs/base/common/uuid";
import { getMachineId } from 'vs/base/node/id';
import { IPCServer, ClientConnectionEvent, StaticRouter } from "vs/base/parts/ipc/common/ipc";
import { mkdirp, rimraf } from "vs/base/node/pfs";
import { LogsDataCleaner } from "vs/code/electron-browser/sharedProcess/contrib/logsDataCleaner";
import { IConfigurationService } from "vs/platform/configuration/common/configuration";
import { ConfigurationService } from "vs/platform/configuration/node/configurationService";
import { IDialogService } from "vs/platform/dialogs/common/dialogs";
import { DialogChannelClient } from "vs/platform/dialogs/node/dialogIpc";
import { IEnvironmentService, ParsedArgs } from "vs/platform/environment/common/environment";
import { EnvironmentService } from "vs/platform/environment/node/environmentService";
import { IExtensionManagementService, IExtensionGalleryService } from "vs/platform/extensionManagement/common/extensionManagement";
import { ExtensionGalleryChannel } from "vs/platform/extensionManagement/node/extensionGalleryIpc";
import { ExtensionGalleryService } from "vs/platform/extensionManagement/node/extensionGalleryService";
import { ExtensionManagementChannel } from "vs/platform/extensionManagement/node/extensionManagementIpc";
import { ExtensionManagementService } from "vs/platform/extensionManagement/node/extensionManagementService";
import { SyncDescriptor } from "vs/platform/instantiation/common/descriptors";
import { InstantiationService } from "vs/platform/instantiation/common/instantiationService";
import { ServiceCollection } from "vs/platform/instantiation/common/serviceCollection";
import { ILocalizationsService } from "vs/platform/localizations/common/localizations";
import { LocalizationsService } from "vs/platform/localizations/node/localizations";
import { getLogLevel, ILogService } from "vs/platform/log/common/log";
import { LogLevelSetterChannel } from "vs/platform/log/common/logIpc";
import { SpdLogService } from "vs/platform/log/node/spdlogService";
import { IProductConfiguration } from "vs/platform/product/common/product";
import pkg from "vs/platform/product/node/package";
import product from "vs/platform/product/node/product";
import { ConnectionType, ConnectionTypeRequest } from "vs/platform/remote/common/remoteAgentConnection";
import { REMOTE_FILE_SYSTEM_CHANNEL_NAME } from "vs/platform/remote/common/remoteAgentFileSystemChannel";
import { IRequestService } from "vs/platform/request/node/request";
import { RequestService } from "vs/platform/request/node/requestService";
import ErrorTelemetry from "vs/platform/telemetry/browser/errorTelemetry";
import { ITelemetryService } from "vs/platform/telemetry/common/telemetry";
import { NullTelemetryService, LogAppender, combinedAppender } from "vs/platform/telemetry/common/telemetryUtils";
import { TelemetryService, ITelemetryServiceConfig } from "vs/platform/telemetry/common/telemetryService";
import { AppInsightsAppender } from "vs/platform/telemetry/node/appInsightsAppender";
import { resolveCommonProperties } from "vs/platform/telemetry/node/commonProperties";
import { RemoteExtensionLogFileName } from "vs/workbench/services/remote/common/remoteAgentService";
import { TelemetryChannel } from "vs/platform/telemetry/node/telemetryIpc";
import { IWorkbenchConstructionOptions } from "vs/workbench/workbench.web.api";

import { Connection, ManagementConnection, ExtensionHostConnection } from "vs/server/src/connection";
import { ExtensionEnvironmentChannel, FileProviderChannel , } from "vs/server/src/channel";
import { TelemetryClient } from "vs/server/src/insights";
import { Protocol } from "vs/server/src/protocol";
import { AuthType, getMediaMime, getUriTransformer, tmpdir } from "vs/server/src/util";

export enum HttpCode {
	Ok = 200,
	Redirect = 302,
	NotFound = 404,
	BadRequest = 400,
	Unauthorized = 401,
	LargePayload = 413,
	ServerError = 500,
}

export interface Options {
	WORKBENCH_WEB_CONGIGURATION: IWorkbenchConstructionOptions;
	REMOTE_USER_DATA_URI: UriComponents | URI;
	PRODUCT_CONFIGURATION: IProductConfiguration | null;
	CONNECTION_AUTH_TOKEN: string;
}

export interface Response {
	code?: number;
	content?: string | Buffer;
	filePath?: string;
	headers?: http.OutgoingHttpHeaders;
	redirect?: string;
}

export interface LoginPayload {
	password?: string;
}

export class HttpError extends Error {
	public constructor(message: string, public readonly code: number) {
		super(message);
		// @ts-ignore
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

export interface ServerOptions {
	readonly auth?: AuthType;
	readonly basePath?: string;
	readonly cert?: string;
	readonly certKey?: string;
	readonly folderUri?: string;
	readonly host?: string;
	readonly password?: string;
	readonly port?: number;
	readonly socket?: string;
}

export abstract class Server {
	protected readonly server: http.Server | https.Server;
	protected rootPath = path.resolve(__dirname, "../../../..");
	private listenPromise: Promise<string> | undefined;
	public readonly protocol: string;
	public readonly options: ServerOptions;

	public constructor(options: ServerOptions) {
		this.options = {
			host: options.auth && options.cert ? "0.0.0.0" : "localhost",
			...options,
			basePath: options.basePath ? options.basePath.replace(/\/+$/, "") : "",
		};
		this.protocol = this.options.cert ? "https" : "http";
		if (this.protocol === "https") {
			const httpolyglot = require.__$__nodeRequire(path.resolve(__dirname, "../node_modules/httpolyglot/lib/index")) as typeof import("httpolyglot");
			this.server = httpolyglot.createServer({
				cert: this.options.cert && fs.readFileSync(this.options.cert),
				key: this.options.certKey && fs.readFileSync(this.options.certKey),
			}, this.onRequest);
		} else {
			this.server = http.createServer(this.onRequest);
		}
	}

	public listen(): Promise<string> {
		if (!this.listenPromise) {
			this.listenPromise = new Promise((resolve, reject) => {
				this.server.on("error", reject);
				this.server.on("upgrade", this.onUpgrade);
				const onListen = () => resolve(this.address());
				if (this.options.socket) {
					this.server.listen(this.options.socket, onListen);
				} else {
					this.server.listen(this.options.port, this.options.host, onListen);
				}
			});
		}
		return this.listenPromise;
	}

	/**
	 * The local address of the server. If you pass in a request, it will use the
	 * request's host if listening on a port (rather than a socket). This enables
	 * setting the webview endpoint to the same host the browser is using.
	 */
	public address(request?: http.IncomingMessage): string {
		const address = this.server.address();
		const endpoint = typeof address !== "string"
			? (request
					? request.headers.host!.split(":", 1)[0]
					: (address.address === "::" ? "localhost" : address.address)
			) + ":" + address.port
			: address;
		return `${this.protocol}://${endpoint}`;
	}

	protected abstract handleWebSocket(
		socket: net.Socket,
		parsedUrl: url.UrlWithParsedQuery
	): Promise<void>;

	protected abstract handleRequest(
		base: string,
		requestPath: string,
		parsedUrl: url.UrlWithParsedQuery,
		request: http.IncomingMessage,
	): Promise<Response>;

	protected async getResource(...parts: string[]): Promise<Response> {
		const filePath = path.join(...parts);
		return { content: await util.promisify(fs.readFile)(filePath), filePath };
	}

	private onRequest = async (request: http.IncomingMessage, response: http.ServerResponse): Promise<void> => {
		try {
			const payload = await this.preHandleRequest(request);
			response.writeHead(payload.redirect ? HttpCode.Redirect : payload.code || HttpCode.Ok, {
				"Cache-Control": "max-age=86400", // TODO: ETag?
				"Content-Type": getMediaMime(payload.filePath),
				...(payload.redirect ? {
					Location: `${this.protocol}://${request.headers.host}${this.options.basePath}${payload.redirect}`,
				} : {}),
				...payload.headers,
			});
			response.end(payload.content);
		} catch (error) {
			if (error.code === "ENOENT" || error.code === "EISDIR") {
				error = new HttpError("Not found", HttpCode.NotFound);
			}
			response.writeHead(typeof error.code === "number" ? error.code : HttpCode.ServerError);
			response.end(error.message);
		}
	}

	private async preHandleRequest(request: http.IncomingMessage): Promise<Response> {
		const secure = (request.connection as tls.TLSSocket).encrypted;
		if (this.options.cert && !secure) {
			return { redirect: request.url };
		}

		const parsedUrl = request.url ? url.parse(request.url, true) : { query: {}};
		const fullPath = decodeURIComponent(parsedUrl.pathname || "/");
		const match = fullPath.match(/^(\/?[^/]*)(.*)$/);
		let [, base, requestPath] = match
			? match.map((p) => p.replace(/\/+$/, ""))
			: ["", "", ""];
		if (base.indexOf(".") !== -1) { // Assume it's a file at the root.
			requestPath = base;
			base = "/";
		} else if (base === "") { // Happens if it's a plain `domain.com`.
			base = "/";
		}
		base = path.normalize(base);
		requestPath = path.normalize(requestPath || "/index.html");

		switch (base) {
			case "/":
				this.ensureGet(request);
				if (requestPath === "/favicon.ico") {
					return this.getResource(this.rootPath, "/out/vs/server/src/favicon", requestPath);
				} else if (!this.authenticate(request)) {
					return { redirect: "/login" };
				}
				break;
			case "/login":
				if (!this.options.auth) {
					throw new HttpError("Not found", HttpCode.NotFound);
				} else if (requestPath === "") {
					return this.tryLogin(request);
				}
				this.ensureGet(request);
				return this.getResource(this.rootPath, "/out/vs/server/src/login", requestPath);
			default:
				this.ensureGet(request);
				if (!this.authenticate(request)) {
					throw new HttpError("Unauthorized", HttpCode.Unauthorized);
				}
				break;
		}

		return this.handleRequest(base, requestPath, parsedUrl, request);
	}

	private onUpgrade = async (request: http.IncomingMessage, socket: net.Socket): Promise<void> => {
		try {
			await this.preHandleWebSocket(request, socket);
		} catch (error) {
			socket.destroy();
			console.error(error);
		}
	}

	private preHandleWebSocket(request: http.IncomingMessage, socket: net.Socket): Promise<void> {
		socket.on("error", () => socket.destroy());
		socket.on("end", () => socket.destroy());

		if (!this.authenticate(request)) {
			throw new HttpError("Unauthorized", HttpCode.Unauthorized);
		} else if (request.headers.upgrade !== "websocket") {
			throw new Error("HTTP/1.1 400 Bad Request");
		}

		// This magic value is specified by the websocket spec.
		const magic = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
		const reply = crypto.createHash("sha1")
			.update(<string>request.headers["sec-websocket-key"] + magic)
			.digest("base64");
		socket.write([
			"HTTP/1.1 101 Switching Protocols",
			"Upgrade: websocket",
			"Connection: Upgrade",
			`Sec-WebSocket-Accept: ${reply}`,
		].join("\r\n") + "\r\n\r\n");

		const parsedUrl = request.url ? url.parse(request.url, true) : { query: {}};
		return this.handleWebSocket(socket, parsedUrl);
	}

	private async tryLogin(request: http.IncomingMessage): Promise<Response> {
		if (this.authenticate(request)) {
			this.ensureGet(request);
			return { redirect: "/" };
		}
		if (request.method === "POST") {
			const data = await this.getData<LoginPayload>(request);
			if (this.authenticate(request, data)) {
				return {
					redirect: "/",
					headers: {"Set-Cookie": `password=${data.password}` }
				};
			}
			console.error("Failed login attempt", JSON.stringify({
				xForwardedFor: request.headers["x-forwarded-for"],
				remoteAddress: request.connection.remoteAddress,
				userAgent: request.headers["user-agent"],
				timestamp: Math.floor(new Date().getTime() / 1000),
			}));
			return this.getLogin("Invalid password", data);
		}
		this.ensureGet(request);
		return this.getLogin();
	}

	private async getLogin(error: string = "", payload?: LoginPayload): Promise<Response> {
		const filePath = path.join(this.rootPath, "out/vs/server/src/login/login.html");
		const content = (await util.promisify(fs.readFile)(filePath, "utf8"))
			.replace("{{ERROR}}", error)
			.replace("display:none", error ? "display:block" : "display:none")
			.replace('value=""', `value="${payload && payload.password || ""}"`);
		return { content, filePath };
	}

	private ensureGet(request: http.IncomingMessage): void {
		if (request.method !== "GET") {
			throw new HttpError(`Unsupported method ${request.method}`, HttpCode.BadRequest);
		}
	}

	private getData<T extends object>(request: http.IncomingMessage): Promise<T> {
		return request.method === "POST"
			? new Promise<T>((resolve, reject) => {
				let body = "";
				const onEnd = (): void => {
					off();
					resolve(querystring.parse(body) as T);
				};
				const onError = (error: Error): void => {
					off();
					reject(error);
				};
				const onData = (d: Buffer): void => {
					body += d;
					if (body.length > 1e6) {
						onError(new HttpError("Payload is too large", HttpCode.LargePayload));
						request.connection.destroy();
					}
				};
				const off = (): void => {
					request.off("error", onError);
					request.off("data", onError);
					request.off("end", onEnd);
				};
				request.on("error", onError);
				request.on("data", onData);
				request.on("end", onEnd);
			})
			: Promise.resolve({} as T);
	}

	private authenticate(request: http.IncomingMessage, payload?: LoginPayload): boolean {
		if (!this.options.auth) {
			return true;
		}
		const safeCompare = require.__$__nodeRequire(path.resolve(__dirname, "../node_modules/safe-compare/index")) as typeof import("safe-compare");
		if (typeof payload === "undefined") {
			payload = this.parseCookies<LoginPayload>(request);
		}
		return !!this.options.password && safeCompare(payload.password || "", this.options.password);
	}

	private parseCookies<T extends object>(request: http.IncomingMessage): T {
		const cookies: { [key: string]: string } = {};
		if (request.headers.cookie) {
			request.headers.cookie.split(";").forEach((keyValue) => {
				const [key, value] = keyValue.split("=", 2);
				cookies[key.trim()] = decodeURI(value);
			});
		}
		return cookies as T;
	}
}

export class MainServer extends Server {
	public readonly _onDidClientConnect = new Emitter<ClientConnectionEvent>();
	public readonly onDidClientConnect = this._onDidClientConnect.event;
	private readonly ipc = new IPCServer(this.onDidClientConnect);

	private readonly connections = new Map<ConnectionType, Map<string, Connection>>();

	private readonly services = new ServiceCollection();
	private readonly servicesPromise: Promise<void>;

	public readonly _onProxyConnect = new Emitter<net.Socket>();
	private proxyPipe = path.join(tmpdir, "tls-proxy");
	private _proxyServer?: Promise<net.Server>;
	private readonly proxyTimeout = 5000;

	public constructor(options: ServerOptions, args: ParsedArgs) {
		super(options);
		this.servicesPromise = this.initializeServices(args);
	}

	public async listen(): Promise<string> {
		const environment = (this.services.get(IEnvironmentService) as EnvironmentService);
		const [address] = await Promise.all<string>([
			super.listen(), ...[
				environment.extensionsPath,
			].map((p) => mkdirp(p).then(() => p)),
		]);
		return address;
	}

	protected async handleWebSocket(socket: net.Socket, parsedUrl: url.UrlWithParsedQuery): Promise<void> {
		const protocol = new Protocol(await this.createProxy(socket), {
			reconnectionToken: <string>parsedUrl.query.reconnectionToken || "",
			reconnection: parsedUrl.query.reconnection === "true",
			skipWebSocketFrames: parsedUrl.query.skipWebSocketFrames === "true",
		});
		try {
			await this.connect(await protocol.handshake(), protocol);
		} catch (error) {
			protocol.sendMessage({ type: "error", reason: error.message });
			protocol.dispose();
			protocol.getSocket().dispose();
		}
	}

	protected async handleRequest(
		base: string,
		requestPath: string,
		parsedUrl: url.UrlWithParsedQuery,
		request: http.IncomingMessage,
	): Promise<Response> {
		switch (base) {
			case "/": return this.getRoot(request, parsedUrl);
			case "/resources": return this.getResource(requestPath);
			case "/webview":
				return this.getResource(
					this.rootPath,
					"out/vs/workbench/contrib/webview/browser/pre",
					requestPath
				);
			default:
				return this.getResource(this.rootPath, base, requestPath);
		}
	}

	private async getRoot(request: http.IncomingMessage, parsedUrl: url.UrlWithParsedQuery): Promise<Response> {
		const filePath = path.join(this.rootPath, "out/vs/code/browser/workbench/workbench.html");
		let [content] = await Promise.all([
			util.promisify(fs.readFile)(filePath, "utf8"),
			this.servicesPromise,
		]);

		const webviewEndpoint = this.address(request) + "/webview/";
		const cwd = process.env.VSCODE_CWD || process.cwd();
		const workspacePath = parsedUrl.query.workspace as string | undefined;
		const folderPath = !workspacePath ? parsedUrl.query.folder as string | undefined || this.options.folderUri || cwd: undefined;
		const remoteAuthority = request.headers.host as string;
		const transformer = getUriTransformer(remoteAuthority);
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
			PRODUCT_CONFIGURATION: product,
			CONNECTION_AUTH_TOKEN: "",
		};

		Object.keys(options).forEach((key) => {
			content = content.replace(`"{{${key}}}"`, `'${JSON.stringify(options[key])}'`);
		});
		content = content.replace('{{WEBVIEW_ENDPOINT}}', webviewEndpoint);

		return { content, filePath };
	}

	private async connect(message: ConnectionTypeRequest, protocol: Protocol): Promise<void> {
		switch (message.desiredConnectionType) {
			case ConnectionType.ExtensionHost:
			case ConnectionType.Management:
				if (!this.connections.has(message.desiredConnectionType)) {
					this.connections.set(message.desiredConnectionType, new Map());
				}
				const connections = this.connections.get(message.desiredConnectionType)!;

				const ok = async () => {
					return message.desiredConnectionType === ConnectionType.ExtensionHost
						? { debugPort: await this.getDebugPort() }
						: { type: "ok" };
				};

				const token = protocol.options.reconnectionToken;
				if (protocol.options.reconnection && connections.has(token)) {
					protocol.sendMessage(await ok());
					const buffer = protocol.readEntireBuffer();
					protocol.dispose();
					return connections.get(token)!.reconnect(protocol.getSocket(), buffer);
				} else if (protocol.options.reconnection || connections.has(token)) {
					throw new Error(protocol.options.reconnection
						? "Unrecognized reconnection token"
						: "Duplicate reconnection token"
					);
				}

				protocol.sendMessage(await ok());

				let connection: Connection;
				if (message.desiredConnectionType === ConnectionType.Management) {
					connection = new ManagementConnection(protocol);
					this._onDidClientConnect.fire({
						protocol, onDidClientDisconnect: connection.onClose,
					});
				} else {
					const buffer = protocol.readEntireBuffer();
					connection = new ExtensionHostConnection(
						protocol, buffer, this.services.get(ILogService) as ILogService,
					);
				}
				connections.set(token, connection);
				connection.onClose(() => connections.delete(token));
				break;
			case ConnectionType.Tunnel: return protocol.tunnel();
			default: throw new Error("Unrecognized connection type");
		}
	}

	private async initializeServices(args: ParsedArgs): Promise<void> {
		const router = new StaticRouter((ctx: any) => ctx.clientId === "renderer");
		const environmentService = new EnvironmentService(args, process.execPath);
		const logService = new SpdLogService(RemoteExtensionLogFileName, environmentService.logsPath, getLogLevel(environmentService));
		this.ipc.registerChannel("loglevel", new LogLevelSetterChannel(logService));

		this.services.set(ILogService, logService);
		this.services.set(IEnvironmentService, environmentService);
		this.services.set(IConfigurationService, new SyncDescriptor(ConfigurationService, [environmentService.machineSettingsResource]));
		this.services.set(IRequestService, new SyncDescriptor(RequestService));
		this.services.set(IExtensionGalleryService, new SyncDescriptor(ExtensionGalleryService));
		if (!environmentService.args["disable-telemetry"]) {
			const version = `${(pkg as any).codeServerVersion || "development"}-vsc${pkg.version}`;
			this.services.set(ITelemetryService, new SyncDescriptor(TelemetryService, [{
				appender: combinedAppender(
					new AppInsightsAppender("code-server", null, () => new TelemetryClient(), logService),
					new LogAppender(logService),
				),
				commonProperties: resolveCommonProperties(
					product.commit, version, await getMachineId(),
					environmentService.installSourcePath, "code-server",
				),
				piiPaths: [
					environmentService.appRoot,
					environmentService.extensionsPath,
					...environmentService.extraExtensionPaths,
					...environmentService.extraBuiltinExtensionPaths,
				],
			} as ITelemetryServiceConfig]));
		} else {
			this.services.set(ITelemetryService, NullTelemetryService);
		}
		this.services.set(IDialogService, new DialogChannelClient(this.ipc.getChannel("dialog", router)));
		this.services.set(IExtensionManagementService, new SyncDescriptor(ExtensionManagementService));

		await new Promise((resolve) => {
			const instantiationService = new InstantiationService(this.services);
			this.services.set(ILocalizationsService, instantiationService.createInstance(LocalizationsService));
			instantiationService.invokeFunction(() => {
				instantiationService.createInstance(LogsDataCleaner);
				this.ipc.registerChannel(REMOTE_FILE_SYSTEM_CHANNEL_NAME, new FileProviderChannel(environmentService, logService));
				const telemetryService = this.services.get(ITelemetryService) as ITelemetryService;
				this.ipc.registerChannel("remoteextensionsenvironment", new ExtensionEnvironmentChannel(environmentService, logService, telemetryService));
				const extensionsService = this.services.get(IExtensionManagementService) as IExtensionManagementService;
				const extensionsChannel = new ExtensionManagementChannel(extensionsService, (context) => getUriTransformer(context.remoteAuthority));
				this.ipc.registerChannel("extensions", extensionsChannel);
				const galleryService = this.services.get(IExtensionGalleryService) as IExtensionGalleryService;
				const galleryChannel = new ExtensionGalleryChannel(galleryService);
				this.ipc.registerChannel("gallery", galleryChannel);
				const telemetryChannel = new TelemetryChannel(telemetryService);
				this.ipc.registerChannel("telemetry", telemetryChannel);
				resolve(new ErrorTelemetry(telemetryService));
			});
		});
	}

	/**
	 * TODO: implement.
	 */
	private async getDebugPort(): Promise<number | undefined> {
		return undefined;
	}

	/**
	 * Since we can't pass TLS sockets to children, use this to proxy the socket
	 * and pass a non-TLS socket.
	 */
	private createProxy = async (socket: net.Socket): Promise<net.Socket> => {
		if (!(socket instanceof tls.TLSSocket)) {
			return socket;
		}

		await this.startProxyServer();

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				listener.dispose();
				socket.destroy();
				proxy.destroy();
				reject(new Error("TLS socket proxy timed out"));
			}, this.proxyTimeout);

			const listener = this._onProxyConnect.event((connection) => {
				connection.once("data", (data) => {
					if (!socket.destroyed && !proxy.destroyed && data.toString() === id) {
						clearTimeout(timeout);
						listener.dispose();
						[[proxy, socket], [socket, proxy]].forEach(([a, b]) => {
							a.pipe(b);
							a.on("error", () => b.destroy());
							a.on("close", () => b.destroy());
							a.on("end", () => b.end());
						});
						resolve(connection);
					}
				});
			});

			const id = generateUuid();
			const proxy = net.connect(this.proxyPipe);
			proxy.once("connect", () => proxy.write(id));
		});
	}

	private async startProxyServer(): Promise<net.Server> {
		if (!this._proxyServer) {
			this._proxyServer = new Promise(async (resolve) => {
				this.proxyPipe = await this.findFreeSocketPath(this.proxyPipe);
				await mkdirp(tmpdir);
				await rimraf(this.proxyPipe);
				const proxyServer = net.createServer((p) => this._onProxyConnect.fire(p));
				proxyServer.once("listening", resolve);
				proxyServer.listen(this.proxyPipe);
			});
		}
		return this._proxyServer;
	}

	private async findFreeSocketPath(basePath: string, maxTries: number = 100): Promise<string> {
		const canConnect = (path: string): Promise<boolean> => {
			return new Promise((resolve) => {
				const socket = net.connect(path);
				socket.once("error", () => resolve(false));
				socket.once("connect", () => {
					socket.destroy();
					resolve(true);
				});
			});
		};

		let i = 0;
		let path = basePath;
		while (await canConnect(path) && i < maxTries) {
			path = `${basePath}-${++i}`;
		}
		return path;
	}
}
