/// <reference path="../node_modules/@types/chrome/index.d.ts" />

// tslint:disable-next-line:no-any
const chromeApp = (<any>chrome).app;

chromeApp.runtime.onLaunched.addListener(() => {
	chromeApp.window.create("src/index.html", {
		outerBounds: {
			width: 400,
			height: 500,
		},
	});
});
