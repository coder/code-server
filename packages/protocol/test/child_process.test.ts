import { ChildProcess } from "child_process";
import * as path from "path";
import { Readable } from "stream";
import * as util from "util";
import { createClient } from "@coder/protocol/test";
import { Module } from "../src/common/proxy";

describe("child_process", () => {
	const client = createClient();
	const cp = client.modules[Module.ChildProcess];

	const getStdout = async (proc: ChildProcess): Promise<string> => {
		return new Promise((r): Readable => proc.stdout!.on("data", r))
		.then((s) => s.toString());
	};

	describe("exec", () => {
		it("should get exec stdout", async () => {
			await expect(util.promisify(cp.exec)("echo test", { encoding: "utf8" }))
				.resolves.toEqual({
					stdout: "test\n",
					stderr: "",
				});
		});
	});

	describe("spawn", () => {
		it("should get spawn stdout", async () => {
			const proc = cp.spawn("echo", ["test"]);
			await expect(Promise.all([
				getStdout(proc),
				new Promise((r): ChildProcess => proc.on("exit", r)),
			]).then((values) => values[0])).resolves.toEqual("test\n");
		});

		it("should cat", async () => {
			const proc = cp.spawn("cat", []);
			expect(proc.pid).toBe(-1);
			proc.stdin!.write("banana");
			await expect(getStdout(proc)).resolves.toBe("banana");

			proc.stdin!.end();
			proc.kill();

			expect(proc.pid).toBeGreaterThan(-1);
			await new Promise((r): ChildProcess => proc.on("exit", r));
		});

		it("should print env", async () => {
			const proc = cp.spawn("env", [], {
				env: { hi: "donkey" },
			});

			await expect(getStdout(proc)).resolves.toContain("hi=donkey\n");
		});

		it("should eval", async () => {
			const proc = cp.spawn("node", ["-e", "console.log('foo')"]);
			await expect(getStdout(proc)).resolves.toContain("foo");
		});
	});

	describe("fork", () => {
		it("should echo messages", async () => {
			const proc = cp.fork(path.join(__dirname, "forker.js"));

			proc.send({ bananas: true });

			await expect(new Promise((r): ChildProcess => proc.on("message", r)))
				.resolves.toMatchObject({
					bananas: true,
				});

			proc.kill();

			await new Promise((r): ChildProcess => proc.on("exit", r));
		});
	});

	it("should dispose", (done) => {
		setTimeout(() => {
			client.dispose();
			done();
		}, 100);
	});

	it("should disconnect", async () => {
		const client = createClient();
		const cp = client.modules[Module.ChildProcess];
		const proc = cp.fork(path.join(__dirname, "forker.js"));
		const fn = jest.fn();
		proc.on("error", fn);

		proc.send({ bananas: true });
		await expect(new Promise((r): ChildProcess => proc.on("message", r)))
			.resolves.toMatchObject({
				bananas: true,
			});

		client.dispose();
		expect(fn).toHaveBeenCalledWith(new Error("disconnected"));
	});
});
