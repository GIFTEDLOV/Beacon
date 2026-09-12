# Reviewer-visible main release plan

Status: prepared locally, not authorized, not pushed.

Current public branch: `main` at
`03edecbb20acead7705c785f7b15391cf4cb57cf`; it still exposes the rejected
legacy implementation. Current local branch: `v8-lean-final` at
`3baafb57c311700c27b00d94941fd19b4e23e57c` plus uncommitted audit changes.

The prepared diff is intentionally uncommitted so unrelated pre-existing
worktree changes are not silently rewritten. It contains the unchanged live
source, stable harness/configuration and pins, stable Studionet frontend
adapter/config, SHA-locked deployment tooling, truthful fee profile, freeze
artifacts, read-only verifier, reviewer evidence, failure classification, and
updated README.

## Intended publication sequence

1. Commit the unchanged live-proven Studionet V8 source, stable harness/tests,
   frontend adapter/status handling,
   deployment guards, freeze manifest, evidence artifacts, and truthful README.
2. Fast-forward `main` to the audited release commit, or merge that release
   commit without rewriting history.
3. Push only after explicit user authorization, then verify the public GitHub
   `main` tree and commit URL.

No commit hash, frozen SHA, live address, or deployment transaction may be
invented in advance. The old `main` history must remain identifiable as the
rejected baseline.

## Publication contents

- `contracts/beacon_v8_studionet.py` and its source SHA;
- `docs/v8-final/*` including the reviewer matrix and live receipts;
- `deploy/v8/deploy.ts`, complete fee profile, and freeze manifest;
- one centralized Studionet V8 frontend adapter with the final contract address; and
- README facts tied to the live proof.

The intended publication operation is a fast-forward of `main` from
`03edecbb20acead7705c785f7b15391cf4cb57cf` to the later release commit created
from this prepared set. No GitHub operation has been performed.
