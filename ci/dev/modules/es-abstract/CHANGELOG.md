1.18.0 / 2021-03-03
=================
  * [New] add `ES2020`, and a number of additional AOs: See the changelog entries for the prereleases for more information:
     - [next.3](./CHANGELOG.md#1180-next3--2021-03-01)
     - [next.2](./CHANGELOG.md#1180-next2--2021-01-17)
     - [next.1](./CHANGELOG.md#1180-next1--2020-09-30)
     - [next.0](./CHANGELOG.md#1180-next0--2020-08-14)
  * [Refactor] `ES5+`: `Abstract Relational Comparison`: increase coverage
  * [Tests] increase coverage
  * [Tests] do not run coverage on node 0.6

1.18.0-next.3 / 2021-03-01
=================
  * [New] `ES2015`: add `StringGetIndexProperty`
  * [New] `ES2015+`: add `RegExpCreate`, `SplitMatch`, `StringCreate`
  * [New] `ES2016-ES2019`: add `UTF16Decode`
  * [New] `ES2020+`: add `NumberToBigInt`
  * [New] `ES2020+: add `BigInt::`/`Number::` methods:
  * [Fix] `ES5`: `ToNumber`: properly refuse to parse ES6+ forms
  * [Fix] `ES2015+`: `Invoke`: optional argumentsList must be a List of arguments, not a list of arguments
  * [Fix] `ES2016+`: `UTF16Encoding`: properly return a string code point instead of a numeric code point
  * [Fix] `ES2020`: `NumberBitwiseOp`: assert that x and y are Numbers
  * [readme] remove travis/testling badge, fix repo URLs
  * [meta] `ES2015`: add missing `CreateArrayIterator` AO
  * [meta] `ES2015-ES2017`: add missing `DaylightSavingTA` AO
  * [meta] rerun `npm run spackle` to update URLs left after 11d8c8df11c0d15d094a6035afed662e22b440ef
  * [meta] update ecma URLs
  * [meta] unignore 2020 operations list
  * [meta] update operations scripts linting
  * [meta] refactor getOps script to fetch all years at once
  * [meta] refactor operations script to keep years in one place
  * [meta] fix ES2015 spec URL
  * [Deps] update `has-symbols`, `string.prototype.trimend`, `string.prototype.trimstart`, `get-intrinsic`, `is-callable`, `is-regex`
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `array.prototype.indexof`, `aud`, `es-value-fixtures`, `object.fromentries`, `tape`, `diff`
  * [operations] detect ES2020+ style `T::` numeric operations
  * [Tests] increase coverage
  * [Tests] `BigInt(1e17)` throws on node v10.4-v10.6
  * [Tests] improve coverage on `Number::` methods
  * [Tests] `tape` v5 `.equal` now uses strict equality, so no more need for `is()`
  * [Tests] improve BigInt:: and Number:: coverage
  * [Tests] actually run all the helpers tests
  * [Tests] ensure "expected missing" ops list is accurate
  * [Tests] abstract away per-operation skips
  * [Tests] skip BigInt:: tests on envs without BigInts
  * [Tests] use `es-value-fixtures`
  * [actions] update workflows

1.18.0-next.2 / 2021-01-17
=================
  * [New] `helpers`: add `isByteValue`, `isCodePoint`, `some`
  * [Fix] `ES2018+`: fix `GetSubstitution` with named captures
  * [Fix] `ES2020`: `GetIterator`: add omitted `hint` parameter
  * [Fix] `ES2018`/`ES2019`: `SetFunctionLength`: Infinities should throw
  * [Fix] `ES2020`: `ToIndex` uses `SameValue` instead of `SameValueZero`
  * [Fix] `ES2020`: `CopyDataProperties` uses `CreateDataPropertyOrThrow` instead of `CreateDataProperty`
  * [Refactor] use extracted `call-bind` instead of local helpers
  * [Refactor] use extracted `get-intrinsic` package
  * [Deps] update `call-bind`, `get-intrinsic`, `is-callable`, `is-negative-zero`, `is-regex`, `object-inspect`, `object.assign`, `string.prototype.trimend`, `string.prototype.trimstart`
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `array.prototype.indexof`, `aud`, `diff`, `functions-have-names`, `has-bigints`, `has-strict-mode`, `object-is`, `object.fromentries`, `tape`
  * [actions] switch Automatic Rebase workflow to `pull_request_target` event
  * [actions] add "Allow Edits" workflow
  * [meta] pin cheerio to v1.0.0-rc.3, to fix getOps
  * [meta] make all URLs consistent, and point to spec artifacts
  * [meta] refactor `deltas` script; update eslint on operations scripts
  * [meta] do not publish .github dir (#123)
  * [Tests] add `v.notNonNegativeIntegers`, `v.nonConstructorFunctions`
  * [Tests] migrate tests to Github Actions
  * [Tests] run coverage on all tests
  * [Tests] add `npm run test:ses`

1.18.0-next.1 / 2020-09-30
=================
  * [Fix] `ES2020`: `ToInteger`: `-0` should always be normalized to `+0` (#116)
  * [patch] `GetIntrinsic`: Adapt to override-mistake-fix pattern (#115)
  * [Fix] `callBind`: ensure compatibility with SES
  * [Deps] update `is-callable`, `object.assign`
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`
  * [eslint] fix warning
  * [Tests] temporarily allow SES tests to fail (#115)
  * [Tests] ses-compat - initialize module after ses lockdown (#113)
  * [Tests] [Refactor] use defineProperty helper rather than assignment
  * [Tests] [Refactor] clean up defineProperty test helper

1.18.0-next.0 / 2020-08-14
=================
  * [New] add `ES2020`
  * [New] `GetIntrinsic`: add `%AggregateError%`, `%FinalizationRegistry%`, and `%WeakRef%`
  * [New] `ES5`+: add `abs`, `floor`; use `modulo` consistently
  * [New] `GetIntrinsic`: Cache accessed intrinsics (#98)
  * [New] `GetIntrinsic`: Add ES201x function intrinsics (#97)
  * [New] `ES2015`+: add `QuoteJSONString`, `OrdinaryCreateFromConstructor`
  * [New] `ES2017`+: add `StringGetOwnProperty`
  * [New] `ES2016`+: add `UTF16Encoding`
  * [New] `ES2018`+: add `SetFunctionLength`, `UnicodeEscape`
  * [New] add `isLeadingSurrogate`/`isTrailingSurrogate` helpers
  * [Fix] `ES5`+: `ToPropertyDescriptor`: use intrinsic TypeError
  * [Fix] `ES2018+`: `CopyDataProperties`/`NumberToString`: use intrinsic TypeError
  * [Deps] update `is-regex`, `object-inspect`
  * [Dev Deps] update `eslint`

1.17.7 / 2020-09-30
=================
  * [Fix] `ES2020`: `ToInteger`: `-0` should always be normalized to `+0` (#116)
  * [patch] `GetIntrinsic`: Adapt to override-mistake-fix pattern (#115)
  * [Fix] `callBind`: ensure compatibility with SES
  * [Deps] update `is-callable`, `is-regex`, `object-inspect`, `object.assign`
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`

1.17.6 / 2020-06-13
=================
  * [Fix] `helpers/getSymbolDescription`: use the global Symbol registry when available (#92)
  * [Fix] `ES2015+`: `IsConstructor`: when `Reflect.construct` is available, be spec-accurate (#93)
  * [Fix] `ES2015+`: `Set`: Always return boolean value (#101)
  * [Fix] `ES2015+`: `Set`: ensure exceptions are thrown in IE 9 when requested
  * [Fix] Use `Reflect.apply(…)` if available (#99)
  * [Fix] `helpers/floor`: module-cache `Math.floor`
  * [Fix] `helpers/getSymbolDescription`: Prefer bound `description` getter when present
  * [Fix] `2016`: Use `getIteratorMethod` in `IterableToArrayLike` (#94)
  * [Fix] `helpers/OwnPropertyKeys`: Use `Reflect.ownKeys(…)` if available (#91)
  * [Fix] `2018+`: Fix `CopyDataProperties` depending on `this` (#95)
  * [meta] mark spackled files as autogenerated
  * [meta] `Type`: fix spec URL
  * [meta] `ES2015`: complete ops list
  * [Deps] update `is‑callable`, `is‑regex`
  * [Deps] switch from `string.prototype.trimleft`/`string.prototype.trimright` to `string.prototype.trimstart`/`string.prototype.trimend`
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `in-publish`, `object-is`, `tape`; add `aud`
  * [eslint] `helpers/isPropertyDescriptor`: fix indentation
  * [Tests] `helpers/getSymbolDescription`: add test cases; some envs have `Symbol.for` but can not infer a name (#92)
  * [Tests] try out CodeQL analysis
  * [Tests] reformat expected missing ops
  * [Tests] Run tests with `undefined` this (#96)

1.17.5 / 2020-03-22
=================
  * [Fix] `CreateDataProperty`: update an existing property
  * [Fix] run missing spackle from cd7504701879ddea0f5981e99cbcf93bfea9171d
  * [Dev Deps] update `make-arrow-function`, `tape`, `@ljharb/eslint-config`

1.17.4 / 2020-01-21
=================
  * [Fix] `2015+`: add code to handle IE 8’s problems
  * [Tests] fix tests for IE 8

1.17.3 / 2020-01-19
=================
  * [Fix] `ObjectCreate` `2015+`: Fall back to `__proto__` and normal `new` in older browsers
  * [Fix] `GetIntrinsic`: ensure the `allowMissing` property actually works on dotted intrinsics

1.17.2 / 2020-01-14
=================
  * [Fix] `helpers/OwnPropertyKeys`: include non-enumerables too

1.17.1 / 2020-01-14
=================
  * [Refactor] add `OwnPropertyKeys` helper, use it in `CopyDataProperties`
  * [Refactor] `IteratorClose`: remove useless assignment
  * [Dev Deps] update `eslint`, `tape`, `diff`

1.17.0 / 2019-12-20
=================
  * [New] Split up each operation into its own file (prereleased)
  * [Fix] `GetIntrinsic`: IE 8 has a broken `Object.getOwnPropertyDescriptor`
  * [Fix] `object.assign` is a runtime dep (prereleased)
  * [Refactor] `GetIntrinsic`: remove the internal property salts, since % already handles that
  * [Refactor] `GetIntrinsic`: further simplification
  * [Deps] update `is-callable`, `string.prototype.trimleft`, `string.prototype.trimright`, `is-regex`
  * [Dev Deps] update `@ljharb/eslint-config`, `object-is`, `object.fromentries`, `tape`
  * [Tests] add `.eslintignore`
  * [meta] remove unused Makefile and associated utils
  * [meta] only run spackle script in publish (#78) (prereleased)

1.17.0-next.1 / 2019-12-11
=================
  * [Fix] `object.assign` is a runtime dep
  * [meta] only run spackle script in publish (#78)

1.17.0-next.0 / 2019-12-11
=================
  * [New] Split up each operation into its own file

1.16.3 / 2019-12-04
=================
  * [Fix] `GetIntrinsic`: when given a path to a getter, return the actual getter
  * [Dev Deps] update `eslint`

1.16.2 / 2019-11-24
=================
  * [Fix] IE 6-7 lack JSON
  * [Fix] IE 6-8 strings can’t use array slice, they need string slice
  * [Dev Deps] update `eslint`

1.16.1 / 2019-11-24
=================
  * [Fix] `GetIntrinsics`: turns out IE 8 throws when `Object.getOwnPropertyDescriptor(arguments);`, and does not throw on `callee` anyways
  * [Deps] update `es-to-primitive`, `has-symbols`, `object-inspect`
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `safe-publish-latest`
  * [meta] re-include year files inside `operations`
  * [meta] add `funding` field
  * [actions] add Automatic Rebase github action
  * [Tests] use shared travis-ci config
  * [Tests] disable `check-coverage`, and let codecov do it

1.16.0 / 2019-10-18
=================
  * [New] `ES2015+`: add `SetFunctionName`
  * [New] `ES2015+`: add `GetPrototypeFromConstructor`, with caveats
  * [New] `ES2015+`: add `CreateListFromArrayLike`
  * [New] `ES2016+`: add `OrdinarySetPrototypeOf`
  * [New] `ES2016+`: add `OrdinaryGetPrototypeOf`
  * [New] add `getSymbolDescription` and `getInferredName` helpers
  * [Fix] `GetIterator`: add fallback for pre-Symbol environments, tests
  * [Dev Deps] update `object.fromentries`
  * [Tests] add `node` `v12.2`

1.15.0 / 2019-10-02
=================
  * [New] `ES2018`+: add `DateString`, `TimeString`
  * [New] `ES2015`+: add `ToDateString`
  * [New] `ES5`+: add `msFromTime`, `SecFromTime`, `MinFromTime`, `HourFromTime`, `TimeWithinDay`, `Day`, `DayFromYear`, `TimeFromYear`, `YearFromTime`, `WeekDay`, `DaysInYear`, `InLeapYear`, `DayWithinYear`, `MonthFromTime`, `DateFromTime`, `MakeDay`, `MakeDate`, `MakeTime`, `TimeClip`, `modulo`
  * [New] add `regexTester` helper
  * [New] add `callBound` helper
  * [New] add ES2020’s intrinsic dot notation
  * [New] add `isPrefixOf` helper
  * [New] add `maxSafeInteger` helper
  * [Deps] update `string.prototype.trimleft`, `string.prototype.trimright`
  * [Dev Deps] update `eslint`
  * [Tests] on `node` `v12.11`
  * [meta] npmignore operations scripts; add "deltas"

1.14.2 / 2019-09-08
=================
  * [Fix] `ES2016`: `IterableToArrayLike`: add proper fallback for strings, pre-Symbols
  * [Tests] on `node` `v12.10`

1.14.1 / 2019-09-03
=================
  * [meta] republish with some extra files removed

1.14.0 / 2019-09-02
=================
  * [New] add ES2019
  * [New] `ES2017+`: add `IterableToList`
  * [New] `ES2016`: add `IterableToArrayLike`
  * [New] `ES2015+`: add `ArrayCreate`, `ArraySetLength`, `OrdinaryDefineOwnProperty`, `OrdinaryGetOwnProperty`, `OrdinaryHasProperty`, `CreateHTML`, `GetOwnPropertyKeys`, `InstanceofOperator`, `SymbolDescriptiveString`, `GetSubstitution`, `ValidateAndApplyPropertyDescriptor`, `IsPromise`, `OrdinaryHasInstance`, `TestIntegrityLevel`, `SetIntegrityLevel`
  * [New] add `callBind` helper, and use it
  * [New] add helpers: `isPropertyDescriptor`, `every`
  * [New] ES5+: add `Abstract Relational Comparison`
  * [New] ES5+: add `Abstract Equality Comparison`, `Strict Equality Comparison`
  * [Fix] `ES2015+`: `GetIterator`: only require native Symbols when `method` is omitted
  * [Fix] `ES2015`: `Call`: error message now properly displays Symbols using `object-inspect`
  * [Fix] `ES2015+`: `ValidateAndApplyPropertyDescriptor`: use ES2017 logic to bypass spec bugs
  * [Fix] `ES2015+`: `CreateDataProperty`, `DefinePropertyOrThrow`, `ValidateAndApplyPropertyDescriptor`: add fallbacks for ES3
  * [Fix] `ES2015+`: `FromPropertyDescriptor`: no longer requires a fully complete Property Descriptor
  * [Fix] `ES5`: `IsPropertyDescriptor`: call into `IsDataDescriptor` and `IsAccessorDescriptor`
  * [Refactor] use `has-symbols` for Symbol detection
  * [Fix] `helpers/assertRecord`: remove `console.log`
  * [Deps] update `object-keys`
  * [readme] add security note
  * [meta] change http URLs to https
  * [meta] linter cleanup
  * [meta] fix getOps script
  * [meta] add FUNDING.yml
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `safe-publish-latest`, `semver`, `replace`, `cheerio`, `tape`
  * [Tests] up to `node` `v12.9`, `v11.15`, `v10.16`, `v8.16`, `v6.17`
  * [Tests] temporarily allow node 0.6 to fail; segfaulting in travis
  * [Tests] use the values helper more in es5 tests
  * [Tests] fix linting to apply to all files
  * [Tests] run `npx aud` only on prod deps
  * [Tests] add v.descriptors helpers
  * [Tests] use `npx aud` instead of `npm audit` with hoops
  * [Tests] use `eclint` instead of `editorconfig-tools`
  * [Tests] some intrinsic cleanup
  * [Tests] migrate es5 tests to use values helper
  * [Tests] add some missing ES2015 ops

1.13.0 / 2019-01-02
=================
  * [New] add ES2018
  * [New] add ES2015/ES2016: EnumerableOwnNames; ES2017: EnumerableOwnProperties
  * [New] `ES2015+`: add `thisBooleanValue`, `thisNumberValue`, `thisStringValue`, `thisTimeValue`
  * [New] `ES2015+`: add `DefinePropertyOrThrow`, `DeletePropertyOrThrow`, `CreateMethodProperty`
  * [New] add `assertRecord` helper
  * [Deps] update `is-callable`, `has`, `object-keys`, `es-to-primitive`
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `tape`, `semver`, `safe-publish-latest`, `replace`
  * [Tests] use `npm audit` instead of `nsp`
  * [Tests] remove `jscs`
  * [Tests] up to `node` `v11.6`, `v10.15`, `v8.15`, `v6.16`
  * [Tests] move descriptor factories to `values` helper
  * [Tests] add `getOps` to programmatically fetch abstract operation names

1.12.0 / 2018-05-31
=================
  * [New] add `GetIntrinsic` entry point
  * [New] `ES2015`+: add `ObjectCreate`
  * [Robustness]: `ES2015+`: ensure `Math.{abs,floor}` and `Function.call` are cached

1.11.0 / 2018-03-21
=================
  * [New] `ES2015+`: add iterator abstract ops
  * [Dev Deps] update `eslint`, `nsp`, `object.assign`, `semver`, `tape`
  * [Tests] up to `node` `v9.8`, `v8.10`, `v6.13`

1.10.0 / 2017-11-24
=================
  * [New] ES2015+: `AdvanceStringIndex`
  * [Dev Deps] update `eslint`, `nsp`
  * [Tests] require node 0.6 to pass again
  * [Tests] up to `node` `v9.2`, `v8.9`, `v6.12`; use `nvm install-latest-npm`; pin included builds to LTS

1.9.0 / 2017-09-30
=================
  * [New] `es2015+`: add `ArraySpeciesCreate`
  * [New] ES2015+: add `CreateDataProperty` and `CreateDataPropertyOrThrow`
  * [Tests] consolidate duplicated tests
  * [Tests] increase coverage
  * [Dev Deps] update `nsp`, `eslint`

1.8.2 / 2017-09-03
=================
  * [Fix] `es2015`+: `ToNumber`: provide the proper hint for Date objects (#27)
  * [Dev Deps] update `eslint`

1.8.1 / 2017-08-30
=================
  * [Fix] ES2015+: `ToPropertyKey`: should return a symbol for Symbols (#26)
  * [Deps] update `function-bind`
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`
  * [Docs] github broke markdown parsing

1.8.0 / 2017-08-04
=================
  * [New] add ES2017
  * [New] move es6+ to es2015+; leave es6/es7 as aliases
  * [New] ES5+: add `IsPropertyDescriptor`, `IsAccessorDescriptor`, `IsDataDescriptor`, `IsGenericDescriptor`, `FromPropertyDescriptor`, `ToPropertyDescriptor`
  * [New] ES2015+: add `CompletePropertyDescriptor`, `Set`, `HasOwnProperty`, `HasProperty`, `IsConcatSpreadable`, `Invoke`, `CreateIterResultObject`, `RegExpExec`
  * [Fix] es7/es2016: do not mutate ES6
  * [Fix] assign helper only supports one source
  * [Deps] update `is-regex`
  * [Dev Deps] update `nsp`, `eslint`, `@ljharb/eslint-config`
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `nsp`, `semver`, `tape`
  * [Tests] add tests for missing and excess operations
  * [Tests] add codecov for coverage
  * [Tests] up to `node` `v8.2`, `v7.10`, `v6.11`, `v4.8`; newer npm breaks on older node
  * [Tests] use same lists of value types across tests; ensure tests are the same when ops are the same
  * [Tests] ES2015: add ToNumber symbol tests
  * [Tests] switch to `nyc` for code coverage
  * [Tests] make IsRegExp tests consistent across editions

1.7.0 / 2017-01-22
=================
  * [New] ES6: Add `GetMethod` (#16)
  * [New] ES6: Add `GetV` (#16)
  * [New] ES6: Add `Get` (#17)
  * [Tests] up to `node` `v7.4`, `v6.9`, `v4.6`; improve test matrix
  * [Dev Deps] update `tape`, `nsp`, `eslint`, `@ljharb/eslint-config`, `safe-publish-latest`

1.6.1 / 2016-08-21
=================
  * [Fix] ES6: IsConstructor should return true for `class` constructors.

1.6.0 / 2016-08-20
=================
  * [New] ES5 / ES6: add `Type`
  * [New] ES6: `SpeciesConstructor`
  * [Dev Deps] update `jscs`, `nsp`, `eslint`, `@ljharb/eslint-config`, `semver`; add `safe-publish-latest`
  * [Tests] up to `node` `v6.4`, `v5.12`, `v4.5`

1.5.1 / 2016-05-30
=================
  * [Fix] `ES.IsRegExp`: actually look up `Symbol.match` on the argument
  * [Refactor] create `isNaN` helper
  * [Deps] update `is-callable`, `function-bind`
  * [Deps] update `es-to-primitive`, fix ES5 tests
  * [Dev Deps] update `jscs`, `eslint`, `@ljharb/eslint-config`, `tape`, `nsp`
  * [Tests] up to `node` `v6.2`, `v5.11`, `v4.4`
  * [Tests] use pretest/posttest for linting/security

1.5.0 / 2015-12-27
=================
  * [New] adds `Symbol.toPrimitive` support via `es-to-primitive`
  * [Deps] update `is-callable`, `es-to-primitive`
  * [Dev Deps] update `jscs`, `nsp`, `eslint`, `@ljharb/eslint-config`, `semver`, `tape`
  * [Tests] up to `node` `v5.3`

1.4.3 / 2015-11-04
=================
  * [Fix] `ES6.ToNumber`: should give `NaN` for explicitly signed hex strings (#4)
  * [Refactor] `ES6.ToNumber`: No need to double-trim
  * [Refactor] group tests better
  * [Tests] should still pass on `node` `v0.8`

1.4.2 / 2015-11-02
=================
  * [Fix] ensure `ES.ToNumber` trims whitespace, and does not trim non-whitespace (#3)

1.4.1 / 2015-10-31
=================
  * [Fix] ensure only 0-1 are valid binary and 0-7 are valid octal digits (#2)
  * [Dev Deps] update `tape`, `jscs`, `nsp`, `eslint`, `@ljharb/eslint-config`
  * [Tests] on `node` `v5.0`
  * [Tests] fix npm upgrades for older node versions
  * package.json: use object form of "authors", add "contributors"

1.4.0 / 2015-09-26
=================
  * [Deps] update `is-callable`
  * [Dev Deps] update `tape`, `jscs`, `eslint`, `@ljharb/eslint-config`
  * [Tests] on `node` `v4.2`
  * [New] Add `SameValueNonNumber` to ES7

1.3.2 / 2015-09-26
=================
  * [Fix] Fix `ES6.IsRegExp` to properly handle `Symbol.match`, per spec.
  * [Tests] up to `io.js` `v3.3`, `node` `v4.1`
  * [Dev Deps] update `tape`, `jscs`, `nsp`, `eslint`, `@ljharb/eslint-config`, `semver`

1.3.1 / 2015-08-15
=================
  * [Fix] Ensure that objects that `toString` to a binary or octal literal also convert properly

1.3.0 / 2015-08-15
=================
  * [New] ES6’s ToNumber now supports binary and octal literals.
  * [Dev Deps] update `jscs`, `eslint`, `@ljharb/eslint-config`, `tape`
  * [Docs] Switch from vb.teelaun.ch to versionbadg.es for the npm version badge SVG
  * [Tests] up to `io.js` `v3.0`

1.2.2 / 2015-07-28
=================
  * [Fix] Both `ES5.CheckObjectCoercible` and `ES6.RequireObjectCoercible` return the value if they don't throw.
  * [Tests] Test on latest `io.js` versions.
  * [Dev Deps] Update `eslint`, `jscs`, `tape`, `semver`, `covert`, `nsp`

1.2.1 / 2015-03-20
=================
  * Fix `isFinite` helper.

1.2.0 / 2015-03-19
=================
  * Use `es-to-primitive` for ToPrimitive methods.
  * Test on latest `io.js` versions; allow failures on all but 2 latest `node`/`io.js` versions.

1.1.2 / 2015-03-20
=================
  * Fix isFinite helper.

1.1.1 / 2015-03-19
=================
  * Fix isPrimitive check for functions
  * Update `eslint`, `editorconfig-tools`, `semver`, `nsp`

1.1.0 / 2015-02-17
=================
  * Add ES7 export (non-default).
  * All grade A-supported `node`/`iojs` versions now ship with an `npm` that understands `^`.
  * Test on `iojs-v1.2`.

1.0.1 / 2015-01-30
=================
  * Use `is-callable` instead of an internal function.
  * Update `tape`, `jscs`, `nsp`, `eslint`

1.0.0 / 2015-01-10
=================
  * v1.0.0
