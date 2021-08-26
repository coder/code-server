/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Coder Technologies. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { Schemas } from 'vs/base/common/network';
import { URI } from 'vs/base/common/uri';
import { createServerURITransformer } from 'vs/base/common/uriServer';
import { NativeEnvironmentService } from 'vs/platform/environment/node/environmentService';
import { getLogLevel } from 'vs/platform/log/common/log';
import { toWorkspaceFolder } from 'vs/platform/workspace/common/workspace';
import { getLocaleFromConfig, getNlsConfiguration } from 'vs/server/nls';
import { IProductConfiguration, IWorkbenchWebConfiguration, IWorkspaceSerialized } from 'vs/workbench/workbench.web.api';
import { memoize } from '../base/common/decorators';
import { Writeable } from '../base/common/types';
import { NativeParsedArgs } from '../platform/environment/common/argv';
import { INativeEnvironmentService } from '../platform/environment/common/environment';
import { refineServiceDecorator } from '../platform/instantiation/common/instantiation';
import { IProductService } from '../platform/product/common/productService';
import { ParsedRequest } from './net/abstractNetRequestHandler';

export interface IEnvironmentServerService extends INativeEnvironmentService {
	extensionEnabledProposedApi: string[] | undefined;
	createWorkbenchWebConfiguration: (req: ParsedRequest) => Promise<IWorkbenchWebConfiguration>;
	protocol: string;
}

export const IEnvironmentServerService = refineServiceDecorator<INativeEnvironmentService, IEnvironmentServerService>(INativeEnvironmentService);

export interface IEnvironmentServerServiceConfiguration {
	readonly serverUrl: URL;
	readonly disableUpdateCheck: boolean;
}

/**
 * The `EnvironmentServerService` is fairly similar to the Electron specific
 * `EnvironmentMainService`. However, it's capable of creating a web specific workbench.
 */
export class EnvironmentServerService extends NativeEnvironmentService implements IEnvironmentServerService {
	constructor(args: NativeParsedArgs, productService: IProductService, private configuration: IEnvironmentServerServiceConfiguration) {
		super(args, productService);
	}

	/**
	 * Creates the workbench options which are then injected into the front-end.
	 * @remark When passing data to the front-end, this should be your main point of entry,
	 * even extending `IWorkbenchWebConfiguration` if truly necessary.
	 */
	public async createWorkbenchWebConfiguration(req: ParsedRequest): Promise<IWorkbenchWebConfiguration> {
		const { productService, workspaceArgPaths } = this;
		const remoteAuthority = req.headers.host;

		if (!remoteAuthority) {
			throw new Error('Expected host in request headers to determine remote authority');
		}

		// Workspace
		const workspaceSearchParamPaths = req.parsedUrl.searchParams.getAll('folder');
		const workspace = this.parseWorkspace(workspaceSearchParamPaths.length ? workspaceSearchParamPaths : workspaceArgPaths, remoteAuthority);
		const transformer = createServerURITransformer(remoteAuthority);

		// Only append dynamic properties here.
		// Static properties should be inherited when constructing `EnvironmentServerService`

		const logoutEndpointUrl = this.createRequestUrl(req, '/logout');
		logoutEndpointUrl.searchParams.set('base', req.pathPrefix);
		// const webViewExternalUrl = this.createRequestUrl(req, 'webview');

		const productConfiguration: Writeable<IProductConfiguration> = {
			...productService,
			logoutEndpointUrl: logoutEndpointUrl.toString(),
			webEndpointUrl: this.createRequestUrl(req, '/static').toString(),
			icons: [
				{
					src: this.createRequestUrl(req, '/static/src/browser/media/pwa-icon-192.png').toString(),
					type: 'image/png',
					sizes: '192x192',
				},
				{
					src: this.createRequestUrl(req, '/static/src/browser/media/pwa-icon-512.png').toString(),
					type: 'image/png',
					sizes: '512x512',
				},
			],
			// webviewContentExternalBaseUrlTemplate: webViewExternalUrl.toString(),
		};

		if (!this.configuration.disableUpdateCheck) {
			productConfiguration.updateUrl = path.join(req.pathPrefix, '/update/check');
		}

		return {
			...workspace,
			remoteAuthority,
			logLevel: getLogLevel(this),
			workspaceProvider: {
				workspace,
				trusted: undefined,
				payload: [
					['userDataPath', this.userDataPath],
					['enableProposedApi', JSON.stringify(this.extensionEnabledProposedApi || [])],
				],
			},
			remoteUserDataUri: transformer.transformOutgoing(URI.file(this.userDataPath)),
			productConfiguration,
			nlsConfiguration: await this.parseNlsConfiguration(),
		};
	}

	private _cachedNlsConfiguration: CodeServerLib.NLSConfigurationWeb | null = null;
	private async parseNlsConfiguration() {
		if (!this._cachedNlsConfiguration) {
			this._cachedNlsConfiguration = await getNlsConfiguration(this.args.locale || (await getLocaleFromConfig(this.userDataPath)), this.userDataPath);
		}

		return this._cachedNlsConfiguration;
	}

	private createRequestUrl({ pathPrefix, parsedUrl }: ParsedRequest, pathname: string): URL {
		return new URL(path.join('/', pathPrefix, pathname), `${parsedUrl.protocol}//${parsedUrl.host}`);
	}

	/**
	 * A workspace to open in the workbench can either be:
	 * - a workspace file with 0-N folders (via `workspaceUri`)
	 * - a single folder (via `folderUri`)
	 * - empty (via `undefined`)
	 */
	private parseWorkspace(workbenchPaths: string[], remoteAuthority: string): IWorkspaceSerialized | undefined {
		/** @todo `startPath` should eventually be merged with the parsed path arg. */
		//  const workbenchPaths: string[] = startPath ? [startPath.url] : this.args._.slice(1);

		if (!workbenchPaths.length) {
			return;
		}

		const workbenchURIs = workbenchPaths.map(path =>
			toWorkspaceFolder(
				URI.from({
					scheme: Schemas.vscodeRemote,
					authority: remoteAuthority,
					path,
				}),
			),
		);

		// TODO: multiple workbench entries needs further testing.
		// const hasSingleEntry = workbenchURIs.length > 0;
		// const isSingleEntry = workbenchURIs.length === 1;

		return {
			// workspaceUri: isSingleEntry ? undefined : fs.stat(path),
			workspaceUri: undefined,
			folderUri: workbenchURIs[0].uri.toJSON(),
		};
	}

	@memoize
	public get protocol(): string {
		return this.configuration.serverUrl.protocol;
	}

	@memoize
	public get commit(): string {
		return this.productService.commit || 'development';
	}

	@memoize
	public override get isBuilt(): boolean {
		return this.commit !== 'development';
	}

	@memoize
	public get disableUpdateCheck(): boolean {
		return this.configuration.disableUpdateCheck;
	}

	@memoize
	public get environmentPaths(): string[] {
		return [this.extensionsPath, this.logsPath, this.globalStorageHome.fsPath, this.workspaceStorageHome.fsPath, ...this.extraExtensionPaths, ...this.extraBuiltinExtensionPaths];
	}

	/**
	 * Workspace paths provided as CLI arguments.
	 */
	@memoize
	private get workspaceArgPaths(): string[] {
		return this.args._.slice(1);
	}

	@memoize
	public get piiPaths(): string[] {
		return [
			path.join(this.userDataPath, 'clp'), // Language packs.
			this.appRoot,
			this.extensionsPath,
			this.builtinExtensionsPath,
			...this.extraExtensionPaths,
			...this.extraBuiltinExtensionPaths,
		];
	}
}
