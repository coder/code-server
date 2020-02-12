import { Emitter } from "vs/base/common/event";
import { URI } from "vs/base/common/uri";
import { localize } from "vs/nls";
import { Extensions, IConfigurationRegistry } from "vs/platform/configuration/common/configurationRegistry";
import { registerSingleton } from "vs/platform/instantiation/common/extensions";
import { ServiceCollection } from "vs/platform/instantiation/common/serviceCollection";
import { ILocalizationsService } from "vs/platform/localizations/common/localizations";
import { INotificationService, Severity } from "vs/platform/notification/common/notification";
import { Registry } from "vs/platform/registry/common/platform";
import { PersistentConnectionEventType } from "vs/platform/remote/common/remoteAgentConnection";
import { ITelemetryService } from "vs/platform/telemetry/common/telemetry";
import { INodeProxyService, NodeProxyChannelClient } from "vs/server/src/common/nodeProxy";
import { TelemetryChannelClient } from "vs/server/src/common/telemetry";
import { split } from "vs/server/src/common/util";
import "vs/workbench/contrib/localizations/browser/localizations.contribution";
import { LocalizationsService } from "vs/workbench/services/localizations/electron-browser/localizationsService";
import { IRemoteAgentService } from "vs/workbench/services/remote/common/remoteAgentService";

class TelemetryService extends TelemetryChannelClient {
	public constructor(
		@IRemoteAgentService remoteAgentService: IRemoteAgentService,
	) {
		super(remoteAgentService.getConnection()!.getChannel("telemetry"));
	}
}

const TELEMETRY_SECTION_ID = "telemetry";

Registry.as<IConfigurationRegistry>(Extensions.Configuration).registerConfiguration({
	"id": TELEMETRY_SECTION_ID,
	"order": 110,
	"type": "object",
	"title": localize("telemetryConfigurationTitle", "Telemetry"),
	"properties": {
		"telemetry.enableTelemetry": {
			"type": "boolean",
			"description": localize("telemetry.enableTelemetry", "Enable usage data and errors to be sent to a Microsoft online service."),
			"default": true,
			"tags": ["usesOnlineServices"]
		}
	}
});

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

/**
 * This is called by vs/workbench/browser/web.main.ts after the workbench has
 * been initialized so we can initialize our own client-side code.
 */
export const initialize = async (services: ServiceCollection): Promise<void> => {
	const event = new CustomEvent("ide-ready");
	window.dispatchEvent(event);

	if (!window.isSecureContext) {
		(services.get(INotificationService) as INotificationService).notify({
			severity: Severity.Warning,
			message: "code-server is being accessed over an insecure domain. Some functionality may not work as expected.",
			actions: {
				primary: [{
					id: "understand",
					label: "I understand",
					tooltip: "",
					class: undefined,
					enabled: true,
					checked: true,
					dispose: () => undefined,
					run: () => {
						return Promise.resolve();
					}
				}],
			}
		});
	}
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
		const [key, value] = split(kv, "=");
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
