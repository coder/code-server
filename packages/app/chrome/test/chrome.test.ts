import { resolve } from "path";
import * as puppeteer from "puppeteer";
import { TestServer } from "../../common/test";

describe("chrome e2e", () => {
	const server = new TestServer({ auth: false });
	let browser: puppeteer.Browser;
	let page: puppeteer.Page;
	beforeAll(async () => {
		await server.killProcesses();
		server.start();
		browser = await puppeteer.launch();
	});
	beforeEach(async () => {
		page = await browser.newPage();
	});
	afterAll(async () => {
		await browser.close();
		server.dispose();
		await server.killProcesses();
	});

	server.test("should open IDE", async () => {
		// page.once("load", async () => {
		// 	await page.goto(server.url);
		// 	await page.screenshot({ path: resolve(__dirname, "./screenshot-test.jpg"), fullPage: true });
		// });

		await page.waitFor(4000);
		await page.goto(server.url);
		await page.waitFor(4000);
		await page.screenshot({ path: resolve(__dirname, "./screenshot-test.jpg"), fullPage: true });
	}, 20000);
});
