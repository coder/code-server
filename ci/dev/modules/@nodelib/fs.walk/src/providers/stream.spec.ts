import * as assert from 'assert';
import { Readable } from 'stream';

import * as sinon from 'sinon';

import AsyncReader from '../readers/async';
import Settings from '../settings';
import * as tests from '../tests';
import StreamProvider from './stream';

class TestProvider extends StreamProvider {
	protected readonly _reader: AsyncReader = new tests.TestAsyncReader() as unknown as AsyncReader;

	constructor(_root: string, _settings: Settings = new Settings()) {
		super(_root, _settings);

		this._stream.emit = sinon.stub();
		this._stream.push = sinon.stub();
	}

	public get reader(): tests.TestAsyncReader {
		return this._reader as unknown as tests.TestAsyncReader;
	}

	public get stream(): sinon.SinonStubbedInstance<Readable> {
		return this._stream as unknown as sinon.SinonStubbedInstance<Readable>;
	}
}

describe('Providers → Stream', () => {
	describe('.read', () => {
		it('should return stream', () => {
			const provider = new TestProvider('directory');

			const stream = provider.read();

			assert.ok(stream instanceof Readable);
		});

		it('should call reader function with correct set of arguments', () => {
			const provider = new TestProvider('directory');

			provider.read();

			assert.ok(provider.reader.read.called);
		});

		it('should re-emit the "error" event from reader', () => {
			const provider = new TestProvider('directory');

			provider.reader.onError.yields(tests.EPERM_ERRNO);

			provider.read();

			assert.deepStrictEqual(provider.stream.emit.args, [['error', tests.EPERM_ERRNO]]);
		});

		it('should call the "push" method with entry value for the "entry" event from reader', () => {
			const provider = new TestProvider('directory');
			const fakeEntry = tests.buildFakeFileEntry();

			provider.reader.onEntry.yields(fakeEntry);

			provider.read();

			assert.deepStrictEqual(provider.stream.push.args, [[fakeEntry]]);
		});

		it('should call the "push" method with "null" value for the "end" event from reader', () => {
			const provider = new TestProvider('directory');

			provider.reader.onEnd.yields();

			provider.read();

			assert.deepStrictEqual(provider.stream.push.args, [[null]]);
		});

		it('should do not destroy reader when it is already destroyed', () => {
			const provider = new TestProvider('directory');

			const stream = provider.read();

			stream.destroy();

			assert.ok(stream.destroyed);
			assert.doesNotThrow(() => stream.destroy());
		});
	});
});
