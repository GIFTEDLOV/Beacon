# Beacon V8 stable Studionet toolchain

The release harness is isolated from the historical Consensus v0.6 RC
environment. These pins match the environment that executed the live Beacon
contract.

| Component | Version | Release role |
|---|---|---|
| GenLayer CLI | `0.39.2` | Stable Studionet CLI / built-in `studionet` network |
| genlayer-js | `1.1.8` | Stable frontend and deployment SDK |
| genlayer-py | `0.18.0` | Stable Python SDK line |
| genlayer-test / gltest | `0.29.2` | Stable direct contract harness |
| Studionet | chain `61999` | `https://studio.genlayer.com/api` |
| Contract dependency | stable Studionet header in `contracts/beacon_v8_studionet.py` | Live-proven source |
| Python audit tool | `pip-audit 2.10.1` | Isolated stable harness |

`genlayer-test==0.29.2` publishes metadata declaring `genlayer-py<0.17`,
which conflicts with the required stable `genlayer-py==0.18.0` line. The
reproducible harness installs the two exact pins with `--no-deps` inside an
isolated environment and records that upstream metadata mismatch as a known
packaging issue. It does not silently substitute the v0.6 RC family.

The stable harness explicitly selects the built-in Studionet definition and
passes the official endpoint. It contains no custom network object, localnet
fallback, Studio-dev endpoint, or Bradbury configuration.

## RC environment boundary

The historical RC environment remains represented by `requirements.txt` and
the old source/tests. It is not a release gate for the stable Studionet source.
The stable command is:

```powershell
.\tools\run-studionet-tests.ps1
```

The stable SDK route uses Studionet's network-default/gasless behavior; the
truthful release profile is `deploy/v8/fee-profile.json` and does not
fabricate per-method fee numbers.

The available `genvm-lint` AST lint passes and stable-bundle validation passes.
Its Pyright command is not a usable strict gate for this live-proven stable
header: the stable SDK exports runtime symbols without the type annotations the
linter's strict mode requires, producing static unknown/optional diagnostics
without a runtime contract failure. The RC linter/typecheck cache must not be
used to manufacture a stable result; this limitation is recorded explicitly.
