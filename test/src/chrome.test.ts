import * as os from "os";
import * as puppeteer from "puppeteer";
import { TestServer } from "./index";

describe("chrome e2e", () => {
	const testFileName = `test-${Date.now()}.txt`;
	const server = new TestServer({ auth: false });
	beforeAll(async () => {
		await server.start();
	});
	afterAll(async () => {
		await server.dispose();
	});

	const workbenchQuickOpen = async (page: puppeteer.Page): Promise<void> => {
		const superKey = os.platform() === "darwin" ? "Meta" : "Control";
		await page.keyboard.down(superKey);
		await page.keyboard.down("P");
		await page.keyboard.up(superKey);
		await page.keyboard.up("P");
	};

	const workbenchShowCommands = async (page: puppeteer.Page): Promise<void> => {
		const superKey = os.platform() === "darwin" ? "Meta" : "Control";
		await page.keyboard.down(superKey);
		await page.keyboard.down("Shift");
		await page.keyboard.down("P");
		await page.keyboard.up(superKey);
		await page.keyboard.up("Shift");
		await page.keyboard.up("P");
	};

	it("should open IDE", async () => {
		const page = await server.newPage()
			.then(server.loadPage.bind(server));
		// Editor should be visible.
		const editor = await server.querySelector(page, "div.part.editor");
		expect(editor).toBeTruthy();
		expect(editor.tag).toEqual("div");
		expect(editor.properties).not.toBeUndefined();
		expect(editor.properties!["id"]).toBe("workbench.parts.editor");
		expect(editor.children.length).toBeGreaterThan(0);
	}, 3000);

	it("should create file", async () => {
		const page = await server.newPage()
			.then(server.loadPage.bind(server));
		await workbenchShowCommands(page);
		await page.waitFor(1000);
		await page.keyboard.type("New File", { delay: 100 });
		await page.keyboard.press("Enter");
		await page.waitFor(1000);
		await page.keyboard.type(testFileName, { delay: 100 });
		await page.keyboard.press("Enter");
		await page.waitFor(1000);
		const spanSelector = "div.part.sidebar div.monaco-tl-row span.monaco-highlighted-label span";
		// Check that the file is in the file tree.
		const elements = await server.querySelectorAll(page, spanSelector);
		expect(elements.length).toBeGreaterThan(0);
		const contentArray = elements.map((el) => el.textContent);
		expect(contentArray).toContain(testFileName);
	}, 15000);

	it("should delete file", async () => {
		const page = await server.newPage()
			.then(server.loadPage.bind(server));
		await workbenchQuickOpen(page);
		await page.waitFor(1000);
		await page.keyboard.type(testFileName, { delay: 100 });
		await page.keyboard.press("Enter");
		await page.waitFor(1000);
		const fileSelector = `div.monaco-tl-row div.monaco-icon-label.${testFileName.replace(".", "\\.")}-name-file-icon`;
		// Delete the file.
		await page.click(fileSelector);
		await page.waitFor(1000);
		const superKey = os.platform() === "darwin" ? "Meta" : "Control";
		await page.keyboard.down(superKey);
		await page.keyboard.down("Backspace");
		await page.keyboard.up(superKey);
		await page.keyboard.up("Backspace");
		await page.waitFor(1000);
		// Submit the delete-file popup.
		await page.keyboard.press("Enter");

		const spanSelector = "div.part.sidebar div.monaco-tl-row span.monaco-highlighted-label span";
		// Check that the file is NOT in the file tree.
		const elements = await server.querySelectorAll(page, spanSelector);
		expect(elements.length).toBeGreaterThanOrEqual(0);
		const contentArray = elements.map((el) => el.textContent);
		expect(contentArray).not.toContain(testFileName);
	}, 30000);
});
