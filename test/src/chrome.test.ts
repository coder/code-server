import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as puppeteer from "puppeteer";
import { TestServer } from "./index";
import { logger, field } from "@coder/logger";

describe("chrome e2e", () => {
	jest.setTimeout(60000);

	const superKey: string = os.platform() === "darwin" ? "Meta" : "Control";
	const testFileName = `test-${Date.now()}.js`;
	const jsSnippetsDesc = "JavaScript Snippets. Press enter for extension details.";
	const installSelector = `div.extensions-list div.monaco-list-row[aria-label='${jsSnippetsDesc}'] a.extension-action.install`;
	const manageSelector = `div.extensions-list div.monaco-list-row[aria-label='${jsSnippetsDesc}'] a.extension-action.manage`;

	const server = new TestServer();
	beforeAll(async () => {
		await server.start();
	});
	afterAll(async () => {
		await server.dispose();
		const testFilePath = path.resolve(TestServer.workingDir, testFileName);
		if (fs.existsSync(testFilePath)) {
			logger.debug("Deleting leftover test file", field("path", testFilePath));
			fs.unlinkSync(testFilePath);
		}
	});

	const workbenchQuickOpen = (page: puppeteer.Page): Promise<void> => {
		return page.waitFor("div.part.sidebar")
			.then(() => page.click("div.part.sidebar"))
			.then(() => server.pressKeyboardCombo(page, superKey, "P"));
	};

	const workbenchShowCommands = (page: puppeteer.Page): Promise<void> => {
		return page.waitFor("div.part.sidebar")
			.then(() => page.click("div.part.sidebar"))
			.then(() => server.pressKeyboardCombo(page, superKey, "Shift", "P"));
	};

	// Select all text in the search field, to avoid
	// invalid queries.
	const selectAll = (page: puppeteer.Page): Promise<void> => {
		return server.pressKeyboardCombo(page, superKey, "A");
	};

	it("should open IDE", async () => {
		const page = await server.newPage()
			.then(server.loadPage.bind(server));

		// Editor should be visible.
		const editor = await server.querySelector(page, "div.part.editor");
		expect(editor).toBeTruthy();
		expect(editor.tag).toEqual("div");
		expect(editor.properties).toBeDefined();
		expect(editor.properties!["id"]).toBe("workbench.parts.editor");
		expect(editor.children.length).toBeGreaterThan(0);
	});

	it("should create file", async () => {
		const page = await server.newPage()
			.then(server.loadPage.bind(server));
		await page.waitFor("div.part.sidebar");
		await page.click("div.part.sidebar");
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
	});

	it("should open file", async () => {
		const page = await server.newPage()
			.then(server.loadPage.bind(server));
		await page.waitFor("div.part.sidebar");
		await page.click("div.part.sidebar");
		await workbenchQuickOpen(page);
		await page.waitFor(1000);
		await page.keyboard.type(testFileName, { delay: 100 });
		await page.keyboard.press("Enter");
		const tabSelector = `div.tab div.monaco-icon-label.${testFileName.replace(".", "\\.")}-name-file-icon`;
		await page.waitFor(tabSelector);

		// Check that the file is in an editor tab.
		const tab = await server.querySelector(page, tabSelector);
		expect(tab).toBeTruthy();
		expect(tab.tag).toEqual("div");
		expect(tab.properties).not.toBeUndefined();
		expect(tab.properties!["title"]).toContain(testFileName);
		expect(tab.children.length).toBeGreaterThan(0);
	});

	it("should install extension", async () => {
		const page = await server.newPage()
			.then(server.loadPage.bind(server));
		await workbenchShowCommands(page);
		await page.waitFor(1000);
		await page.keyboard.type("install extensions", { delay: 100 });
		await page.waitFor(1000);
		const commandSelector = "div.quick-open-tree div.monaco-tree-row[aria-label*='Install Extensions, commands, picker']";
		await page.waitFor(commandSelector);
		await page.click(commandSelector);
		await page.waitFor(1000);

		// Search for javascript extensions.
		await selectAll(page);
		await page.keyboard.type("javascript", { delay: 100 });
		await page.keyboard.press("Enter");
		await page.waitFor(2000);

		// Install extension.
		await page.click(installSelector);

		// Wait for installation.
		await page.waitFor(15000);

		// Check that the extension management button exists.
		const manageButton = await server.querySelector(page, manageSelector);
		expect(manageButton).toBeTruthy();
		expect(manageButton.tag).toEqual("a");
		expect(manageButton.textContent).toBeUndefined();
	});

	it("should debug file", async () => {
		const page = await server.newPage()
			.then(server.loadPage.bind(server));
		await page.waitFor("div.part.sidebar");
		await page.click("div.part.sidebar");
		await workbenchQuickOpen(page);
		await page.waitFor(1000);
		await page.keyboard.type(testFileName, { delay: 100 });
		await page.keyboard.press("Enter");
		await page.waitFor(1000);

		// Start code block.
		await page.keyboard.type(`console.log("hello");
	function test() {
	console.log("foo bar");`, { delay: 50 });

		// Toggle breakpoint.
		await page.keyboard.press("F9");
		await page.waitFor(500);

		// Finish code block.
		await page.keyboard.type(`
	const world = "world";
	return world;`, { delay: 50 });
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");
		await page.keyboard.type("test();", { delay: 50 });
		await page.waitFor(1000);

		// Ensure that we're using a fresh debug configuration.
		const launchConfigPath = path.resolve(TestServer.workingDir, "./.vscode/launch.json");
		if (fs.existsSync(launchConfigPath)) {
			fs.unlinkSync(launchConfigPath);
		}

		// Start debugging.
		await page.keyboard.press("F5");

		// Check debugger console.
		const spanSelector = "div#workbench\\\.parts\\\.panel div.output span.value.info span span";
		await page.waitFor(spanSelector);
		let spans = await server.querySelectorAll(page, spanSelector);
		let lastSpan = spans.pop();
		expect(lastSpan).toBeDefined();
		expect(lastSpan!.textContent).toEqual("hello");

		// Continue past breakpoint.
		await page.keyboard.press("F5");
		await page.waitFor(2000);

		// Check debugger console again.
		spans = await server.querySelectorAll(page, spanSelector);
		lastSpan = spans.pop();
		expect(lastSpan).toBeDefined();
		expect(lastSpan!.textContent).toEqual("foo bar");
	});

	it("should delete file", async () => {
		const page = await server.newPage()
			.then(server.loadPage.bind(server));
		await page.waitFor("div.part.sidebar");
		await page.click("div.part.sidebar");

		// Wait for file tree to fill up.
		const fileSelector = `div.monaco-tl-row div.monaco-icon-label.${testFileName.replace(".", "\\\.")}-name-file-icon`;
		await page.waitFor(fileSelector);

		// Delete the file.
		await page.click(fileSelector);
		await page.waitFor(1000);
		await page.keyboard.press("Delete");

		// Wait for the "Move to Trash" button in the popup.
		const btnSelector = "div.msgbox button:last-of-type";
		await page.waitFor(btnSelector);

		// Using $eval because puppeteer can't click inputs for
		// some reason. See:
		// https://github.com/GoogleChrome/puppeteer/issues/3347
		await page.$eval(btnSelector, btn => btn.dispatchEvent(new MouseEvent("click")));

		// Check that the file is NOT in the file tree.
		const spanSelector = "div.part.sidebar div.monaco-tl-row span.monaco-highlighted-label span";
		await page.waitFor(spanSelector);
		const elements = await server.querySelectorAll(page, spanSelector);
		expect(elements.length).toBeGreaterThanOrEqual(0);
		const contentArray = elements.map((el) => el.textContent);
		expect(contentArray).not.toContain(testFileName);
	});

	it("should uninstall extension", async () => {
		const page = await server.newPage()
			.then(server.loadPage.bind(server));
		await workbenchShowCommands(page);
		await page.waitFor(1000);
		await page.keyboard.type("show installed extensions", { delay: 100 });
		await page.waitFor(1000);
		const itemSelector = "div.quick-open-tree div.monaco-tree-row[aria-label*='Show Installed Extensions, commands, picker']";
		await page.waitFor(itemSelector);
		await page.click(itemSelector);
		await page.waitFor(1000);

		// Search for installed javascript extensions.
		await selectAll(page);
		await page.keyboard.type("@installed javascript", { delay: 100 });
		await page.keyboard.press("Enter");
		await page.waitFor(manageSelector);

		// Uninstall extension.
		await page.click(manageSelector);
		const uninstallSelector = "div.monaco-menu-container span.action-label[aria-label='Uninstall']";
		await page.waitFor(uninstallSelector);
		await page.click(uninstallSelector);

		// Check that the install button exists.
		await page.waitFor(installSelector);
		const installButton = await server.querySelector(page, installSelector);
		expect(installButton).toBeTruthy();
		expect(installButton.tag).toEqual("a");
		expect(installButton.textContent).toBe("Install");
	});
});
