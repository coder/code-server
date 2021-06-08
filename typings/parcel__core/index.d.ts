type FixMeLater = any
declare module "@parcel/core" {
  export class Parcel {
    constructor(options: FixMeLater)
  }
}
