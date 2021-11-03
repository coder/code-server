declare function diff(
    text1: string,
    text2: string,
    cursorPos?: number | diff.CursorInfo
): diff.Diff[];

declare namespace diff {
    type Diff = [-1 | 0 | 1, string];

    const DELETE: -1;
    const INSERT: 1;
    const EQUAL: 0;

    interface CursorInfo {
        oldRange: { index: number; length: number };
        newRange: { index: number; length: number };
    }
}

export = diff;
