import { Router } from "express"
import { promises as fs } from "fs"
import * as path from "path"
import { HttpCode, HttpError } from "../../common/http"
import { rootPath } from "../constants"
import { authenticated } from "../http"
import { getMediaMime } from "../util"

export const router = Router()

router.get("/(/*)?", async (req, res) => {
  const resourcePath = path.resolve(req.params[0])
  console.log(">>>", resourcePath)

  // console.log(">>", resourcePath)
  // if (req.params.commit.startsWith("out") || req.params.commit.startsWith("remote")) {
  //   resourcePath = path.join(vsRootPath, req.params.commit, resourcePath)
  //   // console.log("rewrite >>", resourcePath)
  // }

  // Make sure it's in code-server if you aren't authenticated. This lets
  // unauthenticated users load the login assets.
  const isAuthenticated = await authenticated(req)
  if (!resourcePath.startsWith(rootPath) && !isAuthenticated) {
    throw new HttpError("Unauthorized", HttpCode.Unauthorized)
  }

  // // Don't cache during development. - can also be used if you want to make a
  // // static request without caching.
  // if (commit !== "development" && req.params.commit !== "-") {
  //   res.header("Cache-Control", "public, max-age=31536000")
  // }

  // Without this the default is to use the directory the script loaded from.
  if (req.headers["service-worker"]) {
    res.header("service-worker-allowed", "/")
  }

  res.set("Content-Type", getMediaMime(resourcePath))

  const content = await fs.readFile(resourcePath)

  return res.send(content)
})
