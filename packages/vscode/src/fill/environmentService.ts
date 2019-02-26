import * as paths from "./paths";
import * as environment from "vs/platform/environment/node/environmentService";

export class EnvironmentService extends environment.EnvironmentService {
	public get sharedIPCHandle(): string {
		return paths.getSocketPath() || super.sharedIPCHandle;
	}
}

const target = environment as typeof environment;
target.EnvironmentService = EnvironmentService;
