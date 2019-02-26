import { URI } from "vs/base/common/uri";
import { IEnvironmentService } from "vs/platform/environment/common/environment";
import { ILogService } from "vs/platform/log/common/log";
import { IWorkspaceFolderCreationData, IWorkspaceIdentifier, IWorkspacesService } from "vs/platform/workspaces/common/workspaces";
import { WorkspacesMainService } from "vs/platform/workspaces/electron-main/workspacesMainService";
import * as workspacesIpc from "vs/platform/workspaces/node/workspacesIpc";
import { workbench } from "../workbench";

/**
 * Instead of going to the shared process, we'll directly run these methods on
 * the client. This setup means we can only control the current window.
 */
class WorkspacesService implements IWorkspacesService {
	// tslint:disable-next-line:no-any
	public _serviceBrand: any;

	public createUntitledWorkspace(folders?: IWorkspaceFolderCreationData[] | undefined): Promise<IWorkspaceIdentifier> {
		const mainService = new WorkspacesMainService(
			workbench.serviceCollection.get<IEnvironmentService>(IEnvironmentService) as IEnvironmentService,
			workbench.serviceCollection.get<ILogService>(ILogService) as ILogService,
		);

		// lib/vscode/src/vs/platform/workspaces/node/workspacesIpc.ts
		const rawFolders: IWorkspaceFolderCreationData[] = folders!;
		if (Array.isArray(rawFolders)) {
			folders = rawFolders.map(rawFolder => {
				return {
					uri: URI.revive(rawFolder.uri), // convert raw URI back to real URI
					name: rawFolder.name!,
				} as IWorkspaceFolderCreationData;
			});
		}

		return mainService.createUntitledWorkspace(folders);
	}
}

const target = workspacesIpc as typeof workspacesIpc;
// @ts-ignore TODO: don't ignore it.
target.WorkspacesChannelClient = WorkspacesService;
