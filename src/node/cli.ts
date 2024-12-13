import { field, Level, logger } from "@coder/logger"
import { promises as fs } from "fs"
import { load } from "js-yaml"
import * as path from "path"
import { generateCertificate, generatePassword, paths, splitOnFirstEquals } from "./util"
import { EditorSessionManagerClient } from "./vscodeSocket"

export enum Feature {
  // No current experimental features!
  Placeholder = "placeholder",
}

export enum AuthType {
  Password = "password",
  None = "none",
}

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

/**
 * Code flags provided by the user.
 */
export interface UserProvidedCodeArgs {
  "disable-telemetry"?: boolean
  force?: boolean
  "user-data-dir"?: string
  "enable-proposed-api"?: string[]
  "extensions-dir"?: string
  "builtin-extensions-dir"?: string
  "install-extension"?: string[]
  "uninstall-extension"?: string[]
  "list-extensions"?: boolean
  "locate-extension"?: string[]
  "show-versions"?: boolean
  category?: string
  "github-auth"?: string
  "disable-update-check"?: boolean
  "disable-file-downloads"?: boolean
  "disable-file-uploads"?: boolean
  "disable-workspace-trust"?: boolean
  "disable-getting-started-override"?: boolean
  "disable-proxy"?: boolean
  "session-socket"?: string
  "abs-proxy-base-path"?: string
}

/**
 * Arguments that the user explicitly provided on the command line.  All
 * arguments must be optional.
 *
 * For arguments with defaults see DefaultedArgs.
 */
export interface UserProvidedArgs extends UserProvidedCodeArgs {
  config?: string
  auth?: AuthType
  password?: string
  "hashed-password"?: string
  cert?: OptionalString
  "cert-host"?: string
  "cert-key"?: string
  enable?: string[]
  help?: boolean
  host?: string
  locale?: string
  port?: number
  json?: boolean
  log?: LogLevel
  open?: boolean
  "bind-addr"?: string
  socket?: string
  "socket-mode"?: string
  "trusted-origins"?: string[]
  version?: boolean
  "proxy-domain"?: string[]
  "reuse-window"?: boolean
  "new-window"?: boolean
  "ignore-last-opened"?: boolean
  verbose?: boolean
  "app-name"?: string
  "welcome-text"?: string
  /* Positional arguments. */
  _?: string[]
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

