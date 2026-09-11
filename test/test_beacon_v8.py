"""Direct GenVM gates for the lean Beacon V8 contract.

These tests deliberately use the same bounded provider/source shapes as the
contract.  They are not a substitute for Studio-dev validator execution, but
they make the identity, semantic, market, challenge, and rollback invariants
executable locally.
"""

import json
import re

import pytest


ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
WRONG_ADDRESS = "0x2222222222222222222222222222222222222222"
ASSET_ID = "eip155:1:" + ADDRESS
CG_ID = "usd-coin"
CP_ID = "usdc-usd-coin"
SUBMISSION_FEE = 1000000000000000000
CHALLENGE_FEE = 250000000000000000
URLS = [
    "https://developers.circle.com/stablecoins/usdc-contract-addresses.md",
    "https://developers.circle.com/circle-mint/concepts/how-minting-works.md",
    "https://developers.circle.com/stablecoins/what-is-usdc.md",
    "https://developers.circle.com/cctp/references/technical-guide.md",
    "https://developers.circle.com/xreserve/concepts/usdc-backed-stablecoin-specification.md",
]
CHALLENGE_A_URL = "https://api.coinpaprika.com/v1/coins/usdc-usd-coin"
CHALLENGE_B_URL = "https://api.dexscreener.com/latest/dex/pairs/ethereum/0x0fb0e40cec3bb23e13abc585958a93c796fbea56955e19a23727a716a0423239"


def _install_web(direct_vm, url, body, status=200):
    direct_vm._web_mocks.insert(0, (re.compile(re.escape(url)), {"status": status, "body": body}))


def _install_web_response(direct_vm, url, response):
    direct_vm._web_mocks.insert(0, (re.compile(re.escape(url)), response))


def _install_llm(direct_vm, pattern, result):
    direct_vm.mock_llm(pattern, json.dumps(result))


def gecko_identity(address=ADDRESS, market_id=CG_ID, symbol="usdc", name="USD Coin"):
    return json.dumps({
        "id": market_id,
        "symbol": symbol,
        "name": name,
        "asset_platform_id": "ethereum",
        "platforms": {"ethereum": address},
    })


def paprika_identity(address=ADDRESS, market_id=CP_ID, symbol="USDC", name="USDC"):
    return json.dumps({
        "id": market_id,
        "symbol": symbol,
        "name": name,
        "contracts": [{"contract": address, "platform": "eth-ethereum", "type": "ERC20"}],
    })


def gecko_market(address=ADDRESS, market_id=CG_ID, price=1, volume=10000000, cap=100000000, stamp="2026-09-11T12:00:00Z"):
    return json.dumps({
        "id": market_id,
        "symbol": "usdc",
        "name": "USD Coin",
        "platforms": {"ethereum": address},
        "market_data": {
            "current_price": {"usd": price},
            "total_volume": {"usd": volume},
            "market_cap": {"usd": cap},
        },
        "last_updated": stamp,
    })


def paprika_market(address=ADDRESS, market_id=CP_ID, price=1, volume=10000000, cap=100000000, stamp="2026-09-11T12:00:01Z"):
    return json.dumps({
        "id": market_id,
        "symbol": "USDC",
        "name": "USDC",
        "contracts": [{"contract": address, "platform": "eth-ethereum", "type": "ERC20"}],
        "quotes": {"USD": {"price": price, "volume_24h": volume, "market_cap": cap}},
        "last_updated": stamp,
    })


def semantic_body(role, address=ADDRESS, wrapper=""):
    facts = {
        "ISSUER": "Circle official issuer USDC Ethereum eip155:1 exact address " + address,
        "REDEMPTION": "Circle USDC redemption mint and burn redemption process is available",
        "BACKING": "Circle USDC reserve backing treasury collateral attestation",
        "SECURITY": "Circle USDC security CCTP contract technical guide",
        "GOVERNANCE": "Circle USDC governance owner control reserve specification",
    }
    return wrapper + facts[role]


