import { logger, Level } from "@coder/logger"
import * as assert from "assert"
import * as path from "path"
import { parse } from "../src/node/cli"
import { paths } from "../src/node/util"

describe("cli", () => {
  beforeEach(() => {
    delete process.env.LOG_LEVEL
  })

  // The parser will always fill these out.
  const defaults = {
    _: [],
    "extensions-dir": path.join(paths.data, "extensions"),
    "user-data-dir": paths.data,
  }

  it("should set defaults", async () => {
    assert.deepEqual(await await parse([]), defaults)
  })

  it("should parse all available options", async () => {
    assert.deepEqual(
      await await parse([
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
        host: "0.0.0.0",
        json: true,
        log: "trace",
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

  it("should work with short options", async () => {
    assert.deepEqual(await parse(["-vvv", "-v"]), {
      ...defaults,
      log: "trace",
      verbose: true,
      version: true,
    })
    assert.equal(process.env.LOG_LEVEL, "trace")
    assert.equal(logger.level, Level.Trace)
  })

  it("should use log level env var", async () => {
    process.env.LOG_LEVEL = "debug"
    assert.deepEqual(await parse([]), {
      ...defaults,
      log: "debug",
    })
    assert.equal(process.env.LOG_LEVEL, "debug")
    assert.equal(logger.level, Level.Debug)

    process.env.LOG_LEVEL = "trace"
    assert.deepEqual(await parse([]), {
      ...defaults,
      log: "trace",
      verbose: true,
    })
    assert.equal(process.env.LOG_LEVEL, "trace")
    assert.equal(logger.level, Level.Trace)
  })

  it("should prefer --log to env var and --verbose to --log", async () => {
    process.env.LOG_LEVEL = "debug"
    assert.deepEqual(await parse(["--log", "info"]), {
      ...defaults,
      log: "info",
    })
    assert.equal(process.env.LOG_LEVEL, "info")
    assert.equal(logger.level, Level.Info)

    process.env.LOG_LEVEL = "trace"
    assert.deepEqual(await parse(["--log", "info"]), {
      ...defaults,
      log: "info",
    })
    assert.equal(process.env.LOG_LEVEL, "info")
    assert.equal(logger.level, Level.Info)

    process.env.LOG_LEVEL = "warn"
    assert.deepEqual(await parse(["--log", "info", "--verbose"]), {
      ...defaults,
      log: "trace",
      verbose: true,
    })
    assert.equal(process.env.LOG_LEVEL, "trace")
    assert.equal(logger.level, Level.Trace)
  })

  it("should ignore invalid log level env var", async () => {
    process.env.LOG_LEVEL = "bogus"
    assert.deepEqual(await parse([]), defaults)
  })

  it("should error if value isn't provided", async () => {
    await assert.rejects(async () => await parse(["--auth"]), /--auth requires a value/)
    await assert.rejects(async () => await parse(["--auth=", "--log=debug"]), /--auth requires a value/)
    await assert.rejects(async () => await parse(["--auth", "--log"]), /--auth requires a value/)
    await assert.rejects(async () => await parse(["--auth", "--invalid"]), /--auth requires a value/)
    await assert.rejects(async () => await parse(["--bind-addr"]), /--bind-addr requires a value/)
  })

  it("should error if value is invalid", async () => {
    await assert.rejects(async () => await parse(["--port", "foo"]), /--port must be a number/)
    await assert.rejects(async () => await parse(["--auth", "invalid"]), /--auth valid values: \[password, none\]/)
    await assert.rejects(
      async () => await parse(["--log", "invalid"]),
      /--log valid values: \[trace, debug, info, warn, error\]/,
    )
  })

  it("should error if the option doesn't exist", async () => {
    await assert.rejects(async () => await parse(["--foo"]), /Unknown option --foo/)
  })

  it("should not error if the value is optional", async () => {
    assert.deepEqual(await parse(["--cert"]), {
      ...defaults,
      cert: {
        value: undefined,
      },
    })
  })

  it("should not allow option-like values", async () => {
    await assert.rejects(async () => await parse(["--socket", "--socket-path-value"]), /--socket requires a value/)
    // If you actually had a path like this you would do this instead:
    assert.deepEqual(await parse(["--socket", "./--socket-path-value"]), {
      ...defaults,
      socket: path.resolve("--socket-path-value"),
    })
    await assert.rejects(
      async () => await parse(["--cert", "--socket-path-value"]),
      /Unknown option --socket-path-value/,
    )
  })

  it("should allow positional arguments before options", async () => {
    assert.deepEqual(await parse(["foo", "test", "--auth", "none"]), {
      ...defaults,
      _: ["foo", "test"],
      auth: "none",
    })
  })

  it("should support repeatable flags", async () => {
    assert.deepEqual(await parse(["--proxy-domain", "*.coder.com"]), {
      ...defaults,
      "proxy-domain": ["*.coder.com"],
    })
    assert.deepEqual(await parse(["--proxy-domain", "*.coder.com", "--proxy-domain", "test.com"]), {
      ...defaults,
      "proxy-domain": ["*.coder.com", "test.com"],
    })
  })
})
