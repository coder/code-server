import * as cp from "child_process";
import { Client } from "../client";
import { useBuffer } from "./util";

export class CP {

	public constructor(
		private readonly client: Client,
	) { }

	public exec = (
		command: string,
		options?: { encoding?: BufferEncoding | string | "buffer" | null } & cp.ExecOptions | null | ((error: Error | null, stdout: string, stderr: string) => void) | ((error: Error | null, stdout: Buffer, stderr: Buffer) => void),
		callback?: ((error: Error | null, stdout: string, stderr: string) => void) | ((error: Error | null, stdout: Buffer, stderr: Buffer) => void),
	): cp.ChildProcess => {
		const process = this.client.spawn(command);

		let stdout = "";
		process.stdout.on("data", (data) => {
			stdout += data.toString();
		});

		let stderr = "";
		process.stderr.on("data", (data) => {
			stderr += data.toString();
		});

		process.on("exit", (exitCode) => {
			const error = exitCode !== 0 ? new Error(stderr) : null;
			if (typeof options === "function") {
				callback = options;
			}
			// @ts-ignore not sure how to make this work.
			callback(
				error,
				useBuffer(options) ? Buffer.from(stdout) : stdout,
				useBuffer(options) ? Buffer.from(stderr) : stderr,
			);
		});

		return process;
	}

	public fork = (modulePath: string): cp.ChildProcess => {
		return this.client.fork(modulePath);
	}

	public spawn = (command: string, args?: ReadonlyArray<string> | cp.SpawnOptions, _options?: cp.SpawnOptions): cp.ChildProcess => {
		return this.client.spawn(command, args, options);
	}

}
