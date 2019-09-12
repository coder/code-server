import { URI } from "vs/base/common/uri";
import { registerSingleton } from "vs/platform/instantiation/common/extensions";
import { ServiceCollection } from "vs/platform/instantiation/common/serviceCollection";
import { ITelemetryService } from "vs/platform/telemetry/common/telemetry";
import { ILocalizationsService } from "vs/platform/localizations/common/localizations";
import { LocalizationsService } from "vs/platform/localizations/electron-browser/localizationsService";
import { IUpdateService } from "vs/platform/update/common/update";
import { UpdateService } from "vs/platform/update/electron-browser/updateService";
import { TelemetryChannelClient } from "vs/server/src/telemetry";
import { IUploadService, UploadService } from 'vs/server/src/upload';
import { IRemoteAgentService } from "vs/workbench/services/remote/common/remoteAgentService";

class TelemetryService extends TelemetryChannelClient {
	public constructor(
		@IRemoteAgentService remoteAgentService: IRemoteAgentService,
	) {
		super(remoteAgentService.getConnection()!.getChannel("telemetry"));
	}
}

registerSingleton(ILocalizationsService, LocalizationsService);
registerSingleton(ITelemetryService, TelemetryService);
registerSingleton(IUpdateService, UpdateService);
registerSingleton(IUploadService, UploadService, true);

import "vs/workbench/contrib/update/electron-browser/update.contribution";
import 'vs/workbench/contrib/localizations/browser/localizations.contribution';

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

export interface Query {
	[key: string]: string | undefined;
}

/**
 * Return the URL modified with the specified query variables. It's pretty
 * stupid so it probably doesn't cover any edge cases. Undefined values will
 * unset existing values. Doesn't allow duplicates.
 */
export const withQuery = (url: string, replace: Query): string => {
	const uri = URI.parse(url);
	const query = { ...replace };
	uri.query.split("&").forEach((kv) => {
		const [key, value] = kv.split("=", 2);
		if (!(key in query)) {
			query[key] = value;
		}
	});
	return uri.with({
		query: Object.keys(query)
			.filter((k) => typeof query[k] !== "undefined")
			.map((k) => `${k}=${query[k]}`).join("&"),
	}).toString(true);
};
