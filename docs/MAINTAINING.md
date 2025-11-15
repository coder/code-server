<!-- prettier-ignore-start -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Maintaining

- [Releasing](#releasing)
    - [Release Candidates](#release-candidates)
    - [AUR](#aur)
    - [Docker](#docker)
    - [Homebrew](#homebrew)
    - [nixpkgs](#nixpkgs)
    - [npm](#npm)
- [Testing](#testing)
- [Documentation](#documentation)
  - [Troubleshooting](#troubleshooting)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
<!-- prettier-ignore-end -->

We keep code-server up to date with VS Code releases (there are usually two or
three a month) but we are not generally actively developing code-server aside
from fixing regressions.

Most of the work is keeping on top of issues and discussions.

## Releasing

1. Check that the changelog lists all the important changes.
2. Make sure the changelog entry lists the current version of VS Code.
3. Update the changelog with the release date.
4. Go to GitHub Actions > Draft release > Run workflow on the commit you want to
   release. Make sure CI has finished the build workflow on that commit or this
   will fail. For the version we match VS Code's minor and patch version. The
   patch number may become temporarily out of sync if we need to put out a
   patch, but if we make our own minor change then we will not release it until
   the next minor VS Code release.
5. CI will automatically grab the build artifact on that commit (which is why CI
   has to have completed), inject the provided version into the `package.json`,
   put together platform-specific packages, and upload those packages to a draft
   release.
6. Update the resulting draft release with the changelog contents.
7. Publish the draft release after validating it.
8. Bump the Helm chart version once the Docker images have published.

#### Release Candidates

We prefer to do release candidates so the community can test things before a
full-blown release. To do this follow the same steps as above but:

1. Add a `-rc.<number>` suffix to the version.
2. When you publish the release select "pre-release". CI will not automatically
   publish pre-releases.
3. Do not update the chart version or merge in the changelog until the final
   release.

#### AUR

We publish to AUR as a package [here](https://aur.archlinux.org/packages/code-server/). This process is manual and can be done by following the steps in [this repo](https://github.com/coder/code-server-aur).

#### Docker

We publish code-server as a Docker image [here](https://hub.docker.com/r/codercom/code-server), tagging it both with the version and latest.

This is currently automated with the release process.

#### Homebrew

We publish code-server on Homebrew [here](https://github.com/Homebrew/homebrew-core/blob/master/Formula/code-server.rb).

This is currently automated with the release process (but may fail occasionally). If it does, run this locally:

```shell
# Replace VERSION with version
brew bump-formula-pr --version="${VERSION}" code-server --no-browse --no-audit
```

#### nixpkgs

We publish code-server in nixpkgs but it must be updated manually.

#### npm

We publish code-server as a npm package [here](https://www.npmjs.com/package/code-server/v/latest).

This is currently automated with the release process.

## Testing

Our testing structure is laid out under our [Contributing docs](https://coder.com/docs/code-server/latest/CONTRIBUTING#test).

If you're ever looking to add more tests, here are a few ways to get started:

- run `npm run test:unit` and look at the coverage chart. You'll see all the
  uncovered lines. This is a good place to start.
- look at `test/scripts` to see which scripts are tested. We can always use more
  tests there.
- look at `test/e2e`. We can always use more end-to-end tests.

Otherwise, talk to a current maintainer and ask which part of the codebase is
lacking most when it comes to tests.

## Documentation

### Troubleshooting

Our docs are hosted on [Vercel](https://vercel.com/). Vercel only shows logs in
realtime, which means you need to have the logs open in one tab and reproduce
your error in another tab. Since our logs are private to Coder the organization,
you can only follow these steps if you're a Coder employee. Ask a maintainer for
help if you need it.

Taking a real scenario, let's say you wanted to troubleshoot [this docs
change](https://github.com/coder/code-server/pull/4042). Here is how you would
do it:

1. Go to https://vercel.com/codercom/codercom
2. Click "View Function Logs"
3. In a separate tab, open the preview link from github-actions-bot
4. Now look at the function logs and see if there are errors in the logs
