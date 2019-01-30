import * as vscodeTextmate from "../../../../lib/vscode/node_modules/vscode-textmate";

const target = vscodeTextmate as typeof vscodeTextmate;

target.Registry = class Registry extends vscodeTextmate.Registry {
	public constructor(opts: vscodeTextmate.RegistryOptions) {
		super({
			...opts,
			getOnigLib: (): Promise<vscodeTextmate.IOnigLib> => {
				return new Promise<vscodeTextmate.IOnigLib>((res, rej) => {
					const onigasm = require("onigasm");
					const wasmUrl = require("!!file-loader!onigasm/lib/onigasm.wasm");

					return fetch(wasmUrl).then(resp => resp.arrayBuffer()).then(buffer => {
						return onigasm.loadWASM(buffer);
					}).then(() => {
						res({
							createOnigScanner: function (patterns) { return new onigasm.OnigScanner(patterns); },
							createOnigString: function (s) { return new onigasm.OnigString(s); },
						});
					}).catch(reason => rej(reason));
				});
			},
		});
	}
};

enum StandardTokenType {
	Other = 0,
	Comment = 1,
	String = 2,
	RegEx = 4,
}

// tslint:disable-next-line no-any to override const
(target as any).StandardTokenType = StandardTokenType;
