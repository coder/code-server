import { workspaceDir } from "./constants"
import { clean } from "./helpers"
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

  console.log("✅ Global Setup for Playwright End-to-End Tests is now complete.")
}
