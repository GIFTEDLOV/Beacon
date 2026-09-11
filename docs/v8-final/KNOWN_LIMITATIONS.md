# Known limitations

- V8 has not been deployed to Studio-dev or Bradbury in this worktree because
  the installed gltest build lacks the documented fee-profile generation
  command, and the official current Bradbury fee-policy read reverts at
  `messageFeeParamsBudgetFloor()`. No deployment or live Passport claim is
  made.
- Live semantic and market availability remains dependent on the contract's
  bounded external providers. Outage is represented as unavailable/unknown;
  it is not converted into a negative finding.
- Provider snapshots can differ slightly. V8 uses explicit normalized fields
  and bounded tolerance; it does not compare raw response bodies.
- The current public production site was not changed and remains historical
  V6 evidence until an explicitly authorized V8 release.
- The old `deploy/deployScript.ts` remains historical and still names the V5
  source. V8 deployment must use `deploy/v8/deploy.ts`.
