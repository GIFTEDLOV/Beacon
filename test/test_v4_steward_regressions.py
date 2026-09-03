"""Forensic regressions that pin the two steward-identified V4 defects.

These tests intentionally describe V4 behavior and are expected to be replaced
by V5 security regressions during the remediation.
"""

import sys

from test.test_beacon import ASSET_ARGS, asset_id, challenge, evaluate_with, submit


def test_v4_identity_accepts_unrelated_address_with_usdc_claims(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon.py")
    unrelated_address = "0x2222222222222222222222222222222222222222"
    usdc_claims = [
        "USD Coin",
        "USDC",
        "ethereum",
        unrelated_address,
        "USD",
        "usd-coin",
        "usdc-usd-coin",
        "https://www.circle.com/en/usdc",
        "https://www.circle.com/en/usdc/redemption",
        "https://www.circle.com/en/usdc/reserves",
        "https://www.circle.com/en/usdc/security",
        "https://www.circle.com/en/usdc/governance",
    ]

    submitted_id = submit(direct_vm, contract, args=usdc_claims)
    stored = contract.asset(submitted_id)

    assert submitted_id == "ethereum:" + unrelated_address
    assert stored["token_address"] == unrelated_address
    assert stored["market_identifier"] == "usd-coin"
    assert stored["secondary_market_identifier"] == "usdc-usd-coin"
    assert stored["symbol"] == "USDC"
    assert stored["issuer_url"] == "https://www.circle.com/en/usdc"


def test_v4_reassessment_uses_first_evidence_and_resolves_all_open_challenges(
    direct_vm, direct_deploy, monkeypatch
):
    contract = direct_deploy("contracts/beacon.py")
    submit(direct_vm, contract, args=ASSET_ARGS)
    evaluate_with(contract, direct_vm)
    first = challenge(
        direct_vm,
        contract,
        1,
        "reason A",
        category="SECURITY",
        evidence_url="https://challenger.example/security-a",
    )
    second = challenge(
        direct_vm,
        contract,
        1,
        "reason B",
        category="REDEMPTION",
        evidence_url="https://challenger.example/redemption-b",
    )
    third = challenge(
        direct_vm,
        contract,
        1,
        "reason C",
        category="GOVERNANCE",
        evidence_url="https://challenger.example/governance-c",
    )

    module = sys.modules["_contract_beacon"]
    original = module.Beacon._evaluate_passport
    calls = []

    def spy(self, *args):
        calls.append(args)
        return original(self, *args)

    monkeypatch.setattr(module.Beacon, "_evaluate_passport", spy)
    direct_vm.clear_mocks()
    from test.test_beacon import install_mocks

    install_mocks(direct_vm)
    contract.reassess_asset(asset_id())

    assert len(calls) == 1
    assert calls[0][2] == first
    assert calls[0][3] == "https://challenger.example/security-a"
    assert "reason A" not in calls[0]
    assert "SECURITY" not in calls[0]
    assert contract.challenge_records(asset_id())[first]["status"] == "RESOLVED"
    assert contract.challenge_records(asset_id())[second]["status"] == "RESOLVED"
    assert contract.challenge_records(asset_id())[third]["status"] == "RESOLVED"
