"use strict";
// The following code is adapted from the the code in eslint.
// License: https://github.com/eslint/eslint/blob/48700fc8408f394887cdedd071b22b757700fdcb/LICENSE
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinarySearchTree = void 0;
const functional_red_black_tree_1 = __importDefault(require("functional-red-black-tree"));
/**
 * A mutable balanced binary search tree that stores (key, value) pairs. The keys are numeric, and must be unique.
 * This is intended to be a generic wrapper around a balanced binary search tree library, so that the underlying implementation
 * can easily be swapped out.
 */
class BinarySearchTree {
    constructor() {
        this.rbTree = functional_red_black_tree_1.default();
    }
    /**
     * Inserts an entry into the tree.
     */
    insert(key, value) {
        const iterator = this.rbTree.find(key);
        if (iterator.valid) {
            this.rbTree = iterator.update(value);
        }
        else {
            this.rbTree = this.rbTree.insert(key, value);
        }
    }
    /**
     * Finds the entry with the largest key less than or equal to the provided key
     * @returns The found entry, or null if no such entry exists.
     */
    findLe(key) {
        const iterator = this.rbTree.le(key);
        return { key: iterator.key, value: iterator.value };
    }
    /**
     * Deletes all of the keys in the interval [start, end)
     */
    deleteRange(start, end) {
        // Exit without traversing the tree if the range has zero size.
        if (start === end) {
            return;
        }
        const iterator = this.rbTree.ge(start);
        while (iterator.valid && iterator.key < end) {
            this.rbTree = this.rbTree.remove(iterator.key);
            iterator.next();
        }
    }
}
exports.BinarySearchTree = BinarySearchTree;
//# sourceMappingURL=BinarySearchTree.js.map