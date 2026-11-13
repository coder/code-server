import { promises as fs } from "fs"
import * as http from "http"
import * as path from "path"
import { setDefaults, parse } from "../../../src/node/cli"
import { loadCustomStrings } from "../../../src/node/i18n"
import type { OpenCommandPipeArgs } from "../../../src/node/main"
import { tmpdir } from "../../utils/helpers"

// Mock the i18n module
jest.mock("../../../src/node/i18n", () => ({
  loadCustomStrings: jest.fn(),
}))

// Mock logger to avoid console output during tests
jest.mock("@coder/logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    named: jest.fn(),
    level: 0,
  },
  field: jest.fn(),
  Level: {
    Trace: 0,
    Debug: 1,
    Info: 2,
    Warn: 3,
    Error: 4,
  },
}))

const mockedLoadCustomStrings = loadCustomStrings as jest.MockedFunction<typeof loadCustomStrings>

describe("main", () => {
  let tempDir: string
  let mockServer: any

  beforeEach(async () => {
    tempDir = await tmpdir("code-server-main-test")

    // Reset mocks
    jest.clearAllMocks()

    // Mock the server creation to avoid actually starting a server
    mockServer = {
      server: {
        listen: jest.fn(),
        address: jest.fn(() => ({ address: "127.0.0.1", port: 8080 })),
        close: jest.fn(),
      },
      editorSessionManagerServer: {
        address: jest.fn(() => null),
      },
      dispose: jest.fn(),
    }
  })

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rmdir(tempDir, { recursive: true })
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe("runCodeServer", () => {
    it("should load custom strings when i18n flag is provided", async () => {
      // Create a test custom strings file
      const customStringsFile = path.join(tempDir, "custom-strings.json")
      await fs.writeFile(
        customStringsFile,
        JSON.stringify({
          WELCOME: "Custom Welcome",
          LOGIN_TITLE: "My App",
        }),
      )

      // Create args with i18n flag
      const cliArgs = parse([
        `--config=${path.join(tempDir, "config.yaml")}`,
        `--user-data-dir=${tempDir}`,
        "--bind-addr=localhost:0",
        "--log=warn",
        "--auth=none",
        `--i18n=${customStringsFile}`,
      ])
      const args = await setDefaults(cliArgs)

      // Mock the app module
      jest.doMock("../../../src/node/app", () => ({
        createApp: jest.fn().mockResolvedValue(mockServer),
        ensureAddress: jest.fn().mockReturnValue(new URL("http://localhost:8080")),
      }))

      // Mock routes module
      jest.doMock("../../../src/node/routes", () => ({
        register: jest.fn().mockResolvedValue({ disposeRoutes: jest.fn() }),
      }))

      // Mock loadCustomStrings to succeed
      mockedLoadCustomStrings.mockResolvedValue(undefined)

      // Import runCodeServer after mocking
      const mainModule = await import("../../../src/node/main")
      const result = await mainModule.runCodeServer(args)

      // Verify that loadCustomStrings was called with the correct file path
      expect(mockedLoadCustomStrings).toHaveBeenCalledWith(customStringsFile)
      expect(mockedLoadCustomStrings).toHaveBeenCalledTimes(1)

      // Clean up
      await result.dispose()
    })

    it("should not load custom strings when i18n flag is not provided", async () => {
      // Create args without i18n flag
      const cliArgs = parse([
        `--config=${path.join(tempDir, "config.yaml")}`,
        `--user-data-dir=${tempDir}`,
        "--bind-addr=localhost:0",
        "--log=warn",
        "--auth=none",
      ])
      const args = await setDefaults(cliArgs)

      // Mock the app module
      jest.doMock("../../../src/node/app", () => ({
        createApp: jest.fn().mockResolvedValue(mockServer),
        ensureAddress: jest.fn().mockReturnValue(new URL("http://localhost:8080")),
      }))

      // Mock routes module
      jest.doMock("../../../src/node/routes", () => ({
        register: jest.fn().mockResolvedValue({ disposeRoutes: jest.fn() }),
      }))

      // Import runCodeServer after mocking
      const mainModule = await import("../../../src/node/main")
      const result = await mainModule.runCodeServer(args)

      // Verify that loadCustomStrings was NOT called
      expect(mockedLoadCustomStrings).not.toHaveBeenCalled()

      // Clean up
      await result.dispose()
    })

    it("should handle errors when loadCustomStrings fails", async () => {
      // Create args with i18n flag pointing to non-existent file
      const nonExistentFile = path.join(tempDir, "does-not-exist.json")
      const cliArgs = parse([
        `--config=${path.join(tempDir, "config.yaml")}`,
        `--user-data-dir=${tempDir}`,
        "--bind-addr=localhost:0",
        "--log=warn",
        "--auth=none",
        `--i18n=${nonExistentFile}`,
      ])
      const args = await setDefaults(cliArgs)

      // Mock loadCustomStrings to throw an error
      const mockError = new Error("Custom strings file not found")
      mockedLoadCustomStrings.mockRejectedValue(mockError)

      // Import runCodeServer after mocking
      const mainModule = await import("../../../src/node/main")

      // Verify that runCodeServer throws the error from loadCustomStrings
      await expect(mainModule.runCodeServer(args)).rejects.toThrow("Custom strings file not found")

      // Verify that loadCustomStrings was called
      expect(mockedLoadCustomStrings).toHaveBeenCalledWith(nonExistentFile)
    })
  })

  describe("openInExistingInstance", () => {
    it("should wait for the file to be closed with --wait", async () => {
      const file = path.join(tempDir, "git-rebase-todo")
      await fs.writeFile(file, "")

      // Stand in for the socket Code listens on for CLI requests.
      let pipeArgs: OpenCommandPipeArgs | undefined
      let onRequest = () => {}
      const requested = new Promise<void>((resolve) => (onRequest = resolve))
      const server = http.createServer((req, res) => {
        let body = ""
        req.on("data", (chunk) => (body += chunk))
        req.on("end", () => {
          pipeArgs = JSON.parse(body)
          res.end()
          onRequest()
        })
      })
      const socketPath =
        process.platform === "win32"
          ? String.raw`\\.\pipe\vscode-${path.basename(tempDir)}`
          : path.join(tempDir, "vscode.sock")
      await new Promise<void>((resolve) => server.listen(socketPath, resolve))

      // Run the wait loop's poll timer as soon as it has been scheduled.
      const runNextPoll = async () => {
        while (jest.getTimerCount() === 0) {
          await fs.stat(tempDir)
        }
        jest.runOnlyPendingTimers()
      }

      jest.useFakeTimers()
      try {
        const args = await setDefaults(
          parse([`--config=${path.join(tempDir, "config.yaml")}`, `--user-data-dir=${tempDir}`, "--wait", file]),
        )
        const mainModule = await import("../../../src/node/main")
        let returned = false
        const opening = mainModule.openInExistingInstance(args, socketPath).then(() => {
          returned = true
        })

        await requested
        expect(pipeArgs?.fileURIs).toStrictEqual([file])
        const marker = pipeArgs?.waitMarkerFilePath
        expect(marker).toBeDefined()
        expect((await fs.stat(marker!)).isFile()).toBe(true)

        // Still waiting while the file is open.
        await runNextPoll()
        await runNextPoll()
        expect(returned).toBe(false)

        // Code deletes the marker once the file is closed.
        await fs.rm(marker!)
        await runNextPoll()
        await opening
        expect(returned).toBe(true)
      } finally {
        jest.useRealTimers()
        server.close()
      }
    })
  })
})
