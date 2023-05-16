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
  it("should use EXTENSIONS_GALLERY when set", async () => {
    const extName = "author.extension"
    const { stderr } = await runCodeServerCommand([...setupFlags, "--install-extension", extName], {
      EXTENSIONS_GALLERY: "{}",
    })
    expect(stderr).toMatch("No extension gallery service configured")
  })
})
