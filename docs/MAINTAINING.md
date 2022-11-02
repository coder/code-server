<!-- prettier-ignore-start -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Maintaining

- [Team](#team)
  - [Onboarding](#onboarding)
  - [Offboarding](#offboarding)
- [Workflow](#workflow)
  - [Milestones](#milestones)
  - [Triage](#triage)
- [Versioning](#versioning)
- [Pull requests](#pull-requests)
  - [Merge strategies](#merge-strategies)
  - [Changelog](#changelog)
- [Releases](#releases)
  - [Publishing a release](#publishing-a-release)
    - [Release Candidates](#release-candidates)
    - [AUR](#aur)
    - [Docker](#docker)
    - [Homebrew](#homebrew)
    - [npm](#npm)
- [Syncing with upstream Code](#syncing-with-upstream-code)
- [Testing](#testing)
- [Documentation](#documentation)
  - [Troubleshooting](#troubleshooting)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
<!-- prettier-ignore-end -->

This document is meant to serve current and future maintainers of code-server,
as well as share our workflow for maintaining the project.

## Team

Current maintainers:

- @code-asher
- @jsjoeio

Occasionally, other Coder employees may step in time to time to assist with code-server.

### Onboarding

To onboard a new maintainer to the project, please make sure to do the following:

- [ ] Add to [coder/code-server](https://github.com/orgs/coder/teams/code-server)
- [ ] Add as Admin under [Repository Settings > Access](https://github.com/coder/code-server/settings/access)
- [ ] Add to [npm Coder org](https://www.npmjs.com/org/coder)
- [ ] Add as [AUR maintainer](https://aur.archlinux.org/packages/code-server/) (talk to Colin)
- [ ] Introduce to community via Discussion (see [example](https://github.com/coder/code-server/discussions/3955))

### Offboarding

Very similar to Onboarding but Remove maintainer from all teams and revoke access. Please also do the following:

- [ ] Write farewell post via Discussion (see [example](https://github.com/coder/code-server/discussions/3933))

## Workflow

The workflow used by code-server maintainers aims to be easy to understood by
the community and easy enough for new maintainers to jump in and start
contributing on day one.

### Milestones

We operate mainly using
[milestones](https://github.com/coder/code-server/milestones). This was heavily
inspired by our friends over at [vscode](https://github.com/microsoft/vscode).

Here are the milestones we use and how we use them:

- "Backlog" -> Work not yet planned for a specific release.
- "On Deck" -> Work under consideration for upcoming milestones.
- "Backlog Candidates" -> Work that is not yet accepted for the backlog. We wait
  for the community to weigh in.
- "<Month>" -> Work to be done for said month.

With this flow, any un-assigned issues are essentially in triage state. Once
triaged, issues are either "Backlog" or "Backlog Candidates". They will
eventually move to "On Deck" (or be closed). Lastly, they will end up on a
version milestone where they will be worked on.

### Triage

We use the following process for triaging GitHub issues:

1. Create an issue
1. Add appropriate labels to the issue (including "needs-investigation" if we
   should look into it further)
1. Add the issue to a milestone
   1. If it should be fixed soon, add to version milestone or "On Deck"
   2. If not urgent, add to "Backlog"
   3. Otherwise, add to "Backlog Candidate" for future consideration

## Versioning

`<major.minor.patch>`

The code-server project follows traditional [semantic
versioning](https://semver.org/), with the objective of minimizing major changes
that break backward compatibility. We increment the patch level for all
releases, except when the upstream Visual Studio Code project increments its
minor version or we change the plugin API in a backward-compatible manner. In
those cases, we increment the minor version rather than the patch level.

## Pull requests

Ideally, every PR should fix an issue. If it doesn't, make sure it's associated
with a version milestone.

If a PR does fix an issue, don't add it to the version milestone. Otherwise, the
version milestone will have duplicate information: the issue and the PR fixing
the issue.

### Merge strategies

For most things, we recommend the **squash and merge** strategy. There
may be times where **creating a merge commit** makes sense as well. Use your
best judgment. If you're unsure, you can always discuss in the PR with the team.

### Changelog

To save time when creating a new release for code-server, we keep a running
changelog at `CHANGELOG.md`.

If either the author or reviewer of a PR believes the change should be mentioned
in the changelog, then it should be added.

If there is not a **Next Version** when you modify `CHANGELOG.md`, please add it
using the template you see near the top of the changelog.

When writing your changelog item, ask yourself:

1. How do these changes affect code-server users?
2. What actions do they need to take (if any)?

If you need inspiration, we suggest looking at the [Emacs
changelog](https://github.com/emacs-mirror/emacs/blob/master/etc/NEWS).

## Releases

### Publishing a release

1. Create a new branch called `release/v0.0.0` (replace 0s with actual version aka v4.5.0)
1. Run `yarn release:prep`
1. Bump chart version in `Chart.yaml`.
1. Summarize the major changes in the `CHANGELOG.md`
1. Download CI artifacts and make sure code-server works locally.
1. Merge PR and wait for CI build on `main` to finish.
1. Go to GitHub Actions > Draft release > Run workflow off `main`. CI will automatically upload the artifacts to the release.
1. Add the release notes from the `CHANGELOG.md` and publish release. CI will automatically grab the
   artifacts, publish the NPM package from `npm-package`, and publish the Docker
   Hub image from `release-images`.

#### Release Candidates

We prefer to do release candidates so the community can test things before a full-blown release. To do this follow the same steps as above but:

1. Only bump version in `package.json`
1. use `0.0.0-rc.0`
1. When you publish the release, select "pre-release"

#### AUR

We publish to AUR as a package [here](https://aur.archlinux.org/packages/code-server/). This process is manual and can be done by following the steps in [this repo](https://github.com/coder/code-server-aur).

#### Docker

We publish code-server as a Docker image [here](https://registry.hub.docker.com/r/codercom/code-server), tagging it both with the version and latest.

This is currently automated with the release process.

#### Homebrew

We publish code-server on Homebrew [here](https://github.com/Homebrew/homebrew-core/blob/master/Formula/code-server.rb).

This is currently automated with the release process (but may fail occasionally). If it does, run this locally:

```shell
# Replace VERSION with version
brew bump-formula-pr --version="${VERSION}" code-server --no-browse --no-audit
```

#### npm

We publish code-server as a npm package [here](https://www.npmjs.com/package/code-server/v/latest).

This is currently automated with the release process.

## Syncing with upstream Code

Refer to the [contributing docs](https://coder.com/docs/code-server/latest/CONTRIBUTING#version-updates-to-code) for information on how to update Code within code-server.

## Testing

Our testing structure is laid out under our [Contributing docs](https://coder.com/docs/code-server/latest/CONTRIBUTING#test).

We hope to eventually hit 100% test coverage with our unit tests, and maybe one day our scripts (coverage not tracked currently).

If you're ever looking to add more tests, here are a few ways to get started:

- run `yarn test:unit` and look at the coverage chart. You'll see all the uncovered lines. This is a good place to start.
- look at `test/scripts` to see which scripts are tested. We can always use more tests there.
- look at `test/e2e`. We can always use more end-to-end tests.

Otherwise, talk to a current maintainer and ask which part of the codebase is lacking most when it comes to tests.

## Documentation

### Troubleshooting

Our docs are hosted on [Vercel](https://vercel.com/). Vercel only shows logs in realtime, which means you need to have the logs open in one tab and reproduce your error in another tab. Since our logs are private to Coder the organization, you can only follow these steps if you're a Coder employee. Ask a maintainer for help if you need it.

Taking a real scenario, let's say you wanted to troubleshoot [this docs change](https://github.com/coder/code-server/pull/4042). Here is how you would do it:

1. Go to https://vercel.com/codercom/codercom
2. Click "View Function Logs"
3. In a separate tab, open the preview link from github-actions-bot
4. Now look at the function logs and see if there are errors in the logs
