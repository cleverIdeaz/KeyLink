// keylink.cpp - Enhanced KeyLink Max external
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
#include <regex>

// Default network settings
#define KEYLINK_MULTICAST_ADDR "239.255.0.1"
#define KEYLINK_UDP_PORT 7474
#define KEYLINK_WS_PORT 20801
#define KEYLINK_WAN_WS_URL "wss://keylink-relay.fly.dev/"

// Network modes
enum NetworkMode {
    MODE_LAN = 0,
    MODE_WAN = 1
};

// Struct for the Max object
typedef struct _keylink {
    t_object ob;
    void *outlet;
    void *mode_outlet;  // For mode status
    std::thread net_thread;
    std::atomic<bool> running;
    
    // Network mode and channel
    NetworkMode network_mode;
    std::string channel;
    std::string ws_url;
    
    // Networking
    std::unique_ptr<asio::io_context> io_ctx;
    std::unique_ptr<asio::ip::udp::socket> udp_socket;
    asio::ip::udp::endpoint multicast_endpoint;
    char recv_buffer[2048];
    
    // WebSocket client
    std::unique_ptr<asio::ip::tcp::socket> ws_socket;
    std::string ws_host;
    std::string ws_path;
    int ws_port;
    bool ws_connected;
    
    // Message tracking to prevent loops
    std::string last_sent_msg;
    std::chrono::steady_clock::time_point last_sent_time;
    
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
void keylink_mode(t_keylink *x, t_symbol *s);
void keylink_channel(t_keylink *x, t_symbol *s);
void keylink_url(t_keylink *x, t_symbol *s);
void udp_do_receive(t_keylink *x);
void ws_connect(t_keylink *x);
void ws_send(t_keylink *x, const std::string& msg);
void ws_read(t_keylink *x);
void send_message(t_keylink *x, const std::string& msg);
bool is_duplicate_message(t_keylink *x, const std::string& msg);

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
    class_addmethod(c, (method)keylink_mode, "mode", A_SYM, 0);
    class_addmethod(c, (method)keylink_channel, "channel", A_SYM, 0);
    class_addmethod(c, (method)keylink_url, "url", A_SYM, 0);
    class_addmethod(c, (method)keylink_assist, "assist", A_CANT, 0);
    class_register(CLASS_BOX, c);
    keylink_class = c;
}

void *keylink_new(t_symbol *s, long argc, t_atom *argv) {
    t_keylink *x = (t_keylink *)object_alloc(keylink_class);
    if (x) {
        x->outlet = outlet_new((t_object *)x, NULL);
        x->mode_outlet = outlet_new((t_object *)x, NULL);
        x->running = false;
        x->network_mode = MODE_LAN;
        x->channel = "__LAN__";
        x->ws_url = "ws://localhost:20801";
        x->ws_connected = false;
        x->last_sent_msg = "";
        x->last_sent_time = std::chrono::steady_clock::now();
        
        // Parse arguments: [keylink mode channel url]
        if (argc >= 1) {
            if (atom_gettype(argv) == A_SYM) {
                std::string mode = atom_getsym(argv)->s_name;
                if (mode == "wan" || mode == "WAN") {
                    x->network_mode = MODE_WAN;
                    x->ws_url = KEYLINK_WAN_WS_URL;
                } else if (mode == "lan" || mode == "LAN") {
                    x->network_mode = MODE_LAN;
                    x->ws_url = "ws://localhost:20801";
                }
            }
        }
        if (argc >= 2) {
            if (atom_gettype(argv + 1) == A_SYM) {
                x->channel = atom_getsym(argv + 1)->s_name;
            }
        }
        if (argc >= 3) {
            if (atom_gettype(argv + 2) == A_SYM) {
                x->ws_url = atom_getsym(argv + 2)->s_name;
            }
        }
        
        object_post((t_object *)x, "KeyLink: mode=%s, channel=%s, url=%s", 
                   x->network_mode == MODE_LAN ? "LAN" : "WAN", 
                   x->channel.c_str(), x->ws_url.c_str());
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
    if (x->ws_socket) {
        x->ws_socket->close();
        x->ws_socket.reset();
    }
    if (x->io_ctx) {
        x->io_ctx->stop();
        x->io_ctx.reset();
    }
}

void keylink_assist(t_keylink *x, void *b, long m, long a, char *s) {
    if (m == ASSIST_INLET) {
        sprintf(s, "Input (dict, symbol, bang, start, stop, mode, channel, url)");
    } else if (a == 0) {
        sprintf(s, "Output (JSON string or dict)");
    } else {
        sprintf(s, "Status (mode, connection)");
    }
}

void keylink_bang(t_keylink *x) {
    // Send a ping message
    nlohmann::json ping = {
        {"type", "ping"},
        {"source", "max"},
        {"timestamp", std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()).count()}
    };
    send_message(x, ping.dump());
}

