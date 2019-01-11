import { logger, field } from "@coder/logger";
import { ClientMessage } from "../proto";
import { evaluate } from "./evaluate";
import { ReadWriteConnection } from "../common/connection";

export class Server {

	public constructor(
		private readonly connection: ReadWriteConnection,
	) {
		connection.onMessage((data) => {
			try {
				this.handleMessage(ClientMessage.deserializeBinary(data));
			} catch (ex) {
				logger.error("Failed to handle client message", field("length", data.byteLength), field("exception", ex));
			}
		});
	}

	private handleMessage(message: ClientMessage): void {
		if (message.hasNewEval()) {
			evaluate(this.connection, message.getNewEval()!);
		}
	}

}