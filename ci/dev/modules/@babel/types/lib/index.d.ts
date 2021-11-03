interface BaseComment {
    value: string;
    start: number;
    end: number;
    loc: SourceLocation;
    type: "CommentBlock" | "CommentLine";
}
interface CommentBlock extends BaseComment {
    type: "CommentBlock";
}
interface CommentLine extends BaseComment {
    type: "CommentLine";
}
declare type Comment = CommentBlock | CommentLine;
interface SourceLocation {
    start: {
        line: number;
        column: number;
    };
    end: {
        line: number;
        column: number;
    };
}
interface BaseNode {
    leadingComments: ReadonlyArray<Comment> | null;
    innerComments: ReadonlyArray<Comment> | null;
    trailingComments: ReadonlyArray<Comment> | null;
    start: number | null;
    end: number | null;
    loc: SourceLocation | null;
    type: Node["type"];
    range?: [number, number];
    extra?: Record<string, unknown>;
}
declare type CommentTypeShorthand = "leading" | "inner" | "trailing";
declare type Node = AnyTypeAnnotation | ArgumentPlaceholder | ArrayExpression | ArrayPattern | ArrayTypeAnnotation | ArrowFunctionExpression | AssignmentExpression | AssignmentPattern | AwaitExpression | BigIntLiteral | Binary | BinaryExpression | BindExpression | Block | BlockParent | BlockStatement | BooleanLiteral | BooleanLiteralTypeAnnotation | BooleanTypeAnnotation | BreakStatement | CallExpression | CatchClause | Class | ClassBody | ClassDeclaration | ClassExpression | ClassImplements | ClassMethod | ClassPrivateMethod | ClassPrivateProperty | ClassProperty | CompletionStatement | Conditional | ConditionalExpression | ContinueStatement | DebuggerStatement | DecimalLiteral | Declaration | DeclareClass | DeclareExportAllDeclaration | DeclareExportDeclaration | DeclareFunction | DeclareInterface | DeclareModule | DeclareModuleExports | DeclareOpaqueType | DeclareTypeAlias | DeclareVariable | DeclaredPredicate | Decorator | Directive | DirectiveLiteral | DoExpression | DoWhileStatement | EmptyStatement | EmptyTypeAnnotation | EnumBody | EnumBooleanBody | EnumBooleanMember | EnumDeclaration | EnumDefaultedMember | EnumMember | EnumNumberBody | EnumNumberMember | EnumStringBody | EnumStringMember | EnumSymbolBody | ExistsTypeAnnotation | ExportAllDeclaration | ExportDeclaration | ExportDefaultDeclaration | ExportDefaultSpecifier | ExportNamedDeclaration | ExportNamespaceSpecifier | ExportSpecifier | Expression | ExpressionStatement | ExpressionWrapper | File | Flow | FlowBaseAnnotation | FlowDeclaration | FlowPredicate | FlowType | For | ForInStatement | ForOfStatement | ForStatement | ForXStatement | Function | FunctionDeclaration | FunctionExpression | FunctionParent | FunctionTypeAnnotation | FunctionTypeParam | GenericTypeAnnotation | Identifier | IfStatement | Immutable | Import | ImportAttribute | ImportDeclaration | ImportDefaultSpecifier | ImportNamespaceSpecifier | ImportSpecifier | InferredPredicate | InterfaceDeclaration | InterfaceExtends | InterfaceTypeAnnotation | InterpreterDirective | IntersectionTypeAnnotation | JSX | JSXAttribute | JSXClosingElement | JSXClosingFragment | JSXElement | JSXEmptyExpression | JSXExpressionContainer | JSXFragment | JSXIdentifier | JSXMemberExpression | JSXNamespacedName | JSXOpeningElement | JSXOpeningFragment | JSXSpreadAttribute | JSXSpreadChild | JSXText | LVal | LabeledStatement | Literal | LogicalExpression | Loop | MemberExpression | MetaProperty | Method | MixedTypeAnnotation | ModuleDeclaration | ModuleExpression | ModuleSpecifier | NewExpression | Noop | NullLiteral | NullLiteralTypeAnnotation | NullableTypeAnnotation | NumberLiteral | NumberLiteralTypeAnnotation | NumberTypeAnnotation | NumericLiteral | ObjectExpression | ObjectMember | ObjectMethod | ObjectPattern | ObjectProperty | ObjectTypeAnnotation | ObjectTypeCallProperty | ObjectTypeIndexer | ObjectTypeInternalSlot | ObjectTypeProperty | ObjectTypeSpreadProperty | OpaqueType | OptionalCallExpression | OptionalMemberExpression | ParenthesizedExpression | Pattern | PatternLike | PipelineBareFunction | PipelinePrimaryTopicReference | PipelineTopicExpression | Placeholder | Private | PrivateName | Program | Property | Pureish | QualifiedTypeIdentifier | RecordExpression | RegExpLiteral | RegexLiteral | RestElement | RestProperty | ReturnStatement | Scopable | SequenceExpression | SpreadElement | SpreadProperty | Statement | StaticBlock | StringLiteral | StringLiteralTypeAnnotation | StringTypeAnnotation | Super | SwitchCase | SwitchStatement | SymbolTypeAnnotation | TSAnyKeyword | TSArrayType | TSAsExpression | TSBaseType | TSBigIntKeyword | TSBooleanKeyword | TSCallSignatureDeclaration | TSConditionalType | TSConstructSignatureDeclaration | TSConstructorType | TSDeclareFunction | TSDeclareMethod | TSEntityName | TSEnumDeclaration | TSEnumMember | TSExportAssignment | TSExpressionWithTypeArguments | TSExternalModuleReference | TSFunctionType | TSImportEqualsDeclaration | TSImportType | TSIndexSignature | TSIndexedAccessType | TSInferType | TSInterfaceBody | TSInterfaceDeclaration | TSIntersectionType | TSIntrinsicKeyword | TSLiteralType | TSMappedType | TSMethodSignature | TSModuleBlock | TSModuleDeclaration | TSNamedTupleMember | TSNamespaceExportDeclaration | TSNeverKeyword | TSNonNullExpression | TSNullKeyword | TSNumberKeyword | TSObjectKeyword | TSOptionalType | TSParameterProperty | TSParenthesizedType | TSPropertySignature | TSQualifiedName | TSRestType | TSStringKeyword | TSSymbolKeyword | TSThisType | TSTupleType | TSType | TSTypeAliasDeclaration | TSTypeAnnotation | TSTypeAssertion | TSTypeElement | TSTypeLiteral | TSTypeOperator | TSTypeParameter | TSTypeParameterDeclaration | TSTypeParameterInstantiation | TSTypePredicate | TSTypeQuery | TSTypeReference | TSUndefinedKeyword | TSUnionType | TSUnknownKeyword | TSVoidKeyword | TaggedTemplateExpression | TemplateElement | TemplateLiteral | Terminatorless | ThisExpression | ThisTypeAnnotation | ThrowStatement | TryStatement | TupleExpression | TupleTypeAnnotation | TypeAlias | TypeAnnotation | TypeCastExpression | TypeParameter | TypeParameterDeclaration | TypeParameterInstantiation | TypeofTypeAnnotation | UnaryExpression | UnaryLike | UnionTypeAnnotation | UpdateExpression | UserWhitespacable | V8IntrinsicIdentifier | VariableDeclaration | VariableDeclarator | Variance | VoidTypeAnnotation | While | WhileStatement | WithStatement | YieldExpression;
interface ArrayExpression extends BaseNode {
    type: "ArrayExpression";
    elements: Array<null | Expression | SpreadElement>;
}
interface AssignmentExpression extends BaseNode {
    type: "AssignmentExpression";
    operator: string;
    left: LVal;
    right: Expression;
}
interface BinaryExpression extends BaseNode {
    type: "BinaryExpression";
    operator: "+" | "-" | "/" | "%" | "*" | "**" | "&" | "|" | ">>" | ">>>" | "<<" | "^" | "==" | "===" | "!=" | "!==" | "in" | "instanceof" | ">" | "<" | ">=" | "<=";
    left: Expression | PrivateName;
    right: Expression;
}
interface InterpreterDirective extends BaseNode {
    type: "InterpreterDirective";
    value: string;
}
interface Directive extends BaseNode {
    type: "Directive";
    value: DirectiveLiteral;
}
interface DirectiveLiteral extends BaseNode {
    type: "DirectiveLiteral";
    value: string;
}
interface BlockStatement extends BaseNode {
    type: "BlockStatement";
    body: Array<Statement>;
    directives: Array<Directive>;
}
interface BreakStatement extends BaseNode {
    type: "BreakStatement";
    label?: Identifier | null;
}
interface CallExpression extends BaseNode {
    type: "CallExpression";
    callee: Expression | V8IntrinsicIdentifier;
    arguments: Array<Expression | SpreadElement | JSXNamespacedName | ArgumentPlaceholder>;
    optional?: true | false | null;
    typeArguments?: TypeParameterInstantiation | null;
    typeParameters?: TSTypeParameterInstantiation | null;
}
interface CatchClause extends BaseNode {
    type: "CatchClause";
    param?: Identifier | ArrayPattern | ObjectPattern | null;
    body: BlockStatement;
}
interface ConditionalExpression extends BaseNode {
    type: "ConditionalExpression";
    test: Expression;
    consequent: Expression;
    alternate: Expression;
}
interface ContinueStatement extends BaseNode {
    type: "ContinueStatement";
    label?: Identifier | null;
}
interface DebuggerStatement extends BaseNode {
    type: "DebuggerStatement";
}
interface DoWhileStatement extends BaseNode {
    type: "DoWhileStatement";
    test: Expression;
    body: Statement;
}
interface EmptyStatement extends BaseNode {
    type: "EmptyStatement";
}
interface ExpressionStatement extends BaseNode {
    type: "ExpressionStatement";
    expression: Expression;
}
interface File extends BaseNode {
    type: "File";
    program: Program;
    comments?: Array<CommentBlock | CommentLine> | null;
    tokens?: Array<any> | null;
}
interface ForInStatement extends BaseNode {
    type: "ForInStatement";
    left: VariableDeclaration | LVal;
    right: Expression;
    body: Statement;
}
interface ForStatement extends BaseNode {
    type: "ForStatement";
    init?: VariableDeclaration | Expression | null;
    test?: Expression | null;
    update?: Expression | null;
    body: Statement;
}
interface FunctionDeclaration extends BaseNode {
    type: "FunctionDeclaration";
    id?: Identifier | null;
    params: Array<Identifier | Pattern | RestElement | TSParameterProperty>;
    body: BlockStatement;
    generator?: boolean;
    async?: boolean;
    declare?: boolean | null;
    returnType?: TypeAnnotation | TSTypeAnnotation | Noop | null;
    typeParameters?: TypeParameterDeclaration | TSTypeParameterDeclaration | Noop | null;
}
interface FunctionExpression extends BaseNode {
    type: "FunctionExpression";
    id?: Identifier | null;
    params: Array<Identifier | Pattern | RestElement | TSParameterProperty>;
    body: BlockStatement;
    generator?: boolean;
    async?: boolean;
    returnType?: TypeAnnotation | TSTypeAnnotation | Noop | null;
    typeParameters?: TypeParameterDeclaration | TSTypeParameterDeclaration | Noop | null;
}
interface Identifier extends BaseNode {
    type: "Identifier";
    name: string;
    decorators?: Array<Decorator> | null;
    optional?: boolean | null;
    typeAnnotation?: TypeAnnotation | TSTypeAnnotation | Noop | null;
}
interface IfStatement extends BaseNode {
    type: "IfStatement";
    test: Expression;
    consequent: Statement;
    alternate?: Statement | null;
}
interface LabeledStatement extends BaseNode {
    type: "LabeledStatement";
    label: Identifier;
    body: Statement;
}
interface StringLiteral extends BaseNode {
    type: "StringLiteral";
    value: string;
}
interface NumericLiteral extends BaseNode {
    type: "NumericLiteral";
    value: number;
}
/**
 * @deprecated Use `NumericLiteral`
 */
interface NumberLiteral extends BaseNode {
    type: "NumberLiteral";
    value: number;
}
interface NullLiteral extends BaseNode {
    type: "NullLiteral";
}
interface BooleanLiteral extends BaseNode {
    type: "BooleanLiteral";
    value: boolean;
}
interface RegExpLiteral extends BaseNode {
    type: "RegExpLiteral";
    pattern: string;
    flags: string;
}
/**
 * @deprecated Use `RegExpLiteral`
 */
interface RegexLiteral extends BaseNode {
    type: "RegexLiteral";
    pattern: string;
    flags: string;
}
interface LogicalExpression extends BaseNode {
    type: "LogicalExpression";
    operator: "||" | "&&" | "??";
    left: Expression;
    right: Expression;
}
interface MemberExpression extends BaseNode {
    type: "MemberExpression";
    object: Expression;
    property: Expression | Identifier | PrivateName;
    computed: boolean;
    optional?: true | false | null;
}
interface NewExpression extends BaseNode {
    type: "NewExpression";
    callee: Expression | V8IntrinsicIdentifier;
    arguments: Array<Expression | SpreadElement | JSXNamespacedName | ArgumentPlaceholder>;
    optional?: true | false | null;
    typeArguments?: TypeParameterInstantiation | null;
    typeParameters?: TSTypeParameterInstantiation | null;
}
interface Program extends BaseNode {
    type: "Program";
    body: Array<Statement>;
    directives: Array<Directive>;
    sourceType: "script" | "module";
    interpreter?: InterpreterDirective | null;
    sourceFile: string;
}
interface ObjectExpression extends BaseNode {
    type: "ObjectExpression";
    properties: Array<ObjectMethod | ObjectProperty | SpreadElement>;
}
interface ObjectMethod extends BaseNode {
    type: "ObjectMethod";
    kind: "method" | "get" | "set";
    key: Expression | Identifier | StringLiteral | NumericLiteral;
    params: Array<Identifier | Pattern | RestElement | TSParameterProperty>;
    body: BlockStatement;
    computed: boolean;
    generator?: boolean;
    async?: boolean;
    decorators?: Array<Decorator> | null;
    returnType?: TypeAnnotation | TSTypeAnnotation | Noop | null;
    typeParameters?: TypeParameterDeclaration | TSTypeParameterDeclaration | Noop | null;
}
interface ObjectProperty extends BaseNode {
    type: "ObjectProperty";
    key: Expression | Identifier | StringLiteral | NumericLiteral;
    value: Expression | PatternLike;
    computed: boolean;
    shorthand: boolean;
    decorators?: Array<Decorator> | null;
}
interface RestElement extends BaseNode {
    type: "RestElement";
    argument: LVal;
    decorators?: Array<Decorator> | null;
    typeAnnotation?: TypeAnnotation | TSTypeAnnotation | Noop | null;
}
/**
 * @deprecated Use `RestElement`
 */
interface RestProperty extends BaseNode {
    type: "RestProperty";
    argument: LVal;
    decorators?: Array<Decorator> | null;
    typeAnnotation?: TypeAnnotation | TSTypeAnnotation | Noop | null;
}
interface ReturnStatement extends BaseNode {
    type: "ReturnStatement";
    argument?: Expression | null;
}
interface SequenceExpression extends BaseNode {
    type: "SequenceExpression";
    expressions: Array<Expression>;
}
interface ParenthesizedExpression extends BaseNode {
    type: "ParenthesizedExpression";
    expression: Expression;
}
interface SwitchCase extends BaseNode {
    type: "SwitchCase";
    test?: Expression | null;
    consequent: Array<Statement>;
}
interface SwitchStatement extends BaseNode {
    type: "SwitchStatement";
    discriminant: Expression;
    cases: Array<SwitchCase>;
}
interface ThisExpression extends BaseNode {
    type: "ThisExpression";
}
interface ThrowStatement extends BaseNode {
    type: "ThrowStatement";
    argument: Expression;
}
interface TryStatement extends BaseNode {
    type: "TryStatement";
    block: BlockStatement;
    handler?: CatchClause | null;
    finalizer?: BlockStatement | null;
}
interface UnaryExpression extends BaseNode {
    type: "UnaryExpression";
    operator: "void" | "throw" | "delete" | "!" | "+" | "-" | "~" | "typeof";
    argument: Expression;
    prefix: boolean;
}
interface UpdateExpression extends BaseNode {
    type: "UpdateExpression";
    operator: "++" | "--";
    argument: Expression;
    prefix: boolean;
}
interface VariableDeclaration extends BaseNode {
    type: "VariableDeclaration";
    kind: "var" | "let" | "const";
    declarations: Array<VariableDeclarator>;
    declare?: boolean | null;
}
interface VariableDeclarator extends BaseNode {
    type: "VariableDeclarator";
    id: LVal;
    init?: Expression | null;
    definite?: boolean | null;
}
interface WhileStatement extends BaseNode {
    type: "WhileStatement";
    test: Expression;
    body: Statement;
}
interface WithStatement extends BaseNode {
    type: "WithStatement";
    object: Expression;
    body: Statement;
}
interface AssignmentPattern extends BaseNode {
    type: "AssignmentPattern";
    left: Identifier | ObjectPattern | ArrayPattern | MemberExpression;
    right: Expression;
    decorators?: Array<Decorator> | null;
    typeAnnotation?: TypeAnnotation | TSTypeAnnotation | Noop | null;
}
interface ArrayPattern extends BaseNode {
    type: "ArrayPattern";
    elements: Array<null | PatternLike>;
    decorators?: Array<Decorator> | null;
    typeAnnotation?: TypeAnnotation | TSTypeAnnotation | Noop | null;
}
interface ArrowFunctionExpression extends BaseNode {
    type: "ArrowFunctionExpression";
    params: Array<Identifier | Pattern | RestElement | TSParameterProperty>;
    body: BlockStatement | Expression;
    async?: boolean;
    expression: boolean;
    generator?: boolean;
    returnType?: TypeAnnotation | TSTypeAnnotation | Noop | null;
    typeParameters?: TypeParameterDeclaration | TSTypeParameterDeclaration | Noop | null;
}
interface ClassBody extends BaseNode {
    type: "ClassBody";
    body: Array<ClassMethod | ClassPrivateMethod | ClassProperty | ClassPrivateProperty | TSDeclareMethod | TSIndexSignature>;
}
interface ClassExpression extends BaseNode {
    type: "ClassExpression";
    id?: Identifier | null;
    superClass?: Expression | null;
    body: ClassBody;
    decorators?: Array<Decorator> | null;
    implements?: Array<TSExpressionWithTypeArguments | ClassImplements> | null;
    mixins?: InterfaceExtends | null;
    superTypeParameters?: TypeParameterInstantiation | TSTypeParameterInstantiation | null;
    typeParameters?: TypeParameterDeclaration | TSTypeParameterDeclaration | Noop | null;
}
interface ClassDeclaration extends BaseNode {
    type: "ClassDeclaration";
    id: Identifier;
    superClass?: Expression | null;
    body: ClassBody;
    decorators?: Array<Decorator> | null;
    abstract?: boolean | null;
    declare?: boolean | null;
    implements?: Array<TSExpressionWithTypeArguments | ClassImplements> | null;
    mixins?: InterfaceExtends | null;
    superTypeParameters?: TypeParameterInstantiation | TSTypeParameterInstantiation | null;
    typeParameters?: TypeParameterDeclaration | TSTypeParameterDeclaration | Noop | null;
}
interface ExportAllDeclaration extends BaseNode {
    type: "ExportAllDeclaration";
    source: StringLiteral;
    assertions?: Array<ImportAttribute> | null;
    exportKind?: "type" | "value" | null;
}
interface ExportDefaultDeclaration extends BaseNode {
    type: "ExportDefaultDeclaration";
    declaration: FunctionDeclaration | TSDeclareFunction | ClassDeclaration | Expression;
}
interface ExportNamedDeclaration extends BaseNode {
    type: "ExportNamedDeclaration";
    declaration?: Declaration | null;
    specifiers: Array<ExportSpecifier | ExportDefaultSpecifier | ExportNamespaceSpecifier>;
    source?: StringLiteral | null;
    assertions?: Array<ImportAttribute> | null;
    exportKind?: "type" | "value" | null;
}
interface ExportSpecifier extends BaseNode {
    type: "ExportSpecifier";
    local: Identifier;
    exported: Identifier | StringLiteral;
}
interface ForOfStatement extends BaseNode {
    type: "ForOfStatement";
    left: VariableDeclaration | LVal;
    right: Expression;
    body: Statement;
    await: boolean;
}
interface ImportDeclaration extends BaseNode {
    type: "ImportDeclaration";
    specifiers: Array<ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier>;
    source: StringLiteral;
    assertions?: Array<ImportAttribute> | null;
    importKind?: "type" | "typeof" | "value" | null;
}
interface ImportDefaultSpecifier extends BaseNode {
    type: "ImportDefaultSpecifier";
    local: Identifier;
}
interface ImportNamespaceSpecifier extends BaseNode {
    type: "ImportNamespaceSpecifier";
    local: Identifier;
}
interface ImportSpecifier extends BaseNode {
    type: "ImportSpecifier";
    local: Identifier;
    imported: Identifier | StringLiteral;
    importKind?: "type" | "typeof" | null;
}
interface MetaProperty extends BaseNode {
    type: "MetaProperty";
    meta: Identifier;
    property: Identifier;
}
interface ClassMethod extends BaseNode {
    type: "ClassMethod";
    kind?: "get" | "set" | "method" | "constructor";
    key: Identifier | StringLiteral | NumericLiteral | Expression;
    params: Array<Identifier | Pattern | RestElement | TSParameterProperty>;
    body: BlockStatement;
    computed?: boolean;
    static?: boolean;
    generator?: boolean;
    async?: boolean;
    abstract?: boolean | null;
    access?: "public" | "private" | "protected" | null;
    accessibility?: "public" | "private" | "protected" | null;
    decorators?: Array<Decorator> | null;
    optional?: boolean | null;
    returnType?: TypeAnnotation | TSTypeAnnotation | Noop | null;
    typeParameters?: TypeParameterDeclaration | TSTypeParameterDeclaration | Noop | null;
}
interface ObjectPattern extends BaseNode {
    type: "ObjectPattern";
    properties: Array<RestElement | ObjectProperty>;
    decorators?: Array<Decorator> | null;
    typeAnnotation?: TypeAnnotation | TSTypeAnnotation | Noop | null;
}
interface SpreadElement extends BaseNode {
    type: "SpreadElement";
    argument: Expression;
}
/**
 * @deprecated Use `SpreadElement`
 */
