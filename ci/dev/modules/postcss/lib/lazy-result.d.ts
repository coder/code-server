import Result, { Message, ResultOptions } from './result.js'
import { SourceMap } from './postcss.js'
import Processor from './processor.js'
import Warning from './warning.js'
import Root from './root.js'

/**
 * A Promise proxy for the result of PostCSS transformations.
 *
 * A `LazyResult` instance is returned by `Processor#process`.
 *
 * ```js
 * const lazy = postcss([autoprefixer]).process(css)
 * ```
 */
export default class LazyResult implements PromiseLike<Result> {
  /**
   * Processes input CSS through synchronous and asynchronous plugins
   * and calls `onFulfilled` with a Result instance. If a plugin throws
   * an error, the `onRejected` callback will be executed.
   *
   * It implements standard Promise API.
   *
   * ```js
   * postcss([autoprefixer]).process(css, { from: cssPath }).then(result => {
   *   console.log(result.css)
   * })
   * ```
   */
  then: Promise<Result>['then']

  /**
   * Processes input CSS through synchronous and asynchronous plugins
   * and calls onRejected for each error thrown in any plugin.
   *
   * It implements standard Promise API.
   *
   * ```js
   * postcss([autoprefixer]).process(css).then(result => {
   *   console.log(result.css)
   * }).catch(error => {
   *   console.error(error)
   * })
   * ```
   */
  catch: Promise<Result>['catch']

  /**
   * Processes input CSS through synchronous and asynchronous plugins
   * and calls onFinally on any error or when all plugins will finish work.
   *
   * It implements standard Promise API.
   *
   * ```js
   * postcss([autoprefixer]).process(css).finally(() => {
   *   console.log('processing ended')
   * })
   * ```
   */
  finally: Promise<Result>['finally']

  /**
   * @param processor Processor used for this transformation.
   * @param css       CSS to parse and transform.
   * @param opts      Options from the `Processor#process` or `Root#toResult`.
   */
  constructor(processor: Processor, css: string, opts: ResultOptions)

  /**
   * Returns the default string description of an object.
   * Required to implement the Promise interface.
   */
  get [Symbol.toStringTag](): string

  /**
   * Returns a `Processor` instance, which will be used
   * for CSS transformations.
   */
  get processor(): Processor

  /**
   * Options from the `Processor#process` call.
   */
  get opts(): ResultOptions

  /**
   * Processes input CSS through synchronous plugins, converts `Root`
   * to a CSS string and returns `Result#css`.
   *
   * This property will only work with synchronous plugins.
   * If the processor contains any asynchronous plugins
   * it will throw an error. This is why this method is only
   * for debug purpose, you should always use `LazyResult#then`.
   */
  get css(): string

  /**
   * An alias for the `css` property. Use it with syntaxes
   * that generate non-CSS output.
   *
   * This property will only work with synchronous plugins.
   * If the processor contains any asynchronous plugins
   * it will throw an error. This is why this method is only
   * for debug purpose, you should always use `LazyResult#then`.
   */
  get content(): string

  /**
   * Processes input CSS through synchronous plugins
   * and returns `Result#map`.
   *
   * This property will only work with synchronous plugins.
   * If the processor contains any asynchronous plugins
   * it will throw an error. This is why this method is only
   * for debug purpose, you should always use `LazyResult#then`.
   */
  get map(): SourceMap

  /**
   * Processes input CSS through synchronous plugins
   * and returns `Result#root`.
   *
   * This property will only work with synchronous plugins. If the processor
   * contains any asynchronous plugins it will throw an error.
   *
   * This is why this method is only for debug purpose,
   * you should always use `LazyResult#then`.
   */
  get root(): Root

  /**
   * Processes input CSS through synchronous plugins
   * and returns `Result#messages`.
   *
   * This property will only work with synchronous plugins. If the processor
   * contains any asynchronous plugins it will throw an error.
   *
   * This is why this method is only for debug purpose,
   * you should always use `LazyResult#then`.
   */
  get messages(): Message[]

  /**
   * Processes input CSS through synchronous plugins
   * and calls `Result#warnings`.
   *
   * @return Warnings from plugins.
   */
  warnings(): Warning[]

  /**
   * Alias for the `LazyResult#css` property.
   *
   * ```js
   * lazy + '' === lazy.css
   * ```
   *
   * @return Output CSS.
   */
  toString(): string

  /**
   * Run plugin in sync way and return `Result`.
   *
   * @return Result with output content.
   */
  sync(): Result

  /**
   * Run plugin in async way and return `Result`.
   *
   * @return Result with output content.
   */
  async(): Promise<Result>
}
