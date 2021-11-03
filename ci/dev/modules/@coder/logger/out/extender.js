"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const gcl = require("@google-cloud/logging");
const logger_1 = require("./logger");
exports.createStackdriverExtender = (projectId, logId) => {
    let GcpLogSeverity;
    (function (GcpLogSeverity) {
        GcpLogSeverity[GcpLogSeverity["DEFAULT"] = 0] = "DEFAULT";
        GcpLogSeverity[GcpLogSeverity["DEBUG"] = 100] = "DEBUG";
        GcpLogSeverity[GcpLogSeverity["INFO"] = 200] = "INFO";
        GcpLogSeverity[GcpLogSeverity["NOTICE"] = 300] = "NOTICE";
        GcpLogSeverity[GcpLogSeverity["WARNING"] = 400] = "WARNING";
        GcpLogSeverity[GcpLogSeverity["ERROR"] = 500] = "ERROR";
        GcpLogSeverity[GcpLogSeverity["CRITICAL"] = 600] = "CRITICAL";
        GcpLogSeverity[GcpLogSeverity["ALERT"] = 700] = "ALERT";
        GcpLogSeverity[GcpLogSeverity["EMERGENCY"] = 800] = "EMERGENCY";
    })(GcpLogSeverity || (GcpLogSeverity = {}));
    const logging = new gcl.Logging({
        autoRetry: true,
        projectId,
    });
    const log = logging.log(logId);
    const convertSeverity = (severity) => {
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
    return (options) => {
        const severity = convertSeverity(options.type);
        // tslint:disable-next-line:no-any
        const metadata = {};
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
            severity: severity,
        }, {
            ...metadata,
            message: options.message,
        });
        log.write(entry).catch((ex) => {
            logger_1.logger.named("GCP").error("Failed to log", logger_1.field("error", ex));
        });
    };
};
//# sourceMappingURL=extender.js.map