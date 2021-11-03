"use strict";
const PostCssRoot = require("postcss/lib/root");
class Document extends PostCssRoot {
	toString (stringifier) {
		return super.toString(stringifier || {
			stringify: require("./stringify"),
		});
	}

	each (callback) {
		const result = this.nodes.map(node => node.each(callback));
		return result.every(result => result !== false) && result.pop();
	}

	append () {
		this.last.append.apply(
			this.last,
			Array.from(arguments)
		);
		return this;
	}

	prepend () {
		this.first.prepend.apply(
			this.first,
			Array.from(arguments)
		);
		return this;
	}

	insertBefore (exist, add) {
		exist.prepend(add);
		return this;
	}

	insertAfter (exist, add) {
		exist.append(add);
		return this;
	}
}
module.exports = Document;
