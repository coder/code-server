import { exec } from "child_process";
import { promisify } from "util";
import { field, logger, time, Time } from "@coder/logger";
import { escapePath } from "@coder/protocol";
import { retry } from "./retry";

export interface IClientOptions {
	mkDirs?: string[];
}

/**
 * A general abstraction of an IDE client.
 *
 * Everything the client provides is asynchronous so you can wait on what
 * you need from it without blocking anything else.
 *
 * It also provides task management to help asynchronously load and time
 * external code.
 */
export class Client {

	public readonly mkDirs: Promise<void>;
	private start: Time | undefined;
	private readonly progressElement: HTMLElement | undefined;
	private tasks: string[];
	private finishedTaskCount: number;

	public constructor(options: IClientOptions) {
		this.tasks = [];
		this.finishedTaskCount = 0;
		this.progressElement = typeof document !== "undefined"
			? document.querySelector("#status > #progress > #fill") as HTMLElement
			: undefined;

		this.mkDirs = this.wrapTask("Creating directories", 100, async () => {
			if (options.mkDirs && options.mkDirs.length > 0) {
				await promisify(exec)(`mkdir -p ${options.mkDirs.map(escapePath).join(" ")}`);
			}
		});

		// Prevent Firefox from trying to reconnect when the page unloads.
		window.addEventListener("unload", () => {
			retry.block();
		});
	}

	/**
	 * Wrap a task in some logging, timing, and progress updates. Can optionally
	 * wait on other tasks which won't count towards this task's time.
	 */
	public async wrapTask<T>(description: string, duration: number, task: () => Promise<T>): Promise<T>;
	public async wrapTask<T, V>(description: string, duration: number, task: (v: V) => Promise<T>, t: Promise<V>): Promise<T>;
	public async wrapTask<T, V1, V2>(description: string, duration: number, task: (v1: V1, v2: V2) => Promise<T>, t1: Promise<V1>, t2: Promise<V2>): Promise<T>;
	public async wrapTask<T, V1, V2, V3>(description: string, duration: number, task: (v1: V1, v2: V2, v3: V3) => Promise<T>, t1: Promise<V1>, t2: Promise<V2>, t3: Promise<V3>): Promise<T>;
	public async wrapTask<T, V1, V2, V3, V4>(description: string, duration: number, task: (v1: V1, v2: V2, v3: V3, v4: V4) => Promise<T>, t1: Promise<V1>, t2: Promise<V2>, t3: Promise<V3>, t4: Promise<V4>): Promise<T>;
	public async wrapTask<T, V1, V2, V3, V4, V5>(description: string, duration: number, task: (v1: V1, v2: V2, v3: V3, v4: V4, v5: V5) => Promise<T>, t1: Promise<V1>, t2: Promise<V2>, t3: Promise<V3>, t4: Promise<V4>, t5: Promise<V5>): Promise<T>;
	public async wrapTask<T, V1, V2, V3, V4, V5, V6>(description: string, duration: number, task: (v1: V1, v2: V2, v3: V3, v4: V4, v5: V5, v6: V6) => Promise<T>, t1: Promise<V1>, t2: Promise<V2>, t3: Promise<V3>, t4: Promise<V4>, t5: Promise<V5>, t6: Promise<V6>): Promise<T>;
	public async wrapTask<T>(
		description: string, duration: number = 100, task: (...args: any[]) => Promise<T>, ...after: Array<Promise<any>> // tslint:disable-line no-any
	): Promise<T> {
		this.tasks.push(description);
		if (!this.start) {
			this.start = time(1000);
		}
		const updateProgress = (): void => {
			if (this.progressElement) {
				this.progressElement.style.width = `${Math.round((this.finishedTaskCount / (this.tasks.length + this.finishedTaskCount)) * 100)}%`;
			}
		};
		updateProgress();

		let start: Time | undefined;
		try {
			const waitFor = await (after && after.length > 0 ? Promise.all(after) : Promise.resolve([]));
			start = time(duration);
			logger.info(description);
			const value = await task(...waitFor);
			logger.info(`Finished "${description}"`, field("duration", start));
			const index = this.tasks.indexOf(description);
			if (index !== -1) {
				this.tasks.splice(index, 1);
			}
			++this.finishedTaskCount;
			updateProgress();
			if (this.tasks.length === 0) {
				logger.info("Finished all queued tasks", field("duration", this.start), field("count", this.finishedTaskCount));
				this.start = undefined;
			}

			return value;
		} catch (error) {
			logger.error(`Failed "${description}"`, field("duration", typeof start !== "undefined" ? start : "not started"), field("error", error));
			if (this.progressElement) {
				this.progressElement.style.backgroundColor = "red";
			}
			throw error;
		}
	}

}
