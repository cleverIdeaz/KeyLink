#!/bin/bash

# Build script for KeyLink Offline Max external
# This version has NO networking dependencies - completely safe for offline use

echo "Building KeyLink Offline Max external..."

# Create build directory
mkdir -p build_offline

# Build the offline external
cd build_offline
cmake .. -DKEYLINK_OFFLINE_ONLY=ON
make

if [ $? -eq 0 ]; then
    echo "✅ KeyLink Offline build successful!"
    echo "📁 keylink_offline.mxo is ready in externals/"
    echo ""
    echo "Usage in Max/MSP:"
    echo "  [keylink_offline] - Create offline object"
    echo "  [start] → [keylink_offline] - Start local message handling"
    echo "  [bang] → [keylink_offline] - Send ping message"
    echo "  [tosymbol {\"key\":\"G\",\"mode\":\"Mixolydian\"}] → [keylink_offline] - Send JSON"
else
    echo "❌ Build failed!"
    exit 1
fi 