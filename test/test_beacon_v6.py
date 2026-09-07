import json
import re
import sys
from pathlib import Path

from test.test_beacon_v5 import (
    V5_ADDRESS,
    V5_ID,
    CHALLENGE_FEE_WEI,
    SEMANTIC_URLS,
    challenge,
    challenge_result,
    gecko_body,
    semantic_result,
    submission_args,
    submit,
)


def paprika_contract_body(market_id="usdc-usd-coin", symbol="USDC", name="USDC"):
    return json.dumps(
        {"id": market_id, "symbol": symbol, "name": name}
    )


def paprika_coin_body(address=V5_ADDRESS, market_id="usdc-usd-coin"):
    return json.dumps(
        {
            "id": market_id,
            "symbol": "USDC",
            "name": "USDC",
            "contracts": [
                {"contract": address, "platform": "eth-ethereum", "type": "ERC20"}
            ],
        }
    )


def bounded_page(text, length):
    assert len(text) < length <= 1048576
    return text + (" padding" * ((length - len(text)) // 8 + 1))[: length - len(text)]


def install_v6_mocks(
    direct_vm,
    *,
    gecko=None,
    paprika=None,
    paprika_coin=None,
    gecko_status=200,
    paprika_status=200,
    semantic=None,
    challenge=None,
    challenge_sources=None,
    challenge_status=200,
    source_body=None,
    source_status=200,
):
    direct_vm.mock_web(
        r"api\.coingecko\.com/api/v3/coins/ethereum/contract/",
        {"status": gecko_status, "body": gecko or gecko_body()},
    )
    direct_vm.mock_web(
        r"api\.coinpaprika\.com/v1/contracts/eth-ethereum/",
        {"status": paprika_status, "body": paprika or paprika_contract_body()},
    )
    direct_vm.mock_web(
        r"api\.coinpaprika\.com/v1/coins/",
        {"status": 200, "body": paprika_coin or paprika_coin_body()},
    )
    for path, body in (challenge_sources or {}).items():
        direct_vm.mock_web(path, {"status": challenge_status, "body": body})
    direct_vm.mock_web(
        r"^https://",
        {
            "status": source_status,
            "body": source_body
            or (
                "Circle official USDC source publishes Ethereum address "
                + V5_ADDRESS
                + " for USDC redemption reserve security governance."
            ),
        },
    )
    if semantic is not None:
        direct_vm.mock_llm(r"Beacon rubric", json.dumps(semantic))
    if challenge is not None:
        direct_vm.mock_llm(r"Beacon challenge judge", json.dumps(challenge))


def evaluate_v6(direct_vm, contract, **kwargs):
    semantic = kwargs.pop("semantic", semantic_result())
    install_v6_mocks(direct_vm, semantic=semantic, **kwargs)
    contract.evaluate_asset(V5_ID)
    return contract.current_passport(V5_ID)


def test_v6_fixture_is_exact_live_state_and_v5_source_is_untouched():
    fixture = json.loads(
        Path("docs/forensics/beacon-v5-live-fixture.json").read_text(encoding="utf-8")
    )
    assert fixture["contract"] == "0xd52daA517259ca08dF2f4839C0d8962E0A3148c8"
    assert fixture["state"]["asset"]["current_version"] == 1
    assert len(fixture["state"]["challenges"]) == 2
    assert fixture["source_parity"]["parity"] is True


def test_v6_coinpaprika_contract_detail_binds_exact_address(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract)
    wrong = "0x2222222222222222222222222222222222222222"
    evaluate_v6(direct_vm, contract, paprika_coin=paprika_coin_body(wrong))
    passport = contract.current_passport(V5_ID)
    assert passport["identity_status"] == "UNVERIFIED"
    assert passport["failure_state"] == "ASSET_IDENTITY_UNVERIFIED"
    assert passport["max_ltv_bps"] == 0


def test_v6_wrong_address_cannot_borrow_usdc_identity(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v6.py")
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
    install_v6_mocks(direct_vm, semantic=semantic_result())
    contract.evaluate_asset("eip155:1:" + wrong)
    passport = contract.current_passport("eip155:1:" + wrong)
    assert passport["identity_status"] == "UNVERIFIED"
    assert passport["failure_state"] == "ASSET_IDENTITY_UNVERIFIED"
    assert passport["verdict"] == "REJECT"


def test_v6_wrong_market_claim_is_a_conflict(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract, submission_args(market_claim="wrong-market"))
    passport = evaluate_v6(direct_vm, contract)
    assert passport["identity_status"] == "CONFLICT"
    assert passport["failure_state"] == "ASSET_IDENTITY_CONFLICT"


def test_v6_wrong_coingecko_claim_fails_even_when_address_binds(
    direct_vm, direct_deploy
):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract, submission_args(market_claim="usd-coin"))
    passport = evaluate_v6(direct_vm, contract, gecko=gecko_body(market_id="other-asset"))
    assert passport["identity_status"] == "CONFLICT"
    assert passport["coingecko_binding_status"] == "VERIFIED"
    assert passport["failure_state"] == "ASSET_IDENTITY_CONFLICT"


def test_v6_wrong_coinpaprika_claim_fails_even_when_address_binds(
    direct_vm, direct_deploy
):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract, submission_args(secondary_claim="usdc-usd-coin"))
    passport = evaluate_v6(
        direct_vm,
        contract,
        paprika=paprika_contract_body(market_id="other-asset"),
        paprika_coin=paprika_coin_body(market_id="other-asset"),
    )
    assert passport["identity_status"] == "CONFLICT"
    assert passport["coinpaprika_binding_status"] == "VERIFIED"
    assert passport["failure_state"] == "ASSET_IDENTITY_CONFLICT"


def test_v6_provider_name_disagreement_fails_closed(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract)
    passport = evaluate_v6(direct_vm, contract, gecko=gecko_body(name="Not USDC"))
    assert passport["identity_status"] == "CONFLICT"
    assert passport["failure_state"] == "ASSET_IDENTITY_CONFLICT"


def test_v6_unsupported_chain_fails_at_submission(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v6.py")
    args = submission_args()
    args[2] = "polygon"
    previous_value = direct_vm.value
    direct_vm.value = 1000000000000000000
    try:
        with direct_vm.expect_revert("unsupported chain"):
            contract.submit_asset(*args)
    finally:
        direct_vm.value = previous_value


def test_v6_identity_digest_binds_all_decision_fields(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract)
    passport = evaluate_v6(direct_vm, contract)
    module = sys.modules["_contract_beacon_v6"]
    fields = {
        "identity_status": passport["identity_status"],
        "chain": passport["canonical_chain"],
        "namespace": passport["canonical_namespace"],
        "address": passport["canonical_token_address"],
        "name": passport["canonical_name"],
        "symbol": passport["canonical_symbol"],
        "target_currency": passport["target_currency"],
        "coingecko_id": passport["coingecko_id"],
        "coinpaprika_id": passport["coinpaprika_id"],
        "coingecko_binding_status": passport["coingecko_binding_status"],
        "coinpaprika_binding_status": passport["coinpaprika_binding_status"],
        "domains": [passport["official_issuer_domain"]],
    }
    assert module._digest(fields) == passport["identity_digest"]
    changed = dict(fields, address="0x2222222222222222222222222222222222222222")
    assert module._digest(changed) != passport["identity_digest"]


def test_v6_spoofed_symbol_claim_is_a_conflict(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract, submission_args(symbol_claim="FAKE"))
    passport = evaluate_v6(direct_vm, contract)
    assert passport["identity_status"] == "CONFLICT"
    assert passport["failure_state"] == "ASSET_IDENTITY_CONFLICT"


def test_v6_semantic_binding_requires_canonical_chain(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract, submission_args(urls=SEMANTIC_URLS))
    passport = evaluate_v6(
        direct_vm,
        contract,
        source_body="Circle USDC source publishes address " + V5_ADDRESS,
    )
    assert passport["identity_status"] == "VERIFIED"
    assert passport["failure_state"] == "SOURCE_IDENTITY_UNVERIFIED"
    assert passport["max_ltv_bps"] == 0


def test_v6_unrelated_authority_source_fails_closed(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v6.py")
    urls = [
        "https://circle.com.attacker.example/issuer",
        *SEMANTIC_URLS[1:],
    ]
    submit(direct_vm, contract, submission_args(urls=urls))
    passport = evaluate_v6(direct_vm, contract)
    assert passport["identity_status"] == "VERIFIED"
    assert passport["failure_state"] == "SOURCE_IDENTITY_UNVERIFIED"
    assert passport["issuer_authority_status"] == "UNVERIFIED"


def test_v6_lookalike_authority_source_fails_closed(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v6.py")
    urls = [
        "https://circle.com.attacker.example/issuer",
        *SEMANTIC_URLS[1:],
    ]
    submit(direct_vm, contract, submission_args(urls=urls))
    passport = evaluate_v6(direct_vm, contract)
    assert passport["verdict"] == "REJECT"
    assert passport["failure_state"] == "SOURCE_IDENTITY_UNVERIFIED"


def test_v6_userinfo_and_private_sources_are_rejected_at_submission(
    direct_vm, direct_deploy
):
    contract = direct_deploy("contracts/beacon_v6.py")
    for unsafe in ("https://circle.com@attacker.example/issuer", "https://127.0.0.1/issuer"):
        urls = [unsafe, *SEMANTIC_URLS[1:]]
        args = submission_args(urls=urls)
        previous_value = direct_vm.value
        direct_vm.value = 1000000000000000000
        try:
            with direct_vm.expect_revert("invalid or reused semantic source"):
                contract.submit_asset(*args)
        finally:
            direct_vm.value = previous_value


def test_v6_redirected_semantic_source_fails_closed(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract)
    passport = evaluate_v6(direct_vm, contract, source_status=302)
    assert passport["failure_state"] == "SOURCE_IDENTITY_UNVERIFIED"
    assert passport["max_ltv_bps"] == 0


def test_v6_redirected_challenge_source_cannot_become_verified(
    direct_vm, direct_deploy
):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract)
    evaluate_v6(direct_vm, contract)
    challenge(
        direct_vm,
        contract,
        1,
        "SECURITY",
        "redirect test",
        "https://developers.circle.com/cctp/references/contract-interfaces",
    )
    module = sys.modules["_contract_beacon_v6"]
    direct_vm.clear_mocks()
    install_v6_mocks(
        direct_vm,
        semantic=semantic_result(),
        challenge=challenge_result(),
        challenge_status=302,
        challenge_sources={
            r"developers\.circle\.com/cctp/references/contract-interfaces":
            "Ethereum Circle USDC security controls " + V5_ADDRESS,
        },
    )
    identity = module._run_identity(contract.assets_store[V5_ID])
    evidence = module._challenge_evidence(
        "https://developers.circle.com/cctp/references/contract-interfaces",
        identity,
        "SECURITY",
    )
    assert evidence["failure_state"] == "SOURCE_IDENTITY_UNVERIFIED"
    assert evidence["evidence_digest"] == ""


def test_v6_malformed_provider_is_not_transient(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract)
    passport = evaluate_v6(direct_vm, contract, paprika="not-json")
    assert passport["failure_state"] == "ASSET_IDENTITY_UNVERIFIED"


def test_v6_transient_provider_is_distinct(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract)
    passport = evaluate_v6(direct_vm, contract, paprika_status=503)
    assert passport["failure_state"] == "EVIDENCE_UNAVAILABLE"


def test_v6_identical_invalid_semantic_outputs_fail_closed(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract)
    passport = evaluate_v6(direct_vm, contract, semantic={"malformed": True})
    assert passport["failure_state"] == "INVALID_SEMANTIC_OUTPUT"
    assert passport["verdict"] == "REJECT"
    assert passport["max_ltv_bps"] == 0


def test_v6_reassessment_orders_and_resolves_every_challenge(
    direct_vm, direct_deploy, monkeypatch
):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract)
    evaluate_v6(direct_vm, contract)
    sources = {
        r"challenger\.example/security-a": "Ethereum Security material for USDC "
        + V5_ADDRESS,
        r"challenger\.example/governance-b": "Ethereum Governance material for USDC "
        + V5_ADDRESS,
    }
    first = challenge(
        direct_vm,
        contract,
        1,
        "SECURITY",
        "exact security reason A",
        "https://challenger.example/security-a",
    )
    second = challenge(
        direct_vm,
        contract,
        1,
        "GOVERNANCE",
        "exact governance reason B",
        "https://challenger.example/governance-b",
    )
    module = sys.modules["_contract_beacon_v6"]
    original = module._challenge_leader
    calls = []

    def spy(*args):
        calls.append(args)
        return original(*args)

    monkeypatch.setattr(module, "_challenge_leader", spy)
    direct_vm.clear_mocks()
    install_v6_mocks(
        direct_vm,
        semantic=semantic_result(),
        challenge=challenge_result(),
        challenge_sources=sources,
    )
    contract.reassess_asset(V5_ID)
    assert [(call[2], call[3], call[4]) for call in calls] == [
        ("GOVERNANCE", "exact governance reason B", "https://challenger.example/governance-b"),
        ("SECURITY", "exact security reason A", "https://challenger.example/security-a"),
    ]
    records = contract.challenge_records(V5_ID)
    assert records[first]["status"] == "RESOLVED"
    assert records[second]["status"] == "RESOLVED"
    assert records[first]["resolution_version"] == records[second]["resolution_version"] == 2
    assert records[first]["evaluation_result"] == records[second]["evaluation_result"] == "SUPPORTED"
    assert records[first]["evidence_digest"] != records[second]["evidence_digest"]
    passport = contract.current_passport(V5_ID)
    assert passport["version"] == 2
    assert passport["challenge_count"] == 2
    assert passport["supported_challenge_count"] == 2


def test_v6_three_challenges_are_all_assessed_with_reason_and_evidence(
    direct_vm, direct_deploy
):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract)
    evaluate_v6(direct_vm, contract)
    challenges = [
        ("SECURITY", "security reason", "https://challenger.example/security-three", "Ethereum Security USDC " + V5_ADDRESS),
        ("REDEMPTION", "redemption reason", "https://challenger.example/redemption-three", "Ethereum Redemption USDC " + V5_ADDRESS),
        ("GOVERNANCE", "governance reason", "https://challenger.example/governance-three", "Ethereum Governance USDC " + V5_ADDRESS),
    ]
    ids = []
    sources = {}
    for category, reason, url, body in challenges:
        ids.append(challenge(direct_vm, contract, 1, category, reason, url))
        sources[re.escape(url)] = body
    direct_vm.clear_mocks()
    install_v6_mocks(direct_vm, semantic=semantic_result(), challenge=challenge_result(), challenge_sources=sources)
    module = sys.modules["_contract_beacon_v6"]
    before = contract.passport_by_version(V5_ID, 1)
    contract.reassess_asset(V5_ID)
    records = contract.challenge_records(V5_ID)
    assert all(records[item]["status"] == "RESOLVED" for item in ids)
    assert all(records[item]["evaluation_status"] == "COMPLETE" for item in ids)
    assert all(records[item]["resolution_version"] == 2 for item in ids)
    assert all(records[item]["reason_digest"] for item in ids)
    assert all(records[item]["evidence_digest"] for item in ids)
    assert {records[item]["category"] for item in ids} == {"SECURITY", "REDEMPTION", "GOVERNANCE"}
    passport = contract.current_passport(V5_ID)
    assessments = [
        {
            "challenge_id": item,
            "target_version": records[item]["target_version"],
            "category": records[item]["category"],
            "reason": records[item]["reason"],
            "reason_digest": records[item]["reason_digest"],
            "evidence_url": records[item]["evidence_url"],
            "evidence_digest": records[item]["evidence_digest"],
            "evaluation_result": records[item]["evaluation_result"],
            "evaluation_reason_code": records[item]["evaluation_reason_code"],
        }
        for item in ids
    ]
    assert passport["challenge_count"] == 3
    assert passport["challenge_set_digest"] == module._challenge_set_digest(assessments)
    assert contract.passport_by_version(V5_ID, 1) == before


def test_v6_challenge_set_digest_changes_for_reason_or_evidence(direct_deploy):
    direct_deploy("contracts/beacon_v6.py")
    module = next(
        value
        for name, value in sys.modules.items()
        if name.endswith("beacon_v6") and hasattr(value, "_challenge_set_digest")
    )
    base = {
        "challenge_id": "challenge-1",
        "target_version": 1,
        "category": "SECURITY",
        "reason": "reason A",
        "reason_digest": module._digest({"reason": "reason A"}),
        "evidence_url": "https://evidence.example/a",
        "evidence_digest": "evidence-A",
        "evaluation_result": "SUPPORTED",
        "evaluation_reason_code": "MATERIAL",
    }
    assert module._challenge_set_digest([base]) != module._challenge_set_digest([dict(base, reason="reason B")])
    assert module._challenge_set_digest([base]) != module._challenge_set_digest([dict(base, evidence_digest="evidence-B")])


def test_v6_maximum_open_challenges_is_enforced(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract)
    evaluate_v6(direct_vm, contract)
    for index, category in enumerate(("PEG", "LIQUIDITY", "REDEMPTION", "BACKING", "SECURITY", "GOVERNANCE", "DEPENDENCY", "OTHER")):
        challenge(direct_vm, contract, 1, category, "reason " + str(index), "https://challenger.example/" + category.lower())
    with direct_vm.prank(direct_alice):
        previous_value = direct_vm.value
        direct_vm.value = CHALLENGE_FEE_WEI
        try:
            with direct_vm.expect_revert("maximum open challenges reached"):
                contract.challenge_asset(V5_ID, 1, "PEG", "ninth reason", "https://challenger.example/ninth")
        finally:
            direct_vm.value = previous_value


def test_v6_one_failed_challenge_keeps_entire_set_open(
    direct_vm, direct_deploy
):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract)
    evaluate_v6(direct_vm, contract)
    first = challenge(direct_vm, contract, 1, "SECURITY", "good reason", "https://challenger.example/good")
    second = challenge(direct_vm, contract, 1, "GOVERNANCE", "bad reason", "https://challenger.example/bad")
    direct_vm.clear_mocks()
    install_v6_mocks(
        direct_vm,
        semantic=semantic_result(),
        challenge=challenge_result(),
        challenge_sources={
            r"challenger\.example/good": "Ethereum Security USDC " + V5_ADDRESS,
            r"challenger\.example/bad": "",
        },
    )
    with direct_vm.expect_revert("reassessment challenge evaluation failed"):
        contract.reassess_asset(V5_ID)
    records = contract.challenge_records(V5_ID)
    assert records[first]["status"] == records[second]["status"] == "OPEN"
    assert records[first]["resolution_version"] == records[second]["resolution_version"] == 0
    assert contract.current_passport(V5_ID)["version"] == 1


