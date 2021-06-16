import * as vscode from "vscode"

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("codeServerTest.proxyUri", () => {
      if (process.env.VSCODE_PROXY_URI) {
        vscode.window.showInformationMessage(process.env.VSCODE_PROXY_URI)
      } else {
        vscode.window.showErrorMessage("No proxy URI was set")
      }
    }),
  )
}
