/**
 * Return true if the options specify to use a Buffer instead of string.
 */
export const useBuffer = (options: { encoding?: string | null } | string | undefined | null | Function): boolean => {
	return options === "buffer"
		|| (!!options && typeof options !== "string" && typeof options !== "function"
				&& (options.encoding === "buffer" || options.encoding === null));
};
