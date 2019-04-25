/**
 * Used by node
 */
import * as https from "https";
import * as os from "os";

export const defaultClient = "filler";

export class TelemetryClient {
	public channel = {
		setUseDiskRetryCaching: (): void => undefined,
	};

	public constructor() {
		//
	}

	public trackEvent(options: {
		name: string;
		properties: object;
		measurements: object;
	}): void {
		if (!options.properties) {
			options.properties = {};
		}
		if (!options.measurements) {
			options.measurements = {};
		}

		try {
			const cpus = os.cpus();
			// tslint:disable-next-line:no-any
			(options.measurements as any).cpu = {
				model: cpus[0].model,
				cores: cpus.length,
			};
		} catch (ex) {
			// Nothin
		}

		try {
			// tslint:disable-next-line:no-any
			(options.measurements as any).memory = {
				virtual_free: os.freemem(),
				virtual_used: os.totalmem(),
			};
		} catch (ex) {
			//
		}

		try {
			// tslint:disable:no-any
			(options.properties as any)["common.shell"] = os.userInfo().shell;
			(options.properties as any)["common.release"] = os.release();
			(options.properties as any)["common.arch"] = os.arch();
			// tslint:enable:no-any
		} catch (ex) {
			//
		}

		try {
			// tslint:disable-next-line:no-any
			(options.properties as any)["common.machineId"] = machineIdSync();
		} catch (ex) {
			//
		}

		try {
			const request = https.request({
				host: "v1.telemetry.coder.com",
				port: 443,
				path: "/track",
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});
			request.on("error", () => {
				// Do nothing, we don"t really care
			});
			request.write(JSON.stringify(options));
			request.end();
		} catch (ex) {
			// Suppress all errs
		}
	}

	public flush(options: {
		readonly callback: () => void;
	}): void {
		options.callback();
	}
}

// Taken from https://github.com/automation-stack/node-machine-id
import { exec, execSync } from "child_process";
import { createHash } from "crypto";

const isWindowsProcessMixedOrNativeArchitecture = (): "" | "mixed" | "native" => {
	// detect if the node binary is the same arch as the Windows OS.
	// or if this is 32 bit node on 64 bit windows.
	if (process.platform !== "win32") {
		return "";
	}
	if (process.arch === "ia32" && process.env.hasOwnProperty("PROCESSOR_ARCHITEW6432")) {
		return "mixed";
	}

	return "native";
};

let { platform } = process,
	win32RegBinPath = {
		native: "%windir%\\System32",
		mixed: "%windir%\\sysnative\\cmd.exe /c %windir%\\System32",
		"": "",
	},
	guid = {
		darwin: "ioreg -rd1 -c IOPlatformExpertDevice",
		win32: `${win32RegBinPath[isWindowsProcessMixedOrNativeArchitecture()]}\\REG ` +
			"QUERY HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography " +
			"/v MachineGuid",
		linux: "( cat /var/lib/dbus/machine-id /etc/machine-id 2> /dev/null || hostname ) | head -n 1 || :",
		freebsd: "kenv -q smbios.system.uuid || sysctl -n kern.hostuuid",
		// tslint:disable-next-line:no-any
	} as any;

const hash = (guid: string): string => {
	return createHash("sha256").update(guid).digest("hex");
};

const expose = (result: string): string => {
	switch (platform) {
		case "darwin":
			return result
				.split("IOPlatformUUID")[1]
				.split("\n")[0].replace(/\=|\s+|\"/ig, "")
				.toLowerCase();
		case "win32":
			return result
				.toString()
				.split("REG_SZ")[1]
				.replace(/\r+|\n+|\s+/ig, "")
				.toLowerCase();
		case "linux":
			return result
				.toString()
				.replace(/\r+|\n+|\s+/ig, "")
				.toLowerCase();
		case "freebsd":
			return result
				.toString()
				.replace(/\r+|\n+|\s+/ig, "")
				.toLowerCase();
		default:
			throw new Error(`Unsupported platform: ${process.platform}`);
	}
};

let cachedMachineId: string | undefined;

const machineIdSync = (): string => {
	if (cachedMachineId) {
		return cachedMachineId;
	}
	let id: string = expose(execSync(guid[platform]).toString());
	cachedMachineId = hash(id);

	return cachedMachineId;
};
