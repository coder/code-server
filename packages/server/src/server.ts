import { logger } from "@coder/logger";
import { ReadWriteConnection } from "@coder/protocol";
import { Server, ServerOptions } from "@coder/protocol/src/node/server";
import { NewSessionMessage } from '@coder/protocol/src/proto';
import { ChildProcess } from "child_process";
import * as express from "express";
import * as http from "http";
import * as path from "path";
import * as ws from "ws";
import { forkModule } from "./vscode/bootstrapFork";

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

	app.use(express.static(path.join(__dirname, "../build/web")));

	return {
		express: app,
		server,
		wss,
	};
};
