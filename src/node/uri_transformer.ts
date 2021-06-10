// NOTE: copied over from lib/vscode/src/vs/common/uriIpc.ts
// remember to update this for proper type checks!

interface UriParts {
	scheme: string;
	authority?: string;
	path?: string;
}

interface IRawURITransformer {
	transformIncoming(uri: UriParts): UriParts;
	transformOutgoing(uri: UriParts): UriParts;
	transformOutgoingScheme(scheme: string): string;
}

// This is deliberate! see src/vs/workbench/services/extensions/node/extensionHostProcessSetup.ts
export = function rawURITransformerFactory(authority: string) {
    return new RawURITransformer(authority);
}

class RawURITransformer implements IRawURITransformer {
    constructor(private readonly authority: string) {}

    transformIncoming(uri: UriParts): UriParts {
        switch (uri.scheme) {
            case "vscode-remote": return {scheme: "file", path: uri.path};
            default: return uri;
        }
    }

    transformOutgoing(uri: UriParts): UriParts {
        switch (uri.scheme) {
            case "file": return {scheme: "vscode-remote", authority: this.authority, path: uri.path};
            default: return uri;
        }
    }

    transformOutgoingScheme(scheme: string): string {
        switch (scheme) {
            case "file": return "vscode-remote";
            default: return scheme; 
        }
    }
}
