import { Callback } from "./types"

export interface Disposable {
  dispose(): void
}

export interface Event<T> {
  (listener: Callback<T>): Disposable
}

/**
 * Emitter typecasts for a single event type.
 */
export class Emitter<T> {
  private listeners: Array<Callback<T>> = []

  public get event(): Event<T> {
    return (cb: Callback<T>): Disposable => {
      this.listeners.push(cb)

      return {
        dispose: (): void => {
          const i = this.listeners.indexOf(cb)
          if (i !== -1) {
            this.listeners.splice(i, 1)
          }
        },
      }
    }
  }

  /**
   * Emit an event with a value.
   */
  public emit(value: T): void {
    this.listeners.forEach((cb) => cb(value))
  }

  public dispose(): void {
    this.listeners = []
  }
}
