import * as os from "os";
import * as platform from "vs/base/common/platform";
import * as browser from "vs/base/browser/browser";

// tslint:disable no-any to override const

// Use en instead of en-US since that's vscode default and it uses
// that to determine whether to output aliases which will be redundant.
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
(platform as any).platform = os.platform() === "linux" ? platform.Platform.Linux : os.platform() === "win32" ? platform.Platform.Windows : platform.Platform.Mac;

// This is used for keybindings, and in one place to choose between \r\n and \n
// (which we change to use platform.isWindows instead).
(platform as any).OS = (browser.isMacintosh ? platform.OperatingSystem.Macintosh : (browser.isWindows ? platform.OperatingSystem.Windows : platform.OperatingSystem.Linux));
