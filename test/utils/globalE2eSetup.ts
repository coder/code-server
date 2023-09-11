import { promises as fs } from "fs"
import * as path from "path"
import { workspaceDir } from "./constants"
import { clean, tmpdir } from "./helpers"
import * as wtfnode from "./wtfnode"

/**
 * Perform workspace cleanup and authenticate. This should be ran before e2e
 * tests execute.
 */
export default async function () {
  console.log("\n🚨 Running Global Setup for Playwright End-to-End Tests")
  console.log("   Please hang tight...")

  // Cleanup workspaces from previous tests.
  await clean(workspaceDir)

  if (process.env.WTF_NODE) {
    wtfnode.setup()
  }

  // Create dummy code-workspace for routes.test.ts
  const codeWorkspace = path.join(await tmpdir(workspaceDir), "test.code-workspace")
  await fs.writeFile(codeWorkspace, "")
  process.env.CODE_WORKSPACE_DIR = codeWorkspace

  // Create dummy folder for routes.test.ts
  const folder = await tmpdir(workspaceDir)
  process.env.CODE_FOLDER_DIR = folder

  console.log("✅ Global Setup for Playwright End-to-End Tests is now complete.")
}
