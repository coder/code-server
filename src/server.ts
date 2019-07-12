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
import { IPCServer, ClientConnectionEvent, StaticRouter } from "vs/base/parts/ipc/common/ipc";
import { mkdirp } from "vs/base/node/pfs";
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
import product from "vs/platform/product/node/product";
import { ConnectionType, ConnectionTypeRequest } from "vs/platform/remote/common/remoteAgentConnection";
import { REMOTE_FILE_SYSTEM_CHANNEL_NAME } from "vs/platform/remote/common/remoteAgentFileSystemChannel";
import { IRequestService } from "vs/platform/request/node/request";
import { RequestService } from "vs/platform/request/node/requestService";
import { ITelemetryService } from "vs/platform/telemetry/common/telemetry";
import { NullTelemetryService } from "vs/platform/telemetry/common/telemetryUtils";
import { RemoteExtensionLogFileName } from "vs/workbench/services/remote/common/remoteAgentService";
// import { TelemetryService } from "vs/workbench/services/telemetry/electron-browser/telemetryService";
import { IWorkbenchConstructionOptions } from "vs/workbench/workbench.web.api";

import { Connection, ManagementConnection, ExtensionHostConnection } from "vs/server/src/connection";
import { ExtensionEnvironmentChannel, FileProviderChannel , } from "vs/server/src/channel";
import { Protocol } from "vs/server/src/protocol";
import { getMediaMime, getUriTransformer, useHttpsTransformer } from "vs/server/src/util";

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
	readonly port?: number;
	readonly host?: string;
	readonly socket?: string;
	readonly allowHttp?: boolean;
	readonly cert?: string;
	readonly certKey?: string;
	readonly auth?: boolean;
	readonly password?: string;
}

export abstract class Server {
	// The underlying web server.
	protected readonly server: http.Server | https.Server;

	protected rootPath = path.resolve(__dirname, "../../../..");

	private listenPromise: Promise<string> | undefined;

	public constructor(private readonly options: ServerOptions) {
		if (this.options.cert && this.options.certKey) {
			useHttpsTransformer();
			const httpolyglot = require.__$__nodeRequire(path.resolve(__dirname, "../node_modules/httpolyglot/lib/index")) as typeof import("httpolyglot");
			this.server = httpolyglot.createServer({
				cert: fs.readFileSync(this.options.cert),
				key: fs.readFileSync(this.options.certKey),
			}, this.onRequest);
		} else {
			this.server = http.createServer(this.onRequest);
		}
	}

