#!/usr/bin/env python3
"""Prepare CHANGELOG.md for a new release."""
import os
import sys
import subprocess
import json

AUTHOR="author"
TITLE="title"
PR="number"
FEATURE="feature"
FIX="fix"
DOCS="docs"
DEVELOPMENT="development"


def gather_pr_list(repo="cdr/code-server", count=500):
    """Use 'gh' to retrieve all new merged PR"""

    cmd = [
        "gh", "pr", "list",
        "--state",  "merged",
        "--repo", repo,
        "-L",  str(count),
        "--json", "author,number,title"
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    pr_dict = json.load(proc.stdout)
    for entry in pr_dict:
        entry[AUTHOR] = entry[AUTHOR]['login']
        entry[PR] = int(entry[PR])
    return pr_dict


def generate_lines(pr_dict, last=0):
    """Format PR entries as text lines, ready to go into CHANGELOG.md"""

    def get_type(source) -> bool:
        """Intelligent compare"""

        for x in [FEATURE, FIX, DOCS]:
            source_prefix = source[:len(x)].casefold()
            if source_prefix == x:
                return x
        return DEVELOPMENT
    
    result = {
        FEATURE: [],
        FIX: [],
        DOCS: [],
        DEVELOPMENT: [],
    }
    for entry in pr_dict:
        if entry[PR] <= last:
            continue
        line = f"- {entry[TITLE]} #{entry[PR]} {entry[AUTHOR]}\n"
        result[get_type(entry[TITLE])].append(line)
    return result


def read_changelog():
    """Read lines in CHANGELOG.md and skip white spaces"""
    with open("CHANGELOG.md") as f:
        content = f.readlines()
    del content[0]
    del content[0]
    return content


def build_changelog(version, vscode_version, pr_lines, old_lines):
    """Build lines in changelog and write new changelog"""

    lines = [
        f"# Changelog\n\n## {version}\n\nVS Code {vscode_version}\n\n",
    ]
    for content in  [
        (FEATURE, "### New Features"),
        (FIX, "### Bug Fixes"),
        (DOCS, "### Documentation"),
        (DEVELOPMENT, "### Development"),
    ]:
        lines.append(f"{content[1]}\n\n")
        lines.extend(pr_lines[content[0]])
        lines.append("\n")
    lines.extend(old_lines)
    with open("CHANGELOG.md", "w") as f:
        f.writelines(lines)

    
def main(argv):
    """Run the script."""
    if not os.path.isfile("CHANGELOG.md"):
        print("Run prepare_changelog.py from code-server root dir")
        return 1
    if len(argv) != 4:
        usage = "prepare_changelog.py <release> <vscode release> <last PR of previous release>"
        print(f"Usage\n   {usage}")
        return 1
    version = argv[1]
    vscode_version = argv[2]
    last = int(argv[3])
    pr_dict = gather_pr_list()
    pr_lines = generate_lines(pr_dict, last)
    lines = read_changelog()
    build_changelog(version, vscode_version, pr_lines, lines)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