def challenge_a_body(address=ADDRESS):
    return paprika_identity(address)


def challenge_b_body(address=ADDRESS):
    return json.dumps({
        "pair": {
            "chainId": "ethereum",
            "pairAddress": "0x1111111111111111111111111111111111111111",
            "baseToken": {"address": address, "symbol": "USDC"},
            "liquidity": {"usd": 1000000},
            "volume": {"h24": 500000},
        }
    })


def submission_args(address=ADDRESS, cg_id=CG_ID, cp_id=CP_ID):
    return ["USDC", "USDC", "ethereum", address, "USD", cg_id, cp_id, *URLS]


def submit(direct_vm, contract, args=None):
    before = direct_vm.value
    direct_vm.value = SUBMISSION_FEE
    try:
        return contract.submit_asset(*(args or submission_args()))
    finally:
        direct_vm.value = before


def challenge(direct_vm, contract, category, reason, url):
    before = direct_vm.value
    direct_vm.value = CHALLENGE_FEE
    try:
        return contract.challenge_asset(ASSET_ID, 1, category, reason, url)
    finally:
        direct_vm.value = before


def install_identity_mocks(direct_vm, address=ADDRESS, cg_id=CG_ID, cp_id=CP_ID):
    _install_web(direct_vm, "https://api.coingecko.com/api/v3/coins/ethereum/contract/" + address, gecko_identity(address, cg_id))
    _install_web(direct_vm, "https://api.coinpaprika.com/v1/coins/" + cp_id, paprika_identity(address, cp_id))


