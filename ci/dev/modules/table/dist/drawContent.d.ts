declare type SeparatorConfig = {
    drawSeparator: (index: number, size: number) => boolean;
    separatorGetter: (index: number, size: number) => string;
};
/**
 * Shared function to draw horizontal borders, rows or the entire table
 */
export declare const drawContent: (contents: string[], separatorConfig: SeparatorConfig) => string;
export {};
