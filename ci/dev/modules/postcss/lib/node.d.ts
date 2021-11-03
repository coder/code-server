import Declaration, { DeclarationProps } from './declaration.js'
import Comment, { CommentProps } from './comment.js'
import { Stringifier, Syntax } from './postcss.js'
import AtRule, { AtRuleProps } from './at-rule.js'
import Rule, { RuleProps } from './rule.js'
import { WarningOptions } from './warning.js'
import CssSyntaxError from './css-syntax-error.js'
import Container from './container.js'
import Result from './result.js'
import Input from './input.js'
import Root from './root.js'

export type ChildNode = AtRule | Rule | Declaration | Comment

export type AnyNode = AtRule | Rule | Declaration | Comment | Root

export type ChildProps =
  | AtRuleProps
  | RuleProps
  | DeclarationProps
  | CommentProps

export interface Position {
  /**
   * Source offset in file. It starts from 0.
   */
  offset: number

  /**
   * Source line in file. In contrast to `offset` it starts from 1.
   */
  column: number

  /**
   * Source column in file.
   */
  line: number
}

export interface Source {
  /**
   * The file source of the node.
   */
  input: Input
  /**
   * The starting position of the node’s source.
   */
  start?: Position
  /**
   * The ending position of the node's source.
   */
  end?: Position
}

export interface NodeProps {
  source?: Source
}

interface NodeErrorOptions {
  /**
   * Plugin name that created this error. PostCSS will set it automatically.
   */
  plugin?: string
  /**
   * A word inside a node's string, that should be highlighted as source
   * of error.
   */
  word?: string
  /**
   * An index inside a node's string that should be highlighted as source
   * of error.
   */
  index?: number
}

/**
 * All node classes inherit the following common methods.
 *
 * You should not extend this classes to create AST for selector or value
 * parser.
 */
export default abstract class Node {
  /**
   * tring representing the node’s type. Possible values are `root`, `atrule`,
   * `rule`, `decl`, or `comment`.
   *
   * ```js
   * new Declaration({ prop: 'color', value: 'black' }).type //=> 'decl'
   * ```
   */
  type: string

  /**
   * The node’s parent node.
   *
   * ```js
   * root.nodes[0].parent === root
   * ```
   */
  parent: Container | undefined

  /**
   * The input source of the node.
   *
   * The property is used in source map generation.
   *
   * If you create a node manually (e.g., with `postcss.decl()`),
   * that node will not have a `source` property and will be absent
   * from the source map. For this reason, the plugin developer should
   * consider cloning nodes to create new ones (in which case the new node’s
   * source will reference the original, cloned node) or setting
   * the `source` property manually.
   *
   * ```js
   * decl.source.input.from //=> '/home/ai/a.sass'
   * decl.source.start      //=> { line: 10, column: 2 }
   * decl.source.end        //=> { line: 10, column: 12 }
   * ```
   *
   * ```js
   * // Bad
   * const prefixed = postcss.decl({
   *   prop: '-moz-' + decl.prop,
   *   value: decl.value
   * })
   *
   * // Good
   * const prefixed = decl.clone({ prop: '-moz-' + decl.prop })
   * ```
   *
   * ```js
   * if (atrule.name === 'add-link') {
   *   const rule = postcss.rule({ selector: 'a', source: atrule.source })
   *   atrule.parent.insertBefore(atrule, rule)
   * }
   * ```
   */
  source?: Source

  /**
   * Information to generate byte-to-byte equal node string as it was
   * in the origin input.
   *
   * Every parser saves its own properties,
   * but the default CSS parser uses:
   *
   * * `before`: the space symbols before the node. It also stores `*`
   *   and `_` symbols before the declaration (IE hack).
   * * `after`: the space symbols after the last child of the node
   *   to the end of the node.
   * * `between`: the symbols between the property and value
   *   for declarations, selector and `{` for rules, or last parameter
   *   and `{` for at-rules.
   * * `semicolon`: contains true if the last child has
   *   an (optional) semicolon.
   * * `afterName`: the space between the at-rule name and its parameters.
   * * `left`: the space symbols between `/*` and the comment’s text.
   * * `right`: the space symbols between the comment’s text
   *   and <code>*&#47;</code>.
   * * `important`: the content of the important statement,
   *   if it is not just `!important`.
   *
   * PostCSS cleans selectors, declaration values and at-rule parameters
   * from comments and extra spaces, but it stores origin content in raws
   * properties. As such, if you don’t change a declaration’s value,
   * PostCSS will use the raw value with comments.
   *
   * ```js
   * const root = postcss.parse('a {\n  color:black\n}')
   * root.first.first.raws //=> { before: '\n  ', between: ':' }
   * ```
   */
  raws: any

  /**
   * @param defaults Value for node properties.
   */
  constructor(defaults?: object)

  /**
   * Returns a `CssSyntaxError` instance containing the original position
   * of the node in the source, showing line and column numbers and also
   * a small excerpt to facilitate debugging.
   *
   * If present, an input source map will be used to get the original position
   * of the source, even from a previous compilation step
   * (e.g., from Sass compilation).
   *
   * This method produces very useful error messages.
   *
   * ```js
   * if (!variables[name]) {
   *   throw decl.error(`Unknown variable ${name}`, { word: name })
   *   // CssSyntaxError: postcss-vars:a.sass:4:3: Unknown variable $black
   *   //   color: $black
   *   // a
   *   //          ^
   *   //   background: white
   * }
   * ```
   *
   * @param message Error description.
   * @param opts    Options.
   *
   * @return Error object to throw it.
   */
  error(message: string, options?: NodeErrorOptions): CssSyntaxError

