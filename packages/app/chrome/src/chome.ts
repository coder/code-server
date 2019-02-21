//@ts-ignore
import { TcpHost, TcpServer, TcpConnection } from "@coder/app/common/src/app";
import { Event, Emitter } from "@coder/events/src";

export const tcpHost: TcpHost = {
	listen(host: string, port: number): Promise<TcpServer> {
		const socketApi: {
			readonly tcpServer: {
				create(props: {}, cb: (createInfo: { readonly socketId: number }) => void): void;
				listen(socketId: number, address: string, port: number, callback: (result: number) => void): void;
				disconnect(socketId: number, callback: () => void): void;

				readonly onAccept: {
					addListener(callback: (info: { readonly socketId: number; readonly clientSocketId: number }) => void): void;
				};
			};
			readonly tcp: {
				readonly onReceive: {
					addListener(callback: (info: { readonly socketId: number; readonly data: ArrayBuffer; }) => void): void;
				};
				close(socketId: number, callback?: () => void): void;
				send(socketId: number, data: ArrayBuffer, callback?: () => void): void;
				setPaused(socketId: number, value: boolean): void;
			};
			// tslint:disable-next-line:no-any
		} = (<any>chrome).sockets;

		return new Promise((resolve, reject): void => {
			socketApi.tcpServer.create({}, (createInfo) => {
				const serverSocketId = createInfo.socketId;
				socketApi.tcpServer.listen(serverSocketId, host, port, (result) => {
					if (result < 0) {
						return reject("Failed to listen: " + chrome.runtime.lastError);
					}

					const connectionEmitter = new Emitter<TcpConnection>();

					socketApi.tcpServer.onAccept.addListener((info) => {
						if (info.socketId !== serverSocketId) {
							return;
						}

						const dataEmitter = new Emitter<ArrayBuffer>();

						socketApi.tcp.onReceive.addListener((recvInfo) => {
							if (recvInfo.socketId !== info.clientSocketId) {
								return;
							}

							dataEmitter.emit(recvInfo.data);
						});

						socketApi.tcp.setPaused(info.clientSocketId, false);

						connectionEmitter.emit({
							send: (data): Promise<void> => {
								return new Promise<void>((res): void => {
									socketApi.tcp.send(info.clientSocketId, data, () => {
										res();
									});
								});
							},
							close: (): Promise<void> => {
								return new Promise((res): void => {
									socketApi.tcp.close(info.clientSocketId, () => {
										res();
									});
								});
							},
							get onData(): Event<ArrayBuffer> {
								return dataEmitter.event;
							},
						});
					});

					resolve({
						get onConnection(): Event<TcpConnection> {
							return connectionEmitter.event;
						},
						close: (): Promise<void> => {
							return new Promise((res): void => {
								socketApi.tcpServer.disconnect(serverSocketId, () => {
									res();
								});
							});
						},
					});
				});
			});
		});
	},
};
