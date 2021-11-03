import Container, { ContainerProps } from './container.js'

interface AtRuleRaws {
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
   * The space between the at-rule name and its parameters.
   */
  afterName?: string

  /**
   * The symbols between the last parameter and `{` for rules.
   */
  between?: string

  /**
   * Contains `true` if the last child has an (optional) semicolon.
   */
  semicolon?: boolean

  /**
   * The rule’s selector with comments.
   */
  params?: {
    value: string
    raw: string
  }
}

export interface AtRuleProps extends ContainerProps {
  name: string
  params?: string | number
  raws?: AtRuleRaws
}

/**
 * Represents an at-rule.
 *
 * ```js
 * Once (root, { AtRule }) {
 *   let media = new AtRule({ name: 'media', params: 'print' })
 *   media.append(…)
 *   root.append(media)
 * }
 * ```
 *
 * If it’s followed in the CSS by a {} block, this node will have
 * a nodes property representing its children.
 *
 * ```js
 * const root = postcss.parse('@charset "UTF-8"; @media print {}')
 *
 * const charset = root.first
 * charset.type  //=> 'atrule'
 * charset.nodes //=> undefined
 *
 * const media = root.last
 * media.nodes   //=> []
 * ```
 */
export default class AtRule extends Container {
  type: 'atrule'
  raws: AtRuleRaws

  /**
   * The at-rule’s name immediately follows the `@`.
   *
   * ```js
   * const root  = postcss.parse('@media print {}')
   * media.name //=> 'media'
   * const media = root.first
   * ```
   */
  name: string

  /**
   * The at-rule’s parameters, the values that follow the at-rule’s name
   * but precede any {} block.
   *
   * ```js
   * const root  = postcss.parse('@media print, screen {}')
   * const media = root.first
   * media.params //=> 'print, screen'
   * ```
   */
  params: string

  constructor(defaults?: AtRuleProps)
  clone(overrides?: Partial<AtRuleProps>): this
  cloneBefore(overrides?: Partial<AtRuleProps>): this
  cloneAfter(overrides?: Partial<AtRuleProps>): this
}
