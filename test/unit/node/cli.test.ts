import { Level, logger } from "@coder/logger"
import { promises as fs } from "fs"
import * as path from "path"
import {
  UserProvidedArgs,
  bindAddrFromArgs,
  defaultConfigFile,
  parse,
  setDefaults,
  shouldOpenInExistingInstance,
  toCodeArgs,
  optionDescriptions,
  options,
  Options,
  AuthType,
  OptionalString,
} from "../../../src/node/cli"
import { shouldSpawnCliProcess } from "../../../src/node/main"
import { generatePassword, paths } from "../../../src/node/util"
import {
  EditorSessionManager,
  EditorSessionManagerClient,
  makeEditorSessionManagerServer,
} from "../../../src/node/vscodeSocket"
import { clean, useEnv, tmpdir, listenOn } from "../../utils/helpers"

// The parser should not set any defaults so the caller can determine what
// values the user actually set. These are only set after explicitly calling
// `setDefaults`.
const defaults = {
  auth: "password",
  host: "localhost",
  port: 8080,
  "proxy-domain": [],
  usingEnvPassword: false,
  usingEnvHashedPassword: false,
  "extensions-dir": path.join(paths.data, "extensions"),
  "user-data-dir": paths.data,
  "session-socket": path.join(paths.data, "code-server-ipc.sock"),
  _: [],
}

