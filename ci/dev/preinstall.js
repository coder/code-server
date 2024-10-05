if (process.env.npm_execpath.includes("yarn")) {
  throw new Error("`yarn` is no longer supported; please use `npm install` instead")
}
