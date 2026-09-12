# Reviewer evidence matrix

The reviewer-visible release is the live-proven stable Studionet source
`contracts/beacon_v8_studionet.py`. Read-only evidence can be rerun with
`npm run verify:studionet`; it does not submit a transaction. The production
app is `https://beacon-rho-brown.vercel.app` and reads the same Studionet
contract recorded below.

## Sentence 1

> market IDs and semantic URLs remain caller-selected without a chain/token authority binding

| Reviewer requirement | Code / test | Live proof |
|---|---|---|
| Canonical chain and exact address | `contracts/beacon_v8_studionet.py`: canonical namespace/address normalization and `_submission` / `_identity_once` | Canonical asset `eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48` read from the live contract |
| Provider IDs are not identity | `_identity_once` independently validates CoinGecko and CoinPaprika platform/token records and stores a bounded identity witness | CoinGecko tx `0x923cdda0811eb8699a3e5b6adc58ea6111dbbe40b48eeb300d10fa5975e7801f`; CoinPaprika tx `0x3dbdce7a0a246a8f3ca842e601306e0cd91fc4c0bc889f94846898daaf45a900`; both exact bindings `VERIFIED` |
| Same canonical asset | Provider witnesses and dependent checkpoints carry the same asset ID/identity digest | Read-only verifier asserts both provider records bind to the exact canonical token |
| Authoritative semantic sources | Contract-controlled approved Circle URLs; HTTPS/public-host/redirect/size/empty/role/chain/asset checks fail closed | Five role transactions finalized; all five role checkpoints `VERIFIED` |
| Exact issuer anchor | ISSUER requires official Circle authority, Ethereum/USDC context, and the exact canonical address; other roles inherit authenticated identity | ISSUER tx `0xe9341a2aa2c309ad50aaae4eb819e3bb539f0cb0d1a8c1696881f744ea1e3fd5`; live basis `EXACT_ADDRESS` |
| Negative attacks | `test/test_beacon_v8.py`: wrong address, provider borrowing, wrong domain/redirect/subdomain/HTTP/private host, wrong chain/role, prompt injection, missing issuer address, oversize response | Wrong address with genuine IDs: `UNVERIFIED`, no semantic progression, Passport version `0` |

## Sentence 2

> reassessment evaluates only the first open challenge's URL before resolving every open challenge

| Reviewer requirement | Code / test | Live proof |
|---|---|---|
| Enumerate all eligible challenges | `reassess_asset` filters `status == OPEN` and `target_version == current_version`, then sorts deterministically | Reassess tx `0x13bfc7724b13739a05c427d069b5c3b610e67263aa62630535a2c9f1e712571b`; Passport V2 `challenge_count = 2` |
| Authenticate at creation | `challenge_asset` fetches and validates evidence before storing bounded evidence, reason digest, and evidence digest | Challenge A tx `0xbf1dc735d80f5a4bbfc3358b76822b6165389d4f0d905da5954b848d0d95afa2`; B tx `0x834cdebc4938851f84910a778112edf9fb9a5ae35ac48fd90346701e152d7e96`; both stored records contain nonempty evidence/reason digests |
| Independently evaluate each | Reassessment calls the bounded challenge consensus witness separately for every record, including each record's category, reason, digests, target version, and stored evidence | Live A and B each have independent `SUPPORTED` / `MATERIAL` fields |
| Zero challenge refetches | Reassessment has no challenge `_fetch` path; direct test counts challenge web fetches | Stable direct test asserts `0`; live stored evidence is sufficient for the reassessment transaction |
| Atomic ordering | Validate/evaluate all records first; store Passport V(N+1), then resolve records; exception leaves old state and all records unchanged | Forced second-challenge failure test leaves no V2 and both challenges `OPEN` |
| Per-record resolution | Each record receives its own `evaluation_result`, `evaluation_reason_code`, and `resolution_version` | Live A: `RESOLVED`, `SUPPORTED`, `MATERIAL`, version `2`; live B: same fields independently populated, version `2` |

## Stable reproducibility and publication

- Stable contract release proof: `29 passed` in the final release test run.
- Frontend release proof: `21 passed`, typecheck PASS, build PASS.
- Security/dependency checks: npm audits reported 0 vulnerabilities, `pip-audit`
  clean, bounded secret scan clean.
- Source parity: 44,394 bytes and SHA-256
  `698d2cec03a52b66944b6ccade26dfe5886af5ae3cb65a735a30ad28568f9d1c`.
- Live contract: `0x06F2b53C158C6e9a794607d4dB197654eFB3A9b1` on Studionet chain `61999`.
- Live deployment: `0xf890b6bada92e8d42f2f8580cbdf10e39b1459d86f4f836425f8e0ab179286fc`.
- Production smoke: app shell, `/proof`, compiled active configuration, canonical
  USDC read, Passport V2, and both V2 challenge records verified.
- Full positive ledger: [`STUDIONET_LIVE_PROOF.md`](STUDIONET_LIVE_PROOF.md).
