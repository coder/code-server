## 3.8.3
### Fixes
- #329 fix: Test if response has two lines

### Dependencies
- #306 Bump eslint-config-prettier from 7.2.0 to 8.3.0
- #305 Bump eslint from 7.21.0 to 7.25.0
- #302 Bump mock-fs from 4.13.0 to 4.14.0
- #308 Bump lodash from 4.17.19 to 4.17.21
- #309 Bump ignore-walk from 3.0.3 to 3.0.4
- #310 Bump hosted-git-info from 2.8.8 to 2.8.9
- #325 Bump prettier from 2.2.1 to 2.3.2
- #326 Bump actions/setup-node from 2.1.5 to 2.2.0
- #328 Bump lint-staged from 10.5.4 to 11.0.1
- #330 Bump eslint from 7.25.0 to 7.31.0
- #331 Bump ws from 7.3.1 to 7.5.3
- #332 Bump urlgrey from 0.4.4 to 1.0.0
- #334 Bump husky from 6.0.0 to 7.0.1
- #333 Bump teeny-request from 7.0.1 to 7.1.1

## 3.8.2
### Fixes
- #304 Add coverage-final.json as a possible coverage file during file lookup

## 3.8.1

### Fixes

- [#246](https://github.com/codecov/codecov-node/pull/246) Revert "Bump teeny-request from 6.0.1 to 7.0.0"

## 3.8.0

### Features

- [#160](https://github.com/codecov/codecov-node/pull/160) Add Github Actions support

### Fixes

- [#173](https://github.com/codecov/codecov-node/pull/173) Fix broken gcov command
- [#195](https://github.com/codecov/codecov-node/pull/195) Update Node testing versions
- [#200](https://github.com/codecov/codecov-node/pull/200) Remove flaky tests
- [#204](https://github.com/codecov/codecov-node/pull/204) Create CHANGELOG and remove flaky v4 test
- [#208](https://github.com/codecov/codecov-node/pull/208) Add license scan report and status
- [#220](https://github.com/codecov/codecov-node/pull/220) Remove errant bitly

#### Dependencies

- [#189](https://github.com/codecov/codecov-node/pull/189) Bump lint-staged from 10.0.7 to 10.2.11
- [#190](https://github.com/codecov/codecov-node/pull/190) [Security] Bump handlebars from 4.5.3 to 4.7.6
- [#191](https://github.com/codecov/codecov-node/pull/191) Bump prettier from 1.19.1 to 2.0.5
- [#192](https://github.com/codecov/codecov-node/pull/192) Bump mock-fs from 4.10.4 to 4.12.0
- [#196](https://github.com/codecov/codecov-node/pull/196) Bump teeny-request from 6.0.1 to 7.0.0
- [#197](https://github.com/codecov/codecov-node/pull/197) Bump eslint-config-prettier from 4.3.0 to 6.11.0
- [#198](https://github.com/codecov/codecov-node/pull/198) Bump js-yaml from 3.13.1 to 3.14.0
- [#199](https://github.com/codecov/codecov-node/pull/199) Bump husky from 4.2.1 to 4.2.5
- [#202](https://github.com/codecov/codecov-node/pull/202) Bump eslint from 5.16.0 to 7.7.0
- [#203](https://github.com/codecov/codecov-node/pull/203) Bump jest from 24.9.0 to 26.4.1
- [#205](https://github.com/codecov/codecov-node/pull/205) Bump mock-fs from 4.12.0 to 4.13.0
- [#206](https://github.com/codecov/codecov-node/pull/206) Bump jest from 26.4.1 to 26.4.2
- [#207](https://github.com/codecov/codecov-node/pull/207) Bump prettier from 2.0.5 to 2.1.0
- [#209](https://github.com/codecov/codecov-node/pull/209) Bump lint-staged from 10.2.11 to 10.2.13
- [#210](https://github.com/codecov/codecov-node/pull/210) Bump prettier from 2.1.0 to 2.1.1
- [#212](https://github.com/codecov/codecov-node/pull/212) Bump eslint from 7.7.0 to 7.8.1
- [#214](https://github.com/codecov/codecov-node/pull/214) Bump lint-staged from 10.2.13 to 10.3.0
- [#215](https://github.com/codecov/codecov-node/pull/215) Bump husky from 4.2.5 to 4.3.0
- [#216](https://github.com/codecov/codecov-node/pull/216) Bump node-fetch from 2.6.0 to 2.6.1
- [#217](https://github.com/codecov/codecov-node/pull/217) Bump eslint from 7.8.1 to 7.9.0
- [#218](https://github.com/codecov/codecov-node/pull/218) Bump prettier from 2.1.1 to 2.1.2
- [#219](https://github.com/codecov/codecov-node/pull/219) Bump lint-staged from 10.3.0 to 10.4.0
- [#222](https://github.com/codecov/codecov-node/pull/222) Bump eslint-config-prettier from 6.11.0 to 6.12.0
- [#223](https://github.com/codecov/codecov-node/pull/223) Bump eslint from 7.9.0 to 7.10.0
- [#224](https://github.com/codecov/codecov-node/pull/224) Bump teeny-request from 7.0.0 to 7.0.1

## 3.7.2

- Fix issue with network and file finding

## 3.7.1

- Move to execFileSync and security fixes

## 3.7.0

- Remove the X-Amz-Acl: public-read header

## 3.6.4

- Fix Cirrus CI

## 3.6.3

- Fix for AWS Codebuild & package updates

## 3.6.2

- Command line args sanitized fix

## 3.6.1

- Fix for Semaphore

## 3.6.0

- Added AWS CodeBuild and Semaphore2

## 3.5.0

- Added TeamCity support

## 3.4.0

- Added Heroku CI support

## 3.3.0

- Added pipe with `--pipe`, `-l`

## 3.2.0

- Added azure pipelines
  .

## 3.1.0

- Custom yaml file. Allow codecov token from yml file.

## 3.0.4

- Security fixes

## 3.0.3

- Support non-git/hg root dirs

## 3.0.2

- Security fixes

## 3.0.1

- Security fixes

## 3.0.0

- No longer supports node v0.12 because of new version of request

## 2.3.0

- Added support for Windows. Updated dependencies.

## 2.2.0

- Support for Jenkins Blue Ocean. Clean reports after upload. Fix for Gitlab.

## 2.1.0

- Flags supported http://docs.codecov.io/docs/flags

## 2.0.2

- Display correct version number in console.

## 2.0.1

- Publish as latest instead of next.

## 2.0.0

- No longer supports node v0.10 because of the execSync.
