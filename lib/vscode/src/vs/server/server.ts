/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Coder Technologies. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { promises as fs } from 'fs';
import * as net from 'net';
import { hostname, release } from 'os';
import * as path from 'path';
import { Emitter } from 'vs/base/common/event';
import { Schemas } from 'vs/base/common/network';
import { Complete } from 'vs/base/common/types';
import { URI } from 'vs/base/common/uri';
import { createServerURITransformer } from 'vs/base/common/uriServer';
import { getMachineId } from 'vs/base/node/id';
import { ClientConnectionEvent, IPCServer, IServerChannel, ProxyChannel } from 'vs/base/parts/ipc/common/ipc';
import { LogsDataCleaner } from 'vs/code/electron-browser/sharedProcess/contrib/logsDataCleaner';
import { main } from 'vs/code/node/cliProcessMain';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { ConfigurationService } from 'vs/platform/configuration/common/configurationService';
import { ExtensionHostDebugBroadcastChannel } from 'vs/platform/debug/common/extensionHostDebugIpc';
// eslint-disable-next-line code-import-patterns
import { ArgumentParser } from 'vs/platform/environment/argumentParser';
import { NativeParsedArgs } from 'vs/platform/environment/common/argv';
import { IEnvironmentService, INativeEnvironmentService } from 'vs/platform/environment/common/environment';
import { NativeEnvironmentService } from 'vs/platform/environment/node/environmentService';
import { ExtensionGalleryService } from 'vs/platform/extensionManagement/common/extensionGalleryService';
import { IExtensionGalleryService, IExtensionManagementService } from 'vs/platform/extensionManagement/common/extensionManagement';
import { ExtensionManagementChannel } from 'vs/platform/extensionManagement/common/extensionManagementIpc';
import { ExtensionManagementService } from 'vs/platform/extensionManagement/node/extensionManagementService';
import { IFileService } from 'vs/platform/files/common/files';
import { FileService } from 'vs/platform/files/common/fileService';
import { DiskFileSystemProvider } from 'vs/platform/files/node/diskFileSystemProvider';
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors';
import { InstantiationService } from 'vs/platform/instantiation/common/instantiationService';
import { ServiceCollection } from 'vs/platform/instantiation/common/serviceCollection';
import { ILocalizationsService } from 'vs/platform/localizations/common/localizations';
import { LocalizationsService } from 'vs/platform/localizations/node/localizations';
import { ConsoleMainLogger, getLogLevel, ILoggerService, ILogService, MultiplexLogService } from 'vs/platform/log/common/log';
import { LogLevelChannel } from 'vs/platform/log/common/logIpc';
import { LoggerService } from 'vs/platform/log/node/loggerService';
import { SpdLogLogger } from 'vs/platform/log/node/spdlogLog';
import productConfiguration from 'vs/platform/product/common/product';
import { IProductService } from 'vs/platform/product/common/productService';
import { ConnectionType, connectionTypeToString, IRemoteExtensionHostStartParams } from 'vs/platform/remote/common/remoteAgentConnection';
import { RemoteAgentConnectionContext } from 'vs/platform/remote/common/remoteAgentEnvironment';
import { IRequestService } from 'vs/platform/request/common/request';
import { RequestChannel } from 'vs/platform/request/common/requestIpc';
import { RequestService } from 'vs/platform/request/node/requestService';
import { resolveCommonProperties } from 'vs/platform/telemetry/common/commonProperties';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { TelemetryLogAppender } from 'vs/platform/telemetry/common/telemetryLogAppender';
import { TelemetryService } from 'vs/platform/telemetry/common/telemetryService';
import { combinedAppender, NullTelemetryService } from 'vs/platform/telemetry/common/telemetryUtils';
import { AppInsightsAppender } from 'vs/platform/telemetry/node/appInsightsAppender';
import ErrorTelemetry from 'vs/platform/telemetry/node/errorTelemetry';
import { PtyHostService } from 'vs/platform/terminal/node/ptyHostService';
import { toWorkspaceFolder } from 'vs/platform/workspace/common/workspace';
import { ExtensionEnvironmentChannel, FileProviderChannel, TerminalProviderChannel } from 'vs/server/channel';
import { ConnectionOptions } from 'vs/server/connection/abstractConnection';
import { TelemetryClient } from 'vs/server/insights';
import { getLocaleFromConfig, getNlsConfiguration } from 'vs/server/nls';
import { ServerProtocol } from 'vs/server/protocol';
import { REMOTE_TERMINAL_CHANNEL_NAME } from 'vs/workbench/contrib/terminal/common/remoteTerminalChannel';
import { REMOTE_FILE_SYSTEM_CHANNEL_NAME } from 'vs/workbench/services/remote/common/remoteAgentFileSystemChannel';
import { RemoteExtensionLogFileName } from 'vs/workbench/services/remote/common/remoteAgentService';
import { IServerWorkbenchConstructionOptions, IWorkspace } from 'vs/workbench/workbench.web.api';
import { NodeSocket, WebSocketNodeSocket } from 'vs/base/parts/ipc/node/ipc.net';
import { BufferLogService } from 'vs/platform/log/common/bufferLog';
import { ExtensionHostConnection } from 'vs/server/connection/extensionHostConnection';
import { ManagementConnection } from 'vs/server/connection/managementConnection';
import { CliMessage, VscodeOptions } from '../base/common/ipc';

