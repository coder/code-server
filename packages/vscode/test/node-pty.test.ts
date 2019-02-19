import { IPty } from "node-pty";
import { createClient } from "@coder/protocol/test";

const client = createClient();
jest.mock("../../ide/src/fill/client", () => ({ client }));
const pty = require("../src/fill/node-pty") as typeof import("node-pty");

describe("node-pty", () => {
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

	it("should resize", async () => {
		// Requires the `tput lines` cmd to be available.
		// Setting the config file to something that shouldn't exist so the test
		// isn't affected by custom configuration.
		const proc = pty.spawn("/bin/bash", ["--rcfile", "/tmp/test/nope/should/not/exist"], {
			cols: 10,
			rows: 10,
		});

		const getData = promisifyData(proc);

		// We've already tested these first two bits of output; see shell test.
		await getData();
		await getData();

		proc.write("tput lines\n");
		expect(await getData()).toContain("tput");

		expect((await getData()).trim()).toContain("10");
		proc.resize(10, 50);

		// The prompt again.
		await getData();
		await getData();

		proc.write("tput lines\n");
		expect(await getData()).toContain("tput");

		expect((await getData())).toContain("50");

		proc.kill();
		await new Promise((resolve): void => {
			proc.on("exit", resolve);
		});
	});
});