interface SpreadProperty extends BaseNode {
    type: "SpreadProperty";
    argument: Expression;
}
interface Super extends BaseNode {
    type: "Super";
}
interface TaggedTemplateExpression extends BaseNode {
    type: "TaggedTemplateExpression";
    tag: Expression;
    quasi: TemplateLiteral;
    typeParameters?: TypeParameterInstantiation | TSTypeParameterInstantiation | null;
}
interface TemplateElement extends BaseNode {
    type: "TemplateElement";
    value: {
        raw: string;
        cooked?: string;
    };
    tail: boolean;
}
interface TemplateLiteral extends BaseNode {
    type: "TemplateLiteral";
    quasis: Array<TemplateElement>;
    expressions: Array<Expression | TSType>;
}
interface YieldExpression extends BaseNode {
    type: "YieldExpression";
    argument?: Expression | null;
    delegate: boolean;
}
interface AwaitExpression extends BaseNode {
    type: "AwaitExpression";
    argument: Expression;
}
interface Import extends BaseNode {
    type: "Import";
}
interface BigIntLiteral extends BaseNode {
    type: "BigIntLiteral";
    value: string;
}
interface ExportNamespaceSpecifier extends BaseNode {
    type: "ExportNamespaceSpecifier";
    exported: Identifier;
}
interface OptionalMemberExpression extends BaseNode {
    type: "OptionalMemberExpression";
    object: Expression;
    property: Expression | Identifier;
    computed: boolean;
    optional: boolean;
}
interface OptionalCallExpression extends BaseNode {
    type: "OptionalCallExpression";
    callee: Expression;
    arguments: Array<Expression | SpreadElement | JSXNamespacedName | ArgumentPlaceholder>;
    optional: boolean;
    typeArguments?: TypeParameterInstantiation | null;
    typeParameters?: TSTypeParameterInstantiation | null;
}
interface AnyTypeAnnotation extends BaseNode {
    type: "AnyTypeAnnotation";
}
interface ArrayTypeAnnotation extends BaseNode {
    type: "ArrayTypeAnnotation";
    elementType: FlowType;
}
interface BooleanTypeAnnotation extends BaseNode {
    type: "BooleanTypeAnnotation";
}
interface BooleanLiteralTypeAnnotation extends BaseNode {
    type: "BooleanLiteralTypeAnnotation";
    value: boolean;
}
interface NullLiteralTypeAnnotation extends BaseNode {
    type: "NullLiteralTypeAnnotation";
}
interface ClassImplements extends BaseNode {
    type: "ClassImplements";
    id: Identifier;
    typeParameters?: TypeParameterInstantiation | null;
}
interface DeclareClass extends BaseNode {
    type: "DeclareClass";
    id: Identifier;
    typeParameters?: TypeParameterDeclaration | null;
    extends?: Array<InterfaceExtends> | null;
    body: ObjectTypeAnnotation;
    implements?: Array<ClassImplements> | null;
    mixins?: Array<InterfaceExtends> | null;
}
interface DeclareFunction extends BaseNode {
    type: "DeclareFunction";
    id: Identifier;
    predicate?: DeclaredPredicate | null;
}
interface DeclareInterface extends BaseNode {
    type: "DeclareInterface";
    id: Identifier;
    typeParameters?: TypeParameterDeclaration | null;
    extends?: Array<InterfaceExtends> | null;
    body: ObjectTypeAnnotation;
    implements?: Array<ClassImplements> | null;
    mixins?: Array<InterfaceExtends> | null;
}
interface DeclareModule extends BaseNode {
    type: "DeclareModule";
    id: Identifier | StringLiteral;
    body: BlockStatement;
    kind?: "CommonJS" | "ES" | null;
}
interface DeclareModuleExports extends BaseNode {
    type: "DeclareModuleExports";
    typeAnnotation: TypeAnnotation;
}
interface DeclareTypeAlias extends BaseNode {
    type: "DeclareTypeAlias";
    id: Identifier;
    typeParameters?: TypeParameterDeclaration | null;
    right: FlowType;
}
interface DeclareOpaqueType extends BaseNode {
    type: "DeclareOpaqueType";
    id: Identifier;
    typeParameters?: TypeParameterDeclaration | null;
    supertype?: FlowType | null;
}
interface DeclareVariable extends BaseNode {
    type: "DeclareVariable";
    id: Identifier;
}
interface DeclareExportDeclaration extends BaseNode {
    type: "DeclareExportDeclaration";
    declaration?: Flow | null;
    specifiers?: Array<ExportSpecifier | ExportNamespaceSpecifier> | null;
    source?: StringLiteral | null;
    default?: boolean | null;
}
interface DeclareExportAllDeclaration extends BaseNode {
    type: "DeclareExportAllDeclaration";
    source: StringLiteral;
    exportKind?: "type" | "value" | null;
}
interface DeclaredPredicate extends BaseNode {
    type: "DeclaredPredicate";
    value: Flow;
}
interface ExistsTypeAnnotation extends BaseNode {
    type: "ExistsTypeAnnotation";
}
interface FunctionTypeAnnotation extends BaseNode {
    type: "FunctionTypeAnnotation";
    typeParameters?: TypeParameterDeclaration | null;
    params: Array<FunctionTypeParam>;
    rest?: FunctionTypeParam | null;
    returnType: FlowType;
    this?: FunctionTypeParam | null;
}
interface FunctionTypeParam extends BaseNode {
    type: "FunctionTypeParam";
    name?: Identifier | null;
    typeAnnotation: FlowType;
    optional?: boolean | null;
}
interface GenericTypeAnnotation extends BaseNode {
    type: "GenericTypeAnnotation";
    id: Identifier | QualifiedTypeIdentifier;
    typeParameters?: TypeParameterInstantiation | null;
}
interface InferredPredicate extends BaseNode {
    type: "InferredPredicate";
}
interface InterfaceExtends extends BaseNode {
    type: "InterfaceExtends";
    id: Identifier | QualifiedTypeIdentifier;
    typeParameters?: TypeParameterInstantiation | null;
}
interface InterfaceDeclaration extends BaseNode {
    type: "InterfaceDeclaration";
    id: Identifier;
    typeParameters?: TypeParameterDeclaration | null;
    extends?: Array<InterfaceExtends> | null;
    body: ObjectTypeAnnotation;
    implements?: Array<ClassImplements> | null;
    mixins?: Array<InterfaceExtends> | null;
}
interface InterfaceTypeAnnotation extends BaseNode {
    type: "InterfaceTypeAnnotation";
    extends?: Array<InterfaceExtends> | null;
    body: ObjectTypeAnnotation;
}
interface IntersectionTypeAnnotation extends BaseNode {
    type: "IntersectionTypeAnnotation";
    types: Array<FlowType>;
}
interface MixedTypeAnnotation extends BaseNode {
    type: "MixedTypeAnnotation";
}
interface EmptyTypeAnnotation extends BaseNode {
    type: "EmptyTypeAnnotation";
}
interface NullableTypeAnnotation extends BaseNode {
    type: "NullableTypeAnnotation";
    typeAnnotation: FlowType;
}
interface NumberLiteralTypeAnnotation extends BaseNode {
    type: "NumberLiteralTypeAnnotation";
    value: number;
}
interface NumberTypeAnnotation extends BaseNode {
    type: "NumberTypeAnnotation";
}
interface ObjectTypeAnnotation extends BaseNode {
    type: "ObjectTypeAnnotation";
    properties: Array<ObjectTypeProperty | ObjectTypeSpreadProperty>;
    indexers?: Array<ObjectTypeIndexer> | null;
    callProperties?: Array<ObjectTypeCallProperty> | null;
    internalSlots?: Array<ObjectTypeInternalSlot> | null;
    exact: boolean;
    inexact?: boolean | null;
}
interface ObjectTypeInternalSlot extends BaseNode {
    type: "ObjectTypeInternalSlot";
    id: Identifier;
    value: FlowType;
    optional: boolean;
    static: boolean;
    method: boolean;
}
interface ObjectTypeCallProperty extends BaseNode {
    type: "ObjectTypeCallProperty";
    value: FlowType;
    static: boolean;
}
interface ObjectTypeIndexer extends BaseNode {
    type: "ObjectTypeIndexer";
    id?: Identifier | null;
    key: FlowType;
    value: FlowType;
    variance?: Variance | null;
    static: boolean;
}
interface ObjectTypeProperty extends BaseNode {
    type: "ObjectTypeProperty";
    key: Identifier | StringLiteral;
    value: FlowType;
    variance?: Variance | null;
    kind: "init" | "get" | "set";
    method: boolean;
    optional: boolean;
    proto: boolean;
    static: boolean;
}
interface ObjectTypeSpreadProperty extends BaseNode {
    type: "ObjectTypeSpreadProperty";
    argument: FlowType;
}
interface OpaqueType extends BaseNode {
    type: "OpaqueType";
    id: Identifier;
    typeParameters?: TypeParameterDeclaration | null;
    supertype?: FlowType | null;
    impltype: FlowType;
}
interface QualifiedTypeIdentifier extends BaseNode {
    type: "QualifiedTypeIdentifier";
    id: Identifier;
    qualification: Identifier | QualifiedTypeIdentifier;
}
interface StringLiteralTypeAnnotation extends BaseNode {
    type: "StringLiteralTypeAnnotation";
    value: string;
}
interface StringTypeAnnotation extends BaseNode {
    type: "StringTypeAnnotation";
}
interface SymbolTypeAnnotation extends BaseNode {
    type: "SymbolTypeAnnotation";
}
interface ThisTypeAnnotation extends BaseNode {
    type: "ThisTypeAnnotation";
}
interface TupleTypeAnnotation extends BaseNode {
    type: "TupleTypeAnnotation";
    types: Array<FlowType>;
}
interface TypeofTypeAnnotation extends BaseNode {
    type: "TypeofTypeAnnotation";
    argument: FlowType;
}
interface TypeAlias extends BaseNode {
    type: "TypeAlias";
    id: Identifier;
    typeParameters?: TypeParameterDeclaration | null;
    right: FlowType;
}
interface TypeAnnotation extends BaseNode {
    type: "TypeAnnotation";
    typeAnnotation: FlowType;
}
interface TypeCastExpression extends BaseNode {
    type: "TypeCastExpression";
    expression: Expression;
    typeAnnotation: TypeAnnotation;
}
interface TypeParameter extends BaseNode {
    type: "TypeParameter";
    bound?: TypeAnnotation | null;
    default?: FlowType | null;
    variance?: Variance | null;
    name: string;
}
interface TypeParameterDeclaration extends BaseNode {
    type: "TypeParameterDeclaration";
    params: Array<TypeParameter>;
}
interface TypeParameterInstantiation extends BaseNode {
    type: "TypeParameterInstantiation";
    params: Array<FlowType>;
}
interface UnionTypeAnnotation extends BaseNode {
    type: "UnionTypeAnnotation";
    types: Array<FlowType>;
}
interface Variance extends BaseNode {
    type: "Variance";
    kind: "minus" | "plus";
}
interface VoidTypeAnnotation extends BaseNode {
    type: "VoidTypeAnnotation";
}
interface EnumDeclaration extends BaseNode {
    type: "EnumDeclaration";
    id: Identifier;
    body: EnumBooleanBody | EnumNumberBody | EnumStringBody | EnumSymbolBody;
}
interface EnumBooleanBody extends BaseNode {
    type: "EnumBooleanBody";
    members: Array<EnumBooleanMember>;
    explicitType: boolean;
    hasUnknownMembers: boolean;
}
interface EnumNumberBody extends BaseNode {
    type: "EnumNumberBody";
    members: Array<EnumNumberMember>;
    explicitType: boolean;
    hasUnknownMembers: boolean;
}
interface EnumStringBody extends BaseNode {
    type: "EnumStringBody";
    members: Array<EnumStringMember | EnumDefaultedMember>;
    explicitType: boolean;
    hasUnknownMembers: boolean;
}
interface EnumSymbolBody extends BaseNode {
    type: "EnumSymbolBody";
    members: Array<EnumDefaultedMember>;
    hasUnknownMembers: boolean;
}
interface EnumBooleanMember extends BaseNode {
    type: "EnumBooleanMember";
    id: Identifier;
    init: BooleanLiteral;
}
interface EnumNumberMember extends BaseNode {
    type: "EnumNumberMember";
    id: Identifier;
    init: NumericLiteral;
}
interface EnumStringMember extends BaseNode {
    type: "EnumStringMember";
    id: Identifier;
    init: StringLiteral;
}
interface EnumDefaultedMember extends BaseNode {
    type: "EnumDefaultedMember";
    id: Identifier;
}
interface JSXAttribute extends BaseNode {
    type: "JSXAttribute";
    name: JSXIdentifier | JSXNamespacedName;
    value?: JSXElement | JSXFragment | StringLiteral | JSXExpressionContainer | null;
}
interface JSXClosingElement extends BaseNode {
    type: "JSXClosingElement";
    name: JSXIdentifier | JSXMemberExpression | JSXNamespacedName;
}
interface JSXElement extends BaseNode {
    type: "JSXElement";
    openingElement: JSXOpeningElement;
    closingElement?: JSXClosingElement | null;
    children: Array<JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment>;
    selfClosing?: boolean | null;
}
interface JSXEmptyExpression extends BaseNode {
    type: "JSXEmptyExpression";
}
interface JSXExpressionContainer extends BaseNode {
    type: "JSXExpressionContainer";
    expression: Expression | JSXEmptyExpression;
}
interface JSXSpreadChild extends BaseNode {
    type: "JSXSpreadChild";
    expression: Expression;
}
interface JSXIdentifier extends BaseNode {
    type: "JSXIdentifier";
    name: string;
}
interface JSXMemberExpression extends BaseNode {
    type: "JSXMemberExpression";
    object: JSXMemberExpression | JSXIdentifier;
    property: JSXIdentifier;
}
interface JSXNamespacedName extends BaseNode {
    type: "JSXNamespacedName";
    namespace: JSXIdentifier;
    name: JSXIdentifier;
}
interface JSXOpeningElement extends BaseNode {
    type: "JSXOpeningElement";
    name: JSXIdentifier | JSXMemberExpression | JSXNamespacedName;
    attributes: Array<JSXAttribute | JSXSpreadAttribute>;
    selfClosing: boolean;
    typeParameters?: TypeParameterInstantiation | TSTypeParameterInstantiation | null;
}
interface JSXSpreadAttribute extends BaseNode {
    type: "JSXSpreadAttribute";
    argument: Expression;
}
interface JSXText extends BaseNode {
    type: "JSXText";
    value: string;
}
interface JSXFragment extends BaseNode {
    type: "JSXFragment";
    openingFragment: JSXOpeningFragment;
    closingFragment: JSXClosingFragment;
    children: Array<JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment>;
}
interface JSXOpeningFragment extends BaseNode {
    type: "JSXOpeningFragment";
}
interface JSXClosingFragment extends BaseNode {
    type: "JSXClosingFragment";
}
interface Noop extends BaseNode {
    type: "Noop";
}
interface Placeholder extends BaseNode {
    type: "Placeholder";
    expectedNode: "Identifier" | "StringLiteral" | "Expression" | "Statement" | "Declaration" | "BlockStatement" | "ClassBody" | "Pattern";
    name: Identifier;
}
interface V8IntrinsicIdentifier extends BaseNode {
    type: "V8IntrinsicIdentifier";
    name: string;
}
interface ArgumentPlaceholder extends BaseNode {
    type: "ArgumentPlaceholder";
}
interface BindExpression extends BaseNode {
    type: "BindExpression";
    object: Expression;
    callee: Expression;
}
interface ClassProperty extends BaseNode {
    type: "ClassProperty";
    key: Identifier | StringLiteral | NumericLiteral | Expression;
    value?: Expression | null;
    typeAnnotation?: TypeAnnotation | TSTypeAnnotation | Noop | null;
    decorators?: Array<Decorator> | null;
    computed?: boolean;
    static?: boolean;
    abstract?: boolean | null;
    accessibility?: "public" | "private" | "protected" | null;
    declare?: boolean | null;
    definite?: boolean | null;
    optional?: boolean | null;
    readonly?: boolean | null;
}
interface PipelineTopicExpression extends BaseNode {
    type: "PipelineTopicExpression";
    expression: Expression;
}
interface PipelineBareFunction extends BaseNode {
    type: "PipelineBareFunction";
    callee: Expression;
}
interface PipelinePrimaryTopicReference extends BaseNode {
    type: "PipelinePrimaryTopicReference";
}
interface ClassPrivateProperty extends BaseNode {
    type: "ClassPrivateProperty";
    key: PrivateName;
    value?: Expression | null;
    decorators?: Array<Decorator> | null;
    static: any;
    typeAnnotation?: TypeAnnotation | TSTypeAnnotation | Noop | null;
}
interface ClassPrivateMethod extends BaseNode {
    type: "ClassPrivateMethod";
    kind?: "get" | "set" | "method" | "constructor";
    key: PrivateName;
    params: Array<Identifier | Pattern | RestElement | TSParameterProperty>;
    body: BlockStatement;
    static?: boolean;
    abstract?: boolean | null;
    access?: "public" | "private" | "protected" | null;
    accessibility?: "public" | "private" | "protected" | null;
    async?: boolean;
    computed?: boolean;
    decorators?: Array<Decorator> | null;
    generator?: boolean;
    optional?: boolean | null;
    returnType?: TypeAnnotation | TSTypeAnnotation | Noop | null;
    typeParameters?: TypeParameterDeclaration | TSTypeParameterDeclaration | Noop | null;
}
interface ImportAttribute extends BaseNode {
    type: "ImportAttribute";
    key: Identifier | StringLiteral;
    value: StringLiteral;
}
interface Decorator extends BaseNode {
    type: "Decorator";
    expression: Expression;
}
interface DoExpression extends BaseNode {
    type: "DoExpression";
    body: BlockStatement;
}
interface ExportDefaultSpecifier extends BaseNode {
    type: "ExportDefaultSpecifier";
    exported: Identifier;
}
interface PrivateName extends BaseNode {
    type: "PrivateName";
    id: Identifier;
}
interface RecordExpression extends BaseNode {
    type: "RecordExpression";
    properties: Array<ObjectProperty | SpreadElement>;
}
interface TupleExpression extends BaseNode {
    type: "TupleExpression";
    elements: Array<Expression | SpreadElement>;
}
interface DecimalLiteral extends BaseNode {
    type: "DecimalLiteral";
    value: string;
}
interface StaticBlock extends BaseNode {
    type: "StaticBlock";
    body: Array<Statement>;
}
interface ModuleExpression extends BaseNode {
    type: "ModuleExpression";
    body: Program;
}
interface TSParameterProperty extends BaseNode {
    type: "TSParameterProperty";
    parameter: Identifier | AssignmentPattern;
    accessibility?: "public" | "private" | "protected" | null;
    readonly?: boolean | null;
}
interface TSDeclareFunction extends BaseNode {
    type: "TSDeclareFunction";
    id?: Identifier | null;
    typeParameters?: TSTypeParameterDeclaration | Noop | null;
    params: Array<Identifier | Pattern | RestElement | TSParameterProperty>;
    returnType?: TSTypeAnnotation | Noop | null;
    async?: boolean;
    declare?: boolean | null;
    generator?: boolean;
}
interface TSDeclareMethod extends BaseNode {
    type: "TSDeclareMethod";
    decorators?: Array<Decorator> | null;
    key: Identifier | StringLiteral | NumericLiteral | Expression;
    typeParameters?: TSTypeParameterDeclaration | Noop | null;
    params: Array<Identifier | Pattern | RestElement | TSParameterProperty>;
    returnType?: TSTypeAnnotation | Noop | null;
    abstract?: boolean | null;
    access?: "public" | "private" | "protected" | null;
    accessibility?: "public" | "private" | "protected" | null;
    async?: boolean;
    computed?: boolean;
    generator?: boolean;
    kind?: "get" | "set" | "method" | "constructor";
    optional?: boolean | null;
    static?: boolean;
}
interface TSQualifiedName extends BaseNode {
    type: "TSQualifiedName";
    left: TSEntityName;
    right: Identifier;
}
interface TSCallSignatureDeclaration extends BaseNode {
    type: "TSCallSignatureDeclaration";
    typeParameters?: TSTypeParameterDeclaration | null;
    parameters: Array<Identifier | RestElement>;
    typeAnnotation?: TSTypeAnnotation | null;
}
interface TSConstructSignatureDeclaration extends BaseNode {
    type: "TSConstructSignatureDeclaration";
    typeParameters?: TSTypeParameterDeclaration | null;
    parameters: Array<Identifier | RestElement>;
    typeAnnotation?: TSTypeAnnotation | null;
}
interface TSPropertySignature extends BaseNode {
    type: "TSPropertySignature";
    key: Expression;
    typeAnnotation?: TSTypeAnnotation | null;
    initializer?: Expression | null;
    computed?: boolean | null;
    optional?: boolean | null;
    readonly?: boolean | null;
}
interface TSMethodSignature extends BaseNode {
    type: "TSMethodSignature";
    key: Expression;
    typeParameters?: TSTypeParameterDeclaration | null;
    parameters: Array<Identifier | RestElement>;
    typeAnnotation?: TSTypeAnnotation | null;
    computed?: boolean | null;
    optional?: boolean | null;
}
interface TSIndexSignature extends BaseNode {
    type: "TSIndexSignature";
    parameters: Array<Identifier>;
    typeAnnotation?: TSTypeAnnotation | null;
    readonly?: boolean | null;
}
interface TSAnyKeyword extends BaseNode {
    type: "TSAnyKeyword";
}
interface TSBooleanKeyword extends BaseNode {
    type: "TSBooleanKeyword";
}
interface TSBigIntKeyword extends BaseNode {
    type: "TSBigIntKeyword";
}
interface TSIntrinsicKeyword extends BaseNode {
    type: "TSIntrinsicKeyword";
}
interface TSNeverKeyword extends BaseNode {
    type: "TSNeverKeyword";
}
interface TSNullKeyword extends BaseNode {
    type: "TSNullKeyword";
}
interface TSNumberKeyword extends BaseNode {
    type: "TSNumberKeyword";
}
interface TSObjectKeyword extends BaseNode {
    type: "TSObjectKeyword";
}
interface TSStringKeyword extends BaseNode {
    type: "TSStringKeyword";
}
interface TSSymbolKeyword extends BaseNode {
    type: "TSSymbolKeyword";
}
interface TSUndefinedKeyword extends BaseNode {
    type: "TSUndefinedKeyword";
}
interface TSUnknownKeyword extends BaseNode {
    type: "TSUnknownKeyword";
}
interface TSVoidKeyword extends BaseNode {
    type: "TSVoidKeyword";
}
interface TSThisType extends BaseNode {
    type: "TSThisType";
}
interface TSFunctionType extends BaseNode {
    type: "TSFunctionType";
    typeParameters?: TSTypeParameterDeclaration | null;
    parameters: Array<Identifier | RestElement>;
    typeAnnotation?: TSTypeAnnotation | null;
}
interface TSConstructorType extends BaseNode {
    type: "TSConstructorType";
    typeParameters?: TSTypeParameterDeclaration | null;
    parameters: Array<Identifier | RestElement>;
    typeAnnotation?: TSTypeAnnotation | null;
    abstract?: boolean | null;
}
interface TSTypeReference extends BaseNode {
    type: "TSTypeReference";
    typeName: TSEntityName;
    typeParameters?: TSTypeParameterInstantiation | null;
}
interface TSTypePredicate extends BaseNode {
    type: "TSTypePredicate";
    parameterName: Identifier | TSThisType;
    typeAnnotation?: TSTypeAnnotation | null;
    asserts?: boolean | null;
}
interface TSTypeQuery extends BaseNode {
    type: "TSTypeQuery";
    exprName: TSEntityName | TSImportType;
}
interface TSTypeLiteral extends BaseNode {
    type: "TSTypeLiteral";
    members: Array<TSTypeElement>;
}
interface TSArrayType extends BaseNode {
    type: "TSArrayType";
    elementType: TSType;
}
interface TSTupleType extends BaseNode {
    type: "TSTupleType";
    elementTypes: Array<TSType | TSNamedTupleMember>;
}
interface TSOptionalType extends BaseNode {
    type: "TSOptionalType";
    typeAnnotation: TSType;
}
interface TSRestType extends BaseNode {
    type: "TSRestType";
    typeAnnotation: TSType;
}
interface TSNamedTupleMember extends BaseNode {
    type: "TSNamedTupleMember";
    label: Identifier;
    elementType: TSType;
    optional: boolean;
}
interface TSUnionType extends BaseNode {
    type: "TSUnionType";
    types: Array<TSType>;
}
interface TSIntersectionType extends BaseNode {
    type: "TSIntersectionType";
    types: Array<TSType>;
}
interface TSConditionalType extends BaseNode {
    type: "TSConditionalType";
    checkType: TSType;
    extendsType: TSType;
    trueType: TSType;
    falseType: TSType;
}
interface TSInferType extends BaseNode {
    type: "TSInferType";
    typeParameter: TSTypeParameter;
}
interface TSParenthesizedType extends BaseNode {
    type: "TSParenthesizedType";
    typeAnnotation: TSType;
}
interface TSTypeOperator extends BaseNode {
    type: "TSTypeOperator";
    typeAnnotation: TSType;
    operator: string;
}
interface TSIndexedAccessType extends BaseNode {
    type: "TSIndexedAccessType";
    objectType: TSType;
    indexType: TSType;
}
interface TSMappedType extends BaseNode {
    type: "TSMappedType";
    typeParameter: TSTypeParameter;
    typeAnnotation?: TSType | null;
    nameType?: TSType | null;
    optional?: boolean | null;
    readonly?: boolean | null;
}
interface TSLiteralType extends BaseNode {
    type: "TSLiteralType";
    literal: NumericLiteral | StringLiteral | BooleanLiteral | BigIntLiteral;
}
interface TSExpressionWithTypeArguments extends BaseNode {
    type: "TSExpressionWithTypeArguments";
    expression: TSEntityName;
    typeParameters?: TSTypeParameterInstantiation | null;
}
interface TSInterfaceDeclaration extends BaseNode {
    type: "TSInterfaceDeclaration";
    id: Identifier;
    typeParameters?: TSTypeParameterDeclaration | null;
    extends?: Array<TSExpressionWithTypeArguments> | null;
    body: TSInterfaceBody;
    declare?: boolean | null;
}
interface TSInterfaceBody extends BaseNode {
    type: "TSInterfaceBody";
    body: Array<TSTypeElement>;
}
interface TSTypeAliasDeclaration extends BaseNode {
    type: "TSTypeAliasDeclaration";
    id: Identifier;
    typeParameters?: TSTypeParameterDeclaration | null;
    typeAnnotation: TSType;
    declare?: boolean | null;
}
interface TSAsExpression extends BaseNode {
    type: "TSAsExpression";
    expression: Expression;
    typeAnnotation: TSType;
}
interface TSTypeAssertion extends BaseNode {
    type: "TSTypeAssertion";
    typeAnnotation: TSType;
    expression: Expression;
}
interface TSEnumDeclaration extends BaseNode {
    type: "TSEnumDeclaration";
    id: Identifier;
    members: Array<TSEnumMember>;
    const?: boolean | null;
    declare?: boolean | null;
    initializer?: Expression | null;
}
interface TSEnumMember extends BaseNode {
    type: "TSEnumMember";
    id: Identifier | StringLiteral;
    initializer?: Expression | null;
}
interface TSModuleDeclaration extends BaseNode {
    type: "TSModuleDeclaration";
    id: Identifier | StringLiteral;
    body: TSModuleBlock | TSModuleDeclaration;
    declare?: boolean | null;
    global?: boolean | null;
}
interface TSModuleBlock extends BaseNode {
    type: "TSModuleBlock";
    body: Array<Statement>;
}
interface TSImportType extends BaseNode {
    type: "TSImportType";
    argument: StringLiteral;
    qualifier?: TSEntityName | null;
    typeParameters?: TSTypeParameterInstantiation | null;
}
interface TSImportEqualsDeclaration extends BaseNode {
    type: "TSImportEqualsDeclaration";
    id: Identifier;
    moduleReference: TSEntityName | TSExternalModuleReference;
    isExport: boolean;
}
interface TSExternalModuleReference extends BaseNode {
    type: "TSExternalModuleReference";
    expression: StringLiteral;
}
interface TSNonNullExpression extends BaseNode {
    type: "TSNonNullExpression";
    expression: Expression;
}
interface TSExportAssignment extends BaseNode {
    type: "TSExportAssignment";
    expression: Expression;
}
interface TSNamespaceExportDeclaration extends BaseNode {
    type: "TSNamespaceExportDeclaration";
    id: Identifier;
}
interface TSTypeAnnotation extends BaseNode {
    type: "TSTypeAnnotation";
    typeAnnotation: TSType;
}
interface TSTypeParameterInstantiation extends BaseNode {
    type: "TSTypeParameterInstantiation";
    params: Array<TSType>;
}
interface TSTypeParameterDeclaration extends BaseNode {
    type: "TSTypeParameterDeclaration";
    params: Array<TSTypeParameter>;
}
interface TSTypeParameter extends BaseNode {
    type: "TSTypeParameter";
    constraint?: TSType | null;
    default?: TSType | null;
    name: string;
}
declare type Expression = ArrayExpression | AssignmentExpression | BinaryExpression | CallExpression | ConditionalExpression | FunctionExpression | Identifier | StringLiteral | NumericLiteral | NullLiteral | BooleanLiteral | RegExpLiteral | LogicalExpression | MemberExpression | NewExpression | ObjectExpression | SequenceExpression | ParenthesizedExpression | ThisExpression | UnaryExpression | UpdateExpression | ArrowFunctionExpression | ClassExpression | MetaProperty | Super | TaggedTemplateExpression | TemplateLiteral | YieldExpression | AwaitExpression | Import | BigIntLiteral | OptionalMemberExpression | OptionalCallExpression | TypeCastExpression | JSXElement | JSXFragment | BindExpression | PipelinePrimaryTopicReference | DoExpression | RecordExpression | TupleExpression | DecimalLiteral | ModuleExpression | TSAsExpression | TSTypeAssertion | TSNonNullExpression;
declare type Binary = BinaryExpression | LogicalExpression;
declare type Scopable = BlockStatement | CatchClause | DoWhileStatement | ForInStatement | ForStatement | FunctionDeclaration | FunctionExpression | Program | ObjectMethod | SwitchStatement | WhileStatement | ArrowFunctionExpression | ClassExpression | ClassDeclaration | ForOfStatement | ClassMethod | ClassPrivateMethod | StaticBlock | TSModuleBlock;
declare type BlockParent = BlockStatement | CatchClause | DoWhileStatement | ForInStatement | ForStatement | FunctionDeclaration | FunctionExpression | Program | ObjectMethod | SwitchStatement | WhileStatement | ArrowFunctionExpression | ForOfStatement | ClassMethod | ClassPrivateMethod | StaticBlock | TSModuleBlock;
declare type Block = BlockStatement | Program | TSModuleBlock;
declare type Statement = BlockStatement | BreakStatement | ContinueStatement | DebuggerStatement | DoWhileStatement | EmptyStatement | ExpressionStatement | ForInStatement | ForStatement | FunctionDeclaration | IfStatement | LabeledStatement | ReturnStatement | SwitchStatement | ThrowStatement | TryStatement | VariableDeclaration | WhileStatement | WithStatement | ClassDeclaration | ExportAllDeclaration | ExportDefaultDeclaration | ExportNamedDeclaration | ForOfStatement | ImportDeclaration | DeclareClass | DeclareFunction | DeclareInterface | DeclareModule | DeclareModuleExports | DeclareTypeAlias | DeclareOpaqueType | DeclareVariable | DeclareExportDeclaration | DeclareExportAllDeclaration | InterfaceDeclaration | OpaqueType | TypeAlias | EnumDeclaration | TSDeclareFunction | TSInterfaceDeclaration | TSTypeAliasDeclaration | TSEnumDeclaration | TSModuleDeclaration | TSImportEqualsDeclaration | TSExportAssignment | TSNamespaceExportDeclaration;
declare type Terminatorless = BreakStatement | ContinueStatement | ReturnStatement | ThrowStatement | YieldExpression | AwaitExpression;
declare type CompletionStatement = BreakStatement | ContinueStatement | ReturnStatement | ThrowStatement;
declare type Conditional = ConditionalExpression | IfStatement;
declare type Loop = DoWhileStatement | ForInStatement | ForStatement | WhileStatement | ForOfStatement;
declare type While = DoWhileStatement | WhileStatement;
declare type ExpressionWrapper = ExpressionStatement | ParenthesizedExpression | TypeCastExpression;
declare type For = ForInStatement | ForStatement | ForOfStatement;
declare type ForXStatement = ForInStatement | ForOfStatement;
declare type Function = FunctionDeclaration | FunctionExpression | ObjectMethod | ArrowFunctionExpression | ClassMethod | ClassPrivateMethod;
declare type FunctionParent = FunctionDeclaration | FunctionExpression | ObjectMethod | ArrowFunctionExpression | ClassMethod | ClassPrivateMethod;
declare type Pureish = FunctionDeclaration | FunctionExpression | StringLiteral | NumericLiteral | NullLiteral | BooleanLiteral | RegExpLiteral | ArrowFunctionExpression | BigIntLiteral | DecimalLiteral;
declare type Declaration = FunctionDeclaration | VariableDeclaration | ClassDeclaration | ExportAllDeclaration | ExportDefaultDeclaration | ExportNamedDeclaration | ImportDeclaration | DeclareClass | DeclareFunction | DeclareInterface | DeclareModule | DeclareModuleExports | DeclareTypeAlias | DeclareOpaqueType | DeclareVariable | DeclareExportDeclaration | DeclareExportAllDeclaration | InterfaceDeclaration | OpaqueType | TypeAlias | EnumDeclaration | TSDeclareFunction | TSInterfaceDeclaration | TSTypeAliasDeclaration | TSEnumDeclaration | TSModuleDeclaration;
declare type PatternLike = Identifier | RestElement | AssignmentPattern | ArrayPattern | ObjectPattern;
declare type LVal = Identifier | MemberExpression | RestElement | AssignmentPattern | ArrayPattern | ObjectPattern | TSParameterProperty;
declare type TSEntityName = Identifier | TSQualifiedName;
declare type Literal = StringLiteral | NumericLiteral | NullLiteral | BooleanLiteral | RegExpLiteral | TemplateLiteral | BigIntLiteral | DecimalLiteral;
declare type Immutable = StringLiteral | NumericLiteral | NullLiteral | BooleanLiteral | BigIntLiteral | JSXAttribute | JSXClosingElement | JSXElement | JSXExpressionContainer | JSXSpreadChild | JSXOpeningElement | JSXText | JSXFragment | JSXOpeningFragment | JSXClosingFragment | DecimalLiteral;
declare type UserWhitespacable = ObjectMethod | ObjectProperty | ObjectTypeInternalSlot | ObjectTypeCallProperty | ObjectTypeIndexer | ObjectTypeProperty | ObjectTypeSpreadProperty;
declare type Method = ObjectMethod | ClassMethod | ClassPrivateMethod;
declare type ObjectMember = ObjectMethod | ObjectProperty;
declare type Property = ObjectProperty | ClassProperty | ClassPrivateProperty;
declare type UnaryLike = UnaryExpression | SpreadElement;
declare type Pattern = AssignmentPattern | ArrayPattern | ObjectPattern;
declare type Class = ClassExpression | ClassDeclaration;
declare type ModuleDeclaration = ExportAllDeclaration | ExportDefaultDeclaration | ExportNamedDeclaration | ImportDeclaration;
declare type ExportDeclaration = ExportAllDeclaration | ExportDefaultDeclaration | ExportNamedDeclaration;
declare type ModuleSpecifier = ExportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier | ImportSpecifier | ExportNamespaceSpecifier | ExportDefaultSpecifier;
declare type Flow = AnyTypeAnnotation | ArrayTypeAnnotation | BooleanTypeAnnotation | BooleanLiteralTypeAnnotation | NullLiteralTypeAnnotation | ClassImplements | DeclareClass | DeclareFunction | DeclareInterface | DeclareModule | DeclareModuleExports | DeclareTypeAlias | DeclareOpaqueType | DeclareVariable | DeclareExportDeclaration | DeclareExportAllDeclaration | DeclaredPredicate | ExistsTypeAnnotation | FunctionTypeAnnotation | FunctionTypeParam | GenericTypeAnnotation | InferredPredicate | InterfaceExtends | InterfaceDeclaration | InterfaceTypeAnnotation | IntersectionTypeAnnotation | MixedTypeAnnotation | EmptyTypeAnnotation | NullableTypeAnnotation | NumberLiteralTypeAnnotation | NumberTypeAnnotation | ObjectTypeAnnotation | ObjectTypeInternalSlot | ObjectTypeCallProperty | ObjectTypeIndexer | ObjectTypeProperty | ObjectTypeSpreadProperty | OpaqueType | QualifiedTypeIdentifier | StringLiteralTypeAnnotation | StringTypeAnnotation | SymbolTypeAnnotation | ThisTypeAnnotation | TupleTypeAnnotation | TypeofTypeAnnotation | TypeAlias | TypeAnnotation | TypeCastExpression | TypeParameter | TypeParameterDeclaration | TypeParameterInstantiation | UnionTypeAnnotation | Variance | VoidTypeAnnotation;
declare type FlowType = AnyTypeAnnotation | ArrayTypeAnnotation | BooleanTypeAnnotation | BooleanLiteralTypeAnnotation | NullLiteralTypeAnnotation | ExistsTypeAnnotation | FunctionTypeAnnotation | GenericTypeAnnotation | InterfaceTypeAnnotation | IntersectionTypeAnnotation | MixedTypeAnnotation | EmptyTypeAnnotation | NullableTypeAnnotation | NumberLiteralTypeAnnotation | NumberTypeAnnotation | ObjectTypeAnnotation | StringLiteralTypeAnnotation | StringTypeAnnotation | SymbolTypeAnnotation | ThisTypeAnnotation | TupleTypeAnnotation | TypeofTypeAnnotation | UnionTypeAnnotation | VoidTypeAnnotation;
declare type FlowBaseAnnotation = AnyTypeAnnotation | BooleanTypeAnnotation | NullLiteralTypeAnnotation | MixedTypeAnnotation | EmptyTypeAnnotation | NumberTypeAnnotation | StringTypeAnnotation | SymbolTypeAnnotation | ThisTypeAnnotation | VoidTypeAnnotation;
declare type FlowDeclaration = DeclareClass | DeclareFunction | DeclareInterface | DeclareModule | DeclareModuleExports | DeclareTypeAlias | DeclareOpaqueType | DeclareVariable | DeclareExportDeclaration | DeclareExportAllDeclaration | InterfaceDeclaration | OpaqueType | TypeAlias;
declare type FlowPredicate = DeclaredPredicate | InferredPredicate;
declare type EnumBody = EnumBooleanBody | EnumNumberBody | EnumStringBody | EnumSymbolBody;
declare type EnumMember = EnumBooleanMember | EnumNumberMember | EnumStringMember | EnumDefaultedMember;
declare type JSX = JSXAttribute | JSXClosingElement | JSXElement | JSXEmptyExpression | JSXExpressionContainer | JSXSpreadChild | JSXIdentifier | JSXMemberExpression | JSXNamespacedName | JSXOpeningElement | JSXSpreadAttribute | JSXText | JSXFragment | JSXOpeningFragment | JSXClosingFragment;
declare type Private = ClassPrivateProperty | ClassPrivateMethod | PrivateName;
declare type TSTypeElement = TSCallSignatureDeclaration | TSConstructSignatureDeclaration | TSPropertySignature | TSMethodSignature | TSIndexSignature;
declare type TSType = TSAnyKeyword | TSBooleanKeyword | TSBigIntKeyword | TSIntrinsicKeyword | TSNeverKeyword | TSNullKeyword | TSNumberKeyword | TSObjectKeyword | TSStringKeyword | TSSymbolKeyword | TSUndefinedKeyword | TSUnknownKeyword | TSVoidKeyword | TSThisType | TSFunctionType | TSConstructorType | TSTypeReference | TSTypePredicate | TSTypeQuery | TSTypeLiteral | TSArrayType | TSTupleType | TSOptionalType | TSRestType | TSUnionType | TSIntersectionType | TSConditionalType | TSInferType | TSParenthesizedType | TSTypeOperator | TSIndexedAccessType | TSMappedType | TSLiteralType | TSExpressionWithTypeArguments | TSImportType;
declare type TSBaseType = TSAnyKeyword | TSBooleanKeyword | TSBigIntKeyword | TSIntrinsicKeyword | TSNeverKeyword | TSNullKeyword | TSNumberKeyword | TSObjectKeyword | TSStringKeyword | TSSymbolKeyword | TSUndefinedKeyword | TSUnknownKeyword | TSVoidKeyword | TSThisType | TSLiteralType;
interface Aliases {
    Expression: Expression;
    Binary: Binary;
    Scopable: Scopable;
    BlockParent: BlockParent;
    Block: Block;
    Statement: Statement;
    Terminatorless: Terminatorless;
    CompletionStatement: CompletionStatement;
    Conditional: Conditional;
    Loop: Loop;
    While: While;
    ExpressionWrapper: ExpressionWrapper;
    For: For;
    ForXStatement: ForXStatement;
    Function: Function;
    FunctionParent: FunctionParent;
    Pureish: Pureish;
    Declaration: Declaration;
    PatternLike: PatternLike;
    LVal: LVal;
    TSEntityName: TSEntityName;
    Literal: Literal;
    Immutable: Immutable;
    UserWhitespacable: UserWhitespacable;
    Method: Method;
    ObjectMember: ObjectMember;
    Property: Property;
    UnaryLike: UnaryLike;
    Pattern: Pattern;
    Class: Class;
    ModuleDeclaration: ModuleDeclaration;
    ExportDeclaration: ExportDeclaration;
    ModuleSpecifier: ModuleSpecifier;
    Flow: Flow;
    FlowType: FlowType;
    FlowBaseAnnotation: FlowBaseAnnotation;
    FlowDeclaration: FlowDeclaration;
    FlowPredicate: FlowPredicate;
    EnumBody: EnumBody;
    EnumMember: EnumMember;
    JSX: JSX;
    Private: Private;
    TSTypeElement: TSTypeElement;
    TSType: TSType;
    TSBaseType: TSBaseType;
}

