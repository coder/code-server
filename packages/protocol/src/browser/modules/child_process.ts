import * as cp from "child_process";
import { Client } from "../client";
import { useBuffer } from "../../common/util";

export class CP {

	public constructor(
		private readonly client: Client,
	) { }

	public exec = (
		command: string,
		options?: { encoding?: BufferEncoding | string | "buffer" | null } & cp.ExecOptions | null | ((error: Error | null, stdout: string, stderr: string) => void) | ((error: Error | null, stdout: Buffer, stderr: Buffer) => void),
		callback?: ((error: Error | null, stdout: string, stderr: string) => void) | ((error: Error | null, stdout: Buffer, stderr: Buffer) => void),
	): cp.ChildProcess => {
		// TODO: Probably should add an `exec` instead of using `spawn`, especially
		// since bash might not be available.
		const childProcess = this.client.spawn("bash", ["-c", command.replace(/"/g, "\\\"")]);

		let stdout = "";
		childProcess.stdout.on("data", (data) => {
			stdout += data.toString();
		});

		let stderr = "";
		childProcess.stderr.on("data", (data) => {
			stderr += data.toString();
		});

		childProcess.on("exit", (exitCode) => {
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

		// @ts-ignore TODO: not fully implemented
		return childProcess;
	}

	public fork = (modulePath: string, args?: string[] | cp.ForkOptions, options?: cp.ForkOptions): cp.ChildProcess => {
		if (options && options.env && options.env.AMD_ENTRYPOINT) {
			// @ts-ignore TODO: not fully implemented
			return this.client.bootstrapFork(
				options.env.AMD_ENTRYPOINT,
				Array.isArray(args) ? args : [],
				// @ts-ignore TODO: env is a different type
				Array.isArray(args) || !args ? options : args,
			);
		}

		// @ts-ignore TODO: not fully implemented
		return this.client.fork(
			modulePath,
			Array.isArray(args) ? args : [],
			// @ts-ignore TODO: env is a different type
			Array.isArray(args) || !args ? options : args,
		);
	}

	public spawn = (command: string, args?: string[] | cp.SpawnOptions, options?: cp.SpawnOptions): cp.ChildProcess => {
		// @ts-ignore TODO: not fully implemented
		return this.client.spawn(
			command,
			Array.isArray(args) ? args : [],
			// @ts-ignore TODO: env is a different type
			Array.isArray(args) || !args ? options : args,
		);
	}

}
