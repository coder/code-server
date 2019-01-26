import * as cp from "child_process";
import * as net from "net";
import * as os from "os";
import * as path from "path";
import { TextEncoder, TextDecoder } from "text-encoding";
import { createClient } from "./helpers";
import { Net } from "../src/browser/modules/net";

(global as any).TextDecoder = TextDecoder; // tslint:disable-line no-any
(global as any).TextEncoder = TextEncoder; // tslint:disable-line no-any

describe("spawn", () => {
	const client = createClient({
		dataDirectory: "",
		workingDirectory: "",
		forkProvider: (msg): cp.ChildProcess => {
			return cp.spawn(msg.getCommand(), msg.getArgsList(), {
				stdio: [null, null, null, "pipe"],
			});
		},
	});

	it("should execute command and return output", (done) => {
		const proc = client.spawn("echo", ["test"]);
		proc.stdout.on("data", (data) => {
			expect(data).toEqual("test\n");
		});
		proc.on("exit", (): void => {
			done();
		});
	});

	it("should create shell", (done) => {
		const proc = client.spawn("/bin/bash", [], {
			tty: {
				columns: 100,
				rows: 10,
			},
		});
		let first = true;
		proc.stdout.on("data", (data) => {
			if (first) {
				// First piece of data is a welcome msg. Second is the prompt
				first = false;

				return;
			}
			expect(data.toString().endsWith("$ ")).toBeTruthy();
			proc.kill();
		});
		proc.on("exit", () => done());
	});

	it("should cat", (done) => {
		const proc = client.spawn("cat", []);
		expect(proc.pid).toBeUndefined();
		proc.stdout.on("data", (data) => {
			expect(data).toEqual("banana");
			expect(proc.pid).toBeDefined();
			proc.kill();
		});
		proc.on("exit", () => done());
		proc.send("banana");
		proc.stdin.end();
	});

	it("should print env variable", (done) => {
		const proc = client.spawn("env", [], {
			env: { hi: "donkey" },
		});
		proc.stdout.on("data", (data) => {
			expect(data).toEqual("hi=donkey\n");
			done();
		});
	});

	it("should resize", (done) => {
		// Requires the `tput lines` cmd to be available

		const proc = client.spawn("/bin/bash", [], {
			tty: {
				columns: 10,
				rows: 10,
			},
		});
		let output: number = 0; // Number of outputs parsed
		proc.stdout.on("data", (data) => {
			output++;

			if (output === 1) {
				// First is welcome msg
				return;
			}

			if (output === 2) {
				proc.send("tput lines\n");

				return;
			}

			if (output === 3) {
				// Echo of tput lines
				return;
			}

			if (output === 4) {
				expect(data.toString().trim()).toEqual("10");
				proc.resize!({
					columns: 10,
					rows: 50,
				});

				return;
			}

			if (output === 5) {
				// Primpt
				return;
			}

			if (output === 6) {
				proc.send("tput lines\n");

				return;
			}

			if (output === 7) {
				// Echo of tput lines
				return;
			}

			if (output === 8) {
				expect(data.toString().trim()).toEqual("50");
				proc.kill();
				expect(proc.killed).toBeTruthy();
			}
		});
		proc.on("exit", () => done());
	});

	it("should fork and echo messages", (done) => {
		const proc = client.fork(path.join(__dirname, "forker.js"));
		proc.on("message", (msg) => {
			expect(msg.bananas).toBeTruthy();
			proc.kill();
		});
		proc.send({ bananas: true }, true);
		proc.on("exit", () => done());
	});
});

describe("createConnection", () => {
	const client = createClient();
	const tmpPath = path.join(os.tmpdir(), Math.random().toString());
	let server: net.Server;
	beforeAll(async () => {
		await new Promise((r): void => {
			server = net.createServer().listen(tmpPath, () => {
				r();
			});
		});
	});

	afterAll(() => {
		server.close();
	});

	it("should connect to socket", async () => {
		await new Promise((resolve): void => {
			const socket = client.createConnection(tmpPath, () => {
				socket.end();
				socket.addListener("close", () => {
					resolve();
				});
			});
		});

		await new Promise((resolve): void => {
			const socket = new (new Net(client)).Socket();
			socket.connect(tmpPath, () => {
				socket.end();
				socket.addListener("close", () => {
					resolve();
				});
			});
		});
	});

	it("should get data from server", (done) => {
		server.once("connection", (socket: net.Socket) => {
			socket.write("hi how r u");
		});

		const socket = client.createConnection(tmpPath);

		socket.addListener("data", (data) => {
			expect(data.toString()).toEqual("hi how r u");
			socket.end();
			socket.addListener("close", () => {
				done();
			});
		});
	});

	it("should send data to server", (done) => {
		const clientSocket = client.createConnection(tmpPath);
		clientSocket.write(Buffer.from("bananas"));
		server.once("connection", (socket: net.Socket) => {
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

describe("createServer", () => {
	const client = createClient();
	const tmpPath = path.join(os.tmpdir(), Math.random().toString());

	it("should connect to server", (done) => {
		const s = client.createServer(() => {
			s.close();
		});
		s.on("close", () => {
			done();
		});
		s.listen(tmpPath);
	});

	it("should connect to server and get socket connection", (done) => {
		const s = client.createServer();
		s.listen(tmpPath, () => {
			net.createConnection(tmpPath, () => {
				checks++;
				s.close();
			});
		});
		let checks = 0;
		s.on("connection", (con) => {
			expect(checks).toEqual(1);
			con.end();
			checks++;
		});
		s.on("close", () => {
			expect(checks).toEqual(2);
			done();
		});
	});
});
