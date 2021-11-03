import Container, { ContainerProps } from './container.js'
import { ProcessOptions } from './postcss.js'
import Result from './result.js'

interface RootRaws {
  /**
   * The space symbols after the last child to the end of file.
   */
  after?: string

  /**
   * Is the last child has an (optional) semicolon.
   */
  semicolon?: boolean
}

export interface RootProps extends ContainerProps {
  raws?: RootRaws
}

/**
 * Represents a CSS file and contains all its parsed nodes.
 *
 * ```js
 * const root = postcss.parse('a{color:black} b{z-index:2}')
 * root.type         //=> 'root'
 * root.nodes.length //=> 2
 * ```
 */
export default class Root extends Container {
  type: 'root'
  parent: undefined
  raws: RootRaws

  constructor(defaults?: RootProps)

  /**
   * Returns a `Result` instance representing the root’s CSS.
   *
   * ```js
   * const root1 = postcss.parse(css1, { from: 'a.css' })
   * const root2 = postcss.parse(css2, { from: 'b.css' })
   * root1.append(root2)
   * const result = root1.toResult({ to: 'all.css', map: true })
   * ```
   *
   * @param opts Options.
   * @return Result with current root’s CSS.
   */
  toResult(options?: ProcessOptions): Result
}
