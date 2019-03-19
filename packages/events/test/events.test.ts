import { Emitter } from "../src/events";

describe("Event", () => {
	const emitter = new Emitter<number>();

	it("should listen to global event", (done) => {
		const d = emitter.event((value) => {
			expect(value).toBe(10);
			d.dispose();
			done();
		});

		emitter.emit(10);
	});

	it("should listen to id event", (done) => {
		const d = emitter.event(0, (value) => {
			expect(value).toBe(5);
			d.dispose();
			done();
		});

		emitter.emit(0, 5);
	});

	it("should listen to string id event", (done) => {
		const d = emitter.event("string", (value) => {
			expect(value).toBe(55);
			d.dispose();
			done();
		});

		emitter.emit("string", 55);
	});

	it("should not listen wrong id event", (done) => {
		const d = emitter.event(1, (value) => {
			expect(value).toBe(6);
			d.dispose();
			done();
		});

		emitter.emit(0, 5);
		emitter.emit(1, 6);
	});

	it("should listen to id event globally", (done) => {
		const d = emitter.event((value) => {
			expect(value).toBe(11);
			d.dispose();
			done();
		});

		emitter.emit(1, 11);
	});

	it("should listen to global event", (done) => {
		const d = emitter.event(3, (value) => {
			expect(value).toBe(14);
			d.dispose();
			done();
		});

		emitter.emit(14);
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
