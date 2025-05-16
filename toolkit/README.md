# KeyLink Toolkit

This directory contains **reusable utilities, helpers, and adapters** for extending or integrating KeyLink into your own projects. These modules are intended to be imported or referenced by developers building new tools, bridges, or integrations with KeyLink.

- Each file here is a mini-library or utility, not a full application or end-user demo.
- For usage samples and "how-to" scripts, see the `examples/` directory.
- For interactive, user-facing demos, see the `demo/` directory.

## Contents

- **midi-bridge.js** — Utilities for mapping KeyLink JSON messages to and from MIDI 2.0 UMP and MIDI 1.0 messages.
- **transposer.js** — Functions for transposing audio or MIDI clips in response to key, mode, or chord changes.
- **osc-mapper.js** — Optional mapping between KeyLink JSON and integer-indexed OSC messages for legacy or ultra-low-latency use.

## Roadmap

- Example scripts and usage for each utility.
- Integration examples for Max/MSP, Node.js, and browser environments.
- Documentation for extending the toolkit with new protocols or features.

---

**Contributions are welcome!** If you have ideas for new utilities or improvements, please open an issue or pull request. 