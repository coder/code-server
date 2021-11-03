1.1.3 / 2021-02-22
=================
  * [readme] remove travis badge
  * [meta] do not publish github action workflow files
  * [Deps] update `call-bind`, `es-abstract`
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `aud`, `functions-have-names`, `has-strict-mode`, `tape`
  * [actions] update workflows

1.1.2 / 2020-11-26
=================
  * [Fix] do not mutate the native function when present
  * [Deps] update `es-abstract`; use `call-bind` where applicable
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `tape`, `functions-have-names`; add `aud`, `safe-publish-latest`
  * [Tests] only audit prod deps
  * [Tests] migrate tests to Github Actions
  * [Tests] run `nyc` on all tests
  * [Tests] add `implementation` test; run `es-shim-api` in postlint; use `tape` runner
  * [actions] add "Allow Edits" workflow
  * [actions] switch Automatic Rebase workflow to `pull_request_target` event

1.1.1 / 2019-12-12
=================
  * [Refactor] use split-up `es-abstract` (85% bundle size decrease)
  * [Deps] update `es-abstract`
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `functions-have-names`, `tape`, `object-keys`
  * [Tests] use `npx aud` instead of `nsp` or `npm audit` with hoops
  * [Tests] use shared travis-ci configs
  * [Tests] use `functions-have-names`
  * [meta] add `funding` field
  * [actions] add automatic rebasing / merge commit blocking

1.1.0 / 2019-01-01
=================
  * [New] add `auto` entry point`
  * [Deps] update `define-properties`, `es-abstract`, `function-bind`, `has`
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `covert`, `tape`
  * [Tests] up to `node` `v11.6`, `v10.15`, `v9.11`, `v8.15`, `v7.10`, `v6.16`, `v4.9`; use `nvm install-latest-npm`
  * [Tests] use `npm audit` instead of `nsp`
  * [Tests] remove `jscs`

1.0.4 / 2016-12-04
=================
  * [Docs] update to reflect ES2017 inclusion
  * [Deps] update `es-abstract`, `function-bind`, `define-properties`
  * [Dev Deps] update `tape`, `jscs`, `nsp`, `eslint`, `@ljharb/eslint-config`
  * [Tests] up to `node` `v7.2`, `v6.9`, `v4.6`; improve test matrix.

1.0.3 / 2015-10-06
=================
  * [Fix] Not-yet-visited keys made non-enumerable on a `[[Get]]` must not show up in the output (https://github.com/ljharb/proposal-object-values-entries/issues/5)

1.0.2 / 2015-09-25
=================
  * [Fix] Not-yet-visited keys deleted on a `[[Get]]` must not show up in the output (#1)

1.0.1 / 2015-09-21
=================
  * [Docs] update version badge URL
  * [Tests] on `io.js` `v3.3`, up to `node` `v4.1`
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`

1.0.0 / 2015-09-02
=================
  * v1.0.0
