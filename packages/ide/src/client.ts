import { field, logger, time, Time } from "@coder/logger";
import { SharedProcessData } from "@coder/protocol";
import { retry } from "./retry";
import { upload } from "./upload";
import { client } from "./fill/client";
import { clipboard } from "./fill/clipboard";
import { INotificationService, IProgressService } from "./fill/notification";
import "./fill/os"; // Ensure it fills before anything else waiting on initData.

/**
 * A general abstraction of an IDE client.
 *
 * Everything the client provides is asynchronous so you can wait on what
 * you need from it without blocking anything else.
 *
 * It also provides task management to help asynchronously load and time code.
 */
export abstract class IdeClient {
	public readonly retry = retry;
	public readonly clipboard = clipboard;
	public readonly upload = upload;

	private start: Time | undefined;
	private readonly tasks = <string[]>[];
	private finishedTaskCount = 0;
	private readonly loadTime: Time;

	public readonly initData = client.initData;
	public readonly sharedProcessData: Promise<SharedProcessData>;
	public readonly onSharedProcessActive = client.onSharedProcessActive;

	public constructor() {
		logger.info("Loading IDE");
		this.loadTime = time(2500);

		let appWindow: Window | undefined;

		window.addEventListener("beforeunload", (e) => {
			e.preventDefault(); // FireFox
			e.returnValue = ""; // Chrome
		});

		window.addEventListener("message", (event) => {
			if (event.data === "app") {
				appWindow = event.source as Window;
			}
		});

		this.sharedProcessData = new Promise((resolve): void => {
			let d = client.onSharedProcessActive((data) => {
				d.dispose();
				d = client.onSharedProcessActive(() => {
					d.dispose();
					this.retry.notificationService.error(
						new Error("Disconnected from shared process. Searching, installing, enabling, and disabling extensions will not work until the page is refreshed."),
					);
				});
				resolve(data);
			});
		});

		window.addEventListener("contextmenu", (event) => {
			event.preventDefault();
		});

		// Prevent Firefox from trying to reconnect when the page unloads.
		window.addEventListener("unload", () => {
			this.retry.block();
			logger.info("Unloaded");
		});

		this.initialize().then(() => {
			logger.info("Load completed", field("duration", this.loadTime));
			if (appWindow) {
				appWindow.postMessage("loaded", "*");
			}
		}).catch((error) => {
			logger.error(error.message);
			logger.warn("Load completed with errors", field("duration", this.loadTime));
		});
	}

	public async task<T>(description: string, duration: number, task: () => Promise<T>): Promise<T>;
	public async task<T, V>(description: string, duration: number, task: (v: V) => Promise<T>, t: Promise<V>): Promise<T>;
	public async task<T, V1, V2>(description: string, duration: number, task: (v1: V1, v2: V2) => Promise<T>, t1: Promise<V1>, t2: Promise<V2>): Promise<T>;
	public async task<T, V1, V2, V3>(description: string, duration: number, task: (v1: V1, v2: V2, v3: V3) => Promise<T>, t1: Promise<V1>, t2: Promise<V2>, t3: Promise<V3>): Promise<T>;
	public async task<T, V1, V2, V3, V4>(description: string, duration: number, task: (v1: V1, v2: V2, v3: V3, v4: V4) => Promise<T>, t1: Promise<V1>, t2: Promise<V2>, t3: Promise<V3>, t4: Promise<V4>): Promise<T>;
	public async task<T, V1, V2, V3, V4, V5>(description: string, duration: number, task: (v1: V1, v2: V2, v3: V3, v4: V4, v5: V5) => Promise<T>, t1: Promise<V1>, t2: Promise<V2>, t3: Promise<V3>, t4: Promise<V4>, t5: Promise<V5>): Promise<T>;
	public async task<T, V1, V2, V3, V4, V5, V6>(description: string, duration: number, task: (v1: V1, v2: V2, v3: V3, v4: V4, v5: V5, v6: V6) => Promise<T>, t1: Promise<V1>, t2: Promise<V2>, t3: Promise<V3>, t4: Promise<V4>, t5: Promise<V5>, t6: Promise<V6>): Promise<T>;
	/**
	 * Wrap a task in some logging, timing, and progress updates. Can optionally
	 * wait on other tasks which won't count towards this task's time.
	 */
	public async task<T>(
		description: string, duration: number = 100, task: (...args: any[]) => Promise<T>, ...after: Array<Promise<any>> // tslint:disable-line no-any
	): Promise<T> {
		this.tasks.push(description);
		if (!this.start) {
			this.start = time(1000);
		}

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
			if (this.tasks.length === 0) {
				logger.info("Finished all queued tasks", field("duration", this.start), field("count", this.finishedTaskCount));
				this.start = undefined;
			}

			return value;
		} catch (error) {
			logger.error(`Failed "${description}"`, field("duration", typeof start !== "undefined" ? start : "not started"), field("error", error));
			throw error;
		}
	}

	public set notificationService(service: INotificationService) {
		this.retry.notificationService = service;
		this.upload.notificationService = service;
	}

	public set progressService(service: IProgressService) {
		this.upload.progressService = service;
	}

	/**
	 * Initialize the IDE.
	 */
	protected abstract initialize(): Promise<void>;
}
