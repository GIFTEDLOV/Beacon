# Beacon V3 consensus notes

Beacon V3 keeps the V2 public API and storage model. It makes only the two
consensus-robustness changes proven necessary by the V2 Bradbury evaluation.

| Change | V2 behavior | V3 behavior | Safety preserved |
| --- | --- | --- | --- |
| Semantic retrieval | Each fixed-role source used `web.get` and then `web.render` | Each source uses one `web.get`; HTML is normalized and role-reduced before the existing single LLM call | Fixed URLs, role labels, untrusted-evidence prompt, bounded 2,800-byte evidence |
| Objective equivalence | Compared raw primary and secondary turnover values with 100-bps tolerance | Does not compare raw turnover; compares independently derived liquidity risk bands | Independent source fetches, source identity, coverage, risk bands, peg/price tolerance, conflict policy |

The V2 live evaluation is preserved as historical evidence. Its validator-mode
reproduction disagreed at nondeterministic call 0 because turnover changed from
2068 to 2036 bps and from 2425 to 1906 bps while the derived liquidity bands
remained equal. V3 therefore treats the band as consensus-critical and the raw
turnover as persisted evidence only.

Normal V3 execution is bounded to two objective fetches, five semantic fetches,
zero browser renders, and one LLM call. Validators independently repeat the
same source-grounded work; no cross-validator cache is used.
