import { ProcessOptions } from './postcss.js'
import PreviousMap from './previous-map.js'

export interface FilePosition {
  /**
   * URL for the source file.
   */
  url: string

  /**
   * Absolute path to the source file.
   */
  file?: string

  /**
   * Line in source file.
   */
  line: number

  /**
   * Column in source file.
   */
  column: number

  /**
   * Source code.
   */
  source?: string
}

/**
 * Represents the source CSS.
 *
 * ```js
 * const root  = postcss.parse(css, { from: file })
 * const input = root.source.input
 * ```
 */
export default class Input {
  /**
   * Input CSS source.
   *
   * ```js
   * const input = postcss.parse('a{}', { from: file }).input
   * input.css //=> "a{}"
   * ```
   */
  css: string

  /**
   * The input source map passed from a compilation step before PostCSS
   * (for example, from Sass compiler).
   *
   * ```js
   * root.source.input.map.consumer().sources //=> ['a.sass']
   * ```
   */
  map: PreviousMap

  /**
   * The absolute path to the CSS source file defined
   * with the `from` option.
   *
   * ```js
   * const root = postcss.parse(css, { from: 'a.css' })
   * root.source.input.file //=> '/home/ai/a.css'
   * ```
   */
  file?: string

  /**
   * The unique ID of the CSS source. It will be created if `from` option
   * is not provided (because PostCSS does not know the file path).
   *
   * ```js
   * const root = postcss.parse(css)
   * root.source.input.file //=> undefined
   * root.source.input.id   //=> "<input css 8LZeVF>"
   * ```
   */
  id?: string

  /**
   * The flag to indicate whether or not the source code has Unicode BOM.
   */
  hasBOM: boolean

  /**
   * @param css  Input CSS source.
   * @param opts Process options.
   */
  constructor(css: string, opts?: ProcessOptions)

  /**
   * The CSS source identifier. Contains `Input#file` if the user
   * set the `from` option, or `Input#id` if they did not.
   *
   * ```js
   * const root = postcss.parse(css, { from: 'a.css' })
   * root.source.input.from //=> "/home/ai/a.css"
   *
   * const root = postcss.parse(css)
   * root.source.input.from //=> "<input css 1>"
   * ```
   */
  get from(): string

  /**
   * Reads the input source map and returns a symbol position
   * in the input source (e.g., in a Sass file that was compiled
   * to CSS before being passed to PostCSS).
   *
   * ```js
   * root.source.input.origin(1, 1) //=> { file: 'a.css', line: 3, column: 1 }
   * ```
   *
   * @param line   Line in input CSS.
   * @param column Column in input CSS.
   *
   * @return Position in input source.
   */
  origin(line: number, column: number): FilePosition | false

  /**
   * Converts source offset to line and column.
   *
   * @param offset Source offset.
   */
  fromOffset(offset: number): { line: number; col: number } | null
}
