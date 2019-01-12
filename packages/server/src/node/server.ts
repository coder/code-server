import { logger, field } from "@coder/logger";
import { TextDecoder } from "text-encoding";
import { ClientMessage } from "../proto";
import { evaluate } from "./evaluate";
import { ReadWriteConnection } from "../common/connection";
import { Process, handleNewSession } from "./command";

export class Server {

	private readonly sessions: Map<number, Process>;

	public constructor(
		private readonly connection: ReadWriteConnection,
	) {
		this.sessions = new Map();

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
		} else if (message.hasNewSession()) {
			const session = handleNewSession(this.connection, message.getNewSession()!, () => {
				this.sessions.delete(message.getNewSession()!.getId());				
			});

			this.sessions.set(message.getNewSession()!.getId(), session);
		} else if (message.hasCloseSessionInput()) {
			const s = this.getSession(message.getCloseSessionInput()!.getId());
			if (!s || !s.stdin) {
				return;
			}
			s.stdin.end();
		} else if (message.hasResizeSessionTty()) {
			const s = this.getSession(message.getResizeSessionTty()!.getId());
			if (!s || !s.resize) {
				return;
			}
			const tty = message.getResizeSessionTty()!.getTtyDimensions()!;
			s.resize(tty.getWidth(), tty.getHeight());
		} else if (message.hasShutdownSession()) {
			const s = this.getSession(message.getShutdownSession()!.getId());
			if (!s) {
				return;
			}
			s.kill(message.getShutdownSession()!.getSignal());
		} else if (message.hasWriteToSession()) {
			const s = this.getSession(message.getWriteToSession()!.getId());
			if (!s) {
				return;
			}
			s.write(new TextDecoder().decode(message.getWriteToSession()!.getData_asU8()));
		}
	}

	private getSession(id: number): Process | undefined {
		return this.sessions.get(id);
	}

}
