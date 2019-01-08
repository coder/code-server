const loadTime = time(2500);

import { URI } from "vs/base/common/uri";
import { field, logger, time } from "@coder/logger";
import { Client, IURI, setUriFactory } from "@coder/ide";
import "./firefox";
import "./setup";

setUriFactory({
	// TODO: not sure why this is an error.
	// tslint:disable-next-line no-any
	create: <URI>(uri: IURI): URI => URI.from(uri) as any,
	file: (path: string): IURI => URI.file(path),
	parse: (raw: string): IURI => URI.parse(raw),
});

export const client = new Client({
	mkDirs: [
		"~/vscode/extensions",
		"~/.config/User",
	],
});

const overlayElement = document.getElementById("overlay");
const msgElement = overlayElement
	? overlayElement.querySelector(".message") as HTMLElement
	: undefined;

const importTime = time(1500);
import(/* webpackPrefetch: true */ "./workbench").then((module) => {
	logger.info("Loaded workbench bundle", field("duration", importTime));
	const initTime = time(1500);

	return module.initialize(client).then(() => {
		logger.info("Initialized workbench", field("duration", initTime));
		logger.info("Load completed", field("duration", loadTime));
		if (overlayElement) {
			overlayElement.style.opacity = "0";
			overlayElement.addEventListener("transitionend", () => {
				overlayElement.remove();
			});
		}
	});
}).catch((error) => {
	logger.error(error);
	if (overlayElement) {
		overlayElement.classList.add("error");
	}
	if (msgElement) {
		msgElement.innerText = `Failed to load: ${error.message}. Retrying in 3 seconds...`;
	}
	setTimeout(() => {
		location.reload();
	}, 3000);
});
