"use strict";
// The following code is adapted from the the code in eslint.
// License: https://github.com/eslint/eslint/blob/48700fc8408f394887cdedd071b22b757700fdcb/LICENSE
Object.defineProperty(exports, "__esModule", { value: true });
exports.OffsetStorage = void 0;
const BinarySearchTree_1 = require("./BinarySearchTree");
/**
 * A class to store information on desired offsets of tokens from each other
 */
class OffsetStorage {
    /**
     * @param tokenInfo a TokenInfo instance
     * @param indentSize The desired size of each indentation level
     * @param indentType The indentation character
     */
    constructor(tokenInfo, indentSize, indentType) {
        this.tokenInfo = tokenInfo;
        this.indentSize = indentSize;
        this.indentType = indentType;
        this.tree = new BinarySearchTree_1.BinarySearchTree();
        this.tree.insert(0, { offset: 0, from: null, force: false });
        this.lockedFirstTokens = new WeakMap();
        this.desiredIndentCache = new WeakMap();
        this.ignoredTokens = new WeakSet();
    }
    getOffsetDescriptor(token) {
        return this.tree.findLe(token.range[0]).value;
    }
    /**
     * Sets the offset column of token B to match the offset column of token A.
     * **WARNING**: This matches a *column*, even if baseToken is not the first token on its line. In
     * most cases, `setDesiredOffset` should be used instead.
     * @param baseToken The first token
     * @param offsetToken The second token, whose offset should be matched to the first token
     */
    matchOffsetOf(baseToken, offsetToken) {
        /*
         * lockedFirstTokens is a map from a token whose indentation is controlled by the "first" option to
         * the token that it depends on. For example, with the `ArrayExpression: first` option, the first
         * token of each element in the array after the first will be mapped to the first token of the first
         * element. The desired indentation of each of these tokens is computed based on the desired indentation
         * of the "first" element, rather than through the normal offset mechanism.
         */
        this.lockedFirstTokens.set(offsetToken, baseToken);
    }
    /**
     * Sets the desired offset of a token.
     *
     * This uses a line-based offset collapsing behavior to handle tokens on the same line.
     * For example, consider the following two cases:
     *
     * (
     *     [
     *         bar
     *     ]
     * )
     *
     * ([
     *     bar
     * ])
     *
     * Based on the first case, it's clear that the `bar` token needs to have an offset of 1 indent level (4 spaces) from
     * the `[` token, and the `[` token has to have an offset of 1 indent level from the `(` token. Since the `(` token is
     * the first on its line (with an indent of 0 spaces), the `bar` token needs to be offset by 2 indent levels (8 spaces)
     * from the start of its line.
     *
     * However, in the second case `bar` should only be indented by 4 spaces. This is because the offset of 1 indent level
     * between the `(` and the `[` tokens gets "collapsed" because the two tokens are on the same line. As a result, the
     * `(` token is mapped to the `[` token with an offset of 0, and the rule correctly decides that `bar` should be indented
     * by 1 indent level from the start of the line.
     *
     * This is useful because rule listeners can usually just call `setDesiredOffset` for all the tokens in the node,
     * without needing to check which lines those tokens are on.
     *
     * Note that since collapsing only occurs when two tokens are on the same line, there are a few cases where non-intuitive
     * behavior can occur. For example, consider the following cases:
     *
     * foo(
     * ).
     *     bar(
     *         baz
     *     )
     *
     * foo(
     * ).bar(
     *     baz
     * )
     *
     * Based on the first example, it would seem that `bar` should be offset by 1 indent level from `foo`, and `baz`
     * should be offset by 1 indent level from `bar`. However, this is not correct, because it would result in `baz`
     * being indented by 2 indent levels in the second case (since `foo`, `bar`, and `baz` are all on separate lines, no
     * collapsing would occur).
     *
     * Instead, the correct way would be to offset `baz` by 1 level from `bar`, offset `bar` by 1 level from the `)`, and
     * offset the `)` by 0 levels from `foo`. This ensures that the offset between `bar` and the `)` are correctly collapsed
     * in the second case.
     *
     * @param token The token
     * @param fromToken The token that `token` should be offset from
     * @param offset The desired indent level
     */
    setDesiredOffset(token, fromToken, offset) {
        this.setDesiredOffsets(token.range, fromToken, offset);
    }
    /**
     * Sets the desired offset of all tokens in a range
     * It's common for node listeners in this file to need to apply the same offset to a large, contiguous range of tokens.
     * Moreover, the offset of any given token is usually updated multiple times (roughly once for each node that contains
     * it). This means that the offset of each token is updated O(AST depth) times.
     * It would not be performant to store and update the offsets for each token independently, because the rule would end
     * up having a time complexity of O(number of tokens * AST depth), which is quite slow for large files.
     *
     * Instead, the offset tree is represented as a collection of contiguous offset ranges in a file. For example, the following
     * list could represent the state of the offset tree at a given point:
     *
     * * Tokens starting in the interval [0, 15) are aligned with the beginning of the file
     * * Tokens starting in the interval [15, 30) are offset by 1 indent level from the `bar` token
     * * Tokens starting in the interval [30, 43) are offset by 1 indent level from the `foo` token
     * * Tokens starting in the interval [43, 820) are offset by 2 indent levels from the `bar` token
     * * Tokens starting in the interval [820, ∞) are offset by 1 indent level from the `baz` token
     *
     * The `setDesiredOffsets` methods inserts ranges like the ones above. The third line above would be inserted by using:
     * `setDesiredOffsets([30, 43], fooToken, 1);`
     *
     * @param range A [start, end] pair. All tokens with range[0] <= token.start < range[1] will have the offset applied.
     * @param fromToken The token that this is offset from
     * @param offset The desired indent level
     * @param force `true` if this offset should not use the normal collapsing behavior. This should almost always be false.
     */
    setDesiredOffsets(range, fromToken, offset = 0, force = false) {
        /*
         * Offset ranges are stored as a collection of nodes, where each node maps a numeric key to an offset
         * descriptor. The tree for the example above would have the following nodes:
         *
         * * key: 0, value: { offset: 0, from: null }
         * * key: 15, value: { offset: 1, from: barToken }
         * * key: 30, value: { offset: 1, from: fooToken }
         * * key: 43, value: { offset: 2, from: barToken }
         * * key: 820, value: { offset: 1, from: bazToken }
         *
         * To find the offset descriptor for any given token, one needs to find the node with the largest key
         * which is <= token.start. To make this operation fast, the nodes are stored in a balanced binary
         * search tree indexed by key.
         */
        const descriptorToInsert = { offset, from: fromToken, force };
        const descriptorAfterRange = this.tree.findLe(range[1]).value;
        const fromTokenIsInRange = fromToken &&
            fromToken.range[0] >= range[0] &&
            fromToken.range[1] <= range[1];
        // this has to be before the delete + insert below or else you'll get into a cycle
        const fromTokenDescriptor = fromTokenIsInRange
            ? this.getOffsetDescriptor(fromToken)
            : null;
        // First, remove any existing nodes in the range from the tree.
        this.tree.deleteRange(range[0] + 1, range[1]);
        // Insert a new node into the tree for this range
        this.tree.insert(range[0], descriptorToInsert);
        /*
         * To avoid circular offset dependencies, keep the `fromToken` token mapped to whatever it was mapped to previously,
         * even if it's in the current range.
         */
        if (fromTokenIsInRange) {
            this.tree.insert(fromToken.range[0], fromTokenDescriptor);
            this.tree.insert(fromToken.range[1], descriptorToInsert);
        }
        /*
         * To avoid modifying the offset of tokens after the range, insert another node to keep the offset of the following
         * tokens the same as it was before.
         */
        this.tree.insert(range[1], descriptorAfterRange);
    }
    /**
     * Gets the desired indent of a token
     * @returns The desired indent of the token
     */
    getDesiredIndent(token) {
        if (!this.desiredIndentCache.has(token)) {
            if (this.ignoredTokens.has(token)) {
                /*
                 * If the token is ignored, use the actual indent of the token as the desired indent.
                 * This ensures that no errors are reported for this token.
                 */
                this.desiredIndentCache.set(token, this.tokenInfo.getTokenIndent(token));
            }
            else if (this.lockedFirstTokens.has(token)) {
                const firstToken = this.lockedFirstTokens.get(token);
                this.desiredIndentCache.set(token, 
                // (indentation for the first element's line)
                this.getDesiredIndent(this.tokenInfo.getFirstTokenOfLine(firstToken)) +
                    // (space between the start of the first element's line and the first element)
                    this.indentType.repeat(firstToken.loc.start.column -
                        this.tokenInfo.getFirstTokenOfLine(firstToken).loc.start.column));
            }
            else {
                const offsetInfo = this.getOffsetDescriptor(token);
                const offset = offsetInfo.from &&
                    offsetInfo.from.loc.start.line === token.loc.start.line &&
                    !/^\s*?\n/u.test(token.value) &&
                    !offsetInfo.force
                    ? 0
                    : offsetInfo.offset * this.indentSize;
                this.desiredIndentCache.set(token, (offsetInfo.from ? this.getDesiredIndent(offsetInfo.from) : '') +
                    this.indentType.repeat(offset));
            }
        }
        return this.desiredIndentCache.get(token);
    }
    /**
     * Ignores a token, preventing it from being reported.
     */
    ignoreToken(token) {
        if (this.tokenInfo.isFirstTokenOfLine(token)) {
            this.ignoredTokens.add(token);
        }
    }
    getFirstDependency(token) {
        return this.getOffsetDescriptor(token).from;
    }
}
exports.OffsetStorage = OffsetStorage;
//# sourceMappingURL=OffsetStorage.js.map