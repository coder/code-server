import * as vscode from "vscode"

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("test extension loaded")

  // Prints the current proxy URI into a notification.
  context.subscriptions.push(
    vscode.commands.registerCommand("codeServerTest.proxyUri", () => {
      if (process.env.VSCODE_PROXY_URI) {
        vscode.window.showInformationMessage(`proxyUri: ${process.env.VSCODE_PROXY_URI}`)
      } else {
        vscode.window.showErrorMessage("No proxy URI was set")
      }
    }),
  )

  // Asks for a URI, then runs it through asExternalUri and prints the result
  // into a notification.
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

  const secretKey = "code-server-test-secret"

  // Asks for a string, then stores it as a secret.
  context.subscriptions.push(
    vscode.commands.registerCommand("codeServerTest.setSecret", async () => {
      const input = await vscode.window.showInputBox({
        prompt: "Secret to store",
      })

      if (input) {
        await context.secrets.store(secretKey, input)
        vscode.window.showInformationMessage(`set secret: ${input}`)
      } else {
        vscode.window.showErrorMessage(`Failed to run test case. No input provided.`)
      }
    }),
  )

  // Prints the current secret, if any.
  context.subscriptions.push(
    vscode.commands.registerCommand("codeServerTest.getSecret", async () => {
      vscode.window.showInformationMessage(`get secret: ${await context.secrets.get(secretKey)}`)
    }),
  )
}
