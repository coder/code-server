const {
	FuseBox, SassPlugin, CSSPlugin, WebIndexPlugin,
} = require("fuse-box");

const fuse = FuseBox.init({
	homeDir: ".",
	output: "dist/$name.js",
	plugins: [
		WebIndexPlugin({ template: "packages/app/src/index.html" }),
		[ SassPlugin(), CSSPlugin() ],
	],
});

fuse.dev();

fuse.bundle("app").hmr().watch()
	.instructions(">packages/app/src/index.ts");

fuse.run();
