/**
 * Provides utilities for handling SSH connections
 */
import * as net from "net";
import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as sshTypes from "ssh2";
import * as nodePty from "node-pty";
import { FileEntry, SFTPStream } from "ssh2-streams";
import { localRequire } from 'vs/server/src/node/util';

const ssh = localRequire<typeof import("ssh2")>("ssh2/lib/client");

/**
 * Fills out all of the functionality of SSH using node equivalents.
 */
export function fillSSHSession(accept: () => sshTypes.Session) {
	let pty: nodePty.IPty | undefined;
	let activeProcess: cp.ChildProcess;
	let ptyInfo: sshTypes.PseudoTtyInfo | undefined;
	const env: { [key: string]: string } = {};

	const session = accept();

	// Run a command, stream back the data
	const cmd = (command: string, channel: sshTypes.ServerChannel): void => {
		if (ptyInfo) {
			pty = nodePty.spawn(command, [], {
				cols: ptyInfo.cols,
				rows: ptyInfo.rows,
			});
			pty.onData((d) => channel.write(d));
			pty.on("exit", (exitCode) => {
				channel.exit(exitCode);
				channel.close();
			});
			channel.on("data", (d: any) => pty!.write(d));
			return;
		}

		const proc = cp.exec(command);
		proc.stdout.on("data", (d) => channel.stdout.write(d));
		proc.stderr.on("data", (d) => channel.stderr.write(d));
		proc.on("exit", (exitCode) => {
				channel.exit(exitCode || 0);
				channel.close();
		});
		channel.stdin.on("data", (d: any) => proc.stdin.write(d));
		channel.stdin.on("close", () => proc.stdin.end());
	};

	session.on("pty", (accept, _, info) => {
		ptyInfo = info;
		accept();
	});

	session.on("shell", accept => {
		cmd(process.env.SHELL || "/usr/bin/env bash", accept());
	});

	session.on("exec", (accept, _, info) => {
		cmd(info.command, accept());
	});

	session.on("sftp", fillSFTPStream);

	session.on("signal", (accept, _, info) => {
		accept();
		process.kill((pty || activeProcess).pid, info.name);
	});

	session.on("env", (_accept, _reject, info) => {
		env[info.key] = info.value;
	});

	session.on("window-change", (accept, reject, info) => {
		if (pty) {
			pty.resize(info.cols, info.rows);
			accept();
		} else {
			reject();
		}
	});
}

/**
 * Fills out all the functionality of SFTP using fs.
 */
