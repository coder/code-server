import { exec } from "child_process"
import path from "path"
import { promisify } from "util"

/**
 *
 * A helper function for integration tests to run code-server commands.
 */
export async function runCodeServerCommand(
  argv: string[],
  env?: NodeJS.ProcessEnv,
): Promise<{ stdout: string; stderr: string }> {
  const CODE_SERVER_COMMAND = process.env.CODE_SERVER_PATH || path.resolve("../../release-standalone/bin/code-server")
  const { stdout, stderr } = await promisify(exec)(`${CODE_SERVER_COMMAND} ${argv.join(" ")}`, {
    env: { ...process.env, ...env },
  })

  return { stdout, stderr }
}
