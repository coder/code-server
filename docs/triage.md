# Triage

Triaging code-server issues is done with the following issue filter:

```text
is:issue is:open no:project sort:created-asc -label:blocked -label:upstream -label:waiting-for-info -label:extension-request
```

This will show issues that:

1. Are open.
1. Have no assigned project.
1. Are not `blocked` or tagged for work by `upstream` (the VS Code core team).
   If an upstream issue is detrimental to the code-server experience we may fix
   it in our patch instead of waiting for the VS Code team to fix it. Someone
   should periodically go through these issues to see if they can be unblocked!
1. Are not labeled `waiting-for-info`.
1. Are not extension requests.

## Triage process

1. If an issue is a question/discussion, it should be converted into a GitHub
   discussion.
1. Otherwise, give the issue the appropriate labels (feel free to create new
   ones if necessary). There are no hard and set rules for labels. We don't have
   many so look through and see how they've been used throughout the repository.
   They all also have descriptions.
1. If more information is required, please ask the submitter and tag as
   `waiting-for-info` and wait.
1. Finally, the issue should be moved into the
   [code-server](https://github.com/coder/code-server/projects/1) project where we
   pick out issues to fix and track their progress.

We also use [milestones](https://github.com/coder/code-server/milestones) to track
what issues are planned/or were closed for what release.
