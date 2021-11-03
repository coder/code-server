import Container, { ContainerProps } from './container.js'

interface RuleRaws {
  /**
   * The space symbols before the node. It also stores `*`
   * and `_` symbols before the declaration (IE hack).
   */
  before?: string

  /**
   * The space symbols after the last child of the node to the end of the node.
   */
  after?: string

  /**
   * The symbols between the selector and `{` for rules.
   */
  between?: string

  /**
   * Contains `true` if the last child has an (optional) semicolon.
   */
  semicolon?: boolean

  /**
   * Contains `true` if there is semicolon after rule.
   */
  ownSemicolon?: string

  /**
   * The rule’s selector with comments.
   */
  selector?: {
    value: string
    raw: string
  }
}

export interface RuleProps extends ContainerProps {
  selector?: string
  selectors?: string[]
  raws?: RuleRaws
}

/**
 * Represents a CSS rule: a selector followed by a declaration block.
 *
 * ```js
 * Once (root, { Rule }) {
 *   let a = new Rule({ selector: 'a' })
 *   a.append(…)
 *   root.append(a)
 * }
 * ```
 *
 * ```js
 * const root = postcss.parse('a{}')
 * const rule = root.first
 * rule.type       //=> 'rule'
 * rule.toString() //=> 'a{}'
 * ```
 */
export default class Rule extends Container {
  type: 'rule'
  raws: RuleRaws

  /**
   * The rule’s full selector represented as a string.
   *
   * ```js
   * const root = postcss.parse('a, b { }')
   * const rule = root.first
   * rule.selector //=> 'a, b'
   * ```
   */
  selector: string

  /**
   * An array containing the rule’s individual selectors.
   * Groups of selectors are split at commas.
   *
   * ```js
   * const root = postcss.parse('a, b { }')
   * const rule = root.first
   *
   * rule.selector  //=> 'a, b'
   * rule.selectors //=> ['a', 'b']
   *
   * rule.selectors = ['a', 'strong']
   * rule.selector //=> 'a, strong'
   * ```
   */
  selectors: string[]

  constructor(defaults?: RuleProps)
  clone(overrides?: Partial<RuleProps>): this
  cloneBefore(overrides?: Partial<RuleProps>): this
  cloneAfter(overrides?: Partial<RuleProps>): this
}
