/**
 * Provides utilities for handling SSH connections
 */
import * as fs from "fs"
import * as path from "path"
import * as ssh from "ssh2"
import { FileEntry, SFTPStream } from "ssh2-streams"

/**
 * Fills out all the functionality of SFTP using fs.
 */
export function fillSftpStream(accept: () => SFTPStream): void {
  const sftp = accept()

  let oid = 0
  const fds: { [key: number]: boolean } = {}
  const ods: {
    [key: number]: {
      path: string
      read: boolean
    }
  } = {}

  const sftpStatus = (reqID: number, err?: NodeJS.ErrnoException | null): boolean => {
    let code = ssh.SFTP_STATUS_CODE.OK
    if (err) {
      if (err.code === "EACCES") {
        code = ssh.SFTP_STATUS_CODE.PERMISSION_DENIED
      } else if (err.code === "ENOENT") {
        code = ssh.SFTP_STATUS_CODE.NO_SUCH_FILE
      } else {
        code = ssh.SFTP_STATUS_CODE.FAILURE
      }
    }
    return sftp.status(reqID, code)
  }

  sftp.on("OPEN", (reqID, filename) => {
    fs.open(filename, "w", (err, fd) => {
      if (err) {
        return sftpStatus(reqID, err)
      }
      fds[fd] = true
      const buf = Buffer.alloc(4)
      buf.writeUInt32BE(fd, 0)
      return sftp.handle(reqID, buf)
    })
  })

  sftp.on("OPENDIR", (reqID, path) => {
    const buf = Buffer.alloc(4)
    const id = oid++
    buf.writeUInt32BE(id, 0)
    ods[id] = {
      path,
      read: false,
    }
    sftp.handle(reqID, buf)
  })

  sftp.on("READDIR", (reqID, handle) => {
    const od = handle.readUInt32BE(0)
    if (!ods[od]) {
      return sftp.status(reqID, ssh.SFTP_STATUS_CODE.NO_SUCH_FILE)
    }
    if (ods[od].read) {
      sftp.status(reqID, ssh.SFTP_STATUS_CODE.EOF)
      return
    }
    return fs.readdir(ods[od].path, (err, files) => {
      if (err) {
        return sftpStatus(reqID, err)
      }
      return Promise.all(
        files.map((f) => {
          return new Promise<FileEntry>((resolve, reject) => {
            const fullPath = path.join(ods[od].path, f)
            fs.stat(fullPath, (err, stats) => {
              if (err) {
                return reject(err)
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
              })
            })
          })
        }),
      )
        .then((files) => {
          sftp.name(reqID, files)
          ods[od].read = true
        })
        .catch(() => {
          sftp.status(reqID, ssh.SFTP_STATUS_CODE.FAILURE)
        })
    })
  })

  sftp.on("WRITE", (reqID, handle, offset, data) => {
    const fd = handle.readUInt32BE(0)
    if (!fds[fd]) {
      return sftp.status(reqID, ssh.SFTP_STATUS_CODE.NO_SUCH_FILE)
    }
    return fs.write(fd, data, offset, (err) => sftpStatus(reqID, err))
  })

  sftp.on("CLOSE", (reqID, handle) => {
    const fd = handle.readUInt32BE(0)
    if (!fds[fd]) {
      if (ods[fd]) {
        delete ods[fd]
        return sftp.status(reqID, ssh.SFTP_STATUS_CODE.OK)
      }
      return sftp.status(reqID, ssh.SFTP_STATUS_CODE.NO_SUCH_FILE)
    }
    return fs.close(fd, (err) => sftpStatus(reqID, err))
  })

  sftp.on("STAT", (reqID, path) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        return sftpStatus(reqID, err)
      }
      return sftp.attrs(reqID, {
        atime: stats.atime.getTime(),
        gid: stats.gid,
        mode: stats.mode,
        mtime: stats.mtime.getTime(),
        size: stats.size,
        uid: stats.uid,
      })
    })
  })

  sftp.on("MKDIR", (reqID, path) => {
    fs.mkdir(path, (err) => sftpStatus(reqID, err))
  })

  sftp.on("LSTAT", (reqID, path) => {
    fs.lstat(path, (err, stats) => {
      if (err) {
        return sftpStatus(reqID, err)
      }
      return sftp.attrs(reqID, {
        atime: stats.atimeMs,
        gid: stats.gid,
        mode: stats.mode,
        mtime: stats.mtimeMs,
        size: stats.size,
        uid: stats.uid,
      })
    })
  })

  sftp.on("REMOVE", (reqID, path) => {
    fs.unlink(path, (err) => sftpStatus(reqID, err))
  })

  sftp.on("RMDIR", (reqID, path) => {
    fs.rmdir(path, (err) => sftpStatus(reqID, err))
  })

  sftp.on("REALPATH", (reqID, path) => {
    fs.realpath(path, (pathErr, resolved) => {
      if (pathErr) {
        return sftpStatus(reqID, pathErr)
      }
      fs.stat(path, (statErr, stat) => {
        if (statErr) {
          return sftpStatus(reqID, statErr)
        }
        sftp.name(reqID, [
          {
            filename: resolved,
            longname: resolved,
            attrs: {
              mode: stat.mode,
              uid: stat.uid,
              gid: stat.gid,
              size: stat.size,
              atime: stat.atime.getTime(),
              mtime: stat.mtime.getTime(),
            },
          },
        ])
        return
      })
      return
    })
  })
}
