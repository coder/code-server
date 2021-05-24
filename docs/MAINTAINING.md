<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Maintaining

- [Maintaining](#maintaining)
  - [Workflow](#workflow)
    - [Milestones](#milestones)
    - [Triage](#triage)
    - [Project Boards](#project-boards)
  - [Versioning](#versioning)
  - [Pull Requests](#pull-requests)
    - [Merge Strategies](#merge-strategies)
    - [Changelog](#changelog)
  - [Release](#release)
    - [Release Manager Rotation](#release-manager-rotation)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Maintaining

Current maintainers:

- @code-asher
- @oxy
- @jsjoeio

This document is meant to serve current and future maintainers of code-server, but also share openly our workflow for maintaining the project.

## Workflow

The workflow used by code-server maintainers is one that aims to be easy to understood by the community and easy enough for new maintainers to jump in and start contributing on day one.

### Milestones

We operate mainly using [milestones](https://github.com/cdr/code-server/milestones). This was heavily inspired by our friends over at [vscode](https://github.com/microsoft/vscode).

Here are the milestones we use and how we use them:

- "Backlog" -> Work not yet planned for a specific release.
- "On Deck" -> Work under consideration for upcoming milestones.
- "Backlog Candidates" -> Work that is not yet accepted for the backlog. We wait for the community to weigh in.
- "<0.0.0>" -> Work to be done for that version.

With this flow, any un-assigned issues are essentially in triage state and once triaged are either "Backlog" or "Backlog Candidates". They will eventually move to "On Deck" (or be closed). Lastly, they will end up on a version milestone where they will be worked on.

### Triage

We use the following process for triaging GitHub issues:

1. a submitter creates an issue
1. add appropriate labels
   1. if we need to look into it further, add "needs-investigation"
1. add to milestone
   1. if it should be fixed soon, add to version milestone or "On Deck"
   1. if not urgent, add to "Backlog"
   1. otherwise, add to "Backlog Candidate" if it should be considered

### Project Boards

We use project boards for projects or goals that span multiple milestones.

Think of this as a place to put miscellaneous things (like testing, clean up stuff, etc). As a maintainer, random todos may come up here and there. This gives you a place to add notes temporarily before opening a new issue. Given that our release milestones function off of issues, we believe tasks should have dedicated issues.

It also gives us a way to separate the issue triage from bigger-picture, long-term work.

## Versioning

`<major.minor.patch>`

The code-server project follows traditional [semantic versioning](https://semver.org/), with the objective of minimizing major changes that break backward compatibility. We increment the patch level for all releases, except when the upstream Visual Studio Code project increments its minor version or we change the plugin API in a backward-compatible manner. In those cases, we increment the minor version rather than the patch level.

## Pull Requests

Ideally, every PR should fix an issue. If it doesn't, make sure it's associated with a version milestone.

If a PR does fix an issue, don't add it to the version milestone. Otherwise, the version milestone will have duplicate information: the issue & the PR fixing the issue.

### Merge Strategies

For most things, we recommend "Squash and Merge". If you're updating `lib/vscode`, we suggest using the "Rebase and Merge" strategy. There may be times where "Create a merge commit" makes sense as well. Use your best judgement. If you're unsure, you can always discuss in the PR with the team.
The code-server project follows traditional [semantic versioning](ttps://semver.org/), with the objective of minimizing major changes that break backward compatibility. We increment the patch level for all releases, except when the upstream Visual Studio Code project increments its minor version or we change the plugin API in a backward-compatible manner. In those cases, we increment the minor version rather than the patch level.

### Changelog

To save time when creating a new release for code-server, we keep a running changelog at `CHANGELOG.md`.

If either author or reviewer of a PR believe the change should be mentioned in the `CHANGELOG`, then it should be added.

If there is not a "Next Version" when you modify `CHANGELOG`, please add it using the template you see near the top of `CHANGELOG`. You can use the suggested format: `<pr title> <pr #> <author> Example: `fix: Check the logged user instead of $USER #3330 @videlanicolas`

## Release

### Release Manager Rotation

With each release, we rotate the role of "release manager" to ensure every maintainer goes through the process. This helps us keep documentation up-to-date and encourages us to continually review and improve the flow with each set of eyes.

If you're the current release manager, follow these steps:

1. Create a [release issue](../.github/ISSUE_TEMPLATE/release.md)
2. Fill out checklist
3. After release is published, close release milestone
