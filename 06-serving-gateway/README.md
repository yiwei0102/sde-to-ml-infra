## Admission Control Test

Configuration:
- MAX_INFLIGHT=4
- QUEUE_TIMEOUT=0.5 seconds
- Mock upstream latency=1 second
- Concurrent requests=10

Results:
- HTTP 200: 4 requests (~1.02s)
- HTTP 503: 6 requests (~0.518s)

Conclusion:
The gateway successfully limits concurrent upstream requests
and rejects excess requests after the configured queue timeout.