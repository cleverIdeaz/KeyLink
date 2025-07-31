#!/bin/bash

# Build script for KeyLink Simple Max external
# This version has NO networking dependencies - completely safe

echo "Building KeyLink Simple Max external..."

# Create build directory
mkdir -p build_simple

# Build the simple external
cd build_simple
cmake .. -DKEYLINK_SIMPLE=ON
make

if [ $? -eq 0 ]; then
    echo "✅ KeyLink Simple build successful!"
    echo "📁 keylink_simple.mxo is ready in externals/"
    echo ""
    echo "Usage in Max/MSP:"
    echo "  [keylink_simple] - Create simple object"
    echo "  [start] → [keylink_simple] - Start local message handling"
    echo "  [bang] → [keylink_simple] - Send ping message"
    echo "  [tosymbol {\"key\":\"G\"}] → [keylink_simple] - Send JSON"
    echo ""
    echo "This version is completely safe for offline use!"
else
    echo "❌ Build failed!"
    exit 1
fi 