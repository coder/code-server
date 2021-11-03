/**
 * Specificity arrays always have 4 numbers (integers) for quick comparison
 * comparing from left to right, the next number only has to be checked if
 * two numbers of the same index are equal.
 */
export type SpecificityArray = [number, number, number, number];

/**
 * A result of parsing a selector into an array of parts.
 * Calculating a specificity array is a matter of summing
 * over all the parts and adding the values to the right
 * bucket in a specificity array.
 * 
 * @interface Part
 */
export interface Part {
	selector: string;
	type: 'a' | 'b' | 'c';
	index: number;
	length: number;
}

/**
 * Returned by the calculate function. Represents the results
 * of parsing and calculating the specificity of a selector.
 * 
 * @interface Specificity
 */
export interface Specificity {
	selector: string;
	specificity: string;
	specificityArray: SpecificityArray;
	parts: Array<Part>;
}

/**
 * Calculates the specificity for the given selector string.
 * If the string contains a comma, each selector will be parsed
 * separately.
 * 
 * @returns A list of specificity objects one for each selector in the
 * selector string.
 */
export function calculate(selector: string): Array<Specificity>;

/**
 * Compares two selectors. If a string, the string cannot contain a comma.
 * 
 * @returns A value less than 0 if selector a is less specific than selector b.
 *   A value more than 0 if selector a is more specific than selector b.
 *   0 if the two selectors have the same specificity.
 */
export function compare(a: string | SpecificityArray, b: string | SpecificityArray): -1 | 0 | 1;
