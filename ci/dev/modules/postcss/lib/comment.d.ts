import Node, { NodeProps } from './node.js'

interface CommentRaws {
  /**
   * The space symbols before the node.
   */
  before?: string

  /**
   * The space symbols between `/*` and the comment’s text.
   */
  left?: string

  /**
   * The space symbols between the comment’s text.
   */
  right?: string
}

export interface CommentProps extends NodeProps {
  text: string
  raws?: CommentRaws
}

/**
 * Represents a comment between declarations or statements (rule and at-rules).
 *
 * ```js
 * Once (root, { Comment }) {
 *   let note = new Comment({ text: 'Note: …' })
 *   root.append(note)
 * }
 * ```
 *
 * Comments inside selectors, at-rule parameters, or declaration values
 * will be stored in the `raws` properties explained above.
 */
export default class Comment extends Node {
  type: 'comment'
  raws: CommentRaws

  /**
   * The comment's text.
   */
  text: string

  constructor(defaults?: CommentProps)
  clone(overrides?: Partial<CommentProps>): this
  cloneBefore(overrides?: Partial<CommentProps>): this
  cloneAfter(overrides?: Partial<CommentProps>): this
}
