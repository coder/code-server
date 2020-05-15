#!/usr/bin/env sh
set -eu

main() {
  case "${npm_config_user_agent-}" in npm*)
    # We are running under npm.
    if [ "${npm_config_unsafe_perm-}" != "true" ]; then
      echo "Please pass --unsafe-perm to npm to install code-server"
      echo "Otherwise the postinstall script does not have permissions to run"
      echo "See https://docs.npmjs.com/misc/config#unsafe-perm"
      echo "See https://stackoverflow.com/questions/49084929/npm-sudo-global-installation-unsafe-perm"
      exit 1
    fi
    ;;
  esac

  cd lib/vscode

  # We have to rename node_modules.bundled to node_modules.
  # The bundled modules were renamed originally to avoid being ignored by yarn.
  node_modules="$(find . -depth -name "node_modules.bundled")"
  for nm in $node_modules; do
    rm -Rf "${nm%.bundled}"
    mv "$nm" "${nm%.bundled}"
  done

  # $npm_config_global makes npm rebuild return without rebuilding.
  unset npm_config_global
  # Rebuilds native modules.
  if ! npm rebuild; then
    echo "You may not have the required dependencies to build the native modules."
    echo "Please see https://github.com/cdr/code-server/blob/master/doc/npm.md"
    exit 1
  fi
}

main "$@"
