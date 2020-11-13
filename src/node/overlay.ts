import * as express from "express"
import * as hijackresponse from "hijackresponse"
import { replaceTemplates } from "./http"

/**
 * inject injects the overlay.js script tag into the response if it is
 * HTML
 */
export function inject(req: express.Request, res: express.Response) {
  hijackresponse.default(res).then((hj) => {
    if (!res.get("Content-Type").includes("text/html")) {
      hj.readable.pipe(hj.writable)
      return
    }
    _inject(req, res, hj)
  })
}

/**
 * _inject  injects the script tag for the overlay into the HTML response
 * in res.
 * A point of improvement is to make it stream instead of buffer the entire response.
 * See for example https://www.npmjs.com/package/stream-buffer-replace
 */
async function _inject(req: express.Request, res: express.Response, hj: hijackresponse.HJ): Promise<void> {
  res.removeHeader("Content-Length")

  try {
    const bodyPromise = new Promise<string>((res, rej) => {
      hj.readable.on("close", rej)
      hj.writable.on("close", rej)
      hj.readable.on("error", rej)
      hj.writable.on("error", rej)

      const chunks: Buffer[] = []
      hj.readable.on("data", (chunk: Buffer) => {
        chunks.push(chunk)
      })
      hj.readable.on("end", () => {
        res(String(Buffer.concat(chunks)))
      })
    })
    let body = await bodyPromise
    body = injectString(req, body)
    hj.writable.write(body)
    hj.writable.end()
  } catch (err) {
    hj.destroyAndRestore()
    res.status(500)
    res.json({ error: "overlay script injection failed" })
  }
}

/**
 * injectOverlayString injects the overlay.js script tag
 * into the passed html.
 */
export function injectString(req: express.Request, html: string): string {
  return replaceTemplates(
    req,
    html.replace(
      "</head>",
      `  <script defer data-cfasync="false" src="{{CS_STATIC_BASE}}/dist/overlay.js"></script>
  </head>`,
    ),
  )
}
