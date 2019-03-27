import * as os from "os";
import * as path from "path";
import * as ps from "ps-list";
import { ChildProcess, exec } from "child_process";

interface IServerOptions {
	scheme: string;
	host: string;
	port: number;
	binaryName: string;
	binaryHome: string;
	binaryPath?: string;
	auth: boolean;
	password: string;
}

/**
 * Wraps common code for end-to-end testing, like starting up
 * the code-server binary.
 */
export class TestServer {
	public readonly options: IServerOptions;

	// @ts-ignore
	private child: ChildProcess;

	public constructor(opts: {
		scheme?: string,
		host?: string,
		port?: number,
		binaryName?: string,
		binaryHome?: string,
		auth?: boolean,
		password?: string,
	}) {
		this.options = {
			scheme: opts && opts.scheme ? opts.scheme : "https",
			host: opts && opts.host ? opts.host : "ide.test.localhost",
			port: opts && opts.port ? opts.port : 8443,
			binaryName: opts && opts.binaryName ? opts.binaryName : `cli-${os.platform()}-${os.arch()}`,
			binaryHome: opts && opts.binaryHome ? opts.binaryHome : "server",
			auth: opts && typeof opts.auth !== "undefined" ? opts.auth : false,
			password: opts && opts.password ? opts.password : "",
		};
		if (!this.options.auth && this.options.scheme === "https") {
			this.options.scheme = "http";
		}
		this.options.binaryPath = path.join(
			this.options.binaryHome,
			os.platform() === "win32" ? "\\" : "/",
			this.options.binaryName,
		);
	}

	/**
	 * Get the full URL for the server.
	 */
	public get url(): string {
		return `${this.options.scheme}://${this.options.host}:${this.options.port}`;
	}

	/**
	 * Start the code-server binary.
	 */
	public start(): void {
		if (!this.options.binaryPath) {
			throw new Error("binary path undefined");
		}
		const args = [
			"--allow-http",
			`--port=${this.options.port}`,
			`${!this.options.auth ? "--no-auth" : ""}`,
			`${this.options.password ? `--password=${this.options.password}` : ""}`,
			__dirname,
		];
		this.child = exec(`${this.options.binaryPath} ${args.join(" ")}`);
		this.child.on("error", (err) => {
			this.dispose();
			throw new Error(`failed to start, ${err.message}`);
		});
	}

	/**
	 * Run a test and cleanup if there's an unexpected failure.
	 */
	public test(msg: string, cb: () => Promise<void>, timeout: number = 1000): void {
		it(msg, () => cb().catch((ex) => {
			this.dispose();
			throw ex;
		}), timeout);
	}

	/**
	 * Kill the server process.
	 */
	public dispose(): void {
		if (!this.child) {
			throw new Error("cannot dispose, process does not exist");
		}
		if (this.child.killed) {
			throw new Error("cannot dispose, already disposed");
		}
		this.child.kill("SIGKILL");
	}

	/**
	 * Forcefully kill processes where the process name matches
	 * the current binary's name, but ignore the current process.
	 */
	public async killProcesses(): Promise<void> {
		// The name should never be empty, but we'll check
		// anyway since this is a potentially dangerous
		// operation.
		if (!this.options.binaryName) {
			throw new Error("cannot kill processes, binary name undefined");
		}
		(await ps.default({ all: false })).forEach((p) => {
			if (p.name !== this.options.binaryName || (this.child && p.pid === this.child.pid)) {
				return;
			}
			process.kill(p.pid, "SIGKILL");
		});
	}
}
