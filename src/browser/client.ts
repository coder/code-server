import { Emitter } from "vs/base/common/event";
import { URI } from "vs/base/common/uri";
import { registerSingleton } from "vs/platform/instantiation/common/extensions";
import { ServiceCollection } from "vs/platform/instantiation/common/serviceCollection";
import { ILocalizationsService } from "vs/platform/localizations/common/localizations";
import { LocalizationsService } from "vs/workbench/services/localizations/electron-browser/localizationsService";
import { ITelemetryService } from "vs/platform/telemetry/common/telemetry";
import { coderApi, vscodeApi } from "vs/server/src/browser/api";
import { IUploadService, UploadService } from "vs/server/src/browser/upload";
import { INodeProxyService, NodeProxyChannelClient } from "vs/server/src/common/nodeProxy";
import { TelemetryChannelClient } from "vs/server/src/common/telemetry";
import "vs/workbench/contrib/localizations/browser/localizations.contribution";
import { IRemoteAgentService } from "vs/workbench/services/remote/common/remoteAgentService";
import { PersistentConnectionEventType } from "vs/platform/remote/common/remoteAgentConnection";

class TelemetryService extends TelemetryChannelClient {
	public constructor(
		@IRemoteAgentService remoteAgentService: IRemoteAgentService,
	) {
		super(remoteAgentService.getConnection()!.getChannel("telemetry"));
	}
}

class NodeProxyService extends NodeProxyChannelClient implements INodeProxyService {
	private readonly _onClose = new Emitter<void>();
	public readonly onClose = this._onClose.event;
	private readonly _onDown = new Emitter<void>();
	public readonly onDown = this._onDown.event;
	private readonly _onUp = new Emitter<void>();
	public readonly onUp = this._onUp.event;

	public constructor(
		@IRemoteAgentService remoteAgentService: IRemoteAgentService,
	) {
		super(remoteAgentService.getConnection()!.getChannel("nodeProxy"));
		remoteAgentService.getConnection()!.onDidStateChange((state) => {
			switch (state.type) {
				case PersistentConnectionEventType.ConnectionGain:
					return this._onUp.fire();
				case PersistentConnectionEventType.ConnectionLost:
					return this._onDown.fire();
				case PersistentConnectionEventType.ReconnectionPermanentFailure:
					return this._onClose.fire();
			}
		});
	}
}

registerSingleton(ILocalizationsService, LocalizationsService);
registerSingleton(INodeProxyService, NodeProxyService);
registerSingleton(ITelemetryService, TelemetryService);
registerSingleton(IUploadService, UploadService, true);

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
