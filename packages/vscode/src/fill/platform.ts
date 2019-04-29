import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as util from "util";
import * as platform from "vs/base/common/platform";
import * as browser from "vs/base/browser/browser";
import * as nls from "vs/nls";
import * as lp from "vs/base/node/languagePacks";

// tslint:disable no-any to override const

interface IBundledStrings {
	[moduleId: string]: string[];
}

const rawNlsConfig = process.env.VSCODE_NLS_CONFIG;
if (rawNlsConfig) {
	const nlsConfig = JSON.parse(rawNlsConfig) as lp.InternalNLSConfiguration;
	const resolved = nlsConfig.availableLanguages["*"];
	(platform as any).locale = nlsConfig.locale;
	(platform as any).language = resolved ? resolved : "en";
	(platform as any).translationsConfigFile = nlsConfig._translationsConfigFile;

	// TODO: Each time this is imported, VS Code's loader creates a different
	// module with an array of all the translations for that file. We don't use
	// their loader (we're using Webpack) so we need to figure out a good way to
	// handle that.
	if (nlsConfig._resolvedLanguagePackCoreLocation) {
		const bundles = Object.create(null);
		(nls as any).load("nls", undefined, (mod: any) => {
			Object.keys(mod).forEach((k) => (nls as any)[k] = mod[k]);
		}, {
			"vs/nls": {
				...nlsConfig,
				// Taken from lib/vscode/src/bootstrap.js.
				loadBundle: async (
					bundle: string, language: string,
					cb: (error?: Error, messages?: string[] | IBundledStrings) => void,
				): Promise<void> => {
					let result = bundles[bundle];
					if (result) {
						return cb(undefined, result);
					}

					const bundleFile = path.join(nlsConfig._resolvedLanguagePackCoreLocation, bundle.replace(/\//g, "!") + ".nls.json");

					try {
						const content = await util.promisify(fs.readFile)(bundleFile, "utf8");
						bundles[bundle] = JSON.parse(content);
						cb(undefined, bundles[bundle]);
					} catch (error) {
						cb(error, undefined);
					}
				},
			},
		});
	}
}

// Anything other than "en" will cause English aliases to display, which ends up
// just displaying a lot of redundant text when the locale is en-US.
if (platform.locale === "en-US") {
	(platform as any).locale = "en";
}
if (platform.language === "en-US") {
	(platform as any).language = "en";
}

// Use the server's platform instead of the client's. For example, this affects
// how VS Code handles paths (and more) because different platforms give
// different results. We'll have to counter for things that shouldn't change,
// like keybindings.
(platform as any).isLinux = os.platform() === "linux";
(platform as any).isWindows = os.platform() === "win32";
(platform as any).isMacintosh = os.platform() === "darwin";
(platform as any).platform = os.platform() === "linux"
	? platform.Platform.Linux : os.platform() === "win32"
	? platform.Platform.Windows : platform.Platform.Mac;

// This is used for keybindings, and in one place to choose between \r\n and \n
// (which we change to use platform.isWindows instead).
(platform as any).OS = browser.isMacintosh
	? platform.OperatingSystem.Macintosh : browser.isWindows
	? platform.OperatingSystem.Windows : platform.OperatingSystem.Linux;
