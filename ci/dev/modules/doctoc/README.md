# DocToc [![build status](https://secure.travis-ci.org/thlorenz/doctoc.svg)](http://travis-ci.org/thlorenz/doctoc)

<a href="https://www.patreon.com/bePatron?u=8663953"><img alt="become a patron" src="https://c5.patreon.com/external/logo/become_a_patron_button.png" height="35px"></a>

Generates table of contents for markdown files inside local git repository. Links are compatible with anchors generated
by github or other sites via a command line flag.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Installation](#installation)
- [Usage](#usage)
  - [Adding toc to all files in a directory and sub directories](#adding-toc-to-all-files-in-a-directory-and-sub-directories)
  - [Update existing doctoc TOCs effortlessly](#update-existing-doctoc-tocs-effortlessly)
  - [Adding toc to individual files](#adding-toc-to-individual-files)
    - [Examples](#examples)
  - [Using doctoc to generate links compatible with other sites](#using-doctoc-to-generate-links-compatible-with-other-sites)
    - [Example](#example)
  - [Specifying location of toc](#specifying-location-of-toc)
  - [Specifying a custom TOC title](#specifying-a-custom-toc-title)
  - [Specifying a maximum heading level for TOC entries](#specifying-a-maximum-heading-level-for-toc-entries)
  - [Printing to stdout](#printing-to-stdout)
  - [Usage as a `git` hook](#usage-as-a-git-hook)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


## Installation

    npm install -g doctoc

## Usage

In its simplest usage, you can pass one or more files or folders to the
`doctoc` command. This will update the TOCs of each file specified as well as of
each markdown file found by recursively searching each folder. Below are some
examples.

### Adding toc to all files in a directory and sub directories

Go into the directory that contains you local git project and type:
    
    doctoc .

This will update all markdown files in the current directory and all its
subdirectories with a table of content that will point at the anchors generated
by the markdown parser. Doctoc defaults to using the GitHub parser, but other
[modes can be
specified](#using-doctoc-to-generate-links-compatible-with-other-sites).


### Update existing doctoc TOCs effortlessly

If you already have a TOC inserted by doctoc, it will automatically be updated by running the command (rather than inserting a duplicate toc). Doctoc locates the TOC by the `<!-- START doctoc -->` and `<!-- END doctoc -->` comments, so you can also move a generated TOC to any other portion of your document and it will be updated there.

### Adding toc to individual files

If you want to convert only specific files, do:

    doctoc /path/to/file [...]

#### Examples

    doctoc README.md

    doctoc CONTRIBUTING.md LICENSE.md

You can use this feature to do more sophisticated things. For example, if you
have [ack][ack] installed, you could add `<!-- DOCTOC SKIP -->` to specific
files and then use

    ack -L 'DOCTOC SKIP' | xargs doctoc

to recompile only those files which don't have the DOCTOC SKIP comment.

### Using doctoc to generate links compatible with other sites

In order to add a table of contents whose links are compatible other sites add the appropriate mode flag:

Available modes are:

```
--bitbucket bitbucket.org
--nodejs    nodejs.org
--github    github.com
--gitlab    gitlab.com
--ghost     ghost.org
```

#### Example

    doctoc README.md --bitbucket

### Specifying location of toc

By default, doctoc places the toc at the top of the file. You can indicate to have it placed elsewhere with the following format:

```
<!-- START doctoc -->
<!-- END doctoc -->
```

You place this code directly in your .md file. For example:

```
// my_new_post.md
Here we are, introducing the post. It's going to be great!
But first: a TOC for easy reference.

<!-- START doctoc -->
<!-- END doctoc -->

# Section One

Here we'll discuss...

```

Running doctoc will insert the toc at that location.

### Specifying a custom TOC title

Use the `--title` option to specify a (Markdown-formatted) custom TOC title; e.g., `doctoc --title '**Contents**' .` From then on, you can simply run `doctoc <file>` and doctoc will will keep the title you specified.

Alternatively, to blank out the title, use the `--notitle` option. This will simply remove the title from the TOC.

### Specifying a maximum heading level for TOC entries

Use the `--maxlevel` option to limit TOC entries to headings only up to the specified level; e.g., `doctoc --maxlevel 3 .`

By default,

- no limit is placed on Markdown-formatted headings,
- whereas headings from embedded HTML are limited to 4 levels.

### Printing to stdout

You can print to stdout by using the `-s` or `--stdout` option.

[ack]: http://beyondgrep.com/

### Only update existing ToC

Use `--update-only` or `-u` to only update the existing ToC. That is, the Markdown files without ToC will be left untouched. It is good if you want to use `doctoc` with `lint-staged`.

### Usage as a `git` hook

doctoc can be used as a [pre-commit](http://pre-commit.com) hook by using the
following configuration:

```yaml
repos:
-   repo: https://github.com/thlorenz/doctoc
    rev: ...  # substitute a tagged version
    hooks:
    -   id: doctoc
```

This will run `doctoc` against markdown files when committing to ensure the
TOC stays up-to-date.
