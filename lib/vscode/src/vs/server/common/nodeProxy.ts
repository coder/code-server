import { ReadWriteConnection } from '@coder/node-browser';
import { Event } from 'vs/base/common/event';
import { IChannel, IServerChannel } from 'vs/base/parts/ipc/common/ipc';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';

export const INodeProxyService = createDecorator<INodeProxyService>('nodeProxyService');

export interface INodeProxyService extends ReadWriteConnection {
	_serviceBrand: any;
	send(message: string): void;
	onMessage: Event<string>;
	onUp: Event<void>;
	onClose: Event<void>;
	onDown: Event<void>;
}

export class NodeProxyChannel implements IServerChannel {
	constructor(private service: INodeProxyService) {}

	listen(_: unknown, event: string): Event<any> {
		switch (event) {
			case 'onMessage': return this.service.onMessage;
		}
		throw new Error(`Invalid listen ${event}`);
	}

	async call(_: unknown, command: string, args?: any): Promise<any> {
		switch (command) {
			case 'send': return this.service.send(args[0]);
		}
		throw new Error(`Invalid call ${command}`);
	}
}

export class NodeProxyChannelClient {
	_serviceBrand: any;

	public readonly onMessage: Event<string>;

	constructor(private readonly channel: IChannel) {
		this.onMessage = this.channel.listen<string>('onMessage');
	}

	public send(data: string): void {
		this.channel.call('send', [data]);
	}
}
