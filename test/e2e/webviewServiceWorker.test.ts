import { expect, test } from "@playwright/test"
import { createHash } from "crypto"
import { readFileSync } from "fs"
import { createServer, Server } from "http"
import * as path from "path"

// Exercise the patched bootstrap with real browser registrations and controllers,
// without depending on extension activation or a compiled workbench.
const pre = path.resolve(__dirname, "../../lib/vscode/src/vs/workbench/contrib/webview/browser/pre")
const html = readFileSync(path.join(pre, "index.html"), "utf8")
const worker = readFileSync(path.join(pre, "service-worker.js"), "utf8")
const bootstrap = html.slice(html.indexOf("const workerReady ="), html.indexOf("const hostMessaging ="))
const documentBody = `<!doctype html><script>
const mode = new URLSearchParams(location.search).get('mode');
const disableServiceWorker = mode === 'disabled';
const areServiceWorkersEnabled = () => mode !== 'unavailable';
const expectedWorkerVersion = 6;
const onElectron = false;
const searchParams = new URLSearchParams('vscode-resource-base-authority=vscode-resource.vscode-cdn.net&platform=web');
window.updateCalls = 0;
window.registerCalls = 0;
window.readyState = 'pending';
const register = navigator.serviceWorker.register.bind(navigator.serviceWorker);
navigator.serviceWorker.register = (...args) => {
  window.registerCalls++;
  if (mode === 'reuse') return new Promise(() => {});
  if (mode === 'denied') return Promise.reject(new Error('user denied permission'));
  return register(...args);
};
ServiceWorkerRegistration.prototype.update = function () {
  window.updateCalls++;
  return mode === 'reject' ? Promise.reject(new Error('offline')) : new Promise(() => {});
};
${bootstrap}
workerReady.then(() => { window.readyState = 'ready'; }, error => {
  window.readyState = 'error';
  window.workerError = String(error);
});
</script>`

let server: Server
let origin: string
let suppressActivationClaim = false
const workerURL =
  "/webview/service-worker.js?v=6&vscode-resource-base-authority=vscode-resource.vscode-cdn.net&remoteAuthority=&platform=web&code-server-webview=1"

test.beforeAll(async () => {
  server = createServer((req, res) => {
    const url = new URL(req.url!, "http://localhost")
    if (url.pathname === "/root-worker.js") {
      res.setHeader("Content-Type", "text/javascript")
      res.end(
        "self.addEventListener('install', e => e.waitUntil(self.skipWaiting())); self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));",
      )
    } else if (url.pathname === "/webview/service-worker.js") {
      res.setHeader("Content-Type", "text/javascript")
      res.setHeader("Cache-Control", "no-store")
      res.end(
        (suppressActivationClaim ? "self.addEventListener('activate', e => e.stopImmediatePropagation());\n" : "") +
          worker,
      )
    } else {
      res.setHeader("Content-Type", "text/html")
      res.end(
        url.pathname === "/webview/index.html" && !url.searchParams.has("manual")
          ? documentBody
          : "<!doctype html><title>Root</title>",
      )
    }
  })
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  if (!address || typeof address === "string") throw new Error("Missing test server address")
  origin = `http://127.0.0.1:${address.port}`
})

test.afterAll(async () => {
  server.closeAllConnections()
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
})

test.beforeEach(async ({ page }) => {
  suppressActivationClaim = false
  await page.goto(origin)
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/root-worker.js")
    await navigator.serviceWorker.ready
  })
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL))
    .toBe(`${origin}/root-worker.js`)
})

test("first registration replaces the root PWA controller without an extra update", async ({ page }) => {
  await page.goto(`${origin}/webview/index.html`)
  await expect.poll(() => page.evaluate(() => (window as any).readyState), { timeout: 5000 }).toBe("ready")
  expect(await page.evaluate(() => (window as any).updateCalls)).toBe(0)
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toContain("code-server-webview=1")
})

test("reuses the matching registration when register and update would hang", async ({ page }) => {
  await page.goto(`${origin}/webview/index.html`)
  await expect.poll(() => page.evaluate(() => (window as any).readyState)).toBe("ready")
  await page.goto(`${origin}/webview/index.html?mode=reuse`)
  await expect.poll(() => page.evaluate(() => (window as any).readyState), { timeout: 5000 }).toBe("ready")
  expect(await page.evaluate(() => (window as any).registerCalls)).toBe(0)
  expect(await page.evaluate(() => (window as any).updateCalls)).toBe(1)
})

