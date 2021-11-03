# Release steps

1. create a `release-[x.y.z]` branch from tip of `master` (or whatever release commit)

   ```bash
   git checkout master && git pull && git checkout -b release-2.1.0
   ```

2. bump `package.json` + update CHANGELOG version links for all releasing packages (i.e., root + any resolvers)

   In changelog for core plugin, normally leave [Unreleased] but update its link at the bottom
   to be rooted at the new version's tag, and add a link for the new version rooted
   at last version's tag.

   ```markdown
   [Unreleased]: https://github.com/benmosher/eslint-plugin-import/compare/v2.0.1...HEAD
   [2.0.1]: https://github.com/benmosher/eslint-plugin-import/compare/v2.0.0...v2.0.1
   ```

   becomes

   ```markdown
   [Unreleased]: https://github.com/benmosher/eslint-plugin-import/compare/v2.1.0...HEAD
   [2.1.0]: https://github.com/benmosher/eslint-plugin-import/compare/v2.0.1...v2.1.0
   [2.0.1]: https://github.com/benmosher/eslint-plugin-import/compare/v2.0.0...v2.0.1
   ```

   Generally, don't use `npm version` for this because it creates a tag, which I normally
   wait until signoff from contributors and actually `npm publish`-ing to snap the tag.

3. create pull request from `release-[x.y.z]` into `release` branch

   I like this because it
   - lists all commits in the release
   - provides a commentary location to discuss the release
   - builds in CI and provides test results

4. iterate on feedback
   - handle other issues
   - merge more PRs
   - fix issues in changelog/docs

5. `npm publish` from `release-[x.y.z]` branch
   - don't forget resolvers!

6. tag commit (`v[x.y.z]`)
   - again, not forgetting resolvers, if needed (`resolvers/[name]/v[t.u.v]`)

7. merge `release-[x.y.z]` into `release` (
   - ideally fast-forward, probably with Git CLI instead of Github

8. merge `release` into `master`

Done!
