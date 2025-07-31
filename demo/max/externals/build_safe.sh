#!/bin/bash

# Build script for KeyLink Safe Max external
# This version has NO networking dependencies - completely safe

echo "Building KeyLink Safe Max external..."

# Find Max SDK path
MAX_SDK_PATH="/Applications/Max.app/Contents/Resources/C74/include"
if [ ! -d "$MAX_SDK_PATH" ]; then
    echo "❌ Max SDK not found at $MAX_SDK_PATH"
    echo "Please install Max/MSP or adjust the path"
    exit 1
fi

# Build the safe external
g++ -shared -fPIC \
    -I"$MAX_SDK_PATH" \
    -o keylink_safe.mxo \
    keylink_safe.cpp

if [ $? -eq 0 ]; then
    echo "✅ KeyLink Safe build successful!"
    echo "📁 keylink_safe.mxo is ready in externals/"
    echo ""
    echo "Usage in Max/MSP:"
    echo "  [keylink_safe] - Create safe object"
    echo "  [start] → [keylink_safe] - Start local message handling"
    echo "  [bang] → [keylink_safe] - Send ping message"
    echo "  [tosymbol {\"key\":\"G\"}] → [keylink_safe] - Send JSON"
    echo ""
    echo "This version is completely safe for offline use!"
else
    echo "❌ Build failed!"
    exit 1
fi 