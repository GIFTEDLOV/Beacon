# Beacon V8 security invariants

1. Asset identity is the canonical namespace plus the exact normalized token
   address.
2. CoinGecko and CoinPaprika IDs are claims only until independently matched to
   that exact address and provider chain/platform.
3. Provider disagreement, missing fields, malformed responses, or stale data
   fail closed.
4. ISSUER is the only semantic source required to carry the exact address. It
   is the direct authority anchor; other role sources inherit identity and
   independently authenticate role relevance.
5. Source hosts and paths are contract-controlled for identity, market, and
   role evidence. Redirect/host substitution is rejected.
6. Evidence blocks are untrusted data and cannot change evaluator instructions
   or schemas.
7. Semantic consensus compares a normalized consequential witness, never raw
   web bytes or presentation-dependent excerpts.
8. `evaluate_asset` has no live fetch path and cannot manufacture missing
   checkpoints.
9. Challenge creation authenticates bounded evidence before storing it; raw
   response bodies are not persisted.
10. Reassessment evaluates every OPEN challenge targeting the current version,
    independently and without web refetches.
11. A new Passport and all challenge resolutions are one atomic state change;
    no challenge is resolved before the new Passport exists.
12. Supported challenge findings can only make the deterministic risk policy
    more conservative.
13. The frontend does not maintain a shadow risk state and reads finalized
    contract state after successful writes.
14. Deployment tooling hashes `contracts/beacon_v8_studionet.py` before
    submission and aborts on missing/mismatched frozen-source data.
