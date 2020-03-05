import * as path from "path"
import { field, logger, Level } from "@coder/logger"
import { Args as VsArgs } from "../../lib/vscode/src/vs/server/ipc"
import { AuthType } from "./http"
import { xdgLocalDir } from "./util"

export class Optional<T> {
  public constructor(public readonly value?: T) {}
}

export enum LogLevel {
  Trace = "trace",
  Debug = "debug",
  Info = "info",
  Warn = "warn",
  Error = "error",
}

export class OptionalString extends Optional<string> {}

export interface Args extends VsArgs {
  readonly auth?: AuthType
  readonly cert?: OptionalString
  readonly "cert-key"?: string
  readonly "disable-updates"?: boolean
  readonly "disable-telemetry"?: boolean
  readonly help?: boolean
  readonly host?: string
  readonly json?: boolean
  log?: LogLevel
  readonly open?: boolean
  readonly port?: number
  readonly socket?: string
  readonly version?: boolean
  readonly force?: boolean
  readonly "list-extensions"?: boolean
  readonly "install-extension"?: string[]
  readonly "uninstall-extension"?: string[]
  readonly locale?: string
  readonly _: string[]
}

interface Option<T> {
  type: T
  /**
   * Short flag for the option.
   */
  short?: string
  /**
   * Whether the option is a path and should be resolved.
   */
  path?: boolean
  /**
   * Description of the option. Leave blank to hide the option.
   */
  description?: string
}

type OptionType<T> = T extends boolean
  ? "boolean"
  : T extends OptionalString
  ? typeof OptionalString
  : T extends LogLevel
  ? typeof LogLevel
  : T extends AuthType
  ? typeof AuthType
  : T extends number
  ? "number"
  : T extends string
  ? "string"
  : T extends string[]
  ? "string[]"
  : "unknown"

type Options<T> = {
  [P in keyof T]: Option<OptionType<T[P]>>
}

const options: Options<Required<Args>> = {
  auth: { type: AuthType, description: "The type of authentication to use." },
  cert: {
    type: OptionalString,
    path: true,
    description: "Path to certificate. Generated if no path is provided.",
  },
  "cert-key": { type: "string", path: true, description: "Path to certificate key when using non-generated cert." },
  "disable-updates": { type: "boolean", description: "Disable automatic updates." },
  "disable-telemetry": { type: "boolean", description: "Disable telemetry." },
  host: { type: "string", description: "Host for the HTTP server." },
  help: { type: "boolean", short: "h", description: "Show this output." },
  json: { type: "boolean" },
  open: { type: "boolean", description: "Open in browser on startup. Does not work remotely." },
  port: { type: "number", description: "Port for the HTTP server." },
  socket: { type: "string", path: true, description: "Path to a socket (host and port will be ignored)." },
  version: { type: "boolean", short: "v", description: "Display version information." },
  _: { type: "string[]" },

  "user-data-dir": { type: "string", path: true, description: "Path to the user data directory." },
  "extensions-dir": { type: "string", path: true, description: "Path to the extensions directory." },
  "builtin-extensions-dir": { type: "string", path: true },
  "extra-extensions-dir": { type: "string[]", path: true },
  "extra-builtin-extensions-dir": { type: "string[]", path: true },
  "list-extensions": { type: "boolean" },
  force: { type: "boolean" },
  "install-extension": { type: "string[]", description: "Install or update an extension by id or vsix." },
  "uninstall-extension": { type: "string[]" },

  locale: { type: "string" },
  log: { type: LogLevel },
  verbose: { type: "boolean", short: "vvv", description: "Enable verbose logging." },
}

