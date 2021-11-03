# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

## [3.8.0] - 2019-02-05

### Added

- Add option to avoid adding a match-all rule. See PR [#73](https://github.com/dividab/tsconfig-paths/pull/73) and issue [72](https://github.com/dividab/tsconfig-paths/issues/72). Thanks to [@Swatinem](https://github.com/Swatinem) for this addition!

## [3.7.0] - 2018-11-11

### Added

- Allow cleanup of register(). See PR [#64](https://github.com/dividab/tsconfig-paths/pull/64) and issue [63](https://github.com/dividab/tsconfig-paths/issues/63). Thanks to [@TylorS](https://github.com/TylorS) for this addition!

## [3.6.0] - 2018-09-10

### Added

- Prefer Node's core modules over file modules. See PR [#60](https://github.com/dividab/tsconfig-paths/pull/60) and issue [56](https://github.com/dividab/tsconfig-paths/issues/56). Thanks to @ljani for this addition!

## [3.5.0] - 2018-07-28

### Added

- Add support for trailing commas in tsconfig.json (use JSON5 to parse). See issue [#48](https://github.com/dividab/tsconfig-paths/issues/48), and PR [#58](https://github.com/dividab/tsconfig-paths/pull/58). Thanks to [@jshado1](https://github.com/jshado1) for this addition!

## [3.4.2] - 2018-06-30

### Fixed

- Do not resolve directories, only files, sse issue [#51](https://github.com/dividab/tsconfig-paths/issues/51).

## [3.4.1] - 2018-06-24

### Fixed

- Ignore field name mappings in package.json files that are not paths of existing files [#46](https://github.com/dividab/tsconfig-paths/pull/45). Thanks to [@christoffer](https://github.com/christoffer) for this fix!

## [3.4.0] - 2018-06-12

### Added

- Add support for providing a list of field names to try instead of just using "main", [#45](https://github.com/dividab/tsconfig-paths/pull/45). Thanks to [@christoffer-dropbox](https://github.com/christoffer-dropbox) for this addition!

## [3.3.2] - 2018-05-07

### Fixed

- Adding json file extention to extends property, [#40](https://github.com/dividab/tsconfig-paths/pull/40). Thanks to [@cwhite-connectfirst](https://github.com/cwhite-connectfirst) for this fixing this!

## [3.3.1] - 2018-04-17

### Fixed

- Fix project undefined error when calling register, [#37](https://github.com/dividab/tsconfig-paths/issues/37). Thanks to [@natedanner](https://github.com/natedanner) for this fixing this!

## [3.3.0] - 2018-04-14

### Added

- Add possibility to indicate explicitly tsconfig location, [#35](https://github.com/dividab/tsconfig-paths/issues/35). Thanks to [@procopenco](https://github.com/procopenco) for this adding this!

## [3.2.0] - 2018-03-31

### Added

- Added support for passing a filename as cwd, see issue [#31](https://github.com/dividab/tsconfig-paths/issues/31) and PR [#32](https://github.com/dividab/tsconfig-paths/pull/32). Thanks to [@amodm](https://github.com/amodm) for this adding this!

## [3.1.3] - 2018-03-14

### Fixed

- Fix async recursion, see [#30](https://github.com/dividab/tsconfig-paths/pull/30). Thanks to [@Nayni](https://github.com/Nayni) for this fix!

## [3.1.2] - 2018-03-13

### Fixed

- Fix a forgotten return when doneCallback is invoked, see [#29](https://github.com/dividab/tsconfig-paths/pull/29). Thanks to [@Nayni](https://github.com/Nayni) for this fix!

## [3.1.1] - 2018-01-13

### Fixed

- Fix read json async when it does not exist

## [3.1.0] - 2018-01-13

### Added

- Implement default async json reader function.

## [3.0.0] - 2018-01-13

### Changed

- Remove parameter `absoluteSourceFileName` from the `MatchPath` and `matchFromAbsolutePaths` functions. It was not used internally.
- `matchFromAbsolutePaths` now accepts a pre-sorted array of `MappingEntry`s instead of a dictionary. This was done so the sorting could be done once which should give better performance.

### Added

- `createMatchPathAsync`, creates an async version of the `MatchPath` function. Can be used for example by webpack plugins.
- `matchFromAbsolutePathsAsync`, async version of `matchFromAbsolutePaths`.

## [2.7.3]

### Fixed

- Only resolve path if tsconfig present [#25](https://github.com/dividab/tsconfig-paths/pull/25). Thanks to @nicoschoenmaker for the PR.

## [2.7.2]

### Fixed

- Return absolute path to tsconfig.json.

## [2.7.1]

### Fixed

- Remove left over console.log.

## [2.7.0]

### Added

- Support `baseUrl` to exist in base tsconfig.json when using `extends`, see [#23](https://github.com/dividab/tsconfig-paths/issues/23).

## [2.6.0]

### Added

- Add `baseUrl` and `configFileAbsolutePath` to the result of `loadConfig`.

## [2.5.0]

### Added

- New function in Programmatic API `loadConfig`.

## [2.4.3]

### Fixed

- Export MatchPth typing.

## [2.4.2]

### Fixed

- Add missing types field in package.json.

## [2.4.1]

### Fixed

- Include declaration files. Fixes [#22](https://github.com/dividab/tsconfig-paths/issues/22).

## [2.4.0]

### Changed

- Removed dependency for package `tsconfig`.

### Fixed

- Support for config inheritance with `extends`. Fixes [#17](https://github.com/dividab/tsconfig-paths/issues/17).

## [2.2.0]

### Fixed

- Fixed issue [#7](https://github.com/dividab/tsconfig-paths/issues/7).

## [2.1.2]

### Fixed

- Fixed issue [#6](https://github.com/dividab/tsconfig-paths/issues/6).

## [2.1.1]

### Fixed

- Fixed issue [#4](https://github.com/dividab/tsconfig-paths/issues/4)

## [2.1.0]

### Fixed

- Fixed issue [#3](https://github.com/dividab/tsconfig-paths/issues/3)

## [2.0.0]

### Added

- We now look at `process.env.TS_NODE_PROJECT`
- Functionality to bootstrap tsconfig-paths. Documentation in [README](https://github.com/dividab/tsconfig-paths/blob/master/README.md)

### Changed

- Changed signature for `createMatchPath`. Now only takes absoluteUrl and paths.

## [1.1.0]

### Added

- More explanation to readme.
- Match all extensions in require.extensions.
- Match longest pattern prefix first as typesript does.
- Match file in main field of package.json.
- Check for index files explicitly.

## [1.0.0] - 2016-12-30

- First stable release.

## [0.4.0] - 2016-12-30

### Changed

- Renamed project to `tsocnfig-paths`.

## [0.3.0] - 2016-12-30

### Added

- API documentation.
- `createMatchPath` function.
- `matchFromAbsolutePaths` function.

### Removed

- `findPath` function.

## [0.2.1] - 2016-12-29

### Fixed

- `tsconfig-paths/register` was not available.

## [0.2.0] - 2016-12-29

### Fixed

- Paths for files in sub-dirs.

### Added

- Programmatic use.

## [0.1.2] - 2016-12-28

### Fixed

- Fixed wrong name of the package in README.
- Add missing files on publish.

## [0.1.1] - 2016-12-28

### Added

- Loading of tsconfig.
- Example.
- Publish scripts.

## [0.1.0] - 2016-12-28

- Initial version.

[unreleased]: https://github.com/dividab/tsconfig-paths/compare/3.8.0...master
[3.8.0]: https://github.com/dividab/tsconfig-paths/compare/3.7.0...3.8.0
[3.7.0]: https://github.com/dividab/tsconfig-paths/compare/3.6.0...3.7.0
[3.6.0]: https://github.com/dividab/tsconfig-paths/compare/3.5.0...3.6.0
[3.5.0]: https://github.com/dividab/tsconfig-paths/compare/3.4.2...3.5.0
[3.4.2]: https://github.com/dividab/tsconfig-paths/compare/3.4.1...3.4.2
[3.4.1]: https://github.com/dividab/tsconfig-paths/compare/3.4.0...3.4.1
[3.4.0]: https://github.com/dividab/tsconfig-paths/compare/3.3.2...3.4.0
[3.3.2]: https://github.com/dividab/tsconfig-paths/compare/3.3.1...3.3.2
[3.3.1]: https://github.com/dividab/tsconfig-paths/compare/3.3.0...3.3.1
[3.3.0]: https://github.com/dividab/tsconfig-paths/compare/3.2.0...3.3.0
[3.2.0]: https://github.com/dividab/tsconfig-paths/compare/3.1.3...3.2.0
[3.1.3]: https://github.com/dividab/tsconfig-paths/compare/3.1.2...3.1.3
[3.1.2]: https://github.com/dividab/tsconfig-paths/compare/3.1.1...3.1.2
[3.1.1]: https://github.com/dividab/tsconfig-paths/compare/3.1.0...3.1.1
[3.1.0]: https://github.com/dividab/tsconfig-paths/compare/3.0.0...3.1.0
[3.0.0]: https://github.com/dividab/tsconfig-paths/compare/2.7.3...3.0.0
[2.7.3]: https://github.com/dividab/tsconfig-paths/compare/2.7.2...2.7.3
[2.7.2]: https://github.com/dividab/tsconfig-paths/compare/2.7.1...2.7.2
[2.7.1]: https://github.com/dividab/tsconfig-paths/compare/2.7.0...2.7.1
[2.7.0]: https://github.com/dividab/tsconfig-paths/compare/2.6.0...2.7.0
[2.6.0]: https://github.com/dividab/tsconfig-paths/compare/2.5.0...2.6.0
[2.5.0]: https://github.com/dividab/tsconfig-paths/compare/2.4.3...2.5.0
[2.4.3]: https://github.com/dividab/tsconfig-paths/compare/2.4.2...2.4.3
[2.4.2]: https://github.com/dividab/tsconfig-paths/compare/2.4.1...2.4.2
[2.4.1]: https://github.com/dividab/tsconfig-paths/compare/2.4.0...2.4.1
[2.4.0]: https://github.com/dividab/tsconfig-paths/compare/2.2.0...2.4.0
[2.2.0]: https://github.com/dividab/tsconfig-paths/compare/2.1.2...2.2.0
[2.1.2]: https://github.com/dividab/tsconfig-paths/compare/2.1.1...2.1.2
[2.1.1]: https://github.com/dividab/tsconfig-paths/compare/2.1.0...2.1.1
