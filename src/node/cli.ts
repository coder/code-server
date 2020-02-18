import * as path from "path"
import { field, logger, Level } from "@coder/logger"
import { Args as VsArgs } from "../../lib/vscode/src/vs/server/ipc"
import { AuthType } from "./http"
import { xdgLocalDir } from "./util"

export class Optional<T> {
  public constructor(public readonly value?: T) {}
}

export class OptionalString extends Optional<string> {}

export interface Args extends VsArgs {
  readonly auth?: AuthType
  readonly cert?: OptionalString
  readonly "cert-key"?: string
  readonly "disable-updates"?: boolean
  readonly help?: boolean
  readonly host?: string
  readonly json?: boolean
  readonly open?: boolean
  readonly port?: number
  readonly socket?: string
  readonly version?: boolean
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
  host: { type: "string", description: "Host for the HTTP server." },
  help: { type: "boolean", short: "h", description: "Show this output." },
  json: { type: "boolean" },
  open: { type: "boolean", description: "Open in the browser on startup. Does not work remotely." },
  port: { type: "number", description: "Port for the HTTP server." },
  socket: { type: "string", path: true, description: "Path to a socket (host and port will be ignored)." },
  version: { type: "boolean", short: "v", description: "Display version information." },
  _: { type: "string[]" },

  "user-data-dir": { type: "string", path: true, description: "Path to the user data directory." },
  "extensions-dir": { type: "string", path: true, description: "Path to the extensions directory." },
  "builtin-extensions-dir": { type: "string", path: true },
  "extra-extensions-dir": { type: "string[]", path: true },
  "extra-builtin-extensions-dir": { type: "string[]", path: true },

  log: { type: "string" },
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
      if (arg.startsWith("--")) {
        key = arg.replace(/^--/, "") as keyof Args
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

      // A value is only valid if it doesn't look like an option.
      let value = argv[i + 1] && !argv[i + 1].startsWith("-") ? argv[++i] : undefined
      if (!value && option.type === OptionalString) {
        ;(args[key] as OptionalString) = new OptionalString(value)
        continue
      } else if (!value) {
        throw new Error(`${arg} requires a value`)
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
            throw new Error(`${arg} must be a number`)
          }
          break
        case OptionalString:
          ;(args[key] as OptionalString) = new OptionalString(value)
          break
        default: {
          if (!Object.values(option.type).find((v) => v === value)) {
            throw new Error(`${arg} valid values: [${Object.values(option.type).join(", ")}]`)
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

  if (process.env.LOG_LEVEL === "trace" || args.verbose) {
    args.verbose = true
    args.log = "trace"
  }

  switch (args.log) {
    case "trace":
      logger.level = Level.Trace
      break
    case "debug":
      logger.level = Level.Debug
      break
    case "info":
      logger.level = Level.Info
      break
    case "warning":
      logger.level = Level.Warning
      break
    case "error":
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
