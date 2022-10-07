import * as vscode from "vscode"

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("test extension loaded")
  // Test extension
  context.subscriptions.push(
    vscode.commands.registerCommand("codeServerTest.proxyUri", () => {
      if (process.env.VSCODE_PROXY_URI) {
        vscode.window.showInformationMessage(`proxyUri: ${process.env.VSCODE_PROXY_URI}`)
      } else {
        vscode.window.showErrorMessage("No proxy URI was set")
      }
    }),
  )

  // asExternalUri extension
  context.subscriptions.push(
    vscode.commands.registerCommand("codeServerTest.asExternalUri", async () => {
      const input = await vscode.window.showInputBox({
        prompt: "URL to pass through to asExternalUri",
      })

      if (input) {
        const output = await vscode.env.asExternalUri(vscode.Uri.parse(input))
        vscode.window.showInformationMessage(`input: ${input} output: ${output}`)
      } else {
        vscode.window.showErrorMessage(`Failed to run test case. No input provided.`)
      }
    }),
  )
}
