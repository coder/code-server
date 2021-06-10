import { URITransformer } from 'vs/base/common/uriIpc';
import rawURITransformerFactory = require('vs/server/node/uriTransformer');


export const getUriTransformer = (remoteAuthority: string): URITransformer => {
	return new URITransformer(rawURITransformerFactory(remoteAuthority));
};

/**
 * Encode a path for opening via the folder or workspace query parameter. This
 * preserves slashes so it can be edited by hand more easily.
 */
export const encodePath = (path: string): string => {
	return path.split('/').map((p) => encodeURIComponent(p)).join('/');
};
