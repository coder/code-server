out/index.js: src/index.ts
	# Typescript always emits, even on errors.
	yarn build || rm out/index.js

node_modules: package.json yarn.lock
	yarn
