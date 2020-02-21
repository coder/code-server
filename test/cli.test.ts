import * as assert from "assert"
import * as path from "path"
import { parse } from "../src/node/cli"
import { xdgLocalDir } from "../src/node/util"

describe("cli", () => {
  beforeEach(() => {
    delete process.env.LOG_LEVEL
  })

  it("should set defaults", () => {
    assert.deepEqual(parse([]), {
      _: [],
      "extensions-dir": path.join(xdgLocalDir, "extensions"),
      "user-data-dir": xdgLocalDir,
    })
  })

  it("should parse all available options", () => {
    assert.deepEqual(
      parse([
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
      },
    )
  })

  it("should work with short options", () => {
    assert.deepEqual(parse(["-vvv", "-v"]), {
      _: [],
      "extensions-dir": path.join(xdgLocalDir, "extensions"),
      "user-data-dir": xdgLocalDir,
      log: "trace",
      verbose: true,
      version: true,
    })
    assert.equal(process.env.LOG_LEVEL, "trace")
  })

  it("should use log level env var", () => {
    process.env.LOG_LEVEL = "debug"
    assert.deepEqual(parse([]), {
      _: [],
      "extensions-dir": path.join(xdgLocalDir, "extensions"),
      "user-data-dir": xdgLocalDir,
      log: "debug",
    })
    assert.equal(process.env.LOG_LEVEL, "debug")
  })

  it("should prefer --log to env var", () => {
    process.env.LOG_LEVEL = "debug"
    assert.deepEqual(parse(["--log", "info"]), {
      _: [],
      "extensions-dir": path.join(xdgLocalDir, "extensions"),
      "user-data-dir": xdgLocalDir,
      log: "info",
    })
    assert.equal(process.env.LOG_LEVEL, "info")
  })

  it("should error if value isn't provided", () => {
    assert.throws(() => parse(["--auth"]), /--auth requires a value/)
    assert.throws(() => parse(["--auth=", "--log=debug"]), /--auth requires a value/)
    assert.throws(() => parse(["--auth", "--log"]), /--auth requires a value/)
    assert.throws(() => parse(["--auth", "--invalid"]), /--auth requires a value/)
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
      "extensions-dir": path.join(xdgLocalDir, "extensions"),
      "user-data-dir": xdgLocalDir,
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
      "extensions-dir": path.join(xdgLocalDir, "extensions"),
      "user-data-dir": xdgLocalDir,
      socket: path.resolve("--socket-path-value"),
    })
    assert.throws(() => parse(["--cert", "--socket-path-value"]), /Unknown option --socket-path-value/)
  })

  it("should allow positional arguments before options", () => {
    assert.deepEqual(parse(["foo", "test", "--auth", "none"]), {
      _: ["foo", "test"],
      "extensions-dir": path.join(xdgLocalDir, "extensions"),
      "user-data-dir": xdgLocalDir,
      auth: "none",
    })
  })
})