  /**
   * If marked as deprecated, the option is marked as deprecated in help.
   */
  deprecated?: boolean
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

export type Options<T> = {
  [P in keyof T]: Option<OptionType<T[P]>>
}

export const options: Options<Required<UserProvidedArgs>> = {
  auth: { type: AuthType, description: "The type of authentication to use." },
  password: {
    type: "string",
    description: "The password for password authentication (can only be passed in via $PASSWORD or the config file).",
  },
  "hashed-password": {
    type: "string",
    description:
      "The password hashed with argon2 for password authentication (can only be passed in via $HASHED_PASSWORD or the config file). \n" +
      "Takes precedence over 'password'.",
  },
  cert: {
    type: OptionalString,
    path: true,
    description: "Path to certificate. A self signed certificate is generated if none is provided.",
  },
  "cert-host": {
    type: "string",
    description: "Hostname to use when generating a self signed certificate.",
  },
  "cert-key": { type: "string", path: true, description: "Path to certificate key when using non-generated cert." },
  "disable-telemetry": { type: "boolean", description: "Disable telemetry." },
  "disable-update-check": {
    type: "boolean",
    description:
      "Disable update check. Without this flag, code-server checks every 6 hours against the latest github release and \n" +
      "then notifies you once every week that a new release is available.",
  },
  "session-socket": {
    type: "string",
  },
  "disable-file-downloads": {
    type: "boolean",
    description:
      "Disable file downloads from Code. This can also be set with CS_DISABLE_FILE_DOWNLOADS set to 'true' or '1'.",
  },
  "disable-file-uploads": {
    type: "boolean",
    description: "Disable file uploads.",
  },
  "disable-workspace-trust": {
    type: "boolean",
    description: "Disable Workspace Trust feature. This switch only affects the current session.",
  },
  "disable-getting-started-override": {
    type: "boolean",
    description: "Disable the coder/coder override in the Help: Getting Started page.",
  },
  "disable-proxy": {
    type: "boolean",
    description: "Disable domain and path proxy routes.",
  },
  // --enable can be used to enable experimental features. These features
  // provide no guarantees.
  enable: { type: "string[]" },
  help: { type: "boolean", short: "h", description: "Show this output." },
  json: { type: "boolean" },
  locale: {
    // The preferred way to set the locale is via the UI.
    type: "string",
    description: `
      Set vscode display language and language to show on the login page, more info see
      https://en.wikipedia.org/wiki/IETF_language_tag
    `,
  },
  open: { type: "boolean", description: "Open in browser on startup. Does not work remotely." },

  "bind-addr": {
    type: "string",
    description: "Address to bind to in host:port. You can also use $PORT to override the port.",
  },

  config: {
    type: "string",
    description: "Path to yaml config file. Every flag maps directly to a key in the config file.",
  },

  // These two have been deprecated by bindAddr.
  host: { type: "string", description: "" },
  port: { type: "number", description: "" },

  socket: { type: "string", path: true, description: "Path to a socket (bind-addr will be ignored)." },
  "socket-mode": { type: "string", description: "File mode of the socket." },
  "trusted-origins": {
    type: "string[]",
    description:
      "Disables authenticate origin check for trusted origin. Useful if not able to access reverse proxy configuration.",
  },
  version: { type: "boolean", short: "v", description: "Display version information." },
  _: { type: "string[]" },

  "user-data-dir": { type: "string", path: true, description: "Path to the user data directory." },
  "extensions-dir": { type: "string", path: true, description: "Path to the extensions directory." },
  "builtin-extensions-dir": { type: "string", path: true },
  "list-extensions": { type: "boolean", description: "List installed VS Code extensions." },
  force: { type: "boolean", description: "Avoid prompts when installing VS Code extensions." },
  "locate-extension": { type: "string[]" },
  category: { type: "string" },
  "install-extension": {
    type: "string[]",
    description:
      "Install or update a VS Code extension by id or vsix. The identifier of an extension is `${publisher}.${name}`.\n" +
      "To install a specific version provide `@${version}`. For example: 'vscode.csharp@1.2.3'.",
  },
  "enable-proposed-api": {
    type: "string[]",
    description:
      "Enable proposed API features for extensions. Can receive one or more extension IDs to enable individually.",
  },
  "uninstall-extension": { type: "string[]", description: "Uninstall a VS Code extension by id." },
  "show-versions": { type: "boolean", description: "Show VS Code extension versions." },
  "github-auth": {
    type: "string",
    description: "GitHub authentication token (can only be passed in via $GITHUB_TOKEN or the config file).",
  },
  "proxy-domain": { type: "string[]", description: "Domain used for proxying ports." },
  "ignore-last-opened": {
    type: "boolean",
    short: "e",
    description: "Ignore the last opened directory or workspace in favor of an empty window.",
  },
  "new-window": {
    type: "boolean",
    short: "n",
    description: "Force to open a new window.",
  },
  "reuse-window": {
    type: "boolean",
    short: "r",
    description: "Force to open a file or folder in an already opened window.",
  },

  log: { type: LogLevel },
  verbose: { type: "boolean", short: "vvv", description: "Enable verbose logging." },
  "app-name": {
    type: "string",
    short: "an",
    description: "The name to use in branding. Will be shown in titlebar and welcome message",
  },
  "welcome-text": {
    type: "string",
    short: "w",
    description: "Text to show on login page",
  },
  "abs-proxy-base-path": {
    type: "string",
    description: "The base path to prefix to all absproxy requests",
  },
}

export const optionDescriptions = (opts: Partial<Options<Required<UserProvidedArgs>>> = options): string[] => {
  const entries = Object.entries(opts).filter(([, v]) => !!v.description)
  const widths = entries.reduce(
    (prev, [k, v]) => ({
      long: k.length > prev.long ? k.length : prev.long,
      short: v.short && v.short.length > prev.short ? v.short.length : prev.short,
    }),
    { short: 0, long: 0 },
  )
  return entries.map(([k, v]) => {
    const help = `${" ".repeat(widths.short - (v.short ? v.short.length : 0))}${v.short ? `-${v.short}` : " "} --${k} `
    return (
      help +
      v.description
        ?.trim()
        .split(/\n/)
        .map((line, i) => {
          line = line.trim()
          if (i === 0) {
            return " ".repeat(widths.long - k.length) + (v.deprecated ? "(deprecated) " : "") + line
          }
          return " ".repeat(widths.long + widths.short + 6) + line
        })
        .join("\n") +
      (typeof v.type === "object" ? ` [${Object.values(v.type).join(", ")}]` : "")
    )
  })
}

/**
 * Parse arguments into UserProvidedArgs.  This should not go beyond checking
 * that arguments are valid types and have values when required.
 */
export const parse = (
  argv: string[],
  opts?: {
    configFile?: string
  },
): UserProvidedArgs => {
  const error = (msg: string): Error => {
    if (opts?.configFile) {
      msg = `error reading ${opts.configFile}: ${msg}`
    }

    return new Error(msg)
  }

  const args: UserProvidedArgs = {}
  let ended = false

  for (let i = 0; i < argv.length; ++i) {
    const arg = argv[i]

    // -- signals the end of option parsing.
    if (!ended && arg === "--") {
      ended = true
      continue
    }

    // Options start with a dash and require a value if non-boolean.
    if (!ended && arg.startsWith("-")) {
      let key: keyof UserProvidedArgs | undefined
      let value: string | undefined
      if (arg.startsWith("--")) {
        const split = splitOnFirstEquals(arg.replace(/^--/, ""))
        key = split[0] as keyof UserProvidedArgs
        value = split[1]
      } else {
        const short = arg.replace(/^-/, "")
        const pair = Object.entries(options).find(([, v]) => v.short === short)
        if (pair) {
          key = pair[0] as keyof UserProvidedArgs
        }
      }

      if (!key || !options[key]) {
        throw error(`Unknown option ${arg}`)
      }

      if (key === "password" && !opts?.configFile) {
        throw new Error("--password can only be set in the config file or passed in via $PASSWORD")
      }

      if (key === "hashed-password" && !opts?.configFile) {
        throw new Error("--hashed-password can only be set in the config file or passed in via $HASHED_PASSWORD")
      }

      if (key === "github-auth" && !opts?.configFile) {
        throw new Error("--github-auth can only be set in the config file or passed in via $GITHUB_TOKEN")
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
        throw error(`--${key} requires a value`)
      }

      if (option.type === OptionalString && value === "false") {
        continue
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
            throw error(`--${key} must be a number`)
          }
          break
        case OptionalString:
          ;(args[key] as OptionalString) = new OptionalString(value)
          break
        default: {
          if (!Object.values(option.type).includes(value)) {
            throw error(`--${key} valid values: [${Object.values(option.type).join(", ")}]`)
          }
          ;(args[key] as string) = value
          break
        }
      }

      continue
    }

    // Everything else goes into _.
    if (typeof args._ === "undefined") {
      args._ = []
    }

    args._.push(arg)
  }

