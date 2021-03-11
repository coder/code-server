/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ProxyChannel } from 'vs/base/parts/ipc/common/ipc';
import { ILocalizationsService } from 'vs/platform/localizations/common/localizations';
<<<<<<< HEAD:lib/vscode/src/vs/workbench/services/localizations/electron-browser/localizationsService.ts
=======
import { ISharedProcessService } from 'vs/platform/ipc/electron-sandbox/services';
>>>>>>> e8cd17a97d8c58fffcbac05394b3ee2b3c72d384:lib/vscode/src/vs/workbench/services/localizations/electron-sandbox/localizationsService.ts
import { registerSingleton } from 'vs/platform/instantiation/common/extensions';
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService';

// @ts-ignore: interface is implemented via proxy
export class LocalizationsService implements ILocalizationsService {

	declare readonly _serviceBrand: undefined;

	constructor(
		@IRemoteAgentService remoteAgentService: IRemoteAgentService,
	) {
<<<<<<< HEAD:lib/vscode/src/vs/workbench/services/localizations/electron-browser/localizationsService.ts
		return createChannelSender<ILocalizationsService>(remoteAgentService.getConnection()!.getChannel('localizations'));
=======
		return ProxyChannel.toService<ILocalizationsService>(sharedProcessService.getChannel('localizations'));
>>>>>>> e8cd17a97d8c58fffcbac05394b3ee2b3c72d384:lib/vscode/src/vs/workbench/services/localizations/electron-sandbox/localizationsService.ts
	}
}

registerSingleton(ILocalizationsService, LocalizationsService, true);