declare function isCompatTag(tagName?: string): boolean;

declare type ReturnedChild = JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment | Expression;
declare function buildChildren(node: {
    children: ReadonlyArray<JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment | JSXEmptyExpression>;
}): ReturnedChild[];

declare function assertNode(node?: any): asserts node is Node;

declare function assertArrayExpression(node: object | null | undefined, opts?: object | null): asserts node is ArrayExpression;
declare function assertAssignmentExpression(node: object | null | undefined, opts?: object | null): asserts node is AssignmentExpression;
declare function assertBinaryExpression(node: object | null | undefined, opts?: object | null): asserts node is BinaryExpression;
declare function assertInterpreterDirective(node: object | null | undefined, opts?: object | null): asserts node is InterpreterDirective;
declare function assertDirective(node: object | null | undefined, opts?: object | null): asserts node is Directive;
declare function assertDirectiveLiteral(node: object | null | undefined, opts?: object | null): asserts node is DirectiveLiteral;
declare function assertBlockStatement(node: object | null | undefined, opts?: object | null): asserts node is BlockStatement;
declare function assertBreakStatement(node: object | null | undefined, opts?: object | null): asserts node is BreakStatement;
declare function assertCallExpression(node: object | null | undefined, opts?: object | null): asserts node is CallExpression;
declare function assertCatchClause(node: object | null | undefined, opts?: object | null): asserts node is CatchClause;
declare function assertConditionalExpression(node: object | null | undefined, opts?: object | null): asserts node is ConditionalExpression;
declare function assertContinueStatement(node: object | null | undefined, opts?: object | null): asserts node is ContinueStatement;
declare function assertDebuggerStatement(node: object | null | undefined, opts?: object | null): asserts node is DebuggerStatement;
declare function assertDoWhileStatement(node: object | null | undefined, opts?: object | null): asserts node is DoWhileStatement;
declare function assertEmptyStatement(node: object | null | undefined, opts?: object | null): asserts node is EmptyStatement;
declare function assertExpressionStatement(node: object | null | undefined, opts?: object | null): asserts node is ExpressionStatement;
declare function assertFile(node: object | null | undefined, opts?: object | null): asserts node is File;
declare function assertForInStatement(node: object | null | undefined, opts?: object | null): asserts node is ForInStatement;
declare function assertForStatement(node: object | null | undefined, opts?: object | null): asserts node is ForStatement;
declare function assertFunctionDeclaration(node: object | null | undefined, opts?: object | null): asserts node is FunctionDeclaration;
declare function assertFunctionExpression(node: object | null | undefined, opts?: object | null): asserts node is FunctionExpression;
declare function assertIdentifier(node: object | null | undefined, opts?: object | null): asserts node is Identifier;
declare function assertIfStatement(node: object | null | undefined, opts?: object | null): asserts node is IfStatement;
declare function assertLabeledStatement(node: object | null | undefined, opts?: object | null): asserts node is LabeledStatement;
declare function assertStringLiteral(node: object | null | undefined, opts?: object | null): asserts node is StringLiteral;
declare function assertNumericLiteral(node: object | null | undefined, opts?: object | null): asserts node is NumericLiteral;
declare function assertNullLiteral(node: object | null | undefined, opts?: object | null): asserts node is NullLiteral;
declare function assertBooleanLiteral(node: object | null | undefined, opts?: object | null): asserts node is BooleanLiteral;
declare function assertRegExpLiteral(node: object | null | undefined, opts?: object | null): asserts node is RegExpLiteral;
declare function assertLogicalExpression(node: object | null | undefined, opts?: object | null): asserts node is LogicalExpression;
declare function assertMemberExpression(node: object | null | undefined, opts?: object | null): asserts node is MemberExpression;
declare function assertNewExpression(node: object | null | undefined, opts?: object | null): asserts node is NewExpression;
declare function assertProgram(node: object | null | undefined, opts?: object | null): asserts node is Program;
declare function assertObjectExpression(node: object | null | undefined, opts?: object | null): asserts node is ObjectExpression;
declare function assertObjectMethod(node: object | null | undefined, opts?: object | null): asserts node is ObjectMethod;
declare function assertObjectProperty(node: object | null | undefined, opts?: object | null): asserts node is ObjectProperty;
declare function assertRestElement(node: object | null | undefined, opts?: object | null): asserts node is RestElement;
declare function assertReturnStatement(node: object | null | undefined, opts?: object | null): asserts node is ReturnStatement;
declare function assertSequenceExpression(node: object | null | undefined, opts?: object | null): asserts node is SequenceExpression;
declare function assertParenthesizedExpression(node: object | null | undefined, opts?: object | null): asserts node is ParenthesizedExpression;
declare function assertSwitchCase(node: object | null | undefined, opts?: object | null): asserts node is SwitchCase;
declare function assertSwitchStatement(node: object | null | undefined, opts?: object | null): asserts node is SwitchStatement;
declare function assertThisExpression(node: object | null | undefined, opts?: object | null): asserts node is ThisExpression;
declare function assertThrowStatement(node: object | null | undefined, opts?: object | null): asserts node is ThrowStatement;
declare function assertTryStatement(node: object | null | undefined, opts?: object | null): asserts node is TryStatement;
declare function assertUnaryExpression(node: object | null | undefined, opts?: object | null): asserts node is UnaryExpression;
declare function assertUpdateExpression(node: object | null | undefined, opts?: object | null): asserts node is UpdateExpression;
declare function assertVariableDeclaration(node: object | null | undefined, opts?: object | null): asserts node is VariableDeclaration;
declare function assertVariableDeclarator(node: object | null | undefined, opts?: object | null): asserts node is VariableDeclarator;
declare function assertWhileStatement(node: object | null | undefined, opts?: object | null): asserts node is WhileStatement;
declare function assertWithStatement(node: object | null | undefined, opts?: object | null): asserts node is WithStatement;
declare function assertAssignmentPattern(node: object | null | undefined, opts?: object | null): asserts node is AssignmentPattern;
declare function assertArrayPattern(node: object | null | undefined, opts?: object | null): asserts node is ArrayPattern;
declare function assertArrowFunctionExpression(node: object | null | undefined, opts?: object | null): asserts node is ArrowFunctionExpression;
declare function assertClassBody(node: object | null | undefined, opts?: object | null): asserts node is ClassBody;
declare function assertClassExpression(node: object | null | undefined, opts?: object | null): asserts node is ClassExpression;
declare function assertClassDeclaration(node: object | null | undefined, opts?: object | null): asserts node is ClassDeclaration;
declare function assertExportAllDeclaration(node: object | null | undefined, opts?: object | null): asserts node is ExportAllDeclaration;
declare function assertExportDefaultDeclaration(node: object | null | undefined, opts?: object | null): asserts node is ExportDefaultDeclaration;
declare function assertExportNamedDeclaration(node: object | null | undefined, opts?: object | null): asserts node is ExportNamedDeclaration;
declare function assertExportSpecifier(node: object | null | undefined, opts?: object | null): asserts node is ExportSpecifier;
declare function assertForOfStatement(node: object | null | undefined, opts?: object | null): asserts node is ForOfStatement;
declare function assertImportDeclaration(node: object | null | undefined, opts?: object | null): asserts node is ImportDeclaration;
declare function assertImportDefaultSpecifier(node: object | null | undefined, opts?: object | null): asserts node is ImportDefaultSpecifier;
declare function assertImportNamespaceSpecifier(node: object | null | undefined, opts?: object | null): asserts node is ImportNamespaceSpecifier;
declare function assertImportSpecifier(node: object | null | undefined, opts?: object | null): asserts node is ImportSpecifier;
declare function assertMetaProperty(node: object | null | undefined, opts?: object | null): asserts node is MetaProperty;
declare function assertClassMethod(node: object | null | undefined, opts?: object | null): asserts node is ClassMethod;
declare function assertObjectPattern(node: object | null | undefined, opts?: object | null): asserts node is ObjectPattern;
declare function assertSpreadElement(node: object | null | undefined, opts?: object | null): asserts node is SpreadElement;
declare function assertSuper(node: object | null | undefined, opts?: object | null): asserts node is Super;
declare function assertTaggedTemplateExpression(node: object | null | undefined, opts?: object | null): asserts node is TaggedTemplateExpression;
declare function assertTemplateElement(node: object | null | undefined, opts?: object | null): asserts node is TemplateElement;
declare function assertTemplateLiteral(node: object | null | undefined, opts?: object | null): asserts node is TemplateLiteral;
declare function assertYieldExpression(node: object | null | undefined, opts?: object | null): asserts node is YieldExpression;
declare function assertAwaitExpression(node: object | null | undefined, opts?: object | null): asserts node is AwaitExpression;
declare function assertImport(node: object | null | undefined, opts?: object | null): asserts node is Import;
declare function assertBigIntLiteral(node: object | null | undefined, opts?: object | null): asserts node is BigIntLiteral;
declare function assertExportNamespaceSpecifier(node: object | null | undefined, opts?: object | null): asserts node is ExportNamespaceSpecifier;
declare function assertOptionalMemberExpression(node: object | null | undefined, opts?: object | null): asserts node is OptionalMemberExpression;
declare function assertOptionalCallExpression(node: object | null | undefined, opts?: object | null): asserts node is OptionalCallExpression;
declare function assertAnyTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is AnyTypeAnnotation;
declare function assertArrayTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is ArrayTypeAnnotation;
declare function assertBooleanTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is BooleanTypeAnnotation;
declare function assertBooleanLiteralTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is BooleanLiteralTypeAnnotation;
declare function assertNullLiteralTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is NullLiteralTypeAnnotation;
declare function assertClassImplements(node: object | null | undefined, opts?: object | null): asserts node is ClassImplements;
declare function assertDeclareClass(node: object | null | undefined, opts?: object | null): asserts node is DeclareClass;
declare function assertDeclareFunction(node: object | null | undefined, opts?: object | null): asserts node is DeclareFunction;
declare function assertDeclareInterface(node: object | null | undefined, opts?: object | null): asserts node is DeclareInterface;
declare function assertDeclareModule(node: object | null | undefined, opts?: object | null): asserts node is DeclareModule;
declare function assertDeclareModuleExports(node: object | null | undefined, opts?: object | null): asserts node is DeclareModuleExports;
declare function assertDeclareTypeAlias(node: object | null | undefined, opts?: object | null): asserts node is DeclareTypeAlias;
declare function assertDeclareOpaqueType(node: object | null | undefined, opts?: object | null): asserts node is DeclareOpaqueType;
declare function assertDeclareVariable(node: object | null | undefined, opts?: object | null): asserts node is DeclareVariable;
declare function assertDeclareExportDeclaration(node: object | null | undefined, opts?: object | null): asserts node is DeclareExportDeclaration;
declare function assertDeclareExportAllDeclaration(node: object | null | undefined, opts?: object | null): asserts node is DeclareExportAllDeclaration;
declare function assertDeclaredPredicate(node: object | null | undefined, opts?: object | null): asserts node is DeclaredPredicate;
declare function assertExistsTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is ExistsTypeAnnotation;
declare function assertFunctionTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is FunctionTypeAnnotation;
declare function assertFunctionTypeParam(node: object | null | undefined, opts?: object | null): asserts node is FunctionTypeParam;
declare function assertGenericTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is GenericTypeAnnotation;
declare function assertInferredPredicate(node: object | null | undefined, opts?: object | null): asserts node is InferredPredicate;
declare function assertInterfaceExtends(node: object | null | undefined, opts?: object | null): asserts node is InterfaceExtends;
declare function assertInterfaceDeclaration(node: object | null | undefined, opts?: object | null): asserts node is InterfaceDeclaration;
declare function assertInterfaceTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is InterfaceTypeAnnotation;
declare function assertIntersectionTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is IntersectionTypeAnnotation;
declare function assertMixedTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is MixedTypeAnnotation;
declare function assertEmptyTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is EmptyTypeAnnotation;
declare function assertNullableTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is NullableTypeAnnotation;
declare function assertNumberLiteralTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is NumberLiteralTypeAnnotation;
declare function assertNumberTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is NumberTypeAnnotation;
declare function assertObjectTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is ObjectTypeAnnotation;
declare function assertObjectTypeInternalSlot(node: object | null | undefined, opts?: object | null): asserts node is ObjectTypeInternalSlot;
declare function assertObjectTypeCallProperty(node: object | null | undefined, opts?: object | null): asserts node is ObjectTypeCallProperty;
declare function assertObjectTypeIndexer(node: object | null | undefined, opts?: object | null): asserts node is ObjectTypeIndexer;
declare function assertObjectTypeProperty(node: object | null | undefined, opts?: object | null): asserts node is ObjectTypeProperty;
declare function assertObjectTypeSpreadProperty(node: object | null | undefined, opts?: object | null): asserts node is ObjectTypeSpreadProperty;
declare function assertOpaqueType(node: object | null | undefined, opts?: object | null): asserts node is OpaqueType;
declare function assertQualifiedTypeIdentifier(node: object | null | undefined, opts?: object | null): asserts node is QualifiedTypeIdentifier;
declare function assertStringLiteralTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is StringLiteralTypeAnnotation;
declare function assertStringTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is StringTypeAnnotation;
declare function assertSymbolTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is SymbolTypeAnnotation;
declare function assertThisTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is ThisTypeAnnotation;
declare function assertTupleTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is TupleTypeAnnotation;
declare function assertTypeofTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is TypeofTypeAnnotation;
declare function assertTypeAlias(node: object | null | undefined, opts?: object | null): asserts node is TypeAlias;
declare function assertTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is TypeAnnotation;
declare function assertTypeCastExpression(node: object | null | undefined, opts?: object | null): asserts node is TypeCastExpression;
declare function assertTypeParameter(node: object | null | undefined, opts?: object | null): asserts node is TypeParameter;
declare function assertTypeParameterDeclaration(node: object | null | undefined, opts?: object | null): asserts node is TypeParameterDeclaration;
declare function assertTypeParameterInstantiation(node: object | null | undefined, opts?: object | null): asserts node is TypeParameterInstantiation;
declare function assertUnionTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is UnionTypeAnnotation;
declare function assertVariance(node: object | null | undefined, opts?: object | null): asserts node is Variance;
declare function assertVoidTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is VoidTypeAnnotation;
declare function assertEnumDeclaration(node: object | null | undefined, opts?: object | null): asserts node is EnumDeclaration;
declare function assertEnumBooleanBody(node: object | null | undefined, opts?: object | null): asserts node is EnumBooleanBody;
declare function assertEnumNumberBody(node: object | null | undefined, opts?: object | null): asserts node is EnumNumberBody;
declare function assertEnumStringBody(node: object | null | undefined, opts?: object | null): asserts node is EnumStringBody;
declare function assertEnumSymbolBody(node: object | null | undefined, opts?: object | null): asserts node is EnumSymbolBody;
declare function assertEnumBooleanMember(node: object | null | undefined, opts?: object | null): asserts node is EnumBooleanMember;
declare function assertEnumNumberMember(node: object | null | undefined, opts?: object | null): asserts node is EnumNumberMember;
declare function assertEnumStringMember(node: object | null | undefined, opts?: object | null): asserts node is EnumStringMember;
declare function assertEnumDefaultedMember(node: object | null | undefined, opts?: object | null): asserts node is EnumDefaultedMember;
declare function assertJSXAttribute(node: object | null | undefined, opts?: object | null): asserts node is JSXAttribute;
declare function assertJSXClosingElement(node: object | null | undefined, opts?: object | null): asserts node is JSXClosingElement;
declare function assertJSXElement(node: object | null | undefined, opts?: object | null): asserts node is JSXElement;
declare function assertJSXEmptyExpression(node: object | null | undefined, opts?: object | null): asserts node is JSXEmptyExpression;
declare function assertJSXExpressionContainer(node: object | null | undefined, opts?: object | null): asserts node is JSXExpressionContainer;
declare function assertJSXSpreadChild(node: object | null | undefined, opts?: object | null): asserts node is JSXSpreadChild;
declare function assertJSXIdentifier(node: object | null | undefined, opts?: object | null): asserts node is JSXIdentifier;
declare function assertJSXMemberExpression(node: object | null | undefined, opts?: object | null): asserts node is JSXMemberExpression;
declare function assertJSXNamespacedName(node: object | null | undefined, opts?: object | null): asserts node is JSXNamespacedName;
declare function assertJSXOpeningElement(node: object | null | undefined, opts?: object | null): asserts node is JSXOpeningElement;
declare function assertJSXSpreadAttribute(node: object | null | undefined, opts?: object | null): asserts node is JSXSpreadAttribute;
declare function assertJSXText(node: object | null | undefined, opts?: object | null): asserts node is JSXText;
declare function assertJSXFragment(node: object | null | undefined, opts?: object | null): asserts node is JSXFragment;
declare function assertJSXOpeningFragment(node: object | null | undefined, opts?: object | null): asserts node is JSXOpeningFragment;
declare function assertJSXClosingFragment(node: object | null | undefined, opts?: object | null): asserts node is JSXClosingFragment;
declare function assertNoop(node: object | null | undefined, opts?: object | null): asserts node is Noop;
declare function assertPlaceholder(node: object | null | undefined, opts?: object | null): asserts node is Placeholder;
declare function assertV8IntrinsicIdentifier(node: object | null | undefined, opts?: object | null): asserts node is V8IntrinsicIdentifier;
declare function assertArgumentPlaceholder(node: object | null | undefined, opts?: object | null): asserts node is ArgumentPlaceholder;
declare function assertBindExpression(node: object | null | undefined, opts?: object | null): asserts node is BindExpression;
declare function assertClassProperty(node: object | null | undefined, opts?: object | null): asserts node is ClassProperty;
declare function assertPipelineTopicExpression(node: object | null | undefined, opts?: object | null): asserts node is PipelineTopicExpression;
declare function assertPipelineBareFunction(node: object | null | undefined, opts?: object | null): asserts node is PipelineBareFunction;
declare function assertPipelinePrimaryTopicReference(node: object | null | undefined, opts?: object | null): asserts node is PipelinePrimaryTopicReference;
declare function assertClassPrivateProperty(node: object | null | undefined, opts?: object | null): asserts node is ClassPrivateProperty;
declare function assertClassPrivateMethod(node: object | null | undefined, opts?: object | null): asserts node is ClassPrivateMethod;
declare function assertImportAttribute(node: object | null | undefined, opts?: object | null): asserts node is ImportAttribute;
declare function assertDecorator(node: object | null | undefined, opts?: object | null): asserts node is Decorator;
declare function assertDoExpression(node: object | null | undefined, opts?: object | null): asserts node is DoExpression;
declare function assertExportDefaultSpecifier(node: object | null | undefined, opts?: object | null): asserts node is ExportDefaultSpecifier;
declare function assertPrivateName(node: object | null | undefined, opts?: object | null): asserts node is PrivateName;
declare function assertRecordExpression(node: object | null | undefined, opts?: object | null): asserts node is RecordExpression;
declare function assertTupleExpression(node: object | null | undefined, opts?: object | null): asserts node is TupleExpression;
declare function assertDecimalLiteral(node: object | null | undefined, opts?: object | null): asserts node is DecimalLiteral;
declare function assertStaticBlock(node: object | null | undefined, opts?: object | null): asserts node is StaticBlock;
declare function assertModuleExpression(node: object | null | undefined, opts?: object | null): asserts node is ModuleExpression;
declare function assertTSParameterProperty(node: object | null | undefined, opts?: object | null): asserts node is TSParameterProperty;
declare function assertTSDeclareFunction(node: object | null | undefined, opts?: object | null): asserts node is TSDeclareFunction;
declare function assertTSDeclareMethod(node: object | null | undefined, opts?: object | null): asserts node is TSDeclareMethod;
declare function assertTSQualifiedName(node: object | null | undefined, opts?: object | null): asserts node is TSQualifiedName;
declare function assertTSCallSignatureDeclaration(node: object | null | undefined, opts?: object | null): asserts node is TSCallSignatureDeclaration;
declare function assertTSConstructSignatureDeclaration(node: object | null | undefined, opts?: object | null): asserts node is TSConstructSignatureDeclaration;
declare function assertTSPropertySignature(node: object | null | undefined, opts?: object | null): asserts node is TSPropertySignature;
declare function assertTSMethodSignature(node: object | null | undefined, opts?: object | null): asserts node is TSMethodSignature;
declare function assertTSIndexSignature(node: object | null | undefined, opts?: object | null): asserts node is TSIndexSignature;
declare function assertTSAnyKeyword(node: object | null | undefined, opts?: object | null): asserts node is TSAnyKeyword;
declare function assertTSBooleanKeyword(node: object | null | undefined, opts?: object | null): asserts node is TSBooleanKeyword;
declare function assertTSBigIntKeyword(node: object | null | undefined, opts?: object | null): asserts node is TSBigIntKeyword;
declare function assertTSIntrinsicKeyword(node: object | null | undefined, opts?: object | null): asserts node is TSIntrinsicKeyword;
declare function assertTSNeverKeyword(node: object | null | undefined, opts?: object | null): asserts node is TSNeverKeyword;
declare function assertTSNullKeyword(node: object | null | undefined, opts?: object | null): asserts node is TSNullKeyword;
declare function assertTSNumberKeyword(node: object | null | undefined, opts?: object | null): asserts node is TSNumberKeyword;
declare function assertTSObjectKeyword(node: object | null | undefined, opts?: object | null): asserts node is TSObjectKeyword;
declare function assertTSStringKeyword(node: object | null | undefined, opts?: object | null): asserts node is TSStringKeyword;
declare function assertTSSymbolKeyword(node: object | null | undefined, opts?: object | null): asserts node is TSSymbolKeyword;
declare function assertTSUndefinedKeyword(node: object | null | undefined, opts?: object | null): asserts node is TSUndefinedKeyword;
declare function assertTSUnknownKeyword(node: object | null | undefined, opts?: object | null): asserts node is TSUnknownKeyword;
declare function assertTSVoidKeyword(node: object | null | undefined, opts?: object | null): asserts node is TSVoidKeyword;
declare function assertTSThisType(node: object | null | undefined, opts?: object | null): asserts node is TSThisType;
declare function assertTSFunctionType(node: object | null | undefined, opts?: object | null): asserts node is TSFunctionType;
declare function assertTSConstructorType(node: object | null | undefined, opts?: object | null): asserts node is TSConstructorType;
declare function assertTSTypeReference(node: object | null | undefined, opts?: object | null): asserts node is TSTypeReference;
declare function assertTSTypePredicate(node: object | null | undefined, opts?: object | null): asserts node is TSTypePredicate;
declare function assertTSTypeQuery(node: object | null | undefined, opts?: object | null): asserts node is TSTypeQuery;
declare function assertTSTypeLiteral(node: object | null | undefined, opts?: object | null): asserts node is TSTypeLiteral;
declare function assertTSArrayType(node: object | null | undefined, opts?: object | null): asserts node is TSArrayType;
declare function assertTSTupleType(node: object | null | undefined, opts?: object | null): asserts node is TSTupleType;
declare function assertTSOptionalType(node: object | null | undefined, opts?: object | null): asserts node is TSOptionalType;
declare function assertTSRestType(node: object | null | undefined, opts?: object | null): asserts node is TSRestType;
declare function assertTSNamedTupleMember(node: object | null | undefined, opts?: object | null): asserts node is TSNamedTupleMember;
declare function assertTSUnionType(node: object | null | undefined, opts?: object | null): asserts node is TSUnionType;
declare function assertTSIntersectionType(node: object | null | undefined, opts?: object | null): asserts node is TSIntersectionType;
declare function assertTSConditionalType(node: object | null | undefined, opts?: object | null): asserts node is TSConditionalType;
declare function assertTSInferType(node: object | null | undefined, opts?: object | null): asserts node is TSInferType;
declare function assertTSParenthesizedType(node: object | null | undefined, opts?: object | null): asserts node is TSParenthesizedType;
declare function assertTSTypeOperator(node: object | null | undefined, opts?: object | null): asserts node is TSTypeOperator;
declare function assertTSIndexedAccessType(node: object | null | undefined, opts?: object | null): asserts node is TSIndexedAccessType;
declare function assertTSMappedType(node: object | null | undefined, opts?: object | null): asserts node is TSMappedType;
declare function assertTSLiteralType(node: object | null | undefined, opts?: object | null): asserts node is TSLiteralType;
declare function assertTSExpressionWithTypeArguments(node: object | null | undefined, opts?: object | null): asserts node is TSExpressionWithTypeArguments;
declare function assertTSInterfaceDeclaration(node: object | null | undefined, opts?: object | null): asserts node is TSInterfaceDeclaration;
declare function assertTSInterfaceBody(node: object | null | undefined, opts?: object | null): asserts node is TSInterfaceBody;
declare function assertTSTypeAliasDeclaration(node: object | null | undefined, opts?: object | null): asserts node is TSTypeAliasDeclaration;
declare function assertTSAsExpression(node: object | null | undefined, opts?: object | null): asserts node is TSAsExpression;
declare function assertTSTypeAssertion(node: object | null | undefined, opts?: object | null): asserts node is TSTypeAssertion;
declare function assertTSEnumDeclaration(node: object | null | undefined, opts?: object | null): asserts node is TSEnumDeclaration;
declare function assertTSEnumMember(node: object | null | undefined, opts?: object | null): asserts node is TSEnumMember;
declare function assertTSModuleDeclaration(node: object | null | undefined, opts?: object | null): asserts node is TSModuleDeclaration;
declare function assertTSModuleBlock(node: object | null | undefined, opts?: object | null): asserts node is TSModuleBlock;
declare function assertTSImportType(node: object | null | undefined, opts?: object | null): asserts node is TSImportType;
declare function assertTSImportEqualsDeclaration(node: object | null | undefined, opts?: object | null): asserts node is TSImportEqualsDeclaration;
declare function assertTSExternalModuleReference(node: object | null | undefined, opts?: object | null): asserts node is TSExternalModuleReference;
declare function assertTSNonNullExpression(node: object | null | undefined, opts?: object | null): asserts node is TSNonNullExpression;
declare function assertTSExportAssignment(node: object | null | undefined, opts?: object | null): asserts node is TSExportAssignment;
declare function assertTSNamespaceExportDeclaration(node: object | null | undefined, opts?: object | null): asserts node is TSNamespaceExportDeclaration;
declare function assertTSTypeAnnotation(node: object | null | undefined, opts?: object | null): asserts node is TSTypeAnnotation;
declare function assertTSTypeParameterInstantiation(node: object | null | undefined, opts?: object | null): asserts node is TSTypeParameterInstantiation;
declare function assertTSTypeParameterDeclaration(node: object | null | undefined, opts?: object | null): asserts node is TSTypeParameterDeclaration;
declare function assertTSTypeParameter(node: object | null | undefined, opts?: object | null): asserts node is TSTypeParameter;
declare function assertExpression(node: object | null | undefined, opts?: object | null): asserts node is Expression;
declare function assertBinary(node: object | null | undefined, opts?: object | null): asserts node is Binary;
declare function assertScopable(node: object | null | undefined, opts?: object | null): asserts node is Scopable;
declare function assertBlockParent(node: object | null | undefined, opts?: object | null): asserts node is BlockParent;
declare function assertBlock(node: object | null | undefined, opts?: object | null): asserts node is Block;
declare function assertStatement(node: object | null | undefined, opts?: object | null): asserts node is Statement;
declare function assertTerminatorless(node: object | null | undefined, opts?: object | null): asserts node is Terminatorless;
declare function assertCompletionStatement(node: object | null | undefined, opts?: object | null): asserts node is CompletionStatement;
declare function assertConditional(node: object | null | undefined, opts?: object | null): asserts node is Conditional;
declare function assertLoop(node: object | null | undefined, opts?: object | null): asserts node is Loop;
declare function assertWhile(node: object | null | undefined, opts?: object | null): asserts node is While;
declare function assertExpressionWrapper(node: object | null | undefined, opts?: object | null): asserts node is ExpressionWrapper;
declare function assertFor(node: object | null | undefined, opts?: object | null): asserts node is For;
declare function assertForXStatement(node: object | null | undefined, opts?: object | null): asserts node is ForXStatement;
declare function assertFunction(node: object | null | undefined, opts?: object | null): asserts node is Function;
declare function assertFunctionParent(node: object | null | undefined, opts?: object | null): asserts node is FunctionParent;
declare function assertPureish(node: object | null | undefined, opts?: object | null): asserts node is Pureish;
declare function assertDeclaration(node: object | null | undefined, opts?: object | null): asserts node is Declaration;
declare function assertPatternLike(node: object | null | undefined, opts?: object | null): asserts node is PatternLike;
declare function assertLVal(node: object | null | undefined, opts?: object | null): asserts node is LVal;
declare function assertTSEntityName(node: object | null | undefined, opts?: object | null): asserts node is TSEntityName;
declare function assertLiteral(node: object | null | undefined, opts?: object | null): asserts node is Literal;
declare function assertImmutable(node: object | null | undefined, opts?: object | null): asserts node is Immutable;
declare function assertUserWhitespacable(node: object | null | undefined, opts?: object | null): asserts node is UserWhitespacable;
declare function assertMethod(node: object | null | undefined, opts?: object | null): asserts node is Method;
declare function assertObjectMember(node: object | null | undefined, opts?: object | null): asserts node is ObjectMember;
declare function assertProperty(node: object | null | undefined, opts?: object | null): asserts node is Property;
declare function assertUnaryLike(node: object | null | undefined, opts?: object | null): asserts node is UnaryLike;
declare function assertPattern(node: object | null | undefined, opts?: object | null): asserts node is Pattern;
declare function assertClass(node: object | null | undefined, opts?: object | null): asserts node is Class;
declare function assertModuleDeclaration(node: object | null | undefined, opts?: object | null): asserts node is ModuleDeclaration;
declare function assertExportDeclaration(node: object | null | undefined, opts?: object | null): asserts node is ExportDeclaration;
declare function assertModuleSpecifier(node: object | null | undefined, opts?: object | null): asserts node is ModuleSpecifier;
declare function assertFlow(node: object | null | undefined, opts?: object | null): asserts node is Flow;
declare function assertFlowType(node: object | null | undefined, opts?: object | null): asserts node is FlowType;
declare function assertFlowBaseAnnotation(node: object | null | undefined, opts?: object | null): asserts node is FlowBaseAnnotation;
declare function assertFlowDeclaration(node: object | null | undefined, opts?: object | null): asserts node is FlowDeclaration;
declare function assertFlowPredicate(node: object | null | undefined, opts?: object | null): asserts node is FlowPredicate;
declare function assertEnumBody(node: object | null | undefined, opts?: object | null): asserts node is EnumBody;
declare function assertEnumMember(node: object | null | undefined, opts?: object | null): asserts node is EnumMember;
declare function assertJSX(node: object | null | undefined, opts?: object | null): asserts node is JSX;
declare function assertPrivate(node: object | null | undefined, opts?: object | null): asserts node is Private;
declare function assertTSTypeElement(node: object | null | undefined, opts?: object | null): asserts node is TSTypeElement;
declare function assertTSType(node: object | null | undefined, opts?: object | null): asserts node is TSType;
declare function assertTSBaseType(node: object | null | undefined, opts?: object | null): asserts node is TSBaseType;
declare function assertNumberLiteral(node: any, opts: any): void;
declare function assertRegexLiteral(node: any, opts: any): void;
declare function assertRestProperty(node: any, opts: any): void;
declare function assertSpreadProperty(node: any, opts: any): void;

