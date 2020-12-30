import { ITelemetryData } from 'vs/base/common/actions';
import { Event } from 'vs/base/common/event';
import { IChannel, IServerChannel } from 'vs/base/parts/ipc/common/ipc';
import { ClassifiedEvent, GDPRClassification, StrictPropertyCheck } from 'vs/platform/telemetry/common/gdprTypings';
import { ITelemetryInfo, ITelemetryService } from 'vs/platform/telemetry/common/telemetry';

export class TelemetryChannel implements IServerChannel {
	constructor(private service: ITelemetryService) {}

	listen(_: unknown, event: string): Event<any> {
		throw new Error(`Invalid listen ${event}`);
	}

	call(_: unknown, command: string, args?: any): Promise<any> {
		switch (command) {
			case 'publicLog': return this.service.publicLog(args[0], args[1], args[2]);
			case 'publicLog2': return this.service.publicLog2(args[0], args[1], args[2]);
			case 'publicLogError': return this.service.publicLogError(args[0], args[1]);
			case 'publicLogError2': return this.service.publicLogError2(args[0], args[1]);
			case 'setEnabled': return Promise.resolve(this.service.setEnabled(args[0]));
			case 'getTelemetryInfo': return this.service.getTelemetryInfo();
			case 'setExperimentProperty': return Promise.resolve(this.service.setExperimentProperty(args[0], args[1]));
		}
		throw new Error(`Invalid call ${command}`);
	}
}

export class TelemetryChannelClient implements ITelemetryService {
	_serviceBrand: any;

	// These don't matter; telemetry is sent to the Node side which decides
	// whether to send the telemetry event.
	public isOptedIn = true;
	public sendErrorTelemetry = true;

	constructor(private readonly channel: IChannel) {}

	public publicLog(eventName: string, data?: ITelemetryData, anonymizeFilePaths?: boolean): Promise<void> {
		return this.channel.call('publicLog', [eventName, data, anonymizeFilePaths]);
	}

	public publicLog2<E extends ClassifiedEvent<T> = never, T extends GDPRClassification<T> = never>(eventName: string, data?: StrictPropertyCheck<T, E>, anonymizeFilePaths?: boolean): Promise<void> {
		return this.channel.call('publicLog2', [eventName, data, anonymizeFilePaths]);
	}

	public publicLogError(errorEventName: string, data?: ITelemetryData): Promise<void> {
		return this.channel.call('publicLogError', [errorEventName, data]);
	}

	public publicLogError2<E extends ClassifiedEvent<T> = never, T extends GDPRClassification<T> = never>(eventName: string, data?: StrictPropertyCheck<T, E>): Promise<void> {
		return this.channel.call('publicLogError2', [eventName, data]);
	}

	public setEnabled(value: boolean): void {
		this.channel.call('setEnable', [value]);
	}

	public getTelemetryInfo(): Promise<ITelemetryInfo> {
		return this.channel.call('getTelemetryInfo');
	}

	public setExperimentProperty(name: string, value: string): void {
		this.channel.call('setExperimentProperty', [name, value]);
	}
}
