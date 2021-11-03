import sh from 'mvdan-sh';
import { languages } from './languages';
const { syntax } = sh;
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
                }
                catch (e) {
                    const err = e;
                    throw Object.assign(new SyntaxError(err.Text), {
                        loc: {
                            start: {
                                column: err.Pos.Col(),
                                line: err.Pos.Line(),
                            },
                        },
                    });
                }
            },
            astFormat: 'sh',
            locStart: node => node.Pos().Offset(),
            locEnd: node => node.End().Offset(),
        },
    },
    printers: {
        sh: {
            print: (path, { useTabs, tabWidth, indent = useTabs ? 0 : tabWidth, binaryNextLine = true, switchCaseIndent = true, spaceRedirects = true, keepPadding, minify, functionNextLine, }) => syntax
                .NewPrinter(syntax.Indent(indent), syntax.BinaryNextLine(binaryNextLine), syntax.SwitchCaseIndent(switchCaseIndent), syntax.SpaceRedirects(spaceRedirects), syntax.KeepPadding(keepPadding), syntax.Minify(minify), syntax.FunctionNextLine(functionNextLine))
                .Print(path.getValue()),
        },
    },
    options: {
        keepComments: {
            since: '0.1.0',
            category: 'Output',
            type: 'boolean',
            default: true,
            description: 'KeepComments makes the parser parse comments and attach them to nodes, as opposed to discarding them.',
        },
        stopAt: {
            since: '0.1.0',
            category: 'Config',
            type: 'path',
            description: [
                'StopAt configures the lexer to stop at an arbitrary word, treating it as if it were the end of the input. It can contain any characters except whitespace, and cannot be over four bytes in size.',
                'This can be useful to embed shell code within another language, as one can use a special word to mark the delimiters between the two.',
                'As a word, it will only apply when following whitespace or a separating token. For example, StopAt("$$") will act on the inputs "foo $$" and "foo;$$", but not on "foo \'$$\'".',
                'The match is done by prefix, so the example above will also act on "foo $$bar".',
            ].join('\n'),
        },
        variant: {
            since: '0.1.0',
            category: 'Config',
            type: 'choice',
            default: undefined,
            choices: [
                {
                    value: 0,
                    description: 'Bash',
                },
                {
                    value: 1,
                    description: 'POSIX',
                },
                {
                    value: 2,
                    description: 'MirBSDKorn',
                },
            ],
            description: 'Variant changes the shell language variant that the parser will accept.',
        },
        indent: {
            since: '0.1.0',
            category: 'Format',
            type: 'int',
            description: 'Indent sets the number of spaces used for indentation. If set to 0, tabs will be used instead.',
        },
        binaryNextLine: {
            since: '0.1.0',
            category: 'Output',
            type: 'boolean',
            default: true,
            description: 'BinaryNextLine will make binary operators appear on the next line when a binary command, such as a pipe, spans multiple lines. A backslash will be used.',
        },
        switchCaseIndent: {
            since: '0.1.0',
            category: 'Format',
            type: 'boolean',
            default: true,
            description: 'SwitchCaseIndent will make switch cases be indented. As such, switch case bodies will be two levels deeper than the switch itself.',
        },
        spaceRedirects: {
            since: '0.1.0',
            category: 'Format',
            type: 'boolean',
            default: true,
            description: "SpaceRedirects will put a space after most redirection operators. The exceptions are '>&', '<&', '>(', and '<('.",
        },
        keepPadding: {
            since: '0.1.0',
            category: 'Format',
            type: 'boolean',
            default: false,
            description: [
                'KeepPadding will keep most nodes and tokens in the same column that they were in the original source. This allows the user to decide how to align and pad their code with spaces.',
                'Note that this feature is best-effort and will only keep the alignment stable, so it may need some human help the first time it is run.',
            ].join('\n'),
        },
        minify: {
            since: '0.1.0',
            category: 'Output',
            type: 'boolean',
            default: false,
            description: 'Minify will print programs in a way to save the most bytes possible. For example, indentation and comments are skipped, and extra whitespace is avoided when possible.',
        },
        functionNextLine: {
            since: '0.1.0',
            category: 'Format',
            type: 'boolean',
            default: false,
            description: "FunctionNextLine will place a function's opening braces on the next line.",
        },
    },
};
export default ShPlugin;
//# sourceMappingURL=index.js.map