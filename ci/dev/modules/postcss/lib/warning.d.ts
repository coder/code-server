import Node from './node.js'

export interface WarningOptions {
  /**
   * CSS node that caused the warning.
   */
  node?: Node

  /**
   * Word in CSS source that caused the warning.
   */
  word?: string

  /**
   * Index in CSS node string that caused the warning.
   */
  index?: number

  /**
   * Name of the plugin that created this warning. `Result#warn` fills
   * this property automatically.
   */
  plugin?: string
}

/**
 * Represents a plugin’s warning. It can be created using `Node#warn`.
 *
 * ```js
 * if (decl.important) {
 *   decl.warn(result, 'Avoid !important', { word: '!important' })
 * }
 * ```
 */
export default class Warning {
  /**
   * Type to filter warnings from `Result#messages`.
   * Always equal to `"warning"`.
   */
  type: 'warning'

  /**
   * The warning message.
   *
   * ```js
   * warning.text //=> 'Try to avoid !important'
   * ```
   */
  text: string

  /**
   * The name of the plugin that created this warning.
   * When you call `Node#warn` it will fill this property automatically.
   *
   * ```js
   * warning.plugin //=> 'postcss-important'
   * ```
   */
  plugin: string

  /**
   * Contains the CSS node that caused the warning.
   *
   * ```js
   * warning.node.toString() //=> 'color: white !important'
   * ```
   */
  node: Node

  /**
   * Line in the input file with this warning’s source.
   *
   * ```js
   * warning.line //=> 5
   * ```
   */
  line: number

  /**
   * Column in the input file with this warning’s source.
   *
   * ```js
   * warning.column //=> 6
   * ```
   */
  column: number

  /**
   * @param text Warning message.
   * @param opts Warning options.
   */
  constructor(text: string, opts?: WarningOptions)

  /**
   * Returns a warning position and message.
   *
   * ```js
   * warning.toString() //=> 'postcss-lint:a.css:10:14: Avoid !important'
   * ```
   *
   * @return Warning position and message.
   */
  toString(): string
}
