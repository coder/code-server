# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- Example:

## [9.99.999] - 9090-09-09

Code v99.99.999

### Changed
### Added
### Deprecated
### Removed
### Fixed
### Security

-->

## [4.10.0](https://github.com/coder/code-server/releases/tag/v4.10.0) - TBD

Code v1.75.0

### Changed

- Updated to Code 1.75.0

## [4.9.1](https://github.com/coder/code-server/releases/tag/v4.9.1) - 2022-12-15

Code v1.73.1

### Changed

- Updated a couple steps in the build and release process to ensure we're using
  `npm` and `yarn` consistently depending on the step.

### Fixed

- Fixed an issue with code-server version not displaying in the Help > About window.
- Fixed terminal not loading on macOS clients.

## [4.9.0](https://github.com/coder/code-server/releases/tag/v4.9.0) - 2022-12-06

Code v1.73.1

### Changed

- Upgraded to Code 1.73.1

### Added

- `/security.txt` added as a route with info on our security policy information thanks to @ghuntley

### Fixed

- Installing on majaro images should now work thanks to @MrPeacockNLB for
  adding the `--noconfirm` flag in `install.sh`

### Known Issues

- `--cert` on Ubuntu 22.04: OpenSSL v3 is used which breaks `pem` meaning the
  `--cert` feature will not work. [Reference](https://github.com/adobe/fetch/pull/318#issuecomment-1306070259)

## [4.8.3](https://github.com/coder/code-server/releases/tag/v4.8.3) - 2022-11-07

Code v1.72.1

### Added

- install script now supports arch-like (i.e. manjaro, endeavourous, etc.)
  architectures

### Changed

- Updated text in the Getting Started page.

## [4.8.2](https://github.com/coder/code-server/releases/tag/v4.8.2) - 2022-11-02

Code v1.72.1

### Added

- New text in the Getting Started page with info about
  `coder/coder`. This is enabled by default but can be disabled by passing the CLI
  flag `--disable-getting-started-override` or setting
  `CS_DISABLE_GETTING_STARTED_OVERRIDE=1` or
  `CS_DISABLE_GETTING_STARTED_OVERRIDE=true`.

## [4.8.1](https://github.com/coder/code-server/releases/tag/v4.8.1) - 2022-10-28

Code v1.72.1

### Fixed

- Fixed CSP error introduced in 4.8.0 that caused issues with webviews and most
  extensions.

## [4.8.0](https://github.com/coder/code-server/releases/tag/v4.8.0) - 2022-10-24

Code v1.72.1

### Added

- Support for the Ports panel which leverages code-server's built-in proxy. It
  also uses `VSCODE_PROXY_URI` where `{{port}}` is replace when forwarding a port.
  Example: `VSCODE_PROXY_URI=https://{{port}}.kyle.dev` would forward an
  application running on localhost:3000 to https://3000.kyle.dev
- Support for `--disable-workspace-trust` CLI flag
- Support for `--goto` flag to open file @ line:column
- Added Ubuntu-based images for Docker releases. If you run into issues with
  `PATH` being overwritten in Docker please try the Ubuntu image as this is a
  problem in the Debian base image.

### Changed

- Updated Code to 1.72.1

### Fixed

- Enabled `BROWSER` environment variable
- Patched `asExternalUri` to work so now extensions run inside code-server can use it

## [4.7.1](https://github.com/coder/code-server/releases/tag/v4.7.1) - 2022-09-30

Code v1.71.2

### Changed

- Updated Code to 1.71.2

### Fixed

- Fixed install script not upgrading code-server when already installed on RPM-based machines
- Fixed install script failing to gain root permissions on FreeBSD

## [4.7.0](https://github.com/coder/code-server/releases/tag/v4.7.0) - 2022-09-09

Code v1.71.0

### Changed

- Updated Code to 1.71.0

### Removed

- Dropped heartbeat patch because it was implemented upstream

### Fixed

- Add flags --unsafe-perm --legacy-peer-deps in `npm-postinstsall.sh` which ensures installing with npm works correctly

## [4.6.1](https://github.com/coder/code-server/releases/tag/v4.6.1) - 2022-09-31

Code v1.70.2

### Changed

- Updated Code to 1.70.2
- Updated `argon2` to 0.29.0 which should fix issues on FreeBSD
- Updated docs to suggest using `npm` instead of `yarn`

### Removed

- Dropped database migration patch affected to 4.0.2 versions and earlier.

### Fixed

- Fixed preservation of `process.execArgv` which means you can pass `--prof` to profile code-server

## [4.6.0](https://github.com/coder/code-server/releases/tag/v4.6.0) - 2022-08-17

Code v1.70.1

### Changed

- Updated Code to 1.70.1.

### Added

- Added a heartbeat to sockets. This should prevent them from getting closed by
  reverse proxy timeouts when idle like NGINX's default 60-second timeout.

### Fixed

- Fixed logout option appearing even when authentication is disabled.

## [4.5.2](https://github.com/coder/code-server/releases/tag/v4.5.2) - 2022-08-15

Code v1.68.1

### Security

- Fixed the proxy route not performing authentication. For example if you were
  to run a development HTTP server using `python -m http.server 8000` then it
  would be accessible at `my.domain/proxy/8000/` without any authentication.

  If all of the following apply to you please update as soon as possible:

  - You run code-server with the built-in password authentication.
  - You run unprotected HTTP services on ports accessible by code-server.

### Changed

- Invoking `code-server` in the integrated terminal will now use the script that
  comes with upstream Code. This means flags like `--wait` will be
  automatically supported now. However the upstream script only has the ability
  to interact with the running code-server and cannot spawn new instances. If
  you need to spawn a new code-server from the integrated terminal please
  specify the full path to code-server's usual script (for example
  `/usr/bin/code-server`).

