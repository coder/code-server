/* normalize-selector v0.1.0 (c) 2014 Kyle Simpson */

(function UMD(name,context,definition){
	if (typeof module !== "undefined" && module.exports) { module.exports = definition(); }
	else if (typeof define === "function" && define.amd) { define(definition); }
	else { context[name] = definition(name,context); }
})("normalizeSelector",this,function DEF(name,context){
	"use strict";

	function normalizeSelector(sel) {

		// save unmatched text, if any
		function saveUnmatched() {
			if (unmatched) {
				// whitespace needed after combinator?
				if (tokens.length > 0 &&
					/^[~+>]$/.test(tokens[tokens.length-1])
				) {
					tokens.push(" ");
				}

				// save unmatched text
				tokens.push(unmatched);
			}
		}

		var tokens = [], match, unmatched, regex, state = [0],
			next_match_idx = 0, prev_match_idx,
			not_escaped_pattern = /(?:[^\\]|(?:^|[^\\])(?:\\\\)+)$/,
			whitespace_pattern = /^\s+$/,
			attribute_nonspecial_pattern = /[^\s=~!^|$*\[\]\(\)]{2}/,
			state_patterns = [
				/\s+|\/\*|["'>~+\[\(]/g, // general
				/\s+|\/\*|["'\[\]\(\)]/g, // [..] set
				/\s+|\/\*|["'\[\]\(\)]/g, // (..) set
				null, // string literal (placeholder)
				/\*\//g // comment
			]
		;

		sel = sel.trim();

		while (true) {
			unmatched = "";

			regex = state_patterns[state[state.length-1]];

			regex.lastIndex = next_match_idx;
			match = regex.exec(sel);

			// matched text to process?
			if (match) {
				prev_match_idx = next_match_idx;
				next_match_idx = regex.lastIndex;

				// collect the previous string chunk not matched before this token
				if (prev_match_idx < next_match_idx - match[0].length) {
					unmatched = sel.substring(prev_match_idx,next_match_idx - match[0].length);
				}

				// need to force a space (possibly skipped
				// previously by the parser)?
				if (
					state[state.length-1] === 1 &&
					attribute_nonspecial_pattern.test(
						tokens[tokens.length-1].substr(-1) +
						unmatched.charAt(0)
					)
				) {
					tokens.push(" ");
				}

				// general, [ ] pair, ( ) pair?
				if (state[state.length-1] < 3) {
					saveUnmatched();

					// starting a [ ] pair?
					if (match[0] === "[") {
						state.push(1);
					}
					// starting a ( ) pair?
					else if (match[0] === "(") {
						state.push(2);
					}
					// starting a string literal?
					else if (/^["']$/.test(match[0])) {
						state.push(3);
						state_patterns[3] = new RegExp(match[0],"g");
					}
					// starting a comment?
					else if (match[0] === "/*") {
						state.push(4);
					}
					// ending a [ ] or ( ) pair?
					else if (/^[\]\)]$/.test(match[0]) && state.length > 0) {
						state.pop();
					}
					// handling whitespace or a combinator?
					else if (/^(?:\s+|[~+>])$/.test(match[0])) {
						// need to insert whitespace before?
						if (tokens.length > 0 &&
							!whitespace_pattern.test(tokens[tokens.length-1]) &&
							state[state.length-1] === 0
						) {
							// add normalized whitespace
							tokens.push(" ");
						}

						// whitespace token we can skip?
						if (whitespace_pattern.test(match[0])) {
							continue;
						}
					}

					// save matched text
					tokens.push(match[0]);
				}
				// otherwise, string literal or comment
				else {
					// save unmatched text
					tokens[tokens.length-1] += unmatched;

					// unescaped terminator to string literal or comment?
					if (not_escaped_pattern.test(tokens[tokens.length-1])) {
						// comment terminator?
						if (state[state.length-1] === 4) {
							// ok to drop comment?
							if (tokens.length < 2 ||
								whitespace_pattern.test(tokens[tokens.length-2])
							) {
								tokens.pop();
							}
							// otherwise, turn comment into whitespace
							else {
								tokens[tokens.length-1] = " ";
							}

							// handled already
							match[0] = "";
						}

						state.pop();
					}

					// append matched text to existing token
					tokens[tokens.length-1] += match[0];
				}
			}
			// otherwise, end of processing (no more matches)
			else {
				unmatched = sel.substr(next_match_idx);
				saveUnmatched();

				break;
			}
		}

		return tokens.join("").trim();
	}

	return normalizeSelector;
});

