import { version } from "../../src/node/constants"
import { describe, test, expect } from "./baseFixture"

describe("Open Help > About", ["--disable-workspace-trust"], {}, () => {
  test("should see code-server version in about dialog", async ({ codeServerPage }) => {
    // Open using the menu.
    await codeServerPage.navigateMenus(["Help", "About"])

    const isDevMode = process.env.VSCODE_DEV === "1"

    // Look for code-server info div.
    const element = await codeServerPage.page.waitForSelector(
      `div[role="dialog"] >> text=code-server: ${isDevMode ? "Unknown" : "v" + version}`,
    )
    expect(element).not.toBeNull()
  })
})
