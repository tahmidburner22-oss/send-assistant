# Post-validator idempotency investigation

## Current state

The focused post-validator idempotency test still reports **7 warnings on its second pass** after the self-reflection repair. This is a blocker because the worksheet pipeline must be stable: repeating validation must not make further learner-visible changes or report fresh defects.

## Investigation method

The next step is to capture the exact second-pass warning messages for the existing regression fixture, map each message to its registry entry, and repair the specific non-idempotent validator. The implemented compact self-reflection policy is now idempotent in focused tests, so it is no longer the suspected source.

## Source evidence reviewed

`worksheetPostValidatorRegistry.ts` contains an ordered frozen registry. The runtime pipeline delegates to this registry, so warnings can be traced by name without changing the protected worksheet geometry.

## Status

Open — exact warning list pending capture.
