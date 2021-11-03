'use strict';

const getTemplate = require('./get-template');
const loadSyntax = require('postcss-syntax/load-syntax');
const { parse, types, traverse, loadOptions } = require('@babel/core');

const isStyleSheetCreate = expectAdjacentSibling(['create']);
const supports = {
	// import styled from '@emotion/styled'
	// import { styled } from 'glamor/styled'
	// import { styled } from "styletron-react";
	// import { styled } from 'linaria/react';
	// import { styled } from '@material-ui/styles'
	styled: true,

	// import { style } from "typestyle";
	style: true,

	// import { StyleSheet, css } from 'aphrodite';
	// import styled, { css } from 'astroturf';
	// import { css } from 'lit-css';
	// import { css } from 'glamor'
	// require('css-light').css({color: 'red'});
	// import { css } from 'linaria';
	css: true,

	// import { StyleSheet, css } from 'aphrodite';
	// import { AppRegistry, StyleSheet, Text, View } from 'react-native';
	StyleSheet: isStyleSheetCreate,

	// import styled, { css } from 'astroturf';
	astroturf: true,

	// require('csjs')`css`;
	csjs: true,

	// require('cssobj')({color: 'red'})
	cssobj: true,

	// require('electron-css')({color: 'red'})
	'electron-css': true,

	// import styled from "react-emotion";
	'react-emotion': true,

	// import styled from 'preact-emotion'
	'preact-emotion': true,

	// https://github.com/streamich/freestyler
	freestyler: true,

	// https://github.com/paypal/glamorous
	glamorous: true,

	// https://github.com/irom-io/i-css
	// "i-css": (i, nameSpace) => nameSpace[i + 1] === "addStyles" && nameSpace[i + 2] === "wrapper",

	// https://github.com/j2css/j2c
	j2c: expectAdjacentSibling(['inline', 'sheet']),

	// var styles = StyleSheet.create({color: 'red'})
	'react-inline': isStyleSheetCreate,
	'react-style': isStyleSheetCreate,

	// import reactCSS from 'reactcss'
	reactcss: true,

	// const StyledButton = injectSheet(styles)(Button)
	'react-jss': true,

	// import styled from 'styled-components';
	'styled-components': true,

	// import {withStyle} from "styletron-react";
	'styletron-react': expectAdjacentSibling(['withStyle']),

	styling: true,

	// const rule = superstyle({ color: 'blue' })
	superstyle: true,

	// import { makeStyles } from '@material-ui/styles'
	styles: expectAdjacentSibling(['makeStyles']),
};

const plugins = [
	'jsx',
	'typescript',
	'objectRestSpread',
	['decorators', { decoratorsBeforeExport: false }],
	'classProperties',
	'exportExtensions',
	'asyncGenerators',
	'functionBind',
	'functionSent',
	'dynamicImport',
	'optionalCatchBinding',
];

function expectAdjacentSibling(names) {
	return (i, nameSpace) => names.some((name) => nameSpace[i + 1] === name);
}

function loadBabelOpts(opts) {
	const filename = opts.from && opts.from.replace(/\?.*$/, '');

	opts = {
		filename,
		parserOpts: {
			plugins,
			sourceFilename: filename,
			sourceType: filename && /\.m[tj]sx?$/.test(filename) ? 'module' : 'unambiguous',
			allowImportExportEverywhere: true,
			allowAwaitOutsideFunction: true,
			allowReturnOutsideFunction: true,
			allowSuperOutsideMethod: true,
		},
	};
	let fileOpts;

	try {
		fileOpts =
			filename &&
			loadOptions({
				filename,
			});
	} catch (ex) {
		//
	}

	for (const key in fileOpts) {
		if (Array.isArray(fileOpts[key]) && !fileOpts[key].length) {
			continue;
		}

		opts[key] = fileOpts[key];

		if (Array.isArray(fileOpts[key]) && Array.isArray(opts.parserOpts[key])) {
			// combine arrays for plugins
			opts.parserOpts[key] = opts.parserOpts[key].concat(fileOpts[key]);
		} else {
			// because some options need to be passed to parser also
			opts.parserOpts[key] = fileOpts[key];
		}
	}

	return opts;
}

