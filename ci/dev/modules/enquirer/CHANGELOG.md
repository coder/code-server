# Release history

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

<details>
  <summary><strong>Guiding Principles</strong></summary>

- Changelogs are for humans, not machines.
- There should be an entry for every single version.
- The same types of changes should be grouped.
- Versions and sections should be linkable.
- The latest version comes first.
- The release date of each versions is displayed.
- Mention whether you follow Semantic Versioning.

</details>

<details>
  <summary><strong>Types of changes</strong></summary>

Changelog entries are classified using the following labels _(from [keep-a-changelog](http://keepachangelog.com/)_):

- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Removed` for now removed features.
- `Fixed` for any bug fixes.
- `Security` in case of vulnerabilities.

</details>

## 2.3.6 - 2020-07-02

### Changed

- Upgraded [ansi-colors](https://github.com/doowb/ansi-colors) dependency to v4, thanks to [@trySound](https://github.com/TrySound), [#297](https://github.com/enquirer/enquirer/pull/297).

## 2.3.5 - 2020-04-07

### Fixed

- PR #259 fixed typing numbers in the autocomplete prompt, which fixes #112, #199, and #237
- PR #266 add the `template` property to the `SnippetPromptOptions` TypeScript interface

## 2.3.4 - 2020-01-13

### Added

- `MultiSelectPrompt` new example for `result` option.

### Fixed

- Updated typings to use `EventEmitter` class from `events` directly due to changes in `@types/node`.


## 2.3.3 - 2020-01-13

### Added

- `BooleanPrompt` new example for `header` option.

### Fixed

- using `await` in `keypress` and returning the `number` result in the `array` type fixes an issue with tests failing only on Travis
- `autocomplete` highlighting issue
- Typos in some documentation and example comments.
- Syntax errors in example code on the README.md.

## 2.3.2 - 2019-09-17

### Added

- `AuthPrompt` type for creating authentication based prompts.
- `BasicAuth` prompt as an example of creating an authentication prompt using basic username/password authentication
- Examples for different authentication prompts.
- `QuizPrompt`

### Fixed

- More examples were updated to fix any known bugs.
- Couple of fixes to the editable and autocomplete prompts.
- Documentation updates to highlight options available to some prompts.

## 2.3.1 - 2019-07-12

### Fixed

- Several examples were updated to align with latest code changes and to fix small bugs found in the implementation of the example.
- Some bugs found from updating examples were fixed.
- Updates to documentation to provide more information on how to use prompts and the options available.

## 2.1.0 - 2018-11-29

### Fixed

- Several improvements were made for handling custom `format`, `result` and `initial` functions defined on the options. 

## 2.0.7 - 2018-11-14

### Fixed

- `validate` function now properly accepts `false` as a return value, thanks to [@g-plane](https://github.com/g-plane).

### Added

- Adds support for <kbd>ctrl</kbd>+<kbd>n</kbd> to add choices
- Adds support for `options.required` on all prompts. Uses the built-in `validate()` function, allowing this functionality to be overridden or customized.
- Adds support for `options.scroll` to disable scrolling in array prompts.
- Adds support for `options.onRun`, which is called when `prompt.run()` is called, after the readline instance is created.
- Adds support for `options.history` on the `Input` and `Text` prompts. 
- Adds support for `options.term` to set the terminal, thanks to [@tunnckoCore](https://github.com/tunnckoCore). At the moment this is only used in a couple of edge cases with the `Survey` and `Scale` prompts to check if the terminal is Hyper.
- `options.skip` may now be a Boolean, thanks to [@tunnckoCore](https://github.com/tunnckoCore)

## 2.0.0 - 2018-11-07

### Changed

Enquire 2.0 is a bottom-up complete re-write:

- Several prompts that were previously published as individual packages will be included in Enquirer itself. 
- Why? - As users, we didn't like having to add commonly-used prompts as plugins. Enquirer 2.0 will still support custom prompts as plugins, but many prompts will also be built-in.
- Enquirer will only have a single dependency, https://github.com/doowb/ansi-colors, which itself has no other dependencies). This will make Enquirer easier to maintain and faster for users.
- Methods for registering "questions" have been removed. While it was nice to be able to preregister questions that could be called upon later, this is something that is better left to implementors, as it's relatively trivial to do with custom code.
- `options.default` is now `options.initial`

### Added

- Many prompts that were previously separate packages are now bundled into Enquirer itself. 


[Unreleased]: https://github.com/enquirer/enquirer/compare/2.0.2...HEAD
[keep-a-changelog]: https://github.com/olivierlacan/keep-a-changelog
