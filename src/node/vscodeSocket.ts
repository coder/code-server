import { logger } from "@coder/logger"
import express from "express"
import * as http from "http"
import * as path from "path"
import { HttpCode } from "../common/http"
import { listen } from "./app"
import { canConnect } from "./util"

export interface EditorSessionEntry {
  workspace: {
    id: string
    folders: {
      uri: {
        path: string
      }
    }[]
  }

  socketPath: string
}

interface DeleteSessionRequest {
  socketPath?: string
}

interface AddSessionRequest {
  entry?: EditorSessionEntry
}

interface GetSessionResponse {
  socketPath?: string
}

export async function makeEditorSessionManagerServer(
  codeServerSocketPath: string,
  editorSessionManager: EditorSessionManager,
): Promise<http.Server> {
  const router = express()

  router.use(express.json())

  router.get<{}, GetSessionResponse | string | unknown, undefined, { filePath?: string }>(
    "/session",
    async (req, res) => {
      const filePath = req.query.filePath
      if (!filePath) {
        res.status(HttpCode.BadRequest).send("filePath is required")
        return
      }
      try {
        const socketPath = await editorSessionManager.getConnectedSocketPath(filePath)
        const response: GetSessionResponse = { socketPath }
        res.json(response)
      } catch (error: unknown) {
        res.status(HttpCode.ServerError).send(error)
      }
    },
  )

  router.post<{}, string, AddSessionRequest | undefined>("/add-session", async (req, res) => {
    const entry = req.body?.entry
    if (!entry) {
      res.status(400).send("entry is required")
      return
    }
    editorSessionManager.addSession(entry)
    res.status(200).send("session added")
  })

  router.post<{}, string, DeleteSessionRequest | undefined>("/delete-session", async (req, res) => {
    const socketPath = req.body?.socketPath
    if (!socketPath) {
      res.status(400).send("socketPath is required")
      return
    }
    editorSessionManager.deleteSession(socketPath)
    res.status(200).send("session deleted")
  })

  const server = http.createServer(router)
  try {
    await listen(server, { socket: codeServerSocketPath })
  } catch (e) {
    logger.warn(`Could not create socket at ${codeServerSocketPath}`)
  }
  return server
}

export class EditorSessionManager {
  // Map from socket path to EditorSessionEntry.
  private entries = new Map<string, EditorSessionEntry>()

  addSession(entry: EditorSessionEntry): void {
    logger.debug(`Adding session to session registry: ${entry.socketPath}`)
    this.entries.set(entry.socketPath, entry)
  }

  getCandidatesForFile(filePath: string): EditorSessionEntry[] {
    const matchCheckResults = new Map<string, boolean>()

    const checkMatch = (entry: EditorSessionEntry): boolean => {
      if (matchCheckResults.has(entry.socketPath)) {
        return matchCheckResults.get(entry.socketPath)!
      }
      const result = entry.workspace.folders.some((folder) => filePath.startsWith(folder.uri.path + path.sep))
      matchCheckResults.set(entry.socketPath, result)
      return result
    }

    return Array.from(this.entries.values())
      .reverse() // Most recently registered first.
      .sort((a, b) => {
        // Matches first.
        const aMatch = checkMatch(a)
        const bMatch = checkMatch(b)
        if (aMatch === bMatch) {
          return 0
        }
        if (aMatch) {
          return -1
        }
        return 1
      })
  }

  deleteSession(socketPath: string): void {
    logger.debug(`Deleting session from session registry: ${socketPath}`)
    this.entries.delete(socketPath)
  }

  /**
   * Returns the best socket path that we can connect to.
   * We also delete any sockets that we can't connect to.
   */
  async getConnectedSocketPath(filePath: string): Promise<string | undefined> {
    const candidates = this.getCandidatesForFile(filePath)
    let match: EditorSessionEntry | undefined = undefined

    for (const candidate of candidates) {
      if (await canConnect(candidate.socketPath)) {
        match = candidate
        break
      }
      this.deleteSession(candidate.socketPath)
    }

    return match?.socketPath
  }
}

export class EditorSessionManagerClient {
  constructor(private codeServerSocketPath: string) {}

  async canConnect() {
    return canConnect(this.codeServerSocketPath)
  }

  async getConnectedSocketPath(filePath: string): Promise<string | undefined> {
    const response = await new Promise<GetSessionResponse>((resolve, reject) => {
      const opts = {
        path: "/session?filePath=" + encodeURIComponent(filePath),
        socketPath: this.codeServerSocketPath,
        method: "GET",
      }
      const req = http.request(opts, (res) => {
        let rawData = ""
        res.setEncoding("utf8")
        res.on("data", (chunk) => {
          rawData += chunk
        })
        res.on("end", () => {
          try {
            const obj = JSON.parse(rawData)
            if (res.statusCode === 200) {
              resolve(obj)
            } else {
              reject(new Error("Unexpected status code: " + res.statusCode))
            }
          } catch (e: unknown) {
            reject(e)
          }
        })
      })
      req.on("error", reject)
      req.end()
    })
    return response.socketPath
  }

  // Currently only used for tests.
  async addSession(request: AddSessionRequest): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const opts = {
        path: "/add-session",
        socketPath: this.codeServerSocketPath,
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
      }
      const req = http.request(opts, () => {
        resolve()
      })
      req.on("error", reject)
      req.write(JSON.stringify(request))
      req.end()
    })
  }
}
