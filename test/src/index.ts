import { parseString as deserialize } from "xml2js";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as puppeteer from "puppeteer";
import { ChildProcess, spawn } from "child_process";
import { logger, field } from "@coder/logger";

import { GoogleCloudBucket } from "../storage/gcloud";

const bucket = new GoogleCloudBucket();

interface IServerOptions {
	host: string;
	port: number;
	binaryName: string;
	binaryHome: string;
	binaryPath?: string;
	auth: boolean;
	http: boolean;
	password: string;
}

// tslint:disable-next-line:no-any
type PropertyList = { [name: string]: any };

/**
 * Wrapper for de-serialized HTMLElements.
 */
class DeserializedNode {
	public tag: string;
	public textContent: string | undefined;
	public properties: PropertyList | undefined;
	public children: Array<DeserializedNode>;

	public constructor(opts: {
		tag?: string,
		textContent?: string,
		properties?: PropertyList,
		children?: Array<DeserializedNode>,
	}) {
		this.tag = opts && opts.tag ? opts.tag : "div";
		this.textContent = opts && opts.textContent ? opts.textContent : undefined;
		this.properties = opts && opts.properties ? opts.properties : undefined;
		this.children = opts && opts.children ? opts.children : [];
	}

	/**
	 * Parses de-serialized HTMLElements that have been
	 * returned from a headless browser page in raw Object
	 * format. Format is dictated by the de-serializing
	 * library.
	 */
	// tslint:disable-next-line:no-any
	public static from(obj: { [key: string]: any }): DeserializedNode {
		const objKeys = Reflect.ownKeys(obj);
		if (objKeys.length === 0) {
			throw new Error("cannot create node, raw object with no keys");
		}
		const tag = objKeys.shift() as string;
		let textContent: string | undefined;
		let properties: PropertyList | undefined;
		let children: Array<DeserializedNode> = [];

		const node = Reflect.get(obj, tag);
		if (Array.isArray(node)) {
			// For when there are multiple node values all on
			// the same level, such as an unordered list.
			node.forEach((arrVal) => {
				if (typeof arrVal !== "object") {
					return;
				}
				children.push(DeserializedNode.from({ [tag]: arrVal }));
			});
		} else {
			Reflect.ownKeys(node).forEach((nodeKey) => {
				const nodeVal = Reflect.get(node, nodeKey);
				switch (nodeKey as string) {
					case "$":
						properties = nodeVal;
						break;
					case "_":
						textContent = nodeVal;
						break;
					default:
						children.push(DeserializedNode.from({ [nodeKey]: nodeVal }));
				}
			});
		}

		return new DeserializedNode({ tag, textContent, properties, children });
	}
}

/**
 * Wrapper for puppeteer.Keyboard.
 */
class TestKeyboard {
	public constructor(
		private readonly page: puppeteer.Page,
		public readonly onKeyboardEvent: (fnName: string, state: "before" | "after") => Promise<void>,
	) { }

	/**
	 * Wrapper for sending individual keyboard up/down events
	 * to the page.
	 */
	public async press(key: string, options?: { text?: string, delay?: number }): Promise<void> {
		await this.onKeyboardEvent("press", "before");
		const prom = await this.page.keyboard.press(key, options);
		await this.onKeyboardEvent("press", "after");

		return prom;
	}

	/**
	 * Wrapper for sending keyboard events to the page.
	 */
	public async type(text: string, options?: { delay?: number }): Promise<void> {
		await this.onKeyboardEvent("type", "before");
		const prom = await this.page.keyboard.type(text, options);
		await this.onKeyboardEvent("type", "after");

		return prom;
	}
}

/**
 * Wrapper for puppeteer.Page.
 */
export class TestPage {
	public readonly keyboard: TestKeyboard;
	private screenshotCount = 0;

	public constructor(public readonly rootPage: puppeteer.Page, private readonly tag?: string) {
		this.keyboard = new TestKeyboard(rootPage, async (fnName, state): Promise<void> => {
			await this.screenshot(`keyboard-${fnName}_${state}`);
		});
	}

	/**
	 * Saves a screenshot of the headless page in the server's
	 * working directory. Useful for debugging.
	 *
	 * Screenshot path will be in the following format:
	 * `<screenshotDir>/[<page-tag>_]<screenshot-number>_<screenshot-name>.jpg`.
	 */
	public async screenshot(name: string, options?: puppeteer.ScreenshotOptions): Promise<string | Buffer> {
		const fileName = `${this.tag ? `${this.tag}_` : ""}${this.screenshotCount}_${name}.jpg`;
		options = Object.assign({
			path: path.resolve(TestServer.puppeteerDir, `./${fileName}`),
			fullPage: true,
			type: "jpeg",
		}, options);
		const img = await this.rootPage.screenshot(options);
		this.screenshotCount++;

		// If this is a Travis CI build, store the screenshots
		// for later.
		if (process.env.TRAVIS_OS_NAME && process.env.TRAVIS_BUILD_NUMBER) {
			const bucketPath = `Travis-${process.env.TRAVIS_BUILD_NUMBER}/${fileName}`;
			let buf: Buffer = typeof img === "string" ? Buffer.from(img as string) : img;
			try {
				const url = await bucket.write(bucketPath, buf);
				logger.info("stored screenshot",
					field("localPath", options.path),
					field("bucketPath", bucketPath),
					field("url", url),
				);
			} catch (ex) {
				logger.warn("failed to store screenshot",
					field("exception", ex),
					field("targetPath", bucketPath),
				);
			}
		}

		return img;
	}

