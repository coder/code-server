import { field, logger } from "@coder/logger";
import { ServerMessage, SharedProcessActiveMessage } from "@coder/protocol/src/proto";
import { Command, flags } from "@oclif/command";
import { fork, ForkOptions, ChildProcess } from "child_process";
import { randomFillSync } from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as WebSocket from "ws";
import { createApp } from "./server";
import { requireModule, requireFork, forkModule } from "./vscode/bootstrapFork";
import { SharedProcess, SharedProcessState } from "./vscode/sharedProcess";
import { setup as setupNativeModules } from "./modules";
import { fillFs } from "./fill";
import { isCli, serveStatic, buildDir, dataHome, cacheHome } from "./constants";
import opn = require("opn");

export class Entry extends Command {
	public static description = "Start your own self-hosted browser-accessible VS Code";
	public static flags = {
		cert: flags.string(),
		"cert-key": flags.string(),
		"data-dir": flags.string({ char: "d" }),
		help: flags.help(),
		host: flags.string({ char: "h", default: "0.0.0.0" }),
		open: flags.boolean({ char: "o", description: "Open in browser on startup" }),
		port: flags.integer({ char: "p", default: 8443, description: "Port to bind on" }),
		version: flags.version({ char: "v" }),
		"no-auth": flags.boolean({ default: false }),
		"allow-http": flags.boolean({ default: false }),
		password: flags.string(),

		// Dev flags
		"bootstrap-fork": flags.string({ hidden: true }),
		"fork": flags.string({ hidden: true }),

		env: flags.string({ hidden: true }),
		args: flags.string({ hidden: true }),
	};
	public static args = [{
		name: "workdir",
		description: "Specify working dir",
		default: (): string => process.cwd(),
	}];

