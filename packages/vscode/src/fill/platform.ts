import * as platform from "vs/base/common/platform";

// Use en instead of en-US since that's vscode default and it uses
// that to determine whether to output aliases which will be redundant.
if (platform.locale === "en-US") {
	// tslint:disable-next-line no-any to override const
	(platform as any).locale = "en";
}
if (platform.language === "en-US") {
	// tslint:disable-next-line no-any to override const
	(platform as any).language = "en";
}
