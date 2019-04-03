import * as https from "https";

export const getRecentRelease = (): Promise<string> => {
	return new Promise<string>((resolve, reject):void  => {
		https.get({
			host: "api.github.com",
			path: "/repos/codercom/code-server/releases/latest",
			method: "GET",
			agent: false,
			headers: {
				"User-Agent": "code-server",
			},
		}, (res) => {
			if (res.statusCode !== 200) {
				reject(Error("Failed to acquire release information"));
			}
			let body = "";
			res.on("data", (chunk) => {
				body += chunk;
			});

			res.on("end", () => {
				try {
					const release = JSON.parse(body);
					resolve(release.name);
				} catch (err) {
					reject(err);
				}
			});
		});
	});
};
