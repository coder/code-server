import { Command, flags } from "@oclif/command";
import { logger, field } from "@coder/logger";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { createApp } from './server';

export class Entry extends Command {

	public static description = "Start your own self-hosted browser-accessible VS Code";
	public static flags = {
		cert: flags.string(),
		"cert-key": flags.string(),
		"data-dir": flags.string({ char: "d" }),
		help: flags.help(),
		host: flags.string({ char: "h", default: "0.0.0.0" }),
		open: flags.boolean({ char: "o", description: "Open in browser on startup" }),
		port: flags.integer({ char: "p", default: 8080, description: "Port to bind on" }),
		version: flags.version({ char: "v" }),
	};
	public static args = [{
		name: "workdir",
		description: "Specify working dir",
		default: () => process.cwd(),
	}];

	public async run(): Promise<void> {
		const { args, flags } = this.parse(Entry);

		const dataDir = flags["data-dir"] || path.join(os.homedir(), `.vscode-online`);
		const workingDir = args["workdir"];

		logger.info("\u001B[1mvscode-remote v1.0.0");
		// TODO: fill in appropriate doc url
		logger.info("Additional documentation: https://coder.com/docs");
		logger.info("Initializing", field("data-dir", dataDir), field("working-dir", workingDir));

		const app = createApp((app) => {
			app.use((req, res, next) => {
				res.on("finish", () => {
					logger.info(`\u001B[1m${req.method} ${res.statusCode} \u001B[0m${req.url}`, field("host", req.hostname), field("ip", req.ip));
				});

				next();
			});
		}, {
			dataDirectory: dataDir,
			workingDirectory: workingDir,
		});

		logger.info("Starting webserver...", field("host", flags.host), field("port", flags.port))
		app.server.listen(flags.port, flags.host);
		let clientId = 1;
		app.wss.on("connection", (ws, req) => {
			const id = clientId++;
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

		logger.info(" ");
		logger.info("Password:\u001B[1m 023450wf09");
		logger.info(" ");
		logger.info("Started (click the link below to open):");
		logger.info(`http://localhost:${flags.port}/`);
		logger.info(" ");
	}
}

Entry.run(undefined, {
	root: process.env.BUILD_DIR as string,
	//@ts-ignore
}).catch(require("@oclif/errors/handle"));
