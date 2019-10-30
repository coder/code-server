// This file is included via a regular Node require. I'm not sure how (or if)
// we can write this in Typescript and have it compile to non-AMD syntax.
module.exports = (remoteAuthority) => {
	return {
		transformIncoming: (uri) => {
			switch (uri.scheme) {
				case "vscode-remote": return { scheme: "file", path: uri.path };
				default: return uri;
			}
		},
		transformOutgoing: (uri) => {
			switch (uri.scheme) {
				case "file": return { scheme: "vscode-remote", authority: remoteAuthority, path: uri.path };
				default: return uri;
			}
		},
		transformOutgoingScheme: (scheme) => {
			switch (scheme) {
				case "file": return "vscode-remote";
				default: return scheme;
			}
		},
	};
};
