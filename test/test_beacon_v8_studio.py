"""Five-validator Studio-dev proof and fee-profile workload for Beacon V8.

Run explicitly with the RC gltest environment, for example:

    BEACON_RUN_STUDIO=1 gltest test/test_beacon_v8_studio.py \
      --network studio_devnet --chain-type studio_devnet \
      --rpc-url https://studio-dev.genlayer.com/api \
      --fee-profile deploy/v8/fee-profile.json \
      --fee-profile-headroom 1.25

The test is skipped during ordinary local runs because it submits real
Studio-dev transactions.  It never enables leader-only execution.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import pytest

from gltest import get_contract_factory
from gltest.types import ProtocolTransactionStatus, TransactionHashVariant
from gltest.utils import extract_contract_address


ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
ASSET_ID = "eip155:1:" + ADDRESS
SUBMISSION_FEE = 1_000_000_000_000_000_000
CHALLENGE_FEE = 250_000_000_000_000_000
SEMANTIC_URLS = [
    "https://developers.circle.com/stablecoins/usdc-contract-addresses.md",
    "https://developers.circle.com/circle-mint/concepts/how-minting-works.md",
    "https://developers.circle.com/stablecoins/what-is-usdc.md",
    "https://developers.circle.com/cctp/references/technical-guide.md",
    "https://developers.circle.com/xreserve/concepts/usdc-backed-stablecoin-specification.md",
]
CHALLENGE_A_REASON = (
    "CoinPaprika official USDC metadata identifies the canonical Ethereum USDC "
    "contract and asset identity."
)
CHALLENGE_A_URL = "https://api.coinpaprika.com/v1/coins/usdc-usd-coin"
CHALLENGE_B_REASON = (
    "DexScreener Ethereum pair metadata exposes liquidity and volume for a pair "
    "whose base token is canonical Ethereum USDC."
)
CHALLENGE_B_URL = (
    "https://api.dexscreener.com/latest/dex/pairs/ethereum/"
    "0x0fb0e40cec3bb23e13abc585958a93c796fbea56955e19a23727a716a0423239"
)


def _safe(value: Any) -> Any:
    """Convert receipts/readbacks to JSON without retaining raw evidence."""
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, bytes):
        return "0x" + value.hex()
    if isinstance(value, dict):
        return {str(key): _safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_safe(item) for item in value]
    enum_value = getattr(value, "value", None)
    return _safe(enum_value) if enum_value is not None else str(value)


def _tx_summary(receipt: dict[str, Any]) -> dict[str, Any]:
    assert receipt.get("lifecycle", {}).get("state") == "finalized", receipt
    execution = str(
        receipt.get("txExecutionResultName")
        or receipt.get("tx_execution_result_name")
        or ""
    ).upper()
    assert execution == "FINISHED_WITH_RETURN", receipt
    return {
        "tx_id": receipt.get("tx_id") or receipt.get("hash"),
        "lifecycle": _safe(receipt.get("lifecycle")),
        "execution": execution,
    }


def _write(
    client: Any,
    contract: Any,
    method: str,
    args: list[Any],
    value: int = 0,
) -> dict[str, Any]:
    estimate = client.estimate_transaction_fees_for_write(
        address=contract.address,
        function_name=method,
        account=contract.account,
        args=args,
        value=value,
    )
    fees = {
        "distribution": estimate["distribution"],
        "feeValue": estimate["feeValue"],
    }
    receipt = getattr(contract, method)(args=args).transact(
        value=value,
        fees=fees,
        wait_until="finalized",
        wait_transaction_status=ProtocolTransactionStatus.FINALIZED,
    )
    _tx_summary(receipt)
    return receipt


def _read(contract: Any, method: str, args: list[Any]) -> Any:
    return getattr(contract, method)(args=args).call(
        transaction_hash_variant=TransactionHashVariant.LATEST_FINAL,
    )


def test_beacon_v8_studio_dev_five_validator_lifecycle(
    gl_client: Any,
    default_account: Any,
) -> None:
    if os.getenv("BEACON_RUN_STUDIO") != "1":
        pytest.skip("set BEACON_RUN_STUDIO=1 to submit the Studio-dev proof")

    factory = get_contract_factory(contract_file_path="beacon_v8.py")
    deploy_estimate = gl_client.estimate_transaction_fees()
    deploy_receipt = factory.deploy_contract_tx(
        args=[],
        account=default_account,
        fees={
            "distribution": deploy_estimate["distribution"],
            "feeValue": deploy_estimate["feeValue"],
        },
        wait_until="finalized",
        wait_transaction_status=ProtocolTransactionStatus.FINALIZED,
    )
    deploy_summary = _tx_summary(deploy_receipt)
    contract_address = extract_contract_address(deploy_receipt)
    contract = factory.build_contract(contract_address, account=default_account)

    submit_args = [
        "USD Coin",
        "USDC",
        "ethereum",
        ADDRESS,
        "USD",
        "usd-coin",
        "usdc-usd-coin",
        *SEMANTIC_URLS,
    ]
    txs: dict[str, Any] = {"deploy": deploy_summary}
    txs["submit_asset"] = _tx_summary(
        _write(gl_client, contract, "submit_asset", submit_args, SUBMISSION_FEE)
    )

    asset = _read(contract, "asset", [ASSET_ID])
    assert asset["asset_id"] == ASSET_ID
    assert asset["canonical_namespace"] == "eip155:1"
    assert asset["token_address"] == ADDRESS

    txs["verify_coingecko_identity"] = _tx_summary(
        _write(gl_client, contract, "verify_coingecko_identity", [ASSET_ID])
    )
    txs["verify_coinpaprika_identity"] = _tx_summary(
        _write(gl_client, contract, "verify_coinpaprika_identity", [ASSET_ID])
    )

    for role in ("ISSUER", "REDEMPTION", "BACKING", "SECURITY", "GOVERNANCE"):
        txs[f"semantic_{role.lower()}"] = _tx_summary(
            _write(gl_client, contract, "verify_semantic_source", [ASSET_ID, role])
        )

    txs["refresh_coingecko_market"] = _tx_summary(
        _write(gl_client, contract, "refresh_coingecko_market", [ASSET_ID])
    )
    txs["refresh_coinpaprika_market"] = _tx_summary(
        _write(gl_client, contract, "refresh_coinpaprika_market", [ASSET_ID])
    )
    txs["evaluate_asset"] = _tx_summary(
        _write(gl_client, contract, "evaluate_asset", [ASSET_ID])
    )

    passport_v1 = _read(contract, "current_passport", [ASSET_ID])
    assert passport_v1["version"] == 1
    assert passport_v1["identity_digest"]
    txs["passport_v1"] = _safe(passport_v1)

    txs["challenge_a"] = _tx_summary(
        _write(
            gl_client,
            contract,
            "challenge_asset",
            [ASSET_ID, 1, "OTHER", CHALLENGE_A_REASON, CHALLENGE_A_URL],
            CHALLENGE_FEE,
        )
    )
    txs["challenge_b"] = _tx_summary(
        _write(
            gl_client,
            contract,
            "challenge_asset",
            [ASSET_ID, 1, "LIQUIDITY", CHALLENGE_B_REASON, CHALLENGE_B_URL],
            CHALLENGE_FEE,
        )
    )

    before = _read(contract, "challenge_records", [ASSET_ID])
    open_records = [
        record
        for record in before.values()
        if record["status"] == "OPEN" and record["target_version"] == 1
    ]
    assert len(open_records) == 2
    assert {record["category"] for record in open_records} == {"OTHER", "LIQUIDITY"}
    assert all(
        record["reason"]
        and record["reason_digest"]
        and record["evidence_digest"]
        and record["bounded_evidence_excerpt"]
        for record in open_records
    )
    txs["open_challenges"] = _safe(before)

    txs["reassess_asset"] = _tx_summary(
        _write(gl_client, contract, "reassess_asset", [ASSET_ID])
    )
    passport_v2 = _read(contract, "current_passport", [ASSET_ID])
    after = _read(contract, "challenge_records", [ASSET_ID])
    assert passport_v2["version"] == 2
    assert passport_v2["challenge_count"] == 2
    assert passport_v2["challenge_set_digest"]
    assert len(after) == 2
    assert all(
        record["status"] == "RESOLVED"
        and record["evaluation_result"]
        and record["evaluation_reason_code"]
        and record["resolution_version"] == 2
        for record in after.values()
    )
    txs["passport_v2"] = _safe(passport_v2)
    txs["resolved_challenges"] = _safe(after)

    evidence_path = Path(
        os.getenv("BEACON_STUDIO_EVIDENCE_PATH", "artifacts/v8-studio-dev-proof.json")
    )
    evidence_path.parent.mkdir(parents=True, exist_ok=True)
    evidence_path.write_text(
        json.dumps(
            {
                "network": "studio_devnet",
                "rpc": "https://studio-dev.genlayer.com/api",
                "chain_id": 61997,
                "leader_only": False,
                "contract_address": contract_address,
                "txs": txs,
                "challenge_web_fetches_during_reassessment": 0,
                "challenge_web_fetch_count_basis": (
                    "The reassessment implementation has no web call; the direct "
                    "V8 test instruments _fetch and asserts zero calls."
                ),
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
