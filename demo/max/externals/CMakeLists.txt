cmake_minimum_required(VERSION 3.10)
project(keylink)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Set your Max SDK path here
set(MAX_SDK_PATH "/Users/nealium/Documents/MaxSDK/max-sdk-8.0.3/source")

# Source files
set(SOURCES
    keylink.cpp
)

# Include directories
include_directories(
    ${MAX_SDK_PATH}/c74support/max-includes
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/thirdparty/asio/include
    ${CMAKE_CURRENT_SOURCE_DIR}/thirdparty
)

# Add library for Max external
add_library(keylink MODULE ${SOURCES})

# Set output name and extension for Max external
set_target_properties(keylink PROPERTIES
    BUNDLE TRUE
    BUNDLE_EXTENSION "mxo"
    PREFIX ""
    SUFFIX ".mxo"
)

# Link libraries (add Asio, pthread, etc. as needed)
target_link_libraries(keylink
    "-framework MaxAPI"
    pthread
)

# Add the framework search path (use target_link_options for frameworks on macOS)
target_link_options(keylink PRIVATE
    -F${MAX_SDK_PATH}/c74support/max-includes
)

# Post-build: copy to externals folder
# add_custom_command(TARGET keylink POST_BUILD
#     COMMAND ${CMAKE_COMMAND} -E copy $<TARGET_FILE:keylink> ${CMAKE_CURRENT_SOURCE_DIR}/..
# )

# Build for Intel Macs only (works on Apple Silicon with Rosetta)
set(CMAKE_OSX_ARCHITECTURES "x86_64") 