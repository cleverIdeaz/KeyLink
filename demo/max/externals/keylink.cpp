// keylink.cpp - KeyLink Max external (LAN + WAN modes)
// Zero-config music data sync for Max, browser, and more
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
#include <chrono>

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
void keylink_symbol(t_keylink *x, t_symbol *s);
void keylink_start(t_keylink *x);
void keylink_stop(t_keylink *x);
void keylink_mode(t_keylink *x, t_symbol *s);
void keylink_channel(t_keylink *x, t_symbol *s);
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
    class_addmethod(c, (method)keylink_symbol, "symbol", A_SYM, 0);
    class_addmethod(c, (method)keylink_start, "start", 0);
    class_addmethod(c, (method)keylink_stop, "stop", 0);
    class_addmethod(c, (method)keylink_mode, "mode", A_SYM, 0);
    class_addmethod(c, (method)keylink_channel, "channel", A_SYM, 0);
    class_addmethod(c, (method)keylink_assist, "assist", A_CANT, 0);
    class_register(CLASS_BOX, c);
    keylink_class = c;
}

void *keylink_new(t_symbol *s, long argc, t_atom *argv) {
    t_keylink *x = (t_keylink *)object_alloc(keylink_class);
    if (x) {
        x->outlet = outlet_new((t_object *)x, NULL);
        x->running = false;
        x->network_mode = MODE_LAN;
        x->channel = "__LAN__";
        x->ws_url = "ws://localhost:20801";
        x->last_sent_msg = "";
        x->last_sent_time = std::chrono::steady_clock::now();
        
        // Parse arguments
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
        
        object_post((t_object *)x, "KeyLink: Created in %s mode, channel: %s", 
                   x->network_mode == MODE_LAN ? "LAN" : "WAN", x->channel.c_str());
    }
    return (x);
}

void keylink_free(t_keylink *x) {
    x->running = false;
    if (x->net_thread.joinable()) x->net_thread.join();
    if (x->udp_socket) {
        x->udp_socket->close();
    }
    if (x->ws_socket) {
        x->ws_socket->close();
    }
}

void keylink_assist(t_keylink *x, void *b, long m, long a, char *s) {
    if (m == ASSIST_INLET) {
        sprintf(s, "Input (symbol, bang, start, stop, mode, channel)");
    } else {
        sprintf(s, "Output (JSON string)");
    }
}

void keylink_bang(t_keylink *x) {
    if (!x->running) return;
    
    // Send a ping message
    std::string msg = "{\"type\":\"ping\",\"source\":\"max\"}";
    send_message(x, msg);
}

void keylink_symbol(t_keylink *x, t_symbol *s) {
    if (!x->running) return;
    
    // Send the symbol as JSON
    send_message(x, s->s_name);
}

void keylink_mode(t_keylink *x, t_symbol *s) {
    std::string mode = s->s_name;
    if (mode == "lan" || mode == "LAN") {
        x->network_mode = MODE_LAN;
        x->ws_url = "ws://localhost:20801";
        object_post((t_object *)x, "KeyLink: Switched to LAN mode");
    } else if (mode == "wan" || mode == "WAN") {
        x->network_mode = MODE_WAN;
        x->ws_url = KEYLINK_WAN_WS_URL;
        object_post((t_object *)x, "KeyLink: Switched to WAN mode");
    }
}

void keylink_channel(t_keylink *x, t_symbol *s) {
    x->channel = s->s_name;
    object_post((t_object *)x, "KeyLink: Channel set to %s", x->channel.c_str());
}

