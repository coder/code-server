import * as wtfnode from "wtfnode"

let active = false

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
