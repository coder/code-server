# Managing pull requests

You should:

- use [GitHub reviews](https://help.github.com/articles/about-pull-request-reviews/)
- review against the [Developer guide criteria](../developer-guide/rules.md)
- resolve conflicts by [rebasing](https://www.atlassian.com/git/tutorials/rewriting-history/git-rebase)
- assign _one or more_ [`pr: needs *`](https://github.com/stylelint/stylelint/labels) labels when requesting a change

You should not use:

- any other labels
- any milestones

## Merging

To merge a pull request, it must have at least:

- one approval for simple documentation fixes
- two approvals for everything else

When merging a PR, you should:

1. ["Squash and merge"](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-request-merges#squash-and-merge-your-pull-request-commits) commits and ensure the resulting commit message is:
   - descriptive
   - sentence case
2. Update the [changelog](https://github.com/stylelint/stylelint/blob/master/CHANGELOG.md) directly via the [GitHub website](https://github.com/stylelint/stylelint/edit/master/CHANGELOG.md) for everything except refactoring and documentation changes:
   1. Create a `## Head` heading if one does not exist already.
   2. Prefix the item with either: "Removed", "Changed", "Deprecated", "Added", or "Fixed".
   3. Order the item within the group by the widest-reaching first to the smallest, and then alphabetically by rule name.
   4. Suffix the item with the relevant pull request number, using the complete GitHub URL so that it works on [the website](https://stylelint.io/CHANGELOG/).
   5. If applicable, lead the item with the name of the rule, e.g. "Fixed: `unit-disallowed-list` false positives for SCSS nested properties".
3. Post this update as a comment to the pull request.