	public listen(): Promise<string> {
		if (!this.listenPromise) {
			this.listenPromise = new Promise((resolve, reject) => {
				this.server.on("error", reject);
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
	 * accessing the webview server from the same host as the main server.
	 */
	public address(request?: http.IncomingMessage): string {
		const address = this.server.address();
		const endpoint = typeof address !== "string"
			? (request
					? request.headers.host!.split(":", 1)[0]
					: (address.address === "::" ? "localhost" : address.address)
			) + ":" + address.port
			: address;
		return `${this.options.allowHttp ? "http" : "https"}://${endpoint}`;
	}

	protected abstract handleRequest(
		base: string,
		requestPath: string,
		parsedUrl: url.UrlWithParsedQuery,
		request: http.IncomingMessage,
	): Promise<Response>;

	protected async getResource(filePath: string): Promise<Response> {
		const content = await util.promisify(fs.readFile)(filePath);
		return { content, filePath };
	}

	private onRequest = async (request: http.IncomingMessage, response: http.ServerResponse): Promise<void> => {
		try {
			const payload = await this.preHandleRequest(request);
			response.writeHead(payload.redirect ? HttpCode.Redirect : payload.code || HttpCode.Ok, {
				"Cache-Control": "max-age=86400", // TODO: ETag?
				"Content-Type": getMediaMime(payload.filePath),
				...(payload.redirect ? { Location: payload.redirect } : {}),
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
		if (!this.options.allowHttp && !secure) {
			return { redirect: "https://" + request.headers.host + request.url };
		}

		const parsedUrl = url.parse(request.url || "", true);
		const fullPath = decodeURIComponent(parsedUrl.pathname || "/");
		const match = fullPath.match(/^(\/?[^/]*)(.*)$/);
		let [, base, requestPath] = match
			? match.map((p) => p.replace(/\/$/, ""))
			: ["", "", ""];
		if (base.indexOf(".") !== -1) { // Assume it's a file at the root.
			requestPath = base;
			base = "/";
		} else if (base === "") { // Happens if it's a plain `domain.com`.
			base = "/";
		}
		if (requestPath === "/") { // Trailing slash, like `domain.com/login/`.
			requestPath = "";
		} else if (requestPath !== "") { // "" will become "." with normalize.
			requestPath = path.normalize(requestPath);
		}
		base = path.normalize(base);

		switch (base) {
			case "/":
				this.ensureGet(request);
				if (!this.authenticate(request)) {
					return { redirect: "https://" + request.headers.host + "/login" };
				}
				break;
			case "/login":
				if (!this.options.auth) {
					throw new HttpError("Not found", HttpCode.NotFound);
				}
				if (requestPath === "") {
					return this.tryLogin(request);
				}
				this.ensureGet(request);
				return this.getResource(path.join(this.rootPath, "/out/vs/server/src/login", requestPath));
			case "/favicon.ico":
				this.ensureGet(request);
				return this.getResource(path.join(this.rootPath, "/out/vs/server/src/favicon", base));
			default:
				this.ensureGet(request);
				if (!this.authenticate(request)) {
					throw new HttpError(`Unauthorized`, HttpCode.Unauthorized);
				}
				break;
		}

		return this.handleRequest(base, requestPath, parsedUrl, request);
	}

	private async tryLogin(request: http.IncomingMessage): Promise<Response> {
		if (this.authenticate(request)) {
			this.ensureGet(request);
			return { redirect: "https://" + request.headers.host + "/" };
		}

		if (request.method === "POST") {
			const data = await this.getData<LoginPayload>(request);
			if (this.authenticate(request, data)) {
				return {
					redirect: "https://" + request.headers.host + "/",
					headers: {
					 "Set-Cookie": `password=${data.password}`,
					}
				};
			}
			let userAgent = request.headers["user-agent"];
			const timestamp = Math.floor(new Date().getTime() / 1000);
			if (Array.isArray(userAgent)) {
				userAgent = userAgent.join(", ");
			}
			console.error("Failed login attempt", JSON.stringify({
				xForwardedFor: request.headers["x-forwarded-for"],
				remoteAddress: request.connection.remoteAddress,
				userAgent,
				timestamp,
			}));
			return this.getLogin("Invalid password", data);
		}
		this.ensureGet(request);
		return this.getLogin();
	}

	private async getLogin(error: string = "", payload?: LoginPayload): Promise<Response> {
		const filePath = path.join(this.rootPath, "out/vs/server/src/login/login.html");
		let content = await util.promisify(fs.readFile)(filePath, "utf8");
		if (error) {
			content = content.replace("{{ERROR}}", error)
				.replace("display:none", "display:block");
		}
		if (payload && payload.password) {
			content = content.replace('value=""', `value="${payload.password}"`);
		}
		return { content, filePath };
	}

	private ensureGet(request: http.IncomingMessage): void {
		if (request.method !== "GET") {
			throw new HttpError(
				`Unsupported method ${request.method}`,
				HttpCode.BadRequest,
			);
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
						onError(new HttpError(
							"Payload is too large",
							HttpCode.LargePayload,
						));
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
	// Used to notify the IPC server that there is a new client.
	public readonly _onDidClientConnect = new Emitter<ClientConnectionEvent>();
	public readonly onDidClientConnect = this._onDidClientConnect.event;

	// This is separate instead of just extending this class since we can't
	// use properties in the super call. This manages channels.
	private readonly ipc = new IPCServer(this.onDidClientConnect);

	// Persistent connections. These can reconnect within a timeout.
	private readonly connections = new Map<ConnectionType, Map<string, Connection>>();

	private readonly services = new ServiceCollection();

	public constructor(
		options: ServerOptions,
		private readonly webviewServer: WebviewServer,
		args: ParsedArgs,
	) {
		super(options);

		this.server.on("upgrade", async (request, socket) => {
			const protocol = this.createProtocol(request, socket);
			try {
				await this.connect(await protocol.handshake(), protocol);
			} catch (error) {
				protocol.dispose(error);
			}
		});

		const environmentService = new EnvironmentService(args, process.execPath);
		const logService = new SpdLogService(RemoteExtensionLogFileName, environmentService.logsPath, getLogLevel(environmentService));
		this.ipc.registerChannel("loglevel", new LogLevelSetterChannel(logService));

		const router = new StaticRouter((context: any) => {
			return context.clientId === "renderer";
		});

		this.services.set(ILogService, logService);
		this.services.set(IEnvironmentService, environmentService);
		this.services.set(IConfigurationService, new SyncDescriptor(ConfigurationService, [environmentService.machineSettingsResource]));
		this.services.set(IRequestService, new SyncDescriptor(RequestService));
		this.services.set(IExtensionGalleryService, new SyncDescriptor(ExtensionGalleryService));
		this.services.set(ITelemetryService, NullTelemetryService); // TODO: telemetry
		this.services.set(IDialogService, new DialogChannelClient(this.ipc.getChannel("dialog", router)));
		this.services.set(IExtensionManagementService, new SyncDescriptor(ExtensionManagementService));

		const instantiationService = new InstantiationService(this.services);

		this.services.set(ILocalizationsService, instantiationService.createInstance(LocalizationsService));

		instantiationService.invokeFunction(() => {
			instantiationService.createInstance(LogsDataCleaner);
			this.ipc.registerChannel(REMOTE_FILE_SYSTEM_CHANNEL_NAME, new FileProviderChannel(environmentService, logService));
			this.ipc.registerChannel("remoteextensionsenvironment", new ExtensionEnvironmentChannel(environmentService, logService));
			const extensionsService = this.services.get(IExtensionManagementService) as IExtensionManagementService;
			const extensionsChannel = new ExtensionManagementChannel(extensionsService, (context) => getUriTransformer(context.remoteAuthority));
			this.ipc.registerChannel("extensions", extensionsChannel);
			const galleryService = this.services.get(IExtensionGalleryService) as IExtensionGalleryService;
			const galleryChannel = new ExtensionGalleryChannel(galleryService);
			this.ipc.registerChannel("gallery", galleryChannel);
		});
	}

	public async listen(): Promise<string> {
		const environment = (this.services.get(IEnvironmentService) as EnvironmentService);
		const mkdirs = Promise.all([
			environment.extensionsPath,
		].map((p) => mkdirp(p)));
		const [address] = await Promise.all([
			super.listen(),
			mkdirs,
		]);
		return address;
	}

	protected async handleRequest(
		base: string,
		requestPath: string,
		parsedUrl: url.UrlWithParsedQuery,
		request: http.IncomingMessage,
	): Promise<Response> {
		switch (base) {
			case "/": return this.getRoot(request, parsedUrl);
			case "/node_modules":
			case "/out":
				return this.getResource(path.join(this.rootPath, base, requestPath));
			// TODO: this setup means you can't request anything from the root if it
			// starts with /node_modules or /out, although that's probably low risk.
			// There doesn't seem to be a really good way to solve this since some
			// resources are requested by the browser (like the extension icon) and
			// some by the file provider (like the extension README). Maybe add a
			// /resource prefix and a file provider that strips that prefix?
			default: return this.getResource(path.join(base, requestPath));
		}
	}

	private async getRoot(request: http.IncomingMessage, parsedUrl: url.UrlWithParsedQuery): Promise<Response> {
		const filePath = path.join(this.rootPath, "out/vs/code/browser/workbench/workbench.html");
		let content = await util.promisify(fs.readFile)(filePath, "utf8");

		const remoteAuthority = request.headers.host as string;
		const transformer = getUriTransformer(remoteAuthority);

		await this.webviewServer.listen();
		const webviewEndpoint = this.webviewServer.address(request);

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
			PRODUCT_CONFIGURATION: product,
			CONNECTION_AUTH_TOKEN: "",
		};

		Object.keys(options).forEach((key) => {
			content = content.replace(`"{{${key}}}"`, `'${JSON.stringify(options[key])}'`);
		});

		content = content.replace('{{WEBVIEW_ENDPOINT}}', webviewEndpoint);

		return { content, filePath };
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
	protected async handleRequest(
		base: string,
		requestPath: string,
	): Promise<Response> {
		const webviewPath = path.join(this.rootPath, "out/vs/workbench/contrib/webview/browser/pre");
		if (requestPath === "") {
			requestPath = "/index.html";
		}
		return this.getResource(path.join(webviewPath, base, requestPath));
	}
}
