import { promises as fs } from "fs"
import * as path from "path"
import { Page } from "playwright"
import { clean, getMaybeProxiedCodeServer } from "../utils/helpers"
import { describe, test, expect } from "./baseFixture"
import { CodeServerPage } from "./models/CodeServer"

// A 1x1 PNG.
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
)

/**
 * Open a Markdown preview that embeds a PNG from the workspace and wait for
 * the image to render.
 */
async function previewMarkdownWithImage(codeServerPage: CodeServerPage, imageName: string): Promise<Page> {
  const dir = await codeServerPage.workspaceDir
  await fs.writeFile(path.join(dir, imageName), png)
  const markdown = path.join(dir, `${imageName}.md`)
  await fs.writeFile(markdown, `# Preview\n\n![workspace image](${imageName})\n`)
  await codeServerPage.openFile(markdown)
  await codeServerPage.executeCommandViaMenus("Markdown: Open Preview to the Side")
  await codeServerPage.waitForTab(`Preview ${markdown}`)

  const image = codeServerPage.page
    .frameLocator("iframe.webview.ready")
    .frameLocator("#active-frame")
    .locator(`img[alt="workspace image"]`)
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
  return codeServerPage.page
}

/**
 * URLs in the webview service worker's Cache Storage.
 */
async function cachedWebviewUrls(page: Page): Promise<string[]> {
  const frame = await (await page.locator("iframe.webview.ready").elementHandle())?.contentFrame()
  if (!frame) {
    throw new Error("webview frame not found")
  }
  return frame.evaluate(async () => {
    const urls: string[] = []
    for (const name of await caches.keys()) {
      if (name.startsWith("vscode-resource-cache-")) {
        for (const request of await (await caches.open(name)).keys()) {
          urls.push(request.url)
        }
      }
    }
    return urls
  })
}

async function fetchRemoteResource(codeServerPage: CodeServerPage, file: string) {
  const address = await getMaybeProxiedCodeServer(codeServerPage)
  const url = new URL(`vscode-remote-resource?path=${encodeURIComponent(file)}`, address)
  return codeServerPage.page.request.get(url.toString())
}

/**
 * Write a workspace file and a file in the user extensions directory.
 */
async function writeResourceFiles(codeServerPage: CodeServerPage, name: string) {
  const dir = await codeServerPage.workspaceDir
  const workspaceFile = path.join(dir, `${name}-workspace.txt`)
  const extensionDir = path.join(dir, "extensions", `${name}-extension`)
  const extensionFile = path.join(extensionDir, "resource.txt")
  await fs.writeFile(workspaceFile, "workspace")
  await fs.mkdir(extensionDir, { recursive: true })
  await fs.writeFile(extensionFile, "extension")
  return { workspaceFile, extensionFile }
}

describe("File cache (enabled)", ["--disable-workspace-trust"], {}, async () => {
  const testName = "file-cache-enabled"
  test.beforeAll(async () => {
    await clean(testName)
  })

  test("should cache workspace files in the webview Cache Storage", async ({ codeServerPage }) => {
    const page = await previewMarkdownWithImage(codeServerPage, "cache-enabled.png")
    await expect
      .poll(async () => (await cachedWebviewUrls(page)).filter((url) => url.includes("cache-enabled.png")))
      .toHaveLength(1)
  })

  test("should serve /vscode-remote-resource with an ETag and without no-store", async ({ codeServerPage }) => {
    const { workspaceFile, extensionFile } = await writeResourceFiles(codeServerPage, "enabled")
    for (const file of [workspaceFile, extensionFile]) {
      const response = await fetchRemoteResource(codeServerPage, file)
      expect(response.status()).toBe(200)
      expect(response.headers()["etag"]).toBeTruthy()
      expect(response.headers()["cache-control"] ?? "").not.toContain("no-store")
    }
  })
})

describe("File cache (disabled)", ["--disable-workspace-trust", "--disable-file-cache"], {}, async () => {
  const testName = "file-cache-disabled"
  test.beforeAll(async () => {
    await clean(testName)
  })

  test("should keep workspace files out of the webview Cache Storage but cache extension files", async ({
    codeServerPage,
  }) => {
    const page = await previewMarkdownWithImage(codeServerPage, "cache-disabled.png")
    // Cached extension files show that the flag, not a cache failure, keeps the image out.
    await expect
      .poll(async () => (await cachedWebviewUrls(page)).filter((url) => url.includes("markdown-language-features")))
      .not.toHaveLength(0)
    expect((await cachedWebviewUrls(page)).filter((url) => url.includes("cache-disabled.png"))).toHaveLength(0)
  })

  test("should serve /vscode-remote-resource with no-store for workspace files and an ETag for extension files", async ({
    codeServerPage,
  }) => {
    const { workspaceFile, extensionFile } = await writeResourceFiles(codeServerPage, "disabled")

    const workspaceResponse = await fetchRemoteResource(codeServerPage, workspaceFile)
    expect(workspaceResponse.status()).toBe(200)
    expect(workspaceResponse.headers()["cache-control"]).toBe("no-store")
    expect(workspaceResponse.headers()["etag"]).toBeUndefined()

    const extensionResponse = await fetchRemoteResource(codeServerPage, extensionFile)
    expect(extensionResponse.status()).toBe(200)
    expect(extensionResponse.headers()["etag"]).toBeTruthy()
    expect(extensionResponse.headers()["cache-control"] ?? "").not.toContain("no-store")
  })
})
