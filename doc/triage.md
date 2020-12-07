# Triage

Triaging code-server issues is done with the following issue filter:

```
is:open no:project sort:created-asc -label:blocked -label:upstream
```

We cannot work on any `blocked` or `upstream` issues as those are best handled by the
VS Code team. However, in certain circumstances we may fix them only in code-server if
necessary.

The GitHub project where we manage all our actionable issues is at:
https://github.com/cdr/code-server/projects/1

Finally, we use milestones to track what issues are planned/or were closed for what release.
https://github.com/cdr/code-server/milestones
