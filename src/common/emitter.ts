import { logger } from "@coder/logger"

/**
 * Event emitter callback. Called with the emitted value and a promise that
 * resolves when all emitters have finished.
 */
export type Callback<T, R = void | Promise<void>> = (t: T, p: Promise<void>) => R

export interface Disposable {
  dispose(): void | Promise<void>
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
  public async emit(value: T): Promise<void> {
    let resolve: () => void
    const promise = new Promise<void>((r) => (resolve = r))

    await Promise.all(
      this.listeners.map(async (cb) => {
        try {
          await cb(value, promise)
        } catch (error: any) {
          logger.error(error.message)
        }
      }),
    )

    resolve!()
  }

  public dispose(): void {
    this.listeners = []
  }
}