  /**
   * This method is provided as a convenience wrapper for `Result#warn`.
   *
   * ```js
   *   Declaration: {
   *     bad: (decl, { result }) => {
   *       decl.warn(result, 'Deprecated property bad')
   *     }
   *   }
   * ```
   *
   * @param result The `Result` instance that will receive the warning.
   * @param text   Warning message.
   * @param opts   Warning Options.
   *
   * @return Created warning object.
   */
  warn(result: Result, text: string, opts?: WarningOptions): void

  /**
   * Removes the node from its parent and cleans the parent properties
   * from the node and its children.
   *
   * ```js
   * if (decl.prop.match(/^-webkit-/)) {
   *   decl.remove()
   * }
   * ```
   *
   * @return Node to make calls chain.
   */
  remove(): this

  /**
   * Returns a CSS string representing the node.
   *
   * ```js
   * new Rule({ selector: 'a' }).toString() //=> "a {}"
   * ```
   *
   * @param stringifier A syntax to use in string generation.
   * @return CSS string of this node.
   */
  toString(stringifier?: Stringifier | Syntax): string

  /**
   * Returns an exact clone of the node.
   *
   * The resulting cloned node and its (cloned) children will retain
   * code style properties.
   *
   * ```js
   * decl.raws.before    //=> "\n  "
   * const cloned = decl.clone({ prop: '-moz-' + decl.prop })
   * cloned.raws.before  //=> "\n  "
   * cloned.toString()   //=> -moz-transform: scale(0)
   * ```
   *
   * @param overrides New properties to override in the clone.
   * @return Clone of the node.
   */
  clone(overrides?: object): this

  /**
   * Shortcut to clone the node and insert the resulting cloned node
   * before the current node.
   *
   * ```js
   * decl.cloneBefore({ prop: '-moz-' + decl.prop })
   * ```
   *
   * @param overrides Mew properties to override in the clone.
   *
   * @return New node
   */
  cloneBefore(overrides?: object): this

  /**
   * Shortcut to clone the node and insert the resulting cloned node
   * after the current node.
   *
   * @param overrides New properties to override in the clone.
   * @return New node.
   */
  cloneAfter(overrides?: object): this

  /**
   * Inserts node(s) before the current node and removes the current node.
   *
   * ```js
   * AtRule: {
   *   mixin: atrule => {
   *     atrule.replaceWith(mixinRules[atrule.params])
   *   }
   * }
   * ```
   *
   * @param nodes Mode(s) to replace current one.
   * @return Current node to methods chain.
   */
  replaceWith(
    ...nodes: (ChildNode | ChildProps | ChildNode[] | ChildProps[])[]
  ): this

  /**
   * Returns the next child of the node’s parent.
   * Returns `undefined` if the current node is the last child.
   *
   * ```js
   * if (comment.text === 'delete next') {
   *   const next = comment.next()
   *   if (next) {
   *     next.remove()
   *   }
   * }
   * ```
   *
   * @return Next node.
   */
  next(): ChildNode | undefined

  /**
   * Returns the previous child of the node’s parent.
   * Returns `undefined` if the current node is the first child.
   *
   * ```js
   * const annotation = decl.prev()
   * if (annotation.type === 'comment') {
   *   readAnnotation(annotation.text)
   * }
   * ```
   *
   * @return Previous node.
   */
  prev(): ChildNode | undefined

  /**
   * Insert new node before current node to current node’s parent.
   *
   * Just alias for `node.parent.insertBefore(node, add)`.
   *
   * ```js
   * decl.before('content: ""')
   * ```
   *
   * @param newNode New node.
   * @return This node for methods chain.
   */
  before(newNode: Node | ChildProps | string | Node[]): this

  /**
   * Insert new node after current node to current node’s parent.
   *
   * Just alias for `node.parent.insertAfter(node, add)`.
   *
   * ```js
   * decl.after('color: black')
   * ```
   *
   * @param newNode New node.
   * @return This node for methods chain.
   */
  after(newNode: Node | ChildProps | string | Node[]): this

  /**
   * Finds the Root instance of the node’s tree.
   *
   * ```js
   * root.nodes[0].nodes[0].root() === root
   * ```
   *
   * @return Root parent.
   */
  root(): Root

  /**
   * Returns a `Node#raws` value. If the node is missing
   * the code style property (because the node was manually built or cloned),
   * PostCSS will try to autodetect the code style property by looking
   * at other nodes in the tree.
   *
   * ```js
   * const root = postcss.parse('a { background: white }')
   * root.nodes[0].append({ prop: 'color', value: 'black' })
   * root.nodes[0].nodes[1].raws.before   //=> undefined
   * root.nodes[0].nodes[1].raw('before') //=> ' '
   * ```
   *
   * @param prop        Name of code style property.
   * @param defaultType Name of default value, it can be missed
   *                    if the value is the same as prop.
   * @return {string} Code style value.
   */
  raw(prop: string, defaultType?: string): string

  /**
   * Clear the code style properties for the node and its children.
   *
   * ```js
   * node.raws.before  //=> ' '
   * node.cleanRaws()
   * node.raws.before  //=> undefined
   * ```
   *
   * @param keepBetween Keep the `raws.between` symbols.
   */
  cleanRaws(keepBetween?: boolean): void

  /**
   * Fix circular links on `JSON.stringify()`.
   *
   * @return Cleaned object.
   */
  toJSON(): object

  /**
   * Convert string index to line/column.
   *
   * @param index The symbol number in the node’s string.
   * @return Symbol position in file.
   */
  positionInside(index: number): Position
}
