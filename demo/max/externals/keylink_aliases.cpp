// keylink_aliases.cpp - KeyLink Alias Resolution for Max/MSP
// Provides standardized naming conventions and alias resolution
// (C) Neal Anderson, 2024

#define ASIO_STANDALONE
#include "ext.h"
#include "ext_obex.h"
#undef post
#undef error
#include <string>
#include <map>
#include <vector>
#include <algorithm>
#include <cctype>
#include "thirdparty/json.hpp"

using json = nlohmann::json;

// Alias resolution maps
static std::map<std::string, std::string> root_note_aliases;
static std::map<std::string, std::string> mode_aliases;
static std::map<std::string, std::string> chord_type_aliases;
static std::map<std::string, std::vector<int>> note_pattern_aliases;
static bool aliases_initialized = false;

// Initialize alias maps
void initialize_aliases() {
    if (aliases_initialized) return;
    
    // Root note aliases
    root_note_aliases["do"] = "C";
    root_note_aliases["re"] = "D";
    root_note_aliases["mi"] = "E";
    root_note_aliases["fa"] = "F";
    root_note_aliases["sol"] = "G";
    root_note_aliases["la"] = "A";
    root_note_aliases["si"] = "B";
    
    root_note_aliases["db"] = "C#";
    root_note_aliases["eb"] = "D#";
    root_note_aliases["gb"] = "F#";
    root_note_aliases["ab"] = "G#";
    root_note_aliases["bb"] = "A#";
    
    root_note_aliases["cis"] = "C#";
    root_note_aliases["dis"] = "D#";
    root_note_aliases["fis"] = "F#";
    root_note_aliases["gis"] = "G#";
    root_note_aliases["ais"] = "A#";
    
    root_note_aliases["des"] = "C#";
    root_note_aliases["es"] = "D#";
    root_note_aliases["ges"] = "F#";
    root_note_aliases["as"] = "G#";
    root_note_aliases["b"] = "A#";
    
    // Mode aliases
    mode_aliases["maj"] = "major";
    mode_aliases["m"] = "major";
    mode_aliases["ionian"] = "major";
    mode_aliases["dur"] = "major";
    
    mode_aliases["min"] = "minor";
    mode_aliases["aeolian"] = "minor";
    mode_aliases["moll"] = "minor";
    mode_aliases["natural minor"] = "minor";
    
    mode_aliases["dorian"] = "dorian";
    mode_aliases["phrygian"] = "phrygian";
    mode_aliases["lydian"] = "lydian";
    mode_aliases["mixolydian"] = "mixolydian";
    mode_aliases["locrian"] = "locrian";
    
    mode_aliases["harmonic minor"] = "harmonic_minor";
    mode_aliases["harmonic_minor"] = "harmonic_minor";
    mode_aliases["melodic minor"] = "melodic_minor";
    mode_aliases["melodic_minor"] = "melodic_minor";
    
    mode_aliases["major pentatonic"] = "pentatonic_major";
    mode_aliases["pentatonic major"] = "pentatonic_major";
    mode_aliases["minor pentatonic"] = "pentatonic_minor";
    mode_aliases["pentatonic minor"] = "pentatonic_minor";
    
    mode_aliases["blues"] = "blues";
    mode_aliases["blues scale"] = "blues";
    mode_aliases["whole tone"] = "whole_tone";
    mode_aliases["whole_tone"] = "whole_tone";
    mode_aliases["chromatic"] = "chromatic";
    
    // Chord type aliases
    chord_type_aliases["major"] = "maj";
    chord_type_aliases["major triad"] = "maj";
    chord_type_aliases["major_triad"] = "maj";
    
    chord_type_aliases["minor"] = "min";
    chord_type_aliases["minor triad"] = "min";
    chord_type_aliases["minor_triad"] = "min";
    
    chord_type_aliases["diminished"] = "dim";
    chord_type_aliases["diminished triad"] = "dim";
    chord_type_aliases["diminished_triad"] = "dim";
    
    chord_type_aliases["augmented"] = "aug";
    chord_type_aliases["augmented triad"] = "aug";
    chord_type_aliases["augmented_triad"] = "aug";
    
    chord_type_aliases["suspended second"] = "sus2";
    chord_type_aliases["suspended_second"] = "sus2";
    chord_type_aliases["sus2nd"] = "sus2";
    
    chord_type_aliases["suspended fourth"] = "sus4";
    chord_type_aliases["suspended_fourth"] = "sus4";
    chord_type_aliases["sus4th"] = "sus4";
    
    chord_type_aliases["dominant7"] = "7";
    chord_type_aliases["dominant 7"] = "7";
    chord_type_aliases["dominant_seventh"] = "7";
    chord_type_aliases["seventh"] = "7";
    
    chord_type_aliases["major7"] = "maj7";
    chord_type_aliases["major seventh"] = "maj7";
    chord_type_aliases["major_seventh"] = "maj7";
    
    chord_type_aliases["minor7"] = "m7";
    chord_type_aliases["minor seventh"] = "m7";
    chord_type_aliases["minor_seventh"] = "m7";
    
    chord_type_aliases["diminished7"] = "dim7";
    chord_type_aliases["diminished seventh"] = "dim7";
    chord_type_aliases["diminished_seventh"] = "dim7";
    
    chord_type_aliases["half diminished"] = "m7b5";
    chord_type_aliases["half_diminished"] = "m7b5";
    chord_type_aliases["halfdim"] = "m7b5";
    
    // Note pattern aliases
    note_pattern_aliases["major"] = {0, 4, 7};
    note_pattern_aliases["maj"] = {0, 4, 7};
    note_pattern_aliases["major triad"] = {0, 4, 7};
    note_pattern_aliases["major_triad"] = {0, 4, 7};
    
    note_pattern_aliases["minor"] = {0, 3, 7};
    note_pattern_aliases["min"] = {0, 3, 7};
    note_pattern_aliases["minor triad"] = {0, 3, 7};
    note_pattern_aliases["minor_triad"] = {0, 3, 7};
    
    note_pattern_aliases["diminished"] = {0, 3, 6};
    note_pattern_aliases["dim"] = {0, 3, 6};
    note_pattern_aliases["diminished triad"] = {0, 3, 6};
    note_pattern_aliases["diminished_triad"] = {0, 3, 6};
    
    note_pattern_aliases["augmented"] = {0, 4, 8};
    note_pattern_aliases["aug"] = {0, 4, 8};
    note_pattern_aliases["augmented triad"] = {0, 4, 8};
    note_pattern_aliases["augmented_triad"] = {0, 4, 8};
    
    note_pattern_aliases["sus2"] = {0, 2, 7};
    note_pattern_aliases["suspended second"] = {0, 2, 7};
    note_pattern_aliases["suspended_second"] = {0, 2, 7};
    
    note_pattern_aliases["sus4"] = {0, 5, 7};
    note_pattern_aliases["suspended fourth"] = {0, 5, 7};
    note_pattern_aliases["suspended_fourth"] = {0, 5, 7};
    
    note_pattern_aliases["7"] = {0, 4, 7, 10};
    note_pattern_aliases["dominant7"] = {0, 4, 7, 10};
    note_pattern_aliases["dominant seventh"] = {0, 4, 7, 10};
    note_pattern_aliases["dominant_seventh"] = {0, 4, 7, 10};
    
    note_pattern_aliases["maj7"] = {0, 4, 7, 11};
    note_pattern_aliases["major7"] = {0, 4, 7, 11};
    note_pattern_aliases["major seventh"] = {0, 4, 7, 11};
    note_pattern_aliases["major_seventh"] = {0, 4, 7, 11};
    
    note_pattern_aliases["m7"] = {0, 3, 7, 10};
    note_pattern_aliases["minor7"] = {0, 3, 7, 10};
    note_pattern_aliases["minor seventh"] = {0, 3, 7, 10};
    note_pattern_aliases["minor_seventh"] = {0, 3, 7, 10};
    
    note_pattern_aliases["dim7"] = {0, 3, 6, 9};
    note_pattern_aliases["diminished7"] = {0, 3, 6, 9};
    note_pattern_aliases["diminished seventh"] = {0, 3, 6, 9};
    note_pattern_aliases["diminished_seventh"] = {0, 3, 6, 9};
    
    note_pattern_aliases["m7b5"] = {0, 3, 6, 10};
    note_pattern_aliases["half diminished"] = {0, 3, 6, 10};
    note_pattern_aliases["half_diminished"] = {0, 3, 6, 10};
    
    note_pattern_aliases["power chord"] = {0, 7};
    note_pattern_aliases["fifth"] = {0, 7};
    note_pattern_aliases["5"] = {0, 7};
    
    note_pattern_aliases["major scale"] = {0, 2, 4, 5, 7, 9, 11};
    note_pattern_aliases["ionian"] = {0, 2, 4, 5, 7, 9, 11};
    note_pattern_aliases["major diatonic"] = {0, 2, 4, 5, 7, 9, 11};
    
    note_pattern_aliases["minor scale"] = {0, 2, 3, 5, 7, 8, 10};
    note_pattern_aliases["aeolian"] = {0, 2, 3, 5, 7, 8, 10};
    note_pattern_aliases["natural minor"] = {0, 2, 3, 5, 7, 8, 10};
    note_pattern_aliases["minor diatonic"] = {0, 2, 3, 5, 7, 8, 10};
    
    note_pattern_aliases["dorian"] = {0, 2, 3, 5, 7, 9, 10};
    note_pattern_aliases["dorian mode"] = {0, 2, 3, 5, 7, 9, 10};
    
    note_pattern_aliases["phrygian"] = {0, 1, 3, 5, 7, 8, 10};
    note_pattern_aliases["phrygian mode"] = {0, 1, 3, 5, 7, 8, 10};
    
    note_pattern_aliases["lydian"] = {0, 2, 4, 6, 7, 9, 11};
    note_pattern_aliases["lydian mode"] = {0, 2, 4, 6, 7, 9, 11};
    
    note_pattern_aliases["mixolydian"] = {0, 2, 4, 5, 7, 9, 10};
    note_pattern_aliases["mixolydian mode"] = {0, 2, 4, 5, 7, 9, 10};
    
    note_pattern_aliases["locrian"] = {0, 1, 3, 5, 6, 8, 10};
    note_pattern_aliases["locrian mode"] = {0, 1, 3, 5, 6, 8, 10};
    
    note_pattern_aliases["harmonic minor"] = {0, 2, 3, 5, 7, 8, 11};
    note_pattern_aliases["harmonic_minor"] = {0, 2, 3, 5, 7, 8, 11};
    
    note_pattern_aliases["melodic minor"] = {0, 2, 3, 5, 7, 9, 11};
    note_pattern_aliases["melodic_minor"] = {0, 2, 3, 5, 7, 9, 11};
    
    note_pattern_aliases["major pentatonic"] = {0, 2, 4, 7, 9};
    note_pattern_aliases["pentatonic major"] = {0, 2, 4, 7, 9};
    note_pattern_aliases["major_pentatonic"] = {0, 2, 4, 7, 9};
    
    note_pattern_aliases["minor pentatonic"] = {0, 3, 5, 7, 10};
    note_pattern_aliases["pentatonic minor"] = {0, 3, 5, 7, 10};
    note_pattern_aliases["minor_pentatonic"] = {0, 3, 5, 7, 10};
    
    note_pattern_aliases["blues"] = {0, 3, 5, 6, 7, 10};
    note_pattern_aliases["blues scale"] = {0, 3, 5, 6, 7, 10};
    note_pattern_aliases["blues hexatonic"] = {0, 3, 5, 6, 7, 10};
    
    note_pattern_aliases["whole tone"] = {0, 2, 4, 6, 8, 10};
    note_pattern_aliases["whole tone scale"] = {0, 2, 4, 6, 8, 10};
    note_pattern_aliases["augmented scale"] = {0, 2, 4, 6, 8, 10};
    
    note_pattern_aliases["chromatic"] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11};
    note_pattern_aliases["chromatic scale"] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11};
    note_pattern_aliases["12-tone"] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11};
    
    aliases_initialized = true;
}

