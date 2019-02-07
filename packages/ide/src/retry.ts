import { logger, field } from "@coder/logger";
import { NotificationService, INotificationHandle, INotificationService, Severity } from "./fill/notification";

interface IRetryItem {
	count?: number;
	delay?: number; // In seconds.
	end?: number;   // In ms.
	fn(): any | Promise<any>; // tslint:disable-line no-any can have different return values
	timeout?: number | NodeJS.Timer;
	running?: boolean;
	showInNotification: boolean;
}

/**
 * Retry services. Handles multiple services so when a connection drops the
 * user doesn't get a separate notification for each service.
 *
 * Attempts to restart services silently up to a maximum number of tries, then
 * starts waiting for a delay that grows exponentially with each attempt with a
 * cap on the delay. Once the delay is long enough, it will show a notification
 * to the user explaining what is happening with an option to immediately retry.
 */
export class Retry {
	private items = new Map<string, IRetryItem>();

	// Times are in seconds.
	private readonly retryMinDelay = 1;
	private readonly retryMaxDelay = 10;
	private readonly maxImmediateRetries = 5;
	private readonly retryExponent = 1.5;
	private blocked: string | boolean | undefined;

	private notificationHandle: INotificationHandle | undefined;
	private readonly updateDelay = 1;
	private updateTimeout: number | NodeJS.Timer | undefined;
	private readonly notificationThreshold = 3;

	// Time in milliseconds to wait before restarting a service. (See usage below
	// for reasoning.)
	private readonly waitDelay = 50;

	public constructor(private _notificationService: INotificationService) {}

	public set notificationService(service: INotificationService) {
		this._notificationService = service;
	}

	public get notificationService(): INotificationService {
		return this._notificationService;
	}

	/**
	 * Block retries when we know they will fail (for example when starting Wush
	 * back up). If a name is passed, that service will still be allowed to retry
	 * (unless we have already blocked).
	 *
	 * Blocking without a name will override a block with a name.
	 */
	public block(name?: string): void {
		if (!this.blocked || !name) {
			this.blocked = name || true;
			this.items.forEach((item) => {
				this.stopItem(item);
			});
		}
	}

	/**
	 * Unblock retries and run any that are pending.
	 */
	public unblock(): void {
		this.blocked = false;
		this.items.forEach((item, name) => {
			if (item.running) {
				this.runItem(name, item);
			}
		});
	}

	/**
	 * Register a function to retry that starts/connects to a service.
	 *
	 * If the function returns a promise, it will automatically be retried,
	 * recover, & unblock after calling `run` once (otherwise they need to be
	 * called manually).
	 */
	// tslint:disable-next-line no-any can have different return values
	public register(name: string, fn: () => any | Promise<any>, showInNotification: boolean = true): void {
		if (this.items.has(name)) {
			throw new Error(`"${name}" is already registered`);
		}
		this.items.set(name, { fn, showInNotification });
	}

	/**
	 * Unregister a function to retry.
	 */
	public unregister(name: string): void {
		if (!this.items.has(name)) {
			throw new Error(`"${name}" is not registered`);
		}
		this.items.delete(name);
	}

	/**
	 * Retry a service.
	 */
	public run(name: string, error?: Error): void {
		if (!this.items.has(name)) {
			throw new Error(`"${name}" is not registered`);
		}

		const item = this.items.get(name)!;
		if (item.running) {
			throw new Error(`"${name}" is already retrying`);
		}

		item.running = true;
		// This timeout is for the case when the connection drops; this allows time
		// for the socket service to come in and block everything because some other
		// services might make it here first and try to restart, which will fail.
		setTimeout(() => {
			if (this.blocked && this.blocked !== name) {
				return;
			}

			if (!item.count || item.count < this.maxImmediateRetries) {
				return this.runItem(name, item, error);
			}

			if (!item.delay) {
				item.delay = this.retryMinDelay;
			} else {
				item.delay = Math.ceil(item.delay * this.retryExponent);
				if (item.delay > this.retryMaxDelay) {
					item.delay = this.retryMaxDelay;
				}
			}

			logger.info(`Retrying ${name.toLowerCase()} in ${item.delay}s`, error && field("error", error.message));
			const itemDelayMs = item.delay * 1000;
			item.end = Date.now() + itemDelayMs;
			item.timeout = setTimeout(() => this.runItem(name, item, error), itemDelayMs);

			this.updateNotification();
		}, this.waitDelay);
	}

