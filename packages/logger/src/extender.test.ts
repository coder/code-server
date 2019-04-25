import { field, logger } from "./logger";
import { createStackdriverExtender } from "./extender";

describe("Extender", () => {
	it("should add stackdriver extender", () => {
		logger.extend(createStackdriverExtender("coder-dev-1", "logging-package-tests"));
	});

	it("should log", async () => {
		logger.debug("Bananas!", field("frog", { hi: "wow" }));
	});
});
