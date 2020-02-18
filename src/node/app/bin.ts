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
  installed: true,
  name: "VS Code",
  path: "/vscode",
  version: getVscodeVersion(),
}

export const findApplications = async (): Promise<ReadonlyArray<Application>> => {
  const apps: Application[] = [Vscode]

  return apps.sort((a, b): number => a.name.localeCompare(b.name))
}

export const findWhitelistedApplications = async (): Promise<ReadonlyArray<Application>> => {
  return [Vscode]
}
