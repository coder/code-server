declare module 'fs/promises' {
    import {
        Stats,
        BigIntStats,
        StatOptions,
        WriteVResult,
        ReadVResult,
        PathLike,
        RmDirOptions,
        RmOptions,
        MakeDirectoryOptions,
        Dirent,
        OpenDirOptions,
        Dir,
        BaseEncodingOptions,
        BufferEncodingOption,
        OpenMode,
        Mode,
    } from 'fs';

    interface FileHandle {
        /**
         * Gets the file descriptor for this file handle.
         */
        readonly fd: number;

        /**
         * Asynchronously append data to a file, creating the file if it does not exist. The underlying file will _not_ be closed automatically.
         * The `FileHandle` must have been opened for appending.
         * @param data The data to write. If something other than a `Buffer` or `Uint8Array` is provided, the value is coerced to a string.
         * @param options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
         * If `encoding` is not supplied, the default of `'utf8'` is used.
         * If `mode` is not supplied, the default of `0o666` is used.
         * If `mode` is a string, it is parsed as an octal integer.
         * If `flag` is not supplied, the default of `'a'` is used.
         */
        appendFile(data: string | Uint8Array, options?: BaseEncodingOptions & { mode?: Mode | undefined, flag?: OpenMode | undefined } | BufferEncoding | null): Promise<void>;

        /**
         * Asynchronous fchown(2) - Change ownership of a file.
         */
        chown(uid: number, gid: number): Promise<void>;

        /**
         * Asynchronous fchmod(2) - Change permissions of a file.
         * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
         */
        chmod(mode: Mode): Promise<void>;

        /**
         * Asynchronous fdatasync(2) - synchronize a file's in-core state with storage device.
         */
        datasync(): Promise<void>;

        /**
         * Asynchronous fsync(2) - synchronize a file's in-core state with the underlying storage device.
         */
        sync(): Promise<void>;

        /**
         * Asynchronously reads data from the file.
         * The `FileHandle` must have been opened for reading.
         * @param buffer The buffer that the data will be written to.
         * @param offset The offset in the buffer at which to start writing.
         * @param length The number of bytes to read.
         * @param position The offset from the beginning of the file from which data should be read. If `null`, data will be read from the current position.
         */
        read<TBuffer extends Uint8Array>(buffer: TBuffer, offset?: number | null, length?: number | null, position?: number | null): Promise<{ bytesRead: number, buffer: TBuffer }>;

        /**
         * Asynchronously reads the entire contents of a file. The underlying file will _not_ be closed automatically.
         * The `FileHandle` must have been opened for reading.
         * @param options An object that may contain an optional flag.
         * If a flag is not provided, it defaults to `'r'`.
         */
        readFile(options?: { encoding?: null | undefined, flag?: OpenMode | undefined } | null): Promise<Buffer>;

        /**
         * Asynchronously reads the entire contents of a file. The underlying file will _not_ be closed automatically.
         * The `FileHandle` must have been opened for reading.
         * @param options An object that may contain an optional flag.
         * If a flag is not provided, it defaults to `'r'`.
         */
        readFile(options: { encoding: BufferEncoding, flag?: OpenMode | undefined } | BufferEncoding): Promise<string>;

        /**
         * Asynchronously reads the entire contents of a file. The underlying file will _not_ be closed automatically.
         * The `FileHandle` must have been opened for reading.
         * @param options An object that may contain an optional flag.
         * If a flag is not provided, it defaults to `'r'`.
         */
        readFile(options?: BaseEncodingOptions & { flag?: OpenMode | undefined } | BufferEncoding | null): Promise<string | Buffer>;

        /**
         * Asynchronous fstat(2) - Get file status.
         */
        stat(opts?: StatOptions & { bigint?: false | undefined }): Promise<Stats>;
        stat(opts: StatOptions & { bigint: true }): Promise<BigIntStats>;
        stat(opts?: StatOptions): Promise<Stats | BigIntStats>;

        /**
         * Asynchronous ftruncate(2) - Truncate a file to a specified length.
         * @param len If not specified, defaults to `0`.
         */
        truncate(len?: number): Promise<void>;

        /**
         * Asynchronously change file timestamps of the file.
         * @param atime The last access time. If a string is provided, it will be coerced to number.
         * @param mtime The last modified time. If a string is provided, it will be coerced to number.
         */
        utimes(atime: string | number | Date, mtime: string | number | Date): Promise<void>;

        /**
         * Asynchronously writes `buffer` to the file.
         * The `FileHandle` must have been opened for writing.
         * @param buffer The buffer that the data will be written to.
         * @param offset The part of the buffer to be written. If not supplied, defaults to `0`.
         * @param length The number of bytes to write. If not supplied, defaults to `buffer.length - offset`.
         * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
         */
        write<TBuffer extends Uint8Array>(buffer: TBuffer, offset?: number | null, length?: number | null, position?: number | null): Promise<{ bytesWritten: number, buffer: TBuffer }>;

        /**
         * Asynchronously writes `string` to the file.
         * The `FileHandle` must have been opened for writing.
         * It is unsafe to call `write()` multiple times on the same file without waiting for the `Promise`
         * to be resolved (or rejected). For this scenario, `fs.createWriteStream` is strongly recommended.
         * @param string A string to write.
         * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
         * @param encoding The expected string encoding.
         */
        write(data: string | Uint8Array, position?: number | null, encoding?: BufferEncoding | null): Promise<{ bytesWritten: number, buffer: string }>;

        /**
         * Asynchronously writes data to a file, replacing the file if it already exists. The underlying file will _not_ be closed automatically.
         * The `FileHandle` must have been opened for writing.
         * It is unsafe to call `writeFile()` multiple times on the same file without waiting for the `Promise` to be resolved (or rejected).
         * @param data The data to write. If something other than a `Buffer` or `Uint8Array` is provided, the value is coerced to a string.
         * @param options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
         * If `encoding` is not supplied, the default of `'utf8'` is used.
         * If `mode` is not supplied, the default of `0o666` is used.
         * If `mode` is a string, it is parsed as an octal integer.
         * If `flag` is not supplied, the default of `'w'` is used.
         */
        writeFile(data: string | Uint8Array, options?: BaseEncodingOptions & { mode?: Mode | undefined, flag?: OpenMode | undefined } | BufferEncoding | null): Promise<void>;

        /**
         * See `fs.writev` promisified version.
         */
        writev(buffers: ReadonlyArray<NodeJS.ArrayBufferView>, position?: number): Promise<WriteVResult>;

        /**
         * See `fs.readv` promisified version.
         */
        readv(buffers: ReadonlyArray<NodeJS.ArrayBufferView>, position?: number): Promise<ReadVResult>;

        /**
         * Asynchronous close(2) - close a `FileHandle`.
         */
        close(): Promise<void>;
    }

    /**
     * Asynchronously tests a user's permissions for the file specified by path.
     * @param path A path to a file or directory. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     */
    function access(path: PathLike, mode?: number): Promise<void>;

    /**
     * Asynchronously copies `src` to `dest`. By default, `dest` is overwritten if it already exists.
     * Node.js makes no guarantees about the atomicity of the copy operation.
     * If an error occurs after the destination file has been opened for writing, Node.js will attempt
     * to remove the destination.
     * @param src A path to the source file.
     * @param dest A path to the destination file.
     * @param flags An optional integer that specifies the behavior of the copy operation. The only
     * supported flag is `fs.constants.COPYFILE_EXCL`, which causes the copy operation to fail if
     * `dest` already exists.
     */
    function copyFile(src: PathLike, dest: PathLike, flags?: number): Promise<void>;

    /**
     * Asynchronous open(2) - open and possibly create a file.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer. If not
     * supplied, defaults to `0o666`.
     */
    function open(path: PathLike, flags: string | number, mode?: Mode): Promise<FileHandle>;

    /**
     * Asynchronously reads data from the file referenced by the supplied `FileHandle`.
     * @param handle A `FileHandle`.
     * @param buffer The buffer that the data will be written to.
     * @param offset The offset in the buffer at which to start writing.
     * @param length The number of bytes to read.
     * @param position The offset from the beginning of the file from which data should be read. If
     * `null`, data will be read from the current position.
     */
    function read<TBuffer extends Uint8Array>(
        handle: FileHandle,
        buffer: TBuffer,
        offset?: number | null,
        length?: number | null,
        position?: number | null,
    ): Promise<{ bytesRead: number, buffer: TBuffer }>;

    /**
     * Asynchronously writes `buffer` to the file referenced by the supplied `FileHandle`.
     * It is unsafe to call `fsPromises.write()` multiple times on the same file without waiting for the `Promise`
     * to be resolved (or rejected). For this scenario, `fs.createWriteStream` is strongly recommended.
     * @param handle A `FileHandle`.
     * @param buffer The buffer that the data will be written to.
     * @param offset The part of the buffer to be written. If not supplied, defaults to `0`.
     * @param length The number of bytes to write. If not supplied, defaults to `buffer.length - offset`.
     * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
     */
    function write<TBuffer extends Uint8Array>(
        handle: FileHandle,
        buffer: TBuffer,
        offset?: number | null,
        length?: number | null, position?: number | null): Promise<{ bytesWritten: number, buffer: TBuffer }>;

    /**
     * Asynchronously writes `string` to the file referenced by the supplied `FileHandle`.
     * It is unsafe to call `fsPromises.write()` multiple times on the same file without waiting for the `Promise`
     * to be resolved (or rejected). For this scenario, `fs.createWriteStream` is strongly recommended.
     * @param handle A `FileHandle`.
     * @param string A string to write.
     * @param position The offset from the beginning of the file where this data should be written. If not supplied, defaults to the current position.
     * @param encoding The expected string encoding.
     */
    function write(handle: FileHandle, string: string, position?: number | null, encoding?: BufferEncoding | null): Promise<{ bytesWritten: number, buffer: string }>;

    /**
     * Asynchronous rename(2) - Change the name or location of a file or directory.
     * @param oldPath A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     * @param newPath A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     */
    function rename(oldPath: PathLike, newPath: PathLike): Promise<void>;

    /**
     * Asynchronous truncate(2) - Truncate a file to a specified length.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param len If not specified, defaults to `0`.
     */
    function truncate(path: PathLike, len?: number): Promise<void>;

    /**
     * Asynchronous ftruncate(2) - Truncate a file to a specified length.
     * @param handle A `FileHandle`.
     * @param len If not specified, defaults to `0`.
     */
    function ftruncate(handle: FileHandle, len?: number): Promise<void>;

    /**
     * Asynchronous rmdir(2) - delete a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    function rmdir(path: PathLike, options?: RmDirOptions): Promise<void>;

    /**
     * Asynchronously removes files and directories (modeled on the standard POSIX `rm` utility).
     */
    function rm(path: PathLike, options?: RmOptions): Promise<void>;

    /**
     * Asynchronous fdatasync(2) - synchronize a file's in-core state with storage device.
     * @param handle A `FileHandle`.
     */
    function fdatasync(handle: FileHandle): Promise<void>;

    /**
     * Asynchronous fsync(2) - synchronize a file's in-core state with the underlying storage device.
     * @param handle A `FileHandle`.
     */
    function fsync(handle: FileHandle): Promise<void>;

    /**
     * Asynchronous mkdir(2) - create a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
     * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to `0o777`.
     */
    function mkdir(path: PathLike, options: MakeDirectoryOptions & { recursive: true; }): Promise<string | undefined>;

    /**
     * Asynchronous mkdir(2) - create a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
     * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to `0o777`.
     */
    function mkdir(path: PathLike, options?: Mode | (MakeDirectoryOptions & { recursive?: false | undefined; }) | null): Promise<void>;

    /**
     * Asynchronous mkdir(2) - create a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
     * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to `0o777`.
     */
    function mkdir(path: PathLike, options?: Mode | MakeDirectoryOptions | null): Promise<string | undefined>;

    /**
     * Asynchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    function readdir(path: PathLike, options?: BaseEncodingOptions & { withFileTypes?: false | undefined } | BufferEncoding | null): Promise<string[]>;

    /**
     * Asynchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    function readdir(path: PathLike, options: { encoding: "buffer"; withFileTypes?: false | undefined } | "buffer"): Promise<Buffer[]>;

    /**
     * Asynchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    function readdir(path: PathLike, options?: BaseEncodingOptions & { withFileTypes?: false | undefined } | BufferEncoding | null): Promise<string[] | Buffer[]>;

    /**
     * Asynchronous readdir(3) - read a directory.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options If called with `withFileTypes: true` the result data will be an array of Dirent.
     */
    function readdir(path: PathLike, options: BaseEncodingOptions & { withFileTypes: true }): Promise<Dirent[]>;

    /**
     * Asynchronous readlink(2) - read value of a symbolic link.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    function readlink(path: PathLike, options?: BaseEncodingOptions | BufferEncoding | null): Promise<string>;

    /**
     * Asynchronous readlink(2) - read value of a symbolic link.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    function readlink(path: PathLike, options: BufferEncodingOption): Promise<Buffer>;

    /**
     * Asynchronous readlink(2) - read value of a symbolic link.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    function readlink(path: PathLike, options?: BaseEncodingOptions | string | null): Promise<string | Buffer>;

    /**
     * Asynchronous symlink(2) - Create a new symbolic link to an existing file.
     * @param target A path to an existing file. If a URL is provided, it must use the `file:` protocol.
     * @param path A path to the new symlink. If a URL is provided, it must use the `file:` protocol.
     * @param type May be set to `'dir'`, `'file'`, or `'junction'` (default is `'file'`) and is only available on Windows (ignored on other platforms).
     * When using `'junction'`, the `target` argument will automatically be normalized to an absolute path.
     */
    function symlink(target: PathLike, path: PathLike, type?: string | null): Promise<void>;

    /**
     * Asynchronous lstat(2) - Get file status. Does not dereference symbolic links.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    function lstat(path: PathLike, opts?: StatOptions & { bigint?: false | undefined }): Promise<Stats>;
    function lstat(path: PathLike, opts: StatOptions & { bigint: true }): Promise<BigIntStats>;
    function lstat(path: PathLike, opts?: StatOptions): Promise<Stats | BigIntStats>;

    /**
     * Asynchronous stat(2) - Get file status.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    function stat(path: PathLike, opts?: StatOptions & { bigint?: false | undefined }): Promise<Stats>;
    function stat(path: PathLike, opts: StatOptions & { bigint: true }): Promise<BigIntStats>;
    function stat(path: PathLike, opts?: StatOptions): Promise<Stats | BigIntStats>;

    /**
     * Asynchronous link(2) - Create a new link (also known as a hard link) to an existing file.
     * @param existingPath A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param newPath A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    function link(existingPath: PathLike, newPath: PathLike): Promise<void>;

    /**
     * Asynchronous unlink(2) - delete a name and possibly the file it refers to.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    function unlink(path: PathLike): Promise<void>;

    /**
     * Asynchronous fchmod(2) - Change permissions of a file.
     * @param handle A `FileHandle`.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
     */
    function fchmod(handle: FileHandle, mode: Mode): Promise<void>;

    /**
     * Asynchronous chmod(2) - Change permissions of a file.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
     */
    function chmod(path: PathLike, mode: Mode): Promise<void>;

    /**
     * Asynchronous lchmod(2) - Change permissions of a file. Does not dereference symbolic links.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
     */
    function lchmod(path: PathLike, mode: Mode): Promise<void>;

    /**
     * Asynchronous lchown(2) - Change ownership of a file. Does not dereference symbolic links.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    function lchown(path: PathLike, uid: number, gid: number): Promise<void>;

    /**
     * Changes the access and modification times of a file in the same way as `fsPromises.utimes()`,
     * with the difference that if the path refers to a symbolic link, then the link is not
     * dereferenced: instead, the timestamps of the symbolic link itself are changed.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param atime The last access time. If a string is provided, it will be coerced to number.
     * @param mtime The last modified time. If a string is provided, it will be coerced to number.
     */
    function lutimes(path: PathLike, atime: string | number | Date, mtime: string | number | Date): Promise<void>;

    /**
     * Asynchronous fchown(2) - Change ownership of a file.
     * @param handle A `FileHandle`.
     */
    function fchown(handle: FileHandle, uid: number, gid: number): Promise<void>;

    /**
     * Asynchronous chown(2) - Change ownership of a file.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     */
    function chown(path: PathLike, uid: number, gid: number): Promise<void>;

    /**
     * Asynchronously change file timestamps of the file referenced by the supplied path.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param atime The last access time. If a string is provided, it will be coerced to number.
     * @param mtime The last modified time. If a string is provided, it will be coerced to number.
     */
    function utimes(path: PathLike, atime: string | number | Date, mtime: string | number | Date): Promise<void>;

    /**
     * Asynchronously change file timestamps of the file referenced by the supplied `FileHandle`.
     * @param handle A `FileHandle`.
     * @param atime The last access time. If a string is provided, it will be coerced to number.
     * @param mtime The last modified time. If a string is provided, it will be coerced to number.
     */
    function futimes(handle: FileHandle, atime: string | number | Date, mtime: string | number | Date): Promise<void>;

    /**
     * Asynchronous realpath(3) - return the canonicalized absolute pathname.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    function realpath(path: PathLike, options?: BaseEncodingOptions | BufferEncoding | null): Promise<string>;

    /**
     * Asynchronous realpath(3) - return the canonicalized absolute pathname.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    function realpath(path: PathLike, options: BufferEncodingOption): Promise<Buffer>;

    /**
     * Asynchronous realpath(3) - return the canonicalized absolute pathname.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    function realpath(path: PathLike, options?: BaseEncodingOptions | BufferEncoding | null): Promise<string | Buffer>;

    /**
     * Asynchronously creates a unique temporary directory.
     * Generates six random characters to be appended behind a required `prefix` to create a unique temporary directory.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    function mkdtemp(prefix: string, options?: BaseEncodingOptions | BufferEncoding | null): Promise<string>;

    /**
     * Asynchronously creates a unique temporary directory.
     * Generates six random characters to be appended behind a required `prefix` to create a unique temporary directory.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    function mkdtemp(prefix: string, options: BufferEncodingOption): Promise<Buffer>;

    /**
     * Asynchronously creates a unique temporary directory.
     * Generates six random characters to be appended behind a required `prefix` to create a unique temporary directory.
     * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
     */
    function mkdtemp(prefix: string, options?: BaseEncodingOptions | BufferEncoding | null): Promise<string | Buffer>;

    /**
     * Asynchronously writes data to a file, replacing the file if it already exists.
     * It is unsafe to call `fsPromises.writeFile()` multiple times on the same file without waiting for the `Promise` to be resolved (or rejected).
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     * If a `FileHandle` is provided, the underlying file will _not_ be closed automatically.
     * @param data The data to write. If something other than a `Buffer` or `Uint8Array` is provided, the value is coerced to a string.
     * @param options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
     * If `encoding` is not supplied, the default of `'utf8'` is used.
     * If `mode` is not supplied, the default of `0o666` is used.
     * If `mode` is a string, it is parsed as an octal integer.
     * If `flag` is not supplied, the default of `'w'` is used.
     */
    function writeFile(
        path: PathLike | FileHandle,
        data: string | Uint8Array,
        options?: BaseEncodingOptions & { mode?: Mode | undefined, flag?: OpenMode | undefined } | BufferEncoding | null
    ): Promise<void>;

    /**
     * Asynchronously append data to a file, creating the file if it does not exist.
     * @param file A path to a file. If a URL is provided, it must use the `file:` protocol.
     * URL support is _experimental_.
     * If a `FileHandle` is provided, the underlying file will _not_ be closed automatically.
     * @param data The data to write. If something other than a `Buffer` or `Uint8Array` is provided, the value is coerced to a string.
     * @param options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
     * If `encoding` is not supplied, the default of `'utf8'` is used.
     * If `mode` is not supplied, the default of `0o666` is used.
     * If `mode` is a string, it is parsed as an octal integer.
     * If `flag` is not supplied, the default of `'a'` is used.
     */
    function appendFile(
        path: PathLike | FileHandle,
        data: string | Uint8Array,
        options?: BaseEncodingOptions & { mode?: Mode | undefined, flag?: OpenMode | undefined } | BufferEncoding | null
    ): Promise<void>;

    /**
     * Asynchronously reads the entire contents of a file.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * If a `FileHandle` is provided, the underlying file will _not_ be closed automatically.
     * @param options An object that may contain an optional flag.
     * If a flag is not provided, it defaults to `'r'`.
     */
    function readFile(path: PathLike | FileHandle, options?: { encoding?: null | undefined, flag?: OpenMode | undefined } | null): Promise<Buffer>;

    /**
     * Asynchronously reads the entire contents of a file.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * If a `FileHandle` is provided, the underlying file will _not_ be closed automatically.
     * @param options An object that may contain an optional flag.
     * If a flag is not provided, it defaults to `'r'`.
     */
    function readFile(path: PathLike | FileHandle, options: { encoding: BufferEncoding, flag?: OpenMode | undefined } | BufferEncoding): Promise<string>;

    /**
     * Asynchronously reads the entire contents of a file.
     * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
     * If a `FileHandle` is provided, the underlying file will _not_ be closed automatically.
     * @param options An object that may contain an optional flag.
     * If a flag is not provided, it defaults to `'r'`.
     */
    function readFile(path: PathLike | FileHandle, options?: BaseEncodingOptions & { flag?: OpenMode | undefined } | BufferEncoding | null): Promise<string | Buffer>;

    function opendir(path: string, options?: OpenDirOptions): Promise<Dir>;
}
