# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- Example:

## [9.99.999] - 9090-09-09

VS Code v99.99.999

### Changed
### Added
### Deprecated
### Removed
### Fixed
### Security

-->

## [Unreleased](https://github.com/coder/code-server/releases)

Code v0.00.0

### Changed

- Add here

## [4.1.0](https://github.com/coder/code-server/releases/tag/v4.1.0) - 2022-03-03

Code v1.63.0

### Changed
### Fixed

## [4.0.2](https://github.com/coder/code-server/releases/tag/v4.0.2) - 2022-01-27

Code v1.63.0

### Fixed

- Unset the `BROWSER` environment variable. This fixes applications that hard
  exit when trying to spawn the helper script `BROWSER` points to because the
  file is missing. While we do include the script now we are leaving the
  variable omitted because the script does not work yet.

## [4.0.1](https://github.com/coder/code-server/releases/tag/v4.0.1) - 2022-01-04

Code v1.63.0

code-server has been rebased on upstream's newly open-sourced server
implementation (#4414).

### Changed

- Web socket compression has been made the default (when supported). This means
  the `--enable` flag will no longer take `permessage-deflate` as an option.
- The static endpoint can no longer reach outside code-server. However the
  vscode-remote-resource endpoint still can.
- OpenVSX has been made the default marketplace.
- The last opened folder/workspace is no longer stored separately in the
  settings file (we rely on the already-existing query object instead).
- The marketplace override environment variables `SERVICE_URL` and `ITEM_URL`
  have been replaced with a single `EXTENSIONS_GALLERY` variable that
  corresponds to `extensionsGallery` in Code's `product.json`.

### Added

- `VSCODE_PROXY_URI` env var for use in the terminal and extensions.

### Removed

- Extra extension directories have been removed. The `--extra-extensions-dir`
  and `--extra-builtin-extensions-dir` flags will no longer be accepted.
- The `--install-source` flag has been removed.

### Deprecated

- `--link` is now deprecated (#4562).

### Security

- We fixed a XSS vulnerability by escaping HTML from messages in the error page (#4430).

## [3.12.0](https://github.com/coder/code-server/releases/tag/v3.12.0) - 2021-09-15

Code v1.60.0

### Changed

- Upgrade Code to 1.60.0.

### Fixed

- Fix logout when using a base path (#3608).

## [3.11.1](https://github.com/coder/code-server/releases/tag/v3.11.1) - 2021-08-06

Undocumented (see releases page).

## [3.11.0](https://github.com/coder/code-server/releases/tag/v3.11.0) - 2021-06-14

Undocumented (see releases page).

## [3.10.2](https://github.com/coder/code-server/releases/tag/v3.10.2) - 2021-05-21

Code v1.56.1

### Added

- Support `extraInitContainers` in helm chart values (#3393).

### Changed

- Change `extraContainers` to support templating in helm chart (#3393).

### Fixed

- Fix "Open Folder" on welcome page (#3437).

## [3.10.1](https://github.com/coder/code-server/releases/tag/v3.10.1) - 2021-05-17

Code v1.56.1

### Fixed

- Check the logged user instead of $USER (#3330).
- Fix broken node_modules.asar symlink in npm package (#3355).
- Update cloud agent to fix version issue (#3342).

### Changed

- Use xdgBasedir.runtime instead of tmp (#3304).

## [3.10.0](https://github.com/coder/code-server/releases/tag/v3.10.0) - 2021-05-10

Code v1.56.0

### Changed

- Update to Code 1.56.0 (#3269).
- Minor connections refactor (#3178). Improves connection stability.
- Use ptyHostService (#3308). This brings us closer to upstream Code.

### Added

- Add flag for toggling permessage-deflate (#3286). The default is off so
  compression will no longer be used by default. Use the --enable flag to
  toggle it back on.

### Fixed

- Make rate limiter not count against successful logins (#3141).
- Refactor logout (#3277). This fixes logging out in some scenarios.
- Make sure directories exist (#3309). This fixes some errors on startup.

### Security

- Update dependencies with CVEs (#3223).

## Previous versions

This was added with `3.10.0`, which means any previous versions are not
documented in the changelog.

To see those, please visit the [Releases page](https://github.com/coder/code-server/releases).
