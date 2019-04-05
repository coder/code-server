import * as nativeNet from "net";
import { Module } from "../src/common/proxy";
import { createClient, Helper } from "./helpers";

describe("net", () => {
	const client = createClient();
	const net = client.modules[Module.Net];
	const helper = new Helper("net");

	beforeAll(async () => {
		await helper.prepare();
	});

	describe("Socket", () => {
		const socketPath = helper.tmpFile();
		let server: nativeNet.Server;

		beforeAll(async () => {
			await new Promise((r): void => {
				server = nativeNet.createServer().listen(socketPath, r);
			});
		});

		afterAll(() => {
			server.close();
		});

		it("should fail to connect", async () => {
			const socket = new net.Socket();

			const fn = jest.fn();
			socket.on("error", fn);

			socket.connect("/tmp/t/e/s/t/d/o/e/s/n/o/t/e/x/i/s/t");

			await new Promise((r): nativeNet.Socket => socket.on("close", r));

			expect(fn).toHaveBeenCalledTimes(1);
		});

		it("should remove event listener", async () => {
			const socket = new net.Socket();

			const fn1 = jest.fn();
			const fn2 = jest.fn();

			socket.on("error", fn1);
			socket.on("error", fn2);
			socket.off("error", fn1);

			socket.connect("/tmp/t/e/s/t/d/o/e/s/n/o/t/e/x/i/s/t");

			await new Promise((r): nativeNet.Socket => socket.on("close", r));
			expect(fn1).toHaveBeenCalledTimes(0);
			expect(fn2).toHaveBeenCalledTimes(1);
		});

		it("should connect", async () => {
			await new Promise((resolve): void => {
				const socket = net.createConnection(socketPath, () => {
					socket.end();
					socket.addListener("close", () => {
						resolve();
					});
				});
			});

			await new Promise((resolve): void => {
				const socket = new net.Socket();
				socket.connect(socketPath, () => {
					socket.end();
					socket.addListener("close", () => {
						resolve();
					});
				});
			});
		});

		it("should get data", (done) => {
			server.once("connection", (socket: nativeNet.Socket) => {
				socket.write("hi how r u");
			});

			const socket = net.createConnection(socketPath);

			socket.addListener("data", (data) => {
				expect(data.toString()).toEqual("hi how r u");
				socket.end();
				socket.addListener("close", () => {
					done();
				});
			});
		});

		it("should send data", (done) => {
			const clientSocket = net.createConnection(socketPath);
			clientSocket.write(Buffer.from("bananas"));
			server.once("connection", (socket: nativeNet.Socket) => {
				socket.addListener("data", (data) => {
					expect(data.toString()).toEqual("bananas");
					socket.end();
					clientSocket.addListener("end", () => {
						done();
					});
				});
			});
		});
	});

	describe("Server", () => {
		it("should listen", (done) => {
			const s = net.createServer();
			s.on("listening", () => s.close());
			s.on("close", () => done());
			s.listen(helper.tmpFile());
		});

		it("should get connection", async () => {
			let constructorListener: (() => void) | undefined;
			const s = net.createServer(() => {
				if (constructorListener) {
					constructorListener();
				}
			});

			const socketPath = helper.tmpFile();
			s.listen(socketPath);

			await new Promise((resolve): void => {
				s.on("listening", resolve);
			});

			const makeConnection = async (): Promise<void> => {
				net.createConnection(socketPath);
				await Promise.all([
					new Promise((resolve): void => {
						constructorListener = resolve;
					}),
					new Promise((resolve): void => {
						s.once("connection", (socket) => {
							socket.destroy();
							resolve();
						});
					}),
				]);
			};

			await makeConnection();
			await makeConnection();

			s.close();
			await new Promise((r): nativeNet.Server => s.on("close", r));
		});
	});

	it("should dispose", (done) => {
		setTimeout(() => {
			client.dispose();
			done();
		}, 100);
	});
});
