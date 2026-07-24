# public/decoders/

Self-hosted decoder WASM/JS for meshopt and KTX2/Basis (and Draco only if ever
needed). Self-hosting avoids a runtime CDN dependency so the app works offline
and, later, when served from the Raspberry Pi.

Register the decoder paths once where GLB loading is configured (see `src/lib/`).