def identity_ready(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v8.py")
    submit(direct_vm, contract)
    install_identity_mocks(direct_vm)
    contract.verify_coingecko_identity(ASSET_ID)
    contract.verify_coinpaprika_identity(ASSET_ID)
    return contract, ASSET_ID


def install_market_mocks(direct_vm, address=ADDRESS, cg_id=CG_ID, cp_id=CP_ID, **kwargs):
    _install_web(direct_vm, "https://api.coingecko.com/api/v3/coins/" + cg_id + "?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false", gecko_market(address, cg_id, **kwargs))
    _install_web(direct_vm, "https://api.coinpaprika.com/v1/coins/" + cp_id, paprika_market(address, cp_id, **kwargs))


def install_semantic_mocks(direct_vm, address=ADDRESS, outputs=None, bodies=None):
    outputs = outputs or {
        "ISSUER": {"risk": "LOW"},
        "REDEMPTION": {"risk": "LOW", "status": "AVAILABLE"},
        "BACKING": {"risk": "LOW", "algorithmic_backing": False},
        "SECURITY": {"risk": "LOW", "critical_incident": False},
        "GOVERNANCE": {"risk": "LOW"},
    }
    bodies = bodies or {role: semantic_body(role, address) for role in outputs}
    for role in outputs:
        _install_web(direct_vm, URLS[("ISSUER", "REDEMPTION", "BACKING", "SECURITY", "GOVERNANCE").index(role)], bodies[role])
        _install_llm(direct_vm, r"Role: " + role, outputs[role])


def build_evaluated(direct_vm, direct_deploy, *, address=ADDRESS, cg_id=CG_ID, cp_id=CP_ID, semantic_outputs=None):
    contract = direct_deploy("contracts/beacon_v8.py")
    aid = "eip155:1:" + address.lower()
    submit(direct_vm, contract, submission_args(address, cg_id, cp_id))
    install_identity_mocks(direct_vm, address.lower(), cg_id, cp_id)
    contract.verify_coingecko_identity(aid)
    contract.verify_coinpaprika_identity(aid)
    install_semantic_mocks(direct_vm, address.lower(), semantic_outputs)
    for role in ("ISSUER", "REDEMPTION", "BACKING", "SECURITY", "GOVERNANCE"):
        contract.verify_semantic_source(aid, role)
    stamp = __import__("sys").modules["_contract_beacon_v8"]._now() or "2026-09-11T12:00:00Z"
    install_market_mocks(direct_vm, address.lower(), cg_id, cp_id, stamp=stamp)
    contract.refresh_coingecko_market(aid)
    contract.refresh_coinpaprika_market(aid)
    contract.evaluate_asset(aid)
    return contract, aid


def test_exact_identity_is_verified_and_wrong_address_fails_closed(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v8.py")
    submit(direct_vm, contract)
    install_identity_mocks(direct_vm)
    contract.verify_coingecko_identity(ASSET_ID)
    contract.verify_coinpaprika_identity(ASSET_ID)
    state = contract.checkpoint_state(ASSET_ID)
    assert state["asset"]["identity_status"] == "VERIFIED"
    assert state["identity"]["COINGECKO"]["canonical_address"] == ADDRESS
    assert state["identity"]["COINPAPRIKA"]["canonical_address"] == ADDRESS

    wrong_id = "eip155:1:" + WRONG_ADDRESS
    submit(direct_vm, contract, submission_args(WRONG_ADDRESS))
    _install_web(direct_vm, "https://api.coingecko.com/api/v3/coins/ethereum/contract/" + WRONG_ADDRESS, gecko_identity(ADDRESS))
    _install_web(direct_vm, "https://api.coinpaprika.com/v1/coins/" + CP_ID, paprika_identity(ADDRESS))
    contract.verify_coingecko_identity(wrong_id)
    contract.verify_coinpaprika_identity(wrong_id)
    assert contract.asset(wrong_id)["identity_status"] == "UNVERIFIED"
    with direct_vm.expect_revert("identity checkpoints incomplete"):
        contract.verify_semantic_source(wrong_id, "ISSUER")


@pytest.mark.parametrize("kind", ["cg", "cp"])
def test_each_provider_claim_must_bind_exact_id_and_address(direct_vm, direct_deploy, kind):
    contract = direct_deploy("contracts/beacon_v8.py")
    args = submission_args(cg_id="wrong-cg" if kind == "cg" else CG_ID, cp_id="wrong-cp" if kind == "cp" else CP_ID)
    submit(direct_vm, contract, args)
    install_identity_mocks(direct_vm, cg_id=CG_ID, cp_id=CP_ID)
    contract.verify_coingecko_identity(ASSET_ID)
    contract.verify_coinpaprika_identity(ASSET_ID)
    assert contract.asset(ASSET_ID)["identity_status"] == "UNVERIFIED"


def test_semantic_authority_and_issuer_anchor_are_strict(direct_vm, direct_deploy):
    contract, aid = build_evaluated(direct_vm, direct_deploy)
    checkpoints = contract.checkpoint_state(aid)["semantic"]
    assert checkpoints["ISSUER"]["binding_basis"] == "EXACT_ADDRESS"
    assert all(checkpoints[role]["binding_basis"] == "INHERITED_IDENTITY" for role in ("REDEMPTION", "BACKING", "SECURITY", "GOVERNANCE"))


def test_market_checkpoints_reject_stale_and_malformed_data(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/beacon_v8.py")
    submit(direct_vm, contract)
    install_identity_mocks(direct_vm)
    contract.verify_coingecko_identity(ASSET_ID)
    contract.verify_coinpaprika_identity(ASSET_ID)
    install_market_mocks(direct_vm, **{"stamp": "2020-01-01T00:00:00Z"})
    contract.refresh_coingecko_market(ASSET_ID)
    assert contract.checkpoint_state(ASSET_ID)["market"]["COINGECKO"]["source_status"] == "INVALID"


@pytest.mark.parametrize(
    "response",
    [
        {"status": 200, "headers": {"Location": "https://evil.example"}, "body": semantic_body("ISSUER")},
        {"status": 200, "body": "USDC " * 30000},
        {"status": 200, "body": semantic_body("ISSUER", "0x3333333333333333333333333333333333333333")},
    ],
)
def test_semantic_authority_rejects_redirect_oversize_and_unanchored_issuer(direct_vm, direct_deploy, response):
    contract, aid = identity_ready(direct_vm, direct_deploy)
    _install_web_response(direct_vm, URLS[0], response)
    contract.verify_semantic_source(aid, "ISSUER")
    checkpoint = contract.checkpoint_state(aid)["semantic"]["ISSUER"]
    assert checkpoint["authority_status"] == "UNVERIFIED"
    assert checkpoint["asset_binding_status"] == "UNVERIFIED"
    assert checkpoint["source_status"] == "INVALID"


def test_equivalence_witness_ignores_presentation_only_changes(direct_vm, direct_deploy, monkeypatch):
    contract, aid = identity_ready(direct_vm, direct_deploy)
    module = __import__("sys").modules["_contract_beacon_v8"]
    output = {"risk": "LOW", "status": "AVAILABLE"}
    _install_llm(direct_vm, r"Role: REDEMPTION", output)
    body_one = semantic_body("REDEMPTION")
    body_two = "<nav>unrelated links</nav>\n  " + body_one.replace("Circle", "Circle   ") + " <footer>timestamp 1</footer>"
    monkeypatch.setattr(module, "_fetch", lambda url, limit, as_json=False: ("OK", body_one))
    first = module._sem_once("REDEMPTION", URLS[1], module.Beacon._sem_asset(contract, contract.asset(aid)))
    monkeypatch.setattr(module, "_fetch", lambda url, limit, as_json=False: ("OK", body_two))
    second = module._sem_once("REDEMPTION", URLS[1], module.Beacon._sem_asset(contract, contract.asset(aid)))
    assert first["canonical_fact_digest"] == second["canonical_fact_digest"]
    assert first["bounded_evidence_digest"] != second["bounded_evidence_digest"]


def test_market_outage_is_not_a_negative_risk_finding(direct_vm, direct_deploy):
    contract, aid = identity_ready(direct_vm, direct_deploy)
    _install_web_response(direct_vm, "https://api.coinpaprika.com/v1/coins/" + CP_ID, {"status": 503, "body": "temporarily unavailable"})
    contract.refresh_coinpaprika_market(aid)
    market = contract.checkpoint_state(aid)["market"]["COINPAPRIKA"]
    assert market["source_status"] == "UNAVAILABLE"
    assert market["peg_risk"] == "UNKNOWN"
    assert market["liquidity_risk"] == "UNKNOWN"


def test_challenge_evidence_is_restricted_to_authenticated_sources(direct_vm, direct_deploy):
    contract, aid = build_evaluated(direct_vm, direct_deploy)
    bad_url = "https://evil.example/usdc-proof"
    _install_web(direct_vm, bad_url, challenge_a_body())
    with direct_vm.expect_revert("challenge evidence unavailable or unverified"):
        challenge(direct_vm, contract, "OTHER", "identity evidence", bad_url)


def test_evaluate_asset_has_no_live_fetch_after_checkpointing(direct_vm, direct_deploy, monkeypatch):
    contract = direct_deploy("contracts/beacon_v8.py")
    submit(direct_vm, contract)
    install_identity_mocks(direct_vm)
    contract.verify_coingecko_identity(ASSET_ID)
    contract.verify_coinpaprika_identity(ASSET_ID)
    install_semantic_mocks(direct_vm)
    for role in ("ISSUER", "REDEMPTION", "BACKING", "SECURITY", "GOVERNANCE"):
        contract.verify_semantic_source(ASSET_ID, role)
    stamp = __import__("sys").modules["_contract_beacon_v8"]._now() or "2026-09-11T12:00:00Z"
    install_market_mocks(direct_vm, stamp=stamp)
    contract.refresh_coingecko_market(ASSET_ID)
    contract.refresh_coinpaprika_market(ASSET_ID)
    module = __import__("sys").modules["_contract_beacon_v8"]
    monkeypatch.setattr(module, "_fetch", lambda *args: (_ for _ in ()).throw(AssertionError("evaluate fetched web evidence")))
    contract.evaluate_asset(ASSET_ID)
    assert contract.current_passport(ASSET_ID)["version"] == 1


def test_full_two_challenge_reassessment_is_fetch_free_and_atomic(direct_vm, direct_deploy, monkeypatch):
    contract, aid = build_evaluated(direct_vm, direct_deploy)
    assert contract.current_passport(aid)["version"] == 1

    _install_web(direct_vm, CHALLENGE_A_URL, challenge_a_body())
    first = challenge(direct_vm, contract, "OTHER", "CoinPaprika official USDC metadata identifies the canonical Ethereum USDC contract and asset identity.", CHALLENGE_A_URL)
    _install_web(direct_vm, CHALLENGE_B_URL, challenge_b_body())
    second = challenge(direct_vm, contract, "LIQUIDITY", "DexScreener Ethereum pair metadata exposes liquidity and volume for a pair whose base token is canonical Ethereum USDC.", CHALLENGE_B_URL)
    records = contract.challenge_records(aid)
    assert len([x for x in records.values() if x["status"] == "OPEN" and x["target_version"] == 1]) == 2
    assert all(x["reason_digest"] and x["evidence_digest"] and x["bounded_evidence_excerpt"] for x in records.values())

    module = __import__("sys").modules["_contract_beacon_v8"]
    original_fetch = module._fetch
    calls = []

    def no_fetch(*args):
        calls.append(args[0])
        raise AssertionError("reassessment attempted a web fetch")

    monkeypatch.setattr(module, "_fetch", no_fetch)
    direct_vm.mock_llm(r"Beacon V8 challenge adjudication", json.dumps({"evaluation_result": "SUPPORTED", "evaluation_reason_code": "MATERIAL"}))
    contract.reassess_asset(aid)
    assert calls == []
    passport = contract.current_passport(aid)
    assert passport["version"] == 2
    assert passport["challenge_count"] == 2
    assert passport["challenge_set_digest"]
    assert records[first]["resolution_version"] == 0  # view was a snapshot before reassessment
    after = contract.challenge_records(aid)
    assert all(x["status"] == "RESOLVED" and x["evaluation_result"] and x["evaluation_reason_code"] and x["resolution_version"] == 2 for x in after.values())
    assert second in after


def test_reassessment_rolls_back_all_challenge_resolutions_on_second_failure(direct_vm, direct_deploy, monkeypatch):
    contract, aid = build_evaluated(direct_vm, direct_deploy)
    _install_web(direct_vm, CHALLENGE_A_URL, challenge_a_body())
    first = challenge(direct_vm, contract, "OTHER", "identity evidence", CHALLENGE_A_URL)
    _install_web(direct_vm, CHALLENGE_B_URL, challenge_b_body())
    second = challenge(direct_vm, contract, "LIQUIDITY", "liquidity evidence", CHALLENGE_B_URL)
    module = __import__("sys").modules["_contract_beacon_v8"]
    monkeypatch.setattr(module, "_fetch", lambda *args: (_ for _ in ()).throw(AssertionError("web refetch")))
    def fail_second(asset, record):
        if record["category"] == "LIQUIDITY":
            return None
        return {"evaluation_result": "SUPPORTED", "evaluation_reason_code": "MATERIAL"}

    monkeypatch.setattr(module, "_challengeconsensus", fail_second)
    with direct_vm.expect_revert("challenge evaluation failed"):
        contract.reassess_asset(aid)
    assert contract.current_passport(aid)["version"] == 1
    after = contract.challenge_records(aid)
    assert after[first]["status"] == "OPEN" and after[second]["status"] == "OPEN"
    assert all(after[cid]["resolution_version"] == 0 for cid in (first, second))
