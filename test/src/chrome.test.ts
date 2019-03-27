import { TestServer } from "./index";

describe("chrome e2e", () => {
	const server = new TestServer({ auth: false });
	beforeAll(async () => {
		await server.start();
	});
	beforeEach(async () => {
		await server.newPage();
		await server.loadPage();
	});
	afterAll(async () => {
		await server.dispose();
	});

	server.test("should open IDE", async () => {
		const ideExists = await server.page.evaluate(() => {
			return new Promise<boolean>((res, rej): void => {
				const editor = document.querySelector("div.part.editor");
				if (!editor) {
					rej(new Error("editor not found"));

					return;
				}
				res(true);
			});
		});
		expect(ideExists).toEqual(true);
	}, 2000);

	server.test("should create file", async () => {
		await server.page.hover("div.panel-header[aria-label='Files Explorer Section']");
		await server.page.click("a.action-label.icon.new-file");
	}, 2000);
});
