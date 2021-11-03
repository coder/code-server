import { SourceMapGenerator, RawSourceMap } from 'source-map'

import Node, {
  Position,
  Source,
  ChildNode,
  NodeErrorOptions,
  NodeProps,
  ChildProps,
  AnyNode
} from './node.js'
import Declaration, { DeclarationProps } from './declaration.js'
import Root, { RootProps } from './root.js'
import Comment, { CommentProps } from './comment.js'
import AtRule, { AtRuleProps } from './at-rule.js'
import Result, { Message } from './result.js'
import LazyResult from './lazy-result.js'
import Rule, { RuleProps } from './rule.js'
import Container, { ContainerProps } from './container.js'
import Warning, { WarningOptions } from './warning.js'
import Input, { FilePosition } from './input.js'
import CssSyntaxError from './css-syntax-error.js'
import list, { List } from './list.js'
import Processor from './processor.js'

export {
  WarningOptions,
  FilePosition,
  Position,
  Source,
  ChildNode,
  AnyNode,
  Message,
  NodeErrorOptions,
  NodeProps,
  DeclarationProps,
  ContainerProps,
  CommentProps,
  RuleProps,
  ChildProps,
  AtRuleProps,
  RootProps,
  Warning,
  CssSyntaxError,
  Node,
  Container,
  list,
  Declaration,
  Comment,
  AtRule,
  Rule,
  Root,
  Result,
  LazyResult,
  Input
}

export type SourceMap = SourceMapGenerator & {
  toJSON(): RawSourceMap
}

export type Helpers = { result: Result; postcss: Postcss } & Postcss

type RootProcessor = (root: Root, helper: Helpers) => Promise<void> | void
type DeclarationProcessor = (
  decl: Declaration,
  helper: Helpers
) => Promise<void> | void
type RuleProcessor = (rule: Rule, helper: Helpers) => Promise<void> | void
type AtRuleProcessor = (atRule: AtRule, helper: Helpers) => Promise<void> | void
type CommentProcessor = (
  comment: Comment,
  helper: Helpers
) => Promise<void> | void

interface Processors {
  /**
   * Will be called on `Root` node once.
   */
  Once?: RootProcessor

  /**
   * Will be called on `Root` node once, when all children will be processed.
   */
  OnceExit?: RootProcessor

  /**
   * Will be called on `Root` node.
   *
   * Will be called again on children changes.
   */
  Root?: RootProcessor

  /**
   * Will be called on `Root` node, when all children will be processed.
   *
   * Will be called again on children changes.
   */
  RootExit?: RootProcessor

  /**
   * Will be called on all `Declaration` nodes after listeners
   * for `Declaration` event.
   *
   * Will be called again on node or children changes.
   */
  Declaration?: DeclarationProcessor | { [prop: string]: DeclarationProcessor }

  /**
   * Will be called on all `Declaration` nodes.
   *
   * Will be called again on node or children changes.
   */
  DeclarationExit?:
    | DeclarationProcessor
    | { [prop: string]: DeclarationProcessor }

  /**
   * Will be called on all `Rule` nodes.
   *
   * Will be called again on node or children changes.
   */
  Rule?: RuleProcessor

  /**
   * Will be called on all `Rule` nodes, when all children will be processed.
   *
   * Will be called again on node or children changes.
   */
  RuleExit?: RuleProcessor

  /**
   * Will be called on all`AtRule` nodes.
   *
   * Will be called again on node or children changes.
   */
  AtRule?: AtRuleProcessor | { [name: string]: AtRuleProcessor }

  /**
   * Will be called on all `AtRule` nodes, when all children will be processed.
   *
   * Will be called again on node or children changes.
   */
  AtRuleExit?: AtRuleProcessor | { [name: string]: AtRuleProcessor }

  /**
   * Will be called on all `Comment` nodes.
   *
   * Will be called again on node or children changes.
   */
  Comment?: CommentProcessor

  /**
   * Will be called on all `Comment` nodes after listeners
   * for `Comment` event.
   *
   * Will be called again on node or children changes.
   */
  CommentExit?: CommentProcessor

  /**
   * Will be called when all other listeners processed the document.
   *
   * This listener will not be called again.
   */
  Exit?: RootProcessor
}

export interface Plugin extends Processors {
  postcssPlugin: string
  prepare?: (result: Result) => Processors
}

export interface PluginCreator<PluginOptions> {
  (opts?: PluginOptions): Plugin | Processor
  postcss: true
}

export interface Transformer extends TransformCallback {
  postcssPlugin: string
  postcssVersion: string
}

export interface TransformCallback {
  (root: Root, result: Result): Promise<void> | void
}

export interface OldPlugin<T> extends Transformer {
  (opts?: T): Transformer
  postcss: Transformer
}

export type AcceptedPlugin =
  | Plugin
  | PluginCreator<any>
  | OldPlugin<any>
  | TransformCallback
  | {
      postcss: TransformCallback | Processor
    }
  | Processor

export interface Parser {
  (
    css: string | { toString(): string },
    opts?: Pick<ProcessOptions, 'map' | 'from'>
  ): Root
}

export interface Builder {
  (part: string, node?: AnyNode, type?: 'start' | 'end'): void
}

export interface Stringifier {
  (node: AnyNode, builder: Builder): void
}

export interface JSONHydrator {
  (data: object[]): Node[]
  (data: object): Node
}