/**
 * Create a type annotation based on typeof expression.
 */
declare function createTypeAnnotationBasedOnTypeof(type: "string" | "number" | "undefined" | "boolean" | "function" | "object" | "symbol"): StringTypeAnnotation | VoidTypeAnnotation | NumberTypeAnnotation | BooleanTypeAnnotation | GenericTypeAnnotation | AnyTypeAnnotation;

/**
 * Takes an array of `types` and flattens them, removing duplicates and
 * returns a `UnionTypeAnnotation` node containing them.
 */
declare function createFlowUnionType<T extends FlowType>(types: [T] | Array<T>): T | UnionTypeAnnotation;

/**
 * Takes an array of `types` and flattens them, removing duplicates and
 * returns a `UnionTypeAnnotation` node containing them.
 */
declare function createTSUnionType(typeAnnotations: Array<TSTypeAnnotation>): TSType;

declare function arrayExpression(elements?: Array<null | Expression | SpreadElement>): ArrayExpression;
declare function assignmentExpression(operator: string, left: LVal, right: Expression): AssignmentExpression;
declare function binaryExpression(operator: "+" | "-" | "/" | "%" | "*" | "**" | "&" | "|" | ">>" | ">>>" | "<<" | "^" | "==" | "===" | "!=" | "!==" | "in" | "instanceof" | ">" | "<" | ">=" | "<=", left: Expression | PrivateName, right: Expression): BinaryExpression;
declare function interpreterDirective(value: string): InterpreterDirective;
declare function directive(value: DirectiveLiteral): Directive;
declare function directiveLiteral(value: string): DirectiveLiteral;
declare function blockStatement(body: Array<Statement>, directives?: Array<Directive>): BlockStatement;
declare function breakStatement(label?: Identifier | null): BreakStatement;
declare function callExpression(callee: Expression | V8IntrinsicIdentifier, _arguments: Array<Expression | SpreadElement | JSXNamespacedName | ArgumentPlaceholder>): CallExpression;
declare function catchClause(param: Identifier | ArrayPattern | ObjectPattern | null | undefined, body: BlockStatement): CatchClause;
declare function conditionalExpression(test: Expression, consequent: Expression, alternate: Expression): ConditionalExpression;
declare function continueStatement(label?: Identifier | null): ContinueStatement;
declare function debuggerStatement(): DebuggerStatement;
declare function doWhileStatement(test: Expression, body: Statement): DoWhileStatement;
declare function emptyStatement(): EmptyStatement;
declare function expressionStatement(expression: Expression): ExpressionStatement;
declare function file(program: Program, comments?: Array<CommentBlock | CommentLine> | null, tokens?: Array<any> | null): File;
declare function forInStatement(left: VariableDeclaration | LVal, right: Expression, body: Statement): ForInStatement;
declare function forStatement(init: VariableDeclaration | Expression | null | undefined, test: Expression | null | undefined, update: Expression | null | undefined, body: Statement): ForStatement;
declare function functionDeclaration(id: Identifier | null | undefined, params: Array<Identifier | Pattern | RestElement | TSParameterProperty>, body: BlockStatement, generator?: boolean, async?: boolean): FunctionDeclaration;
declare function functionExpression(id: Identifier | null | undefined, params: Array<Identifier | Pattern | RestElement | TSParameterProperty>, body: BlockStatement, generator?: boolean, async?: boolean): FunctionExpression;
declare function identifier(name: string): Identifier;
declare function ifStatement(test: Expression, consequent: Statement, alternate?: Statement | null): IfStatement;
declare function labeledStatement(label: Identifier, body: Statement): LabeledStatement;
declare function stringLiteral(value: string): StringLiteral;
declare function numericLiteral(value: number): NumericLiteral;
declare function nullLiteral(): NullLiteral;
declare function booleanLiteral(value: boolean): BooleanLiteral;
declare function regExpLiteral(pattern: string, flags?: string): RegExpLiteral;
declare function logicalExpression(operator: "||" | "&&" | "??", left: Expression, right: Expression): LogicalExpression;
declare function memberExpression(object: Expression, property: Expression | Identifier | PrivateName, computed?: boolean, optional?: true | false | null): MemberExpression;
declare function newExpression(callee: Expression | V8IntrinsicIdentifier, _arguments: Array<Expression | SpreadElement | JSXNamespacedName | ArgumentPlaceholder>): NewExpression;
declare function program(body: Array<Statement>, directives?: Array<Directive>, sourceType?: "script" | "module", interpreter?: InterpreterDirective | null): Program;
declare function objectExpression(properties: Array<ObjectMethod | ObjectProperty | SpreadElement>): ObjectExpression;
declare function objectMethod(kind: "method" | "get" | "set" | undefined, key: Expression | Identifier | StringLiteral | NumericLiteral, params: Array<Identifier | Pattern | RestElement | TSParameterProperty>, body: BlockStatement, computed?: boolean, generator?: boolean, async?: boolean): ObjectMethod;
declare function objectProperty(key: Expression | Identifier | StringLiteral | NumericLiteral, value: Expression | PatternLike, computed?: boolean, shorthand?: boolean, decorators?: Array<Decorator> | null): ObjectProperty;
declare function restElement(argument: LVal): RestElement;
declare function returnStatement(argument?: Expression | null): ReturnStatement;
declare function sequenceExpression(expressions: Array<Expression>): SequenceExpression;
declare function parenthesizedExpression(expression: Expression): ParenthesizedExpression;
declare function switchCase(test: Expression | null | undefined, consequent: Array<Statement>): SwitchCase;
declare function switchStatement(discriminant: Expression, cases: Array<SwitchCase>): SwitchStatement;
declare function thisExpression(): ThisExpression;
declare function throwStatement(argument: Expression): ThrowStatement;
declare function tryStatement(block: BlockStatement, handler?: CatchClause | null, finalizer?: BlockStatement | null): TryStatement;
declare function unaryExpression(operator: "void" | "throw" | "delete" | "!" | "+" | "-" | "~" | "typeof", argument: Expression, prefix?: boolean): UnaryExpression;
declare function updateExpression(operator: "++" | "--", argument: Expression, prefix?: boolean): UpdateExpression;
declare function variableDeclaration(kind: "var" | "let" | "const", declarations: Array<VariableDeclarator>): VariableDeclaration;
declare function variableDeclarator(id: LVal, init?: Expression | null): VariableDeclarator;
declare function whileStatement(test: Expression, body: Statement): WhileStatement;
declare function withStatement(object: Expression, body: Statement): WithStatement;
declare function assignmentPattern(left: Identifier | ObjectPattern | ArrayPattern | MemberExpression, right: Expression): AssignmentPattern;
declare function arrayPattern(elements: Array<null | PatternLike>): ArrayPattern;
declare function arrowFunctionExpression(params: Array<Identifier | Pattern | RestElement | TSParameterProperty>, body: BlockStatement | Expression, async?: boolean): ArrowFunctionExpression;
declare function classBody(body: Array<ClassMethod | ClassPrivateMethod | ClassProperty | ClassPrivateProperty | TSDeclareMethod | TSIndexSignature>): ClassBody;
declare function classExpression(id: Identifier | null | undefined, superClass: Expression | null | undefined, body: ClassBody, decorators?: Array<Decorator> | null): ClassExpression;
declare function classDeclaration(id: Identifier, superClass: Expression | null | undefined, body: ClassBody, decorators?: Array<Decorator> | null): ClassDeclaration;
declare function exportAllDeclaration(source: StringLiteral): ExportAllDeclaration;
declare function exportDefaultDeclaration(declaration: FunctionDeclaration | TSDeclareFunction | ClassDeclaration | Expression): ExportDefaultDeclaration;
declare function exportNamedDeclaration(declaration?: Declaration | null, specifiers?: Array<ExportSpecifier | ExportDefaultSpecifier | ExportNamespaceSpecifier>, source?: StringLiteral | null): ExportNamedDeclaration;
declare function exportSpecifier(local: Identifier, exported: Identifier | StringLiteral): ExportSpecifier;
declare function forOfStatement(left: VariableDeclaration | LVal, right: Expression, body: Statement, _await?: boolean): ForOfStatement;
declare function importDeclaration(specifiers: Array<ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier>, source: StringLiteral): ImportDeclaration;
declare function importDefaultSpecifier(local: Identifier): ImportDefaultSpecifier;
declare function importNamespaceSpecifier(local: Identifier): ImportNamespaceSpecifier;
declare function importSpecifier(local: Identifier, imported: Identifier | StringLiteral): ImportSpecifier;
declare function metaProperty(meta: Identifier, property: Identifier): MetaProperty;
declare function classMethod(kind: "get" | "set" | "method" | "constructor" | undefined, key: Identifier | StringLiteral | NumericLiteral | Expression, params: Array<Identifier | Pattern | RestElement | TSParameterProperty>, body: BlockStatement, computed?: boolean, _static?: boolean, generator?: boolean, async?: boolean): ClassMethod;
declare function objectPattern(properties: Array<RestElement | ObjectProperty>): ObjectPattern;
declare function spreadElement(argument: Expression): SpreadElement;
declare function _super(): Super;