describe("parser", () => {
  beforeEach(() => {
    delete process.env.LOG_LEVEL
    delete process.env.PASSWORD
    delete process.env.CS_DISABLE_FILE_DOWNLOADS
    delete process.env.CS_DISABLE_GETTING_STARTED_OVERRIDE
    delete process.env.VSCODE_PROXY_URI
    delete process.env.CS_DISABLE_PROXY
    console.log = jest.fn()
  })

  it("should parse nothing", async () => {
    expect(parse([])).toStrictEqual({})
  })

  it("should parse all available options", async () => {
    expect(
      parse(
        [
          ["--enable", "feature1"],
          ["--enable", "feature2"],

          "--bind-addr=192.169.0.1:8080",

          ["--auth", "none"],

          ["--extensions-dir", "path/to/ext/dir"],

          ["--builtin-extensions-dir", "path/to/builtin/ext/dir"],

          "1",
          "--verbose",
          ["--app-name", "custom instance name"],
          ["--welcome-text", "welcome to code"],
          "2",

          ["--locale", "ja"],

          ["--log", "error"],

          "--help",

          "--open",

          "--socket=mumble",

          "--socket-mode=777",

          "3",

          ["--user-data-dir", "path/to/user/dir"],

          ["--cert=path/to/cert", "--cert-key", "path/to/cert/key"],

          "--version",

          "--json",

          "--port=8081",

          "--disable-file-downloads",

          "--disable-getting-started-override",

          "--disable-proxy",

          ["--abs-proxy-base-path", "/codeserver/app1"],

          ["--session-socket", "/tmp/override-code-server-ipc-socket"],

          ["--host", "0.0.0.0"],
          "4",
          "--",
          "--5",
        ].flat(),
      ),
    ).toEqual({
      _: ["1", "2", "3", "4", "--5"],
      auth: "none",
      "builtin-extensions-dir": path.resolve("path/to/builtin/ext/dir"),
      "extensions-dir": path.resolve("path/to/ext/dir"),
      "user-data-dir": path.resolve("path/to/user/dir"),
      "cert-key": path.resolve("path/to/cert/key"),
      cert: {
        value: path.resolve("path/to/cert"),
      },
      "disable-file-downloads": true,
      "disable-getting-started-override": true,
      "disable-proxy": true,
      enable: ["feature1", "feature2"],
      help: true,
      host: "0.0.0.0",
      json: true,
      locale: "ja",
      log: "error",
      open: true,
      port: 8081,
      socket: path.resolve("mumble"),
      "socket-mode": "777",
      verbose: true,
      "app-name": "custom instance name",
      "welcome-text": "welcome to code",
      version: true,
      "bind-addr": "192.169.0.1:8080",
      "session-socket": "/tmp/override-code-server-ipc-socket",
      "abs-proxy-base-path": "/codeserver/app1",
    })
  })

  it("should work with short options", async () => {
    expect(parse(["-vvv", "-v"])).toEqual({
      verbose: true,
      version: true,
    })
  })

  it("should use log level env var", async () => {
    const args = parse([])
    expect(args).toEqual({})

    process.env.LOG_LEVEL = "debug"
    const defaults = await setDefaults(args)
    expect(defaults).toStrictEqual({
      ...defaults,
      log: "debug",
      verbose: false,
    })
    expect(process.env.LOG_LEVEL).toEqual("debug")
    expect(logger.level).toEqual(Level.Debug)

    process.env.LOG_LEVEL = "trace"
    const updated = await setDefaults(args)
    expect(updated).toStrictEqual({
      ...updated,
      log: "trace",
      verbose: true,
    })
    expect(process.env.LOG_LEVEL).toEqual("trace")
    expect(logger.level).toEqual(Level.Trace)
  })

  it("should prefer --log to env var and --verbose to --log", async () => {
    let args = parse(["--log", "info"])
    expect(args).toEqual({
      log: "info",
    })

    process.env.LOG_LEVEL = "debug"
    const defaults = await setDefaults(args)
    expect(defaults).toEqual({
      ...defaults,
      log: "info",
      verbose: false,
    })
    expect(process.env.LOG_LEVEL).toEqual("info")
    expect(logger.level).toEqual(Level.Info)

    process.env.LOG_LEVEL = "trace"
    const updated = await setDefaults(args)
    expect(updated).toEqual({
      ...defaults,
      log: "info",
      verbose: false,
    })
    expect(process.env.LOG_LEVEL).toEqual("info")
    expect(logger.level).toEqual(Level.Info)

    args = parse(["--log", "info", "--verbose"])
    expect(args).toEqual({
      log: "info",
      verbose: true,
    })

    process.env.LOG_LEVEL = "warn"
    const updatedAgain = await setDefaults(args)
    expect(updatedAgain).toEqual({
      ...defaults,
      log: "trace",
      verbose: true,
    })
    expect(process.env.LOG_LEVEL).toEqual("trace")
    expect(logger.level).toEqual(Level.Trace)
  })

  it("should set valid log level env var", async () => {
    process.env.LOG_LEVEL = "error"
    const defaults = await setDefaults(parse([]))
    expect(defaults).toEqual({
      ...defaults,
      log: "error",
    })
  })

  it("should ignore invalid log level env var", async () => {
    process.env.LOG_LEVEL = "bogus"
    const defaults = await setDefaults(parse([]))
    expect(defaults).toEqual({
      ...defaults,
    })
  })

  it("should error if value isn't provided", () => {
    expect(() => parse(["--auth"])).toThrowError(/--auth requires a value/)
    expect(() => parse(["--auth=", "--log=debug"])).toThrowError(/--auth requires a value/)
    expect(() => parse(["--auth", "--log"])).toThrowError(/--auth requires a value/)
    expect(() => parse(["--auth", "--invalid"])).toThrowError(/--auth requires a value/)
    expect(() => parse(["--bind-addr"])).toThrowError(/--bind-addr requires a value/)
  })

  it("should error if value is invalid", () => {
    expect(() => parse(["--port", "foo"])).toThrowError(/--port must be a number/)
    expect(() => parse(["--auth", "invalid"])).toThrowError(/--auth valid values: \[password, none\]/)
    expect(() => parse(["--log", "invalid"])).toThrowError(/--log valid values: \[trace, debug, info, warn, error\]/)
  })

  it("should error if the option doesn't exist", () => {
    expect(() => parse(["--foo"])).toThrowError(/Unknown option --foo/)
  })

  it("should not error if the value is optional", async () => {
    expect(parse(["--cert"])).toEqual({
      cert: {
        value: undefined,
      },
    })
  })

  it("should not allow option-like values", () => {
    expect(() => parse(["--socket", "--socket-path-value"])).toThrowError(/--socket requires a value/)
    // If you actually had a path like this you would do this instead:
    expect(parse(["--socket", "./--socket-path-value"])).toEqual({
      socket: path.resolve("--socket-path-value"),
    })
    expect(() => parse(["--cert", "--socket-path-value"])).toThrowError(/Unknown option --socket-path-value/)
  })

  it("should allow positional arguments before options", async () => {
    expect(parse(["test", "--auth", "none"])).toEqual({
      _: ["test"],
      auth: "none",
    })
  })

  it("should support repeatable flags", async () => {
    expect(parse(["--proxy-domain", "*.coder.com"])).toEqual({
      "proxy-domain": ["*.coder.com"],
    })
    expect(parse(["--proxy-domain", "*.coder.com", "--proxy-domain", "test.com"])).toEqual({
      "proxy-domain": ["*.coder.com", "test.com"],
    })
  })

  it("should enforce cert-key with cert value or otherwise generate one", async () => {
    const args = parse(["--cert"])
    expect(args).toEqual({
      cert: {
        value: undefined,
      },
    })
    expect(() => parse(["--cert", "test"])).toThrowError(/--cert-key is missing/)
    const defaultArgs = await setDefaults(args)
    expect(defaultArgs).toEqual({
      ...defaults,
      cert: {
        value: path.join(paths.data, "localhost.crt"),
      },
      "cert-key": path.join(paths.data, "localhost.key"),
    })
  })

  it("should use env var password", async () => {
    process.env.PASSWORD = "test"
    const args = parse([])
    expect(args).toEqual({})

    const defaultArgs = await setDefaults(args)
    expect(defaultArgs).toEqual({
      ...defaults,
      password: "test",
      usingEnvPassword: true,
    })
  })

  it("should use env var hashed password", async () => {
    process.env.HASHED_PASSWORD =
      "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY" // test
    const args = parse([])
    expect(args).toEqual({})

    const defaultArgs = await setDefaults(args)
    expect(defaultArgs).toEqual({
      ...defaults,
      "hashed-password":
        "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY",
      usingEnvHashedPassword: true,
    })
  })

  it("should use env var github token", async () => {
    process.env.GITHUB_TOKEN = "ga-foo"
    const args = parse([])
    expect(args).toEqual({})

    const defaultArgs = await setDefaults(args)
    expect(defaultArgs).toEqual({
      ...defaults,
      "github-auth": "ga-foo",
    })
    expect(process.env.GITHUB_TOKEN).toBe(undefined)
  })

  it("should use env var CS_DISABLE_FILE_DOWNLOADS", async () => {
    process.env.CS_DISABLE_FILE_DOWNLOADS = "1"
    const args = parse([])
    expect(args).toEqual({})

    const defaultArgs = await setDefaults(args)
    expect(defaultArgs).toEqual({
      ...defaults,
      "disable-file-downloads": true,
    })
  })

  it("should use env var CS_DISABLE_FILE_DOWNLOADS set to true", async () => {
    process.env.CS_DISABLE_FILE_DOWNLOADS = "true"
    const args = parse([])
    expect(args).toEqual({})

    const defaultArgs = await setDefaults(args)
    expect(defaultArgs).toEqual({
      ...defaults,
      "disable-file-downloads": true,
    })
  })

  it("should use env var CS_DISABLE_GETTING_STARTED_OVERRIDE", async () => {
    process.env.CS_DISABLE_GETTING_STARTED_OVERRIDE = "1"
    const args = parse([])
    expect(args).toEqual({})

    const defaultArgs = await setDefaults(args)
    expect(defaultArgs).toEqual({
      ...defaults,
      "disable-getting-started-override": true,
    })
  })

  it("should use env var CS_DISABLE_GETTING_STARTED_OVERRIDE set to true", async () => {
    process.env.CS_DISABLE_GETTING_STARTED_OVERRIDE = "true"
    const args = parse([])
    expect(args).toEqual({})

    const defaultArgs = await setDefaults(args)
    expect(defaultArgs).toEqual({
      ...defaults,
      "disable-getting-started-override": true,
    })
  })

  it("should use env var CS_DISABLE_PROXY", async () => {
    process.env.CS_DISABLE_PROXY = "1"
    const args = parse([])
    expect(args).toEqual({})

    const defaultArgs = await setDefaults(args)
    expect(defaultArgs).toEqual({
      ...defaults,
      "disable-proxy": true,
    })
  })

  it("should use env var CS_DISABLE_PROXY set to true", async () => {
    process.env.CS_DISABLE_PROXY = "true"
    const args = parse([])
    expect(args).toEqual({})

    const defaultArgs = await setDefaults(args)
    expect(defaultArgs).toEqual({
      ...defaults,
      "disable-proxy": true,
    })
  })

  it("should error if password passed in", () => {
    expect(() => parse(["--password", "supersecret123"])).toThrowError(
      "--password can only be set in the config file or passed in via $PASSWORD",
    )
  })

  it("should error if hashed-password passed in", () => {
    expect(() => parse(["--hashed-password", "fdas423fs8a"])).toThrowError(
      "--hashed-password can only be set in the config file or passed in via $HASHED_PASSWORD",
    )
  })

  it("should error if github-auth passed in", () => {
    expect(() => parse(["--github-auth", "fdas423fs8a"])).toThrowError(
      "--github-auth can only be set in the config file or passed in via $GITHUB_TOKEN",
    )
  })

  it("should filter proxy domains", async () => {
    const args = parse(["--proxy-domain", "*.coder.com", "--proxy-domain", "coder.com", "--proxy-domain", "coder.org"])
    expect(args).toEqual({
      "proxy-domain": ["*.coder.com", "coder.com", "coder.org"],
    })

    const defaultArgs = await setDefaults(args)
    expect(defaultArgs).toEqual({
      ...defaults,
      "proxy-domain": ["{{port}}.coder.com", "{{port}}.coder.org"],
    })
  })
  it("should allow '=,$/' in strings", async () => {
    const args = parse([
      "--disable-update-check",
      "$argon2i$v=19$m=4096,t=3,p=1$0qr/o+0t00hsbjfqcksfdq$ofcm4rl6o+b7oxpua4qlxubypbbpsf+8l531u7p9hyy",
    ])
    expect(args).toEqual({
      "disable-update-check": true,
      _: ["$argon2i$v=19$m=4096,t=3,p=1$0qr/o+0t00hsbjfqcksfdq$ofcm4rl6o+b7oxpua4qlxubypbbpsf+8l531u7p9hyy"],
    })
  })
  it("should parse options with double-dash and multiple equal signs ", async () => {
    const args = parse(
      [
        "--hashed-password=$argon2i$v=19$m=4096,t=3,p=1$0qr/o+0t00hsbjfqcksfdq$ofcm4rl6o+b7oxpua4qlxubypbbpsf+8l531u7p9hyy",
      ],
      {
        configFile: "/pathtoconfig",
      },
    )
    expect(args).toEqual({
      "hashed-password":
        "$argon2i$v=19$m=4096,t=3,p=1$0qr/o+0t00hsbjfqcksfdq$ofcm4rl6o+b7oxpua4qlxubypbbpsf+8l531u7p9hyy",
    })
  })
  it("should throw an error for invalid config values", async () => {
    const fakePath = "/fake-config-path"
    const expectedErrMsg = `error reading ${fakePath}: `

    expect(() =>
      parse(["--foo"], {
        configFile: fakePath,
      }),
    ).toThrowError(expectedErrMsg)
  })
  it("should ignore optional strings set to false", async () => {
    expect(parse(["--cert=false"])).toEqual({})
  })
  it("should use last flag", async () => {
    expect(parse(["--port", "8081", "--port", "8082"])).toEqual({
      port: 8082,
    })
  })

  it("should not set proxy uri", async () => {
    await setDefaults(parse([]))
    expect(process.env.VSCODE_PROXY_URI).toBeUndefined()
  })

  it("should set proxy uri", async () => {
    await setDefaults(parse(["--proxy-domain", "coder.org"]))
    expect(process.env.VSCODE_PROXY_URI).toEqual("//{{port}}.coder.org")
  })

  it("should set proxy uri to first domain", async () => {
    await setDefaults(
      parse(["--proxy-domain", "*.coder.com", "--proxy-domain", "coder.com", "--proxy-domain", "coder.org"]),
    )
    expect(process.env.VSCODE_PROXY_URI).toEqual("//{{port}}.coder.com")
  })

  it("should not override existing proxy uri", async () => {
    process.env.VSCODE_PROXY_URI = "foo"
    await setDefaults(
      parse(["--proxy-domain", "*.coder.com", "--proxy-domain", "coder.com", "--proxy-domain", "coder.org"]),
    )
    expect(process.env.VSCODE_PROXY_URI).toEqual("foo")
  })
})

