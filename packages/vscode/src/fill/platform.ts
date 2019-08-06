import * as os from "os";
import * as platform from "vs/base/common/platform";
import * as browser from "vs/base/browser/browser";
import * as nls from "vs/nls";
import * as lp from "vs/base/node/languagePacks";
// tslint:disable no-any to override const

// Use en instead of en-US since that's vscode default and it uses
// that to determine whether to output aliases which will be redundant.
if (platform.locale === "en-US") {
	(platform as any).locale = "en";
}
if (platform.language === "en-US") {
	(platform as any).language = "en";
}

// tslint:disable no-any to override const

// @www.ps.dev
interface NewInternalNLSConfiguration extends lp.InternalNLSConfiguration {
	languageTranslateData?: any;
}

const rawNlsConfig = process.env.VSCODE_NLS_CONFIG;
if (rawNlsConfig) {
	const nlsConfig = JSON.parse(rawNlsConfig) as NewInternalNLSConfiguration;
	const resolved = nlsConfig.availableLanguages["*"];
	(platform as any).locale = nlsConfig.locale;
	(platform as any).language = resolved ? resolved : "en";
	(platform as any).translationsConfigFile = nlsConfig._translationsConfigFile;

	// TODO: Each time this is imported, VS Code's loader creates a different
	// module with an array of all the translations for that file. We don't use
	// their loader (we're using Webpack) so we need to figure out a good way to
	// handle that.
	if (nlsConfig._resolvedLanguagePackCoreLocation) {
		let localize = (env: any, data: any, message: any): string => {
			let args = [];
			for (let _i = 3; _i < arguments.length; _i++) {
				args[_i - 3] = arguments[_i];
			}

			return _format(message, args, env);
		};

		let _format = (message: any, args: any, env: any): string => {
			let result;
			if (args.length === 0) {
				result = message;
			} else {
				result = message.replace(/\{(\d+)\}/g, (match: any, rest: any) => {
					let index = rest[0];
					let arg = args[index];
					let result = match;
					if (typeof arg === "string") {
						result = arg;
					} else if (typeof arg === "number" || typeof arg === "boolean" || arg === undefined || arg === null) {
						result = String(arg);
					}
					return result;
				});
			}
			if (env.isPseudo) {
				// FF3B and FF3D is the Unicode zenkaku representation for [ and ]
				result = "\uFF3B" + result.replace(/[aouei]/g, "$&$&") + "\uFF3D";
			}

			return result;
		}

		(nls as any).localize = (data: any, message: any): any => {
			let args = [];
			for (let _i = 2; _i < arguments.length; _i++) {
				args[_i - 2] = arguments[_i];
			}

			// 匹配翻译字符串
			if (nlsConfig.languageTranslateData) {
				if (data.key && nlsConfig.languageTranslateData.vscode[data.key]) {
					message = nlsConfig.languageTranslateData.vscode[data.key];
				} else if (typeof data === "string") {
					message = nlsConfig.languageTranslateData.vscode[data];
				}
			}

			return localize.apply(undefined, [(nls as any)._env, data, message].concat(args));
		};
	}
}
// @www.ps.dev end

// Use the server's platform instead of the client's. For example, this affects
// how VS Code handles paths (and more) because different platforms give
// different results. We'll have to counter for things that shouldn't change,
// like keybindings.
(platform as any).isLinux = os.platform() === "linux";
(platform as any).isWindows = os.platform() === "win32";
(platform as any).isMacintosh = os.platform() === "darwin";
(platform as any).platform = os.platform() === "linux" ? platform.Platform.Linux : os.platform() === "win32" ? platform.Platform.Windows : platform.Platform.Mac;

// This is used for keybindings, and in one place to choose between \r\n and \n
// (which we change to use platform.isWindows instead).
(platform as any).OS = (browser.isMacintosh ? platform.OperatingSystem.Macintosh : (browser.isWindows ? platform.OperatingSystem.Windows : platform.OperatingSystem.Linux));