declare function taggedTemplateExpression(tag: Expression, quasi: TemplateLiteral): TaggedTemplateExpression;
declare function templateElement(value: {
    raw: string;
    cooked?: string;
}, tail?: boolean): TemplateElement;
declare function templateLiteral(quasis: Array<TemplateElement>, expressions: Array<Expression | TSType>): TemplateLiteral;
declare function yieldExpression(argument?: Expression | null, delegate?: boolean): YieldExpression;
declare function awaitExpression(argument: Expression): AwaitExpression;
declare function _import(): Import;

declare function bigIntLiteral(value: string): BigIntLiteral;
declare function exportNamespaceSpecifier(exported: Identifier): ExportNamespaceSpecifier;
declare function optionalMemberExpression(object: Expression, property: Expression | Identifier, computed: boolean | undefined, optional: boolean): OptionalMemberExpression;
declare function optionalCallExpression(callee: Expression, _arguments: Array<Expression | SpreadElement | JSXNamespacedName | ArgumentPlaceholder>, optional: boolean): OptionalCallExpression;
declare function anyTypeAnnotation(): AnyTypeAnnotation;
declare function arrayTypeAnnotation(elementType: FlowType): ArrayTypeAnnotation;
declare function booleanTypeAnnotation(): BooleanTypeAnnotation;
declare function booleanLiteralTypeAnnotation(value: boolean): BooleanLiteralTypeAnnotation;
declare function nullLiteralTypeAnnotation(): NullLiteralTypeAnnotation;
declare function classImplements(id: Identifier, typeParameters?: TypeParameterInstantiation | null): ClassImplements;
declare function declareClass(id: Identifier, typeParameters: TypeParameterDeclaration | null | undefined, _extends: Array<InterfaceExtends> | null | undefined, body: ObjectTypeAnnotation): DeclareClass;
declare function declareFunction(id: Identifier): DeclareFunction;
declare function declareInterface(id: Identifier, typeParameters: TypeParameterDeclaration | null | undefined, _extends: Array<InterfaceExtends> | null | undefined, body: ObjectTypeAnnotation): DeclareInterface;
declare function declareModule(id: Identifier | StringLiteral, body: BlockStatement, kind?: "CommonJS" | "ES" | null): DeclareModule;
declare function declareModuleExports(typeAnnotation: TypeAnnotation): DeclareModuleExports;
declare function declareTypeAlias(id: Identifier, typeParameters: TypeParameterDeclaration | null | undefined, right: FlowType): DeclareTypeAlias;
declare function declareOpaqueType(id: Identifier, typeParameters?: TypeParameterDeclaration | null, supertype?: FlowType | null): DeclareOpaqueType;
declare function declareVariable(id: Identifier): DeclareVariable;
declare function declareExportDeclaration(declaration?: Flow | null, specifiers?: Array<ExportSpecifier | ExportNamespaceSpecifier> | null, source?: StringLiteral | null): DeclareExportDeclaration;
declare function declareExportAllDeclaration(source: StringLiteral): DeclareExportAllDeclaration;
declare function declaredPredicate(value: Flow): DeclaredPredicate;
declare function existsTypeAnnotation(): ExistsTypeAnnotation;
declare function functionTypeAnnotation(typeParameters: TypeParameterDeclaration | null | undefined, params: Array<FunctionTypeParam>, rest: FunctionTypeParam | null | undefined, returnType: FlowType): FunctionTypeAnnotation;
declare function functionTypeParam(name: Identifier | null | undefined, typeAnnotation: FlowType): FunctionTypeParam;
declare function genericTypeAnnotation(id: Identifier | QualifiedTypeIdentifier, typeParameters?: TypeParameterInstantiation | null): GenericTypeAnnotation;
declare function inferredPredicate(): InferredPredicate;
declare function interfaceExtends(id: Identifier | QualifiedTypeIdentifier, typeParameters?: TypeParameterInstantiation | null): InterfaceExtends;
declare function interfaceDeclaration(id: Identifier, typeParameters: TypeParameterDeclaration | null | undefined, _extends: Array<InterfaceExtends> | null | undefined, body: ObjectTypeAnnotation): InterfaceDeclaration;
declare function interfaceTypeAnnotation(_extends: Array<InterfaceExtends> | null | undefined, body: ObjectTypeAnnotation): InterfaceTypeAnnotation;
declare function intersectionTypeAnnotation(types: Array<FlowType>): IntersectionTypeAnnotation;
declare function mixedTypeAnnotation(): MixedTypeAnnotation;
declare function emptyTypeAnnotation(): EmptyTypeAnnotation;
declare function nullableTypeAnnotation(typeAnnotation: FlowType): NullableTypeAnnotation;
declare function numberLiteralTypeAnnotation(value: number): NumberLiteralTypeAnnotation;
declare function numberTypeAnnotation(): NumberTypeAnnotation;
declare function objectTypeAnnotation(properties: Array<ObjectTypeProperty | ObjectTypeSpreadProperty>, indexers?: Array<ObjectTypeIndexer> | null, callProperties?: Array<ObjectTypeCallProperty> | null, internalSlots?: Array<ObjectTypeInternalSlot> | null, exact?: boolean): ObjectTypeAnnotation;
declare function objectTypeInternalSlot(id: Identifier, value: FlowType, optional: boolean, _static: boolean, method: boolean): ObjectTypeInternalSlot;
declare function objectTypeCallProperty(value: FlowType): ObjectTypeCallProperty;
declare function objectTypeIndexer(id: Identifier | null | undefined, key: FlowType, value: FlowType, variance?: Variance | null): ObjectTypeIndexer;
declare function objectTypeProperty(key: Identifier | StringLiteral, value: FlowType, variance?: Variance | null): ObjectTypeProperty;
declare function objectTypeSpreadProperty(argument: FlowType): ObjectTypeSpreadProperty;
declare function opaqueType(id: Identifier, typeParameters: TypeParameterDeclaration | null | undefined, supertype: FlowType | null | undefined, impltype: FlowType): OpaqueType;
declare function qualifiedTypeIdentifier(id: Identifier, qualification: Identifier | QualifiedTypeIdentifier): QualifiedTypeIdentifier;
declare function stringLiteralTypeAnnotation(value: string): StringLiteralTypeAnnotation;
declare function stringTypeAnnotation(): StringTypeAnnotation;
declare function symbolTypeAnnotation(): SymbolTypeAnnotation;
declare function thisTypeAnnotation(): ThisTypeAnnotation;
declare function tupleTypeAnnotation(types: Array<FlowType>): TupleTypeAnnotation;
declare function typeofTypeAnnotation(argument: FlowType): TypeofTypeAnnotation;
declare function typeAlias(id: Identifier, typeParameters: TypeParameterDeclaration | null | undefined, right: FlowType): TypeAlias;
declare function typeAnnotation(typeAnnotation: FlowType): TypeAnnotation;
declare function typeCastExpression(expression: Expression, typeAnnotation: TypeAnnotation): TypeCastExpression;
declare function typeParameter(bound?: TypeAnnotation | null, _default?: FlowType | null, variance?: Variance | null): TypeParameter;
declare function typeParameterDeclaration(params: Array<TypeParameter>): TypeParameterDeclaration;
declare function typeParameterInstantiation(params: Array<FlowType>): TypeParameterInstantiation;
declare function unionTypeAnnotation(types: Array<FlowType>): UnionTypeAnnotation;
declare function variance(kind: "minus" | "plus"): Variance;
declare function voidTypeAnnotation(): VoidTypeAnnotation;
declare function enumDeclaration(id: Identifier, body: EnumBooleanBody | EnumNumberBody | EnumStringBody | EnumSymbolBody): EnumDeclaration;
declare function enumBooleanBody(members: Array<EnumBooleanMember>): EnumBooleanBody;
declare function enumNumberBody(members: Array<EnumNumberMember>): EnumNumberBody;
declare function enumStringBody(members: Array<EnumStringMember | EnumDefaultedMember>): EnumStringBody;
declare function enumSymbolBody(members: Array<EnumDefaultedMember>): EnumSymbolBody;
declare function enumBooleanMember(id: Identifier): EnumBooleanMember;
declare function enumNumberMember(id: Identifier, init: NumericLiteral): EnumNumberMember;
declare function enumStringMember(id: Identifier, init: StringLiteral): EnumStringMember;
declare function enumDefaultedMember(id: Identifier): EnumDefaultedMember;
declare function jsxAttribute(name: JSXIdentifier | JSXNamespacedName, value?: JSXElement | JSXFragment | StringLiteral | JSXExpressionContainer | null): JSXAttribute;

declare function jsxClosingElement(name: JSXIdentifier | JSXMemberExpression | JSXNamespacedName): JSXClosingElement;

declare function jsxElement(openingElement: JSXOpeningElement, closingElement: JSXClosingElement | null | undefined, children: Array<JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment>, selfClosing?: boolean | null): JSXElement;

declare function jsxEmptyExpression(): JSXEmptyExpression;

declare function jsxExpressionContainer(expression: Expression | JSXEmptyExpression): JSXExpressionContainer;

declare function jsxSpreadChild(expression: Expression): JSXSpreadChild;

declare function jsxIdentifier(name: string): JSXIdentifier;

declare function jsxMemberExpression(object: JSXMemberExpression | JSXIdentifier, property: JSXIdentifier): JSXMemberExpression;

declare function jsxNamespacedName(namespace: JSXIdentifier, name: JSXIdentifier): JSXNamespacedName;

declare function jsxOpeningElement(name: JSXIdentifier | JSXMemberExpression | JSXNamespacedName, attributes: Array<JSXAttribute | JSXSpreadAttribute>, selfClosing?: boolean): JSXOpeningElement;

declare function jsxSpreadAttribute(argument: Expression): JSXSpreadAttribute;

declare function jsxText(value: string): JSXText;

declare function jsxFragment(openingFragment: JSXOpeningFragment, closingFragment: JSXClosingFragment, children: Array<JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment>): JSXFragment;

declare function jsxOpeningFragment(): JSXOpeningFragment;

declare function jsxClosingFragment(): JSXClosingFragment;

declare function noop(): Noop;
declare function placeholder(expectedNode: "Identifier" | "StringLiteral" | "Expression" | "Statement" | "Declaration" | "BlockStatement" | "ClassBody" | "Pattern", name: Identifier): Placeholder;
declare function v8IntrinsicIdentifier(name: string): V8IntrinsicIdentifier;
declare function argumentPlaceholder(): ArgumentPlaceholder;
declare function bindExpression(object: Expression, callee: Expression): BindExpression;
declare function classProperty(key: Identifier | StringLiteral | NumericLiteral | Expression, value?: Expression | null, typeAnnotation?: TypeAnnotation | TSTypeAnnotation | Noop | null, decorators?: Array<Decorator> | null, computed?: boolean, _static?: boolean): ClassProperty;
declare function pipelineTopicExpression(expression: Expression): PipelineTopicExpression;
declare function pipelineBareFunction(callee: Expression): PipelineBareFunction;
declare function pipelinePrimaryTopicReference(): PipelinePrimaryTopicReference;
declare function classPrivateProperty(key: PrivateName, value: Expression | null | undefined, decorators: Array<Decorator> | null | undefined, _static: any): ClassPrivateProperty;
declare function classPrivateMethod(kind: "get" | "set" | "method" | "constructor" | undefined, key: PrivateName, params: Array<Identifier | Pattern | RestElement | TSParameterProperty>, body: BlockStatement, _static?: boolean): ClassPrivateMethod;
declare function importAttribute(key: Identifier | StringLiteral, value: StringLiteral): ImportAttribute;
declare function decorator(expression: Expression): Decorator;
declare function doExpression(body: BlockStatement): DoExpression;
declare function exportDefaultSpecifier(exported: Identifier): ExportDefaultSpecifier;
declare function privateName(id: Identifier): PrivateName;
declare function recordExpression(properties: Array<ObjectProperty | SpreadElement>): RecordExpression;
declare function tupleExpression(elements?: Array<Expression | SpreadElement>): TupleExpression;
declare function decimalLiteral(value: string): DecimalLiteral;
declare function staticBlock(body: Array<Statement>): StaticBlock;
declare function moduleExpression(body: Program): ModuleExpression;
declare function tsParameterProperty(parameter: Identifier | AssignmentPattern): TSParameterProperty;

declare function tsDeclareFunction(id: Identifier | null | undefined, typeParameters: TSTypeParameterDeclaration | Noop | null | undefined, params: Array<Identifier | Pattern | RestElement | TSParameterProperty>, returnType?: TSTypeAnnotation | Noop | null): TSDeclareFunction;

declare function tsDeclareMethod(decorators: Array<Decorator> | null | undefined, key: Identifier | StringLiteral | NumericLiteral | Expression, typeParameters: TSTypeParameterDeclaration | Noop | null | undefined, params: Array<Identifier | Pattern | RestElement | TSParameterProperty>, returnType?: TSTypeAnnotation | Noop | null): TSDeclareMethod;

declare function tsQualifiedName(left: TSEntityName, right: Identifier): TSQualifiedName;

declare function tsCallSignatureDeclaration(typeParameters: TSTypeParameterDeclaration | null | undefined, parameters: Array<Identifier | RestElement>, typeAnnotation?: TSTypeAnnotation | null): TSCallSignatureDeclaration;

declare function tsConstructSignatureDeclaration(typeParameters: TSTypeParameterDeclaration | null | undefined, parameters: Array<Identifier | RestElement>, typeAnnotation?: TSTypeAnnotation | null): TSConstructSignatureDeclaration;

declare function tsPropertySignature(key: Expression, typeAnnotation?: TSTypeAnnotation | null, initializer?: Expression | null): TSPropertySignature;

declare function tsMethodSignature(key: Expression, typeParameters: TSTypeParameterDeclaration | null | undefined, parameters: Array<Identifier | RestElement>, typeAnnotation?: TSTypeAnnotation | null): TSMethodSignature;

declare function tsIndexSignature(parameters: Array<Identifier>, typeAnnotation?: TSTypeAnnotation | null): TSIndexSignature;

declare function tsAnyKeyword(): TSAnyKeyword;

declare function tsBooleanKeyword(): TSBooleanKeyword;

declare function tsBigIntKeyword(): TSBigIntKeyword;

declare function tsIntrinsicKeyword(): TSIntrinsicKeyword;

declare function tsNeverKeyword(): TSNeverKeyword;

declare function tsNullKeyword(): TSNullKeyword;

declare function tsNumberKeyword(): TSNumberKeyword;

declare function tsObjectKeyword(): TSObjectKeyword;

declare function tsStringKeyword(): TSStringKeyword;

declare function tsSymbolKeyword(): TSSymbolKeyword;

declare function tsUndefinedKeyword(): TSUndefinedKeyword;

declare function tsUnknownKeyword(): TSUnknownKeyword;

declare function tsVoidKeyword(): TSVoidKeyword;

declare function tsThisType(): TSThisType;

declare function tsFunctionType(typeParameters: TSTypeParameterDeclaration | null | undefined, parameters: Array<Identifier | RestElement>, typeAnnotation?: TSTypeAnnotation | null): TSFunctionType;

declare function tsConstructorType(typeParameters: TSTypeParameterDeclaration | null | undefined, parameters: Array<Identifier | RestElement>, typeAnnotation?: TSTypeAnnotation | null): TSConstructorType;

declare function tsTypeReference(typeName: TSEntityName, typeParameters?: TSTypeParameterInstantiation | null): TSTypeReference;

declare function tsTypePredicate(parameterName: Identifier | TSThisType, typeAnnotation?: TSTypeAnnotation | null, asserts?: boolean | null): TSTypePredicate;

declare function tsTypeQuery(exprName: TSEntityName | TSImportType): TSTypeQuery;

declare function tsTypeLiteral(members: Array<TSTypeElement>): TSTypeLiteral;

declare function tsArrayType(elementType: TSType): TSArrayType;

declare function tsTupleType(elementTypes: Array<TSType | TSNamedTupleMember>): TSTupleType;

declare function tsOptionalType(typeAnnotation: TSType): TSOptionalType;

declare function tsRestType(typeAnnotation: TSType): TSRestType;

declare function tsNamedTupleMember(label: Identifier, elementType: TSType, optional?: boolean): TSNamedTupleMember;

declare function tsUnionType(types: Array<TSType>): TSUnionType;

declare function tsIntersectionType(types: Array<TSType>): TSIntersectionType;

declare function tsConditionalType(checkType: TSType, extendsType: TSType, trueType: TSType, falseType: TSType): TSConditionalType;

declare function tsInferType(typeParameter: TSTypeParameter): TSInferType;

declare function tsParenthesizedType(typeAnnotation: TSType): TSParenthesizedType;

declare function tsTypeOperator(typeAnnotation: TSType): TSTypeOperator;

declare function tsIndexedAccessType(objectType: TSType, indexType: TSType): TSIndexedAccessType;

declare function tsMappedType(typeParameter: TSTypeParameter, typeAnnotation?: TSType | null, nameType?: TSType | null): TSMappedType;

declare function tsLiteralType(literal: NumericLiteral | StringLiteral | BooleanLiteral | BigIntLiteral): TSLiteralType;

declare function tsExpressionWithTypeArguments(expression: TSEntityName, typeParameters?: TSTypeParameterInstantiation | null): TSExpressionWithTypeArguments;

declare function tsInterfaceDeclaration(id: Identifier, typeParameters: TSTypeParameterDeclaration | null | undefined, _extends: Array<TSExpressionWithTypeArguments> | null | undefined, body: TSInterfaceBody): TSInterfaceDeclaration;

declare function tsInterfaceBody(body: Array<TSTypeElement>): TSInterfaceBody;

declare function tsTypeAliasDeclaration(id: Identifier, typeParameters: TSTypeParameterDeclaration | null | undefined, typeAnnotation: TSType): TSTypeAliasDeclaration;

declare function tsAsExpression(expression: Expression, typeAnnotation: TSType): TSAsExpression;

declare function tsTypeAssertion(typeAnnotation: TSType, expression: Expression): TSTypeAssertion;

declare function tsEnumDeclaration(id: Identifier, members: Array<TSEnumMember>): TSEnumDeclaration;

declare function tsEnumMember(id: Identifier | StringLiteral, initializer?: Expression | null): TSEnumMember;

declare function tsModuleDeclaration(id: Identifier | StringLiteral, body: TSModuleBlock | TSModuleDeclaration): TSModuleDeclaration;

declare function tsModuleBlock(body: Array<Statement>): TSModuleBlock;

declare function tsImportType(argument: StringLiteral, qualifier?: TSEntityName | null, typeParameters?: TSTypeParameterInstantiation | null): TSImportType;

declare function tsImportEqualsDeclaration(id: Identifier, moduleReference: TSEntityName | TSExternalModuleReference): TSImportEqualsDeclaration;

declare function tsExternalModuleReference(expression: StringLiteral): TSExternalModuleReference;

declare function tsNonNullExpression(expression: Expression): TSNonNullExpression;

declare function tsExportAssignment(expression: Expression): TSExportAssignment;

declare function tsNamespaceExportDeclaration(id: Identifier): TSNamespaceExportDeclaration;

declare function tsTypeAnnotation(typeAnnotation: TSType): TSTypeAnnotation;

declare function tsTypeParameterInstantiation(params: Array<TSType>): TSTypeParameterInstantiation;

declare function tsTypeParameterDeclaration(params: Array<TSTypeParameter>): TSTypeParameterDeclaration;

declare function tsTypeParameter(constraint: TSType | null | undefined, _default: TSType | null | undefined, name: string): TSTypeParameter;

/** @deprecated */
declare function NumberLiteral$1(...args: Array<any>): any;

/** @deprecated */
declare function RegexLiteral$1(...args: Array<any>): any;

/** @deprecated */
declare function RestProperty$1(...args: Array<any>): any;

/** @deprecated */
declare function SpreadProperty$1(...args: Array<any>): any;

/**
 * Create a clone of a `node` including only properties belonging to the node.
 * If the second parameter is `false`, cloneNode performs a shallow clone.
 * If the third parameter is true, the cloned nodes exclude location properties.
 */
declare function cloneNode<T extends Node>(node: T, deep?: boolean, withoutLoc?: boolean): T;

/**
 * Create a shallow clone of a `node`, including only
 * properties belonging to the node.
 * @deprecated Use t.cloneNode instead.
 */
declare function clone<T extends Node>(node: T): T;

/**
 * Create a deep clone of a `node` and all of it's child nodes
 * including only properties belonging to the node.
 * @deprecated Use t.cloneNode instead.
 */
declare function cloneDeep<T extends Node>(node: T): T;

/**
 * Create a deep clone of a `node` and all of it's child nodes
 * including only properties belonging to the node.
 * excluding `_private` and location properties.
 */
declare function cloneDeepWithoutLoc<T extends Node>(node: T): T;

/**
 * Create a shallow clone of a `node` excluding `_private` and location properties.
 */
declare function cloneWithoutLoc<T extends Node>(node: T): T;

/**
 * Add comment of certain type to a node.
 */
declare function addComment<T extends Node>(node: T, type: CommentTypeShorthand, content: string, line?: boolean): T;

/**
 * Add comments of certain type to a node.
 */
declare function addComments<T extends Node>(node: T, type: CommentTypeShorthand, comments: ReadonlyArray<Comment>): T;

declare function inheritInnerComments(child: Node, parent: Node): void;

declare function inheritLeadingComments(child: Node, parent: Node): void;

/**
 * Inherit all unique comments from `parent` node to `child` node.
 */
declare function inheritsComments<T extends Node>(child: T, parent: Node): T;

declare function inheritTrailingComments(child: Node, parent: Node): void;

/**
 * Remove comment properties from a node.
 */
declare function removeComments<T extends Node>(node: T): T;

declare const EXPRESSION_TYPES: string[];
declare const BINARY_TYPES: string[];
declare const SCOPABLE_TYPES: string[];
declare const BLOCKPARENT_TYPES: string[];
declare const BLOCK_TYPES: string[];
declare const STATEMENT_TYPES: string[];
declare const TERMINATORLESS_TYPES: string[];
declare const COMPLETIONSTATEMENT_TYPES: string[];
declare const CONDITIONAL_TYPES: string[];
declare const LOOP_TYPES: string[];
declare const WHILE_TYPES: string[];
declare const EXPRESSIONWRAPPER_TYPES: string[];
declare const FOR_TYPES: string[];
declare const FORXSTATEMENT_TYPES: string[];
declare const FUNCTION_TYPES: string[];
declare const FUNCTIONPARENT_TYPES: string[];
declare const PUREISH_TYPES: string[];
declare const DECLARATION_TYPES: string[];
declare const PATTERNLIKE_TYPES: string[];
declare const LVAL_TYPES: string[];
declare const TSENTITYNAME_TYPES: string[];
declare const LITERAL_TYPES: string[];
declare const IMMUTABLE_TYPES: string[];
declare const USERWHITESPACABLE_TYPES: string[];
declare const METHOD_TYPES: string[];
declare const OBJECTMEMBER_TYPES: string[];
declare const PROPERTY_TYPES: string[];
declare const UNARYLIKE_TYPES: string[];
declare const PATTERN_TYPES: string[];
declare const CLASS_TYPES: string[];
declare const MODULEDECLARATION_TYPES: string[];
declare const EXPORTDECLARATION_TYPES: string[];
declare const MODULESPECIFIER_TYPES: string[];
declare const FLOW_TYPES: string[];
declare const FLOWTYPE_TYPES: string[];
declare const FLOWBASEANNOTATION_TYPES: string[];
declare const FLOWDECLARATION_TYPES: string[];
declare const FLOWPREDICATE_TYPES: string[];
declare const ENUMBODY_TYPES: string[];
declare const ENUMMEMBER_TYPES: string[];
declare const JSX_TYPES: string[];
declare const PRIVATE_TYPES: string[];
declare const TSTYPEELEMENT_TYPES: string[];
declare const TSTYPE_TYPES: string[];
declare const TSBASETYPE_TYPES: string[];

declare const STATEMENT_OR_BLOCK_KEYS: string[];
declare const FLATTENABLE_KEYS: string[];
declare const FOR_INIT_KEYS: string[];
declare const COMMENT_KEYS: string[];
declare const LOGICAL_OPERATORS: string[];
declare const UPDATE_OPERATORS: string[];
declare const BOOLEAN_NUMBER_BINARY_OPERATORS: string[];
declare const EQUALITY_BINARY_OPERATORS: string[];
declare const COMPARISON_BINARY_OPERATORS: string[];
declare const BOOLEAN_BINARY_OPERATORS: string[];
declare const NUMBER_BINARY_OPERATORS: string[];
declare const BINARY_OPERATORS: string[];
declare const ASSIGNMENT_OPERATORS: string[];
declare const BOOLEAN_UNARY_OPERATORS: string[];
declare const NUMBER_UNARY_OPERATORS: string[];
declare const STRING_UNARY_OPERATORS: string[];
declare const UNARY_OPERATORS: string[];
declare const INHERIT_KEYS: {
    optional: string[];
    force: string[];
};
declare const BLOCK_SCOPED_SYMBOL: unique symbol;
declare const NOT_LOCAL_BINDING: unique symbol;

