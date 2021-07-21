declare module "file-regex" {
  export function FindFiles(path: string, regex: string, depth: number): Array<string>
}