### Fixed

- Invoking `code-server` in the integrated terminal will now work instead of
  erroring about not finding Node.

## [4.5.1](https://github.com/coder/code-server/releases/tag/v4.5.1) - 2022-07-18

Code v1.68.1

### Changed

- We now use `release/v<0.0.0>` for the release branch name so it doesn't
  conflict with the tag name
- Added `.prettierignore` to ignore formatting files in `lib/vscode`

### Added

- Allow more comprehensive affinity config in Helm chart
- Added custom message in Homebrew PR to make sure code-server maintainers are
  tagged
- Allow setting `priorityClassName` via Helm chart
- Added troubleshooting docs to `CONTRIBUTING.md`

### Fixed

- Removed default memory limit which was set via `NODE_OPTIONS`
- Changed output in pipe to make it easier to debug code-server when doing live
  edits
- Fixed display-language patch to use correct path which broke in 4.5.0
- Fixed multiple code-server windows opening when using the code-server CLI in
  the Integrated Terminal
- Fixed Integrated Terminal not working when web base was not the root path

### Security

- Updated `glob-parent` version in dependencies

## [4.5.0](https://github.com/coder/code-server/releases/tag/v4.5.0) - 2022-06-29

Code v1.68.1

### Changed

- Updated codecov to use codecov uploader
- Moved integration tests to Jest
- Fixed docker release to only download .deb
- Upgraded to Code 1.68.1
- Install `nfpm` from GitHub
- Upgraded to TypeScript 4.6

### Added

- Added tests for `open`, `isWsl`, `handlePasswordValidation`
- Provided alternate image registry to dockerhub
- Allowed users to have scripts run on container with `ENTRYPOINTD` environment
  variable

### Fixed

- Fixed open CLI command to work on macOS

## [4.4.0](https://github.com/coder/code-server/releases/tag/v4.4.0) - 2022-05-06

Code v1.66.2

### Changed

- Refactored methods in `Heart` class and made `Heart.beat()` async to make
  testing easier.
- Upgraded to Code 1.66.2.

### Added