/**
 * Ensure the `key` (defaults to "body") of a `node` is a block.
 * Casting it to a block if it is not.
 *
 * Returns the BlockStatement
 */
declare function ensureBlock(node: Node, key?: string): BlockStatement;

declare function toBindingIdentifierName(name: string): string;

declare function toBlock(node: Statement | Expression, parent?: Node): BlockStatement;

declare function toComputedKey(node: ObjectMember | ObjectProperty | ClassMethod | ClassProperty | MemberExpression | OptionalMemberExpression, key?: Expression): Expression;

declare const _default: {
    (node: Function): FunctionExpression;
    (node: Class): ClassExpression;
    (node: ExpressionStatement | Expression | Class | Function): Expression;
};
//# sourceMappingURL=toExpression.d.ts.map

declare function toIdentifier(input: string): string;

declare function toKeyAlias(node: Method | Property, key?: Node): string;
declare namespace toKeyAlias {
    var uid: number;
    var increment: () => number;
}
//# sourceMappingURL=toKeyAlias.d.ts.map

declare type Scope = {
    push(value: {
        id: LVal;
        kind: "var";
        init?: Expression;
    }): void;
    buildUndefinedNode(): Node;
};

/**
 * Turn an array of statement `nodes` into a `SequenceExpression`.
 *
 * Variable declarations are turned into simple assignments and their
 * declarations hoisted to the top of the current scope.
 *
 * Expression statements are just resolved to their expression.
 */
declare function toSequenceExpression(nodes: ReadonlyArray<Node>, scope: Scope): SequenceExpression | undefined;

declare const _default$1: {
    (node: AssignmentExpression, ignore?: boolean): ExpressionStatement;
    <T extends Statement>(node: T, ignore: false): T;
    <T_1 extends Statement>(node: T_1, ignore?: boolean): false | T_1;
    (node: Class, ignore: false): ClassDeclaration;
    (node: Class, ignore?: boolean): ClassDeclaration | false;
    (node: Function, ignore: false): FunctionDeclaration;
    (node: Function, ignore?: boolean): FunctionDeclaration | false;
    (node: Node, ignore: false): Statement;
    (node: Node, ignore?: boolean): Statement | false;
};
//# sourceMappingURL=toStatement.d.ts.map

declare const _default$2: {
    (value: undefined): Identifier;
    (value: boolean): BooleanLiteral;
    (value: null): NullLiteral;
    (value: string): StringLiteral;
    (value: number): NumericLiteral | BinaryExpression | UnaryExpression;
    (value: RegExp): RegExpLiteral;
    (value: ReadonlyArray<unknown>): ArrayExpression;
    (value: object): ObjectExpression;
    (value: unknown): Expression;
};
//# sourceMappingURL=valueToNode.d.ts.map

declare const VISITOR_KEYS: Record<string, string[]>;
declare const ALIAS_KEYS: Record<string, string[]>;
declare const FLIPPED_ALIAS_KEYS: Record<string, string[]>;
declare const NODE_FIELDS: Record<string, {}>;
declare const BUILDER_KEYS: Record<string, string[]>;
declare const DEPRECATED_KEYS: Record<string, string>;
declare const NODE_PARENT_VALIDATIONS: {};

declare const PLACEHOLDERS: string[];
declare const PLACEHOLDERS_ALIAS: Record<string, string[]>;
declare const PLACEHOLDERS_FLIPPED_ALIAS: Record<string, string[]>;

declare const TYPES: Array<string>;
//# sourceMappingURL=index.d.ts.map

/**
 * Append a node to a member expression.
 */
declare function appendToMemberExpression(member: MemberExpression, append: MemberExpression["property"], computed?: boolean): MemberExpression;

/**
 * Inherit all contextual properties from `parent` node to `child` node.
 */
declare function inherits<T extends Node | null | undefined>(child: T, parent: Node | null | undefined): T;

/**
 * Prepend a node to a member expression.
 */
declare function prependToMemberExpression<T extends Pick<MemberExpression, "object" | "property">>(member: T, prepend: MemberExpression["object"]): T;

/**
 * Remove all of the _* properties from a node along with the additional metadata
 * properties like location data and raw token data.
 */
declare function removeProperties(node: Node, opts?: {
    preserveComments?: boolean;
}): void;

declare function removePropertiesDeep<T extends Node>(tree: T, opts?: {
    preserveComments: boolean;
} | null): T;

/**
 * Dedupe type annotations.
 */
declare function removeTypeDuplicates(nodes: ReadonlyArray<FlowType | false | null | undefined>): FlowType[];

declare function getBindingIdentifiers(node: Node, duplicates: true, outerOnly?: boolean): Record<string, Array<Identifier>>;
declare namespace getBindingIdentifiers {
    var keys: {
        DeclareClass: string[];
        DeclareFunction: string[];
        DeclareModule: string[];
        DeclareVariable: string[];
        DeclareInterface: string[];
        DeclareTypeAlias: string[];
        DeclareOpaqueType: string[];
        InterfaceDeclaration: string[];
        TypeAlias: string[];
        OpaqueType: string[];
        CatchClause: string[];
        LabeledStatement: string[];
        UnaryExpression: string[];
        AssignmentExpression: string[];
        ImportSpecifier: string[];
        ImportNamespaceSpecifier: string[];
        ImportDefaultSpecifier: string[];
        ImportDeclaration: string[];
        ExportSpecifier: string[];
        ExportNamespaceSpecifier: string[];
        ExportDefaultSpecifier: string[];
        FunctionDeclaration: string[];
        FunctionExpression: string[];
        ArrowFunctionExpression: string[];
        ObjectMethod: string[];
        ClassMethod: string[];
        ForInStatement: string[];
        ForOfStatement: string[];
        ClassDeclaration: string[];
        ClassExpression: string[];
        RestElement: string[];
        UpdateExpression: string[];
        ObjectProperty: string[];
        AssignmentPattern: string[];
        ArrayPattern: string[];
        ObjectPattern: string[];
        VariableDeclaration: string[];
        VariableDeclarator: string[];
    };
}
declare function getBindingIdentifiers(node: Node, duplicates?: false, outerOnly?: boolean): Record<string, Identifier>;
declare namespace getBindingIdentifiers {
    var keys: {
        DeclareClass: string[];
        DeclareFunction: string[];
        DeclareModule: string[];
        DeclareVariable: string[];
        DeclareInterface: string[];
        DeclareTypeAlias: string[];
        DeclareOpaqueType: string[];
        InterfaceDeclaration: string[];
        TypeAlias: string[];
        OpaqueType: string[];
        CatchClause: string[];
        LabeledStatement: string[];
        UnaryExpression: string[];
        AssignmentExpression: string[];
        ImportSpecifier: string[];
        ImportNamespaceSpecifier: string[];
        ImportDefaultSpecifier: string[];
        ImportDeclaration: string[];
        ExportSpecifier: string[];
        ExportNamespaceSpecifier: string[];
        ExportDefaultSpecifier: string[];
        FunctionDeclaration: string[];
        FunctionExpression: string[];
        ArrowFunctionExpression: string[];
        ObjectMethod: string[];
        ClassMethod: string[];
        ForInStatement: string[];
        ForOfStatement: string[];
        ClassDeclaration: string[];
        ClassExpression: string[];
        RestElement: string[];
        UpdateExpression: string[];
        ObjectProperty: string[];
        AssignmentPattern: string[];
        ArrayPattern: string[];
        ObjectPattern: string[];
        VariableDeclaration: string[];
        VariableDeclarator: string[];
    };
}
declare function getBindingIdentifiers(node: Node, duplicates?: boolean, outerOnly?: boolean): Record<string, Identifier> | Record<string, Array<Identifier>>;
declare namespace getBindingIdentifiers {
    var keys: {
        DeclareClass: string[];
        DeclareFunction: string[];
        DeclareModule: string[];
        DeclareVariable: string[];
        DeclareInterface: string[];
        DeclareTypeAlias: string[];
        DeclareOpaqueType: string[];
        InterfaceDeclaration: string[];
        TypeAlias: string[];
        OpaqueType: string[];
        CatchClause: string[];
        LabeledStatement: string[];
        UnaryExpression: string[];
        AssignmentExpression: string[];
        ImportSpecifier: string[];
        ImportNamespaceSpecifier: string[];
        ImportDefaultSpecifier: string[];
        ImportDeclaration: string[];
        ExportSpecifier: string[];
        ExportNamespaceSpecifier: string[];
        ExportDefaultSpecifier: string[];
        FunctionDeclaration: string[];
        FunctionExpression: string[];
        ArrowFunctionExpression: string[];
        ObjectMethod: string[];
        ClassMethod: string[];
        ForInStatement: string[];
        ForOfStatement: string[];
        ClassDeclaration: string[];
        ClassExpression: string[];
        RestElement: string[];
        UpdateExpression: string[];
        ObjectProperty: string[];
        AssignmentPattern: string[];
        ArrayPattern: string[];
        ObjectPattern: string[];
        VariableDeclaration: string[];
        VariableDeclarator: string[];
    };
}
//# sourceMappingURL=getBindingIdentifiers.d.ts.map

declare const _default$3: {
    (node: Node, duplicates: true): Record<string, Array<Identifier>>;
    (node: Node, duplicates?: false): Record<string, Identifier>;
    (node: Node, duplicates?: boolean): Record<string, Identifier> | Record<string, Array<Identifier>>;
};
//# sourceMappingURL=getOuterBindingIdentifiers.d.ts.map

declare type TraversalAncestors = Array<{
    node: Node;
    key: string;
    index?: number;
}>;
declare type TraversalHandler<T> = (this: undefined, node: Node, parent: TraversalAncestors, state: T) => void;
declare type TraversalHandlers<T> = {
    enter?: TraversalHandler<T>;
    exit?: TraversalHandler<T>;
};
/**
 * A general AST traversal with both prefix and postfix handlers, and a
 * state object. Exposes ancestry data to each handler so that more complex
 * AST data can be taken into account.
 */
declare function traverse<T>(node: Node, handlers: TraversalHandler<T> | TraversalHandlers<T>, state?: T): void;

/**
 * A prefix AST traversal implementation meant for simple searching
 * and processing.
 */
declare function traverseFast(node: Node | null | undefined, enter: (node: Node, opts?: any) => void, opts?: any): void;

declare function shallowEqual<T extends object>(actual: object, expected: T): actual is T;

declare function is<T extends Node["type"]>(type: T, node: Node | null | undefined, opts?: undefined): node is Extract<Node, {
    type: T;
}>;
declare function is<T extends Node["type"], P extends Extract<Node, {
    type: T;
}>>(type: T, n: Node | null | undefined, required: Partial<P>): n is P;
declare function is<P extends Node>(type: string, node: Node | null | undefined, opts: Partial<P>): node is P;
declare function is(type: string, node: Node | null | undefined, opts?: Partial<Node>): node is Node;

/**
 * Check if the input `node` is a binding identifier.
 */
declare function isBinding(node: Node, parent: Node, grandparent?: Node): boolean;

/**
 * Check if the input `node` is block scoped.
 */
declare function isBlockScoped(node: Node): boolean;

/**
 * Check if the input `node` is definitely immutable.
 */
declare function isImmutable(node: Node): boolean;

/**
 * Check if the input `node` is a `let` variable declaration.
 */
declare function isLet(node: Node): boolean;

declare function isNode(node: any): node is Node;

/**
 * Check if two nodes are equivalent
 */
declare function isNodesEquivalent<T extends Partial<Node>>(a: T, b: any): b is T;

/**
 * Test if a `placeholderType` is a `targetType` or if `targetType` is an alias of `placeholderType`.
 */
declare function isPlaceholderType(placeholderType: string, targetType: string): boolean;

/**
 * Check if the input `node` is a reference to a bound variable.
 */
declare function isReferenced(node: Node, parent: Node, grandparent?: Node): boolean;

/**
 * Check if the input `node` is a scope.
 */
declare function isScope(node: Node, parent: Node): boolean;

/**
 * Check if the input `specifier` is a `default` import or export.
 */
declare function isSpecifierDefault(specifier: ModuleSpecifier): boolean;

declare function isType<T extends Node["type"]>(nodeType: string, targetType: T): nodeType is T;
declare function isType(nodeType: string | null | undefined, targetType: string): boolean;

/**
 * Check if the input `name` is a valid identifier name according to the ES3 specification.
 *
 * Additional ES3 reserved words are
 */
declare function isValidES3Identifier(name: string): boolean;

/**
 * Check if the input `name` is a valid identifier name
 * and isn't a reserved word.
 */
declare function isValidIdentifier(name: string, reserved?: boolean): boolean;

/**
 * Check if the input `node` is a variable declaration.
 */
declare function isVar(node: Node): boolean;

/**
 * Determines whether or not the input node `member` matches the
 * input `match`.
 *
 * For example, given the match `React.createClass` it would match the
 * parsed nodes of `React.createClass` and `React["createClass"]`.
 */
declare function matchesPattern(member: Node | null | undefined, match: string | string[], allowPartial?: boolean): boolean;

declare function validate(node: Node | undefined | null, key: string, val: any): void;

/**
 * Build a function that when called will return whether or not the
 * input `node` `MemberExpression` matches the input `match`.
 *
 * For example, given the match `React.createClass` it would match the
 * parsed nodes of `React.createClass` and `React["createClass"]`.
 */
declare function buildMatchMemberExpression(match: string, allowPartial?: boolean): (member: Node) => boolean;

