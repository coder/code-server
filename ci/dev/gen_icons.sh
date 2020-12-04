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
  convert -quiet -background transparent -resize 256x256 favicon.svg favicon.ico
  convert -quiet -background transparent -resize 192x192 pwa-icon.png pwa-icon-192.png
  convert -quiet -background transparent -resize 512x512 pwa-icon.png pwa-icon-512.png

  # We use -quiet above to avoid https://github.com/ImageMagick/ImageMagick/issues/884
}

main "$@"