const commit = productConfiguration.commit || 'development';

export type VscodeServerArgs = NativeParsedArgs & Complete<Pick<NativeParsedArgs, 'server'>>;
type Connection = ExtensionHostConnection | ManagementConnection;

/**
 * Handles client connections to a editor instance via IPC.
 */
export class CodeServerMain extends ArgumentParser {
	public readonly _onDidClientConnect = new Emitter<ClientConnectionEvent>();
	public readonly onDidClientConnect = this._onDidClientConnect.event;

	private readonly ipc = new IPCServer<RemoteAgentConnectionContext>(this.onDidClientConnect);

	private readonly maxExtraOfflineConnections = 0;

	private readonly services = new ServiceCollection();
	private servicesPromise?: Promise<void>;
	private authority: string = '';

	private readonly connections = new Map<ConnectionType, Map<string, Connection>>();

	/**
	 * Initializes connection map for this type of connection.
	 */
	private getCachedConnectionMap<T extends ConnectionType>(desiredConnectionType: T) {
		let connectionMap = this.connections.get(desiredConnectionType);

		if (!connectionMap) {
			connectionMap = new Map<string, Connection>();
			this.connections.set(desiredConnectionType, connectionMap);
		}

		return connectionMap;
	}
	public async cli(args: CliMessage['args']): Promise<void> {
		return main(args as any);
	}

	private createWorkbenchURIs(paths: string[]) {
		return paths.map(path =>
			toWorkspaceFolder(
				URI.from({
					scheme: Schemas.vscodeRemote,
					authority: this.authority,
					path,
				}),
			),
		);
	}

	public async createWorkbenchConstructionOptions(serverUrl: URL, { startPath, args, csStaticBase }: VscodeOptions): Promise<IServerWorkbenchConstructionOptions> {
		// TODO: temporarily disabled until parsed arguments are uniformly
		// used on the server and within code-oss-dev
		// const parsedArgs = this.resolveArgs();

		// if (!parsedArgs.server) {
		// 	throw new Error('Server argument not provided');
		// }

		// this.authority = parsedArgs.server;
		this.authority = serverUrl.host;

		const transformer = createServerURITransformer(this.authority);

		if (!this.servicesPromise) {
			this.servicesPromise = this.initializeServices(args as any);
		}
		await this.servicesPromise;

		const environment = this.services.get(IEnvironmentService) as INativeEnvironmentService;

		const webEndpointUrl = new URL(serverUrl.toString());
		webEndpointUrl.pathname = path.join(csStaticBase, 'lib/vscode');

		/**
		 * A workspace to open in the workbench can either be:
		 * - a workspace file with 0-N folders (via `workspaceUri`)
		 * - a single folder (via `folderUri`)
		 * - empty (via `undefined`)
		 */

		let workspace: IWorkspace | undefined = undefined;

		if (startPath) {
			const workbenchURIs = this.createWorkbenchURIs([startPath.url]);

			// TODO: multiple workbench entries needs further testing.
			// const hasSingleEntry = workbenchURIs.length > 0;
			// const isSingleEntry = workbenchURIs.length === 1;

			workspace = {
				// workspaceUri: isSingleEntry ? undefined : fs.stat(path),
				workspaceUri: undefined,
				folderUri: workbenchURIs[0].uri,
			};
		}

		return {
			...workspace,
			remoteAuthority: this.authority,
			logLevel: getLogLevel(environment),
			workspaceProvider: {
				workspace,
				trusted: undefined,
				payload: [
					['userDataPath', environment.userDataPath],
					['enableProposedApi', JSON.stringify(args['enable-proposed-api'] || [])],
				],
			},
			remoteUserDataUri: transformer.transformOutgoing(URI.file(environment.userDataPath)),
			productConfiguration: {
				...productConfiguration,
				webEndpointUrl: webEndpointUrl.toJSON(),
			},
			nlsConfiguration: await getNlsConfiguration(environment.args.locale || (await getLocaleFromConfig(environment.userDataPath)), environment.userDataPath),
			commit,
		};
	}

