import * as https from "https";

export const compareVersions = (a: string, b: string): number | undefined => {
	if (a === b) {
		return 0;
	}
	const regEx = /[^0-9.]/g;
	const aSplit = a.replace(regEx, "").split(".");
	const bSplit = b.replace(regEx, "").split(".");
	const dist = Math.max(aSplit.length, bSplit.length);
	for (let i = 0; i < dist; i++) {
		const aVal = parseInt(aSplit[i], 10);
		const bVal = parseInt(bSplit[i], 10);
		if (aVal > bVal || isNaN(bVal)) {
			return 1;
		}
		if (aVal < bVal || isNaN(aVal)) {
			return -1;
		}
	}
};

export const getRecentRelease = (): Promise<any> => {
	return new Promise<string>((resolve):void  => {
		const options = {
			host: "api.github.com",
			path: "/repos/codercom/code-server/releases/latest",
			method: "GET",
			agent: false,
			headers: {
				"User-Agent": "code-server",
			},
		};

		https.get(options, (res) => {
			if (res.statusCode !== 200) {
				throw new Error("Failed to acquire release information");
			}
			let body = "";
			res.on("data", (chunk) => {
				body += chunk;
			});

			res.on("end", () => {
				let release = JSON.parse(body);
				resolve(release.name);
			});
		});
	});
};
