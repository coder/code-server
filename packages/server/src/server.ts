import { logger } from "@coder/logger";
import { ReadWriteConnection } from "@coder/protocol";
import { Server, ServerOptions } from "@coder/protocol/src/node/server";
import { NewSessionMessage } from "@coder/protocol/src/proto";
import { ChildProcess } from "child_process";
import * as express from "express";
//@ts-ignore
import * as expressStaticGzip from "express-static-gzip";
import * as fs from "fs";
import * as http from "http";
import * as mime from "mime-types";
import * as path from "path";
import * as util from "util";
import * as ws from "ws";
import { forkModule } from "./vscode/bootstrapFork";
import { isCli, buildDir } from "./constants";

export const createApp = (registerMiddleware?: (app: express.Application) => void, options?: ServerOptions): {
	readonly express: express.Application;
	readonly server: http.Server;
	readonly wss: ws.Server;
} => {
	const app = express();
	if (registerMiddleware) {
		registerMiddleware(app);
	}
	const server = http.createServer(app);
	const wss = new ws.Server({ server });

	wss.shouldHandle = (req): boolean => {
		// Should handle auth here
		return true;
	};

	wss.on("connection", (ws) => {
		const connection: ReadWriteConnection = {
			onMessage: (cb): void => {
				ws.addEventListener("message", (event) => cb(event.data));
			},
			close: (): void => ws.close(),
			send: (data): void => {
				if (ws.readyState !== ws.OPEN) {
					return;
				}
				try {
					ws.send(data);
				} catch (error) {
					logger.error(error.message);
				}
			},
			onClose: (cb): void => ws.addEventListener("close", () => cb()),
		};

		const server = new Server(connection, options ? {
			...options,
			forkProvider: (message: NewSessionMessage): ChildProcess => {
				let proc: ChildProcess;
				if (message.getIsBootstrapFork()) {
					const env: NodeJS.ProcessEnv = {};
					message.getEnvMap().forEach((value, key) => {
						env[key] = value;
					});
					proc = forkModule(message.getCommand(), env);
				} else {
					throw new Error("No support for non bootstrap-forking yet");
				}

				return proc;
			},
		} : undefined);
	});

	const baseDir = buildDir || path.join(__dirname, "..");
	if (isCli) {
		app.use(expressStaticGzip(path.join(baseDir, "build/web")));
	} else {
		app.use(express.static(path.join(baseDir, "resources/web")));
	}
	app.get("/resource/:url(*)", async (req, res) => {
		try {
			const fullPath = `/${req.params.url}`;
			// const relative = path.relative(options!.dataDirectory, fullPath);
			// if (relative.startsWith("..")) {
			// 	return res.status(403).end();
			// }
			const exists = fs.existsSync(fullPath);
			if (!exists) {
				return res.status(404).end();
			}
			const stat = await util.promisify(fs.stat)(fullPath);
			if (!stat.isFile()) {
				res.write("Resource must be a file.");
				res.status(422);

				return res.end();
			}
			let mimeType = mime.lookup(fullPath);
			if (mimeType === false) {
				mimeType = "application/octet-stream";
			}
			const content = await util.promisify(fs.readFile)(fullPath);

			res.header("Content-Type", mimeType as string);
			res.write(content);
			res.status(200);
			res.end();
		} catch (ex) {
			res.write(ex.toString());
			res.status(500);
			res.end();
		}
	});

	return {
		express: app,
		server,
		wss,
	};
};