function literalParser(source, opts, styles) {
	let ast;

	try {
		ast = parse(source, loadBabelOpts(opts));
	} catch (ex) {
		// console.error(ex);
		return styles || [];
	}

	const specifiers = new Map();
	const variableDeclarator = new Map();
	const objLiteral = new Set();
	const tplLiteral = new Set();
	const tplCallee = new Set();
	const jobs = [];

	function addObjectJob(path) {
		jobs.push(() => {
			addObjectValue(path);
		});
	}

	function addObjectValue(path) {
		if (path.isIdentifier()) {
			const identifier = path.scope.getBindingIdentifier(path.node.name);

			if (identifier) {
				path = variableDeclarator.get(identifier);

				if (path) {
					variableDeclarator.delete(identifier);
					path.forEach(addObjectExpression);
				}
			}
		} else {
			addObjectExpression(path);
		}
	}

	function addObjectExpression(path) {
		if (path.isObjectExpression()) {
			path.get('properties').forEach((prop) => {
				if (prop.isSpreadElement()) {
					addObjectValue(prop.get('argument'));
				}
			});
			objLiteral.add(path.node);

			return path;
		}
	}

	function setSpecifier(id, nameSpace) {
		nameSpace.unshift(
			...nameSpace
				.shift()
				.replace(/^\W+/, '')
				.split(/[/\\]+/g),
		);

		if (types.isIdentifier(id)) {
			specifiers.set(id.name, nameSpace);
			specifiers.set(id, nameSpace);
		} else if (types.isObjectPattern(id)) {
			id.properties.forEach((property) => {
				if (types.isObjectProperty(property)) {
					const key = property.key;

					nameSpace = nameSpace.concat(key.name || key.value);
					id = property.value;
				} else {
					id = property.argument;
				}

				setSpecifier(id, nameSpace);
			});
		} else if (types.isArrayPattern(id)) {
			id.elements.forEach((element, i) => {
				setSpecifier(element, nameSpace.concat(String(i)));
			});
		}
	}

	function getNameSpace(path, nameSpace) {
		let node = path.node;

		if (path.isIdentifier() || path.isJSXIdentifier()) {
			node = path.scope.getBindingIdentifier(node.name) || node;
			const specifier = specifiers.get(node) || specifiers.get(node.name);

			if (specifier) {
				nameSpace.unshift(...specifier);
			} else {
				nameSpace.unshift(node.name);
			}
		} else {
			['name', 'property', 'object', 'callee'].forEach((prop) => {
				node[prop] && getNameSpace(path.get(prop), nameSpace);
			});
		}

		return nameSpace;
	}

	function isStylePath(path) {
		return getNameSpace(path, []).some(function (name, ...args) {
			const result =
				name &&
				((Object.prototype.hasOwnProperty.call(supports, name) && supports[name]) ||
					(Object.prototype.hasOwnProperty.call(opts.syntax.config, name) &&
						opts.syntax.config[name]));

			switch (typeof result) {
				case 'function': {
					return result.apply(this, args);
				}
				case 'boolean': {
					return result;
				}
				default: {
					return undefined;
				}
			}
		});
	}

	const visitor = {
		ImportDeclaration: (path) => {
			const moduleId = path.node.source.value;

			path.node.specifiers.forEach((specifier) => {
				const nameSpace = [moduleId];

				if (specifier.imported) {
					nameSpace.push(specifier.imported.name);
				}

				setSpecifier(specifier.local, nameSpace);
			});
		},
		JSXAttribute: (path) => {
			if (/^(?:css|style)$/.test(path.node.name.name)) {
				addObjectJob(path.get('value.expression'));
			}
		},
		VariableDeclarator: (path) => {
			variableDeclarator.set(path.node.id, path.node.init ? [path.get('init')] : []);
		},
		AssignmentExpression: (path) => {
			if (types.isIdentifier(path.node.left) && types.isObjectExpression(path.node.right)) {
				const identifier = path.scope.getBindingIdentifier(path.node.left.name);
				const variable = variableDeclarator.get(identifier);
				const valuePath = path.get('right');

				if (variable) {
					variable.push(valuePath);
				} else {
					variableDeclarator.set(identifier, [valuePath]);
				}
			}
		},
		CallExpression: (path) => {
			const callee = path.node.callee;

			if (
				types.isIdentifier(callee, { name: 'require' }) &&
				!path.scope.getBindingIdentifier(callee.name)
			) {
				path.node.arguments.filter(types.isStringLiteral).forEach((arg) => {
					const moduleId = arg.value;
					const nameSpace = [moduleId];
					let currPath = path;

					do {
						let id = currPath.parent.id;

						if (!id) {
							id = currPath.parent.left;

							if (id) {
								id = path.scope.getBindingIdentifier(id.name) || id;
							} else {
								if (types.isIdentifier(currPath.parent.property)) {
									nameSpace.push(currPath.parent.property.name);
								}

								currPath = currPath.parentPath;
								continue;
							}
						}

						setSpecifier(id, nameSpace);
						break;
					} while (currPath);
				});
			} else if (!tplCallee.has(callee) && isStylePath(path.get('callee'))) {
				path.get('arguments').forEach((arg) => {
					addObjectJob(arg.isFunction() ? arg.get('body') : arg);
				});
			}
		},
		TaggedTemplateExpression: (path) => {
			if (isStylePath(path.get('tag'))) {
				tplLiteral.add(path.node.quasi);

				if (path.node.tag.callee) {
					tplCallee.add(path.node.tag.callee);
				}
			}
		},
	};

	traverse(ast, visitor);
	jobs.forEach((job) => job());

	const objLiteralStyles = Array.from(objLiteral).map((endNode) => {
		const objectSyntax = require('./object-syntax');
		let startNode = endNode;

		if (startNode.leadingComments && startNode.leadingComments.length) {
			startNode = startNode.leadingComments[0];
		}

		let startIndex = startNode.start;
		const before = source.slice(startNode.start - startNode.loc.start.column, startNode.start);

		if (/^\s+$/.test(before)) {
			startIndex -= before.length;
		}

		return {
			startIndex,
			endIndex: endNode.end,
			skipConvert: true,
			content: source,
			opts: {
				node: endNode,
			},
			syntax: objectSyntax,
			lang: 'object-literal',
		};
	});

	const tplLiteralStyles = [];

	Array.from(tplLiteral).forEach((node) => {
		if (
			objLiteralStyles.some((style) => style.startIndex <= node.end && node.start < style.endIndex)
		) {
			return;
		}

		const quasis = node.quasis.map((node) => ({
			start: node.start,
			end: node.end,
		}));
		const style = {
			startIndex: quasis[0].start,
			endIndex: quasis[quasis.length - 1].end,
			content: getTemplate(node, source),
		};

		if (node.expressions.length) {
			const expressions = node.expressions.map((node) => ({
				start: node.start,
				end: node.end,
			}));

			style.syntax = loadSyntax(opts, __dirname);
			style.lang = 'template-literal';
			style.opts = {
				quasis,
				expressions,
			};
		} else {
			style.lang = 'css';
		}

		let parent = null;
		let targetStyles = tplLiteralStyles;

		while (targetStyles) {
			const target = targetStyles.find(
				(targetStyle) =>
					targetStyle.opts &&
					targetStyle.opts.expressions.some(
						(expr) => expr.start <= style.startIndex && style.endIndex < expr.end,
					),
			);

			if (target) {
				parent = target;
				targetStyles = target.opts.templateLiteralStyles;
			} else {
				break;
			}
		}

		if (parent) {
			const templateLiteralStyles =
				parent.opts.templateLiteralStyles || (parent.opts.templateLiteralStyles = []);

			templateLiteralStyles.push(style);
		} else {
			tplLiteralStyles.push(style);
		}
	});

	return (styles || []).concat(objLiteralStyles).concat(tplLiteralStyles);
}

module.exports = literalParser;