declare function isArrayExpression(node: object | null | undefined, opts?: object | null): node is ArrayExpression;
declare function isAssignmentExpression(node: object | null | undefined, opts?: object | null): node is AssignmentExpression;
declare function isBinaryExpression(node: object | null | undefined, opts?: object | null): node is BinaryExpression;
declare function isInterpreterDirective(node: object | null | undefined, opts?: object | null): node is InterpreterDirective;
declare function isDirective(node: object | null | undefined, opts?: object | null): node is Directive;
declare function isDirectiveLiteral(node: object | null | undefined, opts?: object | null): node is DirectiveLiteral;
declare function isBlockStatement(node: object | null | undefined, opts?: object | null): node is BlockStatement;
declare function isBreakStatement(node: object | null | undefined, opts?: object | null): node is BreakStatement;
declare function isCallExpression(node: object | null | undefined, opts?: object | null): node is CallExpression;
declare function isCatchClause(node: object | null | undefined, opts?: object | null): node is CatchClause;
declare function isConditionalExpression(node: object | null | undefined, opts?: object | null): node is ConditionalExpression;
declare function isContinueStatement(node: object | null | undefined, opts?: object | null): node is ContinueStatement;
declare function isDebuggerStatement(node: object | null | undefined, opts?: object | null): node is DebuggerStatement;
declare function isDoWhileStatement(node: object | null | undefined, opts?: object | null): node is DoWhileStatement;
declare function isEmptyStatement(node: object | null | undefined, opts?: object | null): node is EmptyStatement;
declare function isExpressionStatement(node: object | null | undefined, opts?: object | null): node is ExpressionStatement;
declare function isFile(node: object | null | undefined, opts?: object | null): node is File;
declare function isForInStatement(node: object | null | undefined, opts?: object | null): node is ForInStatement;
declare function isForStatement(node: object | null | undefined, opts?: object | null): node is ForStatement;
declare function isFunctionDeclaration(node: object | null | undefined, opts?: object | null): node is FunctionDeclaration;
declare function isFunctionExpression(node: object | null | undefined, opts?: object | null): node is FunctionExpression;
declare function isIdentifier(node: object | null | undefined, opts?: object | null): node is Identifier;
declare function isIfStatement(node: object | null | undefined, opts?: object | null): node is IfStatement;
declare function isLabeledStatement(node: object | null | undefined, opts?: object | null): node is LabeledStatement;
declare function isStringLiteral(node: object | null | undefined, opts?: object | null): node is StringLiteral;
declare function isNumericLiteral(node: object | null | undefined, opts?: object | null): node is NumericLiteral;
declare function isNullLiteral(node: object | null | undefined, opts?: object | null): node is NullLiteral;
declare function isBooleanLiteral(node: object | null | undefined, opts?: object | null): node is BooleanLiteral;
declare function isRegExpLiteral(node: object | null | undefined, opts?: object | null): node is RegExpLiteral;
declare function isLogicalExpression(node: object | null | undefined, opts?: object | null): node is LogicalExpression;
declare function isMemberExpression(node: object | null | undefined, opts?: object | null): node is MemberExpression;
declare function isNewExpression(node: object | null | undefined, opts?: object | null): node is NewExpression;
declare function isProgram(node: object | null | undefined, opts?: object | null): node is Program;
declare function isObjectExpression(node: object | null | undefined, opts?: object | null): node is ObjectExpression;
declare function isObjectMethod(node: object | null | undefined, opts?: object | null): node is ObjectMethod;
declare function isObjectProperty(node: object | null | undefined, opts?: object | null): node is ObjectProperty;
declare function isRestElement(node: object | null | undefined, opts?: object | null): node is RestElement;
declare function isReturnStatement(node: object | null | undefined, opts?: object | null): node is ReturnStatement;
declare function isSequenceExpression(node: object | null | undefined, opts?: object | null): node is SequenceExpression;
declare function isParenthesizedExpression(node: object | null | undefined, opts?: object | null): node is ParenthesizedExpression;
declare function isSwitchCase(node: object | null | undefined, opts?: object | null): node is SwitchCase;
declare function isSwitchStatement(node: object | null | undefined, opts?: object | null): node is SwitchStatement;
declare function isThisExpression(node: object | null | undefined, opts?: object | null): node is ThisExpression;
declare function isThrowStatement(node: object | null | undefined, opts?: object | null): node is ThrowStatement;
declare function isTryStatement(node: object | null | undefined, opts?: object | null): node is TryStatement;
declare function isUnaryExpression(node: object | null | undefined, opts?: object | null): node is UnaryExpression;
declare function isUpdateExpression(node: object | null | undefined, opts?: object | null): node is UpdateExpression;
declare function isVariableDeclaration(node: object | null | undefined, opts?: object | null): node is VariableDeclaration;
declare function isVariableDeclarator(node: object | null | undefined, opts?: object | null): node is VariableDeclarator;
declare function isWhileStatement(node: object | null | undefined, opts?: object | null): node is WhileStatement;
declare function isWithStatement(node: object | null | undefined, opts?: object | null): node is WithStatement;
declare function isAssignmentPattern(node: object | null | undefined, opts?: object | null): node is AssignmentPattern;
declare function isArrayPattern(node: object | null | undefined, opts?: object | null): node is ArrayPattern;
declare function isArrowFunctionExpression(node: object | null | undefined, opts?: object | null): node is ArrowFunctionExpression;
declare function isClassBody(node: object | null | undefined, opts?: object | null): node is ClassBody;
declare function isClassExpression(node: object | null | undefined, opts?: object | null): node is ClassExpression;
declare function isClassDeclaration(node: object | null | undefined, opts?: object | null): node is ClassDeclaration;
declare function isExportAllDeclaration(node: object | null | undefined, opts?: object | null): node is ExportAllDeclaration;
declare function isExportDefaultDeclaration(node: object | null | undefined, opts?: object | null): node is ExportDefaultDeclaration;
declare function isExportNamedDeclaration(node: object | null | undefined, opts?: object | null): node is ExportNamedDeclaration;
declare function isExportSpecifier(node: object | null | undefined, opts?: object | null): node is ExportSpecifier;
declare function isForOfStatement(node: object | null | undefined, opts?: object | null): node is ForOfStatement;
declare function isImportDeclaration(node: object | null | undefined, opts?: object | null): node is ImportDeclaration;
declare function isImportDefaultSpecifier(node: object | null | undefined, opts?: object | null): node is ImportDefaultSpecifier;
declare function isImportNamespaceSpecifier(node: object | null | undefined, opts?: object | null): node is ImportNamespaceSpecifier;
declare function isImportSpecifier(node: object | null | undefined, opts?: object | null): node is ImportSpecifier;
declare function isMetaProperty(node: object | null | undefined, opts?: object | null): node is MetaProperty;
declare function isClassMethod(node: object | null | undefined, opts?: object | null): node is ClassMethod;
declare function isObjectPattern(node: object | null | undefined, opts?: object | null): node is ObjectPattern;
declare function isSpreadElement(node: object | null | undefined, opts?: object | null): node is SpreadElement;
declare function isSuper(node: object | null | undefined, opts?: object | null): node is Super;
declare function isTaggedTemplateExpression(node: object | null | undefined, opts?: object | null): node is TaggedTemplateExpression;
declare function isTemplateElement(node: object | null | undefined, opts?: object | null): node is TemplateElement;
declare function isTemplateLiteral(node: object | null | undefined, opts?: object | null): node is TemplateLiteral;
declare function isYieldExpression(node: object | null | undefined, opts?: object | null): node is YieldExpression;
declare function isAwaitExpression(node: object | null | undefined, opts?: object | null): node is AwaitExpression;
declare function isImport(node: object | null | undefined, opts?: object | null): node is Import;
declare function isBigIntLiteral(node: object | null | undefined, opts?: object | null): node is BigIntLiteral;
declare function isExportNamespaceSpecifier(node: object | null | undefined, opts?: object | null): node is ExportNamespaceSpecifier;
declare function isOptionalMemberExpression(node: object | null | undefined, opts?: object | null): node is OptionalMemberExpression;
declare function isOptionalCallExpression(node: object | null | undefined, opts?: object | null): node is OptionalCallExpression;
declare function isAnyTypeAnnotation(node: object | null | undefined, opts?: object | null): node is AnyTypeAnnotation;
declare function isArrayTypeAnnotation(node: object | null | undefined, opts?: object | null): node is ArrayTypeAnnotation;
declare function isBooleanTypeAnnotation(node: object | null | undefined, opts?: object | null): node is BooleanTypeAnnotation;
declare function isBooleanLiteralTypeAnnotation(node: object | null | undefined, opts?: object | null): node is BooleanLiteralTypeAnnotation;
declare function isNullLiteralTypeAnnotation(node: object | null | undefined, opts?: object | null): node is NullLiteralTypeAnnotation;
declare function isClassImplements(node: object | null | undefined, opts?: object | null): node is ClassImplements;
declare function isDeclareClass(node: object | null | undefined, opts?: object | null): node is DeclareClass;
declare function isDeclareFunction(node: object | null | undefined, opts?: object | null): node is DeclareFunction;
declare function isDeclareInterface(node: object | null | undefined, opts?: object | null): node is DeclareInterface;
declare function isDeclareModule(node: object | null | undefined, opts?: object | null): node is DeclareModule;
declare function isDeclareModuleExports(node: object | null | undefined, opts?: object | null): node is DeclareModuleExports;
declare function isDeclareTypeAlias(node: object | null | undefined, opts?: object | null): node is DeclareTypeAlias;
declare function isDeclareOpaqueType(node: object | null | undefined, opts?: object | null): node is DeclareOpaqueType;
declare function isDeclareVariable(node: object | null | undefined, opts?: object | null): node is DeclareVariable;
declare function isDeclareExportDeclaration(node: object | null | undefined, opts?: object | null): node is DeclareExportDeclaration;
declare function isDeclareExportAllDeclaration(node: object | null | undefined, opts?: object | null): node is DeclareExportAllDeclaration;
declare function isDeclaredPredicate(node: object | null | undefined, opts?: object | null): node is DeclaredPredicate;
declare function isExistsTypeAnnotation(node: object | null | undefined, opts?: object | null): node is ExistsTypeAnnotation;
declare function isFunctionTypeAnnotation(node: object | null | undefined, opts?: object | null): node is FunctionTypeAnnotation;
declare function isFunctionTypeParam(node: object | null | undefined, opts?: object | null): node is FunctionTypeParam;
declare function isGenericTypeAnnotation(node: object | null | undefined, opts?: object | null): node is GenericTypeAnnotation;
declare function isInferredPredicate(node: object | null | undefined, opts?: object | null): node is InferredPredicate;
declare function isInterfaceExtends(node: object | null | undefined, opts?: object | null): node is InterfaceExtends;
declare function isInterfaceDeclaration(node: object | null | undefined, opts?: object | null): node is InterfaceDeclaration;
declare function isInterfaceTypeAnnotation(node: object | null | undefined, opts?: object | null): node is InterfaceTypeAnnotation;
declare function isIntersectionTypeAnnotation(node: object | null | undefined, opts?: object | null): node is IntersectionTypeAnnotation;
declare function isMixedTypeAnnotation(node: object | null | undefined, opts?: object | null): node is MixedTypeAnnotation;
declare function isEmptyTypeAnnotation(node: object | null | undefined, opts?: object | null): node is EmptyTypeAnnotation;
declare function isNullableTypeAnnotation(node: object | null | undefined, opts?: object | null): node is NullableTypeAnnotation;
declare function isNumberLiteralTypeAnnotation(node: object | null | undefined, opts?: object | null): node is NumberLiteralTypeAnnotation;
declare function isNumberTypeAnnotation(node: object | null | undefined, opts?: object | null): node is NumberTypeAnnotation;
declare function isObjectTypeAnnotation(node: object | null | undefined, opts?: object | null): node is ObjectTypeAnnotation;
declare function isObjectTypeInternalSlot(node: object | null | undefined, opts?: object | null): node is ObjectTypeInternalSlot;
declare function isObjectTypeCallProperty(node: object | null | undefined, opts?: object | null): node is ObjectTypeCallProperty;
declare function isObjectTypeIndexer(node: object | null | undefined, opts?: object | null): node is ObjectTypeIndexer;
declare function isObjectTypeProperty(node: object | null | undefined, opts?: object | null): node is ObjectTypeProperty;
declare function isObjectTypeSpreadProperty(node: object | null | undefined, opts?: object | null): node is ObjectTypeSpreadProperty;
declare function isOpaqueType(node: object | null | undefined, opts?: object | null): node is OpaqueType;
declare function isQualifiedTypeIdentifier(node: object | null | undefined, opts?: object | null): node is QualifiedTypeIdentifier;
declare function isStringLiteralTypeAnnotation(node: object | null | undefined, opts?: object | null): node is StringLiteralTypeAnnotation;
declare function isStringTypeAnnotation(node: object | null | undefined, opts?: object | null): node is StringTypeAnnotation;
declare function isSymbolTypeAnnotation(node: object | null | undefined, opts?: object | null): node is SymbolTypeAnnotation;
declare function isThisTypeAnnotation(node: object | null | undefined, opts?: object | null): node is ThisTypeAnnotation;
declare function isTupleTypeAnnotation(node: object | null | undefined, opts?: object | null): node is TupleTypeAnnotation;
declare function isTypeofTypeAnnotation(node: object | null | undefined, opts?: object | null): node is TypeofTypeAnnotation;
declare function isTypeAlias(node: object | null | undefined, opts?: object | null): node is TypeAlias;
declare function isTypeAnnotation(node: object | null | undefined, opts?: object | null): node is TypeAnnotation;
declare function isTypeCastExpression(node: object | null | undefined, opts?: object | null): node is TypeCastExpression;
declare function isTypeParameter(node: object | null | undefined, opts?: object | null): node is TypeParameter;
declare function isTypeParameterDeclaration(node: object | null | undefined, opts?: object | null): node is TypeParameterDeclaration;
declare function isTypeParameterInstantiation(node: object | null | undefined, opts?: object | null): node is TypeParameterInstantiation;
declare function isUnionTypeAnnotation(node: object | null | undefined, opts?: object | null): node is UnionTypeAnnotation;
declare function isVariance(node: object | null | undefined, opts?: object | null): node is Variance;
declare function isVoidTypeAnnotation(node: object | null | undefined, opts?: object | null): node is VoidTypeAnnotation;
declare function isEnumDeclaration(node: object | null | undefined, opts?: object | null): node is EnumDeclaration;
declare function isEnumBooleanBody(node: object | null | undefined, opts?: object | null): node is EnumBooleanBody;
declare function isEnumNumberBody(node: object | null | undefined, opts?: object | null): node is EnumNumberBody;
declare function isEnumStringBody(node: object | null | undefined, opts?: object | null): node is EnumStringBody;
declare function isEnumSymbolBody(node: object | null | undefined, opts?: object | null): node is EnumSymbolBody;
declare function isEnumBooleanMember(node: object | null | undefined, opts?: object | null): node is EnumBooleanMember;
declare function isEnumNumberMember(node: object | null | undefined, opts?: object | null): node is EnumNumberMember;
declare function isEnumStringMember(node: object | null | undefined, opts?: object | null): node is EnumStringMember;
declare function isEnumDefaultedMember(node: object | null | undefined, opts?: object | null): node is EnumDefaultedMember;
declare function isJSXAttribute(node: object | null | undefined, opts?: object | null): node is JSXAttribute;
declare function isJSXClosingElement(node: object | null | undefined, opts?: object | null): node is JSXClosingElement;
declare function isJSXElement(node: object | null | undefined, opts?: object | null): node is JSXElement;
declare function isJSXEmptyExpression(node: object | null | undefined, opts?: object | null): node is JSXEmptyExpression;
declare function isJSXExpressionContainer(node: object | null | undefined, opts?: object | null): node is JSXExpressionContainer;
declare function isJSXSpreadChild(node: object | null | undefined, opts?: object | null): node is JSXSpreadChild;
declare function isJSXIdentifier(node: object | null | undefined, opts?: object | null): node is JSXIdentifier;
declare function isJSXMemberExpression(node: object | null | undefined, opts?: object | null): node is JSXMemberExpression;
declare function isJSXNamespacedName(node: object | null | undefined, opts?: object | null): node is JSXNamespacedName;
declare function isJSXOpeningElement(node: object | null | undefined, opts?: object | null): node is JSXOpeningElement;
declare function isJSXSpreadAttribute(node: object | null | undefined, opts?: object | null): node is JSXSpreadAttribute;
declare function isJSXText(node: object | null | undefined, opts?: object | null): node is JSXText;
declare function isJSXFragment(node: object | null | undefined, opts?: object | null): node is JSXFragment;
declare function isJSXOpeningFragment(node: object | null | undefined, opts?: object | null): node is JSXOpeningFragment;
declare function isJSXClosingFragment(node: object | null | undefined, opts?: object | null): node is JSXClosingFragment;
declare function isNoop(node: object | null | undefined, opts?: object | null): node is Noop;
declare function isPlaceholder(node: object | null | undefined, opts?: object | null): node is Placeholder;
declare function isV8IntrinsicIdentifier(node: object | null | undefined, opts?: object | null): node is V8IntrinsicIdentifier;
declare function isArgumentPlaceholder(node: object | null | undefined, opts?: object | null): node is ArgumentPlaceholder;
declare function isBindExpression(node: object | null | undefined, opts?: object | null): node is BindExpression;
declare function isClassProperty(node: object | null | undefined, opts?: object | null): node is ClassProperty;
declare function isPipelineTopicExpression(node: object | null | undefined, opts?: object | null): node is PipelineTopicExpression;
declare function isPipelineBareFunction(node: object | null | undefined, opts?: object | null): node is PipelineBareFunction;
declare function isPipelinePrimaryTopicReference(node: object | null | undefined, opts?: object | null): node is PipelinePrimaryTopicReference;
declare function isClassPrivateProperty(node: object | null | undefined, opts?: object | null): node is ClassPrivateProperty;
declare function isClassPrivateMethod(node: object | null | undefined, opts?: object | null): node is ClassPrivateMethod;
declare function isImportAttribute(node: object | null | undefined, opts?: object | null): node is ImportAttribute;
declare function isDecorator(node: object | null | undefined, opts?: object | null): node is Decorator;
declare function isDoExpression(node: object | null | undefined, opts?: object | null): node is DoExpression;
declare function isExportDefaultSpecifier(node: object | null | undefined, opts?: object | null): node is ExportDefaultSpecifier;
declare function isPrivateName(node: object | null | undefined, opts?: object | null): node is PrivateName;
declare function isRecordExpression(node: object | null | undefined, opts?: object | null): node is RecordExpression;
declare function isTupleExpression(node: object | null | undefined, opts?: object | null): node is TupleExpression;
declare function isDecimalLiteral(node: object | null | undefined, opts?: object | null): node is DecimalLiteral;
declare function isStaticBlock(node: object | null | undefined, opts?: object | null): node is StaticBlock;
declare function isModuleExpression(node: object | null | undefined, opts?: object | null): node is ModuleExpression;
declare function isTSParameterProperty(node: object | null | undefined, opts?: object | null): node is TSParameterProperty;
declare function isTSDeclareFunction(node: object | null | undefined, opts?: object | null): node is TSDeclareFunction;
declare function isTSDeclareMethod(node: object | null | undefined, opts?: object | null): node is TSDeclareMethod;
declare function isTSQualifiedName(node: object | null | undefined, opts?: object | null): node is TSQualifiedName;
declare function isTSCallSignatureDeclaration(node: object | null | undefined, opts?: object | null): node is TSCallSignatureDeclaration;
declare function isTSConstructSignatureDeclaration(node: object | null | undefined, opts?: object | null): node is TSConstructSignatureDeclaration;
declare function isTSPropertySignature(node: object | null | undefined, opts?: object | null): node is TSPropertySignature;
declare function isTSMethodSignature(node: object | null | undefined, opts?: object | null): node is TSMethodSignature;
declare function isTSIndexSignature(node: object | null | undefined, opts?: object | null): node is TSIndexSignature;
declare function isTSAnyKeyword(node: object | null | undefined, opts?: object | null): node is TSAnyKeyword;
declare function isTSBooleanKeyword(node: object | null | undefined, opts?: object | null): node is TSBooleanKeyword;
declare function isTSBigIntKeyword(node: object | null | undefined, opts?: object | null): node is TSBigIntKeyword;
declare function isTSIntrinsicKeyword(node: object | null | undefined, opts?: object | null): node is TSIntrinsicKeyword;
declare function isTSNeverKeyword(node: object | null | undefined, opts?: object | null): node is TSNeverKeyword;
declare function isTSNullKeyword(node: object | null | undefined, opts?: object | null): node is TSNullKeyword;
declare function isTSNumberKeyword(node: object | null | undefined, opts?: object | null): node is TSNumberKeyword;
declare function isTSObjectKeyword(node: object | null | undefined, opts?: object | null): node is TSObjectKeyword;
declare function isTSStringKeyword(node: object | null | undefined, opts?: object | null): node is TSStringKeyword;
declare function isTSSymbolKeyword(node: object | null | undefined, opts?: object | null): node is TSSymbolKeyword;
declare function isTSUndefinedKeyword(node: object | null | undefined, opts?: object | null): node is TSUndefinedKeyword;
declare function isTSUnknownKeyword(node: object | null | undefined, opts?: object | null): node is TSUnknownKeyword;
declare function isTSVoidKeyword(node: object | null | undefined, opts?: object | null): node is TSVoidKeyword;
declare function isTSThisType(node: object | null | undefined, opts?: object | null): node is TSThisType;
declare function isTSFunctionType(node: object | null | undefined, opts?: object | null): node is TSFunctionType;
declare function isTSConstructorType(node: object | null | undefined, opts?: object | null): node is TSConstructorType;
declare function isTSTypeReference(node: object | null | undefined, opts?: object | null): node is TSTypeReference;
declare function isTSTypePredicate(node: object | null | undefined, opts?: object | null): node is TSTypePredicate;
declare function isTSTypeQuery(node: object | null | undefined, opts?: object | null): node is TSTypeQuery;
declare function isTSTypeLiteral(node: object | null | undefined, opts?: object | null): node is TSTypeLiteral;
declare function isTSArrayType(node: object | null | undefined, opts?: object | null): node is TSArrayType;
declare function isTSTupleType(node: object | null | undefined, opts?: object | null): node is TSTupleType;
declare function isTSOptionalType(node: object | null | undefined, opts?: object | null): node is TSOptionalType;
declare function isTSRestType(node: object | null | undefined, opts?: object | null): node is TSRestType;
declare function isTSNamedTupleMember(node: object | null | undefined, opts?: object | null): node is TSNamedTupleMember;
declare function isTSUnionType(node: object | null | undefined, opts?: object | null): node is TSUnionType;
declare function isTSIntersectionType(node: object | null | undefined, opts?: object | null): node is TSIntersectionType;
declare function isTSConditionalType(node: object | null | undefined, opts?: object | null): node is TSConditionalType;
declare function isTSInferType(node: object | null | undefined, opts?: object | null): node is TSInferType;
declare function isTSParenthesizedType(node: object | null | undefined, opts?: object | null): node is TSParenthesizedType;
declare function isTSTypeOperator(node: object | null | undefined, opts?: object | null): node is TSTypeOperator;
declare function isTSIndexedAccessType(node: object | null | undefined, opts?: object | null): node is TSIndexedAccessType;
declare function isTSMappedType(node: object | null | undefined, opts?: object | null): node is TSMappedType;
declare function isTSLiteralType(node: object | null | undefined, opts?: object | null): node is TSLiteralType;
declare function isTSExpressionWithTypeArguments(node: object | null | undefined, opts?: object | null): node is TSExpressionWithTypeArguments;
declare function isTSInterfaceDeclaration(node: object | null | undefined, opts?: object | null): node is TSInterfaceDeclaration;
declare function isTSInterfaceBody(node: object | null | undefined, opts?: object | null): node is TSInterfaceBody;
declare function isTSTypeAliasDeclaration(node: object | null | undefined, opts?: object | null): node is TSTypeAliasDeclaration;
declare function isTSAsExpression(node: object | null | undefined, opts?: object | null): node is TSAsExpression;
declare function isTSTypeAssertion(node: object | null | undefined, opts?: object | null): node is TSTypeAssertion;
declare function isTSEnumDeclaration(node: object | null | undefined, opts?: object | null): node is TSEnumDeclaration;
declare function isTSEnumMember(node: object | null | undefined, opts?: object | null): node is TSEnumMember;
declare function isTSModuleDeclaration(node: object | null | undefined, opts?: object | null): node is TSModuleDeclaration;
declare function isTSModuleBlock(node: object | null | undefined, opts?: object | null): node is TSModuleBlock;
declare function isTSImportType(node: object | null | undefined, opts?: object | null): node is TSImportType;
declare function isTSImportEqualsDeclaration(node: object | null | undefined, opts?: object | null): node is TSImportEqualsDeclaration;
declare function isTSExternalModuleReference(node: object | null | undefined, opts?: object | null): node is TSExternalModuleReference;
declare function isTSNonNullExpression(node: object | null | undefined, opts?: object | null): node is TSNonNullExpression;
declare function isTSExportAssignment(node: object | null | undefined, opts?: object | null): node is TSExportAssignment;
declare function isTSNamespaceExportDeclaration(node: object | null | undefined, opts?: object | null): node is TSNamespaceExportDeclaration;
declare function isTSTypeAnnotation(node: object | null | undefined, opts?: object | null): node is TSTypeAnnotation;
declare function isTSTypeParameterInstantiation(node: object | null | undefined, opts?: object | null): node is TSTypeParameterInstantiation;
declare function isTSTypeParameterDeclaration(node: object | null | undefined, opts?: object | null): node is TSTypeParameterDeclaration;
declare function isTSTypeParameter(node: object | null | undefined, opts?: object | null): node is TSTypeParameter;
declare function isExpression(node: object | null | undefined, opts?: object | null): node is Expression;
declare function isBinary(node: object | null | undefined, opts?: object | null): node is Binary;
declare function isScopable(node: object | null | undefined, opts?: object | null): node is Scopable;
declare function isBlockParent(node: object | null | undefined, opts?: object | null): node is BlockParent;
declare function isBlock(node: object | null | undefined, opts?: object | null): node is Block;
declare function isStatement(node: object | null | undefined, opts?: object | null): node is Statement;
declare function isTerminatorless(node: object | null | undefined, opts?: object | null): node is Terminatorless;
declare function isCompletionStatement(node: object | null | undefined, opts?: object | null): node is CompletionStatement;
declare function isConditional(node: object | null | undefined, opts?: object | null): node is Conditional;
declare function isLoop(node: object | null | undefined, opts?: object | null): node is Loop;
declare function isWhile(node: object | null | undefined, opts?: object | null): node is While;
declare function isExpressionWrapper(node: object | null | undefined, opts?: object | null): node is ExpressionWrapper;
declare function isFor(node: object | null | undefined, opts?: object | null): node is For;
declare function isForXStatement(node: object | null | undefined, opts?: object | null): node is ForXStatement;
declare function isFunction(node: object | null | undefined, opts?: object | null): node is Function;
declare function isFunctionParent(node: object | null | undefined, opts?: object | null): node is FunctionParent;
declare function isPureish(node: object | null | undefined, opts?: object | null): node is Pureish;
declare function isDeclaration(node: object | null | undefined, opts?: object | null): node is Declaration;
declare function isPatternLike(node: object | null | undefined, opts?: object | null): node is PatternLike;
declare function isLVal(node: object | null | undefined, opts?: object | null): node is LVal;
declare function isTSEntityName(node: object | null | undefined, opts?: object | null): node is TSEntityName;
declare function isLiteral(node: object | null | undefined, opts?: object | null): node is Literal;
declare function isUserWhitespacable(node: object | null | undefined, opts?: object | null): node is UserWhitespacable;
declare function isMethod(node: object | null | undefined, opts?: object | null): node is Method;
declare function isObjectMember(node: object | null | undefined, opts?: object | null): node is ObjectMember;
declare function isProperty(node: object | null | undefined, opts?: object | null): node is Property;
declare function isUnaryLike(node: object | null | undefined, opts?: object | null): node is UnaryLike;
declare function isPattern(node: object | null | undefined, opts?: object | null): node is Pattern;
declare function isClass(node: object | null | undefined, opts?: object | null): node is Class;
declare function isModuleDeclaration(node: object | null | undefined, opts?: object | null): node is ModuleDeclaration;
declare function isExportDeclaration(node: object | null | undefined, opts?: object | null): node is ExportDeclaration;
declare function isModuleSpecifier(node: object | null | undefined, opts?: object | null): node is ModuleSpecifier;
declare function isFlow(node: object | null | undefined, opts?: object | null): node is Flow;
declare function isFlowType(node: object | null | undefined, opts?: object | null): node is FlowType;
declare function isFlowBaseAnnotation(node: object | null | undefined, opts?: object | null): node is FlowBaseAnnotation;
declare function isFlowDeclaration(node: object | null | undefined, opts?: object | null): node is FlowDeclaration;
declare function isFlowPredicate(node: object | null | undefined, opts?: object | null): node is FlowPredicate;
declare function isEnumBody(node: object | null | undefined, opts?: object | null): node is EnumBody;
declare function isEnumMember(node: object | null | undefined, opts?: object | null): node is EnumMember;
declare function isJSX(node: object | null | undefined, opts?: object | null): node is JSX;
declare function isPrivate(node: object | null | undefined, opts?: object | null): node is Private;
declare function isTSTypeElement(node: object | null | undefined, opts?: object | null): node is TSTypeElement;
declare function isTSType(node: object | null | undefined, opts?: object | null): node is TSType;
declare function isTSBaseType(node: object | null | undefined, opts?: object | null): node is TSBaseType;
declare function isNumberLiteral(node: object | null | undefined, opts?: object | null): boolean;
declare function isRegexLiteral(node: object | null | undefined, opts?: object | null): boolean;
declare function isRestProperty(node: object | null | undefined, opts?: object | null): boolean;
declare function isSpreadProperty(node: object | null | undefined, opts?: object | null): boolean;

declare const react: {
    isReactComponent: (member: Node) => boolean;
    isCompatTag: typeof isCompatTag;
    buildChildren: typeof buildChildren;
};

