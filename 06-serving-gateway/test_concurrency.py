import asyncio
import time
import httpx

URL = "http://127.0.0.1:8080/v1/chat/completions"

async def send_request(client, request_id):
    start = time.perf_counter()
    try:
        response = await client.post(
            URL,
            json={
                "model": "mock-model",
                "messages": [
                    {"role": "user", "content": "Hello"}
                ]
            }
        )
        elapsed = time.perf_counter() - start
        return request_id, response.status_code, round(elapsed, 3)
    except Exception as exc:
        return request_id, "ERROR", str(exc)

async def main():
    async with httpx.AsyncClient(timeout=10.0) as client:
        results = await asyncio.gather(
            *(send_request(client, i) for i in range(1, 11))
        )

    for request_id, status, elapsed in results:
        print(f"Request {request_id:2d}: HTTP {status}, {elapsed}s")

    print("\nSummary:")
    for status in sorted(set(r[1] for r in results), key=str):
        print(f"HTTP {status}: {sum(r[1] == status for r in results)} requests")

asyncio.run(main())