	/**
	 * 1. Take a screenshot.
	 * 2. Run the function.
	 * 3. Take a screenshot.
	 */
	// tslint:disable-next-line:no-any
	public async recordFunc(fn: Function, ...args: any[]): Promise<any> {
		let err: Error | undefined;
		if (typeof fn !== "function" || fn.name === "") {
			err = new Error(JSON.stringify(fn));
			logger.debug("cannot record nameless function", field("trace", err.stack));
		}
		if (!err) {
			await this.screenshot(`${fn.name}_before`);
		}
		const result = await fn.apply(this.rootPage, args);
		if (!err) {
			await this.screenshot(`${fn.name}_after`);
		}

		return result;
	}

	/**
	 * Wrapper for puppeteer.Page.click().
	 */
	public click(selector: string, options?: puppeteer.ClickOptions): Promise<void> {
		return this.recordFunc(this.rootPage.click, selector, options);
	}

	public waitFor(duration: number): Promise<void>;
	public waitFor(selector: string, options?: puppeteer.WaitForSelectorOptions): Promise<puppeteer.ElementHandle>;
	public waitFor(selector: string, options: puppeteer.WaitForSelectorOptionsHidden): Promise<puppeteer.ElementHandle | null>;
	/**
	 * Wrapper for puppeteer.Page.waitFor()/puppeteer.Page.waitForSelector().
	 */
	public waitFor(durationOrSelector: number | string, options?: puppeteer.WaitForSelectorOptionsHidden | puppeteer.WaitForSelectorOptions): Promise<puppeteer.ElementHandle | null | void> {
		if (typeof durationOrSelector === "number") {
			return this.rootPage.waitFor(durationOrSelector);
		}

		return this.rootPage.waitFor(durationOrSelector, options);
	}

	/**
	 * Wrapper for puppeteer.Page.$eval().
	 */
	// tslint:disable-next-line:no-any
	public $eval<R>(selector: string, pageFunction: (element: Element, ...args: any[]) => R | Promise<R>, ...args: puppeteer.SerializableOrJSHandle[]): Promise<puppeteer.WrapElementHandle<R>> {
		return this.recordFunc(this.rootPage.$eval, selector, pageFunction, args);
	}
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
	private child: ChildProcess;

	// The directory to load the IDE with.
	public static readonly workingDir = path.resolve(__dirname, "../tmp/workspace/");
	// The directory to store puppeteer related files.
	public static readonly puppeteerDir = path.resolve(TestServer.workingDir, "../puppeteer/", Date.now().toString());

