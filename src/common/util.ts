/**
 * Split a string up to the delimiter. If the delimiter doesn't exist the first
 * item will have all the text and the second item will be an empty string.
 */
export const split = (str: string, delimiter: string): [string, string] => {
	const index = str.indexOf(delimiter);
	return index !== -1
		? [str.substring(0, index).trim(), str.substring(index + 1)]
		: [str, ""];
};
