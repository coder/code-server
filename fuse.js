const { FuseBox, SassPlugin, CSSPlugin, CSSResourcePlugin } = require("fuse-box");

const fuse = FuseBox.init({
	homeDir: ".",
	output: "dist/$name.js",
	plugins: [
		[
			SassPlugin(),
			CSSResourcePlugin({ dist: "dist/css-resources" }),
			CSSPlugin(),
		],
	],
});

fuse.dev();

fuse
	.bundle("app")
	.instructions("> packages/app/src/index.ts")
	.hmr()
	.watch();

fuse.run();
