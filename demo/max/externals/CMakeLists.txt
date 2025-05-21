cmake_minimum_required(VERSION 3.10)
project(keylink)

# Set your Max SDK path here
set(MAX_SDK_PATH "$ENV{MAX_SDK_PATH}")

# Source files
set(SOURCES
    keylink.cpp
)

# Include directories
include_directories(
    ${MAX_SDK_PATH}/include
    ${CMAKE_CURRENT_SOURCE_DIR}
    # Add paths to Asio and nlohmann/json if needed
)

# Add library for Max external
add_library(keylink SHARED ${SOURCES})

# Set output name and extension for Max external
set_target_properties(keylink PROPERTIES
    PREFIX ""
    SUFFIX ".mxo" # Use .mxe64 for Windows
)

# Link libraries (add Asio, pthread, etc. as needed)
target_link_libraries(keylink
    # pthread
)

# Post-build: copy to externals folder
add_custom_command(TARGET keylink POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy $<TARGET_FILE:keylink> ${CMAKE_CURRENT_SOURCE_DIR}/..
) 