// Normalize input string
std::string normalize_input(const std::string& input) {
    std::string normalized = input;
    
    // Convert to lowercase
    std::transform(normalized.begin(), normalized.end(), normalized.begin(), ::tolower);
    
    // Trim whitespace
    normalized.erase(0, normalized.find_first_not_of(" \t\r\n"));
    normalized.erase(normalized.find_last_not_of(" \t\r\n") + 1);
    
    // Normalize multiple spaces to single space
    std::string::iterator new_end = std::unique(normalized.begin(), normalized.end(),
        [](char a, char b) { return a == ' ' && b == ' '; });
    normalized.erase(new_end, normalized.end());
    
    return normalized;
}

// Resolve root note
std::string resolve_root_note(const std::string& input) {
    if (!aliases_initialized) initialize_aliases();
    
    std::string normalized = normalize_input(input);
    
    // Check if it's already canonical
    std::vector<std::string> canonical = {"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"};
    for (const auto& canon : canonical) {
        if (normalize_input(canon) == normalized) {
            return canon;
        }
    }
    
    // Check aliases
    auto it = root_note_aliases.find(normalized);
    if (it != root_note_aliases.end()) {
        return it->second;
    }
    
    // Fallback to input (capitalize first letter)
    if (!normalized.empty()) {
        normalized[0] = std::toupper(normalized[0]);
        return normalized;
    }
    
    return input;
}

