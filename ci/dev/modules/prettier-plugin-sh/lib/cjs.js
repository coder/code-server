'use strict';

var sh = require('mvdan-sh');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var sh__default = /*#__PURE__*/_interopDefaultLegacy(sh);

const languages = [
  {
    "name": "Alpine Abuild",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "group": "Shell",
    "aliases": [
      "abuild",
      "apkbuild"
    ],
    "filenames": [
      "APKBUILD"
    ],
    "tmScope": "source.shell",
    "aceMode": "sh",
    "codemirrorMode": "shell",
    "codemirrorMimeType": "text/x-sh",
    "linguistLanguageId": 14,
    "vscodeLanguageIds": [
      "shellscript"
    ]
  },
  {
    "name": "Altium Designer",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "aliases": [
      "altium"
    ],
    "extensions": [
      ".OutJob",
      ".PcbDoc",
      ".PrjPCB",
      ".SchDoc"
    ],
    "tmScope": "source.ini",
    "aceMode": "ini",
    "linguistLanguageId": 187772328,
    "vscodeLanguageIds": [
      "ini"
    ]
  },
  {
    "name": "CODEOWNERS",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "filenames": [
      "CODEOWNERS"
    ],
    "tmScope": "text.codeowners",
    "aceMode": "gitignore",
    "linguistLanguageId": 321684729,
    "vscodeLanguageIds": [
      "gitignore"
    ]
  },
  {
    "name": "Dockerfile",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "extensions": [
      ".dockerfile"
    ],
    "filenames": [
      "Dockerfile"
    ],
    "tmScope": "source.dockerfile",
    "aceMode": "dockerfile",
    "codemirrorMode": "dockerfile",
    "codemirrorMimeType": "text/x-dockerfile",
    "linguistLanguageId": 89,
    "vscodeLanguageIds": [
      "dockerfile"
    ]
  },
  {
    "name": "EditorConfig",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "group": "INI",
    "aliases": [
      "editor-config"
    ],
    "filenames": [
      ".editorconfig"
    ],
    "tmScope": "source.editorconfig",
    "aceMode": "ini",
    "codemirrorMode": "properties",
    "codemirrorMimeType": "text/x-properties",
    "linguistLanguageId": 96139566,
    "vscodeLanguageIds": [
      "ini"
    ]
  },
  {
    "name": "Gentoo Ebuild",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "group": "Shell",
    "extensions": [
      ".ebuild"
    ],
    "tmScope": "source.shell",
    "aceMode": "sh",
    "codemirrorMode": "shell",
    "codemirrorMimeType": "text/x-sh",
    "linguistLanguageId": 127,
    "vscodeLanguageIds": [
      "shellscript"
    ]
  },
  {
    "name": "Gentoo Eclass",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "group": "Shell",
    "extensions": [
      ".eclass"
    ],
    "tmScope": "source.shell",
    "aceMode": "sh",
    "codemirrorMode": "shell",
    "codemirrorMimeType": "text/x-sh",
    "linguistLanguageId": 128,
    "vscodeLanguageIds": [
      "shellscript"
    ]
  },
  {
    "name": "Git Attributes",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "group": "INI",
    "aliases": [
      "gitattributes"
    ],
    "filenames": [
      ".gitattributes"
    ],
    "tmScope": "source.gitattributes",
    "aceMode": "gitignore",
    "codemirrorMode": "shell",
    "codemirrorMimeType": "text/x-sh",
    "linguistLanguageId": 956324166,
    "vscodeLanguageIds": [
      "gitignore"
    ]
  },
  {
    "name": "Git Config",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "group": "INI",
    "aliases": [
      "gitconfig",
      "gitmodules"
    ],
    "extensions": [
      ".gitconfig"
    ],
    "filenames": [
      ".gitconfig",
      ".gitmodules"
    ],
    "tmScope": "source.gitconfig",
    "aceMode": "ini",
    "codemirrorMode": "properties",
    "codemirrorMimeType": "text/x-properties",
    "linguistLanguageId": 807968997,
    "vscodeLanguageIds": [
      "ini"
    ]
  },
  {
    "name": "INI",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "aliases": [
      "dosini"
    ],
    "extensions": [
      ".ini",
      ".cfg",
      ".dof",
      ".lektorproject",
      ".prefs",
      ".pro",
      ".properties"
    ],
    "filenames": [
      "buildozer.spec"
    ],
    "tmScope": "source.ini",
    "aceMode": "ini",
    "codemirrorMode": "properties",
    "codemirrorMimeType": "text/x-properties",
    "linguistLanguageId": 163,
    "vscodeLanguageIds": [
      "ini"
    ]
  },
  {
    "name": "Ignore List",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "group": "INI",
    "aliases": [
      "ignore",
      "gitignore",
      "git-ignore"
    ],
    "extensions": [
      ".gitignore"
    ],
    "filenames": [
      ".atomignore",
      ".babelignore",
      ".bzrignore",
      ".coffeelintignore",
      ".cvsignore",
      ".dockerignore",
      ".eleventyignore",
      ".eslintignore",
      ".gitignore",
      ".nodemonignore",
      ".npmignore",
      ".prettierignore",
      ".stylelintignore",
      ".vscodeignore",
      "gitignore-global",
      "gitignore_global"
    ],
    "tmScope": "source.gitignore",
    "aceMode": "gitignore",
    "codemirrorMode": "shell",
    "codemirrorMimeType": "text/x-sh",
    "linguistLanguageId": 74444240,
    "vscodeLanguageIds": [
      "gitignore"
    ]
  },
  {
    "name": "Java Properties",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "extensions": [
      ".properties"
    ],
    "tmScope": "source.java-properties",
    "aceMode": "properties",
    "codemirrorMode": "properties",
    "codemirrorMimeType": "text/x-properties",
    "linguistLanguageId": 519377561,
    "vscodeLanguageIds": [
      "properties"
    ]
  },
  {
    "name": "OpenRC runscript",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "group": "Shell",
    "aliases": [
      "openrc"
    ],
    "interpreters": [
      "openrc-run"
    ],
    "tmScope": "source.shell",
    "aceMode": "sh",
    "codemirrorMode": "shell",
    "codemirrorMimeType": "text/x-sh",
    "linguistLanguageId": 265,
    "vscodeLanguageIds": [
      "shellscript"
    ]
  },
  {
    "name": "Shell",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "aliases": [
      "sh",
      "shell-script",
      "bash",
      "zsh"
    ],
    "extensions": [
      ".sh",
      ".bash",
      ".bats",
      ".cgi",
      ".command",
      ".env",
      ".fcgi",
      ".ksh",
      ".sh.in",
      ".tmux",
      ".tool",
      ".zsh"
    ],
    "filenames": [
      ".bash_aliases",
      ".bash_history",
      ".bash_logout",
      ".bash_profile",
      ".bashrc",
      ".cshrc",
      ".env",
      ".env.example",
      ".flaskenv",
      ".login",
      ".profile",
      ".zlogin",
      ".zlogout",
      ".zprofile",
      ".zshenv",
      ".zshrc",
      "9fs",
      "PKGBUILD",
      "bash_aliases",
      "bash_logout",
      "bash_profile",
      "bashrc",
      "cshrc",
      "gradlew",
      "login",
      "man",
      "profile",
      "zlogin",
      "zlogout",
      "zprofile",
      "zshenv",
      "zshrc"
    ],
    "interpreters": [
      "ash",
      "bash",
      "dash",
      "ksh",
      "mksh",
      "pdksh",
      "rc",
      "sh",
      "zsh"
    ],
    "tmScope": "source.shell",
    "aceMode": "sh",
    "codemirrorMode": "shell",
    "codemirrorMimeType": "text/x-sh",
    "linguistLanguageId": 346,
    "vscodeLanguageIds": [
      "shellscript"
    ]
  },
  {
    "name": "ShellSession",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "aliases": [
      "bash session",
      "console"
    ],
    "extensions": [
      ".sh-session"
    ],
    "tmScope": "text.shell-session",
    "aceMode": "sh",
    "codemirrorMode": "shell",
    "codemirrorMimeType": "text/x-sh",
    "linguistLanguageId": 347,
    "vscodeLanguageIds": [
      "shellscript"
    ]
  },
  {
    "name": "Tcsh",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "group": "Shell",
    "extensions": [
      ".tcsh",
      ".csh"
    ],
    "interpreters": [
      "tcsh",
      "csh"
    ],
    "tmScope": "source.shell",
    "aceMode": "sh",
    "codemirrorMode": "shell",
    "codemirrorMimeType": "text/x-sh",
    "linguistLanguageId": 368,
    "vscodeLanguageIds": [
      "shellscript"
    ]
  },
  {
    "name": "TextMate Properties",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "aliases": [
      "tm-properties"
    ],
    "filenames": [
      ".tm_properties"
    ],
    "tmScope": "source.tm-properties",
    "aceMode": "properties",
    "codemirrorMode": "properties",
    "codemirrorMimeType": "text/x-properties",
    "linguistLanguageId": 981795023,
    "vscodeLanguageIds": [
      "properties"
    ]
  },
  {
    "name": "Windows Registry Entries",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "extensions": [
      ".reg"
    ],
    "tmScope": "source.reg",
    "aceMode": "ini",
    "codemirrorMode": "properties",
    "codemirrorMimeType": "text/x-properties",
    "linguistLanguageId": 969674868,
    "vscodeLanguageIds": [
      "ini"
    ]
  },
  {
    "name": "JvmOptions",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "extensions": [
      ".vmoptions"
    ],
    "filenames": [
      "jvm.options"
    ],
    "vscodeLanguageIds": [
      "jvmoptions"
    ]
  },
  {
    "name": "hosts",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "filenames": [
      "hosts"
    ],
    "vscodeLanguageIds": [
      "hosts"
    ]
  },
  {
    "name": "dotenv",
    "since": "0.1.0",
    "parsers": [
      "sh"
    ],
    "extensions": [
      ".env"
    ],
    "filenames": [
      ".env.*"
    ],
    "vscodeLanguageIds": [
      "dotenv"
    ]
  }
];