  // If a cert was provided a key must also be provided.
  if (args.cert && args.cert.value && !args["cert-key"]) {
    throw new Error("--cert-key is missing")
  }

  logger.debug(() => [`parsed ${opts?.configFile ? "config" : "command line"}`, field("args", redactArgs(args))])

  return args
}

/**
 * Redact sensitive information from arguments for logging.
 */
export const redactArgs = (args: UserProvidedArgs): UserProvidedArgs => {
  return {
    ...args,
    password: args.password ? "<redacted>" : undefined,
    "hashed-password": args["hashed-password"] ? "<redacted>" : undefined,
    "github-auth": args["github-auth"] ? "<redacted>" : undefined,
  }
}

/**
 * User-provided arguments with defaults.  The distinction between user-provided
 * args and defaulted args exists so we can tell the difference between end
 * values and what the user actually provided on the command line.
 */
export interface DefaultedArgs extends ConfigArgs {
  auth: AuthType
  cert?: {
    value: string
  }
  host: string
  port: number
  "proxy-domain": string[]
  verbose: boolean
  usingEnvPassword: boolean
  usingEnvHashedPassword: boolean
  "extensions-dir": string
  "user-data-dir": string
  "session-socket": string
  /* Positional arguments. */
  _: string[]
}

/**
 * Take CLI and config arguments (optional) and return a single set of arguments
 * with the defaults set. Arguments from the CLI are prioritized over config
 * arguments.
 */
