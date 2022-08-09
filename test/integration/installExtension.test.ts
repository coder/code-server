import { stat } from "fs/promises"
import path from "path"
import { clean, tmpdir } from "../utils/helpers"
import { runCodeServerCommand } from "../utils/runCodeServerCommand"

describe("--install-extension", () => {
  const testName = "installExtension"
  let tempDir: string
  let setupFlags: string[]

  beforeEach(async () => {
    await clean(testName)
    tempDir = await tmpdir(testName)
    setupFlags = ["--extensions-dir", tempDir]
  })
  it("should install an extension", async () => {
    const extName = `wesbos.theme-cobalt2-2.1.6`
    const vsixFileName = "wesbos.theme-cobalt2-2.1.6.vsix"
    const extensionFixture = path.resolve(`./test/integration/fixtures/${vsixFileName}`)
    await runCodeServerCommand([...setupFlags, "--install-extension", extensionFixture])
    const pathToExtFolder = path.join(tempDir, extName)
    const statInfo = await stat(pathToExtFolder)
    expect(statInfo.isDirectory()).toBe(true)
  }, 20000)
  it("should use EXTENSIONS_GALLERY when set", async () => {
    const extName = `author.extension-1.0.0`
    const { stderr } = await runCodeServerCommand([...setupFlags, "--install-extension", extName], {
      EXTENSIONS_GALLERY: "{}",
    })
    expect(stderr).toMatch("No extension gallery service configured")
  })
})
