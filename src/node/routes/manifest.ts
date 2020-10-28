import { Router } from "express"
import { normalize } from "../../common/util"
import { CommonTemplateVars, commonTemplateVars } from "../http"

export const router = Router()

const iconSizes = [96, 128, 192, 256, 384, 512]

export const createWebManifest = ({ base }: CommonTemplateVars) => {
  const icons = iconSizes.map((iconSize) => ({
    src: normalize(`${base}/static/media/pwa-icon-${iconSize}.png`),
    type: "image/png",
    sizes: `${iconSize}x${iconSize}`,
  }))

  return {
    name: "code-server",
    short_name: "code-server",
    start_url: base,
    display: "fullscreen",
    "background-color": "#fff",
    description: "Run editors on a remote server.",
    icons,
  }
}

router.get("/code-server.webmanifest", (req, res) => {
  const webManifest = commonTemplateVars(req)

  res.contentType("application/manifest+json").json(createWebManifest(webManifest))
})
