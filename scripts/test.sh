#!/usr/bin/env sh
# test.sh -- Simple test for CI.
# We'll have more involved tests eventually. This just ensures the binary has
# been built and runs.

set -eu

main() {
	cd "$(dirname "$0")/.."

	version=$(./binaries/code-server* --version | head -1)
	echo "Got '$version' for the version"
	case $version in
		*-vsc1.42.0) exit 0 ;;
		*) exit 1 ;;
	esac
}

main "$@"
