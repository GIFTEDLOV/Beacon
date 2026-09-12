# Beacon V8 Studionet live proof

This is read-only release evidence for the already completed live reviewer
lifecycle. No write is repeated by the local verification command.

| Field | Value |
|---|---|
| Network | GenLayer Studionet |
| RPC | `https://studio.genlayer.com/api` |
| Chain ID | `61999` |
| Contract | `0x06F2b53C158C6e9a794607d4dB197654eFB3A9b1` |
| Source | `contracts/beacon_v8_studionet.py` |
| Source SHA-256 | `698d2cec03a52b66944b6ccade26dfe5886af5ae3cb65a735a30ad28568f9d1c` |
| Source bytes | `44394` |
| Explorer | `https://explorer-studio.genlayer.com/` |

## Positive transaction ledger

| Action | GenLayer transaction ID |
|---|---|
| Deploy | `0xf890b6bada92e8d42f2f8580cbdf10e39b1459d86f4f836425f8e0ab179286fc` |
| Submit canonical USDC | `0x825d807afa0f7a2f348c4eff23118ed3d374bfcf5394f24c365347815f5d7e0d` |
| CoinGecko identity | `0x923cdda0811eb8699a3e5b6adc58ea6111dbbe40b48eeb300d10fa5975e7801f` |
| CoinPaprika identity | `0x3dbdce7a0a246a8f3ca842e601306e0cd91fc4c0bc889f94846898daaf45a900` |
| ISSUER | `0xe9341a2aa2c309ad50aaae4eb819e3bb539f0cb0d1a8c1696881f744ea1e3fd5` |
| REDEMPTION | `0x5023dcd3fb7012f8a68ce8eb782816b49a3454d0881164cab9c83211c4fd3e51` |
| BACKING | `0xe3589fc5292a90e6d0e7374916e46c68fab4022e5cb3bfc0e9e8e280bb033571` |
| SECURITY | `0xd87c436d02652cbdddd16329350eb0ac36acf6f1b5eb27d8dc90ff184145cfab` |
| GOVERNANCE | `0x125141b3a8409a148fe4d377761f19146479a8ae3cc5f9bacc26c76c2fef7493` |
| CoinGecko market | `0x151027c5d495de333cb8d0c92509e9c946b1ae0a75e5294c2b5a871505367b47` |
| CoinPaprika market | `0x74d0475b8465d5b8a86693c0633f574efb7d9a8f54bde724e35e0d9cc962ce76` |
| Evaluate | `0x30c0614fee3f2f04886b676cc62afc49f8dca4aae8f01951306d66b29eb5e103` |
| Challenge A | `0xbf1dc735d80f5a4bbfc3358b76822b6165389d4f0d905da5954b848d0d95afa2` |
| Challenge B | `0x834cdebc4938851f84910a778112edf9fb9a5ae35ac48fd90346701e152d7e96` |
| Reassess | `0x13bfc7724b13739a05c427d069b5c3b610e67263aa62630535a2c9f1e712571b` |

Every listed write finalized with successful execution. The reassessment
created Passport V2 with `challenge_count = 2` and
`challenge_set_digest = 2194f86ae008603696edbd0d01f2d859ec9fa4654d0584fd749153b2cd61ff4d`.
Challenge A and B were each independently recorded as `SUPPORTED` with reason
code `MATERIAL`, status `RESOLVED`, and `resolution_version = 2`.

## Read-only verification

Run:

```powershell
npm run verify:studionet
```

For a temporary stable SDK install without changing the repository package
environment:

```powershell
$env:BEACON_GENLAYER_JS_ROOT = "$env:TEMP\beacon-studionet-stable\node_modules\genlayer-js"
node tools/verify_studionet_release.mjs
```

The verifier reads the canonical asset, exact provider address witnesses, all
five semantic roles, Passport V1/V2, and both challenge records. It asserts the
exact network and contract constants and performs no write.

## Negative identity evidence

The same genuine provider IDs paired with token address
`0x2222222222222222222222222222222222222222` produced `identity_status =
UNVERIFIED`, invalid/unverified provider bindings, no semantic progression, and
Passport version `0`. This is preserved as release evidence rather than being
repeated against the live contract.
