// @ts-ignore
import * as gcl from "@google-cloud/logging";
import { Extender, logger, field } from "./logger";

export const createStackdriverExtender = (projectId: string, logId: string): Extender => {
	enum GcpLogSeverity {
		DEFAULT = 0,
		DEBUG = 100,
		INFO = 200,
		NOTICE = 300,
		WARNING = 400,
		ERROR = 500,
		CRITICAL = 600,
		ALERT = 700,
		EMERGENCY = 800,
	}

	const logging = new gcl.Logging({
		autoRetry: true,
		projectId,
	});

	const log = logging.log(logId);
	const convertSeverity = (severity: "trace" | "info" | "warn" | "debug" | "error"): GcpLogSeverity => {
		switch (severity) {
			case "trace":
			case "debug":
				return GcpLogSeverity.DEBUG;
			case "info":
				return GcpLogSeverity.INFO;
			case "error":
				return GcpLogSeverity.ERROR;
			case "warn":
				return GcpLogSeverity.WARNING;
		}
	};

	return (options): void => {
		const severity = convertSeverity(options.type);
		// tslint:disable-next-line:no-any
		const metadata = {} as any;
		if (options.fields) {
			options.fields.forEach((f) => {
				if (!f) {
					return;
				}
				metadata[f.identifier] = f.value;
			});
		}

		const entry = log.entry({
			// tslint:disable-next-line:no-any
			severity: severity as any,
		}, {
			...metadata,
			message: options.message,
		});

		log.write(entry).catch((ex: Error) => {
			logger.named("GCP").error("Failed to log", field("error", ex));
		});
	};

};