void keylink_start(t_keylink *x) {
    if (x->running) return;
    x->running = true;
    
    // Create IO context
    x->io_ctx.reset(new asio::io_context());
    
    // Start network thread
    x->net_thread = std::thread([x]() {
        try {
            bool udp_ok = false;
            bool ws_ok = false;
            
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
                    udp_ok = true;
                } catch (const std::exception& e) {
                    object_post((t_object *)x, "KeyLink: UDP setup failed: %s", e.what());
                }
            }
            
            // Setup WebSocket client
            try {
                ws_connect(x);
                ws_ok = true;
            } catch (const std::exception& e) {
                object_post((t_object *)x, "KeyLink: WebSocket connection failed: %s", e.what());
                x->ws_connected = false;
            }
            
            // Report status
            if (!udp_ok && !ws_ok) {
                object_post((t_object *)x, "KeyLink: No network connections available");
            } else if (udp_ok && !ws_ok) {
                object_post((t_object *)x, "KeyLink: Running in UDP-only mode");
            } else {
                object_post((t_object *)x, "KeyLink: Running in full mode (UDP + WebSocket)");
            }
            
            // Run IO context
        while (x->running) {
                try {
                    x->io_ctx->run_for(std::chrono::milliseconds(50));
                } catch (const std::exception& e) {
                    object_error((t_object *)x, "KeyLink IO error: %s", e.what());
                }
            }
        } catch (const std::exception& e) {
            object_error((t_object *)x, "KeyLink network error: %s", e.what());
        }
    });
    
    object_post((t_object *)x, "KeyLink: started in %s mode", x->network_mode == MODE_LAN ? "LAN" : "WAN");
}

void keylink_stop(t_keylink *x) {
    x->running = false;
    if (x->net_thread.joinable()) x->net_thread.join();
    object_post((t_object *)x, "KeyLink: stopped");
}

void udp_do_receive(t_keylink *x) {
    if (!x->udp_socket) return;
    
    x->udp_socket->async_receive_from(
        asio::buffer(x->recv_buffer, sizeof(x->recv_buffer)),
        x->multicast_endpoint,
        [x](std::error_code ec, std::size_t bytes_recvd) {
            if (!ec && bytes_recvd > 0) {
                std::string msg(x->recv_buffer, bytes_recvd);
                
                // Prevent echo of our own messages
                if (!is_duplicate_message(x, msg)) {
                    // Output the message
                t_atom a;
                atom_setsym(&a, gensym(msg.c_str()));
                outlet_anything(x->outlet, gensym("json"), 1, &a);
                    object_post((t_object *)x, "KeyLink: Received UDP: %s", msg.c_str());
                }
                
                // Continue receiving
                udp_do_receive(x);
            } else if (x->running) {
                // Continue receiving even on error
                udp_do_receive(x);
            }
        }
    );
}

void ws_connect(t_keylink *x) {
    try {
        // Parse WebSocket URL
        std::regex ws_regex("ws://([^:/]+):([0-9]+)(/.*)?");
        std::smatch match;
        
        if (std::regex_match(x->ws_url, match, ws_regex)) {
            x->ws_host = match[1].str();
            x->ws_port = std::stoi(match[2].str());
            x->ws_path = match[3].str();
            if (x->ws_path.empty()) x->ws_path = "/";
        } else {
            object_post((t_object *)x, "KeyLink: Invalid WebSocket URL: %s", x->ws_url.c_str());
            return;
        }
        
        object_post((t_object *)x, "KeyLink: Attempting WebSocket connection to %s:%d%s", 
                   x->ws_host.c_str(), x->ws_port, (x->ws_path + x->channel).c_str());
        
        // Create socket
        x->ws_socket.reset(new asio::ip::tcp::socket(*x->io_ctx));
        
        // Resolve hostname
        asio::ip::tcp::resolver resolver(*x->io_ctx);
        auto endpoints = resolver.resolve(x->ws_host, std::to_string(x->ws_port));
        
        object_post((t_object *)x, "KeyLink: Resolved hostname, attempting connection...");
        
        // Connect
        asio::connect(*x->ws_socket, endpoints);
        
        object_post((t_object *)x, "KeyLink: TCP connection established, sending WebSocket handshake...");
        
        // Send WebSocket handshake
        std::string ws_key = "dGhlIHNhbXBsZSBub25jZQ=="; // Base64 encoded
        std::string handshake = 
            "GET " + x->ws_path + x->channel + " HTTP/1.1\r\n"
            "Host: " + x->ws_host + "\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            "Sec-WebSocket-Key: " + ws_key + "\r\n"
            "Sec-WebSocket-Version: 13\r\n"
            "\r\n";
        
        object_post((t_object *)x, "KeyLink: Sending handshake: %s", handshake.c_str());
        
        asio::write(*x->ws_socket, asio::buffer(handshake));
        
        // Read response
        char response[1024];
        size_t len = x->ws_socket->read_some(asio::buffer(response, sizeof(response)));
        
        if (len > 0) {
            std::string resp(response, len);
            object_post((t_object *)x, "KeyLink: Received response: %s", resp.c_str());
            
            if (resp.find("101 Switching Protocols") != std::string::npos) {
                x->ws_connected = true;
                object_post((t_object *)x, "KeyLink: WebSocket connected to %s%s", x->ws_url.c_str(), x->channel.c_str());
                
                // Start reading WebSocket messages
                ws_read(x);
            } else {
                object_post((t_object *)x, "KeyLink: WebSocket handshake failed - no 101 response");
                x->ws_connected = false;
            }
        } else {
            object_post((t_object *)x, "KeyLink: WebSocket handshake failed - no response received");
            x->ws_connected = false;
        }
    } catch (const std::exception& e) {
        object_post((t_object *)x, "KeyLink: WebSocket connection failed: %s", e.what());
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
        
        // Add payload
        frame.insert(frame.end(), msg.begin(), msg.end());
        
        asio::write(*x->ws_socket, asio::buffer(frame));
    } catch (const std::exception& e) {
        object_post((t_object *)x, "KeyLink: WebSocket send failed: %s", e.what());
        x->ws_connected = false;
    }
}

