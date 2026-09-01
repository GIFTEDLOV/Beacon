# Beacon

Beacon is a GenLayer collateral-admission and risk-governance protocol.

- Contract: `contracts/beacon.py`
- Direct tests: `test/test_beacon.py`
- Frontend: `app/`
- Local validation: `python -m pytest -q` and `genvm-lint validate contracts/beacon.py`

The first checkpoint is local-only. It does not deploy, send live transactions, or provision external resources.
