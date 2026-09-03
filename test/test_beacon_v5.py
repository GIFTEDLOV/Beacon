import json
import sys

import pytest


V5_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
V5_ID = "eip155:1:" + V5_ADDRESS
SEMANTIC_URLS = [
    "https://developers.circle.com/identity",
    "https://developers.circle.com/redemption",
    "https://developers.circle.com/reserves",
    "https://developers.circle.com/security",
    "https://developers.circle.com/governance",
]
SUBMISSION_FEE_WEI = 1000000000000000000
CHALLENGE_FEE_WEI = 250000000000000000


def gecko_body(address=V5_ADDRESS, market_id="usd-coin", symbol="usdc", name="USDC"):
    return json.dumps(
        {
            "id": market_id,
            "symbol": symbol,
            "name": name,
            "asset_platform_id": "ethereum",
            "contract_address": address,
            "platforms": {"ethereum": address},
            "links": {"homepage": ["https://www.circle.com/en/usdc"]},
            "market_data": {
                "current_price": {"usd": 1},
                "total_volume": {"usd": 10000000},
                "market_cap": {"usd": 100000000},
            },
            "last_updated": "2026-09-03T12:00:00Z",
        }
    )


def paprika_body(market_id="usdc-usd-coin", symbol="USDC", name="USDC"):
    return json.dumps(
        {
            "id": market_id,
            "symbol": symbol,
            "name": name,
            "quotes": {
                "USD": {
                    "price": 1,
                    "volume_24h": 10000000,
                    "market_cap": 100000000,
                }
            },
            "last_updated": "2026-09-03T12:00:01Z",
        }
    )


def semantic_result(**overrides):
    result = {
        "redemption_risk": "LOW",
        "backing_risk": "LOW",
        "admin_governance_risk": "LOW",
        "security_risk": "LOW",
        "dependency_risk": "LOW",
        "redemption_status": "AVAILABLE",
        "critical_security_incident": False,
        "algorithmic_backing": False,
        "severe_instability": False,
        "issuer_provenance": "FIRST_PARTY",
        "redemption_provenance": "INDEPENDENT",
        "backing_provenance": "INDEPENDENT",
        "security_provenance": "INDEPENDENT",
        "governance_provenance": "INDEPENDENT",
        "evidence_sufficient": "YES",
    }
    result.update(overrides)
    return result


def challenge_result(**overrides):
    result = {"evaluation_result": "SUPPORTED", "evaluation_reason_code": "MATERIAL"}
    result.update(overrides)
    return result


def submission_args(
    address=V5_ADDRESS,
    *,
    name_claim="",
    symbol_claim="",
    market_claim="",
    secondary_claim="",
    urls=None,
):
    return [
        name_claim,
        symbol_claim,
        "ethereum",
        address,
        "USD",
        market_claim,
        secondary_claim,
        *(urls or SEMANTIC_URLS),
    ]


def submit(direct_vm, contract, args=None):
    previous_value = direct_vm.value
    direct_vm.value = SUBMISSION_FEE_WEI
    try:
        return contract.submit_asset(*(args or submission_args()))
    finally:
        direct_vm.value = previous_value


def challenge(direct_vm, contract, target_version, category, reason, evidence_url):
    previous_value = direct_vm.value
    direct_vm.value = CHALLENGE_FEE_WEI
    try:
        return contract.challenge_asset(
            V5_ID, target_version, category, reason, evidence_url
        )
    finally:
        direct_vm.value = previous_value


def install_mocks(
    direct_vm,
    *,
    gecko=None,
    paprika=None,
    gecko_status=200,
    paprika_status=200,
    source_body=None,
    semantic=None,
    challenge=None,
    challenge_sources=None,
):
    direct_vm.mock_web(
        r"api\.coingecko\.com/api/v3/coins/ethereum/contract/",
        {"status": gecko_status, "body": gecko or gecko_body()},
    )
    direct_vm.mock_web(
        r"api\.coinpaprika\.com/v1/contracts/eth-ethereum/",
        {"status": paprika_status, "body": paprika or paprika_body()},
    )
    for path, body in (challenge_sources or {}).items():
        direct_vm.mock_web(path, {"status": 200, "body": body})
    direct_vm.mock_web(
        r"^https://",
        {
            "status": 200,
            "body": source_body
            or (
                "Circle official USDC source publishes Ethereum address "
                + V5_ADDRESS
                + " for USDC redemption reserve security governance."
            ),
        },
    )
    if semantic is not None:
        direct_vm.mock_llm(r"Beacon V5 fixed rubric", json.dumps(semantic))
    if challenge is not None:
        direct_vm.mock_llm(r"Beacon V5 challenge adjudication", json.dumps(challenge))