def test_v6_exact_live_two_challenge_fixture_is_reproduced_locally(
    direct_vm, direct_deploy, monkeypatch
):
    fixture = json.loads(
        Path("docs/forensics/beacon-v5-live-fixture.json").read_text(encoding="utf-8")
    )
    records = fixture["state"]["challenges"]
    security = next(item for item in records.values() if item["category"] == "SECURITY")
    governance = next(item for item in records.values() if item["category"] == "GOVERNANCE")
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract)
    evaluate_v6(direct_vm, contract)
    first = challenge(
        direct_vm,
        contract,
        security["target_version"],
        security["category"],
        security["reason"],
        security["evidence_url"],
    )
    second = challenge(
        direct_vm,
        contract,
        governance["target_version"],
        governance["category"],
        governance["reason"],
        governance["evidence_url"],
    )
    module = sys.modules["_contract_beacon_v6"]
    original = module._challenge_leader
    calls = []

    def spy(*args):
        calls.append(args)
        return original(*args)

    monkeypatch.setattr(module, "_challenge_leader", spy)
    direct_vm.clear_mocks()
    install_v6_mocks(
        direct_vm,
        semantic=semantic_result(),
        challenge=challenge_result(),
        challenge_sources={
            r"developers\.circle\.com/cctp/references/contract-interfaces":
            bounded_page(
                "Ethereum Circle USDC security controls " + V5_ADDRESS,
                882083,
            ),
            r"developers\.circle\.com/contracts/erc-20-token":
            bounded_page(
                "Ethereum Circle USDC governance controls " + V5_ADDRESS,
                541529,
            ),
        },
    )
    contract.reassess_asset(V5_ID)
    assert [(item[2], item[3], item[4]) for item in calls] == [
        (governance["category"], governance["reason"], governance["evidence_url"]),
        (security["category"], security["reason"], security["evidence_url"]),
    ]
    updated = contract.challenge_records(V5_ID)
    assert updated[first]["status"] == updated[second]["status"] == "RESOLVED"
    assert updated[first]["resolution_version"] == updated[second]["resolution_version"] == 2
    assert contract.current_passport(V5_ID)["challenge_count"] == 2


