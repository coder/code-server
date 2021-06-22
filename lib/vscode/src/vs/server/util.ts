import { URITransformer } from 'vs/base/common/uriIpc';
import rawURITransformerFactory = require('vs/server/uriTransformer');

export const getUriTransformer = (remoteAuthority: string): URITransformer => {
	return new URITransformer(rawURITransformerFactory(remoteAuthority));
};
