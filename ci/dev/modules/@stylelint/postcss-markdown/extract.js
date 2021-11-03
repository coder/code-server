"use strict";

const remark = require("remark");
const findAllAfter = require("unist-util-find-all-after");

function mdParser (source, opts, result) {
	const htmlInMd = opts.syntax.config.htmlInMd;
	if (!result && (htmlInMd == null || htmlInMd)) {
		result = require("postcss-html/extract")(source, opts, []);
	}
	const ast = remark().parse(source);
	const blocks = findAllAfter(ast, 0, (node) => (
		node.type === "code"
	)).map((block) => {
		if (result && (!block.lang || !/^(?:[sx]?html?|[sx]ht)$/i.test(block.lang))) {
			result = result.filter(styleHtm => {
				return styleHtm.startIndex >= block.position.end.offset ||
					styleHtm.startIndex + styleHtm.content.length <= block.position.start.offset;
			});
		}
		if (block.lang && /^(?:(?:\w*c)|le|wx|sa?|sugar)ss$/i.test(block.lang)) {
			let startIndex = source.indexOf(block.lang, block.position.start.offset) + block.lang.length;
			if (block.value) {
				startIndex = source.indexOf(block.value, startIndex);
			} else {
				startIndex = source.indexOf("\n", startIndex) + 1;
			}
			return {
				startIndex: startIndex,
				lang: block.lang.toLowerCase(),
				isMarkdown: true,
				content: source.slice(startIndex, block.position.end.offset).replace(/[ \t]*`*$/, ""),
			};
		}
	}).filter(Boolean);
	if (result) {
		return result.concat(blocks);
	} else {
		return blocks;
	}
};
module.exports = mdParser;
