import * as path from "path";
import { TextEncoder, TextDecoder } from "text-encoding";
import { createClient } from "./helpers";

(<any>global).TextDecoder = TextDecoder;
(<any>global).TextEncoder = TextEncoder;

describe("Command", () => {
	const client = createClient();

	it("should execute command and return output", (done) => {
		const proc = client.spawn("echo", ["test"]);
		proc.stdout.on("data", (data) => {
			expect(data).toEqual("test\n");
		});
		proc.on("exit", (code) => {
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
	
	it("should fork", (done) => {
		const proc = client.fork(path.join(__dirname, "forker.js"));
		proc.stdout.on("data", (data) => {
			expect(data).toEqual("test");
		});
		proc.on("exit", () => done());
	});
});