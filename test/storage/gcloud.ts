import * as Storage from "@google-cloud/storage";
import { File, Bucket, IMetadata } from "./bucket";

const ScreenshotBucketName = "coder-dev-1-ci-screenshots";

/**
 * GCP Storage Bucket Wrapper.
 */
export class GoogleCloudBucket extends Bucket {
	private readonly bucket: Storage.Bucket;

	public constructor() {
		super();
		const storage = new Storage.Storage({
			projectId: "coder-dev-1",
		});
		this.bucket = storage.bucket(ScreenshotBucketName);
	}

	/**
	 * Read object in bucket to a Buffer.
	 */
	public read(path: string): Promise<Buffer> {
		return new Promise<Buffer>((resolve, reject): void => {
			const stream = this.bucket.file(path).createReadStream();
			const chunks: Uint8Array[] = [];

			stream.once("error", (err) => reject(err));

			stream.on("data", (data: Uint8Array) => {
				chunks.push(data);
			});

			stream.on("end", () => {
				resolve(Buffer.concat(chunks));
			});
		});
	}

	/**
	 * Move object in bucket.
	 */
	public move(oldPath: string, newPath: string): Promise<void> {
		return new Promise((res, rej): void => this.bucket.file(oldPath).move(newPath, {}, (err) => err ? rej(err) : res()));
	}

	/**
	 * Make object publicly accessible via URL.
	 */
	public makePublic(path: string): Promise<void> {
		return new Promise((res, rej): void => this.bucket.file(path).makePublic((err) => err ? rej(err) : res()));
	}

	/**
	 * Update bucket object metadata.
	 */
	public update(path: string, metadata: IMetadata): Promise<void> {
		return new Promise(async (res, rej): Promise<void> => {
			await this.bucket.file(path).setMetadata(metadata, (err: Error) => err ? rej(err) : res());
		});
	}

	public async write(path: string, data: Buffer, makePublic?: false, metadata?: IMetadata): Promise<void>;
	public async write(path: string, data: Buffer, makePublic?: true, metadata?: IMetadata): Promise<string>;
	/**
	 * Write to bucket.
	 */
	public async write(path: string, data: Buffer, makePublic: true | false = false, metadata?: IMetadata): Promise<void | string> {
		return new Promise<void | string>((resolve, reject): void => {
			const file = this.bucket.file(path);
			const stream = file.createWriteStream();

			stream.on("error", (err) => {
				reject(err);
			});

			stream.on("finish", async () => {
				if (makePublic) {
					try {
						await this.makePublic(path);
					} catch (ex) {
						reject(ex);

						return;
					}
				}
				if (metadata) {
					try {
						await this.update(path, metadata);
					} catch (ex) {
						reject(ex);

						return;
					}
				}
				resolve(makePublic ? `https://storage.googleapis.com/${ScreenshotBucketName}${path}` : undefined);
			});

			stream.end(data);
		});
	}

	/**
	 * List files in bucket.
	 */
	public list(prefix?: string): Promise<File[]> {
		return new Promise<File[]>((resolve, reject): void => {
			this.bucket.getFiles({
				prefix,
			}).then((results) => {
				resolve(results[0].map((r) => new File(
					r.name,
					new Date(r.metadata.timeCreated),
					new Date(r.metadata.updated),
					parseInt(r.metadata.size, 10),
					{},
				)));
			}).catch((e) => {
				reject(e);
			});
		});
	}

}