	public async handleWebSocket(socket: net.Socket, connectionOptions: ConnectionOptions, permessageDeflate = false): Promise<true> {
		const logger = this.services.get(ILogService) as MultiplexLogService;

		const protocol = new ServerProtocol(new WebSocketNodeSocket(new NodeSocket(socket), permessageDeflate, null, permessageDeflate), logger, connectionOptions);

		try {
			await this.connect(protocol);
		} catch (error) {
			protocol.dispose(error.message);
		}
		return true;
	}

	private async connect(protocol: ServerProtocol): Promise<void> {
		const logger = this.services.get(ILogService) as MultiplexLogService;

		const message = await protocol.handshake();

		const clientVersion = message.commit;
		const serverVersion = productConfiguration.commit;
		if (serverVersion && clientVersion !== serverVersion) {
			logger.warn(`Client version (${message.commit} does not match server version ${serverVersion})`);
		}

		// `desiredConnectionType` is marked as optional,
		// but it's a scenario we haven't yet seen.
		if (!message.desiredConnectionType) {
			throw new Error(`Expected desired connection type in protocol handshake: ${JSON.stringify(message)}`);
		}

		const connections = this.getCachedConnectionMap(message.desiredConnectionType);
		let connection = connections.get(protocol.reconnectionToken);
		const logPrefix = connectLogPrefix(message.desiredConnectionType, protocol);

		if (protocol.reconnection && connection) {
			logger.info(logPrefix, 'Client attempting to reconnect');
			return connection.reconnect(protocol);
		}

		// This probably means the process restarted so the session was lost
		// while the browser remained open.
		if (protocol.reconnection) {
			throw new Error(`Unable to reconnect; session no longer exists (${protocol.reconnectionToken})`);
		}

		// This will probably never happen outside a chance collision.
		if (connection) {
			throw new Error('Unable to connect; token is already in use');
		}

		// Now that the initial exchange has completed we can create the actual
		// connection on top of the protocol then send it to whatever uses it.
		logger.info(logPrefix, 'Client requesting connection');

		switch (message.desiredConnectionType) {
			case ConnectionType.Management:
				connection = new ManagementConnection(protocol, logger);

				// The management connection is used by firing onDidClientConnect
				// which makes the IPC server become aware of the connection.
				this._onDidClientConnect.fire(<ClientConnectionEvent>{
					protocol,
					onDidClientDisconnect: connection.onClose,
				});
				break;
			case ConnectionType.ExtensionHost:
				// The extension host connection is used by spawning an extension host
				// and then passing the socket into it.

				const startParams: IRemoteExtensionHostStartParams = {
					language: 'en',
					...message.args,
				};

				connection = new ExtensionHostConnection(
					protocol,
					logger,
					startParams,
					// Partial fix for imprecise typing.
					this.services.get(INativeEnvironmentService) as INativeEnvironmentService,
				);

				await connection.spawn();
				break;
			case ConnectionType.Tunnel:
				return protocol.tunnel();
			default:
				throw new Error(`Unknown desired connection type ${message.desiredConnectionType}`);
		}

		connections.set(protocol.reconnectionToken, connection);
		connection.onClose(() => connections.delete(protocol.reconnectionToken));

		this.disposeOldOfflineConnections(connections);
		logger.debug(`${connections.size} active ${connection.name} connection(s)`);
	}

	private disposeOldOfflineConnections(connections: Map<string, Connection>): void {
		const offline = Array.from(connections.values()).filter(connection => typeof connection.offline !== 'undefined');
		for (let i = 0, max = offline.length - this.maxExtraOfflineConnections; i < max; ++i) {
			offline[i].dispose('old');
		}
	}

