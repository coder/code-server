#!/bin/sh
set -eu

# Generate icons from a single favicon.svg.  favicon.svg should have no fill
# colors set.
main() {
  cd src/browser/media

  # We need .ico for backwards compatibility.  The other two are the only icon
  # sizes required by Chrome and we use them for stuff like apple-touch-icon as
  # well.  https://web.dev/add-manifest/
  #
  # This should be enough and we can always add more if there are problems.
  #
  # -quiet to avoid https://github.com/ImageMagick/ImageMagick/issues/884
  # -background defaults to white but we want it transparent.
  # -density somehow makes the image both sharper and smaller in file size.
  #
  # https://imagemagick.org/script/command-line-options.php#background
  convert -quiet -background transparent \
          -resize 256x256 -density 256x256 \
          favicon.svg favicon.ico

  # Generate PWA icons.  There should be enough padding to support masking.
  convert -quiet -border 60x60 -bordercolor white -background white \
          -resize 192x192 -density 192x192 \
          favicon.svg pwa-icon-maskable-192.png
  convert -quiet -border 160x160 -bordercolor white -background white \
          -resize 512x512 -density 512x512 \
          favicon.svg pwa-icon-maskable-512.png

  # Generate non-maskable PWA icons.
  magick pwa-icon-maskable-192.png \
         \( +clone -threshold 101% -fill white -draw "roundRectangle 0,0 %[fx:int(w)],%[fx:int(h)] 50,50" \) \
         -channel-fx "| gray=>alpha" \
         pwa-icon-192.png
  magick pwa-icon-maskable-512.png \
         \( +clone -threshold 101% -fill white -draw "roundRectangle 0,0 %[fx:int(w)],%[fx:int(h)] 100,100" \) \
         -channel-fx "| gray=>alpha" \
         pwa-icon-512.png

  # The following adds dark mode support for the favicon as
  # favicon-dark-support.svg There is no similar capability for pwas or .ico so
  # we can only add support to the svg.
  favicon_dark_style="<style>@media (prefers-color-scheme: dark) {* { fill: white; }}</style>"
  cp favicon.svg favicon-dark-support.svg
  sed "s%<path%$favicon_dark_style\n  <path%" favicon.svg > favicon-dark-support.svg
}

main "$@"
