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
    await expect(
      runCodeServerCommand([...setupFlags, "--install-extension", extName], {
        EXTENSIONS_GALLERY: "{}",
      }),
    ).rejects.toThrow("No extension gallery service configured")
  })
})
