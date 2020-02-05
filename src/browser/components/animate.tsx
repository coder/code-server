import * as React from "react"

export interface DelayProps {
  readonly show: boolean
  readonly delay: number
}

/**
 * Animate a component before unmounting (by delaying unmounting) or after
 * mounting.
 */
export const Animate: React.FunctionComponent<DelayProps> = (props) => {
  const [timer, setTimer] = React.useState<NodeJS.Timeout>()
  const [mount, setMount] = React.useState<boolean>(false)
  const [visible, setVisible] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (timer) {
      clearTimeout(timer)
    }
    if (!props.show) {
      setVisible(false)
      setTimer(setTimeout(() => setMount(false), props.delay))
    } else {
      setTimer(setTimeout(() => setVisible(true), props.delay))
      setMount(true)
    }
  }, [props])

  return mount ? <div className={`animate -${visible ? "show" : "hide"}`}>{props.children}</div> : null
}