	// References:
	// ../../electron-browser/sharedProcess/sharedProcessMain.ts#L148
	// ../../../code/electron-main/app.ts
	private async initializeServices(args: NativeParsedArgs): Promise<void> {
		const productService: IProductService = { _serviceBrand: undefined, ...productConfiguration };
		const environmentService = new NativeEnvironmentService(args, productService);

		await Promise.all(
			[environmentService.extensionsPath, environmentService.logsPath, environmentService.globalStorageHome.fsPath, environmentService.workspaceStorageHome.fsPath, ...environmentService.extraExtensionPaths, ...environmentService.extraBuiltinExtensionPaths].map(p =>
				fs.mkdir(p, { recursive: true }).catch(error => {
					console.warn(error.message || error);
				}),
			),
		);

		// Loggers
		// src/vs/code/electron-main/main.ts#142
		const bufferLogService = new BufferLogService();
		const logService = new MultiplexLogService([new ConsoleMainLogger(getLogLevel(environmentService)), bufferLogService]);
		// registerErrorHandler(logService);

		const fileService = new FileService(logService);
		fileService.registerProvider(Schemas.file, new DiskFileSystemProvider(logService));

		const loggerService = new LoggerService(logService, fileService);

		const piiPaths = [
			path.join(environmentService.userDataPath, 'clp'), // Language packs.
			environmentService.appRoot,
			environmentService.extensionsPath,
			environmentService.builtinExtensionsPath,
			...environmentService.extraExtensionPaths,
			...environmentService.extraBuiltinExtensionPaths,
		];

		this.ipc.registerChannel('logger', new LogLevelChannel(logService));
		this.ipc.registerChannel(ExtensionHostDebugBroadcastChannel.ChannelName, new ExtensionHostDebugBroadcastChannel());

		this.services.set(ILogService, logService);
		this.services.set(IEnvironmentService, environmentService);
		this.services.set(INativeEnvironmentService, environmentService);
		this.services.set(ILoggerService, loggerService);

		const configurationService = new ConfigurationService(environmentService.settingsResource, fileService);
		await configurationService.initialize();
		this.services.set(IConfigurationService, configurationService);

		this.services.set(IRequestService, new SyncDescriptor(RequestService));
		this.services.set(IFileService, fileService);
		this.services.set(IProductService, productService);

		await configurationService.initialize();
		this.services.set(IConfigurationService, configurationService);

		const machineId = await getMachineId();

		await new Promise(resolve => {
			const instantiationService = new InstantiationService(this.services);

			instantiationService.invokeFunction(accessor => {
				// Delay creation of spdlog for perf reasons (https://github.com/microsoft/vscode/issues/72906)
				bufferLogService.logger = new SpdLogLogger('main', path.join(environmentService.logsPath, `${RemoteExtensionLogFileName}.log`), true, bufferLogService.getLevel());

				instantiationService.createInstance(LogsDataCleaner);

				let telemetryService: ITelemetryService;

				if (!environmentService.isExtensionDevelopment && !environmentService.disableTelemetry && !!productService.enableTelemetry) {
					telemetryService = new TelemetryService(
						{
							appender: combinedAppender(new AppInsightsAppender('code-server', null, () => new TelemetryClient() as any), new TelemetryLogAppender(accessor.get(ILoggerService), environmentService)),
							sendErrorTelemetry: true,
							commonProperties: resolveCommonProperties(fileService, release(), hostname(), process.arch, commit, productConfiguration.version, machineId, undefined, environmentService.installSourcePath, 'code-server'),
							piiPaths,
						},
						configurationService,
					);
				} else {
					telemetryService = NullTelemetryService;
				}

				this.services.set(ITelemetryService, telemetryService);

				this.services.set(IExtensionManagementService, new SyncDescriptor(ExtensionManagementService));
				this.services.set(IExtensionGalleryService, new SyncDescriptor(ExtensionGalleryService));
				this.services.set(ILocalizationsService, new SyncDescriptor(LocalizationsService));

				this.ipc.registerChannel('extensions', new ExtensionManagementChannel(accessor.get(IExtensionManagementService), context => createServerURITransformer(context.remoteAuthority)));
				this.ipc.registerChannel('remoteextensionsenvironment', new ExtensionEnvironmentChannel(environmentService, logService, telemetryService, ''));
				this.ipc.registerChannel('request', new RequestChannel(accessor.get(IRequestService)));
				this.ipc.registerChannel('localizations', <IServerChannel<any>>ProxyChannel.fromService(accessor.get(ILocalizationsService)));
				this.ipc.registerChannel(REMOTE_FILE_SYSTEM_CHANNEL_NAME, new FileProviderChannel(environmentService, logService));

				const ptyHostService = new PtyHostService({ GraceTime: 60000, ShortGraceTime: 6000 }, configurationService, logService, telemetryService);
				this.ipc.registerChannel(REMOTE_TERMINAL_CHANNEL_NAME, new TerminalProviderChannel(logService, ptyHostService));

				resolve(new ErrorTelemetry(telemetryService));
			});
		});
	}
}

function connectLogPrefix(connectionType: ConnectionType, protocol: ServerProtocol) {
	return `[${connectionTypeToString(connectionType)}] ${protocol.logPrefix}`;
}
