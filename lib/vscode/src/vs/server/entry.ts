import { ArgumentParser } from '../platform/environment/argumentParser';
import { ServerProcessMain } from './main';

export const main = async () => {
	const argumentParser = new ArgumentParser();
	const args = argumentParser.resolveArgs();

	if (!args['server']) {
		throw new Error('Server argument was not given');
	}

	args['user-data-dir'] = '/Users/teffen/.local/share/code-server';

	const serverUrl = new URL(args['server']);

	const codeServer = new ServerProcessMain({
		args,
		authed: false,
		disableUpdateCheck: true,
		codeServerVersion: 'Unknown',
		serverUrl,
	});

	const netServer = await codeServer.startup();

	return new Promise(resolve => {
		netServer.on('close', resolve);
	});
};

export const createVSServer: CodeServerLib.CreateVSServer = async serverConfig => {
	const codeServer = new ServerProcessMain(serverConfig);

	return codeServer.startup({ listenWhenReady: false });
};
