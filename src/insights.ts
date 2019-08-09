import * as appInsights from "applicationinsights";
import * as https from "https";
import * as os from "os";

export class TelemetryClient implements appInsights.TelemetryClient {
	public config: any = {};

	public channel = {
		setUseDiskRetryCaching: (): void => undefined,
	};

	public trackEvent(options: appInsights.EventTelemetry): void {
		if (!options.properties) {
			options.properties = {};
		}
		if (!options.measurements) {
			options.measurements = {};
		}

		try {
			const cpus = os.cpus();
			options.measurements.cores = cpus.length;
			options.properties["common.cpuModel"] = cpus[0].model;
		} catch (error) {}

		try {
			options.measurements.memoryFree = os.freemem();
			options.measurements.memoryTotal = os.totalmem();
		} catch (error) {}

		try {
			options.properties["common.shell"] = os.userInfo().shell;
			options.properties["common.release"] = os.release();
			options.properties["common.arch"] = os.arch();
		} catch (error) {}

		try {
			const request = https.request({
				host: "v1.telemetry.coder.com",
				port: 443,
				path: "/track",
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});
			request.on("error", () => { /* We don't care. */ });
			request.write(JSON.stringify(options));
			request.end();
		} catch (error) {}
	}

	public flush(options: appInsights.FlushOptions): void {
		if (options.callback) {
			options.callback("");
		}
	}
}
