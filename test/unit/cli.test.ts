import { Level, logger } from "@coder/logger"
import { promises as fs } from "fs"
import * as net from "net"
import * as os from "os"
import * as path from "path"
import { Args, parse, setDefaults, shouldOpenInExistingInstance, splitOnFirstEquals } from "../../src/node/cli"
import { tmpdir } from "../../src/node/constants"
import { paths } from "../../src/node/util"

type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

describe("parser", () => {
  beforeEach(() => {
    delete process.env.LOG_LEVEL
    delete process.env.PASSWORD
    console.log = jest.fn()
  })

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
  }

  it("should parse nothing", () => {
    expect(parse([])).toStrictEqual({ _: [] })
  })

  it("should parse all available options", () => {
    expect(
      parse([
        "--enable",
        "feature1",
        "--enable",
        "feature2",
        "--bind-addr=192.169.0.1:8080",
        "--auth",
        "none",
        "--extensions-dir",
        "foo",
        "--builtin-extensions-dir",
        "foobar",
        "--extra-extensions-dir",
        "nozzle",
        "1",
        "--extra-builtin-extensions-dir",
        "bazzle",
        "--verbose",
        "2",
        "--log",
        "error",
        "--help",
        "--open",
        "--socket=mumble",
        "3",
        "--user-data-dir",
        "bar",
        "--cert=baz",
        "--cert-key",
        "qux",
        "--version",
        "--json",
        "--port=8081",
        "--host",
        "0.0.0.0",
        "4",
        "--",
        "-5",
        "--6",
      ]),
    ).toEqual({
      _: ["1", "2", "3", "4", "-5", "--6"],
      auth: "none",
      "builtin-extensions-dir": path.resolve("foobar"),
      "cert-key": path.resolve("qux"),
      cert: {
        value: path.resolve("baz"),
      },
      enable: ["feature1", "feature2"],
      "extensions-dir": path.resolve("foo"),
      "extra-builtin-extensions-dir": [path.resolve("bazzle")],
      "extra-extensions-dir": [path.resolve("nozzle")],
      help: true,
      host: "0.0.0.0",
      json: true,
      log: "error",
      open: true,
      port: 8081,
      socket: path.resolve("mumble"),
      "user-data-dir": path.resolve("bar"),
      verbose: true,
      version: true,
      "bind-addr": "192.169.0.1:8080",
    })
  })

  it("should work with short options", () => {
    expect(parse(["-vvv", "-v"])).toEqual({
      _: [],
      verbose: true,
      version: true,
    })
  })

  it("should use log level env var", async () => {
    const args = parse([])
    expect(args).toEqual({ _: [] })

    process.env.LOG_LEVEL = "debug"
    const defaults = await setDefaults(args)
    expect(defaults).toStrictEqual({
      ...defaults,
      _: [],
      log: "debug",
      verbose: false,
    })
    expect(process.env.LOG_LEVEL).toEqual("debug")
    expect(logger.level).toEqual(Level.Debug)

    process.env.LOG_LEVEL = "trace"
    const updated = await setDefaults(args)
    expect(updated).toStrictEqual({
      ...updated,
      _: [],
      log: "trace",
      verbose: true,
    })
    expect(process.env.LOG_LEVEL).toEqual("trace")
    expect(logger.level).toEqual(Level.Trace)
  })

  it("should prefer --log to env var and --verbose to --log", async () => {
    let args = parse(["--log", "info"])
    expect(args).toEqual({
      _: [],
      log: "info",
    })

    process.env.LOG_LEVEL = "debug"
    const defaults = await setDefaults(args)
    expect(defaults).toEqual({
      ...defaults,
      _: [],
      log: "info",
      verbose: false,
    })
    expect(process.env.LOG_LEVEL).toEqual("info")
    expect(logger.level).toEqual(Level.Info)

    process.env.LOG_LEVEL = "trace"
    const updated = await setDefaults(args)
    expect(updated).toEqual({
      ...defaults,
      _: [],
      log: "info",
      verbose: false,
    })
    expect(process.env.LOG_LEVEL).toEqual("info")
    expect(logger.level).toEqual(Level.Info)

    args = parse(["--log", "info", "--verbose"])
    expect(args).toEqual({
      _: [],
      log: "info",
      verbose: true,
    })

    process.env.LOG_LEVEL = "warn"
    const updatedAgain = await setDefaults(args)
    expect(updatedAgain).toEqual({
      ...defaults,
      _: [],
      log: "trace",
      verbose: true,
    })
    expect(process.env.LOG_LEVEL).toEqual("trace")
    expect(logger.level).toEqual(Level.Trace)
  })

  it("should ignore invalid log level env var", async () => {
    process.env.LOG_LEVEL = "bogus"
    const defaults = await setDefaults(parse([]))
    expect(defaults).toEqual({
      ...defaults,
      _: [],
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

  it("should not error if the value is optional", () => {
    expect(parse(["--cert"])).toEqual({
      _: [],
      cert: {
        value: undefined,
      },
    })
  })

  it("should not allow option-like values", () => {
    expect(() => parse(["--socket", "--socket-path-value"])).toThrowError(/--socket requires a value/)
    // If you actually had a path like this you would do this instead:
    expect(parse(["--socket", "./--socket-path-value"])).toEqual({
      _: [],
      socket: path.resolve("--socket-path-value"),
    })
    expect(() => parse(["--cert", "--socket-path-value"])).toThrowError(/Unknown option --socket-path-value/)
  })

  it("should allow positional arguments before options", () => {
    expect(parse(["foo", "test", "--auth", "none"])).toEqual({
      _: ["foo", "test"],
      auth: "none",
    })
  })

  it("should support repeatable flags", () => {
    expect(parse(["--proxy-domain", "*.coder.com"])).toEqual({
      _: [],
      "proxy-domain": ["*.coder.com"],
    })
    expect(parse(["--proxy-domain", "*.coder.com", "--proxy-domain", "test.com"])).toEqual({
      _: [],
      "proxy-domain": ["*.coder.com", "test.com"],
    })
  })

  it("should enforce cert-key with cert value or otherwise generate one", async () => {
    const args = parse(["--cert"])
    expect(args).toEqual({
      _: [],
      cert: {
        value: undefined,
      },
    })
    expect(() => parse(["--cert", "test"])).toThrowError(/--cert-key is missing/)
    const defaultArgs = await setDefaults(args)
    expect(defaultArgs).toEqual({
      _: [],
      ...defaults,
      cert: {
        value: path.join(paths.data, "localhost.crt"),
      },
      "cert-key": path.join(paths.data, "localhost.key"),
    })
  })

  it("should override with --link", async () => {
    const args = parse("--cert test --cert-key test --socket test --host 0.0.0.0 --port 8888 --link test".split(" "))
    const defaultArgs = await setDefaults(args)
    expect(defaultArgs).toEqual({
      _: [],
      ...defaults,
      auth: "none",
      host: "localhost",
      link: {
        value: "test",
      },
      port: 0,
      cert: undefined,
      "cert-key": path.resolve("test"),
      socket: undefined,
    })
  })

  it("should use env var password", async () => {
    process.env.PASSWORD = "test"
    const args = parse([])
    expect(args).toEqual({
      _: [],
    })

    const defaultArgs = await setDefaults(args)
    expect(defaultArgs).toEqual({
      ...defaults,
      _: [],
      password: "test",
      usingEnvPassword: true,
    })
  })

  it("should use env var hashed password", async () => {
    process.env.HASHED_PASSWORD =
      "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY" // test
    const args = parse([])
    expect(args).toEqual({
      _: [],
    })

    const defaultArgs = await setDefaults(args)
    expect(defaultArgs).toEqual({
      ...defaults,
      _: [],
      "hashed-password":
        "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY",
      usingEnvHashedPassword: true,
    })
  })

  it("should filter proxy domains", async () => {
    const args = parse(["--proxy-domain", "*.coder.com", "--proxy-domain", "coder.com", "--proxy-domain", "coder.org"])
    expect(args).toEqual({
      _: [],
      "proxy-domain": ["*.coder.com", "coder.com", "coder.org"],
    })

    const defaultArgs = await setDefaults(args)
    expect(defaultArgs).toEqual({
      ...defaults,
      _: [],
      "proxy-domain": ["coder.com", "coder.org"],
    })
  })
  it("should allow '=,$/' in strings", async () => {
    const args = parse([
      "--enable-proposed-api",
      "$argon2i$v=19$m=4096,t=3,p=1$0qr/o+0t00hsbjfqcksfdq$ofcm4rl6o+b7oxpua4qlxubypbbpsf+8l531u7p9hyy",
    ])
    expect(args).toEqual({
      _: [],
      "enable-proposed-api": [
        "$argon2i$v=19$m=4096,t=3,p=1$0qr/o+0t00hsbjfqcksfdq$ofcm4rl6o+b7oxpua4qlxubypbbpsf+8l531u7p9hyy",
      ],
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
      _: [],
      "hashed-password":
        "$argon2i$v=19$m=4096,t=3,p=1$0qr/o+0t00hsbjfqcksfdq$ofcm4rl6o+b7oxpua4qlxubypbbpsf+8l531u7p9hyy",
    })
  })
})

describe("cli", () => {
  let args: Mutable<Args> = { _: [] }
  const testDir = path.join(tmpdir, "tests/cli")
  const vscodeIpcPath = path.join(os.tmpdir(), "vscode-ipc")

  beforeAll(async () => {
    await fs.rmdir(testDir, { recursive: true })
    await fs.mkdir(testDir, { recursive: true })
  })

  beforeEach(async () => {
    delete process.env.VSCODE_IPC_HOOK_CLI
    args = { _: [] }
    await fs.rmdir(vscodeIpcPath, { recursive: true })
  })

  it("should use existing if inside code-server", async () => {
    process.env.VSCODE_IPC_HOOK_CLI = "test"
    expect(await shouldOpenInExistingInstance(args)).toStrictEqual("test")

    args.port = 8081
    args._.push("./file")
    expect(await shouldOpenInExistingInstance(args)).toStrictEqual("test")
  })

  it("should use existing if --reuse-window is set", async () => {
    args["reuse-window"] = true
    await expect(shouldOpenInExistingInstance(args)).resolves.toStrictEqual(undefined)

    await fs.writeFile(vscodeIpcPath, "test")
    await expect(shouldOpenInExistingInstance(args)).resolves.toStrictEqual("test")

    args.port = 8081
    await expect(shouldOpenInExistingInstance(args)).resolves.toStrictEqual("test")
  })

  it("should use existing if --new-window is set", async () => {
    args["new-window"] = true
    expect(await shouldOpenInExistingInstance(args)).toStrictEqual(undefined)

    await fs.writeFile(vscodeIpcPath, "test")
    expect(await shouldOpenInExistingInstance(args)).toStrictEqual("test")

    args.port = 8081
    expect(await shouldOpenInExistingInstance(args)).toStrictEqual("test")
  })

  it("should use existing if no unrelated flags are set, has positional, and socket is active", async () => {
    expect(await shouldOpenInExistingInstance(args)).toStrictEqual(undefined)

    args._.push("./file")
    expect(await shouldOpenInExistingInstance(args)).toStrictEqual(undefined)

    const socketPath = path.join(testDir, "socket")
    await fs.writeFile(vscodeIpcPath, socketPath)
    expect(await shouldOpenInExistingInstance(args)).toStrictEqual(undefined)

    await new Promise((resolve) => {
      const server = net.createServer(() => {
        // Close after getting the first connection.
        server.close()
      })
      server.once("listening", () => resolve(server))
      server.listen(socketPath)
    })

    expect(await shouldOpenInExistingInstance(args)).toStrictEqual(socketPath)

    args.port = 8081
    expect(await shouldOpenInExistingInstance(args)).toStrictEqual(undefined)
  })
})

describe("splitOnFirstEquals", () => {
  it("should split on the first equals", () => {
    const testStr = "enabled-proposed-api=test=value"
    const actual = splitOnFirstEquals(testStr)
    const expected = ["enabled-proposed-api", "test=value"]
    expect(actual).toEqual(expect.arrayContaining(expected))
  })
  it("should split on first equals regardless of multiple equals signs", () => {
    const testStr =
      "hashed-password=$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY"
    const actual = splitOnFirstEquals(testStr)
    const expected = [
      "hashed-password",
      "$argon2i$v=19$m=4096,t=3,p=1$0qR/o+0t00hsbJFQCKSfdQ$oFcM4rL6o+B7oxpuA4qlXubypbBPsf+8L531U7P9HYY",
    ]
    expect(actual).toEqual(expect.arrayContaining(expected))
  })
  it("should always return the first element before an equals", () => {
    const testStr = "auth="
    const actual = splitOnFirstEquals(testStr)
    const expected = ["auth"]
    expect(actual).toEqual(expect.arrayContaining(expected))
  })
})
