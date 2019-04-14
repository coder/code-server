import { readFile, writeFile } from "fs";
import { mkdirp } from "fs-extra";
import * as path from "path";
import { promisify } from "util";
import { IDisposable } from "@coder/disposable";
import { logger, field } from "@coder/logger";
import { Event } from "vs/base/common/event";
import * as workspaceStorage from "vs/base/node/storage";
import * as globalStorage from "vs/platform/storage/node/storageIpc";
import { IStorageService, WillSaveStateReason } from "vs/platform/storage/common/storage";
import * as paths from "./paths";
import { workbench } from "../workbench";

// tslint:disable completed-docs

class StorageDatabase implements workspaceStorage.IStorageDatabase {
	public readonly onDidChangeItemsExternal = Event.None;
	private readonly items = new Map<string, string>();
	private fetched: boolean = false;
	private readonly path: string;

	public constructor(path: string) {
		this.path = path.replace(/\.vscdb$/, ".json");
		logger.debug("Setting up storage", field("path", this.path));
		window.addEventListener("unload", () => {
			if (!navigator.sendBeacon) {
				throw new Error("cannot save state");
			}

			this.triggerFlush(WillSaveStateReason.SHUTDOWN);
			const resourceBaseUrl = location.pathname.replace(/\/$/, "") + "/resource";
			navigator.sendBeacon(`${resourceBaseUrl}/${this.path}`, this.content);
		});
	}

	public async getItems(): Promise<Map<string, string>> {
		if (this.fetched) {
			return this.items;
		}
		try {
			const contents = await promisify(readFile)(this.path, "utf8");
			const json = JSON.parse(contents);
			Object.keys(json).forEach((key) => {
				this.items.set(key, json[key]);
			});
		} catch (error) {
			if (error.code !== "ENOENT") {
				throw error;
			}
		}

		this.fetched = true;

		return this.items;
	}

	public updateItems(request: workspaceStorage.IUpdateRequest): Promise<void> {
		if (request.insert) {
			request.insert.forEach((value, key) => {
				if (key === "colorThemeData") {
					localStorage.setItem("colorThemeData", value);
				}

				this.items.set(key, value);
			});
		}

		if (request.delete) {
			request.delete.forEach(key => this.items.delete(key));
		}

		return this.save();
	}

	public close(): Promise<void> {
		return Promise.resolve();
	}

	public checkIntegrity(): Promise<string> {
		return Promise.resolve("ok");
	}

	private async save(): Promise<void> {
		await mkdirp(path.dirname(this.path));

		return promisify(writeFile)(this.path, this.content);
	}

	private triggerFlush(reason: WillSaveStateReason = WillSaveStateReason.NONE): boolean {
		// tslint:disable-next-line:no-any
		const storageService = workbench.serviceCollection.get<IStorageService>(IStorageService) as any;
		if (reason === WillSaveStateReason.SHUTDOWN && storageService.close) {
			storageService.close();

			return true;
		}
		if (storageService._onWillSaveState) {
			storageService._onWillSaveState.fire({ reason });

			return true;
		}

		return false;
	}

	private get content(): string {
		const json: { [key: string]: string } = {};
		this.items.forEach((value, key) => {
			json[key] = value;
		});

		return JSON.stringify(json);
	}
}

class GlobalStorageDatabase extends StorageDatabase implements IDisposable {
	public constructor() {
		super(path.join(paths.getAppDataPath(), "globalStorage", "state.vscdb"));
	}

	public dispose(): void {
		// Nothing to do.
	}
}

const workspaceTarget = workspaceStorage as typeof workspaceStorage;
// @ts-ignore TODO: don't ignore it.
workspaceTarget.SQLiteStorageDatabase = StorageDatabase;

const globalTarget = globalStorage as typeof globalStorage;
// @ts-ignore TODO: don't ignore it.
globalTarget.GlobalStorageDatabaseChannelClient = GlobalStorageDatabase;
