// We can't directly fork the main shared process because we need to run
// `startup`, so we fork this middleman instead.

// VS Code has its own version of this file, but I'm not sure we can use it. I
// tried but ran into problems with the loader having an undefined `require`.
// There may be more issues since it expects a browser context.

// Here we use VS Code's bootstrapper directly (unfortunately we can't use
// plain `require` since their code is compiled into AMD modules).
import "../bootstrap";
// @ts-ignore there are no types for this.
import * as bootstrap from "vs/../bootstrap-amd";

// TODO: including the type makes the linter go wild and it won't build. Is
// there a way to ignore the vscode directory?
// tslint:disable-next-line no-any
bootstrap.load("vs/code/electron-browser/sharedProcess/sharedProcessMain", (shared: any) => {
	shared.startup({ machineId: "1" });
});