test("continues with the matching active worker when the update fails", async ({ page }) => {
  await page.goto(`${origin}/webview/index.html`)
  await expect.poll(() => page.evaluate(() => (window as any).readyState)).toBe("ready")
  await page.goto(`${origin}/webview/index.html?mode=reject`)
  await expect.poll(() => page.evaluate(() => (window as any).readyState)).toBe("ready")
  expect(await page.evaluate(() => (window as any).updateCalls)).toBe(1)
})

test("requests a claim when an existing active worker has not acquired the document", async ({ page }) => {
  suppressActivationClaim = true
  await page.goto(`${origin}/webview/index.html?manual=1&mode=reject`)
  await page.evaluate(async (url) => {
    const registration = await navigator.serviceWorker.register(url)
    await new Promise<void>((resolve) => {
      const worker = registration.installing!
      worker.addEventListener("statechange", () => {
        if (worker.state === "activated") resolve()
      })
    })
  }, workerURL)
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toBe(`${origin}/root-worker.js`)
  await page.addScriptTag({ content: documentBody.split("<script>")[1].split("</script>")[0] })
  await expect.poll(() => page.evaluate(() => (window as any).readyState), { timeout: 5000 }).toBe("ready")
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toContain("code-server-webview=1")
})

test("rejects a claim from an inner document in the same worker scope", async ({ page }) => {
  suppressActivationClaim = true
  await page.goto(`${origin}/webview/inner.html`)
  await page.evaluate(async (url) => {
    const registration = await navigator.serviceWorker.register(url)
    await new Promise<void>((resolve) => {
      const worker = registration.installing!
      worker.addEventListener("statechange", () => {
        if (worker.state === "activated") resolve()
      })
    })
    registration.active!.postMessage({ channel: "code-server-claim-webview" })
  }, workerURL)
  await page.waitForTimeout(200)
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toBe(`${origin}/root-worker.js`)
})

test("fails and stops claim retries when the expected controller never arrives", async ({ page }) => {
  suppressActivationClaim = true
  await page.goto(`${origin}/webview/index.html?manual=1&mode=reject`)
  await page.evaluate(async (url) => {
    const registration = await navigator.serviceWorker.register(url)
    await new Promise<void>((resolve) => {
      const worker = registration.installing!
      worker.addEventListener("statechange", () => {
        if (worker.state === "activated") resolve()
      })
    })
    ;(window as any).claimCalls = 0
    ServiceWorker.prototype.postMessage = function () {
      ;(window as any).claimCalls++
    }
  }, workerURL)
  await page.addScriptTag({ content: documentBody.split("<script>")[1].split("</script>")[0] })
  await expect.poll(() => page.evaluate(() => (window as any).readyState), { timeout: 12000 }).toBe("error")
  expect(await page.evaluate(() => (window as any).workerError)).toContain("Timed out waiting for the matching webview")
  const calls = await page.evaluate(() => (window as any).claimCalls)
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => (window as any).claimCalls)).toBe(calls)
})

test("does not reuse an active worker with a different complete script URL", async ({ page }) => {
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.register("/webview/service-worker.js?old=1")
    if (registration.active) return
    await new Promise<void>((resolve) => {
      const worker = registration.installing!
      worker.addEventListener("statechange", () => {
        if (worker.state === "activated") resolve()
      })
    })
  })
  await page.goto(`${origin}/webview/index.html`)
  await expect.poll(() => page.evaluate(() => (window as any).readyState), { timeout: 5000 }).toBe("ready")
  expect(await page.evaluate(() => (window as any).registerCalls)).toBe(1)
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toContain("code-server-webview=1")
})

test("preserves the third-party-cookie diagnostic on registration failure", async ({ page }) => {
  await page.goto(`${origin}/webview/index.html?mode=denied`)
  await expect.poll(() => page.evaluate(() => (window as any).readyState)).toBe("error")
  expect(await page.evaluate(() => (window as any).workerError)).toContain("third party cookies")
})

test("preserves explicitly disabled service workers", async ({ page }) => {
  await page.goto(`${origin}/webview/index.html?mode=disabled`)
  await expect.poll(() => page.evaluate(() => (window as any).readyState)).toBe("ready")
  expect(await page.evaluate(() => (window as any).registerCalls)).toBe(0)
})

test("reports when service workers are unavailable", async ({ page }) => {
  await page.goto(`${origin}/webview/index.html?mode=unavailable`)
  await expect.poll(() => page.evaluate(() => (window as any).readyState)).toBe("error")
  expect(await page.evaluate(() => (window as any).workerError)).toContain("Service Workers are not enabled")
})

test("the inline bootstrap retains a matching CSP hash", async () => {
  const script = html.split('<script async type="module">')[1].split("</script>")[0]
  const hash = createHash("sha256").update(script).digest("base64")
  expect(html).toContain(`script-src 'sha256-${hash}' 'self'`)
})
