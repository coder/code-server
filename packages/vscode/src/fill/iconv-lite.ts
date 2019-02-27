import * as iconv from "../../node_modules/iconv-lite";
import { Transform, TransformCallback } from "stream";

class IconvLiteDecoderStream extends Transform {
	// tslint:disable-next-line no-any
	private conv: any;
	private encoding: string;

	public constructor(options: { encoding: string }) {
		super(options);
		// tslint:disable-next-line no-any
		this.conv = (iconv as any).getDecoder(options.encoding, undefined);
		this.encoding = options.encoding;
	}

	// tslint:disable-next-line no-any
	public _transform(chunk: any, _encoding: string, done: TransformCallback): void {
		if (!Buffer.isBuffer(chunk)) {
			return done(new Error("Iconv decoding stream needs buffers as its input."));
		}
		try {
			const res = this.conv.write(chunk);
			if (res && res.length) {
				this.push(res, this.encoding);
			}
			done();
		} catch (error) {
			done(error);
		}
	}

	public _flush(done: TransformCallback): void {
		try {
			const res = this.conv.end();
			if (res && res.length) {
				this.push(res, this.encoding);
			}
			done();
		} catch (error) {
			done(error);
		}
	}

	// tslint:disable-next-line no-any
	public collect(cb: (error: Error | null, response?: any) => void): this {
		let res = "";
		this.on("error", cb);
		this.on("data", (chunk) => res += chunk);
		this.on("end", () => {
			cb(null, res);
		});

		return this;
	}
}

const decodeStream = (encoding: string): NodeJS.ReadWriteStream => {
	return new IconvLiteDecoderStream({ encoding });
};

const target = iconv as typeof iconv;
target.decodeStream = decodeStream;

export = target;