- Added back telemetry patch which was removed in the Code reachitecture.
- Added support to use `true` for `CS_DISABLE_FILE_DOWNLOADS` environment
  variable. This means you can disable file downloads by setting
  `CS_DISABLE_FILE_DOWNLOADS` to `true` or `1`.
- Added tests for `Heart` class.

### Fixed

- Fixed installation issue in AUR after LICENSE rename.
- Fixed issue with listening on IPv6 addresses.
- Fixed issue with Docker publish action not being able to find artifacts. Now
  it downloads the release assets from the release.

## [4.3.0](https://github.com/coder/code-server/releases/tag/v4.3.0) - 2022-04-14

Code v1.65.2

### Changed

- Excluded .deb files from release Docker image which drops the compressed and
  uncompressed size by 58% and 34%.
- Upgraded to Code 1.65.2.

### Added

- Added a new CLI flag called `--disable-file-downloads` which allows you to
  disable the "Download..." option that shows in the UI when right-clicking on a
  file. This can also set by running `CS_DISABLE_FILE_DOWNLOADS=1`.
- Aligned the dependencies for binary and npm release artifacts.

### Fixed

- Fixed the code-server version from not displaying in the Help > About dialog.
- Fixed issues with the TypeScript and JavaScript Language Features Extension
  failing to activate.
- Fixed missing files in ipynb extension.
- Fixed the homebrew release workflow.
- Fixed the Docker release workflow from not always publishing version tags.

## [4.2.0](https://github.com/coder/code-server/releases/tag/v4.2.0) - 2022-03-22

Code v1.64.2

### Added

- Added tests for `handleArgsSocketCatchError`, `setDefaults` and
  `optionDescriptions`.

### Changed

- We switched from using the fork `coder/vscode` to a submodule of
  `microsoft/vscode` + patches managed by `quilt` for how Code sits inside the
  code-server codebase.
- Upgraded to Code 1.64.2.

### Fixed

- Update popup notification through `--disable-update-check` is now fixed.
- Fixed PWA icons not loading on iPad
- Fixed the homebrew release process. Our `cdrci` bot should now automatically
  update the version as part of the release pipeline.
- Fixed titleBar color setting being ignored in PWA.

### Security

- Updated to `minimist-list`.
- Updated `cloud-agent` to `v0.2.4` which uses `nhooyr.io/webscoket` `v1.8.7`.

## [4.1.0](https://github.com/coder/code-server/releases/tag/v4.1.0) - 2022-03-03

Code v1.63.0

### Added

- Support for injecting GitHub token into Code so extensions can make use of it.
  This can be done with the `GITHUB_TOKEN` environment variable or `github-auth`
  in the config file.
- New flag `--socket-mode` allows setting the mode (file permissions) of the
  socket created when using `--socket`.
- The version of Code bundled with code-server now appears when using the
  `--version` flag. For example: `4.0.2 5cdfe74686aa73e023f8354a9a6014eb30caa7dd with Code 1.63.0`.
  If you have been parsing this flag for the version you might want to use
  `--version --json` instead as doing that will be more stable.

### Changed

- The workspace or folder passed on the CLI will now use the same redirect
  method that the last opened workspace or folder uses. This means if you use
  something like `code-server /path/to/dir` you will now get a query parameter
  added (like so: `my-domain.tld?folder=/path/to/dir`), making it easier to edit
  by hand and making it consistent with the last opened and menu open behaviors.
- The folder/workspace query parameter no longer has encoded slashes, making
  them more readable and editable by hand. This was only affecting the last
  opened behavior, not opens from the menu.

### Fixed

- Fix web sockets not connecting when using `--cert`.
- Prevent workspace state collisions when opening a workspace that shares the
  same file path with another workspace on a different machine that shares the
  same domain. This was causing files opened in one workspace to be "re-"opened
  in the other workspace when the other workspace is opened.
- Pin the Express version which should make installing from npm work again.
- Propagate signals to code-server in the Docker image which means it should
  stop more quickly and gracefully.
- Fix missing argon binaries in the standalone releases on arm machines.

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
