# Contributing

Thanks for contributing!

## Installation

```sh
git clone https://github.com/prettier/prettier-linter-helpers.git
cd prettier-linter-helpers
yarn install
```

## Running the tests

```sh
yarn run test
```

Linting is ran as part of `yarn run test`. The build will fail if there are any linting errors. You can run `yarn run lint --fix` to fix some linting errors (including formatting to match prettier's expectations). To run the tests without linting run `yarn run test`.

## Publishing

- Ensure you are on the master branch locally.
- Update `CHANGELOG.md` and commit.
- Run the following:

  ```sh
  yarn publish
  git push --follow-tags
  ```

  Running `yarn publish` shall:

  - Bump the version in package.json (asking you for the new version number)
  - Create a new commit containing that version bump in package.json
  - Create a tag for that commit
  - Publish to the npm repository

  Running `git push --follow-tags` shall:

  - Push the commit and tag to GitHub
