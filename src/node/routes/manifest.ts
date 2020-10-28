import { Router } from "express"
import { CommonTemplateVars, commonTemplateVars } from "../http"

export const router = Router()

const iconSizes = [96, 128, 192, 256, 384, 512]

export const createWebManifest = ({ BASE, CS_STATIC_BASE }: CommonTemplateVars) => {
  const icons = iconSizes.map((iconSize) => ({
    src: `${CS_STATIC_BASE}/src/browser/media/pwa-icon-${iconSize}.png`,
    type: "image/png",
    sizes: `${iconSize}x${iconSize}`,
  }))

  return {
    name: "code-server",
    short_name: "code-server",
    start_url: BASE,
    display: "fullscreen",
    "background-color": "#fff",
    description: "Run editors on a remote server.",
    icons,
  }
}

router.get("/code-server.webmanifest", (req, res) => {
  const webManifest = commonTemplateVars(req)

  res.contentType("application/manifest+json").json(webManifest)
})