export async function setDefaults(cliArgs: UserProvidedArgs, configArgs?: ConfigArgs): Promise<DefaultedArgs> {
  const args = Object.assign({}, configArgs || {}, cliArgs)

  if (!args["user-data-dir"]) {
    args["user-data-dir"] = paths.data
  }

  if (!args["extensions-dir"]) {
    args["extensions-dir"] = path.join(args["user-data-dir"], "extensions")
  }

  if (!args["session-socket"]) {
    args["session-socket"] = path.join(args["user-data-dir"], "code-server-ipc.sock")
  }
  process.env.CODE_SERVER_SESSION_SOCKET = args["session-socket"]

  // --verbose takes priority over --log and --log takes priority over the
  // environment variable.
  if (args.verbose) {
    args.log = LogLevel.Trace
  } else if (
    !args.log &&
    process.env.LOG_LEVEL &&
    Object.values(LogLevel).includes(process.env.LOG_LEVEL as LogLevel)
  ) {
    args.log = process.env.LOG_LEVEL as LogLevel
  }

  // Sync --log, --verbose, the environment variable, and logger level.
  if (args.log) {
    process.env.LOG_LEVEL = args.log
  }
  switch (args.log) {
    case LogLevel.Trace:
      logger.level = Level.Trace
      args.verbose = true
      break
    case LogLevel.Debug:
      logger.level = Level.Debug
      args.verbose = false
      break
    case LogLevel.Info:
      logger.level = Level.Info
      args.verbose = false
      break
    case LogLevel.Warn:
      logger.level = Level.Warn
      args.verbose = false
      break
    case LogLevel.Error:
      logger.level = Level.Error
      args.verbose = false
      break
  }

  // Default to using a password.
  if (!args.auth) {
    args.auth = AuthType.Password
  }

  const addr = bindAddrFromAllSources(configArgs || {}, cliArgs)
  args.host = addr.host
  args.port = addr.port

  if (args.cert && !args.cert.value) {
    const { cert, certKey } = await generateCertificate(args["cert-host"] || "localhost")
    args.cert = {
      value: cert,
    }
    args["cert-key"] = certKey
  }

  let usingEnvPassword = !!process.env.PASSWORD
  if (process.env.PASSWORD) {
    args.password = process.env.PASSWORD
  }

  if (process.env.CS_DISABLE_FILE_DOWNLOADS?.match(/^(1|true)$/)) {
    args["disable-file-downloads"] = true
  }

  if (process.env.CS_DISABLE_GETTING_STARTED_OVERRIDE?.match(/^(1|true)$/)) {
    args["disable-getting-started-override"] = true
  }

  if (process.env.CS_DISABLE_PROXY?.match(/^(1|true)$/)) {
    args["disable-proxy"] = true
  }

  const usingEnvHashedPassword = !!process.env.HASHED_PASSWORD
  if (process.env.HASHED_PASSWORD) {
    args["hashed-password"] = process.env.HASHED_PASSWORD
    usingEnvPassword = false
  }

  if (process.env.GITHUB_TOKEN) {
    args["github-auth"] = process.env.GITHUB_TOKEN
  }

  // Ensure they're not readable by child processes.
  delete process.env.PASSWORD
  delete process.env.HASHED_PASSWORD
  delete process.env.GITHUB_TOKEN

  // Filter duplicate proxy domains and remove any leading `*.`.
  const proxyDomains = new Set((args["proxy-domain"] || []).map((d) => d.replace(/^\*\./, "")))
  const finalProxies = []

  for (const proxyDomain of proxyDomains) {
    if (!proxyDomain.includes("{{port}}")) {
      finalProxies.push("{{port}}." + proxyDomain)
    } else {
      finalProxies.push(proxyDomain)
    }
  }

  // all proxies are of format anyprefix-{{port}}-anysuffix.{{host}}, where {{host}} is optional
  // e.g. code-8080.domain.tld would match for code-{{port}}.domain.tld and code-{{port}}.{{host}}
  if (finalProxies.length > 0 && !process.env.VSCODE_PROXY_URI) {
    process.env.VSCODE_PROXY_URI = `//${finalProxies[0]}`
  }
  args["proxy-domain"] = finalProxies

  args._ = getResolvedPathsFromArgs(args)

  return {
    ...args,
    usingEnvPassword,
    usingEnvHashedPassword,
  } as DefaultedArgs // TODO: Technically no guarantee this is fulfilled.
}

