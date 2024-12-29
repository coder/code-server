#!/bin/bash

EXTENSIONS_FILE="./extensions.txt"
CODE_SERVER="./release-standalone/bin/code-server"
EXTENSIONS_DIR="~/.local/share/code-server/extensions"
TARGET_DIR="./release-standalone/lib/vscode/extensions"

# Check if code-server exists
if [ ! -f "$CODE_SERVER" ]; then
    echo "Error: code-server not found at $CODE_SERVER"
    exit 1
fi

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Read extensions file line by line
while IFS= read -r extension || [ -n "$extension" ]; do
    # Skip empty lines and comments
    if [[ -z "$extension" || "$extension" =~ ^# ]]; then
        continue
    fi
    
    echo "Installing extension: $extension"
    
    # Install the extension
    $CODE_SERVER --install-extension "$extension"
    
    if [ $? -ne 0 ]; then
        echo "Warning: Failed to install $extension"
        continue
    fi
    
    echo "Copying extension files to standalone directory"
    # Use cp -R with expanded source path
    if ! eval "cp -R $EXTENSIONS_DIR/${extension}* $TARGET_DIR/"; then
        echo "Warning: Failed to copy $extension to standalone directory"
    fi
    
    echo "Completed processing $extension"
    echo "----------------------------------------"
done < "$EXTENSIONS_FILE"

echo "All extensions processed"