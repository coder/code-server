import { IStorageService, StorageScope } from 'vs/platform/storage/common/storage';

export class StorageService implements IStorageService {

	public _serviceBrand: any;

	private _globalObject: object;
	private _workspaceObject: object;

	public constructor(globalState: object, workspaceState: object) {
		this._globalObject = globalState;
		this._workspaceObject = workspaceState;
	}

	public get globalObject() {
		return this._globalObject;
	}

	public get workspaceObject() {
		return this._workspaceObject;
	}

	public store(key: string, value: any, scope?: StorageScope): void {
		this.getObject(scope)[key] = value;
	}

	public remove(key: string, scope?: StorageScope): void {
		delete this.getObject(scope)[key];
	}

	public get(key: string, scope?: StorageScope, defaultValue?: string): string {
		return this.getObject(scope)[key] || defaultValue;
	}

	public getInteger(key: string, scope?: StorageScope, defaultValue?: number): number {
		return parseInt(this.get(key, scope), 10) || defaultValue;
	}

	public getBoolean(key: string, scope?: StorageScope, defaultValue?: boolean): boolean {
		const v = this.get(key, scope);
		if (typeof v !== "undefined") {
			return v === 'true';
		}
		return defaultValue;
	}

	private getObject(scope = StorageScope.GLOBAL): object {
		switch (scope) {
			case StorageScope.GLOBAL:
				return this._globalObject;
			case StorageScope.WORKSPACE:
				return this._workspaceObject;
			default:
				throw new Error("unsupported storage scope");
		}
	}

}