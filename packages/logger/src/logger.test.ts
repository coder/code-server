import { field, logger, BrowserFormatter, Time } from "./logger";

describe("Logger", () => {
	it("should use server formatter", () => {
		logger.info("test", field("key", "value"), field("time", new Time(100, Date.now())));
		logger.named("name").debug("test name");
		logger.named("another name").warn("another test name");
	});

	it("should use browser formatter", () => {
		logger.formatter = new BrowserFormatter();
		logger.info("test", field("key", "value"), field("time", new Time(100, Date.now())));
		logger.named("name").debug("test name");
		logger.named("another name").warn("another test name");
	});
});
