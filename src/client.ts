import { registerSingleton } from "vs/platform/instantiation/common/extensions";
import { ServiceCollection } from "vs/platform/instantiation/common/serviceCollection";
import { ITelemetryService } from "vs/platform/telemetry/common/telemetry";
import { ILocalizationsService } from "vs/platform/localizations/common/localizations";
import { LocalizationsService } from "vs/platform/localizations/electron-browser/localizationsService";
import { IUpdateService } from "vs/platform/update/common/update";
import { UpdateService } from "vs/platform/update/electron-browser/updateService";
import { TelemetryChannelClient } from "vs/server/src/telemetry";
import { IRemoteAgentService } from "vs/workbench/services/remote/common/remoteAgentService";

class TelemetryService extends TelemetryChannelClient {
	public constructor(
		@IRemoteAgentService remoteAgentService: IRemoteAgentService,
	) {
		super(remoteAgentService.getConnection()!.getChannel("telemetry"));
	}
}

registerSingleton(ILocalizationsService, LocalizationsService);
registerSingleton(IUpdateService, UpdateService);
registerSingleton(ITelemetryService, TelemetryService);

import "vs/workbench/contrib/update/electron-browser/update.contribution";

import "vs/css!./media/firefox";
import { coderApi, vscodeApi } from "vs/server/src/api";

/**
 * This is called by vs/workbench/browser/web.main.ts after the workbench has
 * been initialized so we can initialize our own client-side code.
 */
export const initialize = async (services: ServiceCollection): Promise<void> => {
	const target = window as any;
	target.ide = coderApi(services);
	target.vscode = vscodeApi(services);

	const event = new CustomEvent("ide-ready");
	(event as any).ide = target.ide;
	(event as any).vscode = target.vscode;
	window.dispatchEvent(event);
};