describe("cli", () => {
  const testName = "cli"
  let tmpDirPath: string

  beforeAll(async () => {
    await clean(testName)
  })

  beforeEach(async () => {
    delete process.env.VSCODE_IPC_HOOK_CLI
    tmpDirPath = await tmpdir(testName)
  })

  it("should use existing if inside code-server", async () => {
    process.env.VSCODE_IPC_HOOK_CLI = "test"
    const args: UserProvidedArgs = {}
    expect(await shouldOpenInExistingInstance(args, "")).toStrictEqual("test")

    args.port = 8081
    args._ = ["./file"]
    expect(await shouldOpenInExistingInstance(args, "")).toStrictEqual("test")
  })

  it("should use existing if --reuse-window is set", async () => {
    const sessionSocket = path.join(tmpDirPath, "session-socket")
    const server = await makeEditorSessionManagerServer(sessionSocket, new EditorSessionManager())

    const args: UserProvidedArgs = {}
    args["reuse-window"] = true
    await expect(shouldOpenInExistingInstance(args, sessionSocket)).rejects.toThrow()

    const socketPath = path.join(tmpDirPath, "socket")
    const client = new EditorSessionManagerClient(sessionSocket)
    await client.addSession({
      entry: {
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
        socketPath,
      },
    })
    const vscodeSockets = listenOn(socketPath)

    await expect(shouldOpenInExistingInstance(args, sessionSocket)).resolves.toStrictEqual(socketPath)

    args.port = 8081
    await expect(shouldOpenInExistingInstance(args, sessionSocket)).resolves.toStrictEqual(socketPath)

    server.close()
    vscodeSockets.close()
  })

  it("should use existing if --new-window is set", async () => {
    const sessionSocket = path.join(tmpDirPath, "session-socket")
    const server = await makeEditorSessionManagerServer(sessionSocket, new EditorSessionManager())

    const args: UserProvidedArgs = {}
    args["new-window"] = true
    await expect(shouldOpenInExistingInstance(args, sessionSocket)).rejects.toThrow()

    const socketPath = path.join(tmpDirPath, "socket")
    const client = new EditorSessionManagerClient(sessionSocket)
    await client.addSession({
      entry: {
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
        socketPath,
      },
    })
    const vscodeSockets = listenOn(socketPath)

    expect(await shouldOpenInExistingInstance(args, sessionSocket)).toStrictEqual(socketPath)

    args.port = 8081
    expect(await shouldOpenInExistingInstance(args, sessionSocket)).toStrictEqual(socketPath)

    server.close()
    vscodeSockets.close()
  })

  it("should use existing if no unrelated flags are set, has positional, and socket is active", async () => {
    const sessionSocket = path.join(tmpDirPath, "session-socket")
    const server = await makeEditorSessionManagerServer(sessionSocket, new EditorSessionManager())

    const args: UserProvidedArgs = {}
    expect(await shouldOpenInExistingInstance(args, sessionSocket)).toStrictEqual(undefined)

    args._ = ["./file"]
    expect(await shouldOpenInExistingInstance(args, sessionSocket)).toStrictEqual(undefined)

    const client = new EditorSessionManagerClient(sessionSocket)
    const socketPath = path.join(tmpDirPath, "socket")
    await client.addSession({
      entry: {
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
        socketPath,
      },
    })
    const vscodeSockets = listenOn(socketPath)

    expect(await shouldOpenInExistingInstance(args, sessionSocket)).toStrictEqual(socketPath)

    args.port = 8081
    expect(await shouldOpenInExistingInstance(args, sessionSocket)).toStrictEqual(undefined)

    server.close()
    vscodeSockets.close()
  })

  it("should prefer matching sessions for only the first path", async () => {
    const sessionSocket = path.join(tmpDirPath, "session-socket")
    const server = await makeEditorSessionManagerServer(sessionSocket, new EditorSessionManager())
    const client = new EditorSessionManagerClient(sessionSocket)
    await client.addSession({
      entry: {
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
      },
    })
    await client.addSession({
      entry: {
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
      },
    })
    listenOn(`${tmpDirPath}/vscode-ipc-aaa.sock`, `${tmpDirPath}/vscode-ipc-bbb.sock`)

    const args: UserProvidedArgs = {}
    args._ = ["/aaa/file", "/bbb/file"]
    expect(await shouldOpenInExistingInstance(args, sessionSocket)).toStrictEqual(`${tmpDirPath}/vscode-ipc-aaa.sock`)

    server.close()
  })
})

