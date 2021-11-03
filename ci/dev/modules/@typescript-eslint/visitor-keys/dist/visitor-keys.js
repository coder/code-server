"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitorKeys = void 0;
const eslintVisitorKeys = __importStar(require("eslint-visitor-keys"));
const additionalKeys = {
    // ES2020
    ImportExpression: ['source'],
    // Additional Properties.
    ArrayPattern: ['decorators', 'elements', 'typeAnnotation'],
    ArrowFunctionExpression: ['typeParameters', 'params', 'returnType', 'body'],
    AssignmentPattern: ['decorators', 'left', 'right', 'typeAnnotation'],
    CallExpression: ['callee', 'typeParameters', 'arguments'],
    ClassDeclaration: [
        'decorators',
        'id',
        'typeParameters',
        'superClass',
        'superTypeParameters',
        'implements',
        'body',
    ],
    ClassExpression: [
        'decorators',
        'id',
        'typeParameters',
        'superClass',
        'superTypeParameters',
        'implements',
        'body',
    ],
    FunctionDeclaration: ['id', 'typeParameters', 'params', 'returnType', 'body'],
    FunctionExpression: ['id', 'typeParameters', 'params', 'returnType', 'body'],
    Identifier: ['decorators', 'typeAnnotation'],
    MethodDefinition: ['decorators', 'key', 'value'],
    NewExpression: ['callee', 'typeParameters', 'arguments'],
    ObjectPattern: ['decorators', 'properties', 'typeAnnotation'],
    RestElement: ['decorators', 'argument', 'typeAnnotation'],
    TaggedTemplateExpression: ['tag', 'typeParameters', 'quasi'],
    // JSX
    JSXOpeningElement: ['name', 'typeParameters', 'attributes'],
    JSXClosingFragment: [],
    JSXOpeningFragment: [],
    JSXSpreadChild: ['expression'],
    // Additional Nodes.
    ClassProperty: ['decorators', 'key', 'typeAnnotation', 'value'],
    Decorator: ['expression'],
    // TS-prefixed nodes
    TSAbstractClassProperty: ['decorators', 'key', 'typeAnnotation', 'value'],
    TSAbstractKeyword: [],
    TSAbstractMethodDefinition: ['key', 'value'],
    TSAnyKeyword: [],
    TSArrayType: ['elementType'],
    TSAsExpression: ['expression', 'typeAnnotation'],
    TSAsyncKeyword: [],
    TSBigIntKeyword: [],
    TSBooleanKeyword: [],
    TSCallSignatureDeclaration: ['typeParameters', 'params', 'returnType'],
    TSClassImplements: ['expression', 'typeParameters'],
    TSConditionalType: ['checkType', 'extendsType', 'trueType', 'falseType'],
    TSConstructorType: ['typeParameters', 'params', 'returnType'],
    TSConstructSignatureDeclaration: ['typeParameters', 'params', 'returnType'],
    TSDeclareFunction: ['id', 'typeParameters', 'params', 'returnType', 'body'],
    TSDeclareKeyword: [],
    TSEmptyBodyFunctionExpression: [
        'id',
        'typeParameters',
        'params',
        'returnType',
    ],
    TSEnumDeclaration: ['id', 'members'],
    TSEnumMember: ['id', 'initializer'],
    TSExportAssignment: ['expression'],
    TSExportKeyword: [],
    TSExternalModuleReference: ['expression'],
    TSFunctionType: ['typeParameters', 'params', 'returnType'],
    TSImportEqualsDeclaration: ['id', 'moduleReference'],
    TSImportType: ['parameter', 'qualifier', 'typeParameters'],
    TSIndexedAccessType: ['indexType', 'objectType'],
    TSIndexSignature: ['parameters', 'typeAnnotation'],
    TSInferType: ['typeParameter'],
    TSInterfaceBody: ['body'],
    TSInterfaceDeclaration: ['id', 'typeParameters', 'extends', 'body'],
    TSInterfaceHeritage: ['expression', 'typeParameters'],
    TSIntersectionType: ['types'],
    TSIntrinsicKeyword: [],
    TSLiteralType: ['literal'],
    TSMappedType: ['nameType', 'typeParameter', 'typeAnnotation'],
    TSMethodSignature: ['typeParameters', 'key', 'params', 'returnType'],
    TSModuleBlock: ['body'],
    TSModuleDeclaration: ['id', 'body'],
    TSNamedTupleMember: ['elementType'],
    TSNamespaceExportDeclaration: ['id'],
    TSNeverKeyword: [],
    TSNonNullExpression: ['expression'],
    TSNullKeyword: [],
    TSNumberKeyword: [],
    TSObjectKeyword: [],
    TSOptionalType: ['typeAnnotation'],
    TSParameterProperty: ['decorators', 'parameter'],
    TSParenthesizedType: ['typeAnnotation'],
    TSPrivateKeyword: [],
    TSPropertySignature: ['typeAnnotation', 'key', 'initializer'],
    TSProtectedKeyword: [],
    TSPublicKeyword: [],
    TSQualifiedName: ['left', 'right'],
    TSReadonlyKeyword: [],
    TSRestType: ['typeAnnotation'],
    TSStaticKeyword: [],
    TSStringKeyword: [],
    TSSymbolKeyword: [],
    TSTemplateLiteralType: ['quasis', 'types'],
    TSThisType: [],
    TSTupleType: ['elementTypes'],
    TSTypeAliasDeclaration: ['id', 'typeParameters', 'typeAnnotation'],
    TSTypeAnnotation: ['typeAnnotation'],
    TSTypeAssertion: ['typeAnnotation', 'expression'],
    TSTypeLiteral: ['members'],
    TSTypeOperator: ['typeAnnotation'],
    TSTypeParameter: ['name', 'constraint', 'default'],
    TSTypeParameterDeclaration: ['params'],
    TSTypeParameterInstantiation: ['params'],
    TSTypePredicate: ['typeAnnotation', 'parameterName'],
    TSTypeQuery: ['exprName'],
    TSTypeReference: ['typeName', 'typeParameters'],
    TSUndefinedKeyword: [],
    TSUnionType: ['types'],
    TSUnknownKeyword: [],
    TSVoidKeyword: [],
};
const visitorKeys = eslintVisitorKeys.unionWith(additionalKeys);
exports.visitorKeys = visitorKeys;
//# sourceMappingURL=visitor-keys.js.map