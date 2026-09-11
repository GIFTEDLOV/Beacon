# V8 fee profile summary

## Toolchain observed

- GenLayer CLI: `0.40.0-rc.3`
- genlayer-js: `2.0.0-rc.1`
- genlayer-py: `0.18.0`
- gltest/genlayer-test: `0.29.2`
- GenVM linter: `0.11.0`
- Toolchain family: intended v0.6-compatible family; exact fee-profile
  generation surface is not available in the installed gltest build.

## Result

`FEE_PROFILE_GENERATED: NOT_GENERATED`

The current `genlayer` CLI can consume a profile with
`--fee-profile <path>`, but the installed `gltest` entry point resolves to
pytest and its current source contains no `--fee-profile` generation command.
No `fee-profile.json` was created because inventing deploy, identity,
semantic, market, evaluate, challenge, or two-challenge reassessment values
would violate the release gate.

The official current SDK fee-policy read also fails on Bradbury. Recorded
preflight: network `Genlayer Bradbury Testnet`, chain ID `4221`, RPC
`https://rpc-bradbury.genlayer.com`, block `0x146248c`, genlayer-js
`2.0.0-rc.1`, CLI `0.40.0-rc.3`, and gltest `0.29.2`. The SDK's
`getCurrentFeePolicy()` call reaches the fee manager but returns an execution
revert for `messageFeeParamsBudgetFloor()`. Studio-dev's same SDK call does
return a fee policy. This is classified as an external Bradbury/runtime
blocker; no low-level fee workaround is used.

The V8 deployment script intentionally requires a profile entry and aborts
before account access or broadcast when it is absent. Once the official
profile generator is available, profile these paths:

- deploy
- identity verification
- semantic checkpoint
- market checkpoint
- evaluate
- challenge creation
- reassessment with two challenges

Then apply the exact estimator-returned `distribution` and `feeValue`; do not
hand-build fee arithmetic.
