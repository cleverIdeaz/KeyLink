// keylink.h - Header for KeyLink Max external
#pragma once

#include "ext.h"
#include "ext_obex.h"
#include <thread>
#include <atomic>

// Struct for the Max object
typedef struct _keylink {
    t_object ob;
    void *outlet;
    std::thread net_thread;
    std::atomic<bool> running;
    // Add UDP socket, WebSocket server, etc. here
} t_keylink;

void *keylink_new(t_symbol *s, long argc, t_atom *argv);
void keylink_free(t_keylink *x);
void keylink_assist(t_keylink *x, void *b, long m, long a, char *s);
void keylink_bang(t_keylink *x);
void keylink_dict(t_keylink *x, t_symbol *s);
void keylink_symbol(t_keylink *x, t_symbol *s);
void keylink_start(t_keylink *x);
void keylink_stop(t_keylink *x); 