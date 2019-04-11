import { Emitter } from "../src/events";

describe("Event", () => {
	const emitter = new Emitter<number>();

	it("should listen to global event", () => {
		const fn = jest.fn();
		const d = emitter.event(fn);
		emitter.emit(10);
		expect(fn).toHaveBeenCalledWith(10);
		d.dispose();
	});

	it("should listen to id event", () => {
		const fn = jest.fn();
		const d = emitter.event(0, fn);
		emitter.emit(0, 5);
		expect(fn).toHaveBeenCalledWith(5);
		d.dispose();
	});

	it("should listen to string id event", () => {
		const fn = jest.fn();
		const d = emitter.event("string", fn);
		emitter.emit("string", 55);
		expect(fn).toHaveBeenCalledWith(55);
		d.dispose();
	});

	it("should not listen wrong id event", () => {
		const fn = jest.fn();
		const d = emitter.event(1, fn);
		emitter.emit(0, 5);
		emitter.emit(1, 6);
		expect(fn).toHaveBeenCalledWith(6);
		expect(fn).toHaveBeenCalledTimes(1);
		d.dispose();
	});

	it("should listen to id event globally", () => {
		const fn = jest.fn();
		const d = emitter.event(fn);
		emitter.emit(1, 11);
		expect(fn).toHaveBeenCalledWith(11);
		d.dispose();
	});

	it("should listen to global event", () => {
		const fn = jest.fn();
		const d = emitter.event(3, fn);
		emitter.emit(14);
		expect(fn).toHaveBeenCalledWith(14);
		d.dispose();
	});

	it("should listen to id event multiple times", () => {
		const fn = jest.fn();
		const disposers = [
			emitter.event(934, fn),
			emitter.event(934, fn),
			emitter.event(934, fn),
			emitter.event(934, fn),
		];
		emitter.emit(934, 324);
		expect(fn).toHaveBeenCalledTimes(4);
		expect(fn).toHaveBeenCalledWith(324);
		disposers.forEach((d) => d.dispose());
	});

	it("should dispose individually", () => {
		const fn = jest.fn();
		const d = emitter.event(fn);

		const fn2 = jest.fn();
		const d2 = emitter.event(1, fn2);

		d.dispose();

		emitter.emit(12);
		emitter.emit(1, 12);

		expect(fn).not.toBeCalled();
		expect(fn2).toBeCalledTimes(2);

		d2.dispose();

		emitter.emit(12);
		emitter.emit(1, 12);

		expect(fn).not.toBeCalled();
		expect(fn2).toBeCalledTimes(2);
	});

	it("should dispose by id", () => {
		const fn = jest.fn();
		emitter.event(fn);

		const fn2 = jest.fn();
		emitter.event(1, fn2);

		emitter.dispose(1);

		emitter.emit(12);
		emitter.emit(1, 12);

		expect(fn).toBeCalledTimes(2);
		expect(fn2).not.toBeCalled();
	});

	it("should dispose all", () => {
		const fn = jest.fn();
		emitter.event(fn);
		emitter.event(1, fn);

		emitter.dispose();

		emitter.emit(12);
		emitter.emit(1, 12);

		expect(fn).not.toBeCalled();
	});
});
