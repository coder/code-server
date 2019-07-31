import { coderApi, vscodeApi } from "vs/server/src/api";
import "vs/css!./media/firefox";
import { ServiceCollection } from "vs/platform/instantiation/common/serviceCollection";

/**
 * This is called by vs/workbench/browser/web.main.ts after the workbench has
 * been initialized so we can initialize our own client-side code.
 */
export const initialize = (services: ServiceCollection): void => {
	const target = window as any;
	target.ide = coderApi(services);
	target.vscode = vscodeApi(services);

	const event = new CustomEvent('ide-ready');
	(event as any).ide = target.ide;
	(event as any).vscode = target.vscode;
	window.dispatchEvent(event);
};
