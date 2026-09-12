# Studio-dev validation

The matching endpoint was used with the coherent RC toolchain:

- endpoint: `https://studio-dev.genlayer.com/api`
- chain ID: `61997`
- network: `studio_devnet`
- leader-only: disabled

The write gate failed consistently. Three independent deployments—Beacon V8
with source headers `9b` and `5j`, plus a tiny official-header smoke contract
(`1jb`)—reached protocol `FINALIZED`/`ACCEPTED` but had
`txExecutionResultName=FINISHED_WITH_ERROR`. The leader receipt payload was
`invalid_contract runner malformed` and the validator round had five committed
and five revealed votes. Representative transaction IDs:

- V8 header `5j`: `0xa0e5eac0a1e2df20b116d62db72a9016286aca332d84f04a745904275e532aa0`
- V8 header `9b`: `0x9916cd706c810a574509898287708f1054651c382bf4d09971ad5c3d91670913`
- tiny official-header smoke: `0xddffa28e07f1f30019c4927beee72ccff39537d7999886e6e2c1f74802c36c7e`

Because execution did not return successfully, no Studio-dev contract,
canonical lifecycle, wrong-address proof, Passport, or challenge proof is
claimed. Exact structured attempts are in
[`STUDIO_DEV_ATTEMPTS.json`](STUDIO_DEV_ATTEMPTS.json). This is recorded as a
current remote runner incompatibility, not converted into a local pass.