def evaluate(direct_vm, contract, asset_id=V5_ID, **kwargs):
    install_mocks(direct_vm, semantic=semantic_result(), **kwargs)
    contract.evaluate_asset(asset_id)
    return contract.current_passport(asset_id)


def test_v5_address_is_root_and_provider_ids_are_derived(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v5.py")
    assert submit(direct_vm, contract) == V5_ID
    before = contract.asset(V5_ID)
    assert before["market_identifier"] == ""
    assert before["identity_status"] == "UNVERIFIED"

    passport = evaluate(direct_vm, contract)
    stored = contract.asset(V5_ID)
    assert passport["identity_status"] == "VERIFIED"
    assert passport["canonical_chain"] == "eip155:1"
    assert passport["canonical_token_address"] == V5_ADDRESS
    assert passport["primary_market_id"] == "usd-coin"
    assert passport["secondary_market_id"] == "usdc-usd-coin"
    assert stored["market_identifier"] == "usd-coin"
    assert stored["secondary_market_identifier"] == "usdc-usd-coin"
    assert passport["issuer_authority_status"] == "VERIFIED"
    assert passport["issuer_asset_binding_status"] == "VERIFIED"


def test_wrong_address_cannot_borrow_usdc_identity(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v5.py")
    wrong = "0x2222222222222222222222222222222222222222"
    submit(
        direct_vm,
        contract,
        submission_args(
            wrong,
            symbol_claim="USDC",
            market_claim="usd-coin",
            secondary_claim="usdc-usd-coin",
        ),
    )
    passport = evaluate(direct_vm, contract, "eip155:1:" + wrong)
    assert passport["identity_status"] == "UNVERIFIED"
    assert passport["failure_state"] == "ASSET_IDENTITY_UNVERIFIED"
    assert passport["verdict"] == "REJECT"
    assert passport["max_ltv_bps"] == 0
    assert contract.asset("eip155:1:" + wrong)["market_identifier"] == ""


def test_wrong_market_id_claim_and_spoofed_symbol_fail_closed(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v5.py")
    submit(
        direct_vm,
        contract,
        submission_args(
            market_claim="wrong-market",
            secondary_claim="usdc-usd-coin",
        ),
    )
    passport = evaluate(direct_vm, contract)
    assert passport["identity_status"] == "CONFLICT"
    assert passport["failure_state"] == "ASSET_IDENTITY_CONFLICT"



def test_spoofed_symbol_claim_fails_closed(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v5.py")
    submit(direct_vm, contract, submission_args(symbol_claim="FAKE"))
    passport = evaluate(direct_vm, contract)
    assert passport["identity_status"] == "CONFLICT"
    assert passport["failure_state"] == "ASSET_IDENTITY_CONFLICT"


@pytest.mark.parametrize(
    "urls,source_body",
    [
        (
            [
                "https://circle.com.attacker.example/issuer",
                *SEMANTIC_URLS[1:],
            ],
            "USDC " + V5_ADDRESS,
        ),
        (
            [
                "https://developers.circle.com/wrong-asset",
                *SEMANTIC_URLS[1:],
            ],
            "Circle USDC documentation for another token 0x3333333333333333333333333333333333333333",
        ),
    ],
)
def test_semantic_source_requires_authority_and_exact_asset_binding(
    urls, source_body, direct_vm, direct_deploy
):
    contract = direct_deploy("contracts/beacon_v5.py")
    submit(direct_vm, contract, submission_args(urls=urls))
    passport = evaluate(direct_vm, contract, source_body=source_body)
    assert passport["identity_status"] == "VERIFIED"
    assert passport["failure_state"] == "SOURCE_IDENTITY_UNVERIFIED"
    assert passport["verdict"] == "REJECT"
    assert passport["max_ltv_bps"] == 0
    assert passport["issuer_asset_binding_status"] == "UNVERIFIED"


def test_provider_identity_disagreement_is_conflict(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v5.py")
    submit(direct_vm, contract)
    passport = evaluate(direct_vm, contract, paprika=paprika_body(symbol="OTHER"))
    assert passport["identity_status"] == "CONFLICT"
    assert passport["failure_state"] == "ASSET_IDENTITY_CONFLICT"
    assert passport["max_ltv_bps"] == 0


def test_all_current_open_challenges_are_individually_adjudicated(
    direct_vm, direct_deploy, monkeypatch
):
    contract = direct_deploy("contracts/beacon_v5.py")
    submit(direct_vm, contract)
    evaluate(direct_vm, contract)
    challenge_sources = {
        r"challenger\.example/security-a": "Security material for USDC " + V5_ADDRESS,
        r"challenger\.example/redemption-b": "Redemption material for USDC " + V5_ADDRESS,
        r"challenger\.example/governance-c": "Governance material for USDC " + V5_ADDRESS,
    }
    first = challenge(
        direct_vm,
        contract,
        1,
        "SECURITY",
        "reason A",
        "https://challenger.example/security-a",
    )
    second = challenge(
        direct_vm,
        contract,
        1,
        "REDEMPTION",
        "reason B",
        "https://challenger.example/redemption-b",
    )
    third = challenge(
        direct_vm,
        contract,
        1,
        "GOVERNANCE",
        "reason C",
        "https://challenger.example/governance-c",
    )
    module = sys.modules["_contract_beacon_v5"]
    original = module._challenge_leader
    calls = []

    def spy(*args):
        calls.append(args)
        return original(*args)

    monkeypatch.setattr(module, "_challenge_leader", spy)
    direct_vm.clear_mocks()
    install_mocks(
        direct_vm,
        semantic=semantic_result(),
        challenge=challenge_result(),
        challenge_sources=challenge_sources,
    )
    contract.reassess_asset(V5_ID)

    assert [(call[2], call[3], call[4]) for call in calls] == [
        ("SECURITY", "reason A", "https://challenger.example/security-a"),
        ("REDEMPTION", "reason B", "https://challenger.example/redemption-b"),
        ("GOVERNANCE", "reason C", "https://challenger.example/governance-c"),
    ]
    records = contract.challenge_records(V5_ID)
    assert {records[key]["status"] for key in (first, second, third)} == {"RESOLVED"}
    assert {records[key]["evaluation_status"] for key in (first, second, third)} == {"COMPLETE"}
    assert {records[key]["evaluation_result"] for key in (first, second, third)} == {"SUPPORTED"}
    assert {records[key]["resolution_version"] for key in (first, second, third)} == {2}
    assert len({records[key]["evidence_digest"] for key in (first, second, third)}) == 3
    passport = contract.current_passport(V5_ID)
    assert passport["version"] == 2
    assert passport["challenge_count"] == 3
    assert passport["supported_challenge_count"] == 3
    assert passport["max_ltv_bps"] == 0


def test_failed_reassessment_is_atomic_and_stale_challenges_are_not_consumed(
    direct_vm, direct_deploy
):
    contract = direct_deploy("contracts/beacon_v5.py")
    submit(direct_vm, contract)
    evaluate(direct_vm, contract)
    first = challenge(
        direct_vm,
        contract,
        1,
        "SECURITY",
        "reason A",
        "https://challenger.example/security-a",
    )
    second = challenge(
        direct_vm,
        contract,
        1,
        "REDEMPTION",
        "reason B",
        "https://challenger.example/redemption-b",
    )
    direct_vm.clear_mocks()
    install_mocks(direct_vm, gecko_status=503, challenge=challenge_result())
    with direct_vm.expect_revert("reassessment evidence unavailable"):
        contract.reassess_asset(V5_ID)
    records = contract.challenge_records(V5_ID)
    assert records[first]["status"] == "OPEN"
    assert records[second]["status"] == "OPEN"
    assert contract.asset(V5_ID)["current_version"] == 1
    assert contract.current_passport(V5_ID)["version"] == 1


def test_supported_challenge_only_escalates_risk(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v5.py")
    submit(direct_vm, contract)
    evaluate(direct_vm, contract)
    challenge(
        direct_vm,
        contract,
        1,
        "GOVERNANCE",
        "material admin issue",
        "https://challenger.example/governance-c",
    )
    direct_vm.clear_mocks()
    install_mocks(
        direct_vm,
        semantic=semantic_result(),
        challenge=challenge_result(),
        challenge_sources={
            r"challenger\.example/governance-c": "Governance material for USDC " + V5_ADDRESS
        },
    )
    contract.reassess_asset(V5_ID)
    passport = contract.current_passport(V5_ID)
    assert passport["admin_governance_risk"] == "HIGH"
    assert passport["max_ltv_bps"] == 2000


def test_challenge_versions_races_and_history_are_explicit(
    direct_vm, direct_deploy, direct_alice
):
    contract = direct_deploy("contracts/beacon_v5.py")
    submit(direct_vm, contract)
    evaluate(direct_vm, contract)
    first_passport = contract.current_passport(V5_ID)
    first = challenge(
        direct_vm,
        contract,
        1,
        "SECURITY",
        "reason A",
        "https://challenger.example/security-a",
    )
    direct_vm.clear_mocks()
    install_mocks(
        direct_vm,
        semantic=semantic_result(),
        challenge=challenge_result(),
        challenge_sources={
            r"challenger\.example/security-a": "Security material for USDC " + V5_ADDRESS
        },
    )
    contract.reassess_asset(V5_ID)
    assert contract.passport_by_version(V5_ID, 1) == first_passport
    assert contract.challenge_records(V5_ID)[first]["resolution_version"] == 2

    with direct_vm.expect_revert("current version"):
        challenge(
            direct_vm,
            contract,
            1,
            "REDEMPTION",
            "stale reason",
            "https://challenger.example/redemption-stale",
        )

    with direct_vm.prank(direct_alice):
        second = challenge(
            direct_vm,
            contract,
            2,
            "REDEMPTION",
            "reason B",
            "https://challenger.example/redemption-b",
        )
    assert second != first
    assert contract.challenge_records(V5_ID)[second]["status"] == "OPEN"

    direct_vm.clear_mocks()
    install_mocks(
        direct_vm,
        semantic=semantic_result(),
        challenge=challenge_result(evaluation_result="NOT_SUPPORTED", evaluation_reason_code="NOT_MATERIAL"),
        challenge_sources={
            r"challenger\.example/redemption-b": "Redemption material for USDC " + V5_ADDRESS
        },
    )
    contract.reassess_asset(V5_ID)
    records = contract.challenge_records(V5_ID)
    assert records[first]["status"] == "RESOLVED"
    assert records[second]["status"] == "RESOLVED"
    assert records[second]["evaluation_result"] == "NOT_SUPPORTED"

    with direct_vm.expect_revert("not challenged"):
        contract.reassess_asset(V5_ID)


def test_insufficient_challenge_evidence_is_recorded_without_false_substantive_result(
    direct_vm, direct_deploy
):
    contract = direct_deploy("contracts/beacon_v5.py")
    submit(direct_vm, contract)
    evaluate(direct_vm, contract)
    challenge_id = challenge(
        direct_vm,
        contract,
        1,
        "OTHER",
        "reason with missing evidence",
        "https://challenger.example/missing",
    )
    direct_vm.clear_mocks()
    install_mocks(
        direct_vm,
        semantic=semantic_result(),
        challenge_sources={r"challenger\.example/missing": ""},
    )
    direct_vm.mock_web(
        r"challenger\.example/missing", {"status": 404, "body": "not found"}
    )
    contract.reassess_asset(V5_ID)
    record = contract.challenge_records(V5_ID)[challenge_id]
    assert record["status"] == "RESOLVED"
    assert record["evaluation_result"] == "INSUFFICIENT_EVIDENCE"
    assert record["evaluation_reason_code"] == "ASSET_BINDING_UNVERIFIED"
    assert record["evidence_digest"] == ""
