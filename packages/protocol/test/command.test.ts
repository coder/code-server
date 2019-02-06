import * as cp from "child_process";
import * as net from "net";
import * as os from "os";
import * as path from "path";
import { TextEncoder, TextDecoder } from "text-encoding";
import { createClient } from "./helpers";
import { ChildProcess } from "../src/browser/command";

(global as any).TextDecoder = TextDecoder; // tslint:disable-line no-any
(global as any).TextEncoder = TextEncoder; // tslint:disable-line no-any

describe("spawn", () => {
	const client = createClient({
		dataDirectory: "",
		workingDirectory: "",
		builtInExtensionsDirectory: "",
		forkProvider: (msg): cp.ChildProcess => {
			return cp.spawn(msg.getCommand(), msg.getArgsList(), {
				stdio: [null, null, null, "ipc"],
			});
		},
	});

	/**
	 * Returns a function that when called returns a promise that resolves with
	 * the next chunk of data from the process.
	 */
	const promisifyData = (proc: ChildProcess): (() => Promise<string>) => {
		// Use a persistent callback instead of creating it in the promise since
		// otherwise we could lose data that comes in while no promise is listening.
		let onData: (() => void) | undefined;
		let buffer: string | undefined;
		proc.stdout.on("data", (data) => {
			// Remove everything that isn't a letter, number, or $ to avoid issues
			// with ANSI escape codes printing inside the test output.
			buffer = (buffer || "") + data.toString().replace(/[^a-zA-Z0-9$]/g, "");
			if (onData) {
				onData();
			}
		});

		return (): Promise<string> => new Promise((resolve): void => {
			onData = (): void => {
				if (typeof buffer !== "undefined") {
					const data = buffer;
					buffer = undefined;
					onData = undefined;
					resolve(data);
				}
			};
			onData();
		});
	};

	it("should execute command and return output", (done) => {
		const proc = client.spawn("echo", ["test"]);
		proc.stdout.on("data", (data) => {
			expect(data).toEqual("test\n");
		});
		proc.on("exit", (): void => {
			done();
		});
	});

	it("should create shell", async () => {
		// Setting the config file to something that shouldn't exist so the test
		// isn't affected by custom configuration.
		const proc = client.spawn("/bin/bash", ["--rcfile", "/tmp/test/nope/should/not/exist"], {
			tty: {
				columns: 100,
				rows: 10,
			},
		});

		const getData = promisifyData(proc);

		// First it outputs @hostname:cwd
		expect((await getData()).length).toBeGreaterThan(1);

		// Then it seems to overwrite that with a shorter prompt in the format of
		// [hostname@user]$
		expect((await getData())).toContain("$");

		proc.kill();

		await new Promise((resolve): void => {
			proc.on("exit", resolve);
		});
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

	it("should resize", async () => {
		// Requires the `tput lines` cmd to be available.
		// Setting the config file to something that shouldn't exist so the test
		// isn't affected by custom configuration.
		const proc = client.spawn("/bin/bash", ["--rcfile", "/tmp/test/nope/should/not/exist"], {
			tty: {
				columns: 10,
				rows: 10,
			},
		});

		const getData = promisifyData(proc);

		// We've already tested these first two bits of output; see shell test.
		await getData();
		await getData();

		proc.send("tput lines\n");
		expect(await getData()).toContain("tput");

		expect((await getData()).trim()).toContain("10");
		proc.resize!({
			columns: 10,
			rows: 50,
		});

		// The prompt again.
		await getData();
		await getData();

		proc.send("tput lines\n");
		expect(await getData()).toContain("tput");

		expect((await getData())).toContain("50");

		proc.kill();
		expect(proc.killed).toBeTruthy();
		await new Promise((resolve): void => {
			proc.on("exit", resolve);
		});
	});

	it("should fork and echo messages", (done) => {
		const proc = client.fork(path.join(__dirname, "forker.js"));
		proc.on("message", (msg) => {
			expect(msg.bananas).toBeTruthy();
			proc.kill();
		});
		proc.send({ bananas: true }, undefined, true);
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
			const socket = new client.Socket();
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
