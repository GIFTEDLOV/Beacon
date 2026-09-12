# Known limitations

- The release is tied to the live-proven stable Studionet deployment. The
  read-only verifier confirms the current state; it does not repeat writes.
- Live semantic and market availability remains dependent on the contract's
  bounded external providers. Outage is represented as unavailable/unknown,
  not converted into a favorable finding.
- Provider snapshots can differ slightly. V8 compares normalized decision
  fields with bounded tolerances rather than raw response bodies.
- `genlayer-test==0.29.2` declares an upstream dependency range that excludes
  the required stable `genlayer-py==0.18.0`; the isolated harness installs the
  exact pair with `--no-deps` and records the exception in `TOOLCHAIN.md`.
- No mutation-test framework is configured: `MUTATION_TESTS = NOT_CONFIGURED`.
- The public GitHub branch and production hosting were not changed in this
  local release-preparation task. Historical V4/V5/V6/V7 and Bradbury/Studio-
  dev diagnostics remain under their original history paths.
