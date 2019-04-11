import * as fs from "fs";
import * as util from "util";
import { argumentToProto, protoToArgument } from "../src/common/util";

describe("Convert", () => {
	it("should convert nothing", () => {
		expect(protoToArgument()).toBeUndefined();
	});

	it("should convert null", () => {
		expect(protoToArgument(argumentToProto(null))).toBeNull();
	});

	it("should convert undefined", () => {
		expect(protoToArgument(argumentToProto(undefined))).toBeUndefined();
	});

	it("should convert string", () => {
		expect(protoToArgument(argumentToProto("test"))).toBe("test");
	});

	it("should convert number", () => {
		expect(protoToArgument(argumentToProto(10))).toBe(10);
	});

	it("should convert boolean", () => {
		expect(protoToArgument(argumentToProto(true))).toBe(true);
		expect(protoToArgument(argumentToProto(false))).toBe(false);
	});

	it("should convert error", () => {
		const error = new Error("message");
		const convertedError = protoToArgument(argumentToProto(error));

		expect(convertedError instanceof Error).toBeTruthy();
		expect(convertedError.message).toBe("message");
	});

	it("should convert buffer", async () => {
		const buffer = await util.promisify(fs.readFile)(__filename);
		expect(buffer instanceof Buffer).toBeTruthy();

		const convertedBuffer = protoToArgument(argumentToProto(buffer));
		expect(convertedBuffer instanceof Buffer).toBeTruthy();
		expect(convertedBuffer.toString()).toBe(buffer.toString());
	});

	it("should convert proxy", () => {
		let i = 0;
		const proto = argumentToProto(
			{ onEvent: (): void => undefined },
			undefined,
			() => i++,
		);

		const proxy = protoToArgument(proto, undefined, (id) => {
			return {
				id: `created: ${id}`,
				dispose: (): Promise<void> => Promise.resolve(),
				onDone: (): Promise<void> => Promise.resolve(),
				onEvent: (): Promise<void> => Promise.resolve(),
			};
		});

		expect(proxy.id).toBe("created: 0");
	});

	it("should convert function", () => {
		const fn = jest.fn();
		// tslint:disable-next-line no-any
		const map = new Map<number, (...args: any[]) => void>();
		let i = 0;
		const proto = argumentToProto(
			fn,
			(f) => {
				map.set(i++, f);

				return i - 1;
			},
		);

		const remoteFn = protoToArgument(proto, (id, args) => {
			map.get(id)!(...args);
		});

		remoteFn("a", "b", 1);

		expect(fn).toHaveBeenCalledWith("a", "b", 1);
	});

	it("should convert array", () => {
		const array = ["a", "b", 1, [1, "a"], null, undefined];
		expect(protoToArgument(argumentToProto(array))).toEqual(array);
	});

	it("should convert object", () => {
		const obj = { a: "test" };
		// const obj = { "a": 1, "b": [1, "a"], test: null, test2: undefined };
		expect(protoToArgument(argumentToProto(obj))).toEqual(obj);
	});
});
