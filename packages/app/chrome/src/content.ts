import { create } from "@coder/app/common/src/app";
import { tcpHost } from "./chome";

create({
	storage: {
		get: <T>(key: string): Promise<T | undefined> => {
			return new Promise<T | undefined>((resolve, reject): void => {
				try {
					chrome.storage.sync.get(key, (items) => {
						resolve(items[key]);
					});
				} catch (ex) {
					reject(ex);
				}
			});
		},
		set: <T>(key: string, value: T): Promise<void> => {
			return new Promise<void>((resolve, reject): void => {
				try {
					chrome.storage.sync.set({
						[key]: value,
					}, () => {
						resolve();
					});
				} catch (ex) {
					reject(ex);
				}
			});
		},
	},
	tcp: tcpHost,
	node: document.getElementById("main") as HTMLDivElement,
});
