#!/bin/bash
set -e

# Set the Max SDK path (edit if needed)
export MAX_SDK_PATH=~/Downloads/max-sdk/source/max-sdk-base

# Go to the externals directory
cd "$(dirname "$0")"

# Create build directory if it doesn't exist
mkdir -p build
cd build

# Run CMake and build
cmake ..
cmake --build .

# Output location
cd ..
echo "\nBuild complete! If successful, keylink.mxo is in externals/. Copy the KeyLink package to your Max Packages folder to test." 