void keylink_dict(t_keylink *x, t_symbol *s) {
    // Convert dict to JSON and send
    // For now, create a simple JSON message
    nlohmann::json msg = {
        {"type", "set-state"},
        {"state", {
            {"key", "C"},
            {"mode", "Ionian"},
            {"tempo", 120}
        }},
        {"source", "max"},
        {"timestamp", std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()).count()}
    };
    send_message(x, msg.dump());
}

void keylink_symbol(t_keylink *x, t_symbol *s) {
    // Send the JSON string directly
    send_message(x, s->s_name);
}

void keylink_mode(t_keylink *x, t_symbol *s) {
    std::string mode = s->s_name;
    if (mode == "lan" || mode == "LAN") {
        x->network_mode = MODE_LAN;
        x->ws_url = "ws://localhost:20801";
    } else if (mode == "wan" || mode == "WAN") {
        x->network_mode = MODE_WAN;
        x->ws_url = KEYLINK_WAN_WS_URL;
    }
    
    // Restart connection if running
    if (x->running) {
        keylink_stop(x);
        keylink_start(x);
    }
    
    object_post((t_object *)x, "KeyLink: switched to %s mode", mode.c_str());
    
    // Output mode status
    t_atom a;
    atom_setsym(&a, gensym(mode.c_str()));
    outlet_anything(x->mode_outlet, gensym("mode"), 1, &a);
}

void keylink_channel(t_keylink *x, t_symbol *s) {
    x->channel = s->s_name;
    object_post((t_object *)x, "KeyLink: channel set to %s", x->channel.c_str());
}

void keylink_url(t_keylink *x, t_symbol *s) {
    x->ws_url = s->s_name;
    object_post((t_object *)x, "KeyLink: WebSocket URL set to %s", x->ws_url.c_str());
}

void keylink_start(t_keylink *x) {
    if (x->running) return;
    x->running = true;
    x->io_ctx.reset(new asio::io_context());
    
    // Start network thread
    x->net_thread = std::thread([x]() {
        try {
            // Setup UDP for LAN mode
            if (x->network_mode == MODE_LAN) {
                try {
                    x->udp_socket.reset(new asio::ip::udp::socket(*x->io_ctx));
                    asio::ip::udp::endpoint listen_ep(asio::ip::udp::v4(), KEYLINK_UDP_PORT);
                    x->udp_socket->open(listen_ep.protocol());
                    x->udp_socket->set_option(asio::ip::udp::socket::reuse_address(true));
                    x->udp_socket->bind(listen_ep);
                    
                    // Join multicast group
                    asio::ip::address multicast_addr = asio::ip::make_address(KEYLINK_MULTICAST_ADDR);
                    x->udp_socket->set_option(asio::ip::multicast::join_group(multicast_addr));
                    x->multicast_endpoint = asio::ip::udp::endpoint(multicast_addr, KEYLINK_UDP_PORT);
                    
                    udp_do_receive(x);
                    object_post((t_object *)x, "KeyLink: UDP multicast started on %s:%d", KEYLINK_MULTICAST_ADDR, KEYLINK_UDP_PORT);
                } catch (const std::exception& e) {
                    object_error((t_object *)x, "KeyLink: UDP setup failed (offline?): %s", e.what());
                    // Continue without UDP - WebSocket might still work
                }
            }
            
            // Setup WebSocket client
            ws_connect(x);
            
            // Run IO context
            while (x->running) {
                try {
                    x->io_ctx->run_for(std::chrono::milliseconds(100));
                } catch (const std::exception& e) {
                    object_error((t_object *)x, "KeyLink IO error: %s", e.what());
                    // Continue running unless explicitly stopped
                }
            }
        } catch (const std::exception& e) {
            object_error((t_object *)x, "KeyLink network error: %s", e.what());
        }
    });
    
    object_post((t_object *)x, "KeyLink: started in %s mode", x->network_mode == MODE_LAN ? "LAN" : "WAN");
}