function fillSFTPStream(accept: () => SFTPStream) {
	const sftp = accept();

	let oid = 0;
	const fds: { [key: number]: boolean } = {};
	const ods: { [key: number]: {
		path: string
		read: boolean
	} } = {};

	const sftpStatus = (reqID: number, err?: NodeJS.ErrnoException) => {
		let code = ssh.SFTP_STATUS_CODE.OK;
		if (err) {
			if (err.code === "EACCES") {
				code = ssh.SFTP_STATUS_CODE.PERMISSION_DENIED;
			}
			if (err.code === "ENOENT") {
				code = ssh.SFTP_STATUS_CODE.NO_SUCH_FILE;
			}
			code = ssh.SFTP_STATUS_CODE.FAILURE;
		}
		return sftp.status(reqID, code);
	};

	sftp.on("OPEN", (reqID, filename) => {
		fs.open(filename, "w", (err, fd) => {
			if (err) {
				return sftpStatus(reqID, err);
			}
			fds[fd] = true;
			const buf = Buffer.alloc(4);
			buf.writeUInt32BE(fd, 0);
			return sftp.handle(reqID, buf);
		});
	});

	sftp.on("OPENDIR", (reqID, path) => {
		const buf = Buffer.alloc(4);
		const id = oid++;
		buf.writeUInt32BE(id, 0);
		ods[id] = {
			path,
			read: false,
		};
		sftp.handle(reqID, buf);
	});

	sftp.on("READDIR", (reqID, handle) => {
		const od = handle.readUInt32BE(0);
		if (!ods[od]) {
			return sftp.status(reqID, ssh.SFTP_STATUS_CODE.NO_SUCH_FILE);
		}
		if (ods[od].read) {
			sftp.status(reqID, ssh.SFTP_STATUS_CODE.EOF);
			return;
		}
		return fs.readdir(ods[od].path, (err, files) => {
			if (err) {
				return sftpStatus(reqID, err);
			}
			return Promise.all(files.map((f) => {
				return new Promise<FileEntry>((resolve, reject) => {
					const fullPath = path.join(ods[od].path, f);
					fs.stat(fullPath, (err, stats) => {
						if (err) {
							return reject(err);
						}

						resolve({
							filename: f,
							longname: fullPath,
							attrs: {
								atime: stats.atimeMs,
								gid: stats.gid,
								mode: stats.mode,
								size: stats.size,
								mtime: stats.mtimeMs,
								uid: stats.uid,
							},
						});
					});
				});
			}))
			.then((files) => {
				sftp.name(reqID, files);
				ods[od].read = true;
			})
			.catch(() => {
				sftp.status(reqID, ssh.SFTP_STATUS_CODE.FAILURE);
			});
		});
	});

	sftp.on("WRITE", (reqID, handle, offset, data) => {
		const fd = handle.readUInt32BE(0);
		if (!fds[fd]) {
			return sftp.status(reqID, ssh.SFTP_STATUS_CODE.NO_SUCH_FILE);
		}
		return fs.write(fd, data, offset, err => sftpStatus(reqID, err));
	});

	sftp.on("CLOSE", (reqID, handle) => {
		const fd = handle.readUInt32BE(0);
		if (!fds[fd]) {
			if (ods[fd]) {
				delete ods[fd];
				return sftp.status(reqID, ssh.SFTP_STATUS_CODE.OK);
			}
			return sftp.status(reqID, ssh.SFTP_STATUS_CODE.NO_SUCH_FILE);
		}
		return fs.close(fd, err => sftpStatus(reqID, err));
	});

	sftp.on("STAT", (reqID, path) => {
		fs.stat(path, (err, stats) => {
			if (err) {
				return sftpStatus(reqID, err);
			}
			return sftp.attrs(reqID, {
				atime: stats.atime.getTime(),
				gid: stats.gid,
				mode: stats.mode,
				mtime: stats.mtime.getTime(),
				size: stats.size,
				uid: stats.uid,
			});
		});
	});

	sftp.on("MKDIR", (reqID, path) => {
		fs.mkdir(path, err => sftpStatus(reqID, err));
	});

	sftp.on("LSTAT", (reqID, path) => {
		fs.lstat(path, (err, stats) => {
			if (err) {
				return sftpStatus(reqID, err);
			}
			return sftp.attrs(reqID, {
				atime: stats.atimeMs,
				gid: stats.gid,
				mode: stats.mode,
				mtime: stats.mtimeMs,
				size: stats.size,
				uid: stats.uid
			});
		});
	});

	sftp.on("REMOVE", (reqID, path) => {
		fs.unlink(path, err => sftpStatus(reqID, err));
	});

	sftp.on("RMDIR", (reqID, path) => {
		fs.rmdir(path, err => sftpStatus(reqID, err));
	});

	sftp.on("REALPATH", (reqID, path) => {
		fs.realpath(path, (err, resolved) => {
			if (err) {
				return sftpStatus(reqID, err);
			}
			sftp.name(reqID, [{
				filename: resolved,
				longname: resolved,
				attrs: {} as any,
			}]);
			return;
		});
	});
}

/**
 * Pipes a requested port over SSH
 */
export function forwardSSHPort(
	accept: () => sshTypes.ServerChannel,
	reject: () => boolean,
	info: sshTypes.TcpipRequestInfo,
) {
	const fwdSocket = net.createConnection(info.destPort, info.destIP);
	fwdSocket.on('error', () => reject());
	fwdSocket.on('connect', () => {
		const channel = accept();
		channel.pipe(fwdSocket);
		fwdSocket.pipe(channel);
	});
}
