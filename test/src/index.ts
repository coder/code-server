import * as os from "os";
import * as path from "path";
import * as ps from "ps-list";
import * as puppeteer from "puppeteer";
import { ChildProcess, exec } from "child_process";

interface IServerOptions {
	host: string;
	port: number;
	binaryName: string;
	binaryHome: string;
	binaryPath?: string;
	auth: boolean;
	password: string;
	workingDir: string;
}

/**
 * Wraps common code for end-to-end testing, like starting up
 * the code-server binary.
 */
export class TestServer {
	public readonly options: IServerOptions;
	// @ts-ignore
	public browser: puppeteer.Browser;
	// @ts-ignore
	public page: puppeteer.Page;

	// @ts-ignore
	private child: ChildProcess;

	public constructor(opts: {
		host?: string,
		port?: number,
		binaryName?: string,
		binaryHome?: string,
		auth?: boolean,
		password?: string,
		workingDir?: string,
	}) {
		this.options = {
			host: opts && opts.host ? opts.host : "ide.test.localhost",
			port: opts && opts.port ? opts.port : 8443,
			binaryName: opts && opts.binaryName ? opts.binaryName : `cli-${os.platform()}-${os.arch()}`,
			binaryHome: opts && opts.binaryHome ? opts.binaryHome : "../packages/server",
			auth: opts && typeof opts.auth !== "undefined" ? opts.auth : false,
			password: opts && opts.password ? opts.password : "",
			workingDir: "./tmp",
		};
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
		return `http://${this.options.host}:${this.options.port}`;
	}

	/**
	 * Start the code-server binary.
	 */
	public start(): Promise<void> {
		return new Promise<void>(async (res, rej): Promise<void> => {
			if (!this.options.binaryPath) {
				rej(new Error("binary path undefined"));

				return;
			}
			await this.killProcesses();
			const args = [
				"--allow-http",
				`--port=${this.options.port}`,
				`${!this.options.auth ? "--no-auth" : ""}`,
				`${this.options.password ? `--password=${this.options.password}` : ""}`,
				"./tmp",
			];
			this.child = exec(`${this.options.binaryPath} ${args.join(" ")}`);
			if (!this.child.stdout) {
				await this.dispose();
				rej(new Error("failed to start, child process stdout unreadable"));
			}

			const onError = async (err: Error): Promise<void> => {
				await this.dispose();
				rej(new Error(`failed to start, ${err.message}`));
			};
			this.child.once("error", onError);

			// Block until the server is ready for connections.
			const onData = (data: string): void => {
				if (!data.includes("Connected to shared process")) {
					this.child.stdout!.once("data", onData);

					return;
				}
				res();
			};
			this.child.stdout!.once("data", onData);

			this.browser = await puppeteer.launch();
		});
	}

	/**
	 * Load server URL in headless page, and wait for the page
	 * to emit the "ide-ready" event. After which, the page
	 * should be interactive.
	 */
	public async loadPage(): Promise<puppeteer.Page> {
		if (!this.page) {
			throw new Error("cannot load page, page undefined");
		}
		const ready = (): Promise<void> => {
			return new Promise<void>((res): void => {
				window.addEventListener("ide-ready", () => res());
			});
		};
		await this.page.goto(this.url);
		await this.page.evaluate(ready);

		return this.page;
	}

	/**
	 * Create a headless page.
	 */
	public async newPage(): Promise<puppeteer.Page> {
		if (!this.browser) {
			throw new Error("cannot create page, browser undefined");
		}
		this.page = await this.browser.newPage();

		return this.page;
	}

	/**
	 * Run a test. Catches unexpected failures and disposes of
	 * the server appropriately before throwing the error up to
	 * the test runner.
	 */
	public test(msg: string, cb: () => Promise<void>, timeout: number = 1000): void {
		it(msg, () => cb().catch(async (ex) => {
			await this.dispose();
			throw ex;
		}), timeout);
	}

	/**
	 * Kill the server process.
	 */
	public async dispose(): Promise<void> {
		if (this.browser) {
			await this.browser.close();
		}
		await this.killProcesses();
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
	private async killProcesses(): Promise<void> {
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
