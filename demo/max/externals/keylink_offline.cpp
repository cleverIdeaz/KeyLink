// keylink_offline.cpp - KeyLink Max external (Offline Only Version)
// Zero-config, offline music data sync for Max
// Written using the Cycling '74 Max SDK
// (C) Neal Anderson, 2024

#include "ext.h"
#include "ext_obex.h"
#undef post
#undef error
#include <string>
#include <atomic>
#include <iostream>
#include "thirdparty/json.hpp"
#include <memory>
#include <chrono>

// Struct for the Max object
typedef struct _keylink_offline {
    t_object ob;
    void *outlet;
    std::atomic<bool> running;
    
    // Message tracking to prevent loops
    std::string last_sent_msg;
    std::chrono::steady_clock::time_point last_sent_time;
    
} t_keylink_offline;

// Prototypes
void *keylink_offline_new(t_symbol *s, long argc, t_atom *argv);
void keylink_offline_free(t_keylink_offline *x);
void keylink_offline_assist(t_keylink_offline *x, void *b, long m, long a, char *s);
void keylink_offline_bang(t_keylink_offline *x);
void keylink_offline_dict(t_keylink_offline *x, t_symbol *s);
void keylink_offline_symbol(t_keylink_offline *x, t_symbol *s);
void keylink_offline_start(t_keylink_offline *x);
void keylink_offline_stop(t_keylink_offline *x);
void keylink_offline_send_message(t_keylink_offline *x, const std::string& msg);
bool keylink_offline_is_duplicate_message(t_keylink_offline *x, const std::string& msg);

// Class pointer
static t_class *keylink_offline_class = NULL;

// Main entry point
extern "C" void ext_main(void *r) {
    t_class *c = class_new("keylink_offline", (method)keylink_offline_new, (method)keylink_offline_free, (long)sizeof(t_keylink_offline), 0L, A_GIMME, 0);
    class_addmethod(c, (method)keylink_offline_bang, "bang", 0);
    class_addmethod(c, (method)keylink_offline_dict, "dictionary", A_SYM, 0);
    class_addmethod(c, (method)keylink_offline_symbol, "symbol", A_SYM, 0);
    class_addmethod(c, (method)keylink_offline_start, "start", 0);
    class_addmethod(c, (method)keylink_offline_stop, "stop", 0);
    class_addmethod(c, (method)keylink_offline_assist, "assist", A_CANT, 0);
    class_register(CLASS_BOX, c);
    keylink_offline_class = c;
}

void *keylink_offline_new(t_symbol *s, long argc, t_atom *argv) {
    t_keylink_offline *x = (t_keylink_offline *)object_alloc(keylink_offline_class);
    if (x) {
        x->outlet = outlet_new((t_object *)x, NULL);
        x->running = false;
        x->last_sent_msg = "";
        x->last_sent_time = std::chrono::steady_clock::now();
        
        object_post((t_object *)x, "KeyLink Offline: Ready for local message handling");
    }
    return (x);
}

void keylink_offline_free(t_keylink_offline *x) {
    x->running = false;
}

void keylink_offline_assist(t_keylink_offline *x, void *b, long m, long a, char *s) {
    if (m == ASSIST_INLET) {
        sprintf(s, "Input (dict, symbol, bang, start, stop)");
    } else {
        sprintf(s, "Output (JSON string)");
    }
}

void keylink_offline_bang(t_keylink_offline *x) {
    // Send a ping message
    nlohmann::json ping = {
        {"type", "ping"},
        {"source", "max_offline"},
        {"timestamp", std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()).count()}
    };
    keylink_offline_send_message(x, ping.dump());
}

void keylink_offline_dict(t_keylink_offline *x, t_symbol *s) {
    // Convert dict to JSON and send
    nlohmann::json msg = {
        {"type", "set-state"},
        {"state", {
            {"key", "C"},
            {"mode", "Ionian"},
            {"tempo", 120}
        }},
        {"source", "max_offline"},
        {"timestamp", std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()).count()}
    };
    keylink_offline_send_message(x, msg.dump());
}

void keylink_offline_symbol(t_keylink_offline *x, t_symbol *s) {
    // Send the JSON string directly
    keylink_offline_send_message(x, s->s_name);
}

void keylink_offline_start(t_keylink_offline *x) {
    x->running = true;
    object_post((t_object *)x, "KeyLink Offline: Started (local message handling only)");
}

void keylink_offline_stop(t_keylink_offline *x) {
    x->running = false;
    object_post((t_object *)x, "KeyLink Offline: Stopped");
}

bool keylink_offline_is_duplicate_message(t_keylink_offline *x, const std::string& msg) {
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

void keylink_offline_send_message(t_keylink_offline *x, const std::string& msg) {
    if (!x->running) return;
    
    // Prevent duplicate messages
    if (keylink_offline_is_duplicate_message(x, msg)) {
        return;
    }
    
    // Output locally (for recursive handling)
    t_atom a;
    atom_setsym(&a, gensym(msg.c_str()));
    outlet_anything(x->outlet, gensym("json"), 1, &a);
    
    object_post((t_object *)x, "KeyLink Offline: Sent message locally");
}

// --- End of keylink_offline.cpp --- 