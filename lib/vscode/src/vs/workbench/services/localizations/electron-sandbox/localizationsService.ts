/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ProxyChannel } from 'vs/base/parts/ipc/common/ipc';
import { ILocalizationsService } from 'vs/platform/localizations/common/localizations';
import { registerSingleton } from 'vs/platform/instantiation/common/extensions';
import { IRemoteAgentService } from '../../remote/common/remoteAgentService';

// @ts-ignore: interface is implemented via proxy
export class LocalizationsService implements ILocalizationsService {

	declare readonly _serviceBrand: undefined;

	constructor(
		@IRemoteAgentService remoteAgentService: IRemoteAgentService,
	) {
		/*
			NOTE@coder:
			Upstream, they use the ISharedProcessService.

			We run this on the browser where there is no shared process so it needs to connect
			to the localization channel through the remote agent.
			3/16/21 jsjoeio code-asher
		*/
		return ProxyChannel.toService<ILocalizationsService>(remoteAgentService.getConnection()!.getChannel('localizations'));
	}
}

registerSingleton(ILocalizationsService, LocalizationsService, true);
