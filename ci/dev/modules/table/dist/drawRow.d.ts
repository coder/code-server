import type { DrawVerticalLine } from './types/api';
import type { BodyBorderConfig, Row } from './types/internal';
export declare const drawRow: (row: Row, config: {
    border: BodyBorderConfig;
    drawVerticalLine: DrawVerticalLine;
}) => string;
