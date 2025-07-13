import * as fs from "fs"
import * as path from "path"

export interface StatikAuth {
  githubToken?: string
  meshIdentity?: string
  persistentSession: boolean
}

export class CopilotAuthManager {
  private authPath = "/root/.statik/keys"
  
  constructor() {
    this.ensureAuthDirectory()
  }
  
  private ensureAuthDirectory(): void {
    if (!fs.existsSync(this.authPath)) {
      fs.mkdirSync(this.authPath, { recursive: true })
    }
  }
  
  loadGitHubToken(): string | null {
    const tokenPath = path.join(this.authPath, "github-token")
    if (fs.existsSync(tokenPath)) {
      return fs.readFileSync(tokenPath, "utf8").trim()
    }
    return null
  }
  
  loadMeshIdentity(): string | null {
    const identityPath = path.join(this.authPath, "mesh-identity.json")
    if (fs.existsSync(identityPath)) {
      return fs.readFileSync(identityPath, "utf8")
    }
    return null
  }
  
  injectCopilotSettings(): any {
    const token = this.loadGitHubToken()
    if (!token) {
      console.warn("⚠️  No GitHub token found, Copilot disabled")
      return {}
    }
    
    console.log("🤖 Injecting Copilot auth for persistent session")
    
    return {
      "github.copilot.enable": true,
      "github.copilotChat.enabled": true,
      "workbench.experimental.chat.enabled": true,
      "github.copilot.advanced": {
        "authProvider": "persistent",
        "token": token
      }
    }
  }
}
