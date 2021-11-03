export function joinPathSegments(a: string, b: string, separator: string): string {
	/**
	 * The correct handling of cases when the first segment is a root (`/`, `C:/`) or UNC path (`//?/C:/`).
	 */
	if (a.endsWith(separator)) {
		return a + b;
	}

	return a + separator + b;
}
