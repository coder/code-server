We love and appreciate contributions to Haraka.

### To contribute money

1. Create an issue
2. Use [Bountysource](https://www.bountysource.com/teams/dexus/issues) to post a bounty on that issue

### To contribute code, use the Github "Pull Request" mechanism

#### Overview

1. fork, by clicking the Fork button on the [GitHub Project Page](https://github.com/Dexus/pem)
2. checkout a copy
3. create a branch
4. make changes
5. push changes to your fork
6. submit Pull Request

#### Detailed Example

```sh
export GHUSERNAME=CHANGE_THIS
git clone https://github.com/$GHUSERNAME/pem.git
cd pem
git checkout -b new_branch
$EDITOR lib/pem.js
git add lib/pem.js
git commit
git push origin new_branch
```

The `git commit` step(s) will launch you into `$EDITOR` where the first line should be a summary of the change(s) in less than 50 characters. Additional paragraphs can be added starting on line 3.

To submit new_branch as a Pull Request, visit the [pem project page](https://github.com/Dexus/pem) where your recently pushed branches will appear with a green "Pull Request" button.

### Rebase

On branches with more than a couple commits, it's usually best to squash the commits (condense them into one) before submitting the change(s) as a PR. Notable exceptions to the single commit guideline are:

* where there are multiple logical changes, put each in a commit (easier to review and revert)
* whitespace changes belong in their own commit
* no-op code refactoring is separate from functional changes

To rebase:

```sh
git remote add pem https://github.com/Dexus/pem.git
git remote update pem
git rebase -i pem/master
```

Change all but the first "pick" lines to "s" and save your changes. Your $EDITOR will then present you with all of the commit messages. Edit them and save. Then force push your branch:

`git push -f`

### General Guidelines

* New features **must** be documented
* New features **should** include tests

### Style conventions

Standard Javascript
<!--
* 2 spaces for indentation (no tabs)
* Semi-colons on the end of statements are preferred
* Use underscores\_to\_separate\_names (yes this goes against JS conventions - it's the way it has always been done)
* Do not [cuddle elses](http://c2.com/cgi/wiki?CuddledElseBlocks)
* Use whitespace between operators - we prefer `if (foo > bar)` over `if(foo>bar)`
* Don't comment out lines of code, remove them as they will be in the revision history.
* Use boolean true/false instead of numeric 0/1
* Use one `var` for each declared variable
* See [Editor Settings](Editor-Settings)
-->

## Tests

* run all tests: npm run test
