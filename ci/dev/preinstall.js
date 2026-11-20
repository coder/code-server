if (!/^pnpm\/(\d+)\.(\d+)\.(\d+)/.exec(process.env.npm_config_user_agent)) {
  throw new Error("`yarn` and `npm` are no longer supported; please use `pnpm install` instead")
}