export interface Syntax {
  /**
   * Function to generate AST by string.
   */
  parse?: Parser

  /**
   * Class to generate string by AST.
   */
  stringify?: Stringifier
}

export interface SourceMapOptions {
  /**
   * Indicates that the source map should be embedded in the output CSS
   * as a Base64-encoded comment. By default, it is `true`.
   * But if all previous maps are external, not inline, PostCSS will not embed
   * the map even if you do not set this option.
   *
   * If you have an inline source map, the result.map property will be empty,
   * as the source map will be contained within the text of `result.css`.
   */
  inline?: boolean

  /**
   * Source map content from a previous processing step (e.g., Sass).
   *
   * PostCSS will try to read the previous source map
   * automatically (based on comments within the source CSS), but you can use
   * this option to identify it manually.
   *
   * If desired, you can omit the previous map with prev: `false`.
   */
  prev?: string | boolean | object | ((file: string) => string)

  /**
   * Indicates that PostCSS should set the origin content (e.g., Sass source)
   * of the source map. By default, it is true. But if all previous maps do not
   * contain sources content, PostCSS will also leave it out even if you
   * do not set this option.
   */
  sourcesContent?: boolean

  /**
   * Indicates that PostCSS should add annotation comments to the CSS.
   * By default, PostCSS will always add a comment with a path
   * to the source map. PostCSS will not add annotations to CSS files
   * that do not contain any comments.
   *
   * By default, PostCSS presumes that you want to save the source map as
   * `opts.to + '.map'` and will use this path in the annotation comment.
   * A different path can be set by providing a string value for annotation.
   *
   * If you have set `inline: true`, annotation cannot be disabled.
   */
  annotation?: string | boolean | ((file: string, root: Root) => string)

  /**
   * Override `from` in map’s sources.
   */
  from?: string

  /**
   * Use absolute path in generated source map.
   */
  absolute?: boolean
}

export interface ProcessOptions {
  /**
   * The path of the CSS source file. You should always set `from`,
   * because it is used in source map generation and syntax error messages.
   */
  from?: string

  /**
   * The path where you'll put the output CSS file. You should always set `to`
   * to generate correct source maps.
   */
  to?: string

  /**
   * Function to generate AST by string.
   */
  parser?: Syntax | Parser

  /**
   * Class to generate string by AST.
   */
  stringifier?: Syntax | Stringifier

  /**
   * Object with parse and stringify.
   */
  syntax?: Syntax

  /**
   * Source map options
   */
  map?: SourceMapOptions | boolean
}

export interface Postcss {
  /**
   * Create a new `Processor` instance that will apply `plugins`
   * as CSS processors.
   *
   * ```js
   * let postcss = require('postcss')
   *
   * postcss(plugins).process(css, { from, to }).then(result => {
   *   console.log(result.css)
   * })
   * ```
   *
   * @param plugins PostCSS plugins.
   * @return Processor to process multiple CSS.
   */
  (plugins?: AcceptedPlugin[]): Processor
  (...plugins: AcceptedPlugin[]): Processor

  /**
   * Default function to convert a node tree into a CSS string.
   */
  stringify: Stringifier

  /**
   * Parses source css and returns a new `Root` node,
   * which contains the source CSS nodes.
   *
   * ```js
   * // Simple CSS concatenation with source map support
   * const root1 = postcss.parse(css1, { from: file1 })
   * const root2 = postcss.parse(css2, { from: file2 })
   * root1.append(root2).toResult().css
   * ```
   */
  parse: Parser

  /**
   * Rehydrate a JSON AST (from `Node#toJSON`) back into the AST classes.
   *
   * ```js
   * const json = root.toJSON()
   * // save to file, send by network, etc
   * const root2  = postcss.fromJSON(json)
   * ```
   */
  fromJSON: JSONHydrator

  /**
   * Contains the `list` module.
   */
  list: List

  /**
   * Creates a new `Comment` node.
   *
   * @param defaults Properties for the new node.
   * @return New comment node
   */
  comment(defaults?: CommentProps): Comment

  /**
   * Creates a new `AtRule` node.
   *
   * @param defaults Properties for the new node.
   * @return New at-rule node.
   */
  atRule(defaults?: AtRuleProps): AtRule

  /**
   * Creates a new `Declaration` node.
   *
   * @param defaults Properties for the new node.
   * @return New declaration node.
   */
  decl(defaults?: DeclarationProps): Declaration

  /**
   * Creates a new `Rule` node.
   *
   * @param default Properties for the new node.
   * @return New rule node.
   */
  rule(defaults?: RuleProps): Rule

  /**
   * Creates a new `Root` node.
   *
   * @param defaults Properties for the new node.
   * @return New root node.
   */
  root(defaults?: RootProps): Root

  CssSyntaxError: typeof CssSyntaxError
  Declaration: typeof Declaration
  Container: typeof Container
  Comment: typeof Comment
  Warning: typeof Warning
  AtRule: typeof AtRule
  Result: typeof Result
  Input: typeof Input
  Rule: typeof Rule
  Root: typeof Root
  Node: typeof Node
}

export const stringify: Stringifier
export const parse: Parser
export const fromJSON: JSONHydrator

export const comment: Postcss['comment']
export const atRule: Postcss['atRule']
export const decl: Postcss['decl']
export const rule: Postcss['rule']
export const root: Postcss['root']

declare const postcss: Postcss

export default postcss
