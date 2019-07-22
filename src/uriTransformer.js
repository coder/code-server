// This file is included via a regular Node require. I'm not sure how (or if)
// we can write this in Typescript and have it compile to non-AMD syntax.
module.exports = (remoteAuthority) => {
	return {
		transformIncoming: (uri) => {
			switch (uri.scheme) {
				case "code-server": return { scheme: "file", path: uri.path };
				case "file": return { scheme: "code-server-local", path: uri.path };
				default: return uri;
			}
		},
		transformOutgoing: (uri) => {
			switch (uri.scheme) {
				case "code-server-local": return { scheme: "file", path: uri.path };
				case "file": return { scheme: "code-server", authority: remoteAuthority, path: uri.path };
				default: return uri;
			}
		},
		transformOutgoingScheme: (scheme) => {
			switch (scheme) {
				case "code-server-local": return "file";
				case "file": return "code-server";
				default: return scheme;
			}
		},
	};
};