describe("shouldSpawnCliProcess", () => {
  it("should return false if no 'extension' related args passed in", async () => {
    const args = {}
    const actual = await shouldSpawnCliProcess(args)
    const expected = false

    expect(actual).toBe(expected)
  })

  it("should return true if 'list-extensions' passed in", async () => {
    const args = {
      ["list-extensions"]: true,
    }
    const actual = await shouldSpawnCliProcess(args)
    const expected = true

    expect(actual).toBe(expected)
  })

  it("should return true if 'install-extension' passed in", async () => {
    const args = {
      ["install-extension"]: ["hello.world"],
    }
    const actual = await shouldSpawnCliProcess(args)
    const expected = true

    expect(actual).toBe(expected)
  })

  it("should return true if 'uninstall-extension' passed in", async () => {
    const args: UserProvidedArgs = {
      ["uninstall-extension"]: ["hello.world"],
    }
    const actual = await shouldSpawnCliProcess(args)
    const expected = true

    expect(actual).toBe(expected)
  })
})

describe("bindAddrFromArgs", () => {
  it("should return the bind address", () => {
    const args: UserProvidedArgs = {}

    const addr = {
      host: "localhost",
      port: 8080,
    }

    const actual = bindAddrFromArgs(addr, args)
    const expected = addr

    expect(actual).toStrictEqual(expected)
  })

  it("should use the bind-address if set in args", () => {
    const args: UserProvidedArgs = {
      ["bind-addr"]: "localhost:3000",
    }

    const addr = {
      host: "localhost",
      port: 8080,
    }

    const actual = bindAddrFromArgs(addr, args)
    const expected = {
      host: "localhost",
      port: 3000,
    }

    expect(actual).toStrictEqual(expected)
  })

  it("should use the host if set in args", () => {
    const args: UserProvidedArgs = {
      ["host"]: "coder",
    }

    const addr = {
      host: "localhost",
      port: 8080,
    }

    const actual = bindAddrFromArgs(addr, args)
    const expected = {
      host: "coder",
      port: 8080,
    }

    expect(actual).toStrictEqual(expected)
  })

  it("should use process.env.CODE_SERVER_HOST if set", () => {
    const [setValue, resetValue] = useEnv("CODE_SERVER_HOST")
    setValue("coder")

    const args: UserProvidedArgs = {}

    const addr = {
      host: "localhost",
      port: 8080,
    }

    const actual = bindAddrFromArgs(addr, args)
    const expected = {
      host: "coder",
      port: 8080,
    }

    expect(actual).toStrictEqual(expected)
    resetValue()
  })

  it("should use the args.host over process.env.CODE_SERVER_HOST if both set", () => {
    const [setValue, resetValue] = useEnv("CODE_SERVER_HOST")
    setValue("coder")

    const args: UserProvidedArgs = {
      host: "123.123.123.123",
    }

    const addr = {
      host: "localhost",
      port: 8080,
    }

    const actual = bindAddrFromArgs(addr, args)
    const expected = {
      host: "123.123.123.123",
      port: 8080,
    }

    expect(actual).toStrictEqual(expected)
    resetValue()
  })

  it("should use process.env.PORT if set", () => {
    const [setValue, resetValue] = useEnv("PORT")
    setValue("8000")

    const args: UserProvidedArgs = {}

    const addr = {
      host: "localhost",
      port: 8080,
    }

    const actual = bindAddrFromArgs(addr, args)
    const expected = {
      host: "localhost",
      port: 8000,
    }

    expect(actual).toStrictEqual(expected)
    resetValue()
  })

  it("should set port if in args", () => {
    const args: UserProvidedArgs = {
      port: 3000,
    }

    const addr = {
      host: "localhost",
      port: 8080,
    }

    const actual = bindAddrFromArgs(addr, args)
    const expected = {
      host: "localhost",
      port: 3000,
    }

    expect(actual).toStrictEqual(expected)
  })

  it("should use the args.port over process.env.PORT if both set", () => {
    const [setValue, resetValue] = useEnv("PORT")
    setValue("8000")

    const args: UserProvidedArgs = {
      port: 3000,
    }

    const addr = {
      host: "localhost",
      port: 8080,
    }

    const actual = bindAddrFromArgs(addr, args)
    const expected = {
      host: "localhost",
      port: 3000,
    }

    expect(actual).toStrictEqual(expected)
    resetValue()
  })
})

