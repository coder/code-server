import { IPty } from "node-pty";
import { Module } from "../src/common/proxy";
import { createClient } from "./helpers";

describe("node-pty", () => {
	const client = createClient();
	const pty = client.modules[Module.NodePty];

	/**
	 * Returns a function that when called returns a promise that resolves with
	 * the next chunk of data from the process.
	 */
	const promisifyData = (proc: IPty): (() => Promise<string>) => {
		// Use a persistent callback instead of creating it in the promise since
		// otherwise we could lose data that comes in while no promise is listening.
		let onData: (() => void) | undefined;
		let buffer: string | undefined;
		proc.on("data", (data) => {
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

	it("should create shell", async () => {
		// Setting the config file to something that shouldn't exist so the test
		// isn't affected by custom configuration.
		const proc = pty.spawn("/bin/bash", ["--rcfile", "/tmp/test/nope/should/not/exist"], {
			cols: 100,
			rows: 10,
		});

		const getData = promisifyData(proc);

		// Wait for [hostname@user]$
		let data = "";
		while (!data.includes("$")) {
			data = await getData();
		}

		proc.kill();

		await new Promise((resolve): void => {
			proc.on("exit", resolve);
		});
	});

	it("should resize", async () => {
		// Requires the `tput lines` cmd to be available.
		// Setting the config file to something that shouldn't exist so the test
		// isn't affected by custom configuration.
		const proc = pty.spawn("/bin/bash", ["--rcfile", "/tmp/test/nope/should/not/exist"], {
			cols: 10,
			rows: 912,
		});

		const getData = promisifyData(proc);

		proc.write("tput lines\n");

		let data = "";
		while (!data.includes("912")) {
			data = await getData();
		}
		proc.resize(10, 219);
		proc.write("tput lines\n");

		while (!data.includes("219")) {
			data = await getData();
		}

		proc.kill();
		await new Promise((resolve): void => {
			proc.on("exit", resolve);
		});
	});

	it("should dispose", (done) => {
		setTimeout(() => {
			client.dispose();
			done();
		}, 100);
	});
});