	/**
	 * Reset a service after a successfully recovering.
	 */
	public recover(name: string): void {
		if (!this.items.has(name)) {
			throw new Error(`"${name}" is not registered`);
		}

		const item = this.items.get(name)!;
		if (typeof item.timeout === "undefined" && !item.running && typeof item.count !== "undefined") {
			logger.info(`Connected to ${name.toLowerCase()}`);
			item.delay = undefined;
			item.count = undefined;
		}
	}

	/**
	 * Run an item.
	 */
	private runItem(name: string, item: IRetryItem, error?: Error): void {
		if (!item.count) {
			item.count = 1;
		} else {
			++item.count;
		}

		const retryCountText = item.count <= this.maxImmediateRetries
			? `[${item.count}/${this.maxImmediateRetries}]`
			: `[${item.count}]`;
		logger.info(`Starting ${name.toLowerCase()} ${retryCountText}...`, error && field("error", error.message));

		const endItem = (): void => {
			this.stopItem(item);
			item.running = false;
		};

		try {
			const maybePromise = item.fn();
			if (maybePromise instanceof Promise) {
				maybePromise.then(() => {
					endItem();
					this.recover(name);
					if (this.blocked === name) {
						this.unblock();
					}
				}).catch(() => {
					endItem();
					this.run(name);
				});
			} else {
				endItem();
			}
		} catch (error) {
			// Prevent an exception from causing the item to never run again.
			endItem();
			throw error;
		}
	}

	/**
	 * Update, close, or show the notification.
	 */
	private updateNotification(): void {
		// tslint:disable-next-line no-any because NodeJS.Timer is valid.
		clearTimeout(this.updateTimeout as any);

		const now = Date.now();
		const items = Array.from(this.items.entries()).filter(([_, item]) => {
			return item.showInNotification
				&& typeof item.end !== "undefined"
				&& item.end > now
				&& item.delay && item.delay >= this.notificationThreshold;
		}).sort((a, b) => {
			return a[1] < b[1] ? -1 : 1;
		});

		if (items.length === 0) {
			if (this.notificationHandle) {
				this.notificationHandle.close();
				this.notificationHandle = undefined;
			}

			return;
		}

		const join = (arr: string[]): string => {
			const last = arr.pop()!; // Assume length > 0.

			return arr.length > 0 ? `${arr.join(", ")} and ${last}` : last;
		};

		const servicesStr = join(items.map(([name, _]) => name.toLowerCase()));
		const message = `Lost connection to ${servicesStr}. Retrying in ${
			join(items.map(([_, item]) => `${Math.ceil((item.end! - now) / 1000)}s`))
		}.`;

		const buttons = [{
			label: `Retry ${items.length > 1 ? "Services" : items[0][0]} Now`,
			run: (): void => {
				logger.info(`Forcing ${servicesStr} to restart now`);
				items.forEach(([name, item]) => {
					this.runItem(name, item);
				});
				this.updateNotification();
			},
		}];

		if (!this.notificationHandle) {
			this.notificationHandle = this.notificationService.prompt(
				Severity.Info,
				message,
				buttons,
				() => {
					this.notificationHandle = undefined;
					// tslint:disable-next-line no-any because NodeJS.Timer is valid.
					clearTimeout(this.updateTimeout as any);
				},
			);
		} else {
			this.notificationHandle.updateMessage(message);
			this.notificationHandle.updateButtons(buttons);
		}

		this.updateTimeout = setTimeout(() => this.updateNotification(), this.updateDelay * 1000);
	}

	/**
	 * Stop an item's timer.
	 */
	private stopItem(item: IRetryItem): void {
		// tslint:disable-next-line no-any because NodeJS.Timer is valid.
		clearTimeout(item.timeout as any);
		item.timeout = undefined;
		item.end = undefined;
	}
}

// Global instance so we can block other retries when retrying the main
// connection.
export const retry = new Retry(new NotificationService());
