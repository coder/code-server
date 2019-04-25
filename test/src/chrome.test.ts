import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { TestServer, TestPage } from "./index";

describe("chrome e2e", () => {
	jest.setTimeout(60000);

	const superKey: string = os.platform() === "darwin" ? "Meta" : "Control";
	const testFileName = `test-${Date.now()}.js`;
	const testFilePath = path.resolve(TestServer.workingDir, testFileName);

	const jsSnippetsDesc = "JavaScript (ES6) code snippets. Press enter for extension details.";
	const installSelector = `div.extensions-list div.monaco-list-row[aria-label='${jsSnippetsDesc}'] a.extension-action.install`;
	const manageSelector = `div.extensions-list div.monaco-list-row[aria-label='${jsSnippetsDesc}'] a.extension-action.manage`;

	const commandInputSelector = "div.monaco-quick-open-widget input.input";
	const extensionInputSelector = "div.extensions-viewlet .view-lines";
	const sidebarSelector = "div.part.sidebar";
	const editorSelector = `div.editor-instance[aria-label*='${testFileName}'] .view-lines`;

	const createTestFile = (): void => {
		if (!fs.existsSync(testFilePath)) {
			fs.writeFileSync(testFilePath, new Buffer(0));
		}
	};

	const deleteTestFile = (): void => {
		if (fs.existsSync(testFilePath)) {
			fs.unlinkSync(testFilePath);
		}
	};

	const server = new TestServer();
	beforeAll(async () => {
		await server.start();
	});

	afterAll(async () => {
		await server.dispose();
	});

	afterEach(() => deleteTestFile());

	const waitForSidebar = (page: TestPage): Promise<void> => {
		return page.rootPage.waitFor(sidebarSelector, { visible: true }).then(() => page.rootPage.click(sidebarSelector));
	};

	const waitForCommandInput = (page: TestPage): Promise<void> => {
		return page.rootPage.waitFor(commandInputSelector, { visible: true }).then(() => page.rootPage.click(commandInputSelector));
	};

	const workbenchQuickOpen = (page: TestPage): Promise<void> => {
		return waitForSidebar(page)
			.then(() => server.pressKeyboardCombo(page, superKey, "P"))
			.then(() => waitForCommandInput(page));
	};

	const workbenchShowCommands = (page: TestPage): Promise<void> => {
		return waitForSidebar(page)
			.then(() => server.pressKeyboardCombo(page, superKey, "Shift", "P"))
			.then(() => waitForCommandInput(page));
	};

	// Select all text in the search field, to avoid
	// invalid queries.
	const selectAll = (page: TestPage): Promise<void> => {
		return server.pressKeyboardCombo(page, superKey, "A");
	};

	it("should open IDE", async () => {
		const page = await server.newPage()
			.then((p) => server.loadPage(p, "openIDE"));

		// Editor should be visible.
		await page.waitFor("div.part.editor", { visible: true });
	});

	it("should create file via command palette", async () => {
		const page = await server.newPage()
			.then((p) => server.loadPage(p, "createFileWithPalette"));
		await workbenchShowCommands(page);
		await page.keyboard.type("New File", { delay: 100 });
		await page.keyboard.press("Enter");
		await page.waitFor(1000);
		await page.keyboard.type(testFileName, { delay: 100 });
		await page.keyboard.press("Enter");
		await page.waitFor(editorSelector, { visible: true });

		// Check that the file is in the file tree.
		const spanSelector = `${sidebarSelector} div.monaco-tl-row span.monaco-highlighted-label span`;
		const elements = await server.querySelectorAll(page, spanSelector);
		expect(elements.length).toBeGreaterThan(0);
		const contentArray = elements.map((el) => el.textContent);
		expect(contentArray).toContain(testFileName);
	});

	it("should create file via file tree", async () => {
		const page = await server.newPage()
			.then((p) => server.loadPage(p, "createFileWithFileTree"));
		await waitForSidebar(page);
		const newFileBntSelector = "a.action-label.explorer-action.new-file";
		await page.waitFor(newFileBntSelector, { visible: true });
		// New file button click doesn't register if it's sent
		// immediately after the button is ready.
		await page.waitFor(1000);
		await page.click(newFileBntSelector);
		await page.waitFor(1000);
		await page.keyboard.type(testFileName, { delay: 100 });
		await page.keyboard.press("Enter");
		await page.waitFor(editorSelector, { visible: true });

		// Check that the file is in the file tree.
		const spanSelector = `${sidebarSelector} div.monaco-tl-row span.monaco-highlighted-label span`;
		const elements = await server.querySelectorAll(page, spanSelector);
		expect(elements.length).toBeGreaterThan(0);
		const contentArray = elements.map((el) => el.textContent);
		expect(contentArray).toContain(testFileName);
	});

	it("should open file", async () => {
		const page = await server.newPage()
			.then((p) => server.loadPage(p, "openFile"));

		// Setup.
		createTestFile();

		await workbenchQuickOpen(page);
		await page.keyboard.type(testFileName, { delay: 100 });
		await page.keyboard.press("Enter");

		// File should be open in editor view.
		await page.waitFor(editorSelector, { visible: true });
	});

	it("should install extension", async () => {
		const page = await server.newPage()
			.then((p) => server.loadPage(p, "installExtension"));
		await workbenchShowCommands(page);
		await page.keyboard.type("install extensions", { delay: 100 });
		const commandSelector = "div.quick-open-tree div.monaco-tree-row[aria-label*='Install Extensions, commands, picker']";
		await page.waitFor(commandSelector, { visible: true });
		await page.click(commandSelector);
		await page.waitFor(extensionInputSelector, { visible: true });
		await page.click(extensionInputSelector);

		// Search for javascript extensions.
		await selectAll(page);
		await page.keyboard.type("javascript", { delay: 100 });
		await page.keyboard.press("Enter");

		// Install extension.
		await page.waitFor(installSelector, { visible: true });
		// @ts-ignore
		await page.$eval(installSelector, btn => btn.click());

		// Wait for installation.
		await page.waitFor(manageSelector, { visible: true });
	});

	it("should debug file", async () => {
		const page = await server.newPage()
			.then((p) => server.loadPage(p, "debugFile"));

		// Setup.
		createTestFile();

		await workbenchQuickOpen(page);
		await page.keyboard.type(testFileName, { delay: 100 });
		await page.keyboard.press("Enter");
		await page.waitFor(editorSelector, { visible: true });

		// Start code block.
		await page.keyboard.type(`console.log("hello");
	function test() {
	console.log("foo bar");`, { delay: 50 });

		// Toggle breakpoint.
		await page.keyboard.press("F9");
		const breakpointSelector = "div.debug-breakpoint";
		await page.waitFor(breakpointSelector);

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
			.then((p) => server.loadPage(p, "deleteFile"));

		// Setup.
		createTestFile();

		await waitForSidebar(page);

		// Wait for file tree to fill up.
		const fileSelector = `div.monaco-tl-row div.monaco-icon-label.${testFileName.replace(".", "\\\.")}-name-file-icon`;
		await page.waitFor(fileSelector);

		// Delete the file.
		await page.click(fileSelector);
		await page.waitFor(editorSelector, { visible: true });
		await page.keyboard.press("Delete");

		// Wait for the "Move to Trash" button in the popup.
		const btnSelector = "div.msgbox button:last-of-type";
		await page.waitFor(btnSelector);

		// Using $eval because puppeteer can't click inputs for
		// some reason. See:
		// https://github.com/GoogleChrome/puppeteer/issues/3347
		// @ts-ignore
		await page.$eval(btnSelector, btn => btn.click());

		// Check that the file is NOT in the file tree.
		const spanSelector = `${sidebarSelector} div.monaco-tl-row span.monaco-highlighted-label span`;
		const elements = await server.querySelectorAll(page, spanSelector);
		expect(elements.length).toBeGreaterThanOrEqual(0);
		const contentArray = elements.map((el) => el.textContent);
		expect(contentArray).not.toContain(testFileName);
	});

	it("should uninstall extension", async () => {
		const page = await server.newPage()
			.then((p) => server.loadPage(p, "uninstallExtension"));
		await workbenchShowCommands(page);
		await page.keyboard.type("show installed extensions", { delay: 100 });
		const commandSelector = "div.quick-open-tree div.monaco-tree-row[aria-label*='Show Installed Extensions, commands, picker']";
		await page.waitFor(commandSelector, { visible: true });
		await page.click(commandSelector);
		await page.waitFor(extensionInputSelector, { visible: true });
		await page.click(extensionInputSelector);

		// Search for installed javascript extensions.
		await selectAll(page);
		await page.keyboard.type("@installed javascript", { delay: 100 });
		await page.keyboard.press("Enter");

		// Uninstall extension.
		await page.waitFor(manageSelector, { visible: true });
		await page.click(manageSelector);
		const uninstallSelector = "div.monaco-menu-container span.action-label[aria-label='Uninstall']";
		await page.waitFor(uninstallSelector, { visible: true });
		await page.click(uninstallSelector);

		// Wait for uninstallation.
		await page.waitFor(installSelector, { visible: true });
	});
});
