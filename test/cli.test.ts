import { Level, logger } from "@coder/logger"
import * as assert from "assert"
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
    assert.deepEqual(parse([]), { _: [] })
  })

  it("should parse all available options", () => {
    assert.deepEqual(
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
      ]),
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
    assert.deepEqual(parse(["-vvv", "-v"]), {
      _: [],
      verbose: true,
      version: true,
    })
  })

  it("should use log level env var", async () => {
    const args = parse([])
    assert.deepEqual(args, { _: [] })

    process.env.LOG_LEVEL = "debug"
    assert.deepEqual(await setDefaults(args), {
      ...defaults,
      _: [],
      log: "debug",
      verbose: false,
    })
    assert.equal(process.env.LOG_LEVEL, "debug")
    assert.equal(logger.level, Level.Debug)

    process.env.LOG_LEVEL = "trace"
    assert.deepEqual(await setDefaults(args), {
      ...defaults,
      _: [],
      log: "trace",
      verbose: true,
    })
    assert.equal(process.env.LOG_LEVEL, "trace")
    assert.equal(logger.level, Level.Trace)
  })

  it("should prefer --log to env var and --verbose to --log", async () => {
    let args = parse(["--log", "info"])
    assert.deepEqual(args, {
      _: [],
      log: "info",
    })

    process.env.LOG_LEVEL = "debug"
    assert.deepEqual(await setDefaults(args), {
      ...defaults,
      _: [],
      log: "info",
      verbose: false,
    })
    assert.equal(process.env.LOG_LEVEL, "info")
    assert.equal(logger.level, Level.Info)

    process.env.LOG_LEVEL = "trace"
    assert.deepEqual(await setDefaults(args), {
      ...defaults,
      _: [],
      log: "info",
      verbose: false,
    })
    assert.equal(process.env.LOG_LEVEL, "info")
    assert.equal(logger.level, Level.Info)

    args = parse(["--log", "info", "--verbose"])
    assert.deepEqual(args, {
      _: [],
      log: "info",
      verbose: true,
    })

    process.env.LOG_LEVEL = "warn"
    assert.deepEqual(await setDefaults(args), {
      ...defaults,
      _: [],
      log: "trace",
      verbose: true,
    })
    assert.equal(process.env.LOG_LEVEL, "trace")
    assert.equal(logger.level, Level.Trace)
  })

  it("should ignore invalid log level env var", async () => {
    process.env.LOG_LEVEL = "bogus"
    assert.deepEqual(await setDefaults(parse([])), {
      _: [],
      ...defaults,
    })
  })

  it("should error if value isn't provided", () => {
    assert.throws(() => parse(["--auth"]), /--auth requires a value/)
    assert.throws(() => parse(["--auth=", "--log=debug"]), /--auth requires a value/)
    assert.throws(() => parse(["--auth", "--log"]), /--auth requires a value/)
    assert.throws(() => parse(["--auth", "--invalid"]), /--auth requires a value/)
    assert.throws(() => parse(["--bind-addr"]), /--bind-addr requires a value/)
  })

  it("should error if value is invalid", () => {
    assert.throws(() => parse(["--port", "foo"]), /--port must be a number/)
    assert.throws(() => parse(["--auth", "invalid"]), /--auth valid values: \[password, none\]/)
    assert.throws(() => parse(["--log", "invalid"]), /--log valid values: \[trace, debug, info, warn, error\]/)
  })

  it("should error if the option doesn't exist", () => {
    assert.throws(() => parse(["--foo"]), /Unknown option --foo/)
  })

  it("should not error if the value is optional", () => {
    assert.deepEqual(parse(["--cert"]), {
      _: [],
      cert: {
        value: undefined,
      },
    })
  })

  it("should not allow option-like values", () => {
    assert.throws(() => parse(["--socket", "--socket-path-value"]), /--socket requires a value/)
    // If you actually had a path like this you would do this instead:
    assert.deepEqual(parse(["--socket", "./--socket-path-value"]), {
      _: [],
      socket: path.resolve("--socket-path-value"),
    })
    assert.throws(() => parse(["--cert", "--socket-path-value"]), /Unknown option --socket-path-value/)
  })

  it("should allow positional arguments before options", () => {
    assert.deepEqual(parse(["foo", "test", "--auth", "none"]), {
      _: ["foo", "test"],
      auth: "none",
    })
  })

  it("should support repeatable flags", () => {
    assert.deepEqual(parse(["--proxy-domain", "*.coder.com"]), {
      _: [],
      "proxy-domain": ["*.coder.com"],
    })
    assert.deepEqual(parse(["--proxy-domain", "*.coder.com", "--proxy-domain", "test.com"]), {
      _: [],
      "proxy-domain": ["*.coder.com", "test.com"],
    })
  })

  it("should enforce cert-key with cert value or otherwise generate one", async () => {
    const args = parse(["--cert"])
    assert.deepEqual(args, {
      _: [],
      cert: {
        value: undefined,
      },
    })
    assert.throws(() => parse(["--cert", "test"]), /--cert-key is missing/)
    assert.deepEqual(await setDefaults(args), {
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
    assert.deepEqual(await setDefaults(args), {
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
    assert.deepEqual(args, {
      _: [],
    })

    assert.deepEqual(await setDefaults(args), {
      ...defaults,
      _: [],
      password: "test",
      usingEnvPassword: true,
    })
  })

  it("should use env var hashed password", async () => {
    process.env.HASHED_PASSWORD = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08" // test
    const args = parse([])
    assert.deepEqual(args, {
      _: [],
    })

    assert.deepEqual(await setDefaults(args), {
      ...defaults,
      _: [],
      hashedPassword: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      usingEnvHashedPassword: true,
    })
  })

  it("should filter proxy domains", async () => {
    const args = parse(["--proxy-domain", "*.coder.com", "--proxy-domain", "coder.com", "--proxy-domain", "coder.org"])
    assert.deepEqual(args, {
      _: [],
      "proxy-domain": ["*.coder.com", "coder.com", "coder.org"],
    })

    assert.deepEqual(await setDefaults(args), {
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

  before(async () => {
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
    assert.strictEqual(await shouldOpenInExistingInstance(args), "test")

    args.port = 8081
    args._.push("./file")
    assert.strictEqual(await shouldOpenInExistingInstance(args), "test")
  })

  it("should use existing if --reuse-window is set", async () => {
    args["reuse-window"] = true
    assert.strictEqual(await shouldOpenInExistingInstance(args), undefined)

    await fs.writeFile(vscodeIpcPath, "test")
    assert.strictEqual(await shouldOpenInExistingInstance(args), "test")

    args.port = 8081
    assert.strictEqual(await shouldOpenInExistingInstance(args), "test")
  })

  it("should use existing if --new-window is set", async () => {
    args["new-window"] = true
    assert.strictEqual(await shouldOpenInExistingInstance(args), undefined)

    await fs.writeFile(vscodeIpcPath, "test")
    assert.strictEqual(await shouldOpenInExistingInstance(args), "test")

    args.port = 8081
    assert.strictEqual(await shouldOpenInExistingInstance(args), "test")
  })

  it("should use existing if no unrelated flags are set, has positional, and socket is active", async () => {
    assert.strictEqual(await shouldOpenInExistingInstance(args), undefined)

    args._.push("./file")
    assert.strictEqual(await shouldOpenInExistingInstance(args), undefined)

    const socketPath = path.join(testDir, "socket")
    await fs.writeFile(vscodeIpcPath, socketPath)
    assert.strictEqual(await shouldOpenInExistingInstance(args), undefined)

    await new Promise((resolve) => {
      const server = net.createServer(() => {
        // Close after getting the first connection.
        server.close()
      })
      server.once("listening", () => resolve(server))
      server.listen(socketPath)
    })

    assert.strictEqual(await shouldOpenInExistingInstance(args), socketPath)

    args.port = 8081
    assert.strictEqual(await shouldOpenInExistingInstance(args), undefined)
  })
})
