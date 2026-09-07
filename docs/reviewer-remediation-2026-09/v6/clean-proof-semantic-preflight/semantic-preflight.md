# Beacon V6 clean semantic-source preflight

The deployment hash was reconciled read-only and remains `ACCEPTED` (code 5),
so no contract state readback was attempted.

The exact V6 source predicates were reproduced from `_authority_status`,
`_binding_matches`, and `_source_evidence`. The Help Center candidate was
rejected because its direct fetched body did not contain Ethereum or the exact
USDC address. The static Circle Docs contract-address page passes the stricter
issuer predicate and is the selected issuer URL.

Selected distinct future URLs:

- issuer: `https://developers.circle.com/stablecoins/usdc-contract-addresses`
- redemption: `https://developers.circle.com/circle-mint/concepts/how-minting-works`
- reserve_backing: `https://developers.circle.com/stablecoins/what-is-usdc`
- security: `https://developers.circle.com/cctp/references/technical-guide`
- governance: `https://developers.circle.com/xreserve/concepts/usdc-backed-stablecoin-specification`

All five returned HTTP 200, remained on `developers.circle.com`, were below
the V6 one-megabyte response bound, and passed their role-specific V6 content
binding checks. The issuer page additionally contained `USDC`, `Ethereum`,
the exact canonical Ethereum address, and issuer-relevant terms.

This is preparation only. No submission or other asset lifecycle transaction
was created.
