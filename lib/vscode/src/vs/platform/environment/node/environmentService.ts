/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { homedir, tmpdir } from 'os';
import { NativeParsedArgs } from 'vs/platform/environment/common/argv';
import { getUserDataPath } from 'vs/platform/environment/node/userDataPath';
import { AbstractNativeEnvironmentService } from 'vs/platform/environment/common/environmentService';
import { IProductService } from 'vs/platform/product/common/productService';

export class NativeEnvironmentService extends AbstractNativeEnvironmentService {

	constructor(args: NativeParsedArgs, productService: IProductService) {
		super(args, {
			homeDir: homedir(),
			tmpDir: tmpdir(),
			userDataDir: getUserDataPath(args)
		}, productService);
	}
<<<<<<< HEAD

	@memoize
	get appSettingsHome(): URI { return URI.file(join(this.userDataPath, 'User')); }

	@memoize
	get tmpDir(): URI { return URI.file(tmpdir()); }

	@memoize
	get userRoamingDataHome(): URI { return this.appSettingsHome; }

	@memoize
	get settingsResource(): URI { return joinPath(this.userRoamingDataHome, 'settings.json'); }

	@memoize
	get userDataSyncHome(): URI { return joinPath(this.userRoamingDataHome, 'sync'); }

	@memoize
	get userDataSyncLogResource(): URI { return URI.file(join(this.logsPath, 'userDataSync.log')); }

	@memoize
	get sync(): 'on' | 'off' | undefined { return this.args.sync; }

	@memoize
	get machineSettingsResource(): URI { return joinPath(URI.file(join(this.userDataPath, 'Machine')), 'settings.json'); }

	@memoize
	get globalStorageHome(): URI { return URI.joinPath(this.appSettingsHome, 'globalStorage'); }

	@memoize
	get workspaceStorageHome(): URI { return URI.joinPath(this.appSettingsHome, 'workspaceStorage'); }

	@memoize
	get keybindingsResource(): URI { return joinPath(this.userRoamingDataHome, 'keybindings.json'); }

	@memoize
	get keyboardLayoutResource(): URI { return joinPath(this.userRoamingDataHome, 'keyboardLayout.json'); }

	@memoize
	get argvResource(): URI {
		const vscodePortable = process.env['VSCODE_PORTABLE'];
		if (vscodePortable) {
			return URI.file(join(vscodePortable, 'argv.json'));
		}

		return joinPath(this.userHome, product.dataFolderName, 'argv.json');
	}

	@memoize
	get snippetsHome(): URI { return joinPath(this.userRoamingDataHome, 'snippets'); }

	@memoize
	get isExtensionDevelopment(): boolean { return !!this._args.extensionDevelopmentPath; }

	@memoize
	get untitledWorkspacesHome(): URI { return URI.file(join(this.userDataPath, 'Workspaces')); }

	@memoize
	get installSourcePath(): string { return join(this.userDataPath, 'installSource'); }

	@memoize
	get builtinExtensionsPath(): string {
		const fromArgs = parsePathArg(this._args['builtin-extensions-dir'], process);
		if (fromArgs) {
			return fromArgs;
		} else {
			return normalize(join(FileAccess.asFileUri('', require).fsPath, '..', 'extensions'));
		}
	}

	get extensionsDownloadPath(): string {
		const fromArgs = parsePathArg(this._args['extensions-download-dir'], process);
		if (fromArgs) {
			return fromArgs;
		} else {
			return join(this.userDataPath, 'CachedExtensionVSIXs');
		}
	}

	@memoize
	get extensionsPath(): string {
		const fromArgs = parsePathArg(this._args['extensions-dir'], process);

		if (fromArgs) {
			return fromArgs;
		}

		const vscodeExtensions = process.env['VSCODE_EXTENSIONS'];
		if (vscodeExtensions) {
			return vscodeExtensions;
		}

		const vscodePortable = process.env['VSCODE_PORTABLE'];
		if (vscodePortable) {
			return join(vscodePortable, 'extensions');
		}

		return joinPath(this.userHome, product.dataFolderName, 'extensions').fsPath;
	}

