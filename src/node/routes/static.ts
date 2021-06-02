import { field, logger } from "@coder/logger"
import { Router } from "express"
import { promises as fs } from "fs"
import * as path from "path"
import { Readable } from "stream"
import * as tarFs from "tar-fs"
import * as zlib from "zlib"
import { HttpCode, HttpError } from "../../common/http"
import { getFirstString } from "../../common/util"
import { rootPath } from "../constants"
import { authenticated, ensureAuthenticated, replaceTemplates } from "../http"
import { getMediaMime, pathToFsPath } from "../util"

export const router = Router()

// The commit is for caching.
router.get("/(:commit)(/*)?", async (req, res) => {
  // Used by VS Code to load extensions into the web worker.
  const tar = getFirstString(req.query.tar)
  if (tar) {
    await ensureAuthenticated(req)
    let stream: Readable = tarFs.pack(pathToFsPath(tar))
    if (req.headers["accept-encoding"] && req.headers["accept-encoding"].includes("gzip")) {
      logger.debug("gzipping tar", field("path", tar))
      const compress = zlib.createGzip()
      stream.pipe(compress)
      stream.on("error", (error) => compress.destroy(error))
      stream.on("close", () => compress.end())
      stream = compress
      res.header("content-encoding", "gzip")
    }
    res.set("Content-Type", "application/x-tar")
    stream.on("close", () => res.end())
    return stream.pipe(res)
  }

  // If not a tar use the remainder of the path to load the resource.
  if (!req.params[0]) {
    throw new HttpError("Not Found", HttpCode.NotFound)
  }

  const resourcePath = path.resolve(req.params[0])

  // Make sure it's in code-server if you aren't authenticated. This lets
  // unauthenticated users load the login assets.
  const isAuthenticated = await authenticated(req)
  if (!resourcePath.startsWith(rootPath) && !isAuthenticated) {
    throw new HttpError("Unauthorized", HttpCode.Unauthorized)
  }

  // Don't cache during development. - can also be used if you want to make a
  // static request without caching.
  if (req.params.commit !== "development" && req.params.commit !== "-") {
    res.header("Cache-Control", "public, max-age=31536000")
  }

  // Without this the default is to use the directory the script loaded from.
  if (req.headers["service-worker"]) {
    res.header("service-worker-allowed", "/")
  }

  res.set("Content-Type", getMediaMime(resourcePath))

  if (resourcePath.endsWith("manifest.json")) {
    const content = await fs.readFile(resourcePath, "utf8")
    return res.send(replaceTemplates(req, content))
  }

  const content = await fs.readFile(resourcePath)
  return res.send(content)
})
