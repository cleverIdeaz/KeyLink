// keylink_safe.cpp - Safe KeyLink Max external (No Networking)
// Zero-config, local-only music data sync for Max
// Written using the Cycling '74 Max SDK
// (C) Neal Anderson, 2024

#include "ext.h"
#include "ext_obex.h"
#undef post
#undef error
#include <string>
#include <iostream>

// Struct for the Max object
typedef struct _keylink_safe {
    t_object ob;
    void *outlet;
    bool running;
    
} t_keylink_safe;

// Prototypes
void *keylink_safe_new(t_symbol *s, long argc, t_atom *argv);
void keylink_safe_free(t_keylink_safe *x);
void keylink_safe_assist(t_keylink_safe *x, void *b, long m, long a, char *s);
void keylink_safe_bang(t_keylink_safe *x);
void keylink_safe_symbol(t_keylink_safe *x, t_symbol *s);
void keylink_safe_start(t_keylink_safe *x);
void keylink_safe_stop(t_keylink_safe *x);

// Class pointer
static t_class *keylink_safe_class = NULL;

// Main entry point
extern "C" void ext_main(void *r) {
    t_class *c = class_new("keylink_safe", (method)keylink_safe_new, (method)keylink_safe_free, (long)sizeof(t_keylink_safe), 0L, A_GIMME, 0);
    class_addmethod(c, (method)keylink_safe_bang, "bang", 0);
    class_addmethod(c, (method)keylink_safe_symbol, "symbol", A_SYM, 0);
    class_addmethod(c, (method)keylink_safe_start, "start", 0);
    class_addmethod(c, (method)keylink_safe_stop, "stop", 0);
    class_addmethod(c, (method)keylink_safe_assist, "assist", A_CANT, 0);
    class_register(CLASS_BOX, c);
    keylink_safe_class = c;
}

void *keylink_safe_new(t_symbol *s, long argc, t_atom *argv) {
    t_keylink_safe *x = (t_keylink_safe *)object_alloc(keylink_safe_class);
    if (x) {
        x->outlet = outlet_new((t_object *)x, NULL);
        x->running = false;
        
        object_post((t_object *)x, "KeyLink Safe: Ready for local message handling");
    }
    return (x);
}

void keylink_safe_free(t_keylink_safe *x) {
    x->running = false;
}

void keylink_safe_assist(t_keylink_safe *x, void *b, long m, long a, char *s) {
    if (m == ASSIST_INLET) {
        sprintf(s, "Input (symbol, bang, start, stop)");
    } else {
        sprintf(s, "Output (JSON string)");
    }
}

void keylink_safe_bang(t_keylink_safe *x) {
    if (!x->running) return;
    
    // Send a simple ping message
    std::string msg = "{\"type\":\"ping\",\"source\":\"max_safe\"}";
    t_atom a;
    atom_setsym(&a, gensym(msg.c_str()));
    outlet_anything(x->outlet, gensym("json"), 1, &a);
    
    object_post((t_object *)x, "KeyLink Safe: Sent ping message");
}

void keylink_safe_symbol(t_keylink_safe *x, t_symbol *s) {
    if (!x->running) return;
    
    // Pass the symbol through
    t_atom a;
    atom_setsym(&a, s);
    outlet_anything(x->outlet, gensym("json"), 1, &a);
    
    object_post((t_object *)x, "KeyLink Safe: Sent message: %s", s->s_name);
}

void keylink_safe_start(t_keylink_safe *x) {
    x->running = true;
    object_post((t_object *)x, "KeyLink Safe: Started (local message handling only)");
}

void keylink_safe_stop(t_keylink_safe *x) {
    x->running = false;
    object_post((t_object *)x, "KeyLink Safe: Stopped");
}

// --- End of keylink_safe.cpp --- 