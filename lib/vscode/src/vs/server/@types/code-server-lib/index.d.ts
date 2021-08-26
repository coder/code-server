/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Coder Technologies. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Server } from 'http';
import type { NativeParsedArgs } from '../../../platform/environment/common/argv';
import type { NLSConfiguration, InternalNLSConfiguration } from '../../../base/node/languagePacks';

declare global {
	namespace CodeServerLib {
		export interface StartPath {
			url: string;
			workspace: boolean;
		}

		export interface ServerConfiguration {
			args: NativeParsedArgs;
			authed: boolean;
			disableUpdateCheck: boolean;
			startPath?: StartPath;
			codeServerVersion: string;
			serverUrl: URL;
		}

		/**
		 * @deprecated This primarily exists to bridge the gap between code-server and lib/vscode
		 */

		export type CreateVSServer = (serverConfiguration: ServerConfiguration) => Promise<Server>;

		/**
		 * Base options included on every page.
		 */
		export interface ClientConfiguration extends Pick<ServerConfiguration, 'codeServerVersion'> {
			base: string;
			csStaticBase: string;
		}

		/**
		 * @deprecated This should be removed when code-server merges with lib/vscode
		 */
		export interface IMainCli {
			main: (argv: NativeParsedArgs) => Promise<void>;
		}

		/**
		 * @deprecated This should be removed when code-server merges with lib/vscode
		 */
		export interface CliMessage {
			type: 'cli';
			args: NativeParsedArgs;
		}

		/**
		 * @deprecated This should be removed when code-server merges with lib/vscode
		 */
		export interface OpenCommandPipeArgs {
			type: 'open';
			fileURIs?: string[];
			folderURIs: string[];
			forceNewWindow?: boolean;
			diffMode?: boolean;
			addMode?: boolean;
			gotoLineMode?: boolean;
			forceReuseWindow?: boolean;
			waitMarkerFilePath?: string;
		}

		export type NLSConfigurationWeb = NLSConfiguration | InternalNLSConfiguration;
		export { NativeParsedArgs, NLSConfiguration, InternalNLSConfiguration };
	}
}

export {};
