1.1.5 / 2021-02-14
=================
  * [meta] do not publish github action workflow files or nyc output
  * [Deps] update `call-bind`, `es-abstract`
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `aud`, `is-callable`, `tape`

1.1.4 / 2020-12-05
=================
  * [readme] fix repo URLs, remove defunct badges
  * [Deps] update `available-typed-arrays`, `es-abstract`; use `call-bind` where applicable
  * [meta] gitignore nyc output
  * [meta] only audit prod deps
  * [actions] add "Allow Edits" workflow
  * [actions] switch Automatic Rebase workflow to `pull_request_target` event
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `is-callable`, `make-arrow-function`, `make-generator-function`, `object-inspect`, `tape`; add `aud`
  * [Tests] migrate tests to Github Actions
  * [Tests] run `nyc` on all tests

1.1.3 / 2020-01-24
=================
  * [Refactor] use `es-abstract`’s `callBound`, `available-typed-arrays`, `has-symbols`

1.1.2 / 2020-01-20
=================
  * [Fix] in envs without Symbol.toStringTag, dc8a8cc made arrays return `true`
  * [Tests] add `evalmd` to `prelint`

1.1.1 / 2020-01-18
=================
  * [Robustness] don’t rely on Array.prototype.indexOf existing
  * [meta] remove unused Makefile and associated utilities
  * [meta] add `funding` field; create FUNDING.yml
  * [actions] add automatic rebasing / merge commit blocking
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `is-callable`, `replace`, `semver`, `tape`; add `safe-publish-latest`
  * [Tests] use shared travis-ci configs
  * [Tests] use `npx aud` instead of `nsp` or `npm audit` with hoops

1.1.0 / 2019-02-16
=================
  * [New] add `BigInt64Array` and `BigUint64Array`
  * [Refactor] use an array instead of an object for storing Typed Array names
  * [meta] ignore `test.html`
  * [Tests] up to `node` `v11.10`, `v10.15`, `v8.15`, `v7.10`, `v6.16`, `v5.10`, `v4.9`
  * [Tests] remove `jscs`
  * [Tests] use `npm audit` instead of `nsp`
  * [Dev Deps] update `eslint`,` @ljharb/eslint-config`, `is-callable`, `tape`, `replace`, `semver`
  * [Dev Deps] remove unused eccheck script + dep

1.0.4 / 2016-03-19
=================
  * [Fix] `Symbol.toStringTag` is on the super-`[[Prototype]]` of Float32Array, not the `[[Prototype]]` (#3)
  * [Tests] up to `node` `v5.9`, `v4.4`
  * [Tests] use pretest/posttest for linting/security
  * [Dev Deps] update `tape`, `jscs`, `nsp`, `eslint`, `@ljharb/eslint-config`, `semver`, `is-callable`

1.0.3 / 2015-10-13
=================
  * [Deps] Add missing `foreach` dependency (#1)

1.0.2 / 2015-10-05
=================
  * [Deps] Remove unneeded "isarray" dependency
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`

1.0.1 / 2015-10-02
=================
  * Rerelease: avoid instanceof and the constructor property; work cross-realm; work with Symbol.toStringTag.

1.0.0 / 2015-05-06
=================
  * Initial release.
