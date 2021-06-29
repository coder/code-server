import { getOptions } from "../../common/util"
import "../register"

const options = getOptions()
const el = document.getElementById("base") as HTMLInputElement
if (el) {
  el.value = options.base
}
