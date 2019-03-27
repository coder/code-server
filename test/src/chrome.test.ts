import { TestServer } from "./index";

describe("chrome e2e", () => {
	const server = new TestServer({ auth: false });
	beforeAll(async () => {
		await server.start();
	});
	beforeEach(async () => {
		await server.newPage();
	});
	afterAll(async () => {
		await server.dispose();
	});

	server.test("should open IDE", async () => {
		const page = await server.loadPage();
		const ideExists = await page.evaluate(() => {
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
});