def test_v6_identity_failure_aborts_reassessment_before_resolution(
    direct_vm, direct_deploy
):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract)
    evaluate_v6(direct_vm, contract)
    first = challenge(
        direct_vm, contract, 1, "SECURITY", "reason A", "https://challenger.example/a"
    )
    second = challenge(
        direct_vm, contract, 1, "GOVERNANCE", "reason B", "https://challenger.example/b"
    )
    direct_vm.clear_mocks()
    install_v6_mocks(
        direct_vm,
        paprika_coin=paprika_coin_body("0x2222222222222222222222222222222222222222"),
    )
    with direct_vm.expect_revert("reassessment identity unavailable"):
        contract.reassess_asset(V5_ID)
    updated = contract.challenge_records(V5_ID)
    assert updated[first]["status"] == updated[second]["status"] == "OPEN"
    assert contract.current_passport(V5_ID)["version"] == 1


def test_v6_transient_reassessment_failure_is_atomic(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract)
    evaluate_v6(direct_vm, contract)
    first = challenge(
        direct_vm, contract, 1, "SECURITY", "reason A", "https://challenger.example/a"
    )
    second = challenge(
        direct_vm, contract, 1, "GOVERNANCE", "reason B", "https://challenger.example/b"
    )
    direct_vm.clear_mocks()
    install_v6_mocks(direct_vm, gecko_status=503)
    with direct_vm.expect_revert("reassessment evidence unavailable"):
        contract.reassess_asset(V5_ID)
    records = contract.challenge_records(V5_ID)
    assert records[first]["status"] == records[second]["status"] == "OPEN"
    assert records[first]["evaluation_status"] == records[second]["evaluation_status"] == "PENDING"
    assert contract.current_passport(V5_ID)["version"] == 1


def test_v6_challenge_digest_is_independent_of_collection_insertion_order(
    direct_vm, direct_deploy
):
    direct_deploy("contracts/beacon_v6.py")
    module = next(
        value
        for name, value in sys.modules.items()
        if name.endswith("beacon_v6") and hasattr(value, "_challenge_set_digest")
    )
    a = {"challenge_id": "a", "category": "SECURITY", "evaluation_result": "SUPPORTED"}
    b = {"challenge_id": "b", "category": "GOVERNANCE", "evaluation_result": "NOT_SUPPORTED"}
    assert module._challenge_set_digest([a, b]) == module._challenge_set_digest([b, a])


def test_v6_raw_web_body_is_not_challenge_equivalence_criterion():
    source = Path("contracts/beacon_v6.py").read_text(encoding="utf-8")
    validator = source[source.index("def _challenge_validator"):source.index("def _run_challenge")]
    assert "evidence_digest\"==e.get" not in validator
    assert "hashlib.sha256(y.encode(\"utf-8\")).hexdigest()" not in source
