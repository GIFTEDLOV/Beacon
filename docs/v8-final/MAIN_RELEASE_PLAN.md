# Reviewer-visible main release record

Status: completed.

The audited Beacon V8 Studionet release has been published to GitHub `main`.
The original publication commit was
`baf5dac3ee09f9c515942ce7f585fa628b1ee0ac`, a fast-forward from the previous
public main state. Subsequent commits in this release line are documentation-
only synchronization updates and do not change the frozen contract source.

The published release contains the live-proven contract source, stable
harness/configuration and pins, Studionet frontend adapter/configuration,
SHA-locked deployment tooling, freeze artifacts, read-only verifier, reviewer
evidence, failure classification, and current production documentation.

## Completed publication sequence

1. Published the unchanged live-proven Studionet V8 contract source and release
   support files.
2. Fast-forwarded `main` without force-push or history rewriting.
3. Verified the public source SHA against the frozen live source.
4. Published the frontend to Vercel production.
5. Verified the production app and live read-only contract state.

## Release identity

- Contract source: `contracts/beacon_v8_studionet.py`
- Source SHA-256:
  `698d2cec03a52b66944b6ccade26dfe5886af5ae3cb65a735a30ad28568f9d1c`
- Source bytes: `44394`
- Network: GenLayer Studionet, chain `61999`
- Contract: `0x06F2b53C158C6e9a794607d4dB197654eFB3A9b1`
- Deployment tx:
  `0xf890b6bada92e8d42f2f8580cbdf10e39b1459d86f4f836425f8e0ab179286fc`
- Production: `https://beacon-rho-brown.vercel.app`

The old rejected implementation remains identifiable in Git history for audit
provenance, while current `main` exposes the reviewer-fixed V8 release.
