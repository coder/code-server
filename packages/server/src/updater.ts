import * as https from "https";

const compareVersions = (a: string, b: string): number | undefined => {
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
	return new Promise<string>((resolve, rej) => {
		const options = {
			host: "api.github.com",
			path: "/repos/codercom/code-server/releases",
			method: "GET",
			agent: false,
			headers: {
				"User-Agent": "test",
			},
		};

		https.get(options, function (res) {
			if (res.statusCode !== 200) {
				throw new Error("Failed to acquire release information");

				return undefined;
			}
			let body = "";
			res.on("data", (chunk) => {
				body += chunk;
			});

			res.on("end", () => {
				let mostRecentRelease = "";
				let releases = JSON.parse(body);
				releases.forEach((release: { name: string; }) => {
					if (compareVersions(release.name, mostRecentRelease)! >= 1) {
						mostRecentRelease = release.name;
					}
				});
				resolve(mostRecentRelease);
			});
		});
	});
};
