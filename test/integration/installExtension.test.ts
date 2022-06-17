import { clean, tmpdir } from "../utils/helpers"
import { runCodeServerCommand } from "../utils/integration"

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
    const extName = "wesbos.theme-cobalt2"
    await runCodeServerCommand([...setupFlags, "--install-extension", extName], {})
    const { stdout } = await runCodeServerCommand([...setupFlags, "--list-extensions"], {
      stdout: "log",
    })
    expect(stdout).toContain(extName)
  })
})
