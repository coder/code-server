import * as vscode from "vscode"

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("test extension loaded")
  context.subscriptions.push(
    vscode.commands.registerCommand("codeServerTest.proxyUri", () => {
      if (process.env.VSCODE_PROXY_URI) {
        vscode.window.showInformationMessage(`proxyUri: ${process.env.VSCODE_PROXY_URI}`)
      } else {
        vscode.window.showErrorMessage("No proxy URI was set")
      }
    }),
  )
}
