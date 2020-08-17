import { getOptions } from "../../common/util"

const options = getOptions()
const el = document.getElementById("base") as HTMLInputElement
if (el) {
  el.value = options.base
}
