declare module "hijackresponse" {
  import * as express from "express"
  import * as stream from "stream"

  function e(res: express.Response): Promise<HJ>
  export default e

  export interface HJ {
    readable: stream.Readable
    writable: stream.Writable
    destroyAndRestore: () => void
  }
}