	public async run(): Promise<void> {
		if (isCli) {
			fillFs();
		}

		const { args, flags } = this.parse(Entry);
		const dataDir = path.resolve(flags["data-dir"] || path.join(dataHome, "code-server"));
		const workingDir = path.resolve(args["workdir"]);

		setupNativeModules(dataDir);
		const builtInExtensionsDir = path.resolve(buildDir || path.join(__dirname, ".."), "build/extensions");
		if (flags["bootstrap-fork"]) {
			const modulePath = flags["bootstrap-fork"];
			if (!modulePath) {
				logger.error("No module path specified to fork!");
				process.exit(1);
			}

			Object.assign(process.env, flags.env ? JSON.parse(flags.env) : {});
			((flags.args ? JSON.parse(flags.args) : []) as string[]).forEach((arg, i) => {
				// [0] contains the binary running the script (`node` for example) and
				// [1] contains the script name, so the arguments come after that.
				process.argv[i + 2] = arg;
			});

			return requireModule(modulePath, dataDir, builtInExtensionsDir);
		}

		if (flags["fork"]) {
			const modulePath = flags["fork"];

			return requireFork(modulePath, JSON.parse(flags.args!), builtInExtensionsDir);
		}

		if (!fs.existsSync(dataDir)) {
			fs.mkdirSync(dataDir);
		}

		if (!fs.existsSync(cacheHome)) {
			fs.mkdirSync(cacheHome);
		}

		const logDir = path.join(cacheHome, "code-server/logs", new Date().toISOString().replace(/[-:.TZ]/g, ""));
		process.env.VSCODE_LOGS = logDir;

		const certPath = flags.cert ? path.resolve(flags.cert) : undefined;
		const certKeyPath = flags["cert-key"] ? path.resolve(flags["cert-key"]) : undefined;

		if (certPath && !certKeyPath) {
			logger.error("'--cert-key' flag is required when specifying a certificate!");
			process.exit(1);
		}

		if (!certPath && certKeyPath) {
			logger.error("'--cert' flag is required when specifying certificate key!");
			process.exit(1);
		}

		let certData: Buffer | undefined;
		let certKeyData: Buffer | undefined;

		if (typeof certPath !== "undefined" && typeof certKeyPath !== "undefined") {
			try {
				certData = fs.readFileSync(certPath);
			} catch (ex) {
				logger.error(`Failed to read certificate: ${ex.message}`);
				process.exit(1);
			}

			try {
				certKeyData = fs.readFileSync(certKeyPath);
			} catch (ex) {
				logger.error(`Failed to read certificate key: ${ex.message}`);
				process.exit(1);
			}
		}

		logger.info(`\u001B[1mcode-server ${process.env.VERSION ? `v${process.env.VERSION}` : "development"}`);
		// TODO: fill in appropriate doc url
		logger.info("Additional documentation: http://github.com/codercom/code-server");
		logger.info("Initializing", field("data-dir", dataDir), field("working-dir", workingDir), field("log-dir", logDir));
		const sharedProcess = new SharedProcess(dataDir, builtInExtensionsDir);
		const sendSharedProcessReady = (socket: WebSocket): void => {
			const active = new SharedProcessActiveMessage();
			active.setSocketPath(sharedProcess.socketPath);
			active.setLogPath(logDir);
			const serverMessage = new ServerMessage();
			serverMessage.setSharedProcessActive(active);
			socket.send(serverMessage.serializeBinary());
		};
		sharedProcess.onState((event) => {
			if (event.state === SharedProcessState.Ready) {
				app.wss.clients.forEach((c) => sendSharedProcessReady(c));
			}
		});

		let password = flags.password;
		if (!password) {
			// Generate a random password with a length of 24.
			const buffer = Buffer.alloc(12);
			randomFillSync(buffer);
			password = buffer.toString("hex");
		}

		const hasCustomHttps = certData && certKeyData;
		const app = await createApp({
			allowHttp: flags["allow-http"],
			bypassAuth: flags["no-auth"],
			registerMiddleware: (app): void => {
				app.use((req, res, next) => {
					res.on("finish", () => {
						logger.trace(`\u001B[1m${req.method} ${res.statusCode} \u001B[0m${req.url}`, field("host", req.hostname), field("ip", req.ip));
					});

					next();
				});
				// If we're not running from the binary and we aren't serving the static
				// pre-built version, use webpack to serve the web files.
				if (!isCli && !serveStatic) {
					const webpackConfig = require(path.resolve(__dirname, "..", "..", "web", "webpack.config.js"));
					const compiler = require("webpack")(webpackConfig);
					app.use(require("webpack-dev-middleware")(compiler, {
						logger,
						publicPath: webpackConfig.output.publicPath,
						stats: webpackConfig.stats,
					}));
					app.use(require("webpack-hot-middleware")(compiler));
				}
			},
			serverOptions: {
				builtInExtensionsDirectory: builtInExtensionsDir,
				dataDirectory: dataDir,
				workingDirectory: workingDir,
				fork: (modulePath: string, args: string[], options: ForkOptions): ChildProcess => {
					if (options && options.env && options.env.AMD_ENTRYPOINT) {
						return forkModule(options.env.AMD_ENTRYPOINT, args, options, dataDir);
					}

					return fork(modulePath, args, options);
				},
			},
			password,
			httpsOptions: hasCustomHttps ? {
				key: certKeyData,
				cert: certData,
			} : undefined,
		});

		if (!fs.existsSync(workingDir)) {
			logger.info("Creating working directory", field("working-dir", workingDir));
			fs.mkdirSync(workingDir);
		}

		logger.info("Starting webserver...", field("host", flags.host), field("port", flags.port));
		app.server.listen(flags.port, flags.host);
		let clientId = 1;
		app.wss.on("connection", (ws, req) => {
			const id = clientId++;

			if (sharedProcess.state === SharedProcessState.Ready) {
				sendSharedProcessReady(ws);
			}

			logger.info(`WebSocket opened \u001B[0m${req.url}`, field("client", id), field("ip", req.socket.remoteAddress));

			ws.on("close", (code) => {
				logger.info(`WebSocket closed \u001B[0m${req.url}`, field("client", id), field("code", code));
			});
		});

		if (!flags["cert-key"] && !flags.cert) {
			logger.warn("No certificate specified. \u001B[1mThis could be insecure.");
			// TODO: fill in appropriate doc url
			logger.warn("Documentation on securing your setup: https://coder.com/docs");
		}

		if (!flags["no-auth"]) {
			logger.info(" ");
			logger.info(`Password:\u001B[1m ${password}`);
		} else {
			logger.warn("Launched without authentication.");
		}

		const url = `http://localhost:${flags.port}/`;
		logger.info(" ");
		logger.info("Started (click the link below to open):");
		logger.info(url);
		logger.info(" ");

		if (flags["open"]) {
			try {
				await opn(url);
			} catch (e) {
				logger.warn("Url couldn't be opened automatically.", field("url", url), field("exception", e));
			}
		}
	}
}

Entry.run(undefined, {
	root: buildDir || __dirname,
	//@ts-ignore
}).catch(require("@oclif/errors/handle"));
