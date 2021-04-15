import * as path from 'vs/base/common/path';
import { URI } from 'vs/base/common/uri';
import { Options } from 'vs/ipc';
import { localize } from 'vs/nls';
import { Extensions, IConfigurationRegistry } from 'vs/platform/configuration/common/configurationRegistry';
import { registerSingleton } from 'vs/platform/instantiation/common/extensions';
import { ServiceCollection } from 'vs/platform/instantiation/common/serviceCollection';
import { ILogService } from 'vs/platform/log/common/log';
import { INotificationService, Severity } from 'vs/platform/notification/common/notification';
import { Registry } from 'vs/platform/registry/common/platform';
import { IStorageService, StorageScope, StorageTarget } from 'vs/platform/storage/common/storage';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { TelemetryChannelClient } from 'vs/server/common/telemetry';
import 'vs/workbench/contrib/localizations/browser/localizations.contribution';
import 'vs/workbench/services/localizations/browser/localizationsService';
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService';

class TelemetryService extends TelemetryChannelClient {
	public constructor(
		@IRemoteAgentService remoteAgentService: IRemoteAgentService,
	) {
		super(remoteAgentService.getConnection()!.getChannel('telemetry'));
	}
}

/**
 * Remove extra slashes in a URL.
 */
export const normalize = (url: string, keepTrailing = false): string => {
	return url.replace(/\/\/+/g, '/').replace(/\/+$/, keepTrailing ? '/' : '');
};

/**
 * Get options embedded in the HTML.
 */
export const getOptions = <T extends Options>(): T => {
	try {
		return JSON.parse(document.getElementById('coder-options')!.getAttribute('data-settings')!);
	} catch (error) {
		return {} as T;
	}
};

const options = getOptions();

const TELEMETRY_SECTION_ID = 'telemetry';
Registry.as<IConfigurationRegistry>(Extensions.Configuration).registerConfiguration({
	'id': TELEMETRY_SECTION_ID,
	'order': 110,
	'type': 'object',
	'title': localize('telemetryConfigurationTitle', 'Telemetry'),
	'properties': {
		'telemetry.enableTelemetry': {
			'type': 'boolean',
			'description': localize('telemetry.enableTelemetry', 'Enable usage data and errors to be sent to a Microsoft online service.'),
			'default': !options.disableTelemetry,
			'tags': ['usesOnlineServices']
		}
	}
});

registerSingleton(ITelemetryService, TelemetryService);

/**
 * This is called by vs/workbench/browser/web.main.ts after the workbench has
 * been initialized so we can initialize our own client-side code.
 */
export const initialize = async (services: ServiceCollection): Promise<void> => {
	const event = new CustomEvent('ide-ready');
	window.dispatchEvent(event);

	if (parent) {
		// Tell the parent loading has completed.
		parent.postMessage({ event: 'loaded' }, '*');

		// Proxy or stop proxing events as requested by the parent.
		const listeners = new Map<string, (event: Event) => void>();
		window.addEventListener('message', (parentEvent) => {
			const eventName = parentEvent.data.bind || parentEvent.data.unbind;
			if (eventName) {
				const oldListener = listeners.get(eventName);
				if (oldListener) {
					document.removeEventListener(eventName, oldListener);
				}
			}

			if (parentEvent.data.bind && parentEvent.data.prop) {
				const listener = (event: Event) => {
					parent.postMessage({
						event: parentEvent.data.event,
						[parentEvent.data.prop]: event[parentEvent.data.prop as keyof Event]
					}, window.location.origin);
				};
				listeners.set(parentEvent.data.bind, listener);
				document.addEventListener(parentEvent.data.bind, listener);
			}
		});
	}

	if (!window.isSecureContext) {
		(services.get(INotificationService) as INotificationService).notify({
			severity: Severity.Warning,
			message: 'code-server is being accessed over an insecure domain. Web views, the clipboard, and other functionality will not work as expected.',
			actions: {
				primary: [{
					id: 'understand',
					label: 'I understand',
					tooltip: '',
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

	const logService = (services.get(ILogService) as ILogService);
	const storageService = (services.get(IStorageService) as IStorageService);
	const updateCheckEndpoint = path.join(options.base, '/update/check');
	const getUpdate = async (): Promise<void> => {
		logService.debug('Checking for update...');

		const response = await fetch(updateCheckEndpoint, {
			headers: { 'Accept': 'application/json' },
		});
		if (!response.ok) {
			throw new Error(response.statusText);
		}
		const json = await response.json();
		if (json.error) {
			throw new Error(json.error);
		}
		if (json.isLatest) {
			return;
		}

		const lastNoti = storageService.getNumber('csLastUpdateNotification', StorageScope.GLOBAL);
		if (lastNoti) {
			// Only remind them again after 1 week.
			const timeout = 1000*60*60*24*7;
			const threshold = lastNoti + timeout;
			if (Date.now() < threshold) {
				return;
			}
		}

		storageService.store('csLastUpdateNotification', Date.now(), StorageScope.GLOBAL, StorageTarget.MACHINE);
		(services.get(INotificationService) as INotificationService).notify({
			severity: Severity.Info,
			message: `[code-server v${json.latest}](https://github.com/cdr/code-server/releases/tag/v${json.latest}) has been released!`,
		});
	};

	const updateLoop = (): void => {
		getUpdate().catch((error) => {
			logService.debug(`failed to check for update: ${error}`);
		}).finally(() => {
			// Check again every 6 hours.
			setTimeout(updateLoop, 1000*60*60*6);
		});
	};

	if (!options.disableUpdateCheck) {
		updateLoop();
	}

	// This will be used to set the background color while VS Code loads.
	const theme = storageService.get('colorThemeData', StorageScope.GLOBAL);
	if (theme) {
		localStorage.setItem('colorThemeData', theme);
	}
};

export interface Query {
	[key: string]: string | undefined;
}

/**
 * Split a string up to the delimiter. If the delimiter doesn't exist the first
 * item will have all the text and the second item will be an empty string.
 */
export const split = (str: string, delimiter: string): [string, string] => {
	const index = str.indexOf(delimiter);
	return index !== -1 ? [str.substring(0, index).trim(), str.substring(index + 1)] : [str, ''];
};

/**
 * Return the URL modified with the specified query variables. It's pretty
 * stupid so it probably doesn't cover any edge cases. Undefined values will
 * unset existing values. Doesn't allow duplicates.
 */
export const withQuery = (url: string, replace: Query): string => {
	const uri = URI.parse(url);
	const query = { ...replace };
	uri.query.split('&').forEach((kv) => {
		const [key, value] = split(kv, '=');
		if (!(key in query)) {
			query[key] = value;
		}
	});
	return uri.with({
		query: Object.keys(query)
			.filter((k) => typeof query[k] !== 'undefined')
			.map((k) => `${k}=${query[k]}`).join('&'),
	}).toString(true);
};