	@memoize get extraExtensionPaths(): string[] {
		return (this._args['extra-extensions-dir'] || []).map((p) => <string>parsePathArg(p, process));
	}
	@memoize get extraBuiltinExtensionPaths(): string[] {
		return (this._args['extra-builtin-extensions-dir'] || []).map((p) => <string>parsePathArg(p, process));
	}

	@memoize
	get extensionDevelopmentLocationURI(): URI[] | undefined {
		const s = this._args.extensionDevelopmentPath;
		if (Array.isArray(s)) {
			return s.map(p => {
				if (/^[^:/?#]+?:\/\//.test(p)) {
					return URI.parse(p);
				}
				return URI.file(normalize(p));
			});
		}
		return undefined;
	}

	@memoize
	get extensionTestsLocationURI(): URI | undefined {
		const s = this._args.extensionTestsPath;
		if (s) {
			if (/^[^:/?#]+?:\/\//.test(s)) {
				return URI.parse(s);
			}
			return URI.file(normalize(s));
		}
		return undefined;
	}

	get disableExtensions(): boolean | string[] {
		if (this._args['disable-extensions']) {
			return true;
		}
		const disableExtensions = this._args['disable-extension'];
		if (disableExtensions) {
			if (typeof disableExtensions === 'string') {
				return [disableExtensions];
			}
			if (Array.isArray(disableExtensions) && disableExtensions.length > 0) {
				return disableExtensions;
			}
		}
		return false;
	}

	@memoize
	get debugExtensionHost(): IExtensionHostDebugParams { return parseExtensionHostPort(this._args, this.isBuilt); }
	get debugRenderer(): boolean { return !!this._args.debugRenderer; }

	get isBuilt(): boolean { return !process.env['VSCODE_DEV']; }
	get verbose(): boolean { return !!this._args.verbose; }
	get logLevel(): string | undefined { return this._args.log; }

	@memoize
	get serviceMachineIdResource(): URI { return joinPath(URI.file(this.userDataPath), 'machineid'); }

	get crashReporterId(): string | undefined { return this._args['crash-reporter-id']; }
	get crashReporterDirectory(): string | undefined { return this._args['crash-reporter-directory']; }

	get driverHandle(): string | undefined { return this._args['driver']; }

	@memoize
	get telemetryLogResource(): URI { return URI.file(join(this.logsPath, 'telemetry.log')); }
	get disableTelemetry(): boolean { return !!this._args['disable-telemetry']; }

	constructor(protected _args: NativeParsedArgs) {
		if (!_args.logsPath) {
			const key = toLocalISOString(new Date()).replace(/-|:|\.\d+Z$/g, '');
			_args.logsPath = join(this.userDataPath, 'logs', key);
		}
		this.logsPath = _args.logsPath;
	}
}

export function parseExtensionHostPort(args: NativeParsedArgs, isBuild: boolean): IExtensionHostDebugParams {
	return parseDebugPort(args['inspect-extensions'], args['inspect-brk-extensions'], 5870, isBuild, args.debugId);
}

export function parseSearchPort(args: NativeParsedArgs, isBuild: boolean): IDebugParams {
	return parseDebugPort(args['inspect-search'], args['inspect-brk-search'], 5876, isBuild);
}

function parseDebugPort(debugArg: string | undefined, debugBrkArg: string | undefined, defaultBuildPort: number, isBuild: boolean, debugId?: string): IExtensionHostDebugParams {
	const portStr = debugBrkArg || debugArg;
	const port = Number(portStr) || (!isBuild ? defaultBuildPort : null);
	const brk = port ? Boolean(!!debugBrkArg) : false;

	return { port, break: brk, debugId };
}

export function parsePathArg(arg: string | undefined, process: NodeJS.Process): string | undefined {
	if (!arg) {
		return undefined;
	}

	// Determine if the arg is relative or absolute, if relative use the original CWD
	// (VSCODE_CWD), not the potentially overridden one (process.cwd()).
	const resolved = resolve(arg);

	if (normalize(arg) === resolved) {
		return resolved;
	}

	return resolve(process.env['VSCODE_CWD'] || process.cwd(), arg);
}

export function parseUserDataDir(args: NativeParsedArgs, process: NodeJS.Process): string {
	return parsePathArg(args['user-data-dir'], process) || resolve(getDefaultUserDataPath());
=======
>>>>>>> 801aed93200dc0ccf325a09089c911e8e2b612d0
}
