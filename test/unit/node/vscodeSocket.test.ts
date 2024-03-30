import { logger } from "@coder/logger"
import * as app from "../../../src/node/app"
import { EditorSessionManager, makeEditorSessionManagerServer } from "../../../src/node/vscodeSocket"
import { clean, tmpdir, listenOn, mockLogger } from "../../utils/helpers"

describe("makeEditorSessionManagerServer", () => {
  let tmpDirPath: string

  const testName = "mesms"

  beforeAll(async () => {
    jest.clearAllMocks()
    mockLogger()
    await clean(testName)
  })

  afterAll(() => {
    jest.resetModules()
  })

  beforeEach(async () => {
    tmpDirPath = await tmpdir(testName)
  })

  it("warns if socket cannot be created", async () => {
    jest.spyOn(app, "listen").mockImplementation(() => {
      throw new Error()
    })
    const server = await makeEditorSessionManagerServer(
      `${tmpDirPath}/code-server-ipc.sock`,
      new EditorSessionManager(),
    )
    expect(logger.warn).toHaveBeenCalledWith(`Could not create socket at ${tmpDirPath}/code-server-ipc.sock`)
    server.close()
  })
})

describe("EditorSessionManager", () => {
  let tmpDirPath: string

  const testName = "esm"

  beforeAll(async () => {
    await clean(testName)
  })

  beforeEach(async () => {
    tmpDirPath = await tmpdir(testName)
  })

  describe("getCandidatesForFile", () => {
    it("should prefer the last added socket path for a matching path", async () => {
      const manager = new EditorSessionManager()
      manager.addSession({
        workspace: {
          id: "aaa",
          folders: [
            {
              uri: {
                path: "/aaa",
              },
            },
          ],
        },
        socketPath: `${tmpDirPath}/vscode-ipc-aaa-1.sock`,
      })
      manager.addSession({
        workspace: {
          id: "aaa",
          folders: [
            {
              uri: {
                path: "/aaa",
              },
            },
          ],
        },
        socketPath: `${tmpDirPath}/vscode-ipc-aaa-2.sock`,
      })
      manager.addSession({
        workspace: {
          id: "bbb",
          folders: [
            {
              uri: {
                path: "/bbb",
              },
            },
          ],
        },
        socketPath: `${tmpDirPath}/vscode-ipc-bbb.sock`,
      })
      const socketPaths = manager.getCandidatesForFile("/aaa/some-file:1:1")
      expect(socketPaths.map((x) => x.socketPath)).toEqual([
        // Matches
        `${tmpDirPath}/vscode-ipc-aaa-2.sock`,
        `${tmpDirPath}/vscode-ipc-aaa-1.sock`,
        // Non-matches
        `${tmpDirPath}/vscode-ipc-bbb.sock`,
      ])
    })

    it("should return the last added socketPath if there are no matches", async () => {
      const manager = new EditorSessionManager()
      manager.addSession({
        workspace: {
          id: "aaa",
          folders: [
            {
              uri: {
                path: "/aaa",
              },
            },
          ],
        },
        socketPath: `${tmpDirPath}/vscode-ipc-aaa.sock`,
      })
      manager.addSession({
        workspace: {
          id: "bbb",
          folders: [
            {
              uri: {
                path: "/bbb",
              },
            },
          ],
        },
        socketPath: `${tmpDirPath}/vscode-ipc-bbb.sock`,
      })
      const socketPaths = manager.getCandidatesForFile("/ccc/some-file:1:1")
      expect(socketPaths.map((x) => x.socketPath)).toEqual([
        `${tmpDirPath}/vscode-ipc-bbb.sock`,
        `${tmpDirPath}/vscode-ipc-aaa.sock`,
      ])
    })

    it("does not just directly do a substring match", async () => {
      const manager = new EditorSessionManager()
      manager.addSession({
        workspace: {
          id: "aaa",
          folders: [
            {
              uri: {
                path: "/aaa",
              },
            },
          ],
        },
        socketPath: `${tmpDirPath}/vscode-ipc-aaa.sock`,
      })
      manager.addSession({
        workspace: {
          id: "bbb",
          folders: [
            {
              uri: {
                path: "/bbb",
              },
            },
          ],
        },
        socketPath: `${tmpDirPath}/vscode-ipc-bbb.sock`,
      })
      const entries = manager.getCandidatesForFile("/aaaxxx/some-file:1:1")
      expect(entries.map((x) => x.socketPath)).toEqual([
        `${tmpDirPath}/vscode-ipc-bbb.sock`,
        `${tmpDirPath}/vscode-ipc-aaa.sock`,
      ])
    })
  })

  describe("getConnectedSocketPath", () => {
    it("should return socket path if socket is active", async () => {
      listenOn(`${tmpDirPath}/vscode-ipc-aaa.sock`).once()
      const manager = new EditorSessionManager()
      manager.addSession({
        workspace: {
          id: "aaa",
          folders: [
            {
              uri: {
                path: "/aaa",
              },
            },
          ],
        },
        socketPath: `${tmpDirPath}/vscode-ipc-aaa.sock`,
      })
      const socketPath = await manager.getConnectedSocketPath("/aaa/some-file:1:1")
      expect(socketPath).toBe(`${tmpDirPath}/vscode-ipc-aaa.sock`)
    })

    it("should return undefined if socket is inactive", async () => {
      const manager = new EditorSessionManager()
      manager.addSession({
        workspace: {
          id: "aaa",
          folders: [
            {
              uri: {
                path: "/aaa",
              },
            },
          ],
        },
        socketPath: `${tmpDirPath}/vscode-ipc-aaa.sock`,
      })
      const socketPath = await manager.getConnectedSocketPath("/aaa/some-file:1:1")
      expect(socketPath).toBeUndefined()
    })

    it("should return undefined given no matching active sockets", async () => {
      const vscodeSockets = listenOn(`${tmpDirPath}/vscode-ipc-bbb.sock`)
      const manager = new EditorSessionManager()
      manager.addSession({
        workspace: {
          id: "aaa",
          folders: [
            {
              uri: {
                path: "/aaa",
              },
            },
          ],
        },
        socketPath: `${tmpDirPath}/vscode-ipc-aaa.sock`,
      })
      const socketPath = await manager.getConnectedSocketPath("/aaa/some-file:1:1")
      expect(socketPath).toBeUndefined()
      vscodeSockets.close()
    })

    it("should return undefined if there are no entries", async () => {
      const manager = new EditorSessionManager()
      const socketPath = await manager.getConnectedSocketPath("/aaa/some-file:1:1")
      expect(socketPath).toBeUndefined()
    })

    it("should return most recently used socket path available", async () => {
      listenOn(`${tmpDirPath}/vscode-ipc-aaa-1.sock`).once()
      const manager = new EditorSessionManager()
      manager.addSession({
        workspace: {
          id: "aaa",
          folders: [
            {
              uri: {
                path: "/aaa",
              },
            },
          ],
        },
        socketPath: `${tmpDirPath}/vscode-ipc-aaa-1.sock`,
      })
      manager.addSession({
        workspace: {
          id: "aaa",
          folders: [
            {
              uri: {
                path: "/aaa",
              },
            },
          ],
        },
        socketPath: `${tmpDirPath}/vscode-ipc-aaa-2.sock`,
      })

      const socketPath = await manager.getConnectedSocketPath("/aaa/some-file:1:1")
      expect(socketPath).toBe(`${tmpDirPath}/vscode-ipc-aaa-1.sock`)
      // Failed sockets should be removed from the entries.
      expect((manager as any).entries.has(`${tmpDirPath}/vscode-ipc-aaa-2.sock`)).toBe(false)
    })
  })
})
