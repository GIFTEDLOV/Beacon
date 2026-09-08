# Beacon V7 security-hardened candidate

V7 is a new, not-yet-deployed contract candidate at
[`contracts/beacon_v7.py`](../../contracts/beacon_v7.py). V6 and its Bradbury
deployment/evidence remain historical provenance and are not rewritten here.

## F-001 resource boundary

The pinned local GenLayer runtime exposes `gl.nondet.web.get`, but no contract
API for HTTP Range, streaming, Content-Length inspection, response truncation,
request timeout, or DNS resolution. V7 therefore rejects a challenge after
retrieval when the response exceeds `MAX_CHALLENGE_FETCH_BYTES = 65,536` UTF-8
bytes, and persists only a consensus-validated reduced representation capped at
`MAX_STORED_CHALLENGE_EVIDENCE_BYTES = 2,800` UTF-8 bytes.

Challenge creation runs leader and validator source acquisition inside one
nondeterministic boundary. Both independently verify the exact canonical
asset/address/chain and category binding. The validator compares the bounded
category facts and reduced-representation digest; raw HTML is never a strict
equivalence target. A failed or oversized acquisition reverts the challenge
transaction before an OPEN record is stored.

Reassessment collects every OPEN current-version challenge in deterministic
challenge-ID order. It consumes the stored bounded evidence and performs zero
challenge-evidence web fetches. All challenge decisions must succeed before a
new Passport is stored; only then are the OPEN records resolved.

The resulting worst-case stored evidence passed through reassessment is:

`8 challenges × 2,800 bytes = 22,400 bytes`.

The remaining semantic/objective reassessment work is unchanged in meaning and
still uses the existing bounded source and provider operations. In the
worst-case two-sided consensus accounting, V6 could fetch challenge evidence
`8 × 2 = 16` times during reassessment and expose up to 16 MiB of challenge
response bodies before other work. V7 performs those 16 bounded fetches at
creation instead, and performs zero challenge-evidence fetches during
reassessment. The eight challenge judges still produce 16 bounded LLM calls
(leader plus validator), while the existing identity/objective/semantic work
contributes 22 bounded provider/source web fetches and 2 semantic LLM calls.

A challenger may still cause their own creation transaction to fetch up to the
local 65,536-byte post-retrieval ceiling on each consensus side, but cannot
persist an OPEN challenge that later makes reassessment ingest an arbitrary
page.

## F-002 and platform residual

V7 canonicalizes hostname case, rejects trailing-dot ambiguity, userinfo,
fragments, explicit ports, malformed authorities, localhost/internal names,
and all literal IP hosts. A response must expose a non-empty final URL; its
HTTPS final host must match the requested authority exactly, so unauthorized
redirects fail closed. Official-domain checks use exact host or a dot-boundary
subdomain match.

The contract runtime inspected for this candidate does not expose DNS resolution
or resolved peer IPs. V7 does not claim DNS-rebinding or hostname-to-private-IP
protection. Those controls remain a GenLayer web-sandbox/platform dependency;
the contract's syntactic and final-host checks still fail closed when the
runtime omits the final URL.

## Historical release boundary

- V4: historical contract/proof.
- V5: historical remediation candidate/proof.
- V6: prior live reviewer-remediation deployment and evidence.
- V7: current security-hardened candidate, not deployed during this work and
  intentionally without a contract address.
