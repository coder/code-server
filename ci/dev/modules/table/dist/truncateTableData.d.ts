import type { BaseConfig, Row } from './types/internal';
export declare const truncateString: (input: string, length: number) => string;
/**
 * @todo Make it work with ASCII content.
 */
export declare const truncateTableData: (rows: Row[], config: BaseConfig) => Row[];
