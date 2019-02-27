import * as fs from "fs";
import * as nativeNet from "net";
import * as os from "os";
import * as path from "path";
import * as util from "util";
import * as rimraf from "rimraf";
import { createClient } from "@coder/protocol/test";

const client = createClient();
jest.mock("../src/fill/client", () => ({ client }));
const net = require("../src/fill/net") as typeof import("net");

describe("net", () => {
	let i = 0;
	const coderDir = path.join(os.tmpdir(), "coder", "net");
	const tmpFile = (): string => path.join(coderDir, `socket.${i++}`);

	beforeAll(async () => {
		try {
			await util.promisify(fs.mkdir)(path.dirname(coderDir));
		} catch (error) {
			if (error.code !== "EEXIST" && error.code !== "EISDIR") {
				throw error;
			}
		}
		await util.promisify(rimraf)(coderDir);
		await util.promisify(fs.mkdir)(coderDir);
	});

	describe("Socket", () => {
		const socketPath = tmpFile();
		let server: nativeNet.Server;

		beforeAll(async () => {
			await new Promise((r): void => {
				server = nativeNet.createServer().listen(socketPath, r);
			});
		});

		afterAll(() => {
			server.close();
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
			s.listen(tmpFile());
		});

		it("should get connection", async () => {
			let constructorListener: (() => void) | undefined;
			const s = net.createServer(() => {
				if (constructorListener) {
					constructorListener();
				}
			});

			const socketPath = tmpFile();
			s.listen(socketPath);

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
});