export function getResolvedPathsFromArgs(args: UserProvidedArgs): string[] {
  return (args._ ?? []).map((p) => path.resolve(p))
}

/**
 * Helper function to return the default config file.
 *
 * @param {string} password - Password passed in (usually from generatePassword())
 * @returns The default config file:
 *
 * - bind-addr: 127.0.0.1:8080
 * - auth: password
 * - password: <password>
 * - cert: false
 */
export function defaultConfigFile(password: string): string {
  return `bind-addr: 127.0.0.1:8080
auth: password
password: ${password}
cert: false
`
}

interface ConfigArgs extends UserProvidedArgs {
  config: string
}

/**
 * Reads the code-server yaml config file and returns it as Args.
 *
 * @param configPath Read the config from configPath instead of $CODE_SERVER_CONFIG or the default.
 */
export async function readConfigFile(configPath?: string): Promise<ConfigArgs> {
  if (!configPath) {
    configPath = process.env.CODE_SERVER_CONFIG
    if (!configPath) {
      configPath = path.join(paths.config, "config.yaml")
    }
  }

  await fs.mkdir(path.dirname(configPath), { recursive: true })

  try {
    const generatedPassword = await generatePassword()
    await fs.writeFile(configPath, defaultConfigFile(generatedPassword), {
      flag: "wx", // wx means to fail if the path exists.
    })
    logger.info(`Wrote default config file to ${configPath}`)
  } catch (error: any) {
    // EEXIST is fine; we don't want to overwrite existing configurations.
    if (error.code !== "EEXIST") {
      throw error
    }
  }

  const configFile = await fs.readFile(configPath, "utf8")
  return parseConfigFile(configFile, configPath)
}

/**
 * parseConfigFile parses configFile into ConfigArgs.
 * configPath is used as the filename in error messages
 */
export function parseConfigFile(configFile: string, configPath: string): ConfigArgs {
  if (!configFile) {
    return { config: configPath }
  }

  const config = load(configFile, {
    filename: configPath,
  })
  if (!config || typeof config === "string") {
    throw new Error(`invalid config: ${config}`)
  }

  // We convert the config file into a set of flags.
  // This is a temporary measure until we add a proper CLI library.
  const configFileArgv = Object.entries(config).map(([optName, opt]) => {
    if (opt === true) {
      return `--${optName}`
    }
    return `--${optName}=${opt}`
  })
  const args = parse(configFileArgv, {
    configFile: configPath,
  })
  return {
    ...args,
    config: configPath,
  }
}

function parseBindAddr(bindAddr: string): Addr {
  const u = new URL(`http://${bindAddr}`)
  return {
    host: u.hostname,
    // With the http scheme 80 will be dropped so assume it's 80 if missing.
    // This means --bind-addr <addr> without a port will default to 80 as well
    // and not the code-server default.
    port: u.port ? parseInt(u.port, 10) : 80,
  }
}

