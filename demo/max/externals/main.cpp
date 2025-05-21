// main.cpp - Test harness for KeyLink UDP/JSON outside Max
// Build and run this to test UDP multicast and JSON parsing
// Requires Asio and nlohmann/json (add to project)

#include <iostream>
#include <string>
// #include <asio.hpp>
// #include <nlohmann/json.hpp>

#define KEYLINK_MULTICAST_ADDR "239.255.0.1"
#define KEYLINK_UDP_PORT 7474

int main() {
    std::cout << "KeyLink UDP/JSON test harness" << std::endl;
    // TODO: Set up Asio UDP socket, join multicast group
    // TODO: Send a test JSON message
    // TODO: Receive and print incoming JSON messages
    // Example JSON:
    std::string msg = R"({\"root\":\"C\",\"mode\":\"Ionian\",\"chord\":{\"root\":\"C\",\"type\":\"maj7\"}})";
    std::cout << "Would send: " << msg << std::endl;
    // TODO: Use nlohmann::json to parse/serialize
    return 0;
} 