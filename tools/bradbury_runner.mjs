// Intentionally disabled historical runner.
//
// Beacon deployment must use deploy/v8/deploy.ts so the exact frozen source,
// official high-level SDK path, fee profile, and persisted GenLayer tx ID are
// enforced. This file is retained only as a migration guard; it cannot submit
// raw outer-chain transactions or select a legacy contract source.
throw new Error(
  "Historical Bradbury runner disabled. Use deploy/v8/deploy.ts after all V8 and Bradbury gates pass.",
);
