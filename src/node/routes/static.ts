import { Router, static as serveStatic } from "express"
import { resolve } from "path"
import { ServeStaticOptions } from "serve-static"
import { commit, rootPath } from "../constants"

export const router = Router()

export const createDefaultStaticRouteHandlerOptions = (): ServeStaticOptions => ({
  cacheControl: commit !== "development",
})

export const createServeDirectoryHandler = (
  router: Router,
  publicRoute: string,
  directoryPath: string,
  options: ServeStaticOptions = {},
): void => {
  router.use(
    publicRoute,
    serveStatic(directoryPath, {
      ...createDefaultStaticRouteHandlerOptions(),
      ...options,
    }),
  )
}

const staticPaths: Record<string, string> = {
  "/static": "dist",
  "/static/media": "src/browser/public/media",
}

for (const [publicRoute, sourcePath] of Object.entries(staticPaths)) {
  createServeDirectoryHandler(router, publicRoute, resolve(rootPath, sourcePath), { index: false })
}
