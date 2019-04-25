import * as puppeteer from "puppeteer";
import { TestServer } from "./index";

describe("startup e2e", () => {
	jest.setTimeout(20000);

	let servers: { [tag: string]: TestServer } = {};

	beforeAll(() => {
		const portServer = new TestServer({ port: 8081 });
		servers["--port"] = portServer;

		const passwordServer = new TestServer({
			auth: true,
			http: false,
			password: "test_test",
			port: 8080,
		});
		servers["--password"] = passwordServer;
	});
	afterAll(async () => {
		const keys = Object.keys(servers);
		for (let i = 0; i < keys.length; i++) {
			await servers[keys[i]].dispose();
		}
	});

	const expectEditor = async (server: TestServer, page: puppeteer.Page): Promise<void> => {
		// Editor should be visible.
		await page.waitFor("div.part.editor");
		const editor = await server.querySelector(page, "div.part.editor");
		expect(editor).toBeTruthy();
		expect(editor.tag).toEqual("div");
		expect(editor.properties).toBeDefined();
		expect(editor.properties!["id"]).toBe("workbench.parts.editor");
		expect(editor.children.length).toBeGreaterThan(0);
	};

	it("should use --port value", async () => {
		const server = servers["--port"];
		await server.start();
		const page = await server.newPage()
		await page.goto(server.url);

		await expectEditor(server, page);
	});

	it("should use --password value", async () => {
		const server = servers["--password"];
		await server.start({ ignoreHTTPSErrors: true });
		const page = await server.newPage();
		await page.goto(server.url);

		// Enter password.
		expect(server.options.password).toBeTruthy();
		await page.waitFor("input#password");
		await page.click("input#password");
		await page.keyboard.type(server.options.password, { delay: 100 });
		await page.click("button#submit");

		await expectEditor(server, page);
	});
});
