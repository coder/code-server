const fs = require("fs")
const path = require("path")

const branding = require("../../branding.json")
const root = path.resolve(__dirname, "../..")

const replacements = [
  {
    files: ["ci/build/nfpm.yaml"],
    from: [
      /vendor: "Coder"/g,
      /homepage: "https:\/\/github.com\/coder\/code-server"/g,
      /maintainer: ".*"/g,
    ],
    to: [
      `vendor: "${branding.companyName}"`,
      `homepage: "https://${branding.companyDomain}"`,
      `maintainer: "community@${branding.companyDomain}"`,
    ],
  },
  {
    files: ["package.json"],
    from: [
      /"homepage": "https:\/\/github.com\/coder\/code-server"/g,
      /"url": "https:\/\/github.com\/coder\/code-server\/issues"/g,
      /"repository": "https:\/\/github.com\/coder\/code-server"/g,
    ],
    to: [
      `"homepage": "https://${branding.companyDomain}"`,
      `"url": "https://${branding.companyDomain}/issues"`,
      `"repository": "https://${branding.companyDomain}"`,
    ],
  },
  {
    files: ["src/browser/pages/login.html", "src/browser/pages/error.html"],
    from: [/<title>code-server<\/title>/g, /<meta id="coder-options"/g],
    to: [`<title>${branding.productName}</title>`, `<meta id="product-options"`],
  },
  {
    files: ["install.sh"],
    from: [
      /https:\/\/coder.com\/docs\/code-server\/latest\/install/g,
      /https:\/\/github.com\/coder\/code-server/g,
      /echo_coder_postinstall/g,
    ],
    to: [
      `https://${branding.companyDomain}/docs`,
      `https://github.com/${branding.companyName}/${branding.productName}`,
      "echo_postinstall",
    ],
  },
  {
    files: ["src/node/routes/index.ts"],
    from: [
      /new UpdateProvider\("https:\/\/api.github.com\/repos\/coder\/code-server\/releases\/latest", settings\)/g,
    ],
    to: [
      `new UpdateProvider("https://api.github.com/repos/${branding.companyName}/${branding.productName}/releases/latest", settings)`,
    ],
  },
]

const assetReplacements = [
  { from: branding.faviconIco, to: "src/browser/media/favicon.ico" },
  { from: branding.faviconSvg, to: "src/browser/media/favicon.svg" },
  { from: branding.logoSvg, to: "src/browser/media/logo.svg" },
  { from: branding.pwaIcon192, to: "src/browser/media/pwa-icon-192.png" },
  { from: branding.pwaIcon512, to: "src/browser/media/pwa-icon-512.png" },
]

// Directories that might contain prebuilt release artifacts we need to patch in-place.
const releaseDirs = [
  path.join(root, "release"),
  path.join(root, "release-standalone"),
]

// Helper to safely patch a JSON file by reading, merging, and writing.
function patchJson(file, mutateFn) {
  if (!fs.existsSync(file)) return
  const json = JSON.parse(fs.readFileSync(file, "utf8"))
  const updated = mutateFn(json) || json
  fs.writeFileSync(file, JSON.stringify(updated, null, 2))
}

function applyBrandingToReleaseArtifacts() {
  for (const dir of releaseDirs) {
    if (!fs.existsSync(dir)) continue

    // Copy assets into release dir structure if present.
    const relAssetTargets = [
      { from: branding.faviconIco, to: "src/browser/media/favicon.ico" },
      { from: branding.faviconSvg, to: "src/browser/media/favicon.svg" },
      { from: branding.logoSvg, to: "src/browser/media/logo.svg" },
      { from: branding.pwaIcon192, to: "src/browser/media/pwa-icon-192.png" },
      { from: branding.pwaIcon512, to: "src/browser/media/pwa-icon-512.png" },
    ]

    for (const asset of relAssetTargets) {
      const fromPath = path.join(root, asset.from)
      const toPath = path.join(dir, asset.to)
      if (fs.existsSync(fromPath) && fs.existsSync(path.dirname(toPath))) {
        fs.copyFileSync(fromPath, toPath)
      }
    }

    // Patch VS Code product.json if it exists.
    const productJsonPath = path.join(dir, "lib", "vscode", "product.json")
    patchJson(productJsonPath, (json) => {
      json.shortName = branding.productName
      json.longName = branding.productName
      json.applicationName = branding.productName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
      json.dataFolderName = `${branding.productName}-data`
      json.urlProtocol = branding.productName.toLowerCase()
      json.reportIssueUrl = `https://${branding.companyDomain}/support`
      json.documentationUrl = `https://${branding.companyDomain}`
      json.vendor = branding.companyName
    })
  }
}

function applyReplacements() {
  console.log("Applying branding…")
  for (const { files, from, to } of replacements) {
    for (const file of files) {
      const filePath = path.join(root, file)
      let content = fs.readFileSync(filePath, "utf8")
      for (let i = 0; i < from.length; i += 1) {
        content = content.replace(from[i], to[i])
      }
      fs.writeFileSync(filePath, content, "utf8")
    }
  }

  for (const asset of assetReplacements) {
    const fromPath = path.join(root, asset.from)
    const toPath = path.join(root, asset.to)
    if (fs.existsSync(fromPath)) {
      fs.copyFileSync(fromPath, toPath)
    }
  }

  applyBrandingToReleaseArtifacts()
  console.log("Branding applied successfully.")
}

applyReplacements() 