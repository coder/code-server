import * as util from "util"
import * as wtfnode from "wtfnode"

// Jest seems to hijack console.log in a way that makes the output difficult to
// read. So we'll write directly to process.stderr instead.
const write = (...args: [any, ...any]) => {
  if (args.length > 0) {
    process.stderr.write(util.format(...args) + "\n")
  }
}
wtfnode.setLogger("info", write)
wtfnode.setLogger("warn", write)
wtfnode.setLogger("error", write)

let active = false

/**
 * Start logging open handles periodically. This can be used to see what is
 * hanging open if anything.
 */
export function setup(): void {
  if (active) {
    return
  }
  active = true

  const interval = 5000
  const wtfnodeDump = () => {
    wtfnode.dump()
    const t = setTimeout(wtfnodeDump, interval)
    t.unref()
  }
  const t = setTimeout(wtfnodeDump, interval)
  t.unref()
}