describe("defaultConfigFile", () => {
  it("should return the default config file as a string", async () => {
    const password = await generatePassword()
    const actual = defaultConfigFile(password)

    expect(actual).toMatch(`bind-addr: 127.0.0.1:8080
auth: password
password: ${password}
cert: false`)
  })
})

describe("toCodeArgs", () => {
  const vscodeDefaults = {
    ...defaults,
    help: false,
    port: "8080",
    version: false,
    log: undefined,
  }

  const testName = "vscode-args"
  beforeAll(async () => {
    // Clean up temporary directories from the previous run.
    await clean(testName)
  })

  it("should convert empty args", async () => {
    expect(await toCodeArgs(await setDefaults(parse([])))).toStrictEqual({
      ...vscodeDefaults,
    })
  })

  it("should ignore regular file", async () => {
    const file = path.join(await tmpdir(testName), "file")
    await fs.writeFile(file, "foobar")
    expect(await toCodeArgs(await setDefaults(parse([file])))).toStrictEqual({
      ...vscodeDefaults,
      _: [file],
    })
  })
})

describe("optionDescriptions", () => {
  it("should return the descriptions of all the available options", () => {
    const expectedOptionDescriptions = Object.entries(options)
      .flat()
      .filter((item: any) => {
        if (item.description) {
          return item.description
        }
      })
      .map((item: any) => item.description)
    const actualOptionDescriptions = optionDescriptions()
    // We need both the expected and the actual
    // Both of these are string[]
    // We then loop through the expectedOptionDescriptions
    // and check that this expectedDescription exists in the
    // actualOptionDescriptions

    // To do that we need to loop through actualOptionDescriptions
    // and make sure we have a substring match
    expectedOptionDescriptions.forEach((expectedDescription) => {
      const exists = actualOptionDescriptions.find((desc) => {
        if (
          desc.replace(/\n/g, " ").replace(/ /g, "").includes(expectedDescription.replace(/\n/g, " ").replace(/ /g, ""))
        ) {
          return true
        }
        return false
      })
      expect(exists).toBeTruthy()
    })
  })
  it("should visually align multiple options", () => {
    const opts: Partial<Options<Required<UserProvidedArgs>>> = {
      "cert-key": { type: "string", path: true, description: "Path to certificate key when using non-generated cert." },
      "cert-host": {
        type: "string",
        description: "Hostname to use when generating a self signed certificate.",
      },
      "disable-update-check": {
        type: "boolean",
        description:
          "Disable update check. Without this flag, code-server checks every 6 hours against the latest github release and \n" +
          "then notifies you once every week that a new release is available.",
      },
    }
    expect(optionDescriptions(opts)).toStrictEqual([
      "  --cert-key             Path to certificate key when using non-generated cert.",
      "  --cert-host            Hostname to use when generating a self signed certificate.",
      `  --disable-update-check Disable update check. Without this flag, code-server checks every 6 hours against the latest github release and
                          then notifies you once every week that a new release is available.`,
    ])
  })
  it("should add all valid options for enumerated types", () => {
    const opts: Partial<Options<Required<UserProvidedArgs>>> = {
      auth: { type: AuthType, description: "The type of authentication to use." },
    }
    expect(optionDescriptions(opts)).toStrictEqual(["  --auth The type of authentication to use. [password, none]"])
  })

  it("should show if an option is deprecated", () => {
    const opts: Partial<Options<Required<UserProvidedArgs>>> = {
      cert: {
        type: OptionalString,
        description: "foo",
        deprecated: true,
      },
    }
    expect(optionDescriptions(opts)).toStrictEqual(["  --cert (deprecated) foo"])
  })

  it("should show newlines in description", () => {
    const opts: Partial<Options<Required<UserProvidedArgs>>> = {
      "install-extension": {
        type: "string[]",
        description:
          "Install or update a VS Code extension by id or vsix. The identifier of an extension is `${publisher}.${name}`.\n" +
          "To install a specific version provide `@${version}`. For example: 'vscode.csharp@1.2.3'.",
      },
    }
    expect(optionDescriptions(opts)).toStrictEqual([
      `  --install-extension Install or update a VS Code extension by id or vsix. The identifier of an extension is \`\${publisher}.\${name}\`.
                       To install a specific version provide \`@\${version}\`. For example: 'vscode.csharp@1.2.3'.`,
    ])
  })
})
