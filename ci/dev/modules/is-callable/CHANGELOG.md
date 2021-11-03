1.2.3 / 2021-01-31
=================
  * [Fix] `document.all` is callable (do not use `document.all`!)
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `aud`, `tape`
  * [Tests] migrate tests to Github Actions
  * [actions] add "Allow Edits" workflow
  * [actions] switch Automatic Rebase workflow to `pull_request_target` event

1.2.2 / 2020-09-21
=================
  * [Fix] include actual fix from 579179e
  * [Dev Deps] update `eslint`

1.2.1 / 2020-09-09
=================
  * [Fix] phantomjs‘ Reflect.apply does not throw properly on a bad array-like
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`
  * [meta] fix eclint error

1.2.0 / 2020-06-02
=================
  * [New] use `Reflect.apply`‑based callability detection
  * [readme] add install instructions (#55)
  * [meta] only run `aud` on prod deps
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `tape`, `make-arrow-function`, `make-generator-function`; add `aud`, `safe-publish-latest`, `make-async-function`
  * [Tests] add tests for function proxies (#53, #25)

1.1.5 / 2019-12-18
=================
  * [meta] remove unused Makefile and associated utilities
  * [meta] add `funding` field; add FUNDING.yml
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `semver`, `tape`, `covert`, `rimraf`
  * [Tests] use shared travis configs
  * [Tests] use `eccheck` over `editorconfig-tools`
  * [Tests] use `npx aud` instead of `nsp` or `npm audit` with hoops
  * [Tests] remove `jscs`
  * [actions] add automatic rebasing / merge commit blocking

1.1.4 / 2018-07-02
=================
  * [Fix] improve `class` and arrow function detection (#30, #31)
  * [Tests] on all latest node minors; improve matrix
  * [Dev Deps] update all dev deps

1.1.3 / 2016-02-27
=================
  * [Fix] ensure “class “ doesn’t screw up “class” detection
  * [Tests] up to `node` `v5.7`, `v4.3`
  * [Dev Deps] update to `eslint` v2, `@ljharb/eslint-config`, `jscs`

1.1.2 / 2016-01-15
=================
  * [Fix] Make sure comments don’t screw up “class” detection (#4)
  * [Tests] up to `node` `v5.3`
  * [Tests] Add `parallelshell`, run both `--es-staging` and stock tests at once
  * [Dev Deps] update `tape`, `jscs`, `nsp`, `eslint`, `@ljharb/eslint-config`
  * [Refactor] convert `isNonES6ClassFn` into `isES6ClassFn`

1.1.1 / 2015-11-30
=================
  * [Fix] do not throw when a non-function has a function in its [[Prototype]] (#2)
  * [Dev Deps] update `tape`, `eslint`, `@ljharb/eslint-config`, `jscs`, `nsp`, `semver`
  * [Tests] up to `node` `v5.1`
  * [Tests] no longer allow node 0.8 to fail.
  * [Tests] fix npm upgrades in older nodes

1.1.0 / 2015-10-02
=================
  * [Fix] Some browsers report TypedArray constructors as `typeof object`
  * [New] return false for "class" constructors, when possible.
  * [Tests] up to `io.js` `v3.3`, `node` `v4.1`
  * [Dev Deps] update `eslint`, `editorconfig-tools`, `nsp`, `tape`, `semver`, `jscs`, `covert`, `make-arrow-function`
  * [Docs] Switch from vb.teelaun.ch to versionbadg.es for the npm version badge SVG

1.0.4 / 2015-01-30
=================
  * If @@toStringTag is not present, use the old-school Object#toString test.

1.0.3 / 2015-01-29
=================
  * Add tests to ensure arrow functions are callable.
  * Refactor to aid optimization of non-try/catch code.

1.0.2 / 2015-01-29
=================
  * Fix broken package.json

1.0.1 / 2015-01-29
=================
  * Add early exit for typeof not "function"

1.0.0 / 2015-01-29
=================
  * Initial release.
