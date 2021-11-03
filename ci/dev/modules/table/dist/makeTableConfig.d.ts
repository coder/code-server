import type { TableUserConfig } from './types/api';
import type { Row, TableConfig } from './types/internal';
/**
 * Makes a new configuration object out of the userConfig object
 * using default values for the missing configuration properties.
 */
export declare const makeTableConfig: (rows: Row[], userConfig?: TableUserConfig) => TableConfig;
