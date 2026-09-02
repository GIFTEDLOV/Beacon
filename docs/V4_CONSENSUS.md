# Beacon V4 consensus notes

Beacon V4 keeps the V3 objective evidence path, public API, state schema and
deterministic collateral policy unchanged. It changes only semantic validator
equivalence and validator error containment.

The semantic validator independently fetches the bounded role evidence and
runs the fixed structured semantic normalization prompt. It compares only
policy-critical semantic claims. Risk ordering is conservative: a leader
claim is rejected when the validator finds a materially worse risk, unsafe
control boolean or CORE-ineligible provenance. A more conservative leader
claim is accepted when the remaining safety invariants hold. Confidence,
reasoning, ordering, raw evidence and other incidental metadata are not
consensus fields.

The complete semantic validator body is fail-closed. Invalid leader results,
source failures, malformed structured output, normalization errors, LLM
errors and unexpected exceptions return disagreement rather than escaping or
producing favorable agreement. Matching bounded semantic failure states may
agree, preserving the distinction between a failed evaluation and a business
REJECT passport.

The V2 turnover regression remains covered: primary/secondary turnover values
2068/2425 versus 2036/1906 agree when the independently derived liquidity
bands agree, and disagree when those bands differ.
