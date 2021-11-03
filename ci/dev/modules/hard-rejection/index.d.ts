declare const hardRejection: {
	/**
	Make unhandled promise rejections fail hard right away instead of the default [silent fail](https://gist.github.com/benjamingr/0237932cee84712951a2).

	@param log - Custom logging function to print the rejected promise. Receives the error stack. Default: `console.error`.
	*/
	(log?: (stack?: string) => void): void;

	// TODO: Remove this for the next major release, refactor the whole definition to:
	// declare function hardRejection(log?: (stack?: string) => void): void;
	// export = hardRejection;
	default: typeof hardRejection;
};

export = hardRejection;
