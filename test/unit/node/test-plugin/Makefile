out/index.js: src/index.ts
	# Typescript always emits, even on errors.
	npm run build || rm out/index.js

node_modules: package.json package-lock.json
	npm install
