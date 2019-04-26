/**
 * Storage Bucket Object.
 */
export class File {
	public constructor(
		public readonly name: string,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
		public readonly size: number,
		public readonly metadata: object,
	) { }

	public get isFolder(): boolean {
		return this.name.endsWith("/");
	}
}

export interface IMetadata {
	readonly contentType?: string;
	readonly contentEncoding?: string;
	readonly cacheControl?: string;
}

/**
 * Storage Bucket I/O.
 */
export abstract class Bucket {
	public abstract read(path: string): Promise<Buffer>;
	public abstract list(prefix?: string): Promise<File[]>;
	public abstract write(path: string, value: Buffer, makePublic?: true, metadata?: IMetadata): Promise<string>;
	public abstract write(path: string, value: Buffer, makePublic?: false, metadata?: IMetadata): Promise<void>;
}
