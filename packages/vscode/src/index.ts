import { field, logger, time } from "@coder/logger";
import { Client, IURI, setUriFactory } from "@coder/ide";
import { URI } from "vs/base/common/uri";
import "./firefox";

const load = (): Promise<void> => {
	return new Promise((resolve, reject) => {
		setUriFactory({
			// TODO: not sure why this is an error.
			// tslint:disable-next-line no-any
			create: <URI>(uri: IURI): URI => URI.from(uri) as any,
			file: (path: string): IURI => URI.file(path),
			parse: (raw: string): IURI => URI.parse(raw),
		});

		const client = new Client({
			mkDirs: [
				"~/vscode/extensions",
				"~/.config/User",
			],
		});

		resolve();

		// const importTime = time(1500);
		// import(/* webpackPrefetch: true */ "./workbench").then((module) => {
		// 	logger.info("Loaded workbench bundle", field("duration", importTime));
		// 	const initTime = time(1500);

		// 	return module.initialize(client).then(() => {
		// 		logger.info("Initialized workbench", field("duration", initTime));
		//
		// 	});
		// }).catch((error) => {
		// });
	});
};

export { load };
