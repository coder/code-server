import { readdir, mkdir, copyFile } from "fs/promises"
import path from "path"
import { cwd } from "process"
import { clean, tmpdir } from "../utils/helpers"
import { runCodeServerCommand } from "../utils/runCodeServerCommand"

// Source: https://stackoverflow.com/a/71587262/3015595
async function copyDir(source: string, destination: string): Promise<any> {
    const directoryEntries = await readdir(source, { withFileTypes: true });
    await mkdir(destination, { recursive: true });
  
    return Promise.all(
      directoryEntries.map(async (entry) => {
        const sourcePath = path.join(source, entry.name);
        const destinationPath = path.join(destination, entry.name);
  
        return entry.isDirectory()
          ? copyDir(sourcePath, destinationPath)
          : copyFile(sourcePath, destinationPath);
      })
    );
  }

describe("--list-extensions", () => {
  const testName = "listExtensions"
  const extName = `wesbos.theme-cobalt2`
  const extVersion = "2.1.6"
  let tempDir: string
  let setupFlags: string[]

  beforeEach(async () => {
    await clean(testName)
    tempDir = await tmpdir(testName)
    setupFlags = ["--extensions-dir", tempDir]
    const unpackedExtFixture = `${cwd()}/test/integration/fixtures/${extName}-${extVersion}`
    await copyDir(unpackedExtFixture, `${tempDir}/${extName}-${extVersion}`)
  })
  it("should list installed extensions", async () => {
    const { stdout } = await runCodeServerCommand([...setupFlags, "--list-extensions" ], {stdout: "log"})
    expect(stdout).toMatch(extName)
  }, 20000)
})