void ws_read(t_keylink *x) {
    if (!x->ws_socket) return;
    
    x->ws_socket->async_read_some(
        asio::buffer(x->recv_buffer, sizeof(x->recv_buffer)),
        [x](std::error_code ec, std::size_t bytes_recvd) {
            if (!ec && bytes_recvd > 0) {
                // Simple WebSocket frame parsing
                if (bytes_recvd >= 2) {
                    uint8_t opcode = x->recv_buffer[0] & 0x0F;
                    uint8_t payload_len = x->recv_buffer[1] & 0x7F;
                    size_t header_len = 2;
                    
                    if (payload_len == 126) {
                        header_len = 4;
                        payload_len = (x->recv_buffer[2] << 8) | x->recv_buffer[3];
                    } else if (payload_len == 127) {
                        header_len = 10;
                        payload_len = 0;
                        for (int i = 0; i < 8; i++) {
                            payload_len = (payload_len << 8) | x->recv_buffer[2 + i];
                        }
                    }
                    
                    if (opcode == 0x1 && bytes_recvd >= header_len + payload_len) {
                        std::string msg(x->recv_buffer + header_len, payload_len);
                        
                        // Prevent echo of our own messages
                        if (!is_duplicate_message(x, msg)) {
                            // Output the message
                            t_atom a;
                            atom_setsym(&a, gensym(msg.c_str()));
                            outlet_anything(x->outlet, gensym("json"), 1, &a);
                            object_post((t_object *)x, "KeyLink: Received WebSocket: %s", msg.c_str());
                        }
                    }
                }
                
                // Continue reading
                ws_read(x);
            } else if (x->running) {
                // Continue reading even on error
                ws_read(x);
            }
        }
    );
}

void send_message(t_keylink *x, const std::string& msg) {
    if (!x->running) return;
    
    // Prevent duplicate messages
    if (is_duplicate_message(x, msg)) return;
    
    // Send via UDP if available
    if (x->udp_socket && x->udp_socket->is_open()) {
        try {
            x->udp_socket->async_send_to(
                asio::buffer(msg),
                x->multicast_endpoint,
                [](std::error_code ec, std::size_t bytes_sent) {
                    if (ec) {
                        // Silent error - UDP might be offline
                    }
                }
            );
        } catch (const std::exception& e) {
            object_post((t_object *)x, "KeyLink: UDP send failed: %s", e.what());
        }
    }
    
    // Send via WebSocket if available
    if (x->ws_connected) {
        ws_send(x, msg);
    }
    
    // Update tracking
    x->last_sent_msg = msg;
    x->last_sent_time = std::chrono::steady_clock::now();
}

bool is_duplicate_message(t_keylink *x, const std::string& msg) {
    auto now = std::chrono::steady_clock::now();
    auto time_diff = std::chrono::duration_cast<std::chrono::milliseconds>(now - x->last_sent_time).count();
    
    // Check if this is the same message sent recently
    if (msg == x->last_sent_msg && time_diff < 100) {
        return true;
    }
    
    return false;
}

// --- End of keylink.cpp --- 