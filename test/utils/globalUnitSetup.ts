import { workspaceDir } from "./constants"
import { clean } from "./helpers"

/**
 * Perform workspace cleanup. This should be ran before unit tests execute.
 */
export default async function () {
  await clean(workspaceDir)
}
