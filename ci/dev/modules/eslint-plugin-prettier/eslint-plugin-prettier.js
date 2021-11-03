/**
 * @fileoverview Runs `prettier` as an ESLint rule.
 * @author Andres Suarez
 */

'use strict';

// ------------------------------------------------------------------------------
//  Requirements
// ------------------------------------------------------------------------------

const {
  showInvisibles,
  generateDifferences,
} = require('prettier-linter-helpers');

// ------------------------------------------------------------------------------
//  Constants
// ------------------------------------------------------------------------------

const { INSERT, DELETE, REPLACE } = generateDifferences;

// ------------------------------------------------------------------------------
//  Privates
// ------------------------------------------------------------------------------

// Lazily-loaded Prettier.
/**
 * @type {import('prettier')}
 */
let prettier;

// ------------------------------------------------------------------------------
//  Rule Definition
// ------------------------------------------------------------------------------

/**
 * Reports a difference.
 * @param {import('eslint').Rule.RuleContext} context - The ESLint rule context.
 * @param {import('prettier-linter-helpers').Difference} difference - The difference object.
 * @returns {void}
 */
function reportDifference(context, difference) {
  const { operation, offset, deleteText = '', insertText = '' } = difference;
  const range = [offset, offset + deleteText.length];
  const [start, end] = range.map((index) =>
    context.getSourceCode().getLocFromIndex(index)
  );

  context.report({
    messageId: operation,
    data: {
      deleteText: showInvisibles(deleteText),
      insertText: showInvisibles(insertText),
    },
    loc: { start, end },
    fix: (fixer) => fixer.replaceTextRange(range, insertText),
  });
}

// ------------------------------------------------------------------------------
//  Module Definition
// ------------------------------------------------------------------------------

module.exports = {
  configs: {
    recommended: {
      extends: ['prettier'],
      plugins: ['prettier'],
      rules: {
        'prettier/prettier': 'error',
        'arrow-body-style': 'off',
        'prefer-arrow-callback': 'off',
      },
    },
  },
  rules: {
    prettier: {
      meta: {
        docs: {
          url: 'https://github.com/prettier/eslint-plugin-prettier#options',
        },
        type: 'layout',
        fixable: 'code',
        schema: [
          // Prettier options:
          {
            type: 'object',
            properties: {},
            additionalProperties: true,
          },
          {
            type: 'object',
            properties: {
              usePrettierrc: { type: 'boolean' },
              fileInfoOptions: {
                type: 'object',
                properties: {},
                additionalProperties: true,
              },
            },
            additionalProperties: true,
          },
        ],
        messages: {
          [INSERT]: 'Insert `{{ insertText }}`',
          [DELETE]: 'Delete `{{ deleteText }}`',
          [REPLACE]: 'Replace `{{ deleteText }}` with `{{ insertText }}`',
        },
      },
      create(context) {
        const usePrettierrc =
          !context.options[1] || context.options[1].usePrettierrc !== false;
        const eslintFileInfoOptions =
          (context.options[1] && context.options[1].fileInfoOptions) || {};
        const sourceCode = context.getSourceCode();
        const filepath = context.getFilename();
        // Processors that extract content from a file, such as the markdown
        // plugin extracting fenced code blocks may choose to specify virtual
        // file paths. If this is the case then we need to resolve prettier
        // config and file info using the on-disk path instead of the virtual
        // path.
        const onDiskFilepath = context.getPhysicalFilename();
        const source = sourceCode.text;

        return {
          Program() {
            if (!prettier) {
              // Prettier is expensive to load, so only load it if needed.
              prettier = require('prettier');
            }

            const eslintPrettierOptions = context.options[0] || {};

            const prettierRcOptions = usePrettierrc
              ? prettier.resolveConfig.sync(onDiskFilepath, {
                  editorconfig: true,
                })
              : null;

            const { ignored, inferredParser } = prettier.getFileInfo.sync(
              onDiskFilepath,
              Object.assign(
                {},
                { resolveConfig: true, ignorePath: '.prettierignore' },
                eslintFileInfoOptions
              )
            );

            // Skip if file is ignored using a .prettierignore file
            if (ignored) {
              return;
            }

            const initialOptions = {};

            // ESLint supports processors that let you extract and lint JS
            // fragments within a non-JS language. In the cases where prettier
            // supports the same language as a processor, we want to process
            // the provided source code as javascript (as ESLint provides the
            // rules with fragments of JS) instead of guessing the parser
            // based off the filename. Otherwise, for instance, on a .md file we
            // end up trying to run prettier over a fragment of JS using the
            // markdown parser, which throws an error.
            // Processors may set virtual filenames for these extracted blocks.
            // If they do so then we want to trust the file extension they
            // provide, and no override is needed.
            // If the processor does not set any virtual filename (signified by
            // `filepath` and `onDiskFilepath` being equal) AND we can't
            // infer the parser from the filename, either because no filename
            // was provided or because there is no parser found for the
            // filename, use javascript.
            // This is added to the options first, so that
            // prettierRcOptions and eslintPrettierOptions can still override
            // the parser.
            //
            // `parserBlocklist` should contain the list of prettier parser
            // names for file types where:
            // * Prettier supports parsing the file type
            // * There is an ESLint processor that extracts JavaScript snippets
            //   from the file type.
            const parserBlocklist = [null, 'markdown', 'html'];

            let inferParserToBabel =
              parserBlocklist.indexOf(inferredParser) !== -1;

            if (
              // it could be processed by `@graphql-eslint/eslint-plugin` or `eslint-plugin-graphql`
              inferredParser === 'graphql' &&
              // for `eslint-plugin-graphql`, see https://github.com/apollographql/eslint-plugin-graphql/blob/master/src/index.js#L416
              source.startsWith('ESLintPluginGraphQLFile`')
            ) {
              inferParserToBabel = true;
            }

            if (filepath === onDiskFilepath && inferParserToBabel) {
              initialOptions.parser = 'babel';
            }

            const prettierOptions = Object.assign(
              {},
              initialOptions,
              prettierRcOptions,
              eslintPrettierOptions,
              { filepath }
            );

            // prettier.format() may throw a SyntaxError if it cannot parse the
            // source code it is given. Usually for JS files this isn't a
            // problem as ESLint will report invalid syntax before trying to
            // pass it to the prettier plugin. However this might be a problem
            // for non-JS languages that are handled by a plugin. Notably Vue
            // files throw an error if they contain unclosed elements, such as
            // `<template><div></template>. In this case report an error at the
            // point at which parsing failed.
            let prettierSource;
            try {
              prettierSource = prettier.format(source, prettierOptions);
            } catch (err) {
              if (!(err instanceof SyntaxError)) {
                throw err;
              }

              let message = 'Parsing error: ' + err.message;

              // Prettier's message contains a codeframe style preview of the
              // invalid code and the line/column at which the error occurred.
              // ESLint shows those pieces of information elsewhere already so
              // remove them from the message
              if (err.codeFrame) {
                message = message.replace(`\n${err.codeFrame}`, '');
              }
              if (err.loc) {
                message = message.replace(/ \(\d+:\d+\)$/, '');
              }

              context.report({ message, loc: err.loc });

              return;
            }

            if (source !== prettierSource) {
              const differences = generateDifferences(source, prettierSource);

              for (const difference of differences) {
                reportDifference(context, difference);
              }
            }
          },
        };
      },
    },
  },
};