void udp_do_receive(t_keylink *x) {
    if (!x->udp_socket || !x->udp_socket->is_open()) return;
    x->udp_socket->async_receive_from(
        asio::buffer(x->recv_buffer, sizeof(x->recv_buffer)),
        x->multicast_endpoint,
        [x](std::error_code ec, std::size_t bytes_recvd) {
            if (!ec && bytes_recvd > 0 && x->running) {
                std::string msg(x->recv_buffer, bytes_recvd);
                
                // Prevent echo (don't output messages we just sent)
                if (!is_duplicate_message(x, msg)) {
                    t_atom a;
                    atom_setsym(&a, gensym(msg.c_str()));
                    outlet_anything(x->outlet, gensym("json"), 1, &a);
                }
            }
            if (x->running) udp_do_receive(x);
        }
    );
}

void ws_connect(t_keylink *x) {
    try {
        // Parse WebSocket URL
        std::string url = x->ws_url;
        
        // Handle different URL formats
        std::string host, path;
        int port;
        
        if (url.find("ws://") == 0) {
            url = url.substr(5);
        } else if (url.find("wss://") == 0) {
            url = url.substr(6);
        }
        
        size_t slash_pos = url.find('/');
        if (slash_pos != std::string::npos) {
            host = url.substr(0, slash_pos);
            path = url.substr(slash_pos);
        } else {
            host = url;
            path = "/";
        }
        
        size_t colon_pos = host.find(':');
        if (colon_pos != std::string::npos) {
            port = std::stoi(host.substr(colon_pos + 1));
            host = host.substr(0, colon_pos);
        } else {
            port = 80; // Default for ws://
        }
        
        x->ws_host = host;
        x->ws_path = path;
        x->ws_port = port;
        
        // Create TCP socket
        x->ws_socket.reset(new asio::ip::tcp::socket(*x->io_ctx));
        
        // Resolve hostname
        asio::ip::tcp::resolver resolver(*x->io_ctx);
        auto endpoints = resolver.resolve(x->ws_host, std::to_string(x->ws_port));
        
        // Connect
        asio::connect(*x->ws_socket, endpoints);
        
        // Generate WebSocket key
        std::string ws_key = "dGhlIHNhbXBsZSBub25jZQ=="; // Base64 encoded
        
        // Send WebSocket handshake
        std::string handshake = 
            "GET " + x->ws_path + x->channel + " HTTP/1.1\r\n"
            "Host: " + x->ws_host + "\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            "Sec-WebSocket-Key: " + ws_key + "\r\n"
            "Sec-WebSocket-Version: 13\r\n"
            "\r\n";
        
        asio::write(*x->ws_socket, asio::buffer(handshake));
        
        // Read response
        char response[1024];
        size_t len = x->ws_socket->read_some(asio::buffer(response, sizeof(response)));
        
        if (len > 0) {
            std::string resp(response, len);
            if (resp.find("101 Switching Protocols") != std::string::npos) {
                x->ws_connected = true;
                object_post((t_object *)x, "KeyLink: WebSocket connected to %s%s", x->ws_url.c_str(), x->channel.c_str());
                
                // Start reading WebSocket messages
                ws_read(x);
            } else {
                object_error((t_object *)x, "KeyLink: WebSocket handshake failed");
                x->ws_connected = false;
            }
        }
    } catch (const std::exception& e) {
        object_error((t_object *)x, "KeyLink WebSocket connection failed: %s", e.what());
        x->ws_connected = false;
    }
}

