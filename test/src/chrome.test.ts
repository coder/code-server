import * as os from "os";
import * as puppeteer from "puppeteer";
import { TestServer } from "./index";

describe("chrome e2e", () => {
	const superKey = os.platform() === "darwin" ? "Meta" : "Control";
	const testFileName = `test-${Date.now()}.js`;
	const jsSnippetsDesc = "JavaScript Snippets. Press enter for extension details.";
	const installSelector = `div.extensions-list div.monaco-list-row[aria-label='${jsSnippetsDesc}'] a.extension-action.install`;
	const manageSelector = `div.extensions-list div.monaco-list-row[aria-label='${jsSnippetsDesc}'] a.extension-action.manage`;

	const server = new TestServer({ auth: false });
	beforeAll(async () => {
		await server.start();
	});
	afterAll(async () => {
		await server.dispose();
	});

	const workbenchQuickOpen = async (page: puppeteer.Page): Promise<void> => {
		await page.keyboard.down(superKey);
		await page.keyboard.down("P");
		await page.keyboard.up(superKey);
		await page.keyboard.up("P");
	};

	const workbenchShowCommands = async (page: puppeteer.Page): Promise<void> => {
		await page.keyboard.down(superKey);
		await page.keyboard.down("Shift");
		await page.keyboard.down("P");
		await page.keyboard.up(superKey);
		await page.keyboard.up("Shift");
		await page.keyboard.up("P");
	};

	// Select all text in the search field, to avoid
	// invalid queries.
	const selectAll = async (page: puppeteer.Page): Promise<void> => {
		await page.keyboard.down(superKey);
		await page.keyboard.down("A");
		await page.keyboard.up(superKey);
		await page.keyboard.up("A");
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

		await page.close();
	}, 5000);

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

		await page.close();
	}, 15000);

	it("should open file", async () => {
		const page = await server.newPage()
			.then(server.loadPage.bind(server));
		await workbenchQuickOpen(page);
		await page.waitFor(1000);
		await page.keyboard.type(testFileName, { delay: 100 });
		await page.keyboard.press("Enter");
		await page.waitFor(1000);
		const tabSelector = `div.tab div.monaco-icon-label.${testFileName.replace(".", "\\.")}-name-file-icon`;

		// Check that the file is in an editor tab.
		const tab = await server.querySelector(page, tabSelector);
		expect(tab).toBeTruthy();
		expect(tab.tag).toEqual("div");
		expect(tab.properties).not.toBeUndefined();
		expect(tab.properties!["title"]).toContain(testFileName);
		expect(tab.children.length).toBeGreaterThan(0);

		await page.close();
	}, 15000);

	it("should install extension", async () => {
		const page = await server.newPage()
			.then(server.loadPage.bind(server));
		await workbenchShowCommands(page);
		await page.waitFor(1000);
		await page.keyboard.type("install extensions", { delay: 100 });
		await page.waitFor(1000);
		const commandSelector = "div.quick-open-tree div.monaco-tree-row[aria-label*='Install Extensions, commands, picker']";
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

		await page.close();
	}, 65000);

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
		await page.waitFor(1000);

		// Check that the file is NOT in the file tree.
		const spanSelector = "div.part.sidebar div.monaco-tl-row span.monaco-highlighted-label span";
		const elements = await server.querySelectorAll(page, spanSelector);
		expect(elements.length).toBeGreaterThanOrEqual(0);
		const contentArray = elements.map((el) => el.textContent);
		expect(contentArray).not.toContain(testFileName);

		await page.close();
	}, 30000);

	it("should uninstall extension", async () => {
		const page = await server.newPage()
			.then(server.loadPage.bind(server));
		await workbenchShowCommands(page);
		await page.waitFor(1000);
		await page.keyboard.type("show installed extensions", { delay: 100 });
		await page.waitFor(1000);
		const itemSelector = "div.quick-open-tree div.monaco-tree-row[aria-label*='Show Installed Extensions, commands, picker']";
		await page.click(itemSelector);
		await page.waitFor(1000);

		// Search for installed javascript extensions.
		await selectAll(page);
		await page.keyboard.type("@installed javascript", { delay: 100 });
		await page.keyboard.press("Enter");
		await page.waitFor(2000);

		// Uninstall extension.
		await page.click(manageSelector);
		await page.waitFor(1000);
		const uninstallSelector = "div.monaco-menu-container span.action-label[aria-label='Uninstall']";
		await page.click(uninstallSelector);

		// Wait for un-installation.
		await page.waitFor(1000);

		// Check that the install button exists.
		const installButton = await server.querySelector(page, installSelector);
		expect(installButton).toBeTruthy();
		expect(installButton.tag).toEqual("a");
		expect(installButton.textContent).toBe("Install");

		await page.close();
	}, 55000);
});