const { syntax } = sh__default['default'];
const ShPlugin = {
  languages,
  parsers: {
    sh: {
      parse: (text, _parsers, { filepath, keepComments = true, stopAt, variant }) => {
        const parserOptions = [syntax.KeepComments(keepComments)];
        if (stopAt != null) {
          parserOptions.push(syntax.StopAt(stopAt));
        }
        if (variant != null) {
          parserOptions.push(syntax.Variant(variant));
        }
        try {
          return syntax.NewParser(...parserOptions).Parse(text, filepath);
        } catch (e) {
          const err = e;
          throw Object.assign(new SyntaxError(err.Text), {
            loc: {
              start: {
                column: err.Pos.Col(),
                line: err.Pos.Line()
              }
            }
          });
        }
      },
      astFormat: "sh",
      locStart: (node) => node.Pos().Offset(),
      locEnd: (node) => node.End().Offset()
    }
  },
  printers: {
    sh: {
      print: (path, {
        useTabs,
        tabWidth,
        indent = useTabs ? 0 : tabWidth,
        binaryNextLine = true,
        switchCaseIndent = true,
        spaceRedirects = true,
        keepPadding,
        minify,
        functionNextLine
      }) => syntax.NewPrinter(syntax.Indent(indent), syntax.BinaryNextLine(binaryNextLine), syntax.SwitchCaseIndent(switchCaseIndent), syntax.SpaceRedirects(spaceRedirects), syntax.KeepPadding(keepPadding), syntax.Minify(minify), syntax.FunctionNextLine(functionNextLine)).Print(path.getValue())
    }
  },
  options: {
    keepComments: {
      since: "0.1.0",
      category: "Output",
      type: "boolean",
      default: true,
      description: "KeepComments makes the parser parse comments and attach them to nodes, as opposed to discarding them."
    },
    stopAt: {
      since: "0.1.0",
      category: "Config",
      type: "path",
      description: [
        "StopAt configures the lexer to stop at an arbitrary word, treating it as if it were the end of the input. It can contain any characters except whitespace, and cannot be over four bytes in size.",
        "This can be useful to embed shell code within another language, as one can use a special word to mark the delimiters between the two.",
        `As a word, it will only apply when following whitespace or a separating token. For example, StopAt("$$") will act on the inputs "foo $$" and "foo;$$", but not on "foo '$$'".`,
        'The match is done by prefix, so the example above will also act on "foo $$bar".'
      ].join("\n")
    },
    variant: {
      since: "0.1.0",
      category: "Config",
      type: "choice",
      default: void 0,
      choices: [
        {
          value: 0,
          description: "Bash"
        },
        {
          value: 1,
          description: "POSIX"
        },
        {
          value: 2,
          description: "MirBSDKorn"
        }
      ],
      description: "Variant changes the shell language variant that the parser will accept."
    },
    indent: {
      since: "0.1.0",
      category: "Format",
      type: "int",
      description: "Indent sets the number of spaces used for indentation. If set to 0, tabs will be used instead."
    },
    binaryNextLine: {
      since: "0.1.0",
      category: "Output",
      type: "boolean",
      default: true,
      description: "BinaryNextLine will make binary operators appear on the next line when a binary command, such as a pipe, spans multiple lines. A backslash will be used."
    },
    switchCaseIndent: {
      since: "0.1.0",
      category: "Format",
      type: "boolean",
      default: true,
      description: "SwitchCaseIndent will make switch cases be indented. As such, switch case bodies will be two levels deeper than the switch itself."
    },
    spaceRedirects: {
      since: "0.1.0",
      category: "Format",
      type: "boolean",
      default: true,
      description: "SpaceRedirects will put a space after most redirection operators. The exceptions are '>&', '<&', '>(', and '<('."
    },
    keepPadding: {
      since: "0.1.0",
      category: "Format",
      type: "boolean",
      default: false,
      description: [
        "KeepPadding will keep most nodes and tokens in the same column that they were in the original source. This allows the user to decide how to align and pad their code with spaces.",
        "Note that this feature is best-effort and will only keep the alignment stable, so it may need some human help the first time it is run."
      ].join("\n")
    },
    minify: {
      since: "0.1.0",
      category: "Output",
      type: "boolean",
      default: false,
      description: "Minify will print programs in a way to save the most bytes possible. For example, indentation and comments are skipped, and extra whitespace is avoided when possible."
    },
    functionNextLine: {
      since: "0.1.0",
      category: "Format",
      type: "boolean",
      default: false,
      description: "FunctionNextLine will place a function's opening braces on the next line."
    }
  }
};

module.exports = ShPlugin;