export const optionDescriptions = (): string[] => {
  const entries = Object.entries(options).filter(([, v]) => !!v.description)
  const widths = entries.reduce(
    (prev, [k, v]) => ({
      long: k.length > prev.long ? k.length : prev.long,
      short: v.short && v.short.length > prev.short ? v.short.length : prev.short,
    }),
    { short: 0, long: 0 },
  )
  return entries.map(
    ([k, v]) =>
      `${" ".repeat(widths.short - (v.short ? v.short.length : 0))}${v.short ? `-${v.short}` : " "} --${k}${" ".repeat(
        widths.long - k.length,
      )} ${v.description}${typeof v.type === "object" ? ` [${Object.values(v.type).join(", ")}]` : ""}`,
  )
}

export const parse = (argv: string[]): Args => {
  const args: Args = { _: [] }
  let ended = false

  for (let i = 0; i < argv.length; ++i) {
    const arg = argv[i]

    // -- signals the end of option parsing.
    if (!ended && arg == "--") {
      ended = true
      continue
    }

    // Options start with a dash and require a value if non-boolean.
    if (!ended && arg.startsWith("-")) {
      let key: keyof Args | undefined
      let value: string | undefined
      if (arg.startsWith("--")) {
        const split = arg.replace(/^--/, "").split("=", 2)
        key = split[0] as keyof Args
        value = split[1]
      } else {
        const short = arg.replace(/^-/, "")
        const pair = Object.entries(options).find(([, v]) => v.short === short)
        if (pair) {
          key = pair[0] as keyof Args
        }
      }

      if (!key || !options[key]) {
        throw new Error(`Unknown option ${arg}`)
      }

      const option = options[key]
      if (option.type === "boolean") {
        ;(args[key] as boolean) = true
        continue
      }

      // Might already have a value if it was the --long=value format.
      if (typeof value === "undefined") {
        // A value is only valid if it doesn't look like an option.
        value = argv[i + 1] && !argv[i + 1].startsWith("-") ? argv[++i] : undefined
      }

      if (!value && option.type === OptionalString) {
        ;(args[key] as OptionalString) = new OptionalString(value)
        continue
      } else if (!value) {
        throw new Error(`--${key} requires a value`)
      }

      if (option.path) {
        value = path.resolve(value)
      }

      switch (option.type) {
        case "string":
          ;(args[key] as string) = value
          break
        case "string[]":
          if (!args[key]) {
            ;(args[key] as string[]) = []
          }
          ;(args[key] as string[]).push(value)
          break
        case "number":
          ;(args[key] as number) = parseInt(value, 10)
          if (isNaN(args[key] as number)) {
            throw new Error(`--${key} must be a number`)
          }
          break
        case OptionalString:
          ;(args[key] as OptionalString) = new OptionalString(value)
          break
        default: {
          if (!Object.values(option.type).find((v) => v === value)) {
            throw new Error(`--${key} valid values: [${Object.values(option.type).join(", ")}]`)
          }
          ;(args[key] as string) = value
          break
        }
      }

      continue
    }

    // Everything else goes into _.
    args._.push(arg)
  }

  logger.debug("parsed command line", field("args", args))

  // Ensure the environment variable and the flag are synced up. The flag takes
  // priority over the environment variable.
  if (args.log === LogLevel.Trace || process.env.LOG_LEVEL === LogLevel.Trace || args.verbose) {
    args.log = process.env.LOG_LEVEL = LogLevel.Trace
    args.verbose = true
  } else if (!args.log && process.env.LOG_LEVEL) {
    args.log = process.env.LOG_LEVEL as LogLevel
  } else if (args.log) {
    process.env.LOG_LEVEL = args.log
  }

  switch (args.log) {
    case LogLevel.Trace:
      logger.level = Level.Trace
      break
    case LogLevel.Debug:
      logger.level = Level.Debug
      break
    case LogLevel.Info:
      logger.level = Level.Info
      break
    case LogLevel.Warn:
      logger.level = Level.Warning
      break
    case LogLevel.Error:
      logger.level = Level.Error
      break
  }

  if (!args["user-data-dir"]) {
    args["user-data-dir"] = xdgLocalDir
  }

  if (!args["extensions-dir"]) {
    args["extensions-dir"] = path.join(args["user-data-dir"], "extensions")
  }

  return args
}
