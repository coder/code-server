# Performing releases

1. Create a [new issue](https://github.com/stylelint/stylelint/issues/new) announcing the planned release, e.g. `Release 8.11.1` and include the [template checklist](#new-release-issue-template).
2. Locally test `master` in the `stylelint-config-*` shareable config repositories. Install current `master` branch (`npm install stylelint/stylelint#master`) and run tests.
3. Locally test `master` in the [stylelint/stylelint.io](https://github.com/stylelint/stylelint.io) repository.
4. Locally test `master` in the [stylelint/stylelint-demo](https://github.com/stylelint/stylelint-demo) repository.
5. Publish the package to npm and create a GitHub release using [`np`](https://github.com/sindresorhus/np):
   1. [Consistently format](pull-requests.md) the [changelog](../../CHANGELOG.md).
   2. Replace `## Head` with new version number e.g. `## 8.1.2`.
   3. Commit these changes.
   4. Push these changes.
   5. Confirm the changes are correct at [https://github.com/stylelint/stylelint](https://github.com/stylelint/stylelint).
   6. Run `npm run release`.
   7. Select the version that matches the one from the changelog.
   8. Copy and paste the changelog entries for the published version from [changelog](../../CHANGELOG.md) when the GitHub release page opens.
   9. Confirm the publishing of the package to [https://www.npmjs.com/package/stylelint](https://www.npmjs.com/package/stylelint).
   10. Confirm the creation of the release at [https://github.com/stylelint/stylelint/releases](https://github.com/stylelint/stylelint/releases).
6. If a new version of any `stylelint-config-*` is required, repeat step 5 for that repository.
7. Update the online demo by changing to the `stylelint-demo` repository:
   1. Run `npm install -S stylelint@latest`.
   2. Run `npm test`.
   3. Commit these changes.
   4. Push these changes.
   5. Confirm the deployment of the update to [stylelint.io/demo](https://stylelint.io/demo).
8. Update the website documentation by changing to the `stylelint.io` repository:
   1. Run `npm install -D stylelint@latest`.
   2. Run `npm test`.
   3. Commit these changes.
   4. Push these changes.
   5. Confirm the deployment of the update to [stylelint.io](https://stylelint.io).
9. Compose a tweet that:
   - announces the release
   - communicates what has changed
   - links to the appropriate heading in the changelog on [stylelint.io](https://stylelint.io).

## New release issue template

```markdown
- [ ] stylelint release
- [ ] stylelint-config-recommended update/release
- [ ] stylelint-config-standard update/release
- [ ] stylelint-demo update
- [ ] stylelint.io update
- [ ] tweet

cc @stylelint/core
```
