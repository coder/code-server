<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Maintaining

- [Maintaining](#maintaining)
  - [Workflow](#workflow)
    - [Milestones](#milestones)
    - [Project Boards](#project-boards)

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

### Project Boards

We use project boards for projects or goals that span multiple milestones.

Think of this as a place to put miscellaneous things (like testing, clean up stuff, etc). As a maintainer, random todos may come up here and there. This gives you a place to add notes temporarily before opening a new issue. Given that our release milestones function off of issues, we believe tasks should have dedicated issues.

It also gives us a way to separate the issue triage from bigger-picture, long-term work.
