1.2.3 / 2019-12-12
=================
  * [Refactor] use split-up `es-abstract` (65% bundle size decrease)
  * [Deps] update `es-abstract`
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `safe-publish-latest`, `object-inspect`
  * [meta] ESnext -> ES2019
  * [meta] add `funding` field
  * [Tests] use shared travis-ci configs
  * [actions] add automatic rebasing / merge commit blocking

1.2.2 / 2019-10-10
=================
  * [Deps] update `es-abstract`, `define-properties`
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `covert`, `evalmd`, `object-inspect`, `safe-publish-latest`, `tape`
  * [meta] create FUNDING.yml
  * [Tests] use `npx aud` instead of `nsp` or `npm audit` with hoops
  * [Tests] up to `node` `v12.11`, `v11.15`, `v10.16`, `v9.11`, `v8.16`, `v6.17`, `v4.9`; use `nvm install-latest-npm`

1.2.1 / 2018-02-23
=================
  * [Fix] Temporarily hack main entry, so it's compatible with other resolvers (#3)
  * [Dev Deps] update `eslint`, `nsp`, `tape`
  * [Tests] up to `node` `v9.6`, `v6.13`

1.2.0 / 2018-01-18
=================
  * [New] add "auto" entry point
  * [Fix] Move the receiver length check higher
  * [Fix] spec adjustments
  * [Refactor] adjust shouldFlatten logic
  * [Dev Deps] update `eslint`
  * [Tests] up to `node` `v9.4`

1.1.1 / 2017-11-29
=================
  * [Fix] avoid an extra hole in the array (https://github.com/es-shims/Array.prototype.flatMap/issues/1)
  * [Deps] update `es-abstract`
  * [Dev Deps] update `eslint`, `nsp`
  * [Tests] up to `node` `v9.2`, `v8.9`, `v6.12`; pin included builds to LTS.

1.1.0 / 2017-10-03
=================
  * [New] add explicit setting of “length” on target array
  * [Fix] `FlattenIntoArray`: add assertion that `thisArg` and `mapperFunction` are both passed together
  * [Tests] make coverage required

1.0.1 / 2017-10-02
=================
  * Add readme

1.0.0 / 2017-10-01
=================
  * Initial release
