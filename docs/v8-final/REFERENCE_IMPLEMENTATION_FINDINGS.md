# Reference implementation findings

See [`docs/v8/REFERENCE_IMPLEMENTATION_FINDINGS.md`](../v8/REFERENCE_IMPLEMENTATION_FINDINGS.md)
for the concise study record. V8 adopts its three practical themes:

- narrow structured nondeterminism over bounded, contract-selected evidence;
- immutable checkpoint state with deterministic policy consequences; and
- one validated frontend transaction adapter with explicit finality.

V8 uses current GenLayer v0.6-compatible APIs rather than copying the older
reference projects' SDK versions.
