import * as paths from "./paths";
import * as environment from "vs/platform/environment/node/environmentService";

/**
 * Customize paths using data received from the initialization message.
 */
export class EnvironmentService extends environment.EnvironmentService {
	public get sharedIPCHandle(): string {
		return paths.getSocketPath() || super.sharedIPCHandle;
	}

	public get extensionsPath(): string {
		return paths.getExtensionsDirectory();
	}
}

const target = environment as typeof environment;
target.EnvironmentService = EnvironmentService;
