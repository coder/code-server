// This file is included via a regular Node require. I'm not sure how (or if)
// we can write this in Typescript and have it compile to non-AMD syntax.
module.exports = (remoteAuthority, https) => {
	return {
		transformIncoming: (uri) => {
			switch (uri.scheme) {
				case "https": return { scheme: "file", path: uri.path };
				case "http": return { scheme: "file", path: uri.path };
				case "file": return { scheme: "vscode-local", path: uri.path };
				default: return uri;
			}
		},
		transformOutgoing: (uri) => {
			switch (uri.scheme) {
				case "vscode-local": return { scheme: "file", path: uri.path };
				case "file": return { scheme: https ? "https" : "http", authority: remoteAuthority, path: uri.path };
				default: return uri;
			}
		},
		transformOutgoingScheme: (scheme) => {
			switch (scheme) {
				case "vscode-local": return "file";
				case "file": return https ? "https" : "http";
				default: return scheme;
			}
		},
	};
};
