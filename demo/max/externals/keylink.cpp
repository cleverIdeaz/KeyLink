// keylink.cpp - Starter for KeyLink Max external
// All dependencies are local (thirdparty/asio, thirdparty/json.hpp) - no global install needed
// Zero-config, cross-platform music data sync for Max, browser, and more
// Written using the Cycling '74 Max SDK
// (C) Neal Anderson, 2024

#define ASIO_STANDALONE
#include "ext.h"
#include "ext_obex.h"
#undef post
#undef error
#include <string>
#include <thread>
#include <atomic>
#include <iostream>
#include <vector>
#include <mutex>
#include <condition_variable>
#include "asio.hpp"
#include "thirdparty/json.hpp"
#include <memory>
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
    // Networking
    std::unique_ptr<asio::io_context> io_ctx;
    std::unique_ptr<asio::ip::udp::socket> udp_socket;
    asio::ip::udp::endpoint multicast_endpoint;
    char recv_buffer[2048];
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
void udp_do_receive(t_keylink *x);

// Class pointer
static t_class *keylink_class = NULL;

// Main entry point
extern "C" void ext_main(void *r) {
    t_class *c = class_new("keylink", (method)keylink_new, (method)keylink_free, (long)sizeof(t_keylink), 0L, A_GIMME, 0);
    class_addmethod(c, (method)keylink_bang, "bang", 0);
    class_addmethod(c, (method)keylink_dict, "dictionary", A_SYM, 0);
    class_addmethod(c, (method)keylink_symbol, "symbol", A_SYM, 0);
    class_addmethod(c, (method)keylink_start, "start", 0);
    class_addmethod(c, (method)keylink_stop, "stop", 0);
    class_addmethod(c, (method)keylink_assist, "assist", A_CANT, 0);
    class_register(CLASS_BOX, c);
    keylink_class = c;
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
    if (x->udp_socket) {
        x->udp_socket->close();
        x->udp_socket.reset();
    }
    if (x->io_ctx) {
        x->io_ctx->stop();
        x->io_ctx.reset();
    }
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
    // Notify user that direct dict support is not available in this SDK
    object_post((t_object *)x, "Dictionary input not supported in this version of the Max SDK. Use [tosymbol] to send JSON as a symbol.");
}

void keylink_symbol(t_keylink *x, t_symbol *s) {
    // Pass the symbol (JSON string) through locally
    t_atom a;
    atom_setsym(&a, s);
    outlet_anything(x->outlet, gensym("json"), 1, &a);
    // Send over UDP multicast
    if (x->udp_socket && x->udp_socket->is_open()) {
        std::string msg = s->s_name;
        x->udp_socket->async_send_to(
            asio::buffer(msg),
            x->multicast_endpoint,
            [](std::error_code, std::size_t){}
        );
    }
}

void keylink_start(t_keylink *x) {
    if (x->running) return;
    x->running = true;
    x->io_ctx.reset(new asio::io_context());
    x->udp_socket.reset(new asio::ip::udp::socket(*x->io_ctx));
    asio::ip::udp::endpoint listen_ep(asio::ip::udp::v4(), KEYLINK_UDP_PORT);
    x->udp_socket->open(listen_ep.protocol());
    x->udp_socket->set_option(asio::ip::udp::socket::reuse_address(true));
    x->udp_socket->bind(listen_ep);
    // Join multicast group
    asio::ip::address multicast_addr = asio::ip::make_address(KEYLINK_MULTICAST_ADDR);
    x->udp_socket->set_option(asio::ip::multicast::join_group(multicast_addr));
    x->multicast_endpoint = asio::ip::udp::endpoint(multicast_addr, KEYLINK_UDP_PORT);
    // Start network thread
    x->net_thread = std::thread([x]() {
        udp_do_receive(x);
        while (x->running) {
            x->io_ctx->run_for(std::chrono::milliseconds(100));
        }
    });
}

void udp_do_receive(t_keylink *x) {
    if (!x->udp_socket || !x->udp_socket->is_open()) return;
    x->udp_socket->async_receive_from(
        asio::buffer(x->recv_buffer, sizeof(x->recv_buffer)),
        x->multicast_endpoint,
        [x](std::error_code ec, std::size_t bytes_recvd) {
            if (!ec && bytes_recvd > 0 && x->running) {
                std::string msg(x->recv_buffer, bytes_recvd);
                t_atom a;
                atom_setsym(&a, gensym(msg.c_str()));
                outlet_anything(x->outlet, gensym("json"), 1, &a);
            }
            if (x->running) udp_do_receive(x);
        }
    );
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