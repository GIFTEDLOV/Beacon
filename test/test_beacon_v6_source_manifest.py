import hashlib
import json
import re
import sys
from pathlib import Path

from test.test_beacon_v5 import (
    V5_ADDRESS,
    V5_ID,
    challenge,
    challenge_result,
    gecko_body,
    paprika_body,
    semantic_result,
    submission_args,
    submit,
)


FIXTURE_PATH = Path("docs/forensics/beacon-v6-corrected-source-manifest.json")
SOURCE_PATH = Path("contracts/beacon_v6.py")
FIXTURE = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
SEMANTIC_SOURCES = FIXTURE["semantic_sources"]
SEMANTIC_URLS = [item["url"] for item in SEMANTIC_SOURCES]
SOURCE_BODIES = {item["url"]: item["bounded_facts"] for item in SEMANTIC_SOURCES}
CHALLENGE_BODIES = {
    item["url"]: item["bounded_facts"] for item in FIXTURE["challenge_sources"]
}


def test_v6_forensic_manifest_detects_stale_candidate_source():
    source = FIXTURE["source"]
    assert source["path"] == str(SOURCE_PATH).replace("\\", "/")
    assert source["sha256"] == hashlib.sha256(SOURCE_PATH.read_bytes()).hexdigest()
    assert source["bytes"] == SOURCE_PATH.stat().st_size
    assert source["dependency"] == "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6"
    assert source["candidate_version"] == "Beacon V6"
    assert re.fullmatch(r"[0-9a-f]{40}", source["generated_from_head"])


def paprika_coin_body():
    return json.dumps(
        {
            "id": "usdc-usd-coin",
            "symbol": "USDC",
            "name": "USDC",
            "contracts": [
                {
                    "contract": V5_ADDRESS,
                    "platform": "eth-ethereum",
                    "type": "ERC20",
                }
            ],
        }
    )


def manifest_submission_args():
    return submission_args(urls=SEMANTIC_URLS)


def install_manifest_mocks(direct_vm, *, semantic=None, challenge=None):
    direct_vm.mock_web(
        r"api\.coingecko\.com/api/v3/coins/ethereum/contract/",
        {"status": 200, "body": gecko_body()},
    )
    direct_vm.mock_web(
        r"api\.coinpaprika\.com/v1/contracts/eth-ethereum/",
        {"status": 200, "body": paprika_body()},
    )
    direct_vm.mock_web(
        r"api\.coinpaprika\.com/v1/coins/",
        {"status": 200, "body": paprika_coin_body()},
    )
    for url, body in SOURCE_BODIES.items():
        direct_vm.mock_web(re.escape(url), {"status": 200, "body": body})
    for url, body in CHALLENGE_BODIES.items():
        direct_vm.mock_web(re.escape(url), {"status": 200, "body": body})
    if semantic is not None:
        direct_vm.mock_llm(r"Beacon rubric", json.dumps(semantic))
    if challenge is not None:
        direct_vm.mock_llm(r"Beacon challenge judge", json.dumps(challenge))


def test_manifest_has_five_distinct_live_qualified_sources():
    assert FIXTURE["submission_rule"]["duplicate_source_url_allowed"] is False
    assert len(SEMANTIC_SOURCES) == 5
    assert len({url.lower() for url in SEMANTIC_URLS}) == 5
    for source in SEMANTIC_SOURCES:
        assert source["http_status"] == 200
        assert source["final_host"] == "developers.circle.com"
        assert source["within_v6_response_limit"] is True
        assert source["authority_verified"] is True
        assert source["exact_address_present"] is True
        assert source["canonical_chain_present"] is True
        assert source["usdc_identity_present"] is True
        assert source["role_semantics_present"] is True
        assert source["binding_matches"] is True
        assert V5_ADDRESS in source["bounded_facts"].lower()


def test_v6_generic_authoritative_page_without_exact_address_fails_closed(
    direct_vm, direct_deploy
):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract, manifest_submission_args())
    generic = "Circle official USDC documentation describes Ethereum redemption and reserve policy but does not publish the token contract address."
    for url in SEMANTIC_URLS:
        direct_vm.mock_web(re.escape(url), {"status": 200, "body": generic})
    direct_vm.mock_web(
        r"api\.coingecko\.com/api/v3/coins/ethereum/contract/",
        {"status": 200, "body": gecko_body()},
    )
    direct_vm.mock_web(
        r"api\.coinpaprika\.com/v1/contracts/eth-ethereum/",
        {"status": 200, "body": paprika_body()},
    )
    direct_vm.mock_web(
        r"api\.coinpaprika\.com/v1/coins/",
        {"status": 200, "body": paprika_coin_body()},
    )
    direct_vm.mock_llm(r"Beacon rubric", json.dumps(semantic_result()))
    contract.evaluate_asset(V5_ID)
    passport = contract.current_passport(V5_ID)
    assert passport["identity_status"] == "VERIFIED"
    assert passport["semantic_source_status"] == "SOURCE_IDENTITY_UNVERIFIED"
    assert passport["failure_state"] == "SOURCE_IDENTITY_UNVERIFIED"
    assert passport["max_ltv_bps"] == 0