export { ALIAS_KEYS, ASSIGNMENT_OPERATORS, Aliases, AnyTypeAnnotation, ArgumentPlaceholder, ArrayExpression, ArrayPattern, ArrayTypeAnnotation, ArrowFunctionExpression, AssignmentExpression, AssignmentPattern, AwaitExpression, BINARY_OPERATORS, BINARY_TYPES, BLOCKPARENT_TYPES, BLOCK_SCOPED_SYMBOL, BLOCK_TYPES, BOOLEAN_BINARY_OPERATORS, BOOLEAN_NUMBER_BINARY_OPERATORS, BOOLEAN_UNARY_OPERATORS, BUILDER_KEYS, BigIntLiteral, Binary, BinaryExpression, BindExpression, Block, BlockParent, BlockStatement, BooleanLiteral, BooleanLiteralTypeAnnotation, BooleanTypeAnnotation, BreakStatement, CLASS_TYPES, COMMENT_KEYS, COMPARISON_BINARY_OPERATORS, COMPLETIONSTATEMENT_TYPES, CONDITIONAL_TYPES, CallExpression, CatchClause, Class, ClassBody, ClassDeclaration, ClassExpression, ClassImplements, ClassMethod, ClassPrivateMethod, ClassPrivateProperty, ClassProperty, Comment, CommentBlock, CommentLine, CommentTypeShorthand, CompletionStatement, Conditional, ConditionalExpression, ContinueStatement, DECLARATION_TYPES, DEPRECATED_KEYS, DebuggerStatement, DecimalLiteral, Declaration, DeclareClass, DeclareExportAllDeclaration, DeclareExportDeclaration, DeclareFunction, DeclareInterface, DeclareModule, DeclareModuleExports, DeclareOpaqueType, DeclareTypeAlias, DeclareVariable, DeclaredPredicate, Decorator, Directive, DirectiveLiteral, DoExpression, DoWhileStatement, ENUMBODY_TYPES, ENUMMEMBER_TYPES, EQUALITY_BINARY_OPERATORS, EXPORTDECLARATION_TYPES, EXPRESSIONWRAPPER_TYPES, EXPRESSION_TYPES, EmptyStatement, EmptyTypeAnnotation, EnumBody, EnumBooleanBody, EnumBooleanMember, EnumDeclaration, EnumDefaultedMember, EnumMember, EnumNumberBody, EnumNumberMember, EnumStringBody, EnumStringMember, EnumSymbolBody, ExistsTypeAnnotation, ExportAllDeclaration, ExportDeclaration, ExportDefaultDeclaration, ExportDefaultSpecifier, ExportNamedDeclaration, ExportNamespaceSpecifier, ExportSpecifier, Expression, ExpressionStatement, ExpressionWrapper, FLATTENABLE_KEYS, FLIPPED_ALIAS_KEYS, FLOWBASEANNOTATION_TYPES, FLOWDECLARATION_TYPES, FLOWPREDICATE_TYPES, FLOWTYPE_TYPES, FLOW_TYPES, FORXSTATEMENT_TYPES, FOR_INIT_KEYS, FOR_TYPES, FUNCTIONPARENT_TYPES, FUNCTION_TYPES, File, Flow, FlowBaseAnnotation, FlowDeclaration, FlowPredicate, FlowType, For, ForInStatement, ForOfStatement, ForStatement, ForXStatement, Function, FunctionDeclaration, FunctionExpression, FunctionParent, FunctionTypeAnnotation, FunctionTypeParam, GenericTypeAnnotation, IMMUTABLE_TYPES, INHERIT_KEYS, Identifier, IfStatement, Immutable, Import, ImportAttribute, ImportDeclaration, ImportDefaultSpecifier, ImportNamespaceSpecifier, ImportSpecifier, InferredPredicate, InterfaceDeclaration, InterfaceExtends, InterfaceTypeAnnotation, InterpreterDirective, IntersectionTypeAnnotation, JSX, JSXAttribute, JSXClosingElement, JSXClosingFragment, JSXElement, JSXEmptyExpression, JSXExpressionContainer, JSXFragment, JSXIdentifier, JSXMemberExpression, JSXNamespacedName, JSXOpeningElement, JSXOpeningFragment, JSXSpreadAttribute, JSXSpreadChild, JSXText, JSX_TYPES, LITERAL_TYPES, LOGICAL_OPERATORS, LOOP_TYPES, LVAL_TYPES, LVal, LabeledStatement, Literal, LogicalExpression, Loop, METHOD_TYPES, MODULEDECLARATION_TYPES, MODULESPECIFIER_TYPES, MemberExpression, MetaProperty, Method, MixedTypeAnnotation, ModuleDeclaration, ModuleExpression, ModuleSpecifier, NODE_FIELDS, NODE_PARENT_VALIDATIONS, NOT_LOCAL_BINDING, NUMBER_BINARY_OPERATORS, NUMBER_UNARY_OPERATORS, NewExpression, Node, Noop, NullLiteral, NullLiteralTypeAnnotation, NullableTypeAnnotation, NumberLiteral, NumberLiteralTypeAnnotation, NumberTypeAnnotation, NumericLiteral, OBJECTMEMBER_TYPES, ObjectExpression, ObjectMember, ObjectMethod, ObjectPattern, ObjectProperty, ObjectTypeAnnotation, ObjectTypeCallProperty, ObjectTypeIndexer, ObjectTypeInternalSlot, ObjectTypeProperty, ObjectTypeSpreadProperty, OpaqueType, OptionalCallExpression, OptionalMemberExpression, PATTERNLIKE_TYPES, PATTERN_TYPES, PLACEHOLDERS, PLACEHOLDERS_ALIAS, PLACEHOLDERS_FLIPPED_ALIAS, PRIVATE_TYPES, PROPERTY_TYPES, PUREISH_TYPES, ParenthesizedExpression, Pattern, PatternLike, PipelineBareFunction, PipelinePrimaryTopicReference, PipelineTopicExpression, Placeholder, Private, PrivateName, Program, Property, Pureish, QualifiedTypeIdentifier, RecordExpression, RegExpLiteral, RegexLiteral, RestElement, RestProperty, ReturnStatement, SCOPABLE_TYPES, STATEMENT_OR_BLOCK_KEYS, STATEMENT_TYPES, STRING_UNARY_OPERATORS, Scopable, SequenceExpression, SourceLocation, SpreadElement, SpreadProperty, Statement, StaticBlock, StringLiteral, StringLiteralTypeAnnotation, StringTypeAnnotation, Super, SwitchCase, SwitchStatement, SymbolTypeAnnotation, TERMINATORLESS_TYPES, TSAnyKeyword, TSArrayType, TSAsExpression, TSBASETYPE_TYPES, TSBaseType, TSBigIntKeyword, TSBooleanKeyword, TSCallSignatureDeclaration, TSConditionalType, TSConstructSignatureDeclaration, TSConstructorType, TSDeclareFunction, TSDeclareMethod, TSENTITYNAME_TYPES, TSEntityName, TSEnumDeclaration, TSEnumMember, TSExportAssignment, TSExpressionWithTypeArguments, TSExternalModuleReference, TSFunctionType, TSImportEqualsDeclaration, TSImportType, TSIndexSignature, TSIndexedAccessType, TSInferType, TSInterfaceBody, TSInterfaceDeclaration, TSIntersectionType, TSIntrinsicKeyword, TSLiteralType, TSMappedType, TSMethodSignature, TSModuleBlock, TSModuleDeclaration, TSNamedTupleMember, TSNamespaceExportDeclaration, TSNeverKeyword, TSNonNullExpression, TSNullKeyword, TSNumberKeyword, TSObjectKeyword, TSOptionalType, TSParameterProperty, TSParenthesizedType, TSPropertySignature, TSQualifiedName, TSRestType, TSStringKeyword, TSSymbolKeyword, TSTYPEELEMENT_TYPES, TSTYPE_TYPES, TSThisType, TSTupleType, TSType, TSTypeAliasDeclaration, TSTypeAnnotation, TSTypeAssertion, TSTypeElement, TSTypeLiteral, TSTypeOperator, TSTypeParameter, TSTypeParameterDeclaration, TSTypeParameterInstantiation, TSTypePredicate, TSTypeQuery, TSTypeReference, TSUndefinedKeyword, TSUnionType, TSUnknownKeyword, TSVoidKeyword, TYPES, TaggedTemplateExpression, TemplateElement, TemplateLiteral, Terminatorless, ThisExpression, ThisTypeAnnotation, ThrowStatement, TraversalAncestors, TraversalHandler, TraversalHandlers, TryStatement, TupleExpression, TupleTypeAnnotation, TypeAlias, TypeAnnotation, TypeCastExpression, TypeParameter, TypeParameterDeclaration, TypeParameterInstantiation, TypeofTypeAnnotation, UNARYLIKE_TYPES, UNARY_OPERATORS, UPDATE_OPERATORS, USERWHITESPACABLE_TYPES, UnaryExpression, UnaryLike, UnionTypeAnnotation, UpdateExpression, UserWhitespacable, V8IntrinsicIdentifier, VISITOR_KEYS, VariableDeclaration, VariableDeclarator, Variance, VoidTypeAnnotation, WHILE_TYPES, While, WhileStatement, WithStatement, YieldExpression, addComment, addComments, anyTypeAnnotation, appendToMemberExpression, argumentPlaceholder, arrayExpression, arrayPattern, arrayTypeAnnotation, arrowFunctionExpression, assertAnyTypeAnnotation, assertArgumentPlaceholder, assertArrayExpression, assertArrayPattern, assertArrayTypeAnnotation, assertArrowFunctionExpression, assertAssignmentExpression, assertAssignmentPattern, assertAwaitExpression, assertBigIntLiteral, assertBinary, assertBinaryExpression, assertBindExpression, assertBlock, assertBlockParent, assertBlockStatement, assertBooleanLiteral, assertBooleanLiteralTypeAnnotation, assertBooleanTypeAnnotation, assertBreakStatement, assertCallExpression, assertCatchClause, assertClass, assertClassBody, assertClassDeclaration, assertClassExpression, assertClassImplements, assertClassMethod, assertClassPrivateMethod, assertClassPrivateProperty, assertClassProperty, assertCompletionStatement, assertConditional, assertConditionalExpression, assertContinueStatement, assertDebuggerStatement, assertDecimalLiteral, assertDeclaration, assertDeclareClass, assertDeclareExportAllDeclaration, assertDeclareExportDeclaration, assertDeclareFunction, assertDeclareInterface, assertDeclareModule, assertDeclareModuleExports, assertDeclareOpaqueType, assertDeclareTypeAlias, assertDeclareVariable, assertDeclaredPredicate, assertDecorator, assertDirective, assertDirectiveLiteral, assertDoExpression, assertDoWhileStatement, assertEmptyStatement, assertEmptyTypeAnnotation, assertEnumBody, assertEnumBooleanBody, assertEnumBooleanMember, assertEnumDeclaration, assertEnumDefaultedMember, assertEnumMember, assertEnumNumberBody, assertEnumNumberMember, assertEnumStringBody, assertEnumStringMember, assertEnumSymbolBody, assertExistsTypeAnnotation, assertExportAllDeclaration, assertExportDeclaration, assertExportDefaultDeclaration, assertExportDefaultSpecifier, assertExportNamedDeclaration, assertExportNamespaceSpecifier, assertExportSpecifier, assertExpression, assertExpressionStatement, assertExpressionWrapper, assertFile, assertFlow, assertFlowBaseAnnotation, assertFlowDeclaration, assertFlowPredicate, assertFlowType, assertFor, assertForInStatement, assertForOfStatement, assertForStatement, assertForXStatement, assertFunction, assertFunctionDeclaration, assertFunctionExpression, assertFunctionParent, assertFunctionTypeAnnotation, assertFunctionTypeParam, assertGenericTypeAnnotation, assertIdentifier, assertIfStatement, assertImmutable, assertImport, assertImportAttribute, assertImportDeclaration, assertImportDefaultSpecifier, assertImportNamespaceSpecifier, assertImportSpecifier, assertInferredPredicate, assertInterfaceDeclaration, assertInterfaceExtends, assertInterfaceTypeAnnotation, assertInterpreterDirective, assertIntersectionTypeAnnotation, assertJSX, assertJSXAttribute, assertJSXClosingElement, assertJSXClosingFragment, assertJSXElement, assertJSXEmptyExpression, assertJSXExpressionContainer, assertJSXFragment, assertJSXIdentifier, assertJSXMemberExpression, assertJSXNamespacedName, assertJSXOpeningElement, assertJSXOpeningFragment, assertJSXSpreadAttribute, assertJSXSpreadChild, assertJSXText, assertLVal, assertLabeledStatement, assertLiteral, assertLogicalExpression, assertLoop, assertMemberExpression, assertMetaProperty, assertMethod, assertMixedTypeAnnotation, assertModuleDeclaration, assertModuleExpression, assertModuleSpecifier, assertNewExpression, assertNode, assertNoop, assertNullLiteral, assertNullLiteralTypeAnnotation, assertNullableTypeAnnotation, assertNumberLiteral, assertNumberLiteralTypeAnnotation, assertNumberTypeAnnotation, assertNumericLiteral, assertObjectExpression, assertObjectMember, assertObjectMethod, assertObjectPattern, assertObjectProperty, assertObjectTypeAnnotation, assertObjectTypeCallProperty, assertObjectTypeIndexer, assertObjectTypeInternalSlot, assertObjectTypeProperty, assertObjectTypeSpreadProperty, assertOpaqueType, assertOptionalCallExpression, assertOptionalMemberExpression, assertParenthesizedExpression, assertPattern, assertPatternLike, assertPipelineBareFunction, assertPipelinePrimaryTopicReference, assertPipelineTopicExpression, assertPlaceholder, assertPrivate, assertPrivateName, assertProgram, assertProperty, assertPureish, assertQualifiedTypeIdentifier, assertRecordExpression, assertRegExpLiteral, assertRegexLiteral, assertRestElement, assertRestProperty, assertReturnStatement, assertScopable, assertSequenceExpression, assertSpreadElement, assertSpreadProperty, assertStatement, assertStaticBlock, assertStringLiteral, assertStringLiteralTypeAnnotation, assertStringTypeAnnotation, assertSuper, assertSwitchCase, assertSwitchStatement, assertSymbolTypeAnnotation, assertTSAnyKeyword, assertTSArrayType, assertTSAsExpression, assertTSBaseType, assertTSBigIntKeyword, assertTSBooleanKeyword, assertTSCallSignatureDeclaration, assertTSConditionalType, assertTSConstructSignatureDeclaration, assertTSConstructorType, assertTSDeclareFunction, assertTSDeclareMethod, assertTSEntityName, assertTSEnumDeclaration, assertTSEnumMember, assertTSExportAssignment, assertTSExpressionWithTypeArguments, assertTSExternalModuleReference, assertTSFunctionType, assertTSImportEqualsDeclaration, assertTSImportType, assertTSIndexSignature, assertTSIndexedAccessType, assertTSInferType, assertTSInterfaceBody, assertTSInterfaceDeclaration, assertTSIntersectionType, assertTSIntrinsicKeyword, assertTSLiteralType, assertTSMappedType, assertTSMethodSignature, assertTSModuleBlock, assertTSModuleDeclaration, assertTSNamedTupleMember, assertTSNamespaceExportDeclaration, assertTSNeverKeyword, assertTSNonNullExpression, assertTSNullKeyword, assertTSNumberKeyword, assertTSObjectKeyword, assertTSOptionalType, assertTSParameterProperty, assertTSParenthesizedType, assertTSPropertySignature, assertTSQualifiedName, assertTSRestType, assertTSStringKeyword, assertTSSymbolKeyword, assertTSThisType, assertTSTupleType, assertTSType, assertTSTypeAliasDeclaration, assertTSTypeAnnotation, assertTSTypeAssertion, assertTSTypeElement, assertTSTypeLiteral, assertTSTypeOperator, assertTSTypeParameter, assertTSTypeParameterDeclaration, assertTSTypeParameterInstantiation, assertTSTypePredicate, assertTSTypeQuery, assertTSTypeReference, assertTSUndefinedKeyword, assertTSUnionType, assertTSUnknownKeyword, assertTSVoidKeyword, assertTaggedTemplateExpression, assertTemplateElement, assertTemplateLiteral, assertTerminatorless, assertThisExpression, assertThisTypeAnnotation, assertThrowStatement, assertTryStatement, assertTupleExpression, assertTupleTypeAnnotation, assertTypeAlias, assertTypeAnnotation, assertTypeCastExpression, assertTypeParameter, assertTypeParameterDeclaration, assertTypeParameterInstantiation, assertTypeofTypeAnnotation, assertUnaryExpression, assertUnaryLike, assertUnionTypeAnnotation, assertUpdateExpression, assertUserWhitespacable, assertV8IntrinsicIdentifier, assertVariableDeclaration, assertVariableDeclarator, assertVariance, assertVoidTypeAnnotation, assertWhile, assertWhileStatement, assertWithStatement, assertYieldExpression, assignmentExpression, assignmentPattern, awaitExpression, bigIntLiteral, binaryExpression, bindExpression, blockStatement, booleanLiteral, booleanLiteralTypeAnnotation, booleanTypeAnnotation, breakStatement, buildMatchMemberExpression, callExpression, catchClause, classBody, classDeclaration, classExpression, classImplements, classMethod, classPrivateMethod, classPrivateProperty, classProperty, clone, cloneDeep, cloneDeepWithoutLoc, cloneNode, cloneWithoutLoc, conditionalExpression, continueStatement, createFlowUnionType, createTSUnionType, createTypeAnnotationBasedOnTypeof, createFlowUnionType as createUnionTypeAnnotation, debuggerStatement, decimalLiteral, declareClass, declareExportAllDeclaration, declareExportDeclaration, declareFunction, declareInterface, declareModule, declareModuleExports, declareOpaqueType, declareTypeAlias, declareVariable, declaredPredicate, decorator, directive, directiveLiteral, doExpression, doWhileStatement, emptyStatement, emptyTypeAnnotation, ensureBlock, enumBooleanBody, enumBooleanMember, enumDeclaration, enumDefaultedMember, enumNumberBody, enumNumberMember, enumStringBody, enumStringMember, enumSymbolBody, existsTypeAnnotation, exportAllDeclaration, exportDefaultDeclaration, exportDefaultSpecifier, exportNamedDeclaration, exportNamespaceSpecifier, exportSpecifier, expressionStatement, file, forInStatement, forOfStatement, forStatement, functionDeclaration, functionExpression, functionTypeAnnotation, functionTypeParam, genericTypeAnnotation, getBindingIdentifiers, _default$3 as getOuterBindingIdentifiers, identifier, ifStatement, _import as import, importAttribute, importDeclaration, importDefaultSpecifier, importNamespaceSpecifier, importSpecifier, inferredPredicate, inheritInnerComments, inheritLeadingComments, inheritTrailingComments, inherits, inheritsComments, interfaceDeclaration, interfaceExtends, interfaceTypeAnnotation, interpreterDirective, intersectionTypeAnnotation, is, isAnyTypeAnnotation, isArgumentPlaceholder, isArrayExpression, isArrayPattern, isArrayTypeAnnotation, isArrowFunctionExpression, isAssignmentExpression, isAssignmentPattern, isAwaitExpression, isBigIntLiteral, isBinary, isBinaryExpression, isBindExpression, isBinding, isBlock, isBlockParent, isBlockScoped, isBlockStatement, isBooleanLiteral, isBooleanLiteralTypeAnnotation, isBooleanTypeAnnotation, isBreakStatement, isCallExpression, isCatchClause, isClass, isClassBody, isClassDeclaration, isClassExpression, isClassImplements, isClassMethod, isClassPrivateMethod, isClassPrivateProperty, isClassProperty, isCompletionStatement, isConditional, isConditionalExpression, isContinueStatement, isDebuggerStatement, isDecimalLiteral, isDeclaration, isDeclareClass, isDeclareExportAllDeclaration, isDeclareExportDeclaration, isDeclareFunction, isDeclareInterface, isDeclareModule, isDeclareModuleExports, isDeclareOpaqueType, isDeclareTypeAlias, isDeclareVariable, isDeclaredPredicate, isDecorator, isDirective, isDirectiveLiteral, isDoExpression, isDoWhileStatement, isEmptyStatement, isEmptyTypeAnnotation, isEnumBody, isEnumBooleanBody, isEnumBooleanMember, isEnumDeclaration, isEnumDefaultedMember, isEnumMember, isEnumNumberBody, isEnumNumberMember, isEnumStringBody, isEnumStringMember, isEnumSymbolBody, isExistsTypeAnnotation, isExportAllDeclaration, isExportDeclaration, isExportDefaultDeclaration, isExportDefaultSpecifier, isExportNamedDeclaration, isExportNamespaceSpecifier, isExportSpecifier, isExpression, isExpressionStatement, isExpressionWrapper, isFile, isFlow, isFlowBaseAnnotation, isFlowDeclaration, isFlowPredicate, isFlowType, isFor, isForInStatement, isForOfStatement, isForStatement, isForXStatement, isFunction, isFunctionDeclaration, isFunctionExpression, isFunctionParent, isFunctionTypeAnnotation, isFunctionTypeParam, isGenericTypeAnnotation, isIdentifier, isIfStatement, isImmutable, isImport, isImportAttribute, isImportDeclaration, isImportDefaultSpecifier, isImportNamespaceSpecifier, isImportSpecifier, isInferredPredicate, isInterfaceDeclaration, isInterfaceExtends, isInterfaceTypeAnnotation, isInterpreterDirective, isIntersectionTypeAnnotation, isJSX, isJSXAttribute, isJSXClosingElement, isJSXClosingFragment, isJSXElement, isJSXEmptyExpression, isJSXExpressionContainer, isJSXFragment, isJSXIdentifier, isJSXMemberExpression, isJSXNamespacedName, isJSXOpeningElement, isJSXOpeningFragment, isJSXSpreadAttribute, isJSXSpreadChild, isJSXText, isLVal, isLabeledStatement, isLet, isLiteral, isLogicalExpression, isLoop, isMemberExpression, isMetaProperty, isMethod, isMixedTypeAnnotation, isModuleDeclaration, isModuleExpression, isModuleSpecifier, isNewExpression, isNode, isNodesEquivalent, isNoop, isNullLiteral, isNullLiteralTypeAnnotation, isNullableTypeAnnotation, isNumberLiteral, isNumberLiteralTypeAnnotation, isNumberTypeAnnotation, isNumericLiteral, isObjectExpression, isObjectMember, isObjectMethod, isObjectPattern, isObjectProperty, isObjectTypeAnnotation, isObjectTypeCallProperty, isObjectTypeIndexer, isObjectTypeInternalSlot, isObjectTypeProperty, isObjectTypeSpreadProperty, isOpaqueType, isOptionalCallExpression, isOptionalMemberExpression, isParenthesizedExpression, isPattern, isPatternLike, isPipelineBareFunction, isPipelinePrimaryTopicReference, isPipelineTopicExpression, isPlaceholder, isPlaceholderType, isPrivate, isPrivateName, isProgram, isProperty, isPureish, isQualifiedTypeIdentifier, isRecordExpression, isReferenced, isRegExpLiteral, isRegexLiteral, isRestElement, isRestProperty, isReturnStatement, isScopable, isScope, isSequenceExpression, isSpecifierDefault, isSpreadElement, isSpreadProperty, isStatement, isStaticBlock, isStringLiteral, isStringLiteralTypeAnnotation, isStringTypeAnnotation, isSuper, isSwitchCase, isSwitchStatement, isSymbolTypeAnnotation, isTSAnyKeyword, isTSArrayType, isTSAsExpression, isTSBaseType, isTSBigIntKeyword, isTSBooleanKeyword, isTSCallSignatureDeclaration, isTSConditionalType, isTSConstructSignatureDeclaration, isTSConstructorType, isTSDeclareFunction, isTSDeclareMethod, isTSEntityName, isTSEnumDeclaration, isTSEnumMember, isTSExportAssignment, isTSExpressionWithTypeArguments, isTSExternalModuleReference, isTSFunctionType, isTSImportEqualsDeclaration, isTSImportType, isTSIndexSignature, isTSIndexedAccessType, isTSInferType, isTSInterfaceBody, isTSInterfaceDeclaration, isTSIntersectionType, isTSIntrinsicKeyword, isTSLiteralType, isTSMappedType, isTSMethodSignature, isTSModuleBlock, isTSModuleDeclaration, isTSNamedTupleMember, isTSNamespaceExportDeclaration, isTSNeverKeyword, isTSNonNullExpression, isTSNullKeyword, isTSNumberKeyword, isTSObjectKeyword, isTSOptionalType, isTSParameterProperty, isTSParenthesizedType, isTSPropertySignature, isTSQualifiedName, isTSRestType, isTSStringKeyword, isTSSymbolKeyword, isTSThisType, isTSTupleType, isTSType, isTSTypeAliasDeclaration, isTSTypeAnnotation, isTSTypeAssertion, isTSTypeElement, isTSTypeLiteral, isTSTypeOperator, isTSTypeParameter, isTSTypeParameterDeclaration, isTSTypeParameterInstantiation, isTSTypePredicate, isTSTypeQuery, isTSTypeReference, isTSUndefinedKeyword, isTSUnionType, isTSUnknownKeyword, isTSVoidKeyword, isTaggedTemplateExpression, isTemplateElement, isTemplateLiteral, isTerminatorless, isThisExpression, isThisTypeAnnotation, isThrowStatement, isTryStatement, isTupleExpression, isTupleTypeAnnotation, isType, isTypeAlias, isTypeAnnotation, isTypeCastExpression, isTypeParameter, isTypeParameterDeclaration, isTypeParameterInstantiation, isTypeofTypeAnnotation, isUnaryExpression, isUnaryLike, isUnionTypeAnnotation, isUpdateExpression, isUserWhitespacable, isV8IntrinsicIdentifier, isValidES3Identifier, isValidIdentifier, isVar, isVariableDeclaration, isVariableDeclarator, isVariance, isVoidTypeAnnotation, isWhile, isWhileStatement, isWithStatement, isYieldExpression, jsxAttribute as jSXAttribute, jsxClosingElement as jSXClosingElement, jsxClosingFragment as jSXClosingFragment, jsxElement as jSXElement, jsxEmptyExpression as jSXEmptyExpression, jsxExpressionContainer as jSXExpressionContainer, jsxFragment as jSXFragment, jsxIdentifier as jSXIdentifier, jsxMemberExpression as jSXMemberExpression, jsxNamespacedName as jSXNamespacedName, jsxOpeningElement as jSXOpeningElement, jsxOpeningFragment as jSXOpeningFragment, jsxSpreadAttribute as jSXSpreadAttribute, jsxSpreadChild as jSXSpreadChild, jsxText as jSXText, jsxAttribute, jsxClosingElement, jsxClosingFragment, jsxElement, jsxEmptyExpression, jsxExpressionContainer, jsxFragment, jsxIdentifier, jsxMemberExpression, jsxNamespacedName, jsxOpeningElement, jsxOpeningFragment, jsxSpreadAttribute, jsxSpreadChild, jsxText, labeledStatement, logicalExpression, matchesPattern, memberExpression, metaProperty, mixedTypeAnnotation, moduleExpression, newExpression, noop, nullLiteral, nullLiteralTypeAnnotation, nullableTypeAnnotation, NumberLiteral$1 as numberLiteral, numberLiteralTypeAnnotation, numberTypeAnnotation, numericLiteral, objectExpression, objectMethod, objectPattern, objectProperty, objectTypeAnnotation, objectTypeCallProperty, objectTypeIndexer, objectTypeInternalSlot, objectTypeProperty, objectTypeSpreadProperty, opaqueType, optionalCallExpression, optionalMemberExpression, parenthesizedExpression, pipelineBareFunction, pipelinePrimaryTopicReference, pipelineTopicExpression, placeholder, prependToMemberExpression, privateName, program, qualifiedTypeIdentifier, react, recordExpression, regExpLiteral, RegexLiteral$1 as regexLiteral, removeComments, removeProperties, removePropertiesDeep, removeTypeDuplicates, restElement, RestProperty$1 as restProperty, returnStatement, sequenceExpression, shallowEqual, spreadElement, SpreadProperty$1 as spreadProperty, staticBlock, stringLiteral, stringLiteralTypeAnnotation, stringTypeAnnotation, _super as super, switchCase, switchStatement, symbolTypeAnnotation, tsAnyKeyword as tSAnyKeyword, tsArrayType as tSArrayType, tsAsExpression as tSAsExpression, tsBigIntKeyword as tSBigIntKeyword, tsBooleanKeyword as tSBooleanKeyword, tsCallSignatureDeclaration as tSCallSignatureDeclaration, tsConditionalType as tSConditionalType, tsConstructSignatureDeclaration as tSConstructSignatureDeclaration, tsConstructorType as tSConstructorType, tsDeclareFunction as tSDeclareFunction, tsDeclareMethod as tSDeclareMethod, tsEnumDeclaration as tSEnumDeclaration, tsEnumMember as tSEnumMember, tsExportAssignment as tSExportAssignment, tsExpressionWithTypeArguments as tSExpressionWithTypeArguments, tsExternalModuleReference as tSExternalModuleReference, tsFunctionType as tSFunctionType, tsImportEqualsDeclaration as tSImportEqualsDeclaration, tsImportType as tSImportType, tsIndexSignature as tSIndexSignature, tsIndexedAccessType as tSIndexedAccessType, tsInferType as tSInferType, tsInterfaceBody as tSInterfaceBody, tsInterfaceDeclaration as tSInterfaceDeclaration, tsIntersectionType as tSIntersectionType, tsIntrinsicKeyword as tSIntrinsicKeyword, tsLiteralType as tSLiteralType, tsMappedType as tSMappedType, tsMethodSignature as tSMethodSignature, tsModuleBlock as tSModuleBlock, tsModuleDeclaration as tSModuleDeclaration, tsNamedTupleMember as tSNamedTupleMember, tsNamespaceExportDeclaration as tSNamespaceExportDeclaration, tsNeverKeyword as tSNeverKeyword, tsNonNullExpression as tSNonNullExpression, tsNullKeyword as tSNullKeyword, tsNumberKeyword as tSNumberKeyword, tsObjectKeyword as tSObjectKeyword, tsOptionalType as tSOptionalType, tsParameterProperty as tSParameterProperty, tsParenthesizedType as tSParenthesizedType, tsPropertySignature as tSPropertySignature, tsQualifiedName as tSQualifiedName, tsRestType as tSRestType, tsStringKeyword as tSStringKeyword, tsSymbolKeyword as tSSymbolKeyword, tsThisType as tSThisType, tsTupleType as tSTupleType, tsTypeAliasDeclaration as tSTypeAliasDeclaration, tsTypeAnnotation as tSTypeAnnotation, tsTypeAssertion as tSTypeAssertion, tsTypeLiteral as tSTypeLiteral, tsTypeOperator as tSTypeOperator, tsTypeParameter as tSTypeParameter, tsTypeParameterDeclaration as tSTypeParameterDeclaration, tsTypeParameterInstantiation as tSTypeParameterInstantiation, tsTypePredicate as tSTypePredicate, tsTypeQuery as tSTypeQuery, tsTypeReference as tSTypeReference, tsUndefinedKeyword as tSUndefinedKeyword, tsUnionType as tSUnionType, tsUnknownKeyword as tSUnknownKeyword, tsVoidKeyword as tSVoidKeyword, taggedTemplateExpression, templateElement, templateLiteral, thisExpression, thisTypeAnnotation, throwStatement, toBindingIdentifierName, toBlock, toComputedKey, _default as toExpression, toIdentifier, toKeyAlias, toSequenceExpression, _default$1 as toStatement, traverse, traverseFast, tryStatement, tsAnyKeyword, tsArrayType, tsAsExpression, tsBigIntKeyword, tsBooleanKeyword, tsCallSignatureDeclaration, tsConditionalType, tsConstructSignatureDeclaration, tsConstructorType, tsDeclareFunction, tsDeclareMethod, tsEnumDeclaration, tsEnumMember, tsExportAssignment, tsExpressionWithTypeArguments, tsExternalModuleReference, tsFunctionType, tsImportEqualsDeclaration, tsImportType, tsIndexSignature, tsIndexedAccessType, tsInferType, tsInterfaceBody, tsInterfaceDeclaration, tsIntersectionType, tsIntrinsicKeyword, tsLiteralType, tsMappedType, tsMethodSignature, tsModuleBlock, tsModuleDeclaration, tsNamedTupleMember, tsNamespaceExportDeclaration, tsNeverKeyword, tsNonNullExpression, tsNullKeyword, tsNumberKeyword, tsObjectKeyword, tsOptionalType, tsParameterProperty, tsParenthesizedType, tsPropertySignature, tsQualifiedName, tsRestType, tsStringKeyword, tsSymbolKeyword, tsThisType, tsTupleType, tsTypeAliasDeclaration, tsTypeAnnotation, tsTypeAssertion, tsTypeLiteral, tsTypeOperator, tsTypeParameter, tsTypeParameterDeclaration, tsTypeParameterInstantiation, tsTypePredicate, tsTypeQuery, tsTypeReference, tsUndefinedKeyword, tsUnionType, tsUnknownKeyword, tsVoidKeyword, tupleExpression, tupleTypeAnnotation, typeAlias, typeAnnotation, typeCastExpression, typeParameter, typeParameterDeclaration, typeParameterInstantiation, typeofTypeAnnotation, unaryExpression, unionTypeAnnotation, updateExpression, v8IntrinsicIdentifier, validate, _default$2 as valueToNode, variableDeclaration, variableDeclarator, variance, voidTypeAnnotation, whileStatement, withStatement, yieldExpression };
