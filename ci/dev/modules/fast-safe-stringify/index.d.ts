declare function stringify(value: any, replacer?: (key: string, value: any) => any, space?: string | number): string;

declare namespace stringify {
  export function stable(value: any, replacer?: (key: string, value: any) => any, space?: string | number): string;
  export function stableStringify(value: any, replacer?: (key: string, value: any) => any, space?: string | number): string;
}

export default stringify;
