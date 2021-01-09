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
  # We do not generate the pwa-icon from the favicon as they are slightly different
  # designs and sizes.
  # See favicon.afdesign and #2401 for details on the differences.
  convert -quiet -background transparent -resize 192x192 pwa-icon.png pwa-icon-192.png
  convert -quiet -background transparent -resize 512x512 pwa-icon.png pwa-icon-512.png

  # We use -quiet above to avoid https://github.com/ImageMagick/ImageMagick/issues/884

  # The following adds dark mode support for the favicon as favicon-dark-support.svg
  # There is no similar capability for pwas or .ico so we can only add support to the svg.
  favicon_dark_style="<style>
@media (prefers-color-scheme: dark) {
  * {
    fill: white;
  }
}
</style>"
  # See https://stackoverflow.com/a/22901380/4283659
  # This escapes all newlines so that sed will accept them.
  favicon_dark_style="$(printf "%s\n" "$favicon_dark_style" | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/\\n/g')"
  sed "$(
    cat -n << EOF
s%<rect id="favicon"%$favicon_dark_style<rect id="favicon"%
EOF
  )" favicon.svg > favicon-dark-support.svg
}

main "$@"
