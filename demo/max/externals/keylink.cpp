// keylink.cpp - Starter for KeyLink Max external
// Zero-config, cross-platform music data sync for Max, browser, and more
// Written using the Cycling '74 Max SDK
// (C) Neal Anderson, 2024

#include "ext.h"
#include "ext_obex.h"
#include <string>
#include <thread>
#include <atomic>
#include <iostream>
#include <vector>
#include <mutex>
#include <condition_variable>
// #include <asio.hpp> // For UDP multicast (add to project)
// #include <nlohmann/json.hpp> // For JSON parsing (add to project)

// Default network settings
#define KEYLINK_MULTICAST_ADDR "239.255.0.1"
#define KEYLINK_UDP_PORT 7474
#define KEYLINK_WS_PORT 8765

// Struct for the Max object
typedef struct _keylink {
    t_object ob;
    void *outlet;
    std::thread net_thread;
    std::atomic<bool> running;
    // Add UDP socket, WebSocket server, etc. here
} t_keylink;

// Prototypes
void *keylink_new(t_symbol *s, long argc, t_atom *argv);
void keylink_free(t_keylink *x);
void keylink_assist(t_keylink *x, void *b, long m, long a, char *s);
void keylink_bang(t_keylink *x);
void keylink_dict(t_keylink *x, t_symbol *s);
void keylink_symbol(t_keylink *x, t_symbol *s);
void keylink_start(t_keylink *x);
void keylink_stop(t_keylink *x);

// Class pointer
static t_class *keylink_class = NULL;

// Main entry point
extern "C" int C74_EXPORT main(void) {
    t_class *c = class_new("keylink", (method)keylink_new, (method)keylink_free, (long)sizeof(t_keylink), 0L, A_GIMME, 0);
    class_addmethod(c, (method)keylink_bang, "bang", 0);
    class_addmethod(c, (method)keylink_dict, "dictionary", A_SYM, 0);
    class_addmethod(c, (method)keylink_symbol, "symbol", A_SYM, 0);
    class_addmethod(c, (method)keylink_start, "start", 0);
    class_addmethod(c, (method)keylink_stop, "stop", 0);
    class_addmethod(c, (method)keylink_assist, "assist", A_CANT, 0);
    class_register(CLASS_BOX, c);
    keylink_class = c;
    return 0;
}

void *keylink_new(t_symbol *s, long argc, t_atom *argv) {
    t_keylink *x = (t_keylink *)object_alloc(keylink_class);
    if (x) {
        x->outlet = outlet_new((t_object *)x, NULL);
        x->running = false;
        // TODO: Parse args for custom port/address
    }
    return (x);
}

void keylink_free(t_keylink *x) {
    x->running = false;
    if (x->net_thread.joinable()) x->net_thread.join();
    // TODO: Clean up sockets, etc.
}

void keylink_assist(t_keylink *x, void *b, long m, long a, char *s) {
    if (m == ASSIST_INLET) {
        sprintf(s, "Input (dict, symbol, bang, start, stop)");
    } else {
        sprintf(s, "Output (JSON string or dict)");
    }
}

void keylink_bang(t_keylink *x) {
    // Example: Output a test message
    outlet_anything(x->outlet, gensym("bang"), 0, NULL);
}

void keylink_dict(t_keylink *x, t_symbol *s) {
    // TODO: Convert Max dict to JSON and send over UDP multicast
    // Example: outlet_anything(x->outlet, gensym("dict_received"), 0, NULL);
}

void keylink_symbol(t_keylink *x, t_symbol *s) {
    // TODO: Parse JSON string and send over UDP multicast
    // Example: outlet_anything(x->outlet, gensym("symbol_received"), 0, NULL);
}

void keylink_start(t_keylink *x) {
    if (x->running) return;
    x->running = true;
    // Start network thread for UDP multicast and WebSocket bridging
    x->net_thread = std::thread([x]() {
        // TODO: Set up UDP multicast socket (asio or raw sockets)
        // TODO: Set up WebSocket server (optional)
        // TODO: Loop: receive messages, parse JSON, output to Max, forward as needed
        while (x->running) {
            // Placeholder: sleep
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
        // TODO: Clean up sockets
    });
}

void keylink_stop(t_keylink *x) {
    x->running = false;
    if (x->net_thread.joinable()) x->net_thread.join();
    // TODO: Clean up sockets
}

// --- End of starter keylink.cpp ---

// --- Integration Guidance ---
// To implement UDP multicast:
// 1. Add Asio to your project (standalone or Boost).
// 2. In keylink_start, create an Asio io_context and UDP socket.
// 3. Join the multicast group (KEYLINK_MULTICAST_ADDR, KEYLINK_UDP_PORT).
// 4. Use async_receive and async_send for non-blocking IO.
// 5. In keylink_dict/keylink_symbol, serialize to JSON and send via UDP.
// 6. On receive, parse JSON and output to Max (as dict or symbol).
//
// To implement JSON parsing:
// 1. Add nlohmann/json to your project.
// 2. Use json::parse() and json::dump() for serialization.
// 3. Convert Max dict to JSON and vice versa.
//
// To implement WebSocket bridging (optional):
// 1. Add uWebSockets or websocketpp to your project.
// 2. In keylink_start, start a WebSocket server on KEYLINK_WS_PORT.
// 3. Forward messages between UDP and WebSocket clients.
//
// See main.cpp for a simple UDP/JSON test harness.
// --- End Integration Guidance --- 