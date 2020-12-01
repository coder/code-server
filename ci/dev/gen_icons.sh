#!/bin/sh
set -eu

main() {
  cd src/browser/media

  # We need .ico for backwards compatibility.
  # The other two are the only icon sizes required by Chrome and
  # we use them for stuff like apple-touch-icon as well.
  # https://web.dev/add-manifest/
  #
  # This should be enough and we can always add more if there are problems.

  # -background defaults to white but we want it transparent.
  # https://imagemagick.org/script/command-line-options.php#background
  convert -background transparent -resize 256x256 favicon.svg favicon.ico
  convert -background transparent -resize 192x192 favicon.svg pwa-icon-192.png
  convert -background transparent -resize 512x512 favicon.svg pwa-icon-512.png
}

main "$@"