void ws_send(t_keylink *x, const std::string& msg) {
    if (!x->ws_connected || !x->ws_socket) return;
    
    try {
        // Simple WebSocket frame (no masking for client)
        std::vector<uint8_t> frame;
        frame.push_back(0x81); // FIN + text frame
        
        if (msg.length() < 126) {
            frame.push_back(msg.length());
        } else if (msg.length() < 65536) {
            frame.push_back(126);
            frame.push_back((msg.length() >> 8) & 0xFF);
            frame.push_back(msg.length() & 0xFF);
        } else {
            frame.push_back(127);
            for (int i = 7; i >= 0; i--) {
                frame.push_back((msg.length() >> (i * 8)) & 0xFF);
            }
        }
        
        frame.insert(frame.end(), msg.begin(), msg.end());
        
        asio::write(*x->ws_socket, asio::buffer(frame));
    } catch (const std::exception& e) {
        object_error((t_object *)x, "KeyLink WebSocket send failed: %s", e.what());
        x->ws_connected = false;
    }
}

void ws_read(t_keylink *x) {
    if (!x->ws_connected || !x->ws_socket) return;
    
    x->ws_socket->async_read_some(
        asio::buffer(x->recv_buffer, sizeof(x->recv_buffer)),
        [x](std::error_code ec, std::size_t bytes_recvd) {
            if (!ec && bytes_recvd > 0 && x->running) {
                // Parse WebSocket frame (simplified)
                if (bytes_recvd >= 2) {
                    uint8_t opcode = x->recv_buffer[0] & 0x0F;
                    bool masked = (x->recv_buffer[1] & 0x80) != 0;
                    uint64_t payload_len = x->recv_buffer[1] & 0x7F;
                    
                    size_t header_len = 2;
                    if (payload_len == 126) {
                        payload_len = (x->recv_buffer[2] << 8) | x->recv_buffer[3];
                        header_len = 4;
                    } else if (payload_len == 127) {
                        payload_len = 0;
                        for (int i = 0; i < 8; i++) {
                            payload_len = (payload_len << 8) | x->recv_buffer[2 + i];
                        }
                        header_len = 10;
                    }
                    
                    if (opcode == 0x01 && payload_len > 0) { // Text frame
                        std::string msg(x->recv_buffer + header_len, payload_len);
                        
                        // Prevent echo
                        if (!is_duplicate_message(x, msg)) {
                            t_atom a;
                            atom_setsym(&a, gensym(msg.c_str()));
                            outlet_anything(x->outlet, gensym("json"), 1, &a);
                        }
                    }
                }
                
                if (x->running) ws_read(x);
            } else {
                x->ws_connected = false;
                object_post((t_object *)x, "KeyLink: WebSocket disconnected");
            }
        }
    );
}

void keylink_stop(t_keylink *x) {
    x->running = false;
    if (x->net_thread.joinable()) x->net_thread.join();
    if (x->udp_socket) {
        x->udp_socket->close();
        x->udp_socket.reset();
    }
    if (x->ws_socket) {
        x->ws_socket->close();
        x->ws_socket.reset();
    }
    if (x->io_ctx) {
        x->io_ctx->stop();
        x->io_ctx.reset();
    }
    x->ws_connected = false;
    object_post((t_object *)x, "KeyLink: stopped");
}

bool is_duplicate_message(t_keylink *x, const std::string& msg) {
    auto now = std::chrono::steady_clock::now();
    auto time_diff = std::chrono::duration_cast<std::chrono::milliseconds>(now - x->last_sent_time).count();
    
    // Check if this is the same message sent recently (within 100ms)
    if (msg == x->last_sent_msg && time_diff < 100) {
        return true;
    }
    
    x->last_sent_msg = msg;
    x->last_sent_time = now;
    return false;
}

void send_message(t_keylink *x, const std::string& msg) {
    if (!x->running) return;
    
    // Prevent duplicate messages
    if (is_duplicate_message(x, msg)) {
        return;
    }
    
    // Send via UDP (LAN mode)
    if (x->network_mode == MODE_LAN && x->udp_socket && x->udp_socket->is_open()) {
        x->udp_socket->async_send_to(
            asio::buffer(msg),
            x->multicast_endpoint,
            [](std::error_code ec, std::size_t bytes_sent) {
                if (ec) {
                    // Error handling would go here
                }
            }
        );
    }
    
    // Send via WebSocket
    if (x->ws_connected) {
        ws_send(x, msg);
    }
    
    // Output locally (for recursive handling)
    t_atom a;
    atom_setsym(&a, gensym(msg.c_str()));
    outlet_anything(x->outlet, gensym("json"), 1, &a);
}

// --- End of enhanced keylink.cpp ---

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