import { Level, logger } from "@coder/logger"
import * as fs from "fs-extra"
import * as net from "net"
import * as os from "os"
import * as path from "path"
import { Args, parse, setDefaults, shouldOpenInExistingInstance } from "../src/node/cli"
import { paths, tmpdir } from "../src/node/util"

type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

describe("parser", () => {
  beforeEach(() => {
    delete process.env.LOG_LEVEL
    delete process.env.PASSWORD
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
    expect(parse([])).toStrictEqual({ _: [] }) })

  it("should parse all available options", () => {
    expect(
      parse([
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
        "--home=http://localhost:8080/",
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
      ])).toEqual(
      {
        _: ["1", "2", "3", "4", "-5", "--6"],
        auth: "none",
        "builtin-extensions-dir": path.resolve("foobar"),
        "cert-key": path.resolve("qux"),
        cert: {
          value: path.resolve("baz"),
        },
        "extensions-dir": path.resolve("foo"),
        "extra-builtin-extensions-dir": [path.resolve("bazzle")],
        "extra-extensions-dir": [path.resolve("nozzle")],
        help: true,
        home: "http://localhost:8080/",
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
      },
    )
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
    expect(updated).toStrictEqual( {
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
    expect(updated).toEqual( {
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
    expect(updatedAgain).toEqual( {
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
    expect(()=> parse(["--foo"])).toThrowError(/Unknown option --foo/)
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

  it(
    "should enforce cert-key with cert value or otherwise generate one",
    async () => {
      const args = parse(["--cert"])
      expect(args).toEqual( {
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
    }
  )

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
    process.env.HASHED_PASSWORD = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08" // test
    const args = parse([])
    expect(args).toEqual({
      _: [],
    })

    const defaultArgs = await setDefaults(args) 
    expect(defaultArgs).toEqual({
      ...defaults,
      _: [],
      "hashed-password": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
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
})

describe("cli", () => {
  let args: Mutable<Args> = { _: [] }
  const testDir = path.join(tmpdir, "tests/cli")
  const vscodeIpcPath = path.join(os.tmpdir(), "vscode-ipc")

  beforeAll(async () => {
    await fs.remove(testDir)
    await fs.mkdirp(testDir)
  })

  beforeEach(async () => {
    delete process.env.VSCODE_IPC_HOOK_CLI
    args = { _: [] }
    await fs.remove(vscodeIpcPath)
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
    await expect(await shouldOpenInExistingInstance(args)).toStrictEqual(undefined)

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

  it(
    "should use existing if no unrelated flags are set, has positional, and socket is active",
    async () => {
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
    }
  )
})
