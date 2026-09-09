"""Small read-only endpoint health profile for Beacon checkpoint sources."""

from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import time

import requests


URLS = {
    "coingecko_identity": "https://api.coingecko.com/api/v3/coins/ethereum/contract/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false",
    "coingecko_market": "https://api.coingecko.com/api/v3/coins/ethereum/contract/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false",
    "coinpaprika_identity_market": "https://api.coinpaprika.com/v1/coins/usdc-usd-coin",
    "issuer": "https://developers.circle.com/stablecoins/usdc-contract-addresses.md",
    "redemption": "https://developers.circle.com/circle-mint/concepts/how-minting-works.md",
    "backing": "https://developers.circle.com/stablecoins/what-is-usdc.md",
    "security": "https://developers.circle.com/cctp/references/technical-guide.md",
    "governance": "https://developers.circle.com/xreserve/concepts/usdc-backed-stablecoin-specification.md",
    "challenge_other": "https://api.coinpaprika.com/v1/coins/usdc-usd-coin",
    "challenge_liquidity": "https://api.dexscreener.com/latest/dex/pairs/ethereum/0x0fb0e40cec3bb23e13abc585958a93c796fbea56955e19a23727a716a0423239",
}


def probe(item: tuple[str, str, int]) -> dict:
    name, url, attempt = item
    started = time.perf_counter()
    try:
        session = requests.Session()
        session.trust_env = False
        response = session.get(url, timeout=15, allow_redirects=True)
        return {
            "name": name,
            "attempt": attempt,
            "status": response.status_code,
            "bytes": len(response.content),
            "latency_ms": round((time.perf_counter() - started) * 1000, 1),
            "final_url": response.url,
            "final_host": response.url.split("/", 3)[2].lower() if response.url else "",
        }
    except requests.RequestException as exc:
        return {
            "name": name,
            "attempt": attempt,
            "status": None,
            "bytes": 0,
            "latency_ms": round((time.perf_counter() - started) * 1000, 1),
            "error": type(exc).__name__,
        }


def main() -> None:
    jobs = [(name, url, attempt) for name, url in URLS.items() for attempt in (1, 2)]
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(probe, job) for job in jobs]
        results = [future.result() for future in as_completed(futures)]
    results.sort(key=lambda row: (row["name"], row["attempt"]))
    summary = {}
    for name in URLS:
        rows = [row for row in results if row["name"] == name]
        summary[name] = {
            "statuses": [row["status"] for row in rows],
            "timeouts_or_errors": sum("error" in row for row in rows),
            "429s": sum(row["status"] == 429 for row in rows),
            "bytes": [row["bytes"] for row in rows],
            "latency_ms": [row["latency_ms"] for row in rows],
        }
    print(json.dumps({"concurrency": 2, "attempts_per_endpoint": 2, "results": results, "summary": summary}, indent=2))


if __name__ == "__main__":
    main()