// Resolve mode
std::string resolve_mode(const std::string& input) {
    if (!aliases_initialized) initialize_aliases();
    
    std::string normalized = normalize_input(input);
    
    // Check if it's already canonical
    std::vector<std::string> canonical = {"major", "minor", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian"};
    for (const auto& canon : canonical) {
        if (normalize_input(canon) == normalized) {
            return canon;
        }
    }
    
    // Check aliases
    auto it = mode_aliases.find(normalized);
    if (it != mode_aliases.end()) {
        return it->second;
    }
    
    // Fallback to input
    return input;
}

// Resolve chord type
std::string resolve_chord_type(const std::string& input) {
    if (!aliases_initialized) initialize_aliases();
    
    std::string normalized = normalize_input(input);
    
    // Check if it's already canonical
    std::vector<std::string> canonical = {"maj", "min", "dim", "aug", "sus2", "sus4", "7", "maj7", "m7", "dim7", "m7b5"};
    for (const auto& canon : canonical) {
        if (normalize_input(canon) == normalized) {
            return canon;
        }
    }
    
    // Check aliases
    auto it = chord_type_aliases.find(normalized);
    if (it != chord_type_aliases.end()) {
        return it->second;
    }
    
    // Fallback to input
    return input;
}

// Resolve note pattern
std::vector<int> resolve_note_pattern(const std::string& input) {
    if (!aliases_initialized) initialize_aliases();
    
    std::string normalized = normalize_input(input);
    
    // Check aliases
    auto it = note_pattern_aliases.find(normalized);
    if (it != note_pattern_aliases.end()) {
        return it->second;
    }
    
    // Fallback to empty pattern
    return {};
}

// Normalize pattern to start at 0 and sort
std::vector<int> normalize_pattern(const std::vector<int>& pattern) {
    if (pattern.empty()) {
        return {0};
    }
    
    std::vector<int> normalized = pattern;
    
    // Find minimum value
    int min_val = *std::min_element(normalized.begin(), normalized.end());
    
    // Subtract minimum from all values
    for (auto& val : normalized) {
        val -= min_val;
    }
    
    // Sort
    std::sort(normalized.begin(), normalized.end());
    
    return normalized;
}

// Check if two patterns match
bool patterns_match(const std::vector<int>& pattern1, const std::vector<int>& pattern2) {
    if (pattern1.size() != pattern2.size()) {
        return false;
    }
    
    for (size_t i = 0; i < pattern1.size(); i++) {
        if (pattern1[i] != pattern2[i]) {
            return false;
        }
    }
    
    return true;
}

// Get pattern by type
std::vector<int> get_pattern_by_type(const std::string& input) {
    if (!aliases_initialized) initialize_aliases();
    
    std::string normalized = normalize_input(input);
    
    // Check aliases
    auto it = note_pattern_aliases.find(normalized);
    if (it != note_pattern_aliases.end()) {
        return it->second;
    }
    
    return {};
}

// Apply pattern to root note
std::vector<std::string> apply_pattern_to_root(const std::string& root_note, const std::vector<int>& pattern) {
    if (pattern.empty()) {
        return {root_note};
    }
    
    std::vector<std::string> note_names = {"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"};
    
    // Get root note index
    std::string resolved_root = resolve_root_note(root_note);
    int root_index = -1;
    for (size_t i = 0; i < note_names.size(); i++) {
        if (note_names[i] == resolved_root) {
            root_index = i;
            break;
        }
    }
    
    if (root_index == -1) {
        return {root_note};
    }
    
    std::vector<std::string> result;
    for (int interval : pattern) {
        int note_index = (root_index + interval) % 12;
        result.push_back(note_names[note_index]);
    }
    
    return result;
}

// Resolve complete message
json resolve_message(const json& input_msg) {
    json resolved = input_msg;
    
    // Resolve root note
    if (resolved.contains("root_note") && resolved["root_note"].is_string()) {
        resolved["root_note"] = resolve_root_note(resolved["root_note"].get<std::string>());
    }
    
    // Resolve mode
    if (resolved.contains("mode") && resolved["mode"].is_string()) {
        resolved["mode"] = resolve_mode(resolved["mode"].get<std::string>());
    }
    
    // Resolve chord type
    if (resolved.contains("chord_type") && resolved["chord_type"].is_string()) {
        resolved["chord_type"] = resolve_chord_type(resolved["chord_type"].get<std::string>());
    }
    
    // Resolve note pattern if present
    if (resolved.contains("note_pattern")) {
        if (resolved["note_pattern"].is_array()) {
            // Already a pattern array, normalize it
            std::vector<int> pattern = resolved["note_pattern"].get<std::vector<int>>();
            std::vector<int> normalized = normalize_pattern(pattern);
            resolved["note_pattern"] = normalized;
        } else if (resolved["note_pattern"].is_string()) {
            // String input, resolve to pattern
            std::string pattern_str = resolved["note_pattern"].get<std::string>();
            std::vector<int> pattern = resolve_note_pattern(pattern_str);
            resolved["note_pattern"] = pattern;
        }
    }
    
    // Add resolution metadata
    if (!resolved.contains("metadata")) {
        resolved["metadata"] = json::object();
    }
    resolved["metadata"]["resolved_by"] = "KeyLinkAliasResolver";
    resolved["metadata"]["resolution_version"] = "1.0.0";
    
    return resolved;
}

// Max object for alias resolution
typedef struct _keylink_aliases {
    t_object ob;
    void *outlet;
} t_keylink_aliases;

void *keylink_aliases_new(t_symbol *s, long argc, t_atom *argv);
void keylink_aliases_free(t_keylink_aliases *x);
void keylink_aliases_assist(t_keylink_aliases *x, void *b, long m, long a, char *s);
void keylink_aliases_resolve(t_keylink_aliases *x, t_symbol *s, long argc, t_atom *argv);
void keylink_aliases_root(t_keylink_aliases *x, t_symbol *s);
void keylink_aliases_mode(t_keylink_aliases *x, t_symbol *s);
void keylink_aliases_chord(t_keylink_aliases *x, t_symbol *s);
void keylink_aliases_pattern(t_keylink_aliases *x, t_symbol *s);
void keylink_aliases_apply(t_keylink_aliases *x, t_symbol *s, long argc, t_atom *argv);

static t_class *keylink_aliases_class = NULL;

extern "C" void ext_main(void *r) {
    t_class *c = class_new("keylink_aliases", (method)keylink_aliases_new, (method)keylink_aliases_free, (long)sizeof(t_keylink_aliases), 0L, A_GIMME, 0);
    class_addmethod(c, (method)keylink_aliases_resolve, "resolve", A_GIMME, 0);
    class_addmethod(c, (method)keylink_aliases_root, "root", A_SYM, 0);
    class_addmethod(c, (method)keylink_aliases_mode, "mode", A_SYM, 0);
    class_addmethod(c, (method)keylink_aliases_chord, "chord", A_SYM, 0);
    class_addmethod(c, (method)keylink_aliases_pattern, "pattern", A_SYM, 0);
    class_addmethod(c, (method)keylink_aliases_apply, "apply", A_GIMME, 0);
    class_addmethod(c, (method)keylink_aliases_assist, "assist", A_CANT, 0);
    class_register(CLASS_BOX, c);
    keylink_aliases_class = c;
}

void *keylink_aliases_new(t_symbol *s, long argc, t_atom *argv) {
    t_keylink_aliases *x = (t_keylink_aliases *)object_alloc(keylink_aliases_class);
    if (x) {
        x->outlet = outlet_new((t_object *)x, NULL);
        initialize_aliases();
        object_post((t_object *)x, "KeyLink Aliases: Initialized with comprehensive naming standards and note primitives");
    }
    return (x);
}

void keylink_aliases_free(t_keylink_aliases *x) {
    // Cleanup if needed
}

void keylink_aliases_assist(t_keylink_aliases *x, void *b, long m, long a, char *s) {
    if (m == ASSIST_INLET) {
        sprintf(s, "Input (resolve, root, mode, chord, pattern, apply)");
    } else {
        sprintf(s, "Output (resolved value)");
    }
}

void keylink_aliases_resolve(t_keylink_aliases *x, t_symbol *s, long argc, t_atom *argv) {
    if (argc < 1) return;
    
    try {
        // Parse input as JSON
        std::string input_str = atom_getsym(argv)->s_name;
        json input_json = json::parse(input_str);
        
        // Resolve the message
        json resolved = resolve_message(input_json);
        
        // Output resolved JSON
        std::string output_str = resolved.dump();
        t_atom a;
        atom_setsym(&a, gensym(output_str.c_str()));
        outlet_anything(x->outlet, gensym("json"), 1, &a);
        
        object_post((t_object *)x, "KeyLink Aliases: Resolved message with note primitives");
        
    } catch (const std::exception& e) {
        object_error((t_object *)x, "KeyLink Aliases: JSON parsing error: %s", e.what());
    }
}

void keylink_aliases_root(t_keylink_aliases *x, t_symbol *s) {
    std::string input = s->s_name;
    std::string resolved = resolve_root_note(input);
    
    t_atom a;
    atom_setsym(&a, gensym(resolved.c_str()));
    outlet_anything(x->outlet, gensym("root"), 1, &a);
    
    object_post((t_object *)x, "KeyLink Aliases: %s -> %s", input.c_str(), resolved.c_str());
}

void keylink_aliases_mode(t_keylink_aliases *x, t_symbol *s) {
    std::string input = s->s_name;
    std::string resolved = resolve_mode(input);
    
    t_atom a;
    atom_setsym(&a, gensym(resolved.c_str()));
    outlet_anything(x->outlet, gensym("mode"), 1, &a);
    
    object_post((t_object *)x, "KeyLink Aliases: %s -> %s", input.c_str(), resolved.c_str());
}

void keylink_aliases_chord(t_keylink_aliases *x, t_symbol *s) {
    std::string input = s->s_name;
    std::string resolved = resolve_chord_type(input);
    
    t_atom a;
    atom_setsym(&a, gensym(resolved.c_str()));
    outlet_anything(x->outlet, gensym("chord"), 1, &a);
    
    object_post((t_object *)x, "KeyLink Aliases: %s -> %s", input.c_str(), resolved.c_str());
}

void keylink_aliases_pattern(t_keylink_aliases *x, t_symbol *s) {
    std::string input = s->s_name;
    std::vector<int> pattern = resolve_note_pattern(input);
    
    if (!pattern.empty()) {
        // Convert pattern to JSON array
        json pattern_json = pattern;
        std::string pattern_str = pattern_json.dump();
        
        t_atom a;
        atom_setsym(&a, gensym(pattern_str.c_str()));
        outlet_anything(x->outlet, gensym("pattern"), 1, &a);
        
        object_post((t_object *)x, "KeyLink Aliases: %s -> [%s]", input.c_str(), pattern_str.c_str());
    } else {
        object_post((t_object *)x, "KeyLink Aliases: No pattern found for %s", input.c_str());
    }
}

void keylink_aliases_apply(t_keylink_aliases *x, t_symbol *s, long argc, t_atom *argv) {
    if (argc < 2) return;
    
    std::string root_note = atom_getsym(argv)->s_name;
    std::string pattern_name = atom_getsym(argv + 1)->s_name;
    
    std::vector<int> pattern = resolve_note_pattern(pattern_name);
    if (!pattern.empty()) {
        std::vector<std::string> notes = apply_pattern_to_root(root_note, pattern);
        
        // Convert notes to JSON array
        json notes_json = notes;
        std::string notes_str = notes_json.dump();
        
        t_atom a;
        atom_setsym(&a, gensym(notes_str.c_str()));
        outlet_anything(x->outlet, gensym("notes"), 1, &a);
        
        object_post((t_object *)x, "KeyLink Aliases: Applied %s to %s -> [%s]", 
                   pattern_name.c_str(), root_note.c_str(), notes_str.c_str());
    } else {
        object_post((t_object *)x, "KeyLink Aliases: No pattern found for %s", pattern_name.c_str());
    }
} 