def test_v6_corrected_real_source_manifest_binds_every_role(
    direct_vm, direct_deploy
):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract, manifest_submission_args())
    install_manifest_mocks(direct_vm, semantic=semantic_result())
    contract.evaluate_asset(V5_ID)
    passport = contract.current_passport(V5_ID)
    assert passport["identity_status"] == "VERIFIED"
    assert passport["semantic_source_status"] == "OK"
    assert passport["failure_state"] == "NONE"
    assert passport["issuer_authority_status"] == "VERIFIED"
    assert passport["issuer_asset_binding_status"] == "VERIFIED"
    assert passport["redemption_authority_status"] == "VERIFIED"
    assert passport["redemption_asset_binding_status"] == "VERIFIED"
    assert passport["backing_authority_status"] == "VERIFIED"
    assert passport["backing_asset_binding_status"] == "VERIFIED"
    assert passport["security_authority_status"] == "VERIFIED"
    assert passport["security_asset_binding_status"] == "VERIFIED"
    assert passport["governance_authority_status"] == "VERIFIED"
    assert passport["governance_asset_binding_status"] == "VERIFIED"
    assert passport["canonical_chain"] == "ethereum"
    assert passport["canonical_namespace"] == "eip155:1"
    assert passport["canonical_token_address"] == V5_ADDRESS
    assert passport["canonical_name"] == "USDC"
    assert passport["canonical_symbol"] == "USDC"
    assert passport["coingecko_id"] == "usd-coin"
    assert passport["coinpaprika_id"] == "usdc-usd-coin"
    assert passport["coingecko_binding_status"] == "VERIFIED"
    assert passport["coinpaprika_binding_status"] == "VERIFIED"


def test_v6_corrected_manifest_completes_two_challenge_reassessment(
    direct_vm, direct_deploy, monkeypatch
):
    contract = direct_deploy("contracts/beacon_v6.py")
    submit(direct_vm, contract, manifest_submission_args())
    install_manifest_mocks(
        direct_vm, semantic=semantic_result(), challenge=challenge_result()
    )
    contract.evaluate_asset(V5_ID)
    a_reason = "The official CCTP interfaces expose security-relevant burn and mint controls for the exact Ethereum USDC contract; review the effect on security risk."
    b_reason = "The official ERC-20 documentation describes permissioned admin and role functions for the exact Ethereum USDC contract; review the effect on governance risk."
    a = challenge(
        direct_vm,
        contract,
        1,
        "SECURITY",
        a_reason,
        "https://developers.circle.com/cctp/references/contract-interfaces",
    )
    b = challenge(
        direct_vm,
        contract,
        1,
        "GOVERNANCE",
        b_reason,
        "https://developers.circle.com/contracts/erc-20-token",
    )
    module = sys.modules["_contract_beacon_v6"]
    original = module._challenge_leader
    calls = []

    def spy(*args):
        calls.append(args)
        return original(*args)

    monkeypatch.setattr(module, "_challenge_leader", spy)
    direct_vm.clear_mocks()
    install_manifest_mocks(
        direct_vm, semantic=semantic_result(), challenge=challenge_result()
    )
    contract.reassess_asset(V5_ID)
    assert [(item[2], item[3], item[4]) for item in calls] == [
        ("GOVERNANCE", b_reason, "https://developers.circle.com/contracts/erc-20-token"),
        ("SECURITY", a_reason, "https://developers.circle.com/cctp/references/contract-interfaces"),
    ]
    records = contract.challenge_records(V5_ID)
    assert records[a]["status"] == records[b]["status"] == "RESOLVED"
    assert records[a]["evaluation_status"] == records[b]["evaluation_status"] == "COMPLETE"
    assert records[a]["evaluation_result"] == records[b]["evaluation_result"] == "SUPPORTED"
    assert records[a]["evidence_digest"] != records[b]["evidence_digest"]
    assert records[a]["resolution_version"] == records[b]["resolution_version"] == 2
    passport = contract.current_passport(V5_ID)
    assert passport["version"] == 2
    assert passport["identity_status"] == "VERIFIED"
    assert passport["semantic_source_status"] == "OK"
    assert passport["challenge_count"] == 2
    assert passport["supported_challenge_count"] == 2
    assert passport["challenge_set_digest"]
    assert passport["evidence_digest"]


def test_v6_challenge_source_candidates_are_real_address_bound_pages():
    assert [item["category"] for item in FIXTURE["challenge_sources"]] == [
        "SECURITY",
        "GOVERNANCE",
    ]
    for source in FIXTURE["challenge_sources"]:
        assert source["http_status"] == 200
        assert source["final_host"] == "developers.circle.com"
        assert source["asset_binding"] is True
        assert V5_ADDRESS in source["bounded_facts"].lower()
