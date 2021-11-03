import type * as ts from 'typescript';
import type { Service } from '../index';
/**
 * Third-party transpilers are implemented as a CommonJS module with a
 * named export "create"
 */
export interface TranspilerModule {
    create: TranspilerFactory;
}
/**
 * Called by ts-node to create a custom transpiler.
 */
export declare type TranspilerFactory = (options: CreateTranspilerOptions) => Transpiler;
export interface CreateTranspilerOptions {
    service: Pick<Service, 'config' | 'options'>;
}
export interface Transpiler {
    transpile(input: string, options: TranspileOptions): TranspileOutput;
}
export interface TranspileOptions {
    fileName: string;
}
export interface TranspileOutput {
    outputText: string;
    diagnostics?: ts.Diagnostic[];
    sourceMapText?: string;
}
