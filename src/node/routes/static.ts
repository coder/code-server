import { Router, static as _static } from "express"
import { resolve } from "path"
import { rootPath } from "../constants"

export const router = Router()

const staticPaths: Record<string, string> = {
  "/static": "src/browser/static",
  "/": "dist",
  "/lib": "lib",
}

for (const [publicRoute, sourcePath] of Object.entries(staticPaths)) {
  router.use(publicRoute, _static(resolve(rootPath, sourcePath), { index: false }))
}
