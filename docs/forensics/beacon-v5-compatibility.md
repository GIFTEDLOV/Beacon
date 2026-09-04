# Beacon V5 forensic compatibility audit

This report is local forensic evidence. It does not alter the deployed V5
contract, its receipts, its two stored challenges, or production configuration.
V4 remains historical evidence only.

## Snapshot

The frozen local source and deployed V5 bytecode are both 52,329 bytes with
SHA-256 `b5077515361badc7c04d792d3f61c331f5d9b1c21edcd7cbc27e4576f80fc3e0`.
The exact live state is captured in
`beacon-v5-live-fixture.json`.

The reassessment transaction
`0x08101b86905430cc742624df3445457c4c24d8f57d18be186dc4cad0111c9c09`
is now stored `FINALIZED` (status code 7), but its execution result is
`FINISHED_WITH_ERROR`. Its consensus result is `AGREE`, with two
`DETERMINISTIC_VIOLATION` and three `DISAGREE` execution votes in the
populated round. The trace exposes the original error:
`[EXPECTED] reassessment evidence unavailable`, from the identity gate before
either challenge loop ran. Passport v1 and both OPEN/PENDING challenges are
unchanged.

## Current-rule compatibility matrix

| Beacon component | V5 consensus pattern | Current GenLayer rule | Compliant | Risk / remediation |
| --- | --- | --- | --- | --- |
| Identity | `run_nondet_unsafe`; leader fields are independently recomputed | Nondeterministic web data must be independently verified | Yes, with provider-response gap | CoinPaprika response address/platform must also be checked in V6 |
| Objective data | Custom validator compares bounded risk and tolerant numeric fields | Compare decision-bearing normalized fields, not raw web bytes | Partial | Remove incidental fields from provenance and bind every provider response |
| Semantic evaluation | LLM JSON is schema-bounded; validator allows conservative field differences | LLM prose need not be byte-identical; compare structured decisions | Partial | Identical malformed/insufficient outputs currently become validator failure |
| Challenge evidence | Raw HTTP body SHA-256 is returned and validator-compared | Raw web content is not a stable consensus value | No | Hash normalized extracted evidence and exclude raw digest from equivalence |
| Challenge collection | All eligible records are looped in storage insertion order | Deterministic collections need canonical ordering | Partial | Sort by canonical challenge ID before evaluation/digest |
| State writes | Identity and Passport writes follow nondeterministic calls in one transaction | State mutation belongs after accepted nondeterministic result | Yes, transactionally | Preserve atomic write barrier in V6 |
| Failure handling | Broad exceptions are mapped to evidence unavailable; reassessment raises expected UserError | Network, malformed data, model failure, and business results must remain distinct | No | Add explicit failure-domain classification and bounded failure equivalence |
| Time | Passport stores `gl.message_raw['datetime']` | Transaction datetime is pinned and deterministic | Yes | Official transaction-context rule confirms this is not the DV cause |
| Transaction proof | Receipt/status and contract state are inspected separately | Accepted/finalized is not execution success | Yes | Keep requiring `FINISHED_WITH_RETURN` plus state readback |

## Equivalence calls

V5 has zero `gl.eq_principle.strict_eq` calls and four
`gl.vm.run_nondet_unsafe` calls: identity, objective, semantic, and challenge.
The custom validators are appropriate in principle, but V5 has two unsafe
patterns:

1. challenge validation compares a raw web-body digest;
2. semantic validation rejects a shared bounded failure result instead of
   accepting it as the same fail-closed decision.

The leader returns a bounded structured result for each stage. LLM prose is
not stored as a decision-bearing value, and the challenge category/reason are
passed to the prompt. The raw web body still influences the challenge digest,
which is a consensus-design defect even though the body text itself is not
returned.

## Evidence stability probes

Three ordinary GETs of each exact challenge URL returned HTTP 200, the same
final URL, and the same digest within this probe window:

- A: Circle CCTP contract interfaces; 882,083-byte HTML response, JavaScript
  present, no cookie dependency observed.
- B: Circle ERC-20 token; 541,529-byte HTML response, JavaScript present, no
  cookie dependency observed.

The repeated bytes are not proof of validator-wide byte stability. Both are
large JavaScript-backed HTML documents and exceed V5's 90,000-byte response
bound, so V5 would fail-closed on these exact pages rather than prove a
stable evidence extraction. V6 must not make their raw body bytes a
consensus-equality condition.

## Root-cause boundary

The deepest exposed reassessment failure is the expected identity evidence
unavailable guard. The provider-specific underlying exception is not exposed
by the Bradbury trace; the trace has zero web/LLM calls and only the contract's
bounded UserError. Therefore the forensic record identifies the contract-level
failure path and the equivalence fragility, but does not label the provider
outage itself without evidence.

V5 is not proven reliably reassessable without code change. A prospective V6
must preserve identity binding, conservative policy, bounded semantic output,
atomic reassessment, per-challenge adjudication, and provenance while fixing
the response binding, source normalization, failure equivalence, and ordering
gaps listed above.

## Prospective V6 local remediation

`contracts/beacon_v6.py` is a local, undeployed prospective contract. It keeps
the V5 public schema at 12 methods and does not change V5 bytecode. Its
material changes are:

- CoinPaprika identity and objective data are followed by a CoinPaprika coin
  record whose `contracts[]` entry must match both `eth-ethereum` and the exact
  normalized address.
- CoinGecko objective data also requires its returned top-level contract
  address, platform, and platform map to match.
- Authority uses normalized host equality or a dot-delimited subdomain match,
  while evidence binding requires the authenticated chain term, exact address,
  symbol, and name.
- Fetched documents are bounded at 1 MiB and reduced to at most 2,800
  consensus/LLM characters, allowing both exact Circle challenge pages while
  retaining a hard resource bound. Explicit 3xx responses and any exposed
  final-host mismatch fail closed because the current web response API does
  not document a trusted redirect-following contract field.
- JSON/body parsing distinguishes malformed source data from transient source
  unavailability.
- Semantic failure results are bounded and equivalent when both sides produce
  the same fail-closed failure enum.
- Challenge evidence digests cover canonical identity, category, and reduced
  extracted evidence—not raw HTML bytes—and challenge validators compare only
  bounded adjudication fields.
- Eligible challenges are explicitly sorted by challenge ID; reassessment
  refuses to adjudicate any challenge unless the fresh identity stage is
  `VERIFIED`, then preserves the existing all-or-nothing write barrier.

The local V6 suite has 18 tests, including the exact two-record live fixture
at the observed 882,083-byte and 541,529-byte page sizes;
the complete repository suite has 124 passing tests. V6 has passed both GenVM
lint and semantic validation. It has not been deployed, submitted, evaluated,
or connected to production.

## V6 release-candidate gate

The current prospective source is 53,002 bytes with SHA-256
`c90324ce89dc07e1a2b75d137dcbbff436f2c340ec67ad98cbbd526f255c722f`.
The exact source-shaped Bradbury gas estimate succeeds at this size; larger
source-shaped payloads at the observed boundary fail with
`BlockPubdataLimitReached`.

The 1 MiB response cap is applied before parsing, and extracted evidence is
bounded to 2,800 characters before semantic or challenge adjudication. Raw
HTTP bodies and full-page hashes are excluded from consensus equality. An
explicit redirect or exposed final-host mismatch fails closed, preserving
host authentication under the current documented web-response interface.
