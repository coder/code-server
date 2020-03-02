import * as fs from "fs"
import * as path from "path"
import { Application } from "../../common/api"

const getVscodeVersion = (): string => {
  try {
    return require(path.resolve(__dirname, "../../../lib/vscode/package.json")).version
  } catch (error) {
    return "unknown"
  }
}

export const Vscode: Application = {
  categories: ["Editor"],
  icon: fs.readFileSync(path.resolve(__dirname, "../../../lib/vscode/resources/linux/code.png")).toString("base64"),
  installed: true,
  name: "VS Code",
  path: "/",
  version: getVscodeVersion(),
}

export const findApplications = async (): Promise<ReadonlyArray<Application>> => {
  const apps: Application[] = [Vscode]

  return apps.sort((a, b): number => a.name.localeCompare(b.name))
}

export const findWhitelistedApplications = async (): Promise<ReadonlyArray<Application>> => {
  return [Vscode]
}
