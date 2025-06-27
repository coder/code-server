import { promises as fs } from "fs"
import * as os from "os"
import * as path from "path"
import { loadCustomStrings } from "../../../src/node/i18n"

describe("i18n", () => {
  let tempDir: string
  let validJsonFile: string
  let invalidJsonFile: string
  let nonExistentFile: string

  beforeEach(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "code-server-i18n-test-"))

    // Create test files
    validJsonFile = path.join(tempDir, "valid.json")
    invalidJsonFile = path.join(tempDir, "invalid.json")
    nonExistentFile = path.join(tempDir, "does-not-exist.json")

    // Write valid JSON file
    await fs.writeFile(
      validJsonFile,
      JSON.stringify({
        WELCOME: "Custom Welcome",
        LOGIN_TITLE: "My Custom App",
        LOGIN_BELOW: "Please log in to continue",
      }),
    )

    // Write invalid JSON file
    await fs.writeFile(invalidJsonFile, '{"WELCOME": "Missing closing quote}')
  })

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rmdir(tempDir, { recursive: true })
  })

  describe("loadCustomStrings", () => {
    it("should load valid JSON file successfully", async () => {
      // Should not throw an error
      await expect(loadCustomStrings(validJsonFile)).resolves.toBeUndefined()
    })

    it("should throw clear error for non-existent file", async () => {
      await expect(loadCustomStrings(nonExistentFile)).rejects.toThrow(
        `Custom strings file not found: ${nonExistentFile}\nPlease ensure the file exists and is readable.`,
      )
    })

    it("should throw clear error for invalid JSON", async () => {
      await expect(loadCustomStrings(invalidJsonFile)).rejects.toThrow(
        `Invalid JSON in custom strings file: ${invalidJsonFile}`,
      )
    })

    it("should handle empty JSON object", async () => {
      const emptyJsonFile = path.join(tempDir, "empty.json")
      await fs.writeFile(emptyJsonFile, "{}")

      await expect(loadCustomStrings(emptyJsonFile)).resolves.toBeUndefined()
    })

    it("should handle nested JSON objects", async () => {
      const nestedJsonFile = path.join(tempDir, "nested.json")
      await fs.writeFile(
        nestedJsonFile,
        JSON.stringify({
          WELCOME: "Hello World",
          NESTED: {
            KEY: "Value",
          },
        }),
      )

      await expect(loadCustomStrings(nestedJsonFile)).resolves.toBeUndefined()
    })

    it("should handle special characters and unicode", async () => {
      const unicodeJsonFile = path.join(tempDir, "unicode.json")
      await fs.writeFile(
        unicodeJsonFile,
        JSON.stringify({
          WELCOME: "欢迎来到 code-server",
          LOGIN_TITLE: "Willkommen bei {{app}}",
          SPECIAL: "Special chars: àáâãäåæçèéêë 🚀 ♠️ ∆",
        }),
        "utf8",
      )

      await expect(loadCustomStrings(unicodeJsonFile)).resolves.toBeUndefined()
    })

    it("should handle generic errors that are not ENOENT or SyntaxError", async () => {
      const testFile = path.join(tempDir, "test.json")
      await fs.writeFile(testFile, "{}")

      // Mock fs.readFile to throw a generic error
      const originalReadFile = fs.readFile
      const mockError = new Error("Permission denied")
      fs.readFile = jest.fn().mockRejectedValue(mockError)

      await expect(loadCustomStrings(testFile)).rejects.toThrow(
        `Failed to load custom strings from ${testFile}: Permission denied`,
      )

      // Restore original function
      fs.readFile = originalReadFile
    })

    it("should handle errors that are not Error instances", async () => {
      const testFile = path.join(tempDir, "test.json")
      await fs.writeFile(testFile, "{}")

      // Mock fs.readFile to throw a non-Error object
      const originalReadFile = fs.readFile
      fs.readFile = jest.fn().mockRejectedValue("String error")

      await expect(loadCustomStrings(testFile)).rejects.toThrow(
        `Failed to load custom strings from ${testFile}: String error`,
      )

      // Restore original function
      fs.readFile = originalReadFile
    })

    it("should handle null/undefined errors", async () => {
      const testFile = path.join(tempDir, "test.json")
      await fs.writeFile(testFile, "{}")

      // Mock fs.readFile to throw null
      const originalReadFile = fs.readFile
      fs.readFile = jest.fn().mockRejectedValue(null)

      await expect(loadCustomStrings(testFile)).rejects.toThrow(`Failed to load custom strings from ${testFile}: null`)

      // Restore original function
      fs.readFile = originalReadFile
    })

    it("should complete without errors for valid input", async () => {
      const testFile = path.join(tempDir, "resource-test.json")
      const customStrings = {
        WELCOME: "Custom Welcome Message",
        LOGIN_TITLE: "Custom Login Title",
      }
      await fs.writeFile(testFile, JSON.stringify(customStrings))

      // Should not throw any errors
      await expect(loadCustomStrings(testFile)).resolves.toBeUndefined()
    })
  })
})
