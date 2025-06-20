#!/bin/bash

#This will generate all the assets for branding from a single SVG file

SVG="logo.svg"
OUTDIR="."
mkdir -p "$OUTDIR"

# Step 1: Convert to high-res PNG using Inkscape (preferred) or rsvg-convert
rsvg-convert -w 1024 "$OUTDIR/logo.svg" > "$OUTDIR/logo-raw.png"

# Step 2: Pad to 1024x1024 using ImageMagick
magick convert "$OUTDIR/logo-raw.png" -background none -gravity center -extent 1024x1024 "$OUTDIR/logo-1024.png"

# Step 3: Generate favicon (ICO from 64x64)
magick convert "$OUTDIR/logo-1024.png" -resize 64x64 "$OUTDIR/favicon-64.png"
magick convert "$OUTDIR/favicon-64.png" -define icon:auto-resize "$OUTDIR/favicon.ico"

# Step 4: Generate PWA icons
magick convert "$OUTDIR/logo-1024.png" -resize 192x192 "$OUTDIR/pwa-icon-192.png"
magick convert "$OUTDIR/logo-1024.png" -resize 512x512 "$OUTDIR/pwa-icon-512.png"