	public constructor(opts?: {
		host?: string,
		port?: number,
		binaryName?: string,
		binaryHome?: string,
		auth?: boolean,
		http?: boolean,
		password?: string,
	}) {
		this.options = {
			host: opts && opts.host ? opts.host : "localhost",
			port: opts && opts.port ? opts.port : 8443,
			// The binary path should be generic by default,
			// because the tests may be executed natively or
			// via Docker on multiple platforms.
			binaryName: opts && opts.binaryName ? opts.binaryName : `cli-${os.platform()}-${os.arch()}`,
			binaryHome: opts && opts.binaryHome ? opts.binaryHome : path.resolve(__dirname, "../../packages/server"),
			auth: opts && typeof opts.auth !== "undefined" ? opts.auth : false,
			http: opts && typeof opts.http !== "undefined" ? opts.http : true,
			password: opts && opts.password ? opts.password : "",
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
		return `http${this.options.http ? "" : "s"}://${this.options.host}:${this.options.port}`;
	}

	/**
	 * Start the code-server binary.
	 */
	public start(launchOptions?: puppeteer.LaunchOptions): Promise<void> {
		return new Promise<void>(async (res, rej): Promise<void> => {
			if (!this.options.binaryPath) {
				rej(new Error("binary path undefined"));

				return;
			}
			const args = [
				this.options.http ? "--allow-http" : "",
				`--port=${this.options.port}`,
				!this.options.auth ? "--no-auth" : "",
				this.options.password ? `--password=${this.options.password}` : "",
			];
			if (!fs.existsSync(TestServer.workingDir)) {
				fs.mkdirSync(TestServer.workingDir, { recursive: true });
			}
			if (!fs.existsSync(TestServer.puppeteerDir)) {
				fs.mkdirSync(TestServer.puppeteerDir, { recursive: true });
			}
			this.child = spawn(this.options.binaryPath, args, { cwd: TestServer.workingDir });
			if (!this.child.stdout) {
				await this.dispose();
				rej(new Error("failed to start, child process stdout unreadable"));
			}

			const onError = async (err: Error): Promise<void> => {
				await this.dispose();
				rej(new Error(`failed to start, ${err.message}`));
			};
			this.child.once("error", onError);
			if (this.child.stderr) {
				this.child.stderr.on("data", async (chunk) => {
					logger.warn("Child wrote to stderr", field("data", chunk.toString()));
				});
			}

			// Block until the server is ready for connections.
			const onData = (data: string): void => {
				if (!data.includes("Connected to shared process")) {
					this.child.stdout!.once("data", onData);

					return;
				}
				res();
			};
			this.child.stdout!.once("data", onData);

			launchOptions = Object.assign(launchOptions || {}, {
				devtools: !!process.env.LOG_LEVEL,
				defaultViewport: { width: 1280, height: 800 },
				args: ["--no-sandbox"],
			});
			this.browser = await puppeteer.launch(launchOptions);
		});
	}

	/**
	 * Load server URL in headless page, and wait for the page
	 * to emit the "ide-ready" event. After which, the page
	 * should be interactive.
	 */
	public async loadPage(page: puppeteer.Page, tag?: string): Promise<TestPage> {
		if (!page) {
			throw new Error(`cannot load page, ${JSON.stringify(page)}`);
		}
		await page.goto(this.url);
		await page.evaluate((): Promise<void> => {
			return new Promise<void>((res): void => {
				window.addEventListener("ide-ready", () => res());
			});
		});

		return new TestPage(page, tag);
	}

	/**
	 * Create a headless page.
	 */
	public async newPage(): Promise<puppeteer.Page> {
		if (!this.browser) {
			throw new Error("cannot create page, browser undefined");
		}

		return this.browser.newPage();
	}

	/**
	 * Kill the server process.
	 */
	public async dispose(): Promise<void> {
		if (this.browser) {
			await this.browser.close();
		}
		if (!this.child) {
			throw new Error("cannot dispose, process does not exist");
		}
		if (this.child.killed) {
			throw new Error("cannot dispose, already disposed");
		}
		this.child.kill("SIGTERM");
		setTimeout(() => this.child.kill("SIGKILL"), 5000);
	}

	/**
	 * Get elements on the page. Due to how puppeteer works
	 * with browser/page contexts, it isn't possible to
	 * directly return the Object structure of actual HTML
	 * Nodes/Elements. They have to be serialized in the
	 * browser context and then de-serialized in the test
	 * runner context.
	 */
	// tslint:disable-next-line:no-any
	public async querySelectorAll(page: puppeteer.Page | TestPage, selector: string): Promise<Array<DeserializedNode>> {
		if (!selector) {
			throw new Error("selector undefined");
		}

		// tslint:disable-next-line:no-any
		const elements: Array<DeserializedNode> = [];
		if (page instanceof TestPage) {
			page = page.rootPage;
		}
		const serializedElements = await page.evaluate((selector) => {
			// tslint:disable-next-line:no-any
			return new Promise<Array<string>>((res, rej): void => {
				const elements = Array.from(document.querySelectorAll(selector));
				if (!elements) {
					rej(new Error(`elements not found, '${selector}'`));

					return;
				}
				const serializer = new XMLSerializer();
				res(elements.map((el: Element) => serializer.serializeToString(el)));
			});
		}, selector);

		serializedElements.forEach((str) => {
			deserialize(str, (err, rawObj) => {
				if (err) {
					throw err;
				}
				elements.push(DeserializedNode.from(rawObj));
			});
		});

		return elements;
	}

	/**
	 * Get an element on the page. See `TestServer.querySelectorAll`.
	 */
	// tslint:disable-next-line:no-any
	public async querySelector(page: puppeteer.Page | TestPage, selector: string): Promise<DeserializedNode> {
		if (!selector) {
			throw new Error("selector undefined");
		}

		return (await this.querySelectorAll(page, selector))[0];
	}

	/**
	 * Issue `keydown` events on a series of keys, and then
	 * issue `keyup` events on those same keys. This allows for
	 * issuing combination keyboard shortcuts.
	 *
	 * See puppeteer docs for key-code definitions:
	 * https://github.com/GoogleChrome/puppeteer/blob/master/lib/USKeyboardLayout.js
	 */
	public async pressKeyboardCombo(page: TestPage, ...keys: string[]): Promise<void> {
		if (!keys || keys.length === 0) {
			throw new Error("no keys provided");
		}
		// Press the keys.
		for (let i = 0; i < keys.length; i++) {
			await page.rootPage.keyboard.down(keys[i]);
		}
		// Release the keys.
		for (let x = 0; x < keys.length; x++) {
			await page.rootPage.keyboard.up(keys[x]);
		}
	}
}
