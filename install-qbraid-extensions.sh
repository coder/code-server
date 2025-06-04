#!/bin/bash

echo "Installing QBraid extensions..."

# Wait a moment for code-server to be ready
sleep 2

# Install extensions if they exist
for ext in /opt/qbraid-extensions/*.vsix; do
  if [ -f "$ext" ]; then
    ext_name=$(basename "$ext")
    echo "Installing extension: $ext_name"

    # Install the extension directly - code-server handles duplicates gracefully
    if code-server --install-extension "$ext"; then
      echo "Successfully installed $ext_name"
    else
      echo "Failed to install $ext_name"
    fi
  fi
done

echo "QBraid extensions installation complete."