interface Addr {
  host: string
  port: number
}

/**
 * This function creates the bind address
 * using the CLI args.
 */
export function bindAddrFromArgs(addr: Addr, args: UserProvidedArgs): Addr {
  addr = { ...addr }
  if (args["bind-addr"]) {
    addr = parseBindAddr(args["bind-addr"])
  }
  if (process.env.CODE_SERVER_HOST) {
    addr.host = process.env.CODE_SERVER_HOST
  }
  if (args.host) {
    addr.host = args.host
  }

  if (process.env.PORT) {
    addr.port = parseInt(process.env.PORT, 10)
  }
  if (args.port !== undefined) {
    addr.port = args.port
  }
  return addr
}

function bindAddrFromAllSources(...argsConfig: UserProvidedArgs[]): Addr {
  let addr: Addr = {
    host: "localhost",
    port: 8080,
  }

  for (const args of argsConfig) {
    addr = bindAddrFromArgs(addr, args)
  }

  return addr
}

/**
 * Determine if it looks like the user is trying to open a file or folder in an
 * existing instance. The arguments here should be the arguments the user
 * explicitly passed on the command line, *NOT DEFAULTS* or the configuration.
 */
export const shouldOpenInExistingInstance = async (
  args: UserProvidedArgs,
  sessionSocket: string,
): Promise<string | undefined> => {
  // Always use the existing instance if we're running from VS Code's terminal.
  if (process.env.VSCODE_IPC_HOOK_CLI) {
    logger.debug("Found VSCODE_IPC_HOOK_CLI")
    return process.env.VSCODE_IPC_HOOK_CLI
  }

  const paths = getResolvedPathsFromArgs(args)
  const client = new EditorSessionManagerClient(sessionSocket)

  // If these flags are set then assume the user is trying to open in an
  // existing instance since these flags have no effect otherwise.  That means
  // if there is no existing instance we should error rather than falling back
  // to spawning code-server normally.
  const openInFlagCount = ["reuse-window", "new-window"].reduce((prev, cur) => {
    return args[cur as keyof UserProvidedArgs] ? prev + 1 : prev
  }, 0)
  if (openInFlagCount > 0) {
    logger.debug("Found --reuse-window or --new-window")
    const socketPath = await client.getConnectedSocketPath(paths[0])
    if (!socketPath) {
      throw new Error(`No opened code-server instances found to handle ${paths[0]}`)
    }
    return socketPath
  }

  // It's possible the user is trying to spawn another instance of code-server.
  // 1. Check if any unrelated flags are set (this should only run when
  //    code-server is invoked exactly like this: `code-server my-file`).
  // 2. That a file or directory was passed.
  // 3. That the socket is active.
  // 4. That an instance exists to handle the path (implied by #3).
  if (Object.keys(args).length === 1 && typeof args._ !== "undefined" && args._.length > 0) {
    if (!(await client.canConnect())) {
      return undefined
    }
    const socketPath = await client.getConnectedSocketPath(paths[0])
    if (socketPath) {
      logger.debug("Found existing code-server socket")
      return socketPath
    }
  }

  return undefined
}

/**
 * Arguments for running Code's server.
 *
 * A subset of ../../lib/vscode/src/vs/server/node/serverEnvironmentService.ts:90
 */
export interface CodeArgs extends UserProvidedCodeArgs {
  "accept-server-license-terms"?: boolean
  "connection-token"?: string
  help: boolean
  port?: string
  version: boolean
  "without-connection-token"?: boolean
  "without-browser-env-var"?: boolean
  compatibility?: string
  log?: string[]
}

/**
 * Convert our arguments to equivalent VS Code server arguments.
 * Does not add any extra arguments.
 */
export const toCodeArgs = async (args: DefaultedArgs): Promise<CodeArgs> => {
  return {
    ...args,
    /** Type casting. */
    help: !!args.help,
    version: !!args.version,
    port: args.port?.toString(),
    log: args.log ? [args.log] : undefined,
  }
}
