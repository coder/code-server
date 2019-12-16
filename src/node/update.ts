import * as cp from "child_process";
import * as os from "os";
import * as path from "path";
import * as util from "util";
import { CancellationToken } from "vs/base/common/cancellation";
import { URI } from "vs/base/common/uri";
import * as pfs from "vs/base/node/pfs";
import { IConfigurationService } from "vs/platform/configuration/common/configuration";
import { IEnvironmentService } from "vs/platform/environment/common/environment";
import { IFileService } from "vs/platform/files/common/files";
import { ILogService } from "vs/platform/log/common/log";
import product from "vs/platform/product/common/product";
import { asJson, IRequestService } from "vs/platform/request/common/request";
import { AvailableForDownload, State, UpdateType, StateType } from "vs/platform/update/common/update";
import { AbstractUpdateService } from "vs/platform/update/electron-main/abstractUpdateService";
import { ipcMain } from "vs/server/src/node/ipc";
import { extract } from "vs/server/src/node/marketplace";
import { tmpdir } from "vs/server/src/node/util";

interface IUpdate {
	name: string;
}

export class UpdateService extends AbstractUpdateService {
	_serviceBrand: any;

	constructor(
		@IConfigurationService configurationService: IConfigurationService,
		@IEnvironmentService environmentService: IEnvironmentService,
		@IRequestService requestService: IRequestService,
		@ILogService logService: ILogService,
		@IFileService private readonly fileService: IFileService,
	) {
		super(null, configurationService, environmentService, requestService, logService);
	}

	/**
	 * Return true if the currently installed version is the latest.
	 */
	public async isLatestVersion(latest?: IUpdate | null): Promise<boolean | undefined> {
		if (!latest) {
			latest = await this.getLatestVersion();
		}
		if (latest) {
			const latestMajor = parseInt(latest.name);
			const currentMajor = parseInt(product.codeServerVersion);
			// If these are invalid versions we can't compare meaningfully.
			return isNaN(latestMajor) || isNaN(currentMajor) ||
				// This can happen when there is a pre-release for a new major version.
				currentMajor > latestMajor ||
				// Otherwise assume that if it's not the same then we're out of date.
				latest.name === product.codeServerVersion;
		}
		return true;
	}

	protected buildUpdateFeedUrl(quality: string): string {
		return `${product.updateUrl}/${quality}`;
	}

	public async doQuitAndInstall(): Promise<void> {
		if (this.state.type === StateType.Ready) {
			ipcMain.relaunch(this.state.update.version);
		}
	}

	protected async doCheckForUpdates(context: any): Promise<void> {
		this.setState(State.CheckingForUpdates(context));
		try {
			const update = await this.getLatestVersion();
			if (!update || await this.isLatestVersion(update)) {
				this.setState(State.Idle(UpdateType.Archive));
			} else {
				this.setState(State.AvailableForDownload({
					version: update.name,
					productVersion: update.name,
				}));
			}
		} catch (error) {
			this.onRequestError(error, !!context);
		}
	}

	private async getLatestVersion(): Promise<IUpdate | null> {
		const data = await this.requestService.request({
			url: this.url,
			headers: { "User-Agent": "code-server" },
		}, CancellationToken.None);
		return asJson(data);
	}

	protected async doDownloadUpdate(state: AvailableForDownload): Promise<void> {
		this.setState(State.Downloading(state.update));
		const target = os.platform();
		const releaseName = await this.buildReleaseName(state.update.version);
		const url = "https://github.com/cdr/code-server/releases/download/"
			+ `${state.update.version}/${releaseName}`
			+ `.${target === "darwin" ? "zip" : "tar.gz"}`;
		const downloadPath = path.join(tmpdir, `${state.update.version}-archive`);
		const extractPath = path.join(tmpdir, state.update.version);
		try {
			await pfs.mkdirp(tmpdir);
			const context = await this.requestService.request({ url }, CancellationToken.None, true);
			await this.fileService.writeFile(URI.file(downloadPath), context.stream);
			await extract(downloadPath, extractPath, undefined, CancellationToken.None);
			const newBinary = path.join(extractPath, releaseName, "code-server");
			if (!pfs.exists(newBinary)) {
				throw new Error("No code-server binary in extracted archive");
			}
			await pfs.unlink(process.argv[0]); // Must unlink first to avoid ETXTBSY.
			await pfs.move(newBinary, process.argv[0]);
			this.setState(State.Ready(state.update));
		} catch (error) {
			this.onRequestError(error, true);
		}
		await Promise.all([downloadPath, extractPath].map((p) => pfs.rimraf(p)));
	}

	private onRequestError(error: Error, showNotification?: boolean): void {
		this.logService.error(error);
		this.setState(State.Idle(UpdateType.Archive, showNotification ? (error.message || error.toString()) : undefined));
	}

	private async buildReleaseName(release: string): Promise<string> {
		let target: string = os.platform();
		if (target === "linux") {
			const result = await util.promisify(cp.exec)("ldd --version").catch((error) => ({
				stderr: error.message,
				stdout: "",
			}));
			if (/musl/.test(result.stderr) || /musl/.test(result.stdout)) {
				target = "alpine";
			}
		}
		let arch = os.arch();
		if (arch === "x64") {
			arch = "x86_64";
		}
		return `code-server${release}-${target}-${arch}`;
	